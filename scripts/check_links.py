#!/usr/bin/env python3
"""Check every external link and media URL the site uses, and report — never delete — failures.

Covers: links in index.html, scholar resources (backend/app/data/learning_resources.json), the 16
reciters (first and last surah of each, original URL), the per-ayah audio CDN, and the public APIs.
Internal links, assets and the service-worker precache list are checked offline by
tests/unit/evolution.test.mjs on every CI run; this script needs internet access.

Usage:  python3 scripts/check_links.py [--json report.json] [--timeout 15]
Exit code 1 if any URL failed. A failed scholar resource must be repaired with a verified
replacement or marked unavailable in assets/js/data/scholar-resources.js — not silently removed.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "backend" / "app" / "data"
AGENT = "quran-website-link-check/1.0"


def collect() -> list[tuple[str, str]]:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    urls: list[tuple[str, str]] = []
    for url in sorted(set(re.findall(r'href="(https://[^"]+)"', html))):
        urls.append(("index.html", url.replace("&amp;", "&")))
    for r in json.loads((DATA / "learning_resources.json").read_text(encoding="utf-8"))["resources"]:
        urls.append((f"resource:{r['id']} ({r['status']})", r["url"]))
    for r in json.loads((DATA / "reciters.json").read_text(encoding="utf-8")):
        for n in (1, 114):
            urls.append((f"reciter:{r['slug']}", f"{r['base_url']}{n:03d}.mp3"))
    urls += [
        ("ayah-audio", "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3"),
        ("api", "https://api.alquran.cloud/v1/surah/1/quran-uthmani"),
        ("api", "https://api.aladhan.com/v1/timingsByCity?city=Amman&country=Jordan&method=8"),
        ("api", "https://www.mp3quran.net/api/v3/reciters?language=ar&reciter=51"),
    ]
    return urls


def check(item: tuple[str, str], timeout: float) -> dict:
    origin, url = item
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=method, headers={"User-Agent": AGENT, "Range": "bytes=0-1023"})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as res:  # noqa: S310 - fixed https URLs
                return {"origin": origin, "url": url, "status": res.status, "ok": res.status < 400}
        except urllib.error.HTTPError as exc:
            if method == "HEAD" and exc.code in (403, 405, 501):
                continue  # some servers refuse HEAD; retry with GET
            return {"origin": origin, "url": url, "status": exc.code, "ok": False}
        except Exception as exc:  # noqa: BLE001 - report every failure
            return {"origin": origin, "url": url, "status": None, "ok": False, "error": str(exc)[:120]}
    return {"origin": origin, "url": url, "status": None, "ok": False}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", type=Path)
    parser.add_argument("--timeout", type=float, default=15)
    args = parser.parse_args()
    items = collect()
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(lambda i: check(i, args.timeout), items))
    failed = [r for r in results if not r["ok"]]
    for r in results:
        print(f"{'OK  ' if r['ok'] else 'FAIL'} {r['status'] or '---'} {r['origin']}: {r['url']}" + (f"  ({r.get('error')})" if r.get("error") else ""))
    print(f"\n{len(results) - len(failed)}/{len(results)} reachable")
    if args.json:
        args.json.write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
