#!/usr/bin/env python3
"""Generate assets/js/data/quran-index.js (juz, page and sajda positions) from the verified dataset.

The index lets the reader navigate by juz and Mushaf page and mark sajda ayahs without a network
request. It is derived only from backend/app/data/ayahs.json.gz (checksummed); tests/unit check parity.

Usage: python3 scripts/build_quran_index.py
"""

from __future__ import annotations

import gzip
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "backend" / "app" / "data" / "ayahs.json.gz"
OUT = ROOT / "assets" / "js" / "data" / "quran-index.js"


def main() -> None:
    rows = json.loads(gzip.decompress(SRC.read_bytes()))["rows"]
    juz, pages, sajda = {}, {}, []
    for _id, surah, ayah, _text, _simple, j, page, _hizb, is_sajda in rows:
        juz.setdefault(j, [surah, ayah])
        pages.setdefault(page, [surah, ayah])
        if is_sajda:
            sajda.append([surah, ayah])
    assert sorted(juz) == list(range(1, 31)), "30 juz"
    assert sorted(pages) == list(range(1, 605)), "604 pages"
    body = (
        "// Juz, page and sajda positions of the Madani Mushaf, generated from the verified dataset\n"
        "// (scripts/build_quran_index.py; do not edit by hand). Each entry is [surah, ayah].\n"
        f"export const JUZ_STARTS = {json.dumps([juz[i] for i in range(1, 31)], separators=(',', ':'))};\n"
        f"export const PAGE_STARTS = {json.dumps([pages[i] for i in range(1, 605)], separators=(',', ':'))};\n"
        f"export const SAJDA = {json.dumps(sajda, separators=(',', ':'))};\n"
    )
    OUT.write_text(body, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: 30 juz, 604 pages, {len(sajda)} sajda")


if __name__ == "__main__":
    main()
