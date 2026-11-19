"""Reciters/audio, prayer times, adhkar and health."""

from __future__ import annotations

from datetime import date as Date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Path, Query, Request
from sqlalchemy import text
from sqlalchemy.orm import Session

from app import __version__
from app.api.deps import cached_json, get_upstream
from app.core.config import get_settings
from app.core.errors import APIError
from app.db.session import get_db
from app.repositories import quran as repo
from app.schemas import AudioOut, DhikrOut, Envelope, HealthOut, PrayerTimesOut, ReciterOut
from app.services import audio as audio_service
from app.services import prayer as prayer_service
from app.services.upstream import UpstreamClient

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]
Upstream = Annotated[UpstreamClient, Depends(get_upstream)]

# Letters (any script), spaces, apostrophes, dots and hyphens; no URL syntax.
PLACE_PATTERN = r"^[\w\s.'\-]{2,64}$"


@router.get("/health", response_model=HealthOut, tags=["system"], summary="Liveness and database check")
def health(db: DbSession):
    try:
        db.execute(text("SELECT 1 FROM surahs LIMIT 1"))
        database = "ok"
    except Exception:  # noqa: BLE001 - report, don't leak
        database = "unavailable"
    return {"status": "ok" if database == "ok" else "degraded", "database": database, "version": __version__}


@router.get("/reciters", response_model=Envelope[list[ReciterOut]], tags=["audio"], summary="The 16 reciters")
def list_reciters(request: Request, db: DbSession):
    data = [ReciterOut.model_validate(r).model_dump() for r in repo.list_reciters(db)]
    return cached_json(request, {"data": data}, key="reciters")


@router.get(
    "/reciters/{slug}/audio/{surah}",
    response_model=Envelope[AudioOut],
    tags=["audio"],
    summary="Playable URLs for a surah, in order of preference",
)
async def reciter_audio(
    db: DbSession,
    upstream: Upstream,
    slug: Annotated[str, Path(pattern=r"^[a-z0-9-]{2,32}$")],
    surah: Annotated[int, Path(ge=1, le=114)],
):
    reciter = repo.get_reciter(db, slug)
    if reciter is None:
        raise APIError(404, "Reciter not found.")
    data = await audio_service.resolve_audio(upstream, get_settings().mp3quran_base_url, reciter, surah)
    return {"data": data}


@router.get(
    "/prayer-times",
    response_model=Envelope[PrayerTimesOut],
    tags=["prayer"],
    summary="Prayer times by coordinates or by city",
)
async def prayer_times(
    upstream: Upstream,
    latitude: Annotated[float | None, Query(ge=-90, le=90)] = None,
    longitude: Annotated[float | None, Query(ge=-180, le=180)] = None,
    city: Annotated[str | None, Query(pattern=PLACE_PATTERN)] = None,
    country: Annotated[str | None, Query(pattern=PLACE_PATTERN)] = None,
    method: Annotated[int, Query(ge=0, le=23, description="Aladhan calculation method (site default 8)")] = 8,
    date: Annotated[
        Date | None, Query(description="Visitor's local date (YYYY-MM-DD); defaults to today (UTC)")
    ] = None,
):
    day = date or Date.today()
    base = get_settings().aladhan_base_url
    if latitude is not None and longitude is not None:
        data = await prayer_service.by_coordinates(upstream, base, latitude, longitude, method, day)
    elif city and country:
        data = await prayer_service.by_city(upstream, base, city.strip(), country.strip(), method, day)
    else:
        raise APIError(422, "Provide latitude and longitude, or city and country.", "validation_error")
    return {"data": data}


@router.get("/adhkar", response_model=Envelope[list[DhikrOut]], tags=["adhkar"], summary="Hisn al-Muslim adhkar")
def adhkar(
    request: Request,
    db: DbSession,
    category: Annotated[Literal["morning", "evening", "sleep", "prayer", "daily"] | None, Query()] = None,
):
    data = [DhikrOut.model_validate(d).model_dump() for d in repo.list_adhkar(db, category)]
    return cached_json(request, {"data": data}, key=f"adhkar-{category or 'all'}")
