# Testing

## Strategy

| Layer | Tool | What it proves |
|---|---|---|
| Data integrity | pytest (`backend/tests/test_data_integrity.py`) | 114 surahs, 6,236 ayahs, per-surah counts equal to the Hafs numbering, contiguous IDs, exact known ayahs, no BOM, complete editions. A tampered or missing dataset is rejected. The seed is idempotent, and verification detects a modified ayah. |
| Backend API | pytest + FastAPI TestClient, upstream mocked with `httpx.MockTransport` (`test_api.py`) | Every endpoint: normal results, pagination, ETag/304, validation (`422`), upstream errors (`502`), timeouts (`504`), caching, coordinate rounding, search equivalence with the old upstream search, SQL-injection inertness. |
| Backend security | pytest (`test_security.py`) | Headers, CSP, HSTS in production, CORS allow/deny and preflight, `429` with `Retry-After` and CORS, separate upstream budget, SSRF guard, static-file allow-list (no `.git`, backend or docs), docs off in production, no internal details in `500` responses, Arabic normalisation. |
| Frontend logic | `node:test` (`tests/unit`) | Basmala handling on **all 114 surahs** against the real dataset; JS normalisation identical to Python on 891 ayahs; recitation matcher; surah filter; i18n completeness (238 keys × 4 languages); frontend data identical to backend data; WCAG contrast of every text colour pair in both themes. |
| Features (regression) | Playwright (`tests/e2e/features.test.mjs`) | Every row of the [preservation checklist](feature_preservation_checklist.md), against a server that behaves like GitHub Pages (static, `/quran-website/` sub-path, no backend), with third-party APIs answered from the verified datasets and real `Quran.mp3` audio. |
| Integration | Playwright + a real uvicorn backend (`backend.test.mjs`) | The production topology: Pages-like origin → backend on another origin via CORS (backend data used, public API not touched). Fallback when the backend rejects the origin or is down. Same-origin development mode with security headers. Prayer times through the backend proxy (real Aladhan). |
| Quality | Playwright + axe-core (`quality.test.mjs`) | No horizontal scrolling at 7 viewports (320–1920 px) in Arabic and English; dialogs fit; touch targets ≥ 40 px; axe WCAG 2.1 A/AA on the page in light and dark themes and on 8 dialogs; keyboard-only flow with focus return; manifest icon sizes; service worker and offline reading; no inline handlers or styles; CSP equal to the backend's; inline-script hash; module preload and precache lists complete; `rel=noopener`; SEO tags. |
| Live | Playwright, real network (`live.test.mjs`, opt-in) | A real deployment: real Quran text, tafsir and translation, **real audio playback**, real prayer times, service worker, no CSP violations. |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | Runs ruff, pytest, dataset/DB verification, pip-audit, and the unit and end-to-end suites on every push and pull request. |

## Running the tests

### Backend

```bash
cd backend
python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements-dev.txt
pytest                         # 91 tests
ruff check .                   # lint
pip-audit -r requirements.txt  # dependency vulnerabilities
```

### Frontend

Requires Node 22 and Python with `backend/requirements.txt` installed, because the e2e tests start the real backend.

```bash
cd tests
npm ci
npx playwright install chromium
npm run test:unit          # 18 tests
npm run test:e2e           # 64 tests (+ live.test.mjs, skipped unless LIVE_URL is set)
```

### Live deployment

```bash
LIVE_URL=https://obadaalqaisee-dev.github.io/quran-website/ node --test e2e/live.test.mjs
```

To rehearse the exact production URL before merging, map the Pages host to a local HTTPS server that serves this branch. The browser then loads `https://obadaalqaisee-dev.github.io/quran-website/`, but the request goes to your machine. The server needs a certificate for that host name (a self-signed one is fine).

```bash
LIVE_URL=https://obadaalqaisee-dev.github.io/quran-website/ LIVE_MAP_TO=127.0.0.1:8443 node --test e2e/live.test.mjs
```

Set `SCREENSHOT_DIR=/some/dir` when running `quality.test.mjs` to save screenshots of every viewport.

## Latest results (2026-11-23, reorganisation and «من أنا», `feature/reorganization-about-page`)

| Suite | Result |
|---|---|
| Backend pytest | **106 passed**, 0 failed |
| ruff · pip-audit | clean · no known vulnerabilities |
| Frontend unit (`node:test`) | **37 passed**, 0 failed |
| Playwright end-to-end | **101 passed, 0 failed**, 2 skipped (the same two internet-only tests as before); 14 new in `about.test.mjs` |

Existing tests that opened the two relocated entry points (the nav-bar rosary and the side-menu «تعلم الصلاة») were
**updated, not removed**. They now open the same features in their new places (the rosary tab of Hisn al-Muslim,
and the academy lesson), and they also assert that the old entry points are gone, as requested. The nasheed and
photo code paths are tested with test-only stand-in media; see `about_page.md` §3.

## Results of the platform evolution (2026-11-23, `feature/ultimate-quran-platform-evolution`)

Run in the development container; its network allows package registries only (see `evolution_audit.md` §3).

| Suite | Before (on `main`) | After |
|---|---|---|
| Backend pytest | 91 passed | **106 passed**, 0 failed (15 new in `test_learning.py`) |
| ruff | clean | clean |
| pip-audit (runtime requirements) | — | no known vulnerabilities |
| Database: `alembic upgrade head` → `seed` → `verify` (fresh SQLite) | — | passed; also upgrade from a populated 0001 database, downgrade to 0001, and `alembic check` (no model drift) |
| Frontend unit (`node:test`) | 18 passed | **37 passed**, 0 failed (19 new in `evolution.test.mjs`) |
| Playwright end-to-end | 62 passed, **1 failed**, 2 skipped | **87 passed, 0 failed**, 2 skipped (24 new in `evolution.test.mjs`) |
| Link check (`scripts/check_links.py`) | — | not runnable here (no internet: 0/50 reachable through the proxy); runs weekly and on demand in `.github/workflows/link-check.yml` |

The previously failing test was a real defect (an upstream 502 marked the whole backend as down), now fixed. The two
skips need the internet: `live.test.mjs` (needs `LIVE_URL`) and the live-Aladhan proxy test. No test was removed,
skipped or weakened; the only change to an existing test stubs the backend's prayer-times answer in the browser so
that the production-topology test no longer depends on Aladhan being reachable.

## Earlier results (2026-11-19)

| Suite | Result |
|---|---|
| Backend pytest | **91 passed**, 0 failed |
| ruff | clean |
| pip-audit (runtime requirements) | no known vulnerabilities |
| Frontend unit (`node:test`) | **18 passed**, 0 failed |
| Playwright end-to-end (features 33 · integration 4 · quality 27) | **64 passed**, 0 failed; 1 skipped (`live.test.mjs` runs only with `LIVE_URL`) |
| Live test, new build on a Pages-like static server, real network | passed (real audio played, real tafsir and prayer times) |
| Live test, rehearsal at `https://obadaalqaisee-dev.github.io/quran-website/` mapped to this branch over HTTPS, real network | passed. The service-worker assertion is skipped in this mode because Chrome refuses service workers on a self-signed certificate; SW and offline behaviour are covered by `quality.test.mjs`. |
| Live test, the **actual** GitHub Pages URL today | fails **as expected**: Pages still serves the original site from `main` (for example, the reciter `<option>` values are the old URLs). It must pass after the merge. |
| GitHub Actions CI run #1 on `Obada_Ub` | success (both jobs) |
| Docker image | built and run successfully: the database was seeded and verified during the build, the container runs as a non-root user, and `/api/v1/health` returned ok |

### Performance (Playwright + Chrome DevTools Protocol)

Median of 3 runs on a 390×844 viewport. Both sites were served with gzip (as GitHub Pages does) and called the real third-party APIs. Images and analytics were blocked identically for both, because the sandbox cannot reach them. "Slow 4G" means 150 ms latency and 1.6 Mbit/s.

| | First paint | All 114 surahs visible | Transferred | Requests |
|---|---|---|---|---|
| Original, fast | 124 ms | 1,017 ms | 232 KB | 11 |
| **New, fast** | 124 ms | **242 ms** | 245 KB | 38 |
| Original, slow 4G | 428 ms | 2,443 ms | 232 KB | 11 |
| **New, slow 4G** | 448 ms | **1,958 ms** | 245 KB | 38 |

How to read this:
* The new site lists all surahs 4× sooner on a fast connection and 20 % sooner on slow 4G, because the list no longer waits for an API call or a 700 ms timer.
* First paint is at parity.
* The new byte count includes the self-hosted fonts (the original downloaded them from Google) and the service worker's one-time precache of the app shell.
* There are more requests because of the ES modules (no bundler, by design), and they are fetched in parallel through `modulepreload`.

An earlier measurement before the performance commit showed a slower first paint (1,084 ms on slow 4G). Font preloads were competing with the CSS; that is fixed.

### Accessibility (axe-core 4.10, WCAG 2.1 A/AA)

0 violations on the page in both themes and in 8 dialogs. axe reports colour contrast as "incomplete" (not assessable) only for icon-only glyphs (☰, ☆, emoji) and one gradient badge. Text contrast is also checked numerically by `tests/unit/contrast.test.mjs` for every token pair.

## Known limitations of the test suite

* **Speech recognition and notifications are faked in the browser tests.** They verify the app's logic (matching, revealing ayahs, scheduling and wording of notifications), not the browser's microphone or the operating system's notification centre. Notification timing is tested with Playwright's controllable clock, including a jump past prayer time without intermediate ticks, as happens in a throttled background tab.
* **Only Chromium is automated.** Firefox and Safari were not tested. Safari's support for `<dialog>`, ES modules and the Media Session API is present in current versions, but has not been verified here.
* **No real screen-reader testing** (VoiceOver, NVDA): axe and keyboard tests are not a substitute.
* **The deployed backend was not tested**, because no hosting account was available. The container, the production configuration and the cross-origin topology were tested locally.
* **Upstream behaviour in the e2e suites is simulated** from the verified datasets. The live test covers the real services.
