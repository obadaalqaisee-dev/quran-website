"""Load the verified datasets into the database.

* Every file's SHA-256 must match ``app/data/checksums.json``, or nothing is imported.
* The structural invariants of the Quran are re-checked on every import.
* Everything happens in one transaction: either all data is imported or none.
"""

from __future__ import annotations

import gzip
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.config import DATA_DIR
from app.models import Ayah, AyahText, DataImport, Dhikr, Edition, LearningResource, Reciter, Surah
from app.services.arabic import normalize_arabic

TOTAL_SURAHS = 114
TOTAL_AYAHS = 6236
EDITION_IDS = ("ar.muyassar", "en.sahih", "es.cortes", "fr.hamidullah")
ADHKAR_CATEGORIES = ("morning", "evening", "sleep", "prayer", "daily")
RESOURCE_STATUSES = ("existing", "official", "search")
RESOURCE_FIELDS = (
    "id", "position", "scholar", "scholar_name_ar", "scholar_name_en", "kind", "status",
    "url", "title_ar", "title_en", "topic",
)


class DatasetError(RuntimeError):
    pass


@dataclass(frozen=True)
class VerifiedData:
    surahs: list[dict]
    ayahs: list[list]
    editions: dict[str, dict]
    reciters: list[dict]
    adhkar: dict[str, list[dict]]
    checksums: dict[str, str]
    resources: list[dict]


def _read(path: Path) -> bytes:
    return path.read_bytes()


def _json(path: Path, raw: bytes):
    return json.loads(gzip.decompress(raw) if path.suffix == ".gz" else raw)


def load_verified(data_dir: Path = DATA_DIR) -> VerifiedData:
    checksums = json.loads((data_dir / "checksums.json").read_text(encoding="utf-8"))
    loaded: dict[str, object] = {}
    for name, expected in checksums.items():
        path = data_dir / name
        if not path.is_file():
            raise DatasetError(f"missing dataset {name}")
        raw = _read(path)
        actual = hashlib.sha256(raw).hexdigest()
        if actual != expected:
            raise DatasetError(f"checksum mismatch for {name}: expected {expected}, got {actual}")
        loaded[name] = _json(path, raw)

    surahs = loaded["surahs.json"]
    ayahs = loaded["ayahs.json.gz"]["rows"]
    editions = {e: loaded[f"edition-{e}.json.gz"] for e in EDITION_IDS}
    reciters = loaded["reciters.json"]
    adhkar = loaded["adhkar.json"]["adhkar"]
    resources = loaded["learning_resources.json"]["resources"]

    # ---- structural invariants -------------------------------------------
    if len(surahs) != TOTAL_SURAHS or [s["number"] for s in surahs] != list(range(1, 115)):
        raise DatasetError("surah list must be 1..114")
    if len(ayahs) != TOTAL_AYAHS or [a[0] for a in ayahs] != list(range(1, TOTAL_AYAHS + 1)):
        raise DatasetError("ayah ids must be contiguous 1..6236")
    per_surah: dict[int, int] = {}
    for a in ayahs:
        per_surah[a[1]] = per_surah.get(a[1], 0) + 1
        if a[2] != per_surah[a[1]]:
            raise DatasetError(f"ayah order broken at {a[1]}:{a[2]}")
        if not a[3].strip() or not a[4].strip():
            raise DatasetError(f"empty text at {a[1]}:{a[2]}")
    for s in surahs:
        if per_surah.get(s["number"]) != s["ayah_count"]:
            raise DatasetError(f"surah {s['number']} ayah count mismatch")
    for ident, ed in editions.items():
        if len(ed["texts"]) != TOTAL_AYAHS:
            raise DatasetError(f"edition {ident} must have {TOTAL_AYAHS} entries")
    if len(reciters) != 16 or len({r["slug"] for r in reciters}) != 16:
        raise DatasetError("expected 16 unique reciters")
    if set(adhkar) != set(ADHKAR_CATEGORIES):
        raise DatasetError("unexpected adhkar categories")
    ids = [r["id"] for r in resources]
    if len(ids) != len(set(ids)) or any(r["status"] not in RESOURCE_STATUSES for r in resources):
        raise DatasetError("learning resources must have unique ids and a known status")
    if any(not r["url"].startswith("https://") for r in resources):
        raise DatasetError("learning resource URLs must use https")
    return VerifiedData(surahs, ayahs, editions, reciters, adhkar, checksums, resources)


def seed(db: Session, data: VerifiedData | None = None) -> dict[str, int]:
    """Replace all reference data with the verified datasets (idempotent)."""
    data = data or load_verified()
    with db.begin():
        for model in (AyahText, Ayah, Edition, Surah, Reciter, Dhikr, LearningResource):
            db.execute(delete(model))
        db.add_all(Surah(**s) for s in data.surahs)
        db.flush()
        db.add_all(
            Ayah(
                id=a[0],
                surah_number=a[1],
                number_in_surah=a[2],
                text_uthmani=a[3],
                text_simple=a[4],
                text_search=normalize_arabic(a[4]),
                juz=a[5],
                page=a[6],
                hizb_quarter=a[7],
                sajda=bool(a[8]),
            )
            for a in data.ayahs
        )
        db.flush()
        for ident, ed in data.editions.items():
            db.add(
                Edition(
                    identifier=ident,
                    kind=ed["kind"],
                    language=ed["language"],
                    name=ed["name"],
                    english_name=ed["english_name"],
                )
            )
            db.flush()
            db.execute(
                AyahText.__table__.insert(),
                [
                    {"edition": ident, "ayah_id": i, "text": t, "text_search": normalize_arabic(t)}
                    for i, t in enumerate(ed["texts"], start=1)
                ],
            )
        db.add_all(Reciter(**r) for r in data.reciters)
        db.add_all(LearningResource(**{k: r[k] for k in RESOURCE_FIELDS}) for r in data.resources)
        for category in ADHKAR_CATEGORIES:
            db.add_all(
                Dhikr(category=category, position=i, text=d["text"], count=d["count"])
                for i, d in enumerate(data.adhkar[category], start=1)
            )
        for name, sha in data.checksums.items():
            db.add(
                DataImport(dataset=name, source="app/data (verified)", sha256=sha, records=_record_count(name, data))
            )
    return counts(db)


def _record_count(name: str, data: VerifiedData) -> int:
    if name == "surahs.json":
        return len(data.surahs)
    if name == "ayahs.json.gz":
        return len(data.ayahs)
    if name.startswith("edition-"):
        return TOTAL_AYAHS
    if name == "reciters.json":
        return len(data.reciters)
    if name == "adhkar.json":
        return sum(len(v) for v in data.adhkar.values())
    if name == "learning_resources.json":
        return len(data.resources)
    return 0


def counts(db: Session) -> dict[str, int]:
    return {
        "surahs": db.scalar(select(func.count()).select_from(Surah)) or 0,
        "ayahs": db.scalar(select(func.count()).select_from(Ayah)) or 0,
        "ayah_texts": db.scalar(select(func.count()).select_from(AyahText)) or 0,
        "reciters": db.scalar(select(func.count()).select_from(Reciter)) or 0,
        "adhkar": db.scalar(select(func.count()).select_from(Dhikr)) or 0,
    }


def verify_database(db: Session, data: VerifiedData | None = None) -> list[str]:
    """Compare the database with the verified datasets. Returns a list of problems."""
    data = data or load_verified()
    problems: list[str] = []
    c = counts(db)
    expected = {
        "surahs": 114,
        "ayahs": 6236,
        "ayah_texts": 6236 * len(EDITION_IDS),
        "reciters": 16,
        "adhkar": sum(len(v) for v in data.adhkar.values()),
    }
    for k, v in expected.items():
        if c[k] != v:
            problems.append(f"{k}: expected {v}, found {c[k]}")
    rows = db.execute(select(Ayah.id, Ayah.text_uthmani, Ayah.text_simple).order_by(Ayah.id)).all()
    for row, src in zip(rows, data.ayahs, strict=False):
        if row.id != src[0] or row.text_uthmani != src[3] or row.text_simple != src[4]:
            problems.append(f"ayah {src[1]}:{src[2]} differs from the verified source")
            if len(problems) > 20:
                break
    resources = db.scalar(select(func.count()).select_from(LearningResource)) or 0
    if resources != len(data.resources):
        problems.append(f"learning_resources: expected {len(data.resources)}, found {resources}")
    missing_search = db.scalar(select(func.count()).select_from(AyahText).where(AyahText.text_search.is_(None))) or 0
    if missing_search:
        problems.append(f"ayah_texts: {missing_search} rows without search text (run `python -m app.cli seed`)")
    return problems
