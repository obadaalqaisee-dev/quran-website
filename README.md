# القرآن الكريم · The Noble Quran

**Live site:** <https://obadaalqaisee-dev.github.io/quran-website/>

A bilingual (Arabic-first, also English, Spanish and French) Quran platform:
- read the Mushaf in Uthmani script, with Tafsir al-Muyassar and translations;
- listen to 16 reciters, or to any single ayah;
- memorise with speech recognition (التسميع);
- prayer times with a live countdown and notifications;
- Hisn al-Muslim adhkar, an electronic rosary, the daily wird, favourites and a local profile.

The site is a static frontend served by **GitHub Pages**. An optional **Python (FastAPI) backend** serves verified Quran data and privacy-preserving proxies. The site works fully without it.

| | |
|---|---|
| Frontend | HTML + CSS + native ES modules, no build step (GitHub Pages) |
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic, SQLite/PostgreSQL |
| Tests | 91 pytest · 18 Node unit · 64 Playwright end-to-end (+1 live smoke test) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |

## Documentation

| Document | Contents |
|---|---|
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
index.html, 404.html, manifest.json, sw.js,      ← the website (GitHub Pages serves the repo root)
robots.txt, sitemap.xml, Quran.mp3, icon.png
assets/css/main.css                              ← design tokens, light/dark themes, responsive layout
assets/js/main.js                                ← entry point
assets/js/core/                                  ← api (backend + public-API fallback), i18n, dialogs, storage, Arabic text…
assets/js/features/                              ← one module per feature (player, reader, prayer, adhkar, voice lab…)
assets/js/data/                                  ← surahs, reciters, adhkar, translations (generated from backend data)
assets/fonts/, assets/icons/                     ← self-hosted Amiri & Cairo (OFL), PWA icons
backend/                                         ← FastAPI application, Alembic migrations, verified datasets, pytest suite
scripts/set_api_url.py                           ← connects the Pages site to a deployed backend
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

Developed by Obada najeeb AL-Qaisee.
