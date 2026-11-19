"""HTTP security headers, including the Content Security Policy.

The same CSP is shipped to GitHub Pages as a ``<meta http-equiv>`` tag in
``index.html``; the static-site tests assert that the two stay in sync.
"""

from __future__ import annotations

from starlette.types import ASGIApp, Message, Receive, Scope, Send

# Third-party origins the browser legitimately talks to. Audio is streamed
# straight from the reciters' CDNs; text/prayer data may come from the public
# upstream APIs when no backend is configured (GitHub Pages fallback mode).
CSP_SOURCES = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "https://www.googletagmanager.com"],
    "style-src": ["'self'"],
    "font-src": ["'self'"],  # fonts are self-hosted
    "img-src": [
        "'self'",
        "data:",
        "https://images.unsplash.com",
        "https://images.pexels.com",
        "https://i.ytimg.com",
        "https://www.googletagmanager.com",
        "https://*.google-analytics.com",
    ],
    "media-src": [
        "'self'",
        "https://*.mp3quran.net",
        "https://cdn.islamic.network",
    ],
    "connect-src": [
        "'self'",
        "https://api.alquran.cloud",
        "https://www.mp3quran.net",
        "https://api.aladhan.com",
        "https://*.google-analytics.com",
        "https://*.analytics.google.com",
        "https://www.googletagmanager.com",
    ],
    "manifest-src": ["'self'"],
    "worker-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
}


def build_csp(extra_connect: list[str] | None = None) -> str:
    sources = {k: list(v) for k, v in CSP_SOURCES.items()}
    for origin in extra_connect or []:
        if origin not in sources["connect-src"]:
            sources["connect-src"].append(origin)
    return "; ".join(f"{k} {' '.join(v)}".strip() for k, v in sources.items())


API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"


class SecurityHeadersMiddleware:
    """Pure ASGI middleware (works with streaming and file responses)."""

    def __init__(self, app: ASGIApp, *, hsts: bool, site_csp: str, docs_prefix: str = "/api/docs"):
        self.app = app
        self.hsts = hsts
        self.site_csp = site_csp
        self.docs_prefix = docs_prefix

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        path: str = scope.get("path", "")

        async def send_wrapper(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = [(k, v) for k, v in message.get("headers", []) if k.lower() != b"server"]
                existing = {k.lower() for k, _ in headers}

                def add(name: str, value: str) -> None:
                    if name.encode() not in existing:
                        headers.append((name.encode(), value.encode()))

                add("x-content-type-options", "nosniff")
                add("referrer-policy", "strict-origin-when-cross-origin")
                add("x-frame-options", "DENY")
                add("cross-origin-opener-policy", "same-origin")
                add("permissions-policy", "camera=(), payment=(), usb=(), microphone=(self), geolocation=(self)")
                if path.startswith(self.docs_prefix) or path == "/api/openapi.json":
                    pass  # Swagger UI needs its own CDN assets; docs are disabled in production by default.
                elif path.startswith("/api/"):
                    add("content-security-policy", API_CSP)
                else:
                    add("content-security-policy", self.site_csp)
                if self.hsts:
                    add("strict-transport-security", "max-age=63072000; includeSubDomains")
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)
