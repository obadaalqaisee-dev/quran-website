"""Prayer times via Aladhan, with validation, normalisation and caching.

Privacy: coordinates are rounded to 2 decimal places (about 1 km) before
being forwarded or used as a cache key. That changes prayer times by seconds
at most, and the visitor's precise location never reaches the third party.
"""

from __future__ import annotations

from datetime import date

from app.core.cache import TTLCache
from app.core.errors import APIError
from app.services.upstream import UpstreamClient

PRAYERS = ("Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha")
_cache = TTLCache(ttl_seconds=6 * 3600, max_items=4096)


def _normalize(payload: dict) -> dict:
    try:
        data = payload["data"]
        timings = {k: str(data["timings"][k])[:5] for k in PRAYERS}
        hijri = data["date"]["hijri"]
        return {
            "timings": timings,
            "date": {
                "gregorian": data["date"]["gregorian"]["date"],
                "hijri": {
                    "day": hijri["day"],
                    "year": hijri["year"],
                    "month_ar": hijri["month"]["ar"],
                    "month_en": hijri["month"]["en"],
                },
            },
            "timezone": data.get("meta", {}).get("timezone"),
            "method": data.get("meta", {}).get("method", {}).get("name"),
        }
    except (KeyError, TypeError) as exc:
        raise APIError(502, "The prayer-time service returned unexpected data.") from exc


async def by_coordinates(client: UpstreamClient, base: str, lat: float, lng: float, method: int, day: date) -> dict:
    lat, lng = round(lat, 2), round(lng, 2)
    key = ("coords", lat, lng, method, day.isoformat())

    async def fetch():
        payload = await client.get_json(
            f"{base}/timings/{day.strftime('%d-%m-%Y')}",
            params={"latitude": lat, "longitude": lng, "method": method},
        )
        return _normalize(payload) | {"location": {"latitude": lat, "longitude": lng}}

    return await _cache.get_or_set(key, fetch)


async def by_city(client: UpstreamClient, base: str, city: str, country: str, method: int, day: date) -> dict:
    key = ("city", city.casefold(), country.casefold(), method, day.isoformat())

    async def fetch():
        payload = await client.get_json(
            f"{base}/timingsByCity/{day.strftime('%d-%m-%Y')}",
            params={"city": city, "country": country, "method": method},
        )
        return _normalize(payload) | {"location": {"city": city, "country": country}}

    return await _cache.get_or_set(key, fetch)


def clear_cache() -> None:
    _cache.clear()
