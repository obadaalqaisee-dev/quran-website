"""Build the verified, checksummed datasets in ``app/data/``.

This script is how the reference data was produced. It is reproducible:

    python scripts/build_datasets.py --download            # fetch from the original sources
    python scripts/build_datasets.py --source-dir DIR      # use previously downloaded files

Sources:
* Quran text, surah metadata, tafsir and translations come from
  api.alquran.cloud, the exact source the website has always displayed.
* Reciter metadata comes from mp3quran.net.
* The Uthmani text is cross-checked against an independent Tanzil download
  (``--tanzil FILE``, a ``txt-2`` export). The build aborts if any ayah's
  letter skeleton (rasm) differs, except for the two documented encoding
  variants of «يَـٰصَـٰحِبَىِ» in 12:39 and 12:41.

Only one transformation is applied to the text: a leading U+FEFF
(byte-order mark, an invisible encoding artefact present on ayah 1:1 in the
source) is removed. Nothing else is altered.
"""

from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

BASE = "https://api.alquran.cloud/v1"
EDITIONS = {
    "ar.muyassar": ("tafsir", "ar"),
    "en.sahih": ("translation", "en"),
    "es.cortes": ("translation", "es"),
    "fr.hamidullah": ("translation", "fr"),
}
SOURCES = {
    "uthmani.json": f"{BASE}/quran/quran-uthmani",
    "simple-clean.json": f"{BASE}/quran/quran-simple-clean",
    "surah.json": f"{BASE}/surah",
    **{f"ed-{e}.json": f"{BASE}/quran/{e}" for e in EDITIONS},
}
# Tanzil 1.1 and the alquran.cloud copy encode the dagger alef of this word differently.
KNOWN_RASM_VARIANTS = {(12, 39), (12, 41)}
DATA_DIR = Path(__file__).resolve().parents[1] / "app" / "data"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "quran-website-dataset-builder"})  # noqa: S310
    with urllib.request.urlopen(req, timeout=120) as resp:  # noqa: S310 - fixed https URLs
        return resp.read()


def strip_bom(text: str) -> str:
    return text[1:] if text.startswith("﻿") else text


def rasm(text: str) -> str:
    """Letter skeleton: no diacritics, Quranic marks, tatweel or hamza-carrier differences."""
    text = strip_bom(text)
    text = re.sub("[ً-ٰٟۖ-ۭـء]", "", text)
    text = re.sub("[أإآٱؤئ]", "ا", text).replace("ى", "ي").replace("ی", "ي")
    return re.sub(r"\s+", "", text)


def write_gz_json(path: Path, obj) -> None:
    raw = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    # mtime=0 keeps the output byte-for-byte reproducible.
    with open(path, "wb") as fh, gzip.GzipFile(fileobj=fh, mode="wb", mtime=0, filename="") as gz:
        gz.write(raw)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_tanzil(path: Path) -> dict[tuple[int, int], str]:
    out: dict[tuple[int, int], str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        parts = line.split("|", 2)
        if len(parts) == 3 and parts[0].isdigit():
            out[(int(parts[0]), int(parts[1]))] = parts[2]
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--download", action="store_true")
    src.add_argument("--source-dir", type=Path)
    ap.add_argument("--tanzil", type=Path, help="Tanzil uthmani txt-2 file for cross-verification")
    ap.add_argument("--reciters", type=Path, help="mp3quran reciters JSON (defaults to download)")
    args = ap.parse_args()

    def load(name: str):
        if args.download:
            return json.loads(fetch(SOURCES[name]))
        return json.loads((args.source_dir / name).read_text(encoding="utf-8"))

    uthmani = load("uthmani.json")["data"]["surahs"]
    simple = load("simple-clean.json")["data"]["surahs"]
    surah_meta = load("surah.json")["data"]

    # ---- integrity checks -------------------------------------------------
    assert len(surah_meta) == 114, "expected 114 surahs"
    assert len(uthmani) == 114 and len(simple) == 114
    ayahs = []
    expected_id = 1
    for s_meta, s_u, s_s in zip(surah_meta, uthmani, simple, strict=True):
        assert s_meta["number"] == s_u["number"] == s_s["number"]
        assert len(s_u["ayahs"]) == len(s_s["ayahs"]) == s_meta["numberOfAyahs"], s_meta["number"]
        for idx, (a_u, a_s) in enumerate(zip(s_u["ayahs"], s_s["ayahs"], strict=True), start=1):
            assert a_u["number"] == a_s["number"] == expected_id, (s_meta["number"], idx)
            assert a_u["numberInSurah"] == idx
            sajda = a_u.get("sajda")
            ayahs.append(
                [
                    a_u["number"],
                    s_meta["number"],
                    idx,
                    strip_bom(a_u["text"]),
                    strip_bom(a_s["text"]),
                    a_u["juz"],
                    a_u["page"],
                    a_u["hizbQuarter"],
                    bool(sajda),
                ]
            )
            expected_id += 1
    assert len(ayahs) == 6236, f"expected 6236 ayahs, got {len(ayahs)}"

    if args.tanzil:
        tanzil = load_tanzil(args.tanzil)
        assert len(tanzil) == 6236, "Tanzil file must contain 6236 ayahs"
        mismatches = {(a[1], a[2]) for a in ayahs if rasm(a[3]) != rasm(tanzil[(a[1], a[2])])}
        unexpected = mismatches - KNOWN_RASM_VARIANTS
        if unexpected:
            print(f"ABORT: rasm differs from Tanzil for {sorted(unexpected)[:20]}", file=sys.stderr)
            return 1
        print(
            f"Tanzil cross-check: {6236 - len(mismatches)}/6236 identical rasm; "
            f"documented encoding variants: {sorted(mismatches)}"
        )

    editions = {}
    for ident, (kind, lang) in EDITIONS.items():
        data = load(f"ed-{ident}.json")["data"]
        texts = [a["text"] for s in data["surahs"] for a in s["ayahs"]]
        assert len(texts) == 6236, ident
        editions[ident] = {
            "identifier": ident,
            "kind": kind,
            "language": lang,
            "name": data["edition"]["name"],
            "english_name": data["edition"]["englishName"],
            "texts": [strip_bom(t) for t in texts],
        }

    surahs = [
        {
            "number": s["number"],
            "name_ar": s["name"],
            "name_en": s["englishName"],
            "name_en_translation": s["englishNameTranslation"],
            "revelation_type": s["revelationType"],
            "ayah_count": s["numberOfAyahs"],
        }
        for s in surah_meta
    ]

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    (DATA_DIR / "surahs.json").write_text(json.dumps(surahs, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    write_gz_json(
        DATA_DIR / "ayahs.json.gz",
        {
            "source": "api.alquran.cloud quran-uthmani + quran-simple-clean (Tanzil)",
            "columns": [
                "id",
                "surah",
                "number_in_surah",
                "text_uthmani",
                "text_simple",
                "juz",
                "page",
                "hizb_quarter",
                "sajda",
            ],
            "rows": ayahs,
        },
    )
    for ident, ed in editions.items():
        write_gz_json(DATA_DIR / f"edition-{ident}.json.gz", ed)

    files = sorted(p for p in DATA_DIR.iterdir() if p.is_file() and p.name != "checksums.json")
    checksums = {p.name: sha256(p) for p in files}
    (DATA_DIR / "checksums.json").write_text(json.dumps(checksums, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(files)} datasets to {DATA_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
