"""Learning section and reading tools: tafsir search, juz/page index, scholar resources."""

from __future__ import annotations

import math
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.api.deps import cached_json
from app.core.errors import APIError
from app.db.session import get_db
from app.repositories import quran as repo
from app.schemas import Envelope, LearningResourceOut, PagedEnvelope, QuranIndexOut, TafsirHit
from app.services.arabic import normalize_arabic
from app.services.datasets import EDITION_IDS

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]


@router.get(
    "/tafsir/search",
    response_model=PagedEnvelope[TafsirHit],
    tags=["quran"],
    summary="Search the text of a tafsir or translation edition",
)
def tafsir_search(
    db: DbSession,
    q: Annotated[str, Query(min_length=2, max_length=100, description="Words to find; Arabic diacritics are ignored")],
    edition: Annotated[str, Query(max_length=32, description=f"One of: {', '.join(EDITION_IDS)}")] = "ar.muyassar",
    page: Annotated[int, Query(ge=1, le=1000)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 10,
):
    if edition not in EDITION_IDS:
        raise APIError(422, f"Unknown edition: {edition[:32]}", "validation_error")
    normalized = normalize_arabic(q)
    if len(normalized) < 2:
        raise APIError(422, "The search query must contain at least two letters.", "validation_error")
    total, rows = repo.search_edition(db, edition, normalized, page_size, (page - 1) * page_size)
    hits = [
        TafsirHit(id=a.id, surah=a.surah_number, number_in_surah=a.number_in_surah, edition=t.edition, text=t.text)
        for t, a in rows
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


@router.get(
    "/quran-index",
    response_model=Envelope[QuranIndexOut],
    tags=["quran"],
    summary="First ayah of each juz and Mushaf page, and the sajda ayahs",
)
def quran_index(request: Request, db: DbSession):
    return cached_json(request, {"data": repo.quran_index(db)}, key="quran-index")


@router.get(
    "/learning/resources",
    response_model=Envelope[list[LearningResourceOut]],
    tags=["learning"],
    summary="Scholar resources and hadith-verification tools, with their link status",
)
def learning_resources(
    request: Request,
    db: DbSession,
    topic: Annotated[str | None, Query(pattern=r"^[a-z]{2,32}$", description="Lesson id, e.g. steps or sahw")] = None,
):
    resources = repo.list_learning_resources(db, topic)
    data = [LearningResourceOut.model_validate(r).model_dump(mode="json") for r in resources]
    return cached_json(request, {"data": data}, key=f"resources-{topic or 'all'}", max_age=3600)
