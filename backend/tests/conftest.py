"""Test fixtures: a seeded temporary SQLite database and a mocked upstream network."""

from __future__ import annotations

import json
from collections.abc import Callable

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app.core.config import Settings
from app.db import session as db_session
from app.db.session import make_engine
from app.main import create_app
from app.models import Base
from app.services import audio as audio_service
from app.services import prayer as prayer_service
from app.services.datasets import load_verified, seed

ALADHAN_PAYLOAD = {
    "code": 200,
    "data": {
        "timings": {
            "Fajr": "05:36",
            "Sunrise": "07:08",
            "Dhuhr": "12:22",
            "Asr": "15:16",
            "Sunset": "17:35",
            "Maghrib": "17:35",
            "Isha": "19:05 (EET)",
        },
        "date": {
            "gregorian": {"date": "19-11-2026"},
            "hijri": {"day": "9", "year": "1448", "month": {"ar": "جُمادى الآخرة", "en": "Jumādá al-ākhirah"}},
        },
        "meta": {"timezone": "Asia/Amman", "method": {"name": "Gulf Region"}},
    },
}


def mp3quran_payload(reciter_id: int, moshaf_id: int, server: str) -> dict:
    return {
        "reciters": [
            {
                "id": reciter_id,
                "moshaf": [{"id": moshaf_id, "server": server, "surah_list": ",".join(str(i) for i in range(1, 115))}],
            }
        ]
    }


class UpstreamMock:
    """Records requests and answers with a programmable handler."""

    def __init__(self):
        self.requests: list[httpx.Request] = []
        self.handler: Callable[[httpx.Request], httpx.Response] = self.default

    def default(self, request: httpx.Request) -> httpx.Response:
        if request.url.host == "api.aladhan.com":
            return httpx.Response(200, json=ALADHAN_PAYLOAD)
        if request.url.host == "www.mp3quran.net":
            rid = int(request.url.params.get("reciter", "0"))
            return httpx.Response(
                200, json=mp3quran_payload(rid, 53 if rid == 51 else rid, "https://cdn.mp3quran.net/audio/test/r1/")
            )
        return httpx.Response(404)

    def __call__(self, request: httpx.Request) -> httpx.Response:
        self.requests.append(request)
        return self.handler(request)


@pytest.fixture(scope="session")
def verified():
    return load_verified()


@pytest.fixture(scope="session")
def database_url(tmp_path_factory, verified):
    path = tmp_path_factory.mktemp("db") / "test.sqlite3"
    url = f"sqlite:///{path}"
    engine = make_engine(url)
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    seed(session, verified)
    session.close()
    engine.dispose()
    return url


def _settings(database_url: str, **overrides) -> Settings:
    base = dict(
        environment="test",
        database_url=database_url,
        rate_limit_default=10_000,
        rate_limit_upstream=10_000,
        serve_static=True,
    )
    base.update(overrides)
    return Settings(**base)


@pytest.fixture
def upstream():
    return UpstreamMock()


@pytest.fixture
def make_client(database_url, upstream, monkeypatch):
    """Factory: build a TestClient for given settings overrides."""
    clients = []

    def factory(**overrides) -> TestClient:
        settings = _settings(database_url, **overrides)
        monkeypatch.setattr(db_session, "get_settings", lambda: settings)
        db_session.get_engine.cache_clear()
        db_session.get_sessionmaker.cache_clear()
        audio_service.clear_cache()
        prayer_service.clear_cache()
        app = create_app(settings, upstream_transport=httpx.MockTransport(upstream))
        client = TestClient(app)
        client.__enter__()
        clients.append(client)
        return client

    yield factory
    for c in clients:
        c.__exit__(None, None, None)
    db_session.get_engine.cache_clear()
    db_session.get_sessionmaker.cache_clear()


@pytest.fixture
def client(make_client):
    return make_client()


def body(response) -> dict:
    return json.loads(response.content)
