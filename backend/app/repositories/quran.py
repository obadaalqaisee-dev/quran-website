"""Database queries. Routes and services never build SQL themselves."""

from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Ayah, AyahText, Dhikr, Edition, Reciter, Surah


def list_surahs(db: Session) -> list[Surah]:
    return list(db.scalars(select(Surah).order_by(Surah.number)))


def get_surah(db: Session, number: int) -> Surah | None:
    return db.get(Surah, number)


def surah_ayahs(db: Session, number: int) -> list[Ayah]:
    return list(db.scalars(select(Ayah).where(Ayah.surah_number == number).order_by(Ayah.number_in_surah)))


def get_ayah(db: Session, ayah_id: int) -> Ayah | None:
    return db.get(Ayah, ayah_id)


def ayah_texts(db: Session, ayah_id: int, editions: list[str]) -> dict[str, str]:
    rows = db.execute(
        select(AyahText.edition, AyahText.text).where(AyahText.ayah_id == ayah_id, AyahText.edition.in_(editions))
    ).all()
    return {r.edition: r.text for r in rows}


def list_editions(db: Session) -> list[Edition]:
    return list(db.scalars(select(Edition).order_by(Edition.identifier)))


def _escape_like(term: str) -> str:
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def search_ayahs(db: Session, normalized_query: str, limit: int, offset: int) -> tuple[int, list[tuple[Ayah, Surah]]]:
    """Substring search on the normalised text (parameterised LIKE, escaped wildcards)."""
    variants = {normalized_query}
    # «لِ» + «ال…» is written «لل…» (the alef is dropped): «للرحمن» contains «الرحمن».
    for i, word in enumerate(normalized_query.split(" ")):
        if word.startswith("ال") and len(word) > 2:
            words = normalized_query.split(" ")
            words[i] = "ل" + word[1:]
            variants.add(" ".join(words))
    condition = or_(*(Ayah.text_search.like(f"%{_escape_like(v)}%", escape="\\") for v in sorted(variants)))
    total = db.scalar(select(func.count()).select_from(Ayah).where(condition)) or 0
    rows = db.execute(
        select(Ayah, Surah)
        .join(Surah, Surah.number == Ayah.surah_number)
        .where(condition)
        .order_by(Ayah.id)
        .limit(limit)
        .offset(offset)
    ).all()
    return total, [(r[0], r[1]) for r in rows]


def list_reciters(db: Session) -> list[Reciter]:
    return list(db.scalars(select(Reciter).order_by(Reciter.position)))


def get_reciter(db: Session, slug: str) -> Reciter | None:
    return db.get(Reciter, slug)


def list_adhkar(db: Session, category: str | None = None) -> list[Dhikr]:
    stmt = select(Dhikr).order_by(Dhikr.category, Dhikr.position)
    if category:
        stmt = stmt.where(Dhikr.category == category)
    return list(db.scalars(stmt))
