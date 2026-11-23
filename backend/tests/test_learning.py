"""Endpoints added by the platform evolution: tafsir search, Quran index, learning resources."""

from __future__ import annotations

import gzip
import json

import pytest

from app.core.config import DATA_DIR
from app.services.arabic import normalize_arabic
from tests.conftest import body

MUYASSAR = json.loads(gzip.decompress((DATA_DIR / "edition-ar.muyassar.json.gz").read_bytes()))["texts"]
SAHIH = json.loads(gzip.decompress((DATA_DIR / "edition-en.sahih.json.gz").read_bytes()))["texts"]


def test_tafsir_search_matches_the_dataset(client):
    q = "الصلاة"
    expected = [i + 1 for i, text in enumerate(MUYASSAR) if normalize_arabic(q) in normalize_arabic(text)]
    res = body(client.get("/api/v1/tafsir/search", params={"q": q, "page_size": 50}))
    assert res["meta"]["total"] == len(expected) > 50
    assert [h["id"] for h in res["data"]] == expected[:50]
    first = res["data"][0]
    assert first["edition"] == "ar.muyassar"
    assert first["text"] == MUYASSAR[first["id"] - 1]


def test_tafsir_search_ignores_diacritics_and_other_editions(client):
    plain = body(client.get("/api/v1/tafsir/search", params={"q": "الرحمن"}))["meta"]["total"]
    vowelled = body(client.get("/api/v1/tafsir/search", params={"q": "الرَّحْمَٰن"}))["meta"]["total"]
    assert plain == vowelled > 0
    english = body(client.get("/api/v1/tafsir/search", params={"q": "mercy", "edition": "en.sahih"}))
    assert english["meta"]["total"] == sum("mercy" in t.lower() for t in SAHIH)


@pytest.mark.parametrize(
    "params",
    [{"q": "x"}, {"q": "صلاة", "edition": "xx.unknown"}, {"q": "صلاة", "page_size": 500}, {"q": "!!"}],
)
def test_tafsir_search_validates_input(client, params):
    assert client.get("/api/v1/tafsir/search", params=params).status_code == 422


@pytest.mark.parametrize("q", ["%%", "__", "' OR 1=1 --", '"; DROP TABLE ayah_texts; --'])
def test_tafsir_search_is_injection_safe(client, q):
    res = client.get("/api/v1/tafsir/search", params={"q": q})
    assert res.status_code in (200, 422)
    if res.status_code == 200:
        assert res.json()["meta"]["total"] == 0
    assert body(client.get("/api/v1/tafsir/search", params={"q": "الصلاة"}))["meta"]["total"] > 0


def test_quran_index_matches_the_dataset(client):
    rows = json.loads(gzip.decompress((DATA_DIR / "ayahs.json.gz").read_bytes()))["rows"]
    data = body(client.get("/api/v1/quran-index"))["data"]
    assert len(data["juz"]) == 30 and len(data["pages"]) == 604 and len(data["sajda"]) == 15
    assert data["juz"][1] == [2, 142] and data["juz"][29] == [78, 1]
    assert data["pages"][0] == [1, 1] and data["pages"][603][0] == 112
    assert data["sajda"] == [[r[1], r[2]] for r in rows if r[8]]


def test_quran_index_is_http_cacheable(client):
    first = client.get("/api/v1/quran-index")
    assert first.headers["etag"]
    assert client.get("/api/v1/quran-index", headers={"If-None-Match": first.headers["etag"]}).status_code == 304


def test_learning_resources_have_honest_status_and_https(client):
    data = body(client.get("/api/v1/learning/resources"))["data"]
    source = json.loads((DATA_DIR / "learning_resources.json").read_text(encoding="utf-8"))["resources"]
    assert [r["id"] for r in data] == [r["id"] for r in sorted(source, key=lambda r: r["position"])]
    for r in data:
        assert r["status"] in {"existing", "official", "search"}
        assert r["url"].startswith("https://")
        assert r["checked_at"] is None  # nothing is claimed as checked until a live link check runs
    # The only video link presented as a specific video is the one that was already on the site.
    videos = [r for r in data if r["kind"] == "video" and r["status"] != "search"]
    assert [r["url"] for r in videos] == ["https://www.youtube.com/watch?v=W-jX2kY0vR8"]
    assert all("search_query=" in r["url"] for r in data if r["kind"] == "video" and r["status"] == "search")


def test_learning_resources_filter_by_topic(client):
    data = body(client.get("/api/v1/learning/resources", params={"topic": "sahw"}))["data"]
    assert data and all(r["topic"] in {"sahw", "all"} for r in data)
    assert client.get("/api/v1/learning/resources", params={"topic": "../etc"}).status_code == 422


def test_existing_endpoints_unchanged(client):
    """The new router must not shadow or alter the original API."""
    assert body(client.get("/api/v1/health"))["status"] == "ok"
    assert len(body(client.get("/api/v1/surahs"))["data"]) == 114
    assert len(body(client.get("/api/v1/reciters"))["data"]) == 16
    assert body(client.get("/api/v1/search", params={"q": "قل هو الله احد"}))["meta"]["total"] == 1
