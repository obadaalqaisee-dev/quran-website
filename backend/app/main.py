"""Application factory.

uvicorn app.main:app --reload                     # development
gunicorn app.main:app -k uvicorn.workers.UvicornWorker  # production
"""

from __future__ import annotations

from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app import __version__
from app.api.v1 import learning, quran, services
from app.core.config import Settings, get_settings
from app.core.errors import install_error_handlers
from app.core.logging import configure_logging
from app.core.rate_limit import RateLimitMiddleware, SlidingWindowLimiter
from app.core.security import SecurityHeadersMiddleware, build_csp
from app.services.upstream import UpstreamClient


def create_app(
    settings: Settings | None = None, *, upstream_transport: httpx.AsyncBaseTransport | None = None
) -> FastAPI:
    settings = settings or get_settings()
    configure_logging(settings.log_level)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.upstream = UpstreamClient(settings.upstream_timeout_seconds, transport=upstream_transport)
        try:
            yield
        finally:
            await app.state.upstream.aclose()

    app = FastAPI(
        title="The Noble Quran API",
        version=__version__,
        description="Verified Quran text, tafsir, translations, reciters, adhkar and prayer times "
        "for https://obadaalqaisee-dev.github.io/quran-website/",
        docs_url="/api/docs" if settings.docs_enabled else None,
        redoc_url=None,
        openapi_url="/api/openapi.json" if settings.docs_enabled else None,
        lifespan=lifespan,
    )
    app.state.settings = settings
    install_error_handlers(app)

    app.include_router(quran.router, prefix="/api/v1")
    app.include_router(services.router, prefix="/api/v1")
    app.include_router(learning.router, prefix="/api/v1")

    if settings.static_enabled:
        from app.static_site import mount_static_site

        mount_static_site(app, settings.static_dir)

    # Middleware order: the last one added runs first (outermost):
    # security headers → CORS → rate limit → gzip → app.
    app.add_middleware(GZipMiddleware, minimum_size=1024)
    limiter = SlidingWindowLimiter(settings.rate_limit_window_seconds)
    app.state.limiter = limiter
    app.add_middleware(
        RateLimitMiddleware,
        limiter=limiter,
        default_limit=settings.rate_limit_default,
        upstream_limit=settings.rate_limit_upstream,
    )
    # CORS sits outside the rate limiter so that 429 responses stay readable by the browser.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "OPTIONS"],
        allow_headers=["Accept", "Content-Type", "If-None-Match"],
        expose_headers=["ETag", "Retry-After", "X-RateLimit-Limit", "X-RateLimit-Remaining"],
        allow_credentials=False,
        max_age=86400,
    )
    app.add_middleware(SecurityHeadersMiddleware, hsts=settings.is_production, site_csp=build_csp())
    return app


app = create_app()
