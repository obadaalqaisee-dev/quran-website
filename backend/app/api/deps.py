"""Shared route helpers: HTTP caching for immutable reference data."""

from __future__ import annotations

import hashlib
import json
from functools import lru_cache

from fastapi import Request, Response

from app.core.config import DATA_DIR
from app.services.upstream import UpstreamClient


@lru_cache
def data_version() -> str:
    """Changes only when a verified dataset changes; used to build ETags."""
    raw = (DATA_DIR / "checksums.json").read_bytes()
    return hashlib.sha256(raw).hexdigest()[:16]


def cached_json(request: Request, payload, *, key: str, max_age: int = 86400) -> Response:
    """JSON response with a strong ETag and Cache-Control; answers 304 when unchanged."""
    etag = f'"{data_version()}-{hashlib.sha256(key.encode()).hexdigest()[:12]}"'
    headers = {"ETag": etag, "Cache-Control": f"public, max-age={max_age}, stale-while-revalidate=604800"}
    if request.headers.get("if-none-match") == etag:
        return Response(status_code=304, headers=headers)
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return Response(content=body, media_type="application/json", headers=headers)


def get_upstream(request: Request) -> UpstreamClient:
    return request.app.state.upstream
