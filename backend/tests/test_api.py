"""Functional tests for every API endpoint."""

from __future__ import annotations

import httpx
import pytest

from tests.conftest import body

ORIGINAL_RECITER_URLS = [
    "https://server7.mp3quran.net/basit/",
    "https://server7.mp3quran.net/shur/",
    "https://server13.mp3quran.net/husr/",
    "https://server9.mp3quran.net/hthfi/",
    "https://server6.mp3quran.net/wdee3/",
    "https://server12.mp3quran.net/tnjy/",
    "https://server11.mp3quran.net/yasser/",
    "https://server11.mp3quran.net/shatri/",
    "https://server8.mp3quran.net/afs/",
    "https://server12.mp3quran.net/maher/",
    "https://server10.mp3quran.net/ajm/",
    "https://server8.mp3quran.net/frs_a/",
    "https://server8.mp3quran.net/lhdan/",
    "https://server6.mp3quran.net/abkr/",
    "https://server7.mp3quran.net/s_gmd/",
    "https://server6.mp3quran.net/qtm/",
]


# ---------------------------------------------------------------- health
def test_health(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert body(r)["status"] == "ok" and body(r)["database"] == "ok"


# ---------------------------------------------------------------- surahs
def test_list_surahs(client):
    r = client.get("/api/v1/surahs")
    assert r.status_code == 200
    data = body(r)["data"]
    assert len(data) == 114
    assert data[0] == {
        "number": 1,
        "name_ar": "سُورَةُ ٱلْفَاتِحَةِ",
        "name_en": "Al-Faatiha",
        "name_en_translation": "The Opening",
        "revelation_type": "Meccan",
        "ayah_count": 7,
    }
    assert data[113]["name_en"] == "An-Naas"


def test_surah_detail(client, verified):
    r = client.get("/api/v1/surahs/2")
    data = body(r)["data"]
    assert data["ayah_count"] == 286 == len(data["ayahs"])
    rows = [row for row in verified.ayahs if row[1] == 2]
    assert [a["text"] for a in data["ayahs"]] == [row[3] for row in rows]
    assert data["ayahs"][0]["id"] == 8 and data["ayahs"][-1]["number_in_surah"] == 286


@pytest.mark.parametrize("number", [0, 115, -1])
def test_surah_out_of_range(client, number):
    r = client.get(f"/api/v1/surahs/{number}")
    assert r.status_code == 422
    assert body(r)["error"]["code"] == "validation_error"


def test_surah_not_a_number(client):
    assert client.get("/api/v1/surahs/abc").status_code == 422


def test_etag_conditional_request(client):
    first = client.get("/api/v1/surahs/1")
    etag = first.headers["etag"]
    assert "max-age=86400" in first.headers["cache-control"]
    second = client.get("/api/v1/surahs/1", headers={"If-None-Match": etag})
    assert second.status_code == 304 and second.content == b""
    assert client.get("/api/v1/surahs/2").headers["etag"] != etag


# ---------------------------------------------------------------- ayahs
def test_ayah_with_editions(client, verified):
    r = client.get("/api/v1/ayahs/262", params={"editions": "ar.muyassar,en.sahih,es.cortes,fr.hamidullah"})
    data = body(r)["data"]
    assert (data["surah"], data["number_in_surah"]) == (2, 255)
    assert set(data["editions"]) == {"ar.muyassar", "en.sahih", "es.cortes", "fr.hamidullah"}
    assert data["editions"]["en.sahih"] == verified.editions["en.sahih"]["texts"][261]
    assert data["editions"]["en.sahih"].startswith("Allah - there is no deity except Him")


def test_ayah_without_editions(client):
    data = body(client.get("/api/v1/ayahs/1"))["data"]
    assert data["editions"] == {} and data["text"].startswith("بِسْمِ")


def test_ayah_unknown_edition(client):
    r = client.get("/api/v1/ayahs/1", params={"editions": "en.sahih,../../etc/passwd"})
    assert r.status_code == 422


def test_ayah_out_of_range(client):
    assert client.get("/api/v1/ayahs/6237").status_code == 422


def test_editions_list(client):
    ids = [e["identifier"] for e in body(client.get("/api/v1/editions"))["data"]]
    assert ids == ["ar.muyassar", "en.sahih", "es.cortes", "fr.hamidullah"]


# ---------------------------------------------------------------- search
def test_search_ignores_diacritics_and_alef_forms(client):
    plain = body(client.get("/api/v1/search", params={"q": "قل هو الله احد"}))
    vowelled = body(client.get("/api/v1/search", params={"q": "قُلْ هُوَ ٱللَّهُ أَحَدٌ"}))
    assert plain["meta"]["total"] == vowelled["meta"]["total"] == 1
    hit = plain["data"][0]
    assert (hit["surah"], hit["number_in_surah"]) == (112, 1)


def test_search_matches_lam_prefix_form(client):
    """«الرحمن» must also find «للرحمن» (e.g. 19:26), as the original upstream search did."""
    meta = body(client.get("/api/v1/search", params={"q": "الرحمن", "page_size": 50}))["meta"]
    assert meta["total"] == 167
    ids = set()
    for page in range(1, meta["pages"] + 1):
        ids |= {
            h["id"]
            for h in body(client.get("/api/v1/search", params={"q": "الرحمن", "page_size": 50, "page": page}))["data"]
        }
    assert 2276 in ids  # 19:26 «نذرت للرحمن صوما»


def test_search_pagination(client):
    page1 = body(client.get("/api/v1/search", params={"q": "موسى", "page_size": 50}))
    page3 = body(client.get("/api/v1/search", params={"q": "موسى", "page_size": 50, "page": 3}))
    assert page1["meta"] == {"total": 131, "page": 1, "page_size": 50, "pages": 3}
    assert len(page1["data"]) == 50 and len(page3["data"]) == 31
    assert not {h["id"] for h in page1["data"]} & {h["id"] for h in page3["data"]}


@pytest.mark.parametrize("q", ["%%", "__", "' OR 1=1 --", '"; DROP TABLE ayahs; --'])
def test_search_injection_is_inert(client, q):
    r = client.get("/api/v1/search", params={"q": q})
    assert r.status_code in (200, 422)
    if r.status_code == 200:
        assert body(r)["meta"]["total"] == 0
    assert body(client.get("/api/v1/surahs"))["data"][0]["number"] == 1  # table intact


@pytest.mark.parametrize(
    "params", [{"q": "a"}, {"q": "x" * 101}, {"q": "الله", "page_size": 51}, {"q": "الله", "page": 0}, {}]
)
def test_search_validation(client, params):
    assert client.get("/api/v1/search", params=params).status_code == 422


# ---------------------------------------------------------------- reciters & audio
def test_reciters_preserve_original_list(client):
    data = body(client.get("/api/v1/reciters"))["data"]
    assert [r["base_url"] for r in data] == ORIGINAL_RECITER_URLS
    assert data[0]["name_ar"] == "الشيخ عبد الباسط عبد الصمد"
    assert data[8]["i18n_key"] == "reciter_afasy"


def test_audio_resolution(client, upstream):
    data = body(client.get("/api/v1/reciters/basit/audio/7"))["data"]
    assert data["urls"] == [
        "https://server7.mp3quran.net/basit/007.mp3",
        "https://cdn.mp3quran.net/audio/test/r1/007.mp3",
    ]
    (req,) = upstream.requests
    assert req.url.host == "www.mp3quran.net" and req.url.params["reciter"] == "51"
    client.get("/api/v1/reciters/basit/audio/8")
    assert len(upstream.requests) == 1  # cached


def test_audio_resolution_survives_upstream_failure(client, upstream):
    upstream.handler = lambda request: httpx.Response(500)
    data = body(client.get("/api/v1/reciters/afasy/audio/114"))["data"]
    assert data["urls"] == ["https://server8.mp3quran.net/afs/114.mp3"]
    assert data["fallback_lookup_error"]


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/reciters/unknown/audio/1",
        "/api/v1/reciters/basit/audio/0",
        "/api/v1/reciters/BAD!/audio/1",
        "/api/v1/reciters/basit/audio/115",
    ],
)
def test_audio_validation(client, path):
    assert client.get(path).status_code in (404, 422)


# ---------------------------------------------------------------- prayer times
def test_prayer_by_coordinates_rounds_location(client, upstream):
    r = client.get("/api/v1/prayer-times", params={"latitude": 31.953949, "longitude": 35.910635, "date": "2026-11-19"})
    data = body(r)["data"]
    assert data["timings"] == {
        "Fajr": "05:36",
        "Sunrise": "07:08",
        "Dhuhr": "12:22",
        "Asr": "15:16",
        "Maghrib": "17:35",
        "Isha": "19:05",
    }
    assert data["date"]["hijri"]["month_ar"] == "جُمادى الآخرة"
    (req,) = upstream.requests
    assert req.url.path == "/v1/timings/19-11-2026"
    assert req.url.params["latitude"] == "31.95" and req.url.params["longitude"] == "35.91"
    assert req.url.params["method"] == "8"


def test_prayer_by_city_is_cached(client, upstream):
    params = {"city": "Amman", "country": "Jordan", "date": "2026-11-19"}
    assert client.get("/api/v1/prayer-times", params=params).status_code == 200
    assert client.get("/api/v1/prayer-times", params=params).status_code == 200
    assert len(upstream.requests) == 1
    assert upstream.requests[0].url.path == "/v1/timingsByCity/19-11-2026"


@pytest.mark.parametrize(
    "params",
    [
        {},
        {"latitude": 91, "longitude": 0},
        {"latitude": 0, "longitude": 181},
        {"latitude": 10},
        {"city": "a/../../x", "country": "Jordan"},
        {"city": "Amman", "country": "https://evil"},
        {"city": "Amman", "country": "Jordan", "method": 99},
        {"latitude": 1, "longitude": 1, "date": "tomorrow"},
    ],
)
def test_prayer_validation(client, params):
    assert client.get("/api/v1/prayer-times", params=params).status_code == 422


def test_prayer_upstream_error_maps_to_502(client, upstream):
    upstream.handler = lambda request: httpx.Response(503)
    r = client.get("/api/v1/prayer-times", params={"latitude": 1, "longitude": 1})
    assert r.status_code == 502 and body(r)["error"]["code"] == "upstream_error"


def test_prayer_upstream_timeout_maps_to_504(client, upstream):
    def boom(request):
        raise httpx.ReadTimeout("slow", request=request)

    upstream.handler = boom
    r = client.get("/api/v1/prayer-times", params={"latitude": 1, "longitude": 1})
    assert r.status_code == 504 and body(r)["error"]["code"] == "upstream_timeout"


def test_prayer_upstream_bad_payload_maps_to_502(client, upstream):
    upstream.handler = lambda request: httpx.Response(200, json={"unexpected": True})
    assert client.get("/api/v1/prayer-times", params={"latitude": 2, "longitude": 2}).status_code == 502


# ---------------------------------------------------------------- adhkar
def test_adhkar_all_and_by_category(client, verified):
    data = body(client.get("/api/v1/adhkar"))["data"]
    assert len(data) == 36
    sleep = body(client.get("/api/v1/adhkar", params={"category": "sleep"}))["data"]
    assert [d["text"] for d in sleep] == [d["text"] for d in verified.adhkar["sleep"]]
    morning = body(client.get("/api/v1/adhkar", params={"category": "morning"}))["data"]
    assert [d["count"] for d in morning] == [3, 1, 3, 3, 1, 10, 100, 1]


def test_adhkar_invalid_category(client):
    assert client.get("/api/v1/adhkar", params={"category": "night"}).status_code == 422


def test_unknown_route_is_json_404(client):
    r = client.get("/api/v1/does-not-exist")
    assert r.status_code == 404 and body(r)["error"]["code"] == "not_found"


def test_method_not_allowed(client):
    assert client.post("/api/v1/surahs").status_code == 405
