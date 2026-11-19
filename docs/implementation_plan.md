# Implementation Plan

Priorities: **P0** = correctness, data integrity, no regressions · **P1** = security, accessibility, performance · **P2** = polish.

| # | Pri | Work item | Done when |
|---|---|---|---|
| 1 | P0 | Branch `Obada_Ub` from the latest `origin/main`; add `.gitignore` and `.nojekyll` | Branch exists; the working tree is clean |
| 2 | P0 | Freeze verified datasets into `backend/app/data/` with SHA-256 checksums (Quran Uthmani + simple-clean + 4 editions + surah metadata + reciters + adhkar) | `python -m app.cli verify` passes: 114 / 6,236 / per-surah counts / checksums |
| 3 | P0 | Backend skeleton: config, app factory, DB session, models, Alembic migration | `alembic upgrade head` creates the schema on SQLite |
| 4 | P0 | Seed command (single transaction, refuses mismatched checksums, records provenance) | DB contains all data; a second run is idempotent |
| 5 | P0 | API v1: health, surahs, surah detail, ayah editions, search, reciters, audio resolution, prayer times, adhkar | All endpoints documented in OpenAPI and covered by pytest |
| 6 | P1 | Security: headers/CSP, CORS allow-list, rate limiting, uniform errors, upstream host allow-list, input constraints | Tests assert headers, 422/404/429 envelopes, CORS behaviour |
| 7 | P0 | Frontend data layer `api.js` (backend first, upstream fallback, timeout, memoisation) | Both modes return identical shapes |
| 8 | P0 | Port every feature into modules **without** inline handlers; keep i18n strings, adhkar and texts verbatim | Every row in the checklist works in E2E tests |
| 9 | P0 | Fix defects: memorisation lab, Arabic surah filter, wird day boundary, prayer localisation, notifications, language persistence, silent fetch failures, wrong empty state | Regression tests for each |
| 10 | P1 | Redesign: design tokens, typography (Amiri for Quran text, Cairo for UI), compact responsive navbar (mobile drawer), persistent mini player, reading settings (font size), accessible dialogs | Screenshots at 360 / 768 / 1366 px; no horizontal overflow |
| 11 | P1 | Accessibility: dialog semantics + focus trap + Escape, keyboard-operable ayahs/adhkar/rosary, skip link, focus rings, AA contrast, reduced motion, labelled controls | axe-style checks in E2E; keyboard walk-through |
| 12 | P1 | PWA: register the service worker, real caching strategies, correct icon sizes, offline Al-Fatihah via `Quran.mp3` | SW active; app shell loads offline |
| 13 | P1 | SEO: JSON-LD, Twitter card, `robots.txt`, `sitemap.xml`, `hreflang`, `noscript`, heading hierarchy | Validated by tests |
| 14 | P1 | GitHub Pages compatibility: relative paths, sub-path test server, CSP meta, `scripts/set_api_url.py`, `render.yaml` | E2E suite passes under `/quran-website/` with no backend **and** with a cross-origin backend |
| 15 | P1 | Verification: pytest, E2E, `pip-audit`, `ruff`, performance measurement, live URL check | Honest report in `docs/testing.md` |
| 16 | P2 | Documentation: README, API, deployment, security, testing | Another developer can run everything from the README |
| 17 | P0 | Logical commits; push `origin/Obada_Ub`; no merge into `main` | Branch pushed |
