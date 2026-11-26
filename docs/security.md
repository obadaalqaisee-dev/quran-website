# Security

## Threat model

| Asset | Threat | Control |
|---|---|---|
| Integrity of the Quran text | Tampered datasets or a compromised upstream | Datasets are checksummed (SHA-256). The seed refuses mismatches; `app.cli verify` re-checks the database; tests pin known ayahs. The text was cross-verified against an independent Tanzil download. The backend never fetches Quran text at runtime. |
| Visitors' browsers | XSS through remote data (API text, search results) | Remote text is inserted only with `textContent` (the `h()` helper and `setText`). A test asserts that `innerHTML` appears only in the static i18n loader and in the DOM helper's documented static-markup option, which no feature module uses. The CSP blocks inline scripts. |
| Visitors' privacy | Location sent to third parties; tracking | With the backend, coordinates are rounded to about 1 km and proxied, so Aladhan never sees the visitor's IP or exact position. Personal data (profile, favourites, wird, bookmark) stays in the browser; there are no accounts or server-side user data. Google Analytics is retained from the original site (see *Residual risks*). |
| Backend availability | Abuse, scraping, expensive upstream calls | Per-IP rate limits (tighter on upstream-calling endpoints), upstream timeouts, caching, read-only SQLite, gzip. |
| Backend host | SSRF, injection, information leaks | Fixed upstream host allow-list (redirects included); Pydantic validation on every parameter; parameterised SQL with escaped `LIKE` wildcards; generic error messages; docs off in production; non-root container. |

## Controls in detail

### HTTP security headers (backend)
Implemented in `backend/app/core/security.py` and verified by `backend/tests/test_security.py`.

| Header | Value / scope |
|---|---|
| `Content-Security-Policy` (website) | `default-src 'self'`; scripts only from `'self'`, one SHA-256-hashed inline script (the theme initialiser, run before first paint) and Google Tag Manager. **No `unsafe-inline` and no `unsafe-eval`.** Styles and fonts `'self'` (fonts are self-hosted); explicit lists for `img-src`, `media-src` and `connect-src`; `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`. |
| `Content-Security-Policy` (API responses) | `default-src 'none'; frame-ancestors 'none'; base-uri 'none'` |
| `Strict-Transport-Security` | Production only: `max-age=63072000; includeSubDomains` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Permissions-Policy` | `camera=(), payment=(), usb=(), microphone=(self), geolocation=(self)`. The microphone is needed by the memorisation lab and geolocation by prayer times. |
| `Server` | Removed |

**On GitHub Pages**, which cannot set headers, the same CSP (minus `frame-ancestors`, which `<meta>` cannot carry) is delivered as `<meta http-equiv="Content-Security-Policy">`. A test asserts that the meta policy equals the backend policy, and another that every inline script's hash is listed. During testing, the CSP blocked an injected inline script, which confirms it is enforced.

### CORS
* Explicit origin allow-list (`CORS_ORIGINS`, production: `https://obadaalqaisee-dev.github.io`).
* `GET`/`OPTIONS` only, no credentials.
* `*` is rejected in production at start-up.

CORS sits outside the rate limiter, so even `429` responses are readable by the site. Tests cover the allowed origin, a foreign origin, preflight, and a disallowed method.

### Input validation
Every parameter has a type and range: surah 1–114, ayah 1–6236, search 2–100 characters, page size ≤ 50, coordinates in range, method 0–23. In addition:
* edition identifiers and reciter slugs come from allow-lists;
* city and country must match `^[\w\s.'-]{2,64}$` (no URL syntax);
* invalid input returns `422` with field-level details and no stack trace.

### SQL injection
* Every query goes through SQLAlchemy with bound parameters.
* Search escapes `%`, `_` and `\` before building the `LIKE` pattern.
* Tests submit `' OR 1=1 --`, `"; DROP TABLE ayahs; --`, `%%` and `__`: all are inert and the tables remain intact.

### SSRF
`UpstreamClient` only contacts `https://api.aladhan.com` and `https://www.mp3quran.net`, checks the final host after redirects (at most 3), and builds URLs from configuration plus validated parameters. Tests confirm that other hosts, `http://`, metadata IPs, `file://` and look-alike hosts are refused.

### CSRF
Not applicable. The API is read-only (`GET`), has no cookies and no authentication, so there is no ambient authority to abuse.

### Secrets and configuration
* The application needs no secrets.
* Configuration comes from environment variables; `backend/.env.example` documents them, and `.env*` is git-ignored.
* The Google Analytics measurement ID and the contact e-mail address are public by design.

### Dependencies
* **Python:** runtime dependencies are pinned in `backend/requirements.txt`, and `pip-audit -r requirements.txt` reports **no known vulnerabilities** (run on 2026-11-19 and in CI on every push).
* **Frontend:** no runtime dependencies (no npm packages ship to the browser). The test-only dev dependencies, Playwright and axe-core, are pinned by `tests/package-lock.json`.

### Frontend hardening
* `target="_blank"` links use `rel="noopener noreferrer"`.
* `localStorage` reads are wrapped so corrupt data cannot break the page (tested).
* The search query is URL-encoded.
* Remote URLs used for audio come only from the curated reciter list or from an `https://` server field returned for the reciter's verified ID.

## Residual risks and recommendations

1. **Rate limiting behind a proxy.** The limiter keys on the client IP that uvicorn derives from `X-Forwarded-For`. The Docker image trusts forwarded headers from any address (`--forwarded-allow-ips='*'`), which is right only when the container is reachable **solely** through the platform's proxy (true on Render). Even then, a client can prepend a fake `X-Forwarded-For` entry. Treat the in-app limiter as best effort and rely on the platform's DDoS and WAF protection for real abuse. For several instances, move the limiter to Redis (`core/rate_limit.py` exposes a small interface for that).
2. **Third-party scripts.** Google Tag Manager is allowed by the CSP because the original site used Google Analytics. Removing `assets/js/analytics.js` and the GTM entries from the CSP would remove the only third-party script; consider adding a consent notice if the audience requires it.
3. **Third-party content.** Audio, Pexels and Unsplash images, and the public APIs in fallback mode are loaded from third parties. Their availability and integrity are outside this project's control. Quran *text* is protected by the backend's verified copy whenever the backend is configured.
4. **GitHub Pages limits.** No custom headers: there is no `frame-ancestors` (the page can be framed) and no `Permissions-Policy` there.
5. **Service worker cache.** Cached Quran data is refreshed in the background (stale-while-revalidate). After a dataset correction, bump `VERSION` in `sw.js`.

## Platform evolution (2026-11-23)

No existing control was relaxed. The CSP is unchanged (the new artwork is same-origin; scholar links are plain
navigation, not loaded resources), and the static test still forbids inline scripts, inline handlers and style
attributes. New surfaces and how they are handled:

| Surface | Control |
|---|---|
| Lesson content, scholar resources, dashboard | Static data and on-device values only; rendered with `textContent` (the static test forbids `innerHTML` in feature modules). Progress bars use CSSOM `style.width`, which the CSP allows, not `style` attributes. |
| External links (dorar.net, sunnah.com, YouTube searches, official sites) | `target="_blank"` with `rel="noopener noreferrer"` (tested); https only (unit test). |
| Microphone | Opened only after an explicit tap on «اختبار المايك»; only a level meter reads it; nothing is recorded or uploaded; every track and the AudioContext are released when the test stops or the lab closes (tested). Speech recognition is the browser's own service (the interface says it may need internet). |
| `GET /api/v1/tafsir/search` | Edition allow-list, length limits, normalised query, parameterised `LIKE` with escaped wildcards; injection strings tested. |
| `GET /api/v1/learning/resources` | `topic` restricted to `^[a-z]{2,32}$`; data comes from a checksummed dataset that must contain https URLs only. |
| Datasets | `learning_resources.json` is in `checksums.json`; a tampered file is refused like every other dataset. |

## Innovation phase (2026-11-25)

* **Backup import is untrusted input.** `core/backup.js` accepts only this site's format and version. Only the
  site's own storage keys are written; any other key is skipped and reported, never stored. The file is capped at
  5 MB and each value at 2 MB, and JSON-valued keys must parse as JSON. Nothing is written before the visitor
  confirms, and existing keys absent from the file are kept.
* **Notes are rendered as text.** Notes and collection names, typed or imported, are inserted only with
  `textContent`. Lengths are capped (1,000 / 40 characters, 2,000 notes, 20 collections). The e2e suite checks that
  markup in a note is displayed literally.
* **No new network surface.** The new features make no requests, the CSP is unchanged, and the exported files are
  created locally with `Blob` URLs.
* **Rate limiter memory bound.** `SlidingWindowLimiter` previously evicted only idle clients. A flood from many
  distinct, active addresses could therefore grow its table beyond `max_keys`. It now also drops the least recently
  seen half when every tracked client is active (`test_limiter_memory_is_bounded_even_when_every_client_is_active`).
* **Site assistant.** Its answers come only from static strings and the verified data modules. It makes no AI or
  third-party call, and the optional Quran word search uses the existing Quran search endpoint. Typed questions are
  capped at 300 characters and rendered with `textContent` (an e2e test types markup and checks that it is shown as
  text). The CSP is unchanged.
