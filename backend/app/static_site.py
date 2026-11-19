"""Serve the static website from the backend (local development convenience).

In production the site is served by GitHub Pages. The repository root also
contains ``backend/``, ``docs/``, ``.git`` and so on, so this module serves
**only an explicit allow-list** of files and the ``assets/`` directory.
Everything else returns 404.
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

ROOT_FILES = {
    "index.html": "text/html; charset=utf-8",
    "404.html": "text/html; charset=utf-8",
    "manifest.json": "application/manifest+json",
    "sw.js": "text/javascript; charset=utf-8",
    "robots.txt": "text/plain; charset=utf-8",
    "sitemap.xml": "application/xml",
    "icon.png": "image/png",
    "Quran.mp3": "audio/mpeg",
}


def mount_static_site(app: FastAPI, root: Path) -> None:
    root = root.resolve()
    assets = root / "assets"
    if assets.is_dir():
        app.mount("/assets", StaticFiles(directory=assets), name="assets")

    def _file(name: str) -> FileResponse:
        headers = {"Cache-Control": "no-cache"} if name in {"index.html", "sw.js"} else None
        return FileResponse(root / name, media_type=ROOT_FILES[name], headers=headers)

    @app.get("/", include_in_schema=False)
    def index():
        return _file("index.html")

    for name in ROOT_FILES:
        if (root / name).is_file():
            app.add_api_route(f"/{name}", (lambda n=name: _file(n)), include_in_schema=False, methods=["GET"])
