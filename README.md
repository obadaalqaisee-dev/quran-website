# القرآن الكريم · The Noble Quran

**Live site:** <https://obadaalqaisee-dev.github.io/quran-website/>

A bilingual (Arabic-first, also English, Spanish and French) Quran platform:
- read the Mushaf in Uthmani script, with Tafsir al-Muyassar and translations;
- listen to 16 reciters, or to any single ayah;
- memorise with speech recognition (التسميع): word-by-word feedback, six practice modes, a microphone check,
  memorisation plans, spaced revision and a mistake history;
- **learn the correct prayer (تعلم الصلاة الصحيحة)**: 18 lessons, an illustrated step-by-step tutorial, quizzes,
  scholarly differences explained, and scholars' resources with honest link status;
- an **Islamic Learning Academy** (الأكاديمية التعليمية الإسلامية) of short courses (prayer, memorisation, tajweed fundamentals, basics, daily practice);
- a personal dashboard (daily goal, khatma progress, revisions due, recently played) and a daily companion;
- juz/page navigation, reading themes, ayah-range repeat, a sleep timer and a play queue;
- prayer times with a live countdown and notifications;
- Hisn al-Muslim adhkar with the electronic rosary (its own tab), the daily wird, favourites, settings and a local profile;
- a «من أنا» page (`about.html`) introducing the developers and the site's dedication, with an autoplaying player for the nasheed «أبداً لا لن نحيد»;
- **«بصيرة» insights** on the dashboard: the next step with its reason, a 12-week activity map and streaks, a khatma
  planner, listening statistics, the suggested revision order, ayahs and words that need strengthening, and recitation accuracy;
- **ayah notes and collections** (reflection, memorisation, review, Quranic supplications, or your own), a daily
  question from the site's own lessons, and a **backup/restore** file for everything stored on the device;
- a **site assistant** («💬 المساعد») that explains how to use every feature and answers Islamic questions only with
  passages from the site's verified content, including the whole Quran with Tafsir al-Muyassar, citing the source
  (works offline, issues no fatwas). Optionally, a small AI model running **on the visitor's device** (WebGPU,
  off by default) writes a short answer from those passages only.

The site is a static frontend served by **GitHub Pages**. An optional **Python (FastAPI) backend** serves verified Quran data and privacy-preserving proxies. The site works fully without it.

| | |
|---|---|
| Frontend | HTML + CSS + native ES modules, no build step (GitHub Pages) |
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic, SQLite/PostgreSQL |
| Tests | 107 pytest · 62 Node unit · 130 Playwright end-to-end (+ live smoke tests) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

## Documentation

| Document | Contents |
|---|---|
| [docs/innovation_phase.md](docs/innovation_phase.md) | The innovation phase (2026-11-25): research, evaluated ideas, what was built and why, privacy |
| [docs/about_page.md](docs/about_page.md) | The «من أنا» page, its media (Al-Aqsa photo, nasheed) and autoplay behaviour; the rosary and prayer-learning reorganisation |
| [docs/evolution_audit.md](docs/evolution_audit.md) | Audit before the platform evolution: test baseline, findings and resolutions, content policy |
| [docs/technical_audit.md](docs/technical_audit.md) | Audit of the original site: features, defects, security, performance, SEO |
| [docs/feature_preservation_checklist.md](docs/feature_preservation_checklist.md) | Every reciter, page, dialog, icon and behaviour that must be preserved, with verification status |
| [docs/architecture.md](docs/architecture.md) | Technology choices and why, system design, data model, deployment topology |
| [docs/implementation_plan.md](docs/implementation_plan.md) | The prioritised plan that was executed |
| [docs/api.md](docs/api.md) | REST API reference |
| [docs/deployment.md](docs/deployment.md) | GitHub Pages, deploying the backend, connecting the two |
| [docs/security.md](docs/security.md) | Threat model and the controls in place |
| [docs/testing.md](docs/testing.md) | Test strategy, how to run every suite, latest results |
| [docs/completion_report.md](docs/completion_report.md) | What was done, verified and left open |

## Repository layout

```
index.html, about.html, 404.html, manifest.json,  ← the website (GitHub Pages serves the repo root);
sw.js, robots.txt, sitemap.xml, Quran.mp3, icon.png  about.html is the «من أنا» page
assets/css/main.css                              ← design tokens, light/dark themes, responsive layout
assets/js/main.js                                ← entry point
assets/js/core/                                  ← api (backend + public-API fallback), i18n, dialogs, storage, Arabic text…
assets/js/features/                              ← one module per feature (player, reader, prayer, adhkar, voice lab…)
assets/js/data/                                  ← surahs, reciters, adhkar, translations, Quran index (generated from backend
                                                   data), prayer lessons, academy courses, scholar resources
assets/fonts/, assets/icons/                     ← self-hosted Amiri & Cairo (OFL), PWA icons
assets/img/                                      ← original artwork: backdrop, pattern, icon source, prayer diagrams
backend/                                         ← FastAPI application, Alembic migrations, verified datasets, pytest suite
scripts/set_api_url.py                           ← connects the Pages site to a deployed backend
scripts/generate_artwork.mjs                     ← regenerates the artwork, prayer diagrams and PNG icons
scripts/build_quran_index.py                     ← regenerates the juz/page/sajda index from the dataset
scripts/export_learning_resources.mjs            ← exports scholar resources to the backend dataset
scripts/check_links.py                           ← checks external links, reciter audio and APIs (needs internet)
tests/                                           ← Node unit tests and Playwright end-to-end tests
render.yaml                                      ← one-click backend deployment on Render
docs/                                            ← documentation
```

## Run it locally

### Website only (exactly like GitHub Pages)

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000/>. With no backend, the site uses the public APIs, as the original did.

### Website + backend

Requires Python 3.11+.

```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env                  # optional; no secrets are needed
alembic upgrade head                  # create the schema
python -m app.cli seed                # import the verified datasets (refuses tampered files)
uvicorn app.main:app --reload         # http://127.0.0.1:8000  (site + /api/v1, docs at /api/docs)
```

In development the backend also serves the website, and the page detects it automatically on the same origin.

## Tests

```bash
cd backend && pytest && ruff check . && pip-audit -r requirements.txt
```

```bash
cd tests && npm ci && npx playwright install chromium && npm test
```

Details, including the live-deployment test, are in [docs/testing.md](docs/testing.md).

## Deployment in one paragraph

Merging into `main` publishes the website on GitHub Pages at the same URL as today; nothing else is required. To add the backend, deploy `backend/` to a Python host. A [Render blueprint](render.yaml) and a [Dockerfile](backend/Dockerfile) are included. Then run:

```bash
python3 scripts/set_api_url.py https://<your-api-host>
```

Commit `index.html`. The script updates the API address and the Content Security Policy together. If the backend is ever unreachable, the site silently falls back to the public APIs. See [docs/deployment.md](docs/deployment.md).

## Data sources and credits

- **Quran text:** Tanzil Uthmani text, via api.alquran.cloud (the source the site always used). It was verified against an independent Tanzil download; see `backend/scripts/build_datasets.py`.
- **Tafsir and translations:** Tafsir al-Muyassar, Sahih International (en), Cortés (es) and Hamidullah (fr), via api.alquran.cloud.
- **Recitations:** mp3quran.net (16 reciters) and cdn.islamic.network (Mishary Alafasy, per ayah).
- **Prayer times:** api.aladhan.com (method 8).
- **Fonts:** [Amiri](https://github.com/aliftype/amiri) and [Cairo](https://github.com/Gue3bara/Cairo), SIL Open Font License.
- **Artwork and prayer diagrams:** original vector work generated by `scripts/generate_artwork.mjs` for this project.
- **Prayer lessons:** summarised on the Hanbali classification explained by Sheikh Muhammad ibn Salih al-Uthaymeen in
  *al-Sharh al-Mumti'*, with the main differences between schools noted. Quran citations are rendered from the verified
  dataset; hadith are cited by collection with a search link to check them. The site issues no fatwas and does not
  represent any scholar.

Developed by Obada najeeb AL-Qaisee.
