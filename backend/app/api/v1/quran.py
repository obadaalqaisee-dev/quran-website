"""Quran content: surahs, ayahs with tafsir/translations, and search."""

from __future__ import annotations

import math
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import cached_json
from app.core.errors import APIError
from app.db.session import get_db
from app.repositories import quran as repo
from app.schemas import (
    AyahDetailOut,
    EditionOut,
    Envelope,
    PagedEnvelope,
    SearchHit,
    SurahDetailOut,
    SurahOut,
)
from app.services.arabic import normalize_arabic
from app.services.datasets import EDITION_IDS

router = APIRouter(tags=["quran"])

SurahNumber = Annotated[int, Path(ge=1, le=114, description="Surah number (1–114)")]
AyahId = Annotated[int, Path(ge=1, le=6236, description="Global ayah number (1–6236)")]
DbSession = Annotated[Session, Depends(get_db)]


@router.get("/surahs", response_model=Envelope[list[SurahOut]], summary="List all 114 surahs")
def list_surahs(request: Request, db: DbSession):
    data = [SurahOut.model_validate(s).model_dump() for s in repo.list_surahs(db)]
    return cached_json(request, {"data": data}, key="surahs")


@router.get("/surahs/{number}", response_model=Envelope[SurahDetailOut], summary="A surah with its Uthmani ayahs")
def get_surah(number: SurahNumber, request: Request, db: DbSession):
    surah = repo.get_surah(db, number)
    if surah is None:  # pragma: no cover - guarded by the path constraint
        raise APIError(404, "Surah not found.")
    ayahs = [
        {
            "id": a.id,
            "number_in_surah": a.number_in_surah,
            "text": a.text_uthmani,
            "juz": a.juz,
            "page": a.page,
            "sajda": a.sajda,
        }
        for a in repo.surah_ayahs(db, number)
    ]
    data = SurahOut.model_validate(surah).model_dump() | {"ayahs": ayahs}
    return cached_json(request, {"data": data}, key=f"surah-{number}")


@router.get("/editions", response_model=Envelope[list[EditionOut]], summary="Available tafsir and translations")
def list_editions(request: Request, db: DbSession):
    data = [EditionOut.model_validate(e).model_dump() for e in repo.list_editions(db)]
    return cached_json(request, {"data": data}, key="editions")


@router.get(
    "/ayahs/{ayah_id}", response_model=Envelope[AyahDetailOut], summary="One ayah with tafsir and/or translations"
)
def get_ayah(
    ayah_id: AyahId,
    request: Request,
    db: DbSession,
    editions: Annotated[
        str, Query(max_length=120, description=f"Comma-separated, any of: {', '.join(EDITION_IDS)}")
    ] = "",
):
    requested = [e.strip() for e in editions.split(",") if e.strip()]
    unknown = [e for e in requested if e not in EDITION_IDS]
    if unknown:
        raise APIError(422, f"Unknown edition(s): {', '.join(unknown)[:80]}", "validation_error")
    ayah = repo.get_ayah(db, ayah_id)
    if ayah is None:  # pragma: no cover - guarded by the path constraint
        raise APIError(404, "Ayah not found.")
    data = {
        "id": ayah.id,
        "surah": ayah.surah_number,
        "number_in_surah": ayah.number_in_surah,
        "text": ayah.text_uthmani,
        "editions": repo.ayah_texts(db, ayah_id, requested) if requested else {},
    }
    return cached_json(request, {"data": data}, key=f"ayah-{ayah_id}-{','.join(sorted(requested))}")


@router.get("/search", response_model=PagedEnvelope[SearchHit], summary="Search the Quran text")
def search(
    db: DbSession,
    q: Annotated[str, Query(min_length=2, max_length=100, description="Words to find; diacritics are ignored")],
    page: Annotated[int, Query(ge=1, le=1000)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 20,
):
    normalized = normalize_arabic(q)
    if len(normalized) < 2:
        raise APIError(422, "The search query must contain at least two letters.", "validation_error")
    total, rows = repo.search_ayahs(db, normalized, page_size, (page - 1) * page_size)
    hits = [
        SearchHit(
            id=a.id,
            surah=s.number,
            surah_name_ar=s.name_ar,
            surah_name_en=s.name_en,
            number_in_surah=a.number_in_surah,
            text=a.text_uthmani,
            text_simple=a.text_simple,
        )
        for a, s in rows
    ]
    return {
        "data": hits,
        "meta": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "pages": math.ceil(total / page_size) if total else 0,
        },
    }
