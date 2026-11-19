"""Per-client sliding-window rate limiting.

The limiter is in-process, which is correct for a single instance. For several
instances, implement the same ``hit()`` interface on Redis.

The client address is ``scope["client"]``. Behind a reverse proxy, run
uvicorn with ``--proxy-headers --forwarded-allow-ips=<proxy ip>`` so that this
reflects the real visitor and not the proxy.
"""

from __future__ import annotations

import math
import threading
import time
from collections import deque

from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.errors import error_body


class SlidingWindowLimiter:
    def __init__(self, window_seconds: int, max_keys: int = 50_000):
        self.window = window_seconds
        self.max_keys = max_keys
        self._hits: dict[str, deque[float]] = {}
        self._lock = threading.Lock()

    def hit(self, key: str, limit: int, now: float | None = None) -> tuple[bool, int, float]:
        """Record a hit. Returns (allowed, remaining, retry_after_seconds)."""
        now = time.monotonic() if now is None else now
        cutoff = now - self.window
        with self._lock:
            q = self._hits.get(key)
            if q is None:
                if len(self._hits) >= self.max_keys:
                    self._evict(cutoff)
                q = self._hits[key] = deque()
            while q and q[0] <= cutoff:
                q.popleft()
            if len(q) >= limit:
                return False, 0, max(0.0, q[0] + self.window - now)
            q.append(now)
            return True, limit - len(q), 0.0

    def _evict(self, cutoff: float) -> None:
        for k in [k for k, q in self._hits.items() if not q or q[-1] <= cutoff]:
            del self._hits[k]

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


# Endpoints that trigger calls to third-party services get a tighter budget.
UPSTREAM_PREFIXES = ("/api/v1/prayer-times", "/api/v1/reciters/")


class RateLimitMiddleware:
    def __init__(self, app: ASGIApp, *, limiter: SlidingWindowLimiter, default_limit: int, upstream_limit: int):
        self.app = app
        self.limiter = limiter
        self.default_limit = default_limit
        self.upstream_limit = upstream_limit

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        path: str = scope.get("path", "")
        if scope["type"] != "http" or not path.startswith("/api/") or scope.get("method") == "OPTIONS":
            await self.app(scope, receive, send)
            return
        client = (scope.get("client") or ("unknown", 0))[0]
        upstream = path.startswith(UPSTREAM_PREFIXES) and (path.startswith("/api/v1/prayer-times") or "/audio/" in path)
        bucket, limit = ("upstream", self.upstream_limit) if upstream else ("default", self.default_limit)
        allowed, remaining, retry = self.limiter.hit(f"{bucket}:{client}", limit)
        if not allowed:
            response = JSONResponse(
                error_body("rate_limited", "Too many requests. Please slow down."),
                status_code=429,
                headers={"Retry-After": str(max(1, math.ceil(retry))), "X-RateLimit-Limit": str(limit)},
            )
            await response(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                message.setdefault("headers", [])
                message["headers"] += [
                    (b"x-ratelimit-limit", str(limit).encode()),
                    (b"x-ratelimit-remaining", str(remaining).encode()),
                ]
            await send(message)

        await self.app(scope, receive, send_wrapper)
