# Deployment

```
https://obadaalqaisee-dev.github.io/quran-website/   ← GitHub Pages (the website; required)
        │ HTTPS + CORS
        ▼
https://<your-api-host>/api/v1/…                      ← Python backend (optional, recommended)
```

The website **must** stay on GitHub Pages at its current URL. The backend is an enhancement: whenever it is missing, down, or misconfigured, the site uses the original public APIs instead. The test suite checks this.

## 1. GitHub Pages (the website)

Verified during the audit: GitHub Pages builds this repository from the **root of `main`** ("pages build and deployment" workflow). The live `index.html` was byte-identical to `main:index.html`.

To publish this version:
1. Open a pull request from `Obada_Ub` into `main`, review it, and merge it.
2. GitHub rebuilds Pages automatically, usually within 1–2 minutes. No settings change is needed:
   * the site still lives at the repository root;
   * every path is relative, so it works under `/quran-website/`;
   * `.nojekyll` makes Pages serve the files exactly as they are.

Then verify the live site:

```bash
cd tests && npm ci && npx playwright install chromium
```

```bash
LIVE_URL=https://obadaalqaisee-dev.github.io/quran-website/ node --test e2e/live.test.mjs
```

That test loads the real URL with the real third-party services. It checks:
* 114 surahs and the 16 reciters;
* real Quran text with the basmala shown once, plus tafsir and translation;
* that real audio actually plays;
* real prayer times;
* the service worker;
* no backend probe on `github.io`;
* no CSP violations.

**Rollback:** revert the merge commit on `main`; Pages redeploys the previous version.

> **Before the merge,** the same test can be rehearsed against the exact production URL by mapping the Pages host to a local HTTPS server that serves this branch (`LIVE_MAP_TO`; see `tests/e2e/live.test.mjs`). That is how this branch was verified; see [testing.md](testing.md).

### What GitHub Pages cannot do, and how it is handled

| Limitation | Handling |
|---|---|
| No custom HTTP headers | The Content Security Policy is shipped as a `<meta http-equiv>` tag. `frame-ancestors` and HSTS cannot be set this way. Pages already serves HTTPS, and HSTS applies to all of `github.io`. |
| No server code | All server logic lives in the separate backend. |
| The whole repository is public | `backend/`, `docs/` and `tests/` are also reachable on Pages. They contain no secrets, and `robots.txt` asks crawlers to skip them. |

## 2. Backend (Python)

### Option A: Render (blueprint included)

1. Go to <https://dashboard.render.com>, then **New → Blueprint**, and select this repository and branch. Render reads `render.yaml`.
2. Render builds `backend/Dockerfile`. The image build runs the migrations and imports the verified datasets; the build **fails** if any checksum does not match.
3. The service starts with `ENVIRONMENT=production` and `CORS_ORIGINS=https://obadaalqaisee-dev.github.io`.
4. When it is live, check it:

```bash
curl https://<service>.onrender.com/api/v1/health
```

Note: Render's free plan sleeps after inactivity, so the first request can take tens of seconds. The site does not wait for it: it gives the backend 3 s, then uses the public APIs. Use a paid instance for a backend that is always on.

### Option B: any container host (Fly.io, Railway, Cloud Run, a VPS)

```bash
docker build -t quran-api backend/
```

```bash
docker run -p 8000:8000 -e CORS_ORIGINS=https://obadaalqaisee-dev.github.io quran-api
```

Put it behind HTTPS: either the platform's TLS, or a reverse proxy such as Caddy or Nginx with Let's Encrypt. The container:
* runs as a non-root user;
* exposes a `HEALTHCHECK`;
* honours `$PORT` and `$WEB_CONCURRENCY`.

### Option C: without Docker

```bash
cd backend
pip install -r requirements.txt
export ENVIRONMENT=production CORS_ORIGINS=https://obadaalqaisee-dev.github.io
alembic upgrade head && python -m app.cli seed
gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 2 -b 0.0.0.0:8000 --forwarded-allow-ips='127.0.0.1'
```

### Configuration (environment variables)

| Variable | Default | Notes |
|---|---|---|
| `ENVIRONMENT` | `development` | `production` turns on HSTS and turns off `/api/docs` and static serving |
| `DATABASE_URL` | `sqlite:///backend/quran.sqlite3` | e.g. `postgresql+psycopg://user:pass@host/db` (install `psycopg[binary]`) |
| `CORS_ORIGINS` | `https://obadaalqaisee-dev.github.io` | Comma-separated; `*` is rejected in production |
| `ENABLE_DOCS` | off in production | Interactive docs at `/api/docs` |
| `SERVE_STATIC` | off in production | Serve the website from the backend (local development) |
| `RATE_LIMIT_WINDOW_SECONDS` / `RATE_LIMIT_DEFAULT` / `RATE_LIMIT_UPSTREAM` | 60 / 240 / 30 | Per client IP |
| `UPSTREAM_TIMEOUT_SECONDS` | 8 | Aladhan and mp3quran calls |
| `LOG_LEVEL` | `INFO` | |

The application needs **no secrets**. `backend/.env.example` documents every variable; never commit a real `.env`.

### Database

* **SQLite (default):** the reference data is read-only and about 10 MB. The Docker image builds it at build time, so every deploy is reproducible and verified.
* **PostgreSQL:** set `DATABASE_URL`, then run `alembic upgrade head` and `python -m app.cli seed`. `python -m app.cli verify` compares the database with the checksummed datasets at any time.
* **Migrations:** `alembic revision --autogenerate -m "…"`, review the generated file, then `alembic upgrade head`.
* **Backups:** the database holds only reproducible reference data (visitors' data stays in their browsers). Re-seeding *is* the recovery procedure. For PostgreSQL, the platform's snapshots are enough.

## 3. Connect the website to the backend

```bash
python3 scripts/set_api_url.py https://<your-api-host>
```

```bash
git commit -am "Use the production API" && git push
```

The script updates `<meta name="quran-api">` **and** the CSP `connect-src` in `index.html` together, and accepts only `https://` URLs. Merge the change into `main`; after the Pages rebuild, the site uses the backend.

To return to public-API mode, run `python3 scripts/set_api_url.py auto`.

Check that the connection works:
1. Open the site, then DevTools → Network: requests to `https://<your-api-host>/api/v1/surahs/…` should return `200` with `access-control-allow-origin: https://obadaalqaisee-dev.github.io`.
2. Stop the backend: the site keeps working through the public APIs.

## 4. Operational notes

* **Rate limiting** is per process, keyed on the client IP. Behind a proxy, start uvicorn/gunicorn with `--forwarded-allow-ips` set to the proxy's address so the real client IP is used. Running several instances needs a shared store (Redis) to keep limits global; see [security.md](security.md).
* **Logs** go to stdout, one line per event. Uvicorn's access log, which contains IPs, is set to WARNING.
* **Updating the Quran datasets:** run `python scripts/build_datasets.py --download --tanzil <tanzil-uthmani.txt>`, review the diff of `checksums.json`, then redeploy.
