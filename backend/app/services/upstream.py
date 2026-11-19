"""HTTP client for third-party services.

SSRF protection: requests may only go to the hosts in ``ALLOWED_HOSTS``, and
URLs are built from configuration plus validated parameters. User input never
supplies a scheme, host or path segment.
"""

from __future__ import annotations

import logging
from urllib.parse import urlsplit

import httpx

from app.core.errors import APIError

log = logging.getLogger("app.upstream")

ALLOWED_HOSTS = frozenset({"api.aladhan.com", "www.mp3quran.net"})
USER_AGENT = "quran-website-backend/1.0 (+https://obadaalqaisee-dev.github.io/quran-website/)"


class UpstreamClient:
    def __init__(self, timeout: float, transport: httpx.AsyncBaseTransport | None = None):
        self._client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout),
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
            follow_redirects=True,
            max_redirects=3,
            transport=transport,
        )

    async def get_json(self, url: str, params: dict | None = None) -> dict:
        host = urlsplit(url).hostname
        if urlsplit(url).scheme != "https" or host not in ALLOWED_HOSTS:
            raise APIError(500, "Upstream host not allowed.", "internal_error")
        try:
            resp = await self._client.get(url, params=params)
        except httpx.TimeoutException as exc:
            log.warning("Upstream timeout: %s", host)
            raise APIError(504, "The upstream service did not respond in time.") from exc
        except httpx.HTTPError as exc:
            log.warning("Upstream connection error: %s (%s)", host, type(exc).__name__)
            raise APIError(502, "The upstream service is unavailable.") from exc
        # Redirects must not leave the allow-list either.
        if resp.url.host not in ALLOWED_HOSTS:
            raise APIError(502, "The upstream service redirected to an unexpected host.")
        if resp.status_code >= 400:
            log.warning("Upstream %s answered %s", host, resp.status_code)
            raise APIError(502, "The upstream service returned an error.")
        try:
            return resp.json()
        except ValueError as exc:
            raise APIError(502, "The upstream service returned invalid data.") from exc

    async def aclose(self) -> None:
        await self._client.aclose()
