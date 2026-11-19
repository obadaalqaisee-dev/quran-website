"""The Quran data must be complete, correctly ordered and unaltered."""

from __future__ import annotations

import json
import shutil

import pytest
from sqlalchemy import update
from sqlalchemy.orm import sessionmaker

from app.db.session import make_engine
from app.models import Ayah, Base
from app.services.datasets import DatasetError, load_verified, seed, verify_database

# Ayah counts per surah from the standard Hafs numbering (independent constant).
AYAH_COUNTS = [
    7,
    286,
    200,
    176,
    120,
    165,
    206,
    75,
    129,
    109,
    123,
    111,
    43,
    52,
    99,
    128,
    111,
    110,
    98,
    135,
    112,
    78,
    118,
    64,
    77,
    227,
    93,
    88,
    69,
    60,
    34,
    30,
    73,
    54,
    45,
    83,
    182,
    88,
    75,
    85,
    54,
    53,
    89,
    59,
    37,
    35,
    38,
    29,
    18,
    45,
    60,
    49,
    62,
    55,
    78,
    96,
    29,
    22,
    24,
    13,
    14,
    11,
    11,
    18,
    12,
    12,
    30,
    52,
    52,
    44,
    28,
    28,
    20,
    56,
    40,
    31,
    50,
    40,
    46,
    42,
    29,
    19,
    36,
    25,
    22,
    17,
    19,
    26,
    30,
    20,
    15,
    21,
    11,
    8,
    8,
    19,
    5,
    8,
    8,
    11,
    11,
    8,
    3,
    9,
    5,
    4,
    7,
    3,
    6,
    3,
    5,
    4,
    5,
    6,
]


def test_counts_match_hafs_numbering(verified):
    assert len(AYAH_COUNTS) == 114 and sum(AYAH_COUNTS) == 6236
    assert [s["ayah_count"] for s in verified.surahs] == AYAH_COUNTS
    per_surah = [0] * 114
    for row in verified.ayahs:
        per_surah[row[1] - 1] += 1
    assert per_surah == AYAH_COUNTS


def test_ids_are_contiguous_and_ordered(verified):
    assert [r[0] for r in verified.ayahs] == list(range(1, 6237))
    previous = (0, 0)
    for _, surah, number, *_ in verified.ayahs:
        assert (surah, number) > previous
        previous = (surah, number)


def test_known_ayahs_are_exact(verified):
    by_pos = {(r[1], r[2]): r for r in verified.ayahs}
    # Exact code points (shadda precedes the short vowel in this source).
    basmala = (
        "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 "
        "\u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 "
        "\u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"
    )
    assert by_pos[(1, 1)][3] == basmala
    assert by_pos[(1, 2)][4] == "الحمد لله رب العالمين"
    assert by_pos[(112, 1)][4].endswith("قل هو الله أحد")
    assert by_pos[(114, 6)][4] == "من الجنة والناس"
    # Surah 9 has no basmala; other surahs carry it on ayah 1 in this source.
    assert not by_pos[(9, 1)][3].startswith("بِسْمِ")
    assert by_pos[(2, 1)][3].startswith(basmala + " ")


def test_no_bom_and_no_empty_text(verified):
    for row in verified.ayahs:
        assert "﻿" not in row[3] and "﻿" not in row[4]
        assert row[3].strip() and row[4].strip()


def test_editions_complete(verified):
    assert set(verified.editions) == {"ar.muyassar", "en.sahih", "es.cortes", "fr.hamidullah"}
    for ed in verified.editions.values():
        assert len(ed["texts"]) == 6236 and all(t.strip() for t in ed["texts"])


def test_reciters_and_adhkar(verified):
    assert len(verified.reciters) == 16
    assert {k: len(v) for k, v in verified.adhkar.items()} == {
        "morning": 8,
        "evening": 8,
        "sleep": 4,
        "prayer": 6,
        "daily": 10,
    }


def test_tampered_dataset_is_rejected(tmp_path):
    from app.core.config import DATA_DIR

    data_dir = tmp_path / "data"
    shutil.copytree(DATA_DIR, data_dir)
    surahs = json.loads((data_dir / "surahs.json").read_text(encoding="utf-8"))
    surahs[0]["name_ar"] = "tampered"
    (data_dir / "surahs.json").write_text(json.dumps(surahs, ensure_ascii=False), encoding="utf-8")
    with pytest.raises(DatasetError, match="checksum mismatch"):
        load_verified(data_dir)


def test_missing_dataset_is_rejected(tmp_path):
    from app.core.config import DATA_DIR

    data_dir = tmp_path / "data"
    shutil.copytree(DATA_DIR, data_dir)
    (data_dir / "reciters.json").unlink()
    with pytest.raises(DatasetError, match="missing dataset"):
        load_verified(data_dir)


def test_seed_is_idempotent_and_verify_detects_changes(tmp_path, verified):
    engine = make_engine(f"sqlite:///{tmp_path / 'x.sqlite3'}")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    with Session() as db:
        first = seed(db, verified)
    with Session() as db:
        assert (
            seed(db, verified)
            == first
            == {"surahs": 114, "ayahs": 6236, "ayah_texts": 24944, "reciters": 16, "adhkar": 36}
        )
        assert verify_database(db, verified) == []
        db.execute(update(Ayah).where(Ayah.id == 7).values(text_uthmani="altered"))
        db.commit()
        problems = verify_database(db, verified)
    assert problems == ["ayah 1:7 differs from the verified source"]
    engine.dispose()
