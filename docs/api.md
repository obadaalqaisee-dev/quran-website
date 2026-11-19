# API reference (v1)

* **Base path:** `/api/v1`. Interactive OpenAPI documentation is at `/api/docs` in development (off in production unless `ENABLE_DOCS=true`).
* **Methods:** all endpoints are `GET`. Public content needs no authentication.

## Conventions

| Topic | Rule |
|---|---|
| Success body | `{"data": …}`; paginated lists add `"meta": {"total", "page", "page_size", "pages"}` |
| Error body | `{"error": {"code": "validation_error", "message": "…", "details"?: [{"location", "message"}]}}` |
| Status codes | `200` OK · `304` not modified · `404` unknown route/resource · `405` wrong method · `422` invalid parameters · `429` rate limited (`Retry-After` header) · `502` upstream error · `504` upstream timeout · `500` unexpected (no internal details) |
| Caching | Quran data (surahs, ayahs, editions, reciters, adhkar) is sent with `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` and a strong `ETag`; send `If-None-Match` to get `304`. ETags change only when a verified dataset changes. |
| CORS | `GET` from the origins in `CORS_ORIGINS` (production: `https://obadaalqaisee-dev.github.io`). No credentials. |
| Rate limits | Per client IP, per 60 s: 240 requests in general, 30 for endpoints that call third parties (`/prayer-times`, `/reciters/{slug}/audio/{n}`). Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`. |

## Endpoints

### `GET /health`
Liveness and database check. Returns `{"status": "ok", "database": "ok", "version": "2.0.0"}`; if the database is unavailable, `status` is `degraded`.

### `GET /surahs`
All 114 surahs.

```json
{"data": [{"number": 1, "name_ar": "سُورَةُ ٱلْفَاتِحَةِ", "name_en": "Al-Faatiha",
           "name_en_translation": "The Opening", "revelation_type": "Meccan", "ayah_count": 7}, …]}
```

### `GET /surahs/{number}`
`number`: 1–114. Returns the surah plus its ayahs in Uthmani script, **exactly as stored**. In this source, ayah 1 of surahs 2–114 (except 9) begins with the basmala; the website shows it as a header instead.

```json
{"data": {"number": 112, …, "ayahs": [{"id": 6222, "number_in_surah": 1, "text": "…", "juz": 30, "page": 604, "sajda": false}, …]}}
```

### `GET /ayahs/{id}?editions=ar.muyassar,en.sahih`
* `id`: global ayah number, 1–6236.
* `editions`: comma-separated, any of `ar.muyassar`, `en.sahih`, `es.cortes`, `fr.hamidullah`. Unknown values return `422`.

```json
{"data": {"id": 262, "surah": 2, "number_in_surah": 255, "text": "…",
          "editions": {"ar.muyassar": "…", "en.sahih": "Allah - there is no deity except Him, …"}}}
```

### `GET /editions`
The four available tafsir/translation editions, with name, language and kind.

### `GET /search?q=…&page=1&page_size=20`
Diacritic-insensitive substring search over the Quran text.

| Parameter | Constraint |
|---|---|
| `q` | 2–100 characters |
| `page` | 1–1000 |
| `page_size` | 1–50 |

Alef, ya and ta-marbuta variants are unified, and a word starting with «ال» also matches its «لل» form (`الرحمن` finds `للرحمن`). On 8 sample queries the results were identical to the public alquran.cloud search the site used before.

```json
{"data": [{"id": 6222, "surah": 112, "surah_name_ar": "…", "surah_name_en": "Al-Ikhlaas",
           "number_in_surah": 1, "text": "<uthmani>", "text_simple": "<simple>"}],
 "meta": {"total": 1, "page": 1, "page_size": 20, "pages": 1}}
```

### `GET /reciters`
The 16 reciters of the original site, in their original order.

```json
{"data": [{"slug": "basit", "position": 1, "name_ar": "الشيخ عبد الباسط عبد الصمد", "name_en": "Abdul Basit Abdul Samad",
           "i18n_key": null, "base_url": "https://server7.mp3quran.net/basit/", "rewaya": "حفص عن عاصم - مرتل"}, …]}
```

### `GET /reciters/{slug}/audio/{surah}`
Playable URLs, in order of preference.
* The first URL is always the original site's URL.
* The second (when different) is the reciter's current server, looked up on mp3quran.net by the reciter's verified numeric ID and cached for 24 h.
* If that lookup fails, `fallback_lookup_error` explains why, and the primary URL is still returned.

```json
{"data": {"reciter": "basit", "surah": 1, "urls": ["https://server7.mp3quran.net/basit/001.mp3",
          "https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3/001.mp3"], "fallback_lookup_error": null}}
```

### `GET /prayer-times`
Either `latitude` (−90…90) **and** `longitude` (−180…180), or `city` **and** `country` (letters, spaces, `.'-`, 2–64 characters).

| Optional parameter | Values |
|---|---|
| `method` | Aladhan method 0–23, default `8` as on the site |
| `date` | `YYYY-MM-DD`, the visitor's local date |

Coordinates are rounded to 2 decimals (about 1 km) before they reach Aladhan or the cache. Results are cached for 6 h.

```json
{"data": {"timings": {"Fajr": "05:36", "Sunrise": "07:08", "Dhuhr": "12:22", "Asr": "15:16", "Maghrib": "17:35", "Isha": "19:05"},
          "date": {"gregorian": "19-11-2026", "hijri": {"day": "9", "year": "1448", "month_ar": "جُمادى الآخرة", "month_en": "Jumādá al-ākhirah"}},
          "timezone": "Asia/Amman", "method": "Gulf Region", "location": {"latitude": 31.95, "longitude": 35.91}}}
```

### `GET /adhkar?category=morning`
`category` (optional) is one of `morning` (8), `evening` (8), `sleep` (4), `prayer` (6) or `daily` (10). The texts and counts are verbatim from the original site.

```json
{"data": [{"category": "morning", "position": 1, "text": "…", "count": 3}, …]}
```

## Examples

```bash
curl -s https://<api-host>/api/v1/surahs/1
```

```bash
curl -s 'https://<api-host>/api/v1/search?q=%D8%A7%D9%84%D8%B1%D8%AD%D9%85%D9%86&page_size=5'
```

```bash
curl -s 'https://<api-host>/api/v1/prayer-times?city=Amman&country=Jordan'
```
