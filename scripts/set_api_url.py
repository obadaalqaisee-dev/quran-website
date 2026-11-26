#!/usr/bin/env python3
"""Point the GitHub Pages site at a deployed backend (or back to automatic mode).

    python3 scripts/set_api_url.py https://quran-website-api.onrender.com
    python3 scripts/set_api_url.py auto      # default: same-origin backend if present, else public APIs

It updates, together and consistently:
  * <meta name="quran-api" content="...">            in index.html
  * the Content-Security-Policy connect-src            in index.html (the API origin must be allowed)
Only https:// origins are accepted (GitHub Pages is served over HTTPS; mixed content would be blocked).
The site keeps working if the backend is down: it falls back to the public APIs.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

INDEX = Path(__file__).resolve().parents[1] / "index.html"
BASE_CONNECT = (
    "connect-src 'self' https://api.alquran.cloud https://www.mp3quran.net https://api.aladhan.com "
    "https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com"
)


def main(argv: list[str]) -> int:
    args = argv[1:]
    index = INDEX
    if len(args) == 3 and args[0] == "--index":  # used by the tests to edit a copy
        index, args = Path(args[1]), args[2:]
    if len(args) != 1:
        print(__doc__)
        return 2
    value = args[0].strip().rstrip("/")
    origin = None
    if value != "auto":
        parts = urlsplit(value)
        if parts.scheme != "https" or not parts.hostname or parts.username or parts.password:
            print("error: give an https:// URL such as https://quran-website-api.onrender.com", file=sys.stderr)
            return 2
        if not re.fullmatch(r"[A-Za-z0-9.-]+", parts.hostname):
            print("error: invalid host name", file=sys.stderr)
            return 2
        origin = f"https://{parts.hostname}" + (f":{parts.port}" if parts.port else "")
        value = origin + (parts.path.rstrip("/") if parts.path not in ("", "/") else "")

    html = index.read_text(encoding="utf-8")
    html, n_meta = re.subn(r'(<meta name="quran-api" content=")[^"]*(">)', rf"\g<1>{value}\g<2>", html)
    connect = BASE_CONNECT + (f" {origin}" if origin else "")
    html, n_csp = re.subn(r"connect-src [^;\"]+", connect, html, count=1)
    if n_meta != 1 or n_csp != 1:
        print("error: index.html does not have the expected meta tags", file=sys.stderr)
        return 1
    index.write_text(html, encoding="utf-8")
    print(f"quran-api = {value}")
    print(f"CSP {connect}")
    print("Commit index.html and push; GitHub Pages will serve the change in a minute or two.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
