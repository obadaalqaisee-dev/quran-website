# Architecture

## 1. Requirements that drive the design

1. **Nothing may be lost.** Every feature in [`feature_preservation_checklist.md`](feature_preservation_checklist.md) must keep working.
2. **The live site is on GitHub Pages**, which serves static files only and cannot run Python or set HTTP headers. A redesign that only works with a Python server would take the current site offline the moment it is merged.
3. **Public Quran content must stay anonymous.** No accounts are needed to read, listen or search.
4. **Quranic text must be verified and must not change source silently.**
5. **Python is preferred** wherever it is technically appropriate.
6. **Use the simplest architecture that meets the requirements.** No microservices.

## 2. Decisions

| Concern | Decision | Why | Rejected alternatives |
|---|---|---|---|
| Frontend runtime | **Vanilla HTML + CSS + native ES modules**, no build step | The app is a single page with ~15 interactive features. ES modules give real modularity (one file per feature) with zero toolchain, and deploy unchanged to GitHub Pages. The original 166 KB monolith becomes about 20 small, testable modules. | **React/Next.js:** adds a Node build pipeline and hydration cost for no user-visible gain. Next.js SSR would also need a Node host, not Pages. **Vue:** same build-step argument. **TypeScript:** valuable, but needs a compiler; JSDoc annotations give editor type hints without one. |
| Backend | **Python 3.11+ / FastAPI** | The backend is a read-heavy JSON API plus a few validated, cached upstream proxies. FastAPI gives Pydantic validation, async `httpx` for the proxies, and generated OpenAPI documentation with little code. | **Django + DRF:** its strengths (admin, auth, sessions, templates, forms) are not needed here, because there are no accounts and no server-rendered pages. It would be more framework than the problem needs. |
| ORM / migrations | **SQLAlchemy 2.0 + Alembic** | Typed models, portable between SQLite and PostgreSQL, versioned schema migrations | Raw SQL (no migrations); Django ORM (comes with Django) |
| Database | **SQLite by default; PostgreSQL via `DATABASE_URL`** | The data is ~25 MB of read-only reference content (Quran, tafsir, translations, adhkar, reciters) with no user writes, which suits SQLite: one file, no server to run. The same code runs on PostgreSQL when more than one instance is needed. | PostgreSQL-only: an operational burden for read-only data |
| Hosting | **Frontend on GitHub Pages (mandatory) + backend on a separate Python host** (see §6) | The existing public URL must keep working, and Pages cannot run Python | Moving the frontend to another host; making the site depend on a server |
| User data | **Stays in the browser (`localStorage`)**, same keys as before | No accounts are needed (requirement 3). Backward compatible with existing visitors' data. No personal data stored on a server means a smaller attack surface and no GDPR exposure. | Server-side accounts: explicitly not wanted for public reading |

## 3. System overview

```
                         ┌──────────────────────────────────────────────┐
 Browser                 │  Static frontend  (index.html, assets/…)     │
                         │  ES modules  ─►  assets/js/core/api.js       │
                         └───────────────┬───────────────────┬──────────┘
                                         │ backend available │ backend absent
                                         ▼                   ▼  (GitHub Pages)
               ┌──────────────────────────────────┐   ┌──────────────────────────┐
               │ FastAPI  /api/v1/*               │   │ Public upstream APIs     │
               │  • security headers, CSP, CORS   │   │ (exactly as the original │
               │  • rate limiting                 │   │  site used them)         │
               │  • validation (Pydantic)         │   └──────────────────────────┘
               │  • TTL cache for upstream calls  │
               └──────┬───────────────────┬───────┘
                      ▼                   ▼
          ┌──────────────────────┐   ┌──────────────────────────────────────┐
          │ SQLite / PostgreSQL  │   │ Upstream (server-side, allow-listed) │
          │ surahs, ayahs,       │   │  api.aladhan.com   (prayer times)    │
          │ tafsir/translations, │   │  www.mp3quran.net  (audio fallback)  │
          │ reciters, adhkar,    │   └──────────────────────────────────────┘
          │ data_imports         │
          └──────────────────────┘
 Audio files are streamed by the browser directly from mp3quran.net and
 cdn.islamic.network. They are never proxied: that would add bandwidth
 cost and latency for no benefit.
```

### 3.1 Frontend ↔ backend contract (progressive enhancement)

`assets/js/core/api.js` is the **only** module that performs network requests. For each operation it:

1. Uses the backend when one is configured (`<meta name="quran-api" content="…">`) or detected on the same origin (`api/v1/health` is probed once per session).
2. Otherwise calls the original upstream API, so a GitHub Pages deployment behaves exactly as before.

Both paths return the same normalised shapes, so feature modules do not know which one served them. Every backend endpoint has a matching upstream fallback, so **no frontend code depends on an API that might not exist**.

## 4. Repository layout

```
/                         static site root (served by GitHub Pages *and* by FastAPI)
├── index.html            semantic markup, no inline JS/CSS handlers
├── manifest.json, sw.js, robots.txt, sitemap.xml, Quran.mp3, icon.png
├── assets/
│   ├── css/              tokens.css, base.css, layout.css, components.css, reader.css
│   ├── icons/            icon-192.png, icon-512.png, maskable, apple-touch, og image
│   └── js/
│       ├── main.js       entry point: wires modules together
│       ├── core/         api.js, dom.js, i18n.js, storage.js, state.js, modal.js, toast.js, arabic.js, analytics.js
│       ├── data/         translations.js, adhkar.js, reciters.js, surah-meta.js
│       └── features/     surahs.js, player.js, reader.js, prayer.js, dashboard.js, adhkar.js,
│                         rosary.js, ayah-search.js, islamic-search.js, voice-lab.js,
│                         favorites.js, profile.js, theme.js, notifications.js
├── backend/
│   ├── app/
│   │   ├── main.py            application factory
│   │   ├── core/              config.py, security.py (headers/CSP), rate_limit.py, logging.py, errors.py, cache.py
│   │   ├── db/                base.py, session.py
│   │   ├── models/            surah.py, ayah.py, edition.py, reciter.py, dhikr.py, data_import.py
│   │   ├── schemas/           Pydantic response and request models
│   │   ├── repositories/      database queries (no SQL in routes)
│   │   ├── services/          quran, search, audio, prayer, adhkar, upstream http client
│   │   ├── api/v1/            routers: health, surahs, ayahs, search, reciters, prayer, adhkar
│   │   ├── static_site.py     allow-listed static file serving
│   │   ├── cli.py             `python -m app.cli seed|verify`
│   │   └── data/              verified datasets (.json.gz) + checksums.json
│   ├── alembic/              migrations
│   ├── tests/                pytest suite
│   └── pyproject.toml, requirements*.txt, Dockerfile, .env.example
├── tests/e2e/            Playwright end-to-end tests (Node built-in test runner)
└── docs/                 audit, checklist, architecture, API, deployment, security, testing
```

## 5. Data design

```
surahs(number PK 1..114, name_ar, name_en, name_en_translation, revelation_type, ayah_count)
ayahs(id PK 1..6236, surah_number FK→surahs, number_in_surah, text_uthmani, text_simple,
      text_search, juz, page, hizb_quarter, sajda;  UNIQUE(surah_number, number_in_surah))
editions(identifier PK, kind['tafsir'|'translation'], language, name, english_name)
ayah_texts(edition FK, ayah_id FK, text;  PK(edition, ayah_id))
reciters(slug PK, position, name_ar, name_en, i18n_key, base_url, rewaya,
         mp3quran_reciter_id, mp3quran_moshaf_id)
adhkar(id PK, category, position, text, count;  UNIQUE(category, position))
data_imports(id PK, dataset, source, sha256, records, imported_at)
```

* **Provenance.** Every dataset in `backend/app/data/` has a SHA-256 checksum in `checksums.json`. `seed` refuses to import a file whose hash differs, and it records each import in `data_imports`.
* **Integrity checks** run at import and in the test suite: 114 surahs, 6,236 ayahs, per-surah counts equal to the surah metadata, contiguous numbering, and identical text to the original source.
* **Search.** `text_search` is a normalised form of the simple-clean text (no diacritics, unified alef/ya/ta-marbuta forms) with an index. Queries go through the same normaliser and use parameterised `LIKE`. There is no string concatenation into SQL.
* **Transactions.** The seed runs in a single transaction, so either everything imports or nothing does.

## 6. Deployment (binding requirement: GitHub Pages)

**The public website is, and remains, `https://obadaalqaisee-dev.github.io/quran-website/`.**

During the audit we confirmed that GitHub Pages builds from the **root of `main`**: the live `index.html` is byte-identical to `main:index.html`. The frontend therefore stays at the repository root, uses only relative URLs (it works under the `/quran-website/` sub-path), and needs no build step and no server.

```
 https://obadaalqaisee-dev.github.io/quran-website/   (GitHub Pages: static frontend)
        │  HTTPS + CORS (origin allow-list = https://obadaalqaisee-dev.github.io)
        ▼
 https://<your-backend-host>/api/v1/*                  (Python/FastAPI on a Python host, e.g. Render)
```

| Component | Host | Notes |
|---|---|---|
| Frontend | **GitHub Pages** (unchanged) | Never depends on a server being up: if the backend is unreachable, `api.js` falls back to the original public APIs after a short timeout. |
| Backend | A Python host. `render.yaml` (Render Blueprint, free tier) and `backend/Dockerfile` (any container host) are included. | `CORS_ORIGINS=https://obadaalqaisee-dev.github.io`, HTTPS enforced by the host, HSTS on |
| Connection | `<meta name="quran-api" content="https://…">` in `index.html` plus the matching CSP `connect-src` | Both are updated together by `python scripts/set_api_url.py https://…` so they cannot drift apart. |

Local development can serve everything from one origin (`uvicorn` serves the static files too), but that is a development convenience, **not** a production requirement.

## 7. Security architecture (summary)

Details are in [`security.md`](security.md).

* **Headers** (backend): strict CSP with no `unsafe-inline` scripts, HSTS (production only), `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (microphone and geolocation for this site only), `frame-ancestors 'none'`, COOP.
* **Static pages:** the same CSP is delivered as a `<meta>` tag on GitHub Pages, minus the directives `<meta>` cannot carry.
* **No inline scripts or handlers.** All behaviour lives in modules, so CSP can forbid inline script.
* **Output encoding.** Remote text is inserted with `textContent` or through an escaping template helper. The only `innerHTML` sinks are static, trusted i18n strings that contain markup (`<strong>`, `<span>`).
* **Input validation.** All path and query parameters have Pydantic constraints (ranges, lengths, enums). Edition identifiers and reciter slugs come from allow-lists.
* **SSRF.** The server only calls a fixed allow-list of upstream hosts. User input never forms a hostname.
* **Rate limiting.** Per-IP sliding window, with tighter limits on endpoints that call upstream services.
* **Errors.** A uniform JSON error envelope. Stack traces are never returned. OpenAPI docs can be turned off in production.
* **Secrets.** The application needs none. Configuration comes from environment variables (`.env.example` is provided; `.env` is git-ignored).

## 8. Performance architecture

* No artificial start-up delay. Surah metadata (114 entries, ~10 KB) ships **inside** the frontend, so the list renders instantly without any network request; the backend or upstream is only needed for ayah text.
* `fetch` responses are memoised in memory. The service worker uses cache-first for the app shell and fonts, stale-while-revalidate for Quran/tafsir JSON, and network-only for audio.
* The backend sets long `Cache-Control` and an `ETag` on immutable Quran data, uses GZip compression, and keeps a TTL cache for prayer times and audio resolution.
* Icons are resized (709 KB → a few KB). The hero image uses responsive sizes and a lower-resolution default.
* Event delegation replaces hundreds of per-card listeners. The surah filter is debounced. The scroll handler uses `IntersectionObserver`.

## 9. Scalability path

1. Move from SQLite to PostgreSQL by changing `DATABASE_URL` (migrations are portable).
2. When running several instances, replace the in-process rate limiter and TTL cache with Redis (both sit behind small interfaces in `core/rate_limit.py` and `core/cache.py`).
3. Put a CDN in front: the API responses for Quran data are already cacheable.
