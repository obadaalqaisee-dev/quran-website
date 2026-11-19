"""Audio URL resolution for the 16 curated reciters.

The primary URL is exactly the one the original site used
(``base_url + NNN.mp3``). As a fallback, the reciter's current server is
looked up on mp3quran.net **by its verified numeric ID**, not by fuzzy name
matching as the original did, and cached for a day.
"""

from __future__ import annotations

from app.core.cache import TTLCache
from app.core.errors import APIError
from app.models import Reciter
from app.services.upstream import UpstreamClient

_server_cache = TTLCache(ttl_seconds=24 * 3600, max_items=64)


async def _current_server(client: UpstreamClient, base: str, reciter: Reciter) -> tuple[str, frozenset[int]] | None:
    async def fetch():
        data = await client.get_json(
            f"{base}/reciters", params={"language": "ar", "reciter": reciter.mp3quran_reciter_id}
        )
        for r in data.get("reciters", []):
            for m in r.get("moshaf", []):
                if m.get("id") == reciter.mp3quran_moshaf_id and str(m.get("server", "")).startswith("https://"):
                    surahs = frozenset(int(x) for x in str(m.get("surah_list", "")).split(",") if x.strip().isdigit())
                    server = m["server"] if m["server"].endswith("/") else m["server"] + "/"
                    return (server, surahs)
        return ("", frozenset())

    found = await _server_cache.get_or_set(reciter.slug, fetch)
    return found if found[0] else None


async def resolve_audio(client: UpstreamClient, mp3quran_base: str, reciter: Reciter, surah: int) -> dict:
    padded = f"{surah:03d}"
    primary = f"{reciter.base_url}{padded}.mp3"
    urls = [primary]
    fallback_error = None
    try:
        current = await _current_server(client, mp3quran_base, reciter)
        if current and (not current[1] or surah in current[1]):
            alt = f"{current[0]}{padded}.mp3"
            if alt != primary:
                urls.append(alt)
    except APIError as exc:  # the primary URL is still usable without the lookup
        fallback_error = exc.message
    return {"reciter": reciter.slug, "surah": surah, "urls": urls, "fallback_lookup_error": fallback_error}


def clear_cache() -> None:
    _server_cache.clear()
