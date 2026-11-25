"""Security controls: headers, CORS, rate limiting, SSRF guard, static allow-list, errors."""

from __future__ import annotations

import asyncio

import pytest
from fastapi import APIRouter
from pydantic import ValidationError

from app.core.config import Settings
from app.core.errors import APIError
from app.core.rate_limit import SlidingWindowLimiter
from app.core.security import build_csp
from app.services.arabic import normalize_arabic
from app.services.upstream import UpstreamClient
from tests.conftest import body

PAGES = "https://obadaalqaisee-dev.github.io"


def test_security_headers_on_api(client):
    h = client.get("/api/v1/health").headers
    assert h["x-content-type-options"] == "nosniff"
    assert h["x-frame-options"] == "DENY"
    assert h["referrer-policy"] == "strict-origin-when-cross-origin"
    assert "microphone=(self)" in h["permissions-policy"] and "geolocation=(self)" in h["permissions-policy"]
    assert h["content-security-policy"].startswith("default-src 'none'")
    assert "server" not in h
    assert "strict-transport-security" not in h  # only in production


def test_hsts_in_production(make_client):
    client = make_client(environment="production", serve_static=False)
    assert "max-age=63072000" in client.get("/api/v1/health").headers["strict-transport-security"]


def test_site_csp_has_no_unsafe_inline_script(client):
    csp = client.get("/").headers["content-security-policy"]
    script_src = next(d for d in csp.split(";") if d.strip().startswith("script-src"))
    assert "'unsafe-inline'" not in script_src and "'unsafe-eval'" not in script_src
    assert "frame-ancestors 'none'" in csp and "object-src 'none'" in csp


def test_cors_allows_github_pages_only(client):
    ok = client.get("/api/v1/surahs", headers={"Origin": PAGES})
    assert ok.headers["access-control-allow-origin"] == PAGES
    assert "access-control-allow-credentials" not in ok.headers
    bad = client.get("/api/v1/surahs", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in bad.headers


def test_cors_preflight(client):
    r = client.options("/api/v1/search?q=x", headers={"Origin": PAGES, "Access-Control-Request-Method": "GET"})
    assert r.status_code == 200 and r.headers["access-control-allow-origin"] == PAGES
    r = client.options("/api/v1/search", headers={"Origin": PAGES, "Access-Control-Request-Method": "DELETE"})
    assert r.status_code == 400


def test_cors_origins_from_env_string():
    s = Settings(cors_origins="https://a.example, https://b.example/")
    assert s.cors_origins == ["https://a.example", "https://b.example"]


def test_wildcard_cors_rejected_in_production():
    with pytest.raises(ValidationError):
        Settings(environment="production", cors_origins="*")


def test_rate_limit_returns_429_with_retry_after_and_cors(make_client):
    client = make_client(rate_limit_default=3)
    for _ in range(3):
        assert client.get("/api/v1/health").status_code == 200
    r = client.get("/api/v1/health", headers={"Origin": PAGES})
    assert r.status_code == 429
    assert int(r.headers["retry-after"]) >= 1
    assert body(r)["error"]["code"] == "rate_limited"
    assert r.headers["access-control-allow-origin"] == PAGES  # the browser can read the error


def test_upstream_endpoints_have_tighter_limit(make_client):
    client = make_client(rate_limit_default=100, rate_limit_upstream=2)
    params = {"latitude": 1, "longitude": 1}
    assert client.get("/api/v1/prayer-times", params=params).status_code == 200
    assert client.get("/api/v1/prayer-times", params=params).status_code == 200
    assert client.get("/api/v1/prayer-times", params=params).status_code == 429
    assert client.get("/api/v1/surahs").status_code == 200  # separate budget


def test_sliding_window_expires():
    limiter = SlidingWindowLimiter(window_seconds=10)
    assert limiter.hit("k", 1, now=0)[0]
    assert not limiter.hit("k", 1, now=5)[0]
    assert limiter.hit("k", 1, now=10.5)[0]


def test_limiter_memory_is_bounded_even_when_every_client_is_active():
    # A flood from many distinct addresses inside one window must not grow the table past max_keys.
    limiter = SlidingWindowLimiter(window_seconds=60, max_keys=100)
    for n in range(1_000):
        assert limiter.hit(f"default:10.0.{n // 256}.{n % 256}", 5, now=1.0 + n / 1_000)[0]
    assert len(limiter._hits) <= 100
    # The most recently seen clients are kept, so their limits still apply.
    recent = "default:10.0.3.231"  # n = 999
    for _ in range(4):
        assert limiter.hit(recent, 5, now=2.0)[0]
    assert limiter.hit(recent, 5, now=2.0)[0] is False


@pytest.mark.parametrize(
    "url",
    [
        "https://evil.example/x",
        "http://api.aladhan.com/v1/x",
        "https://169.254.169.254/latest",
        "file:///etc/passwd",
        "https://api.aladhan.com.evil.example/",
    ],
)
def test_upstream_client_refuses_unlisted_hosts(url):
    async def run():
        client = UpstreamClient(timeout=1)
        try:
            with pytest.raises(APIError):
                await client.get_json(url)
        finally:
            await client.aclose()

    asyncio.run(run())


@pytest.mark.parametrize(
    "path",
    [
        "/.git/config",
        "/backend/app/main.py",
        "/backend/quran.sqlite3",
        "/docs/architecture.md",
        "/backend/.env",
        "/assets/../backend/app/main.py",
        "/.gitignore",
        "/README.md",
    ],
)
def test_static_allow_list(client, path):
    assert client.get(path).status_code == 404


def test_static_site_served_in_development(client):
    r = client.get("/")
    assert r.status_code == 200 and "text/html" in r.headers["content-type"]
    assert client.get("/manifest.json").status_code == 200


def test_production_disables_docs_and_static(make_client):
    client = make_client(environment="production", serve_static=None)
    assert client.get("/api/docs").status_code == 404
    assert client.get("/api/openapi.json").status_code == 404
    assert client.get("/").status_code == 404
    assert client.get("/api/v1/health").status_code == 200


def test_docs_available_in_development(client):
    assert client.get("/api/openapi.json").status_code == 200


def test_unhandled_errors_do_not_leak(make_client):
    client = make_client()
    router = APIRouter()

    @router.get("/api/v1/_boom")
    def boom():
        raise RuntimeError("secret internal detail")

    client.app.include_router(router)
    client_no_raise = type(client)(client.app, raise_server_exceptions=False)
    r = client_no_raise.get("/api/v1/_boom")
    assert r.status_code == 500
    assert "secret" not in r.text and body(r)["error"]["code"] == "internal_error"


def test_csp_builder_adds_api_origin_once():
    csp = build_csp(["https://api.example.org", "https://api.example.org"])
    connect = next(d for d in csp.split("; ") if d.startswith("connect-src"))
    assert connect.count("https://api.example.org") == 1


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("قُلْ هُوَ ٱللَّهُ أَحَدٌ", "قل هو الله احد"),
        ("إِنَّا أَعْطَيْنَٰكَ", "انا اعطينك"),
        ("الصَّلَاةِ", "الصلاه"),
        ("﻿بسم", "بسم"),
        ("  مُوسَىٰ  ", "موسي"),
    ],
)
def test_arabic_normalisation(raw, expected):
    assert normalize_arabic(raw) == expected
