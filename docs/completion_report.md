# Completion Report: Modernisation of The Noble Quran Website

* **Branch:** `Obada_Ub` (based on `main` @ `f4c9b53`; not merged into `main`)
* **Date:** 2026-11-19
* **Status legend:** ✅ implemented **and** verified by tests · 🟡 implemented, verified only partly or locally · 📋 planned or documented, not done

## 1. What the original project contained

* A single 166 KB `index.html` (markup, CSS, JS, 4-language strings, adhkar data), plus `manifest.json`, an unregistered `sw.js`, a 709 KB non-square `icon.png` and an unreferenced `Quran.mp3` (Al-Fatihah by Abu Bakr Al-Shatri).
* No backend, tests, documentation or dependency management.
* Deployed by GitHub Pages from the root of `main`.
* About 28 features, including 16 reciters, the reading view with tafsir and translation, the memorisation lab, prayer times, Hisn al-Muslim, the rosary, searches, the profile, favourites and the daily wird. Full inventory: [feature_preservation_checklist.md](feature_preservation_checklist.md).

## 2. Problems discovered

Details are in [technical_audit.md](technical_audit.md). Main problems, all **confirmed in a browser**, several on the live site:

| # | Problem | Status now |
|---|---|---|
| 1 | Memorisation lab crashed on every speech result (`getSkeleton` undefined) | ✅ fixed |
| 2 | **Basmala shown twice** for surahs 2–114 (except 9), presenting it as part of ayah 1 (Unicode-order mismatch) | ✅ fixed; tested on all 114 surahs |
| 3 | Arabic surah filter returned nothing; English needed the exact transliteration | ✅ fixed |
| 4 | Prayer notifications promised but never sent | ✅ fixed (sent while the site is open) |
| 5 | Daily wird reset at UTC midnight | ✅ fixed (local date) |
| 6 | Prayer names and next-prayer highlight lost on language change; language not remembered; many untranslated strings; ES/FR labels left in English; truncated translations | ✅ fixed |
| 7 | Service worker never registered; PWA icons the wrong size | ✅ fixed (offline reading tested) |
| 8 | Silent fetch failures ("Loading…" forever) | ✅ error messages with retry |
| 9 | `innerHTML` with remote data; unencoded search query; no CSP possible (59 inline handlers) | ✅ fixed; strict CSP |
| 10 | Accessibility: dialogs not keyboard/screen-reader friendly, unreachable controls, low-contrast gold text | ✅ fixed (axe 0 violations, contrast unit-tested) |
| 11 | Artificial 700 ms start-up delay; oversized icon | ✅ fixed |

## 3. Architecture decisions

Details are in [architecture.md](architecture.md).

* **The frontend stays static on GitHub Pages at the same URL**, with vanilla HTML, CSS and ES modules and no build step. React/Next.js would add a build pipeline (and, for SSR, a Node host) without a user-visible benefit for a site of this size, and the hosting requirement rules out server rendering.
* **Backend: Python / FastAPI** (rather than Django). It is a read-mostly JSON API plus validated, cached proxies; Django's admin, auth and templates would be unused weight.
* **SQLite by default, PostgreSQL-ready** (SQLAlchemy 2 + Alembic). The data is read-only reference data.
* **Progressive enhancement:** the site uses the backend when one is configured and otherwise, or whenever the backend fails, the original public APIs. The site can never be broken by the backend.
* **No user accounts.** Personal data stays in the browser under the original storage keys, so existing visitors keep their data.

## 4. Frontend improvements ✅

* **Code structure:** 26 ES modules (core / features / data). All 12 dialogs and the drawer use native `<dialog>`, which gives focus trapping, Escape to close and focus return. There are no inline handlers or styles.
* **Design:** a new token-based design system with light and dark themes (following the system on the first visit) and WCAG-AA colour pairs. Header with a scrollable nav strip on phones, the same emoji icon set in consistent buttons, cards, and a refined reading view.
* **Quran reading:** Amiri, adjustable font size (remembered), basmala shown once, keyboard-operable ayahs, tafsir and translation under the ayah, retry on errors.
* **Audio:** the original URLs are played first. Fallback goes by verified reciter ID (1.7 KB request instead of 167 KB), with `Quran.mp3` as a last resort for Al-Fatihah. Also new: playback speed, a persistent mini player, and lock-screen controls through the Media Session API.
* **Responsive:** verified at 320, 360, 390, 768, 1024, 1366 and 1920 px with no horizontal scrolling, and touch targets of at least 40 px.
* **SEO:** canonical URL, OG and Twitter tags, JSON-LD `WebSite`, `robots.txt`, `sitemap.xml`, one `h1`, a `noscript` message, and `404.html`.
* **PWA:** correct icons, a working service worker, offline app shell, and offline reading of previously opened surahs.

## 5. Backend ✅ (🟡 not deployed)

* FastAPI app with this structure: `core/` (config, security headers, rate limit, cache, errors, logging), `db/`, `models/`, `schemas/`, `repositories/`, `services/`, `api/v1/`, `cli.py`, an Alembic migration, and the Dockerfile.
* **Endpoints:** health, surahs, surah detail, ayah editions, editions, search (paginated), reciters, audio resolution, prayer times, adhkar. See [api.md](api.md).
* **Verified datasets:** the Quran text was cross-checked against an independent Tanzil download. 6,234 of 6,236 ayahs have an identical letter skeleton; the 2 exceptions (12:39, 12:41) are a documented encoding variant of the same word. Data is SHA-256 checksummed; the seed is transactional and idempotent; provenance is recorded.
* **Search:** returned the same results as the public search the site used before, on all 8 sample queries.
* **🟡 Deployment:** a Render blueprint and the Dockerfile are ready. The image was **built and run** successfully here, but **no backend is deployed**: that needs your hosting account. The site is fully functional without it.

## 6. Security ✅

Details are in [security.md](security.md).

* Strict CSP with no `unsafe-inline` or `unsafe-eval` (one hash-allowed inline script). It is enforced on Pages by a meta tag and in the backend by a header, and a test keeps the two identical.
* HSTS (production), nosniff, frame denial, Referrer-Policy, COOP and Permissions-Policy.
* CORS allow-list limited to the Pages origin, with no wildcard allowed in production.
* Per-IP rate limits, with a tighter budget for endpoints that call third parties.
* Pydantic validation on every parameter, parameterised SQL with escaped wildcards, and an SSRF host allow-list (redirects included).
* Generic error responses; docs and static serving off in production; a non-root container.
* No secrets anywhere; `.env.example` documents the configuration.
* `pip-audit` finds no known vulnerabilities.
* Residual risks are documented, notably that rate limiting behind a proxy is best effort.

## 7. Performance ✅

Measured; the method is in [testing.md](testing.md). With gzip, as GitHub Pages serves it:
* the surah list appears 4× sooner on a fast network (242 ms vs 1,017 ms) and 20 % sooner on slow 4G (1,958 ms vs 2,443 ms);
* first paint is at parity (448 ms vs 428 ms on slow 4G);
* transfer is comparable (245 KB vs 232 KB, now including self-hosted fonts and the offline precache);
* the 114 surahs render with no network request;
* fonts are self-hosted and loaded per script with `unicode-range`;
* the module graph is preloaded in parallel;
* icons shrank from 709 KB to 2–110 KB.

## 8. Database ✅

Tables: `surahs`, `ayahs` (Uthmani, simple, normalised search text, juz, page, hizb, sajda), `editions`, `ayah_texts` (24,944 rows), `reciters`, `adhkar`, `data_imports`. The schema has foreign keys, unique and check constraints and indexes; it is migrated with Alembic and verifiable with `python -m app.cli verify`.

## 9. Preserved features ✅

**Every** item in the checklist is present and verified:
* all 16 reciters, with their original URLs and order;
* all navigation items, side-menu items, sections and dialogs;
* all icons;
* the 36 adhkar, verbatim;
* all 4 languages, with the original strings;
* the Learn-the-Prayer and Message-of-Islam content;
* footer credits and social links;
* Google Analytics;
* the original storage keys and formats.

Deliberate *presentation* changes (header layout, language labels, corrected translations, the basmala fix and others) are listed in §I of the [checklist](feature_preservation_checklist.md).

## 10. Testing results ✅

| Suite | Result |
|---|---|
| Backend pytest | 91/91 passed |
| ruff | clean |
| pip-audit | clean |
| Frontend unit | 18/18 passed |
| Playwright end-to-end | 64/64 passed |
| Live test, real services, new build | passed |
| Live test, rehearsal at the exact production URL (HTTPS) | passed |
| GitHub Actions CI on `Obada_Ub` | passed |

Details and limitations: [testing.md](testing.md).

## 11. Remaining limitations

* 🟡 **The new version is not live yet.** The Pages URL serves `main`, and the branch must be merged by you (you asked me not to merge). Its live test is ready (`LIVE_URL=… node --test e2e/live.test.mjs`); until the merge it fails as expected against the old site.
* 🟡 **The backend is not deployed** (no hosting account). The site works without it.
* 🟡 **Speech recognition and notifications** were tested with browser fakes. Real microphone and operating-system behaviour were not automated. Notifications fire only while the site is open; true background push would need a push service and server, which is not built.
* 🟡 **Only Chromium was automated**; Safari and Firefox were not tested. There was no screen-reader session (VoiceOver/NVDA).
* 🟡 **Third-party dependence remains** for audio (mp3quran, islamic.network), images (Pexels, Unsplash) and analytics (Google), and for Quran text/tafsir whenever no backend is configured.
* 🟡 **Rate limiting** is per process and keyed on IP; it is best effort behind proxies (see the security notes).
* 📋 **Possible next steps:** deploy the backend and connect it (`scripts/set_api_url.py`); add server-side push for prayer notifications; add more tafsir and translation editions (the schema supports them); test on Safari and Firefox; consider removing Google Analytics or adding a consent notice.

## 12. Deployment requirements

See [deployment.md](deployment.md). In short:
1. Merge `Obada_Ub` into `main`. GitHub Pages republishes the same URL, with no settings change.
2. Run the live test against the Pages URL.
3. Optionally deploy `backend/` (Render blueprint or Docker), then run `python3 scripts/set_api_url.py https://<api-host>`, commit and merge.

## 13. Git

All commits are on `Obada_Ub`: <https://github.com/obadaalqaisee-dev/quran-website/tree/Obada_Ub>. The commit list is in `git log main..Obada_Ub`.
