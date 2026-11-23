"""Database queries. Routes and services never build SQL themselves."""

from __future__ import annotations

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Ayah, AyahText, Dhikr, Edition, LearningResource, Reciter, Surah


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


def search_edition(
    db: Session, edition: str, normalized_query: str, limit: int, offset: int
) -> tuple[int, list[tuple[AyahText, Ayah]]]:
    """Substring search in one tafsir/translation edition (parameterised LIKE, escaped wildcards)."""
    condition = (AyahText.edition == edition) & AyahText.text_search.like(
        f"%{_escape_like(normalized_query)}%", escape="\\"
    )
    total = db.scalar(select(func.count()).select_from(AyahText).where(condition)) or 0
    rows = db.execute(
        select(AyahText, Ayah)
        .join(Ayah, Ayah.id == AyahText.ayah_id)
        .where(condition)
        .order_by(AyahText.ayah_id)
        .limit(limit)
        .offset(offset)
    ).all()
    return total, [(r[0], r[1]) for r in rows]


def quran_index(db: Session) -> dict[str, list[list[int]]]:
    """First ayah of every juz and page, and the sajda ayahs, as [surah, ayah] pairs."""
    juz: dict[int, list[int]] = {}
    pages: dict[int, list[int]] = {}
    sajda: list[list[int]] = []
    columns = (Ayah.surah_number, Ayah.number_in_surah, Ayah.juz, Ayah.page, Ayah.sajda)
    rows = db.execute(select(*columns).order_by(Ayah.id))
    for surah, ayah, j, page, is_sajda in rows:
        juz.setdefault(j, [surah, ayah])
        pages.setdefault(page, [surah, ayah])
        if is_sajda:
            sajda.append([surah, ayah])
    return {"juz": [juz[k] for k in sorted(juz)], "pages": [pages[k] for k in sorted(pages)], "sajda": sajda}


def list_learning_resources(db: Session, topic: str | None = None) -> list[LearningResource]:
    query = select(LearningResource).order_by(LearningResource.position)
    if topic:
        query = query.where((LearningResource.topic == topic) | (LearningResource.topic == "all"))
    return list(db.scalars(query))
