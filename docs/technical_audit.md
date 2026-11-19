# Technical Audit: The Noble Quran Website (original version)

| Item | Value |
|---|---|
| Audited revision | `f4c9b53` on `main` (24 commits, 2026-09-26 → latest) |
| Audit date | 2026-11-19 |
| Method | Read every file in full, ran the original site in headless Chromium (Playwright), probed every external endpoint, and downloaded and cross-checked the Quran data against an independent source |

Everything marked **Verified** below was reproduced during the audit. Anything not verified is marked **Inferred**.

---

## 1. What the repository contained

| File | Size | Purpose | Notes |
|---|---|---|---|
| `index.html` | 166 KB, 3,040 lines | The entire application: markup, ~430 lines of CSS, ~1,600 lines of JS, all four languages of i18n strings, the adhkar data set | Every second line is blank (an upload artefact). It mixes a first version and an "enhancements" layer that monkey-patches the first (`window.displaySurahs = …`, `window.saveBookmark = …`). |
| `manifest.json` | 683 B | PWA manifest | Declares `icon.png` as both 192×192 and 512×512, but the file is 678×657 (not square, wrong sizes). |
| `sw.js` | 302 B | Service worker | **Never registered** by `index.html` (Verified: `navigator.serviceWorker.getRegistration()` → `undefined`). Its `fetch` handler is a no-op, so it would provide no offline support even if it were registered. |
| `icon.png` | 709 KB | App icon | Only referenced by the manifest. 709 KB is ~100× larger than an icon needs to be. |
| `Quran.mp3` | 744 KB | ID3: "001 - Al-Fatihah", artist "Abu Bakr Al Shatri" | **Not referenced anywhere.** An orphaned asset. |
| `README.md` | 15 B | `# quran-website` | No documentation. |

There was no backend, no build tooling, no tests, no `.gitignore`, no dependency manifest, and no CI. The site is deployed with **GitHub Pages** from the repository root (`https://obadaalqaisee-dev.github.io/quran-website/index.html`, according to the canonical tag).

Git history consists mostly of "Add files via upload" and "Update index.html" commits. Several commit messages ("Update print statement from 'Hello' to 'Goodbye'") do not describe their contents.

---

## 2. Functional audit

### 2.1 Feature-by-feature

| # | Feature | How it works | Status |
|---|---|---|---|
| F1 | Surah list (114) | `fetch(api.alquran.cloud/v1/surah)` → cards with 🎧 / 📖 / ☆ | Works. **Delayed:** loading only starts at `window.load` + 700 ms (`setTimeout(initEnhanced, 700)`). Measured 1.9 s until the cards appear on a fast connection. |
| F2 | Surah filter box | `allSurahs.filter(s => s.name.includes(term) …)` | **Bug (Verified):** `s.name` is fully vowelled (`سُورَةُ ٱلْفَاتِحَةِ`), so any unvowelled Arabic input returns **0 results** (`الفاتحة` → 0, even `سورة` → 0). English works only with the exact API transliteration (`Faatiha` → 1, `Fatiha` → 0). |
| F3 | Surah audio player, 16 reciters | `<select>` of server base URLs, `base + 001.mp3` | Works. All 16 links verified (surah 1 and 114 each, 32/32 HTTP 206 `audio/mpeg`). All now 301-redirect to `cdn.mp3quran.net`. |
| F4 | Reciter fallback | `onerror`: downloads the **entire** mp3quran reciter list (167 KB) and fuzzy-matches the reciter name | Works but is wasteful and fragile (name matching). |
| F5 | Previous / Next / Surah-loop, auto-advance on end | `audio.ended` → `nextSurah()` unless looping | Works. |
| F6 | Reading view | `api.alquran.cloud/v1/surah/{n}/quran-uthmani`; meant to strip the basmala from ayah 1 (except surah 1); hides the basmala header for 1 and 9 | **Bug (Verified on the live site, found during implementation):** the stripping compares against a literal whose combining marks are in a different Unicode order (fatha+shadda versus the source's shadda+fatha), so it never matches. The basmala is therefore shown **twice** for surahs 2–114 (except 9): once in the header and again as part of ayah 1 (e.g. «بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ الٓمٓ ﴿1﴾»), which wrongly presents it as part of 2:1. The same bug affects the memorisation lab. Ayah spans are clickable but **not keyboard-accessible**. |
| F7 | Per-ayah audio (Mishary Alafasy) + ayah loop | `cdn.islamic.network/quran/audio/128/ar.alafasy/{global}.mp3` | Works (Verified 206). |
| F8 | Tafsir al-Muyassar (Arabic UI only) + translation (en.sahih / es.cortes / fr.hamidullah) | Two fetches per ayah click | Works. Fetch errors are silently swallowed, leaving "Loading..." on screen forever. |
| F9 | Bookmark ("last read") + resume banner | `localStorage.quranBookmark` | Works. `JSON.parse` has no try/catch, so corrupt storage breaks the page. |
| F10 | Ayah search | `api.alquran.cloud/v1/search/{query}/all/quran-simple-clean`, top 20, click → reading view at that ayah | Works. **The query is not URL-encoded**, and API text is injected with `innerHTML`. |
| F11 | Memorisation lab (التسميع) | Web Speech API (`ar-SA`), compares speech to the expected ayah | **Broken (Verified):** `getSkeleton` is called but never defined, so every recognition result throws `ReferenceError: getSkeleton is not defined`. A `normalizeText` helper was written but never connected. |
| F12 | Prayer times | Geolocation → `api.aladhan.com/v1/timings?lat&lng&method=8`; fallback is Amman (`timingsByCity`) | Works. Two renderers compete: `renderEnhancedPrayer` (Arabic names only, highlights the next prayer) and `renderPrayerTimes` (localised, no highlight), so switching language loses the highlight. Subtitle strings are hard-coded in Arabic. |
| F13 | Next-prayer countdown | `setInterval` every 1 s | Works. Prayer names are always Arabic. |
| F14 | Hijri date | `Intl` (`ar-SA-u-ca-islamic`), then overwritten by the Aladhan response | Works. |
| F15 | Prayer notifications | `Notification.requestPermission()` | **Incomplete:** the toast says notifications are enabled, but **no code ever sends one**. |
| F16 | Daily wird (4 checkboxes + progress bar) | `localStorage.dailyWird[YYYY-MM-DD]` | **Bug:** the date key uses `toISOString()` (UTC), so the day resets at 03:00 local time in Jordan instead of at midnight. |
| F17 | Favourite surahs | `localStorage.favoriteSurahs` | Works. |
| F18 | Local profile (name, goal, stats, reset) | `localStorage.islamicProfile` | Works. The reset confirmation is Arabic-only. |
| F19 | "Islamic search" (surahs + adhkar + Message of Islam) | Client-side substring search with Arabic normalisation | Works. When the query is empty it shows the *favourites* empty-state text (wrong message). |
| F20 | Hisn al-Muslim adhkar, 5 categories with tap counters | Static JS data; click decrements the counter | Works. Not keyboard-operable (`div` with `onclick`). |
| F21 | Electronic rosary (المسبحة) | Counter + vibration + reset | Works. The count is lost on reload. Labels are Arabic-only. |
| F22 | Learn the Prayer (5 illustrated steps + YouTube link) | Static modal | Works. The images (Pexels) are hot-linked. |
| F23 | Message of Islam (3 sections) | Static modal | Works. The EN/ES/FR text is truncated with "…" (only the first sentence was translated). |
| F24 | Login / Donate / Contact modals | Static; login explains that data is local | Works. |
| F25 | Four languages (ar/en/es/fr), RTL/LTR switch | `data-i18n` + `innerHTML` | Works. The choice is **not persisted**. Many strings are hard-coded in Arabic (player states, toasts, rosary, memorisation lab). ES/FR nav labels for rosary, ayah search and memorisation lab are in English. |
| F26 | Dark mode | `body.dark-mode`, persisted | Works. The dark preference of the OS is ignored on the first visit. |
| F27 | Scroll-to-top button | `window.onscroll` | Works (touches the DOM on every scroll event). |
| F28 | Google Analytics (G-PMNKGK1Y97) | Inline `gtag` | Works. The inline script prevents a strict CSP. |

### 2.2 Data-source verification

* **Quran text** (`quran-uthmani` from api.alquran.cloud, the same source the site has always displayed) was downloaded in full: 114 surahs, **6,236 ayahs**. It was compared ayah-by-ayah with Tanzil's current Uthmani text (tanzil.net, an independent download):
  * The differences are encoding conventions (tatweel `U+0640`, small low/high meem `U+06ED`/`U+06E2`, and hamza written as `ءَا` versus `ـَٔا`), all differences between Tanzil text versions.
  * After normalising diacritics and those conventions, the letter skeleton (rasm) is **identical for 6,234/6,236 ayahs**. The remaining two (12:39 and 12:41, «يَـٰصَـٰحِبَىِ») encode the same word with a different dagger-alef representation. **No wording differences were found.**
* **Search text** (`quran-simple-clean`) matches Tanzil simple-clean except for 7 spacing variants (`بعدما` / `بعد ما`) and a leading BOM on 1:1.
* **Reciters:** all 16 base URLs map 1-to-1 onto mp3quran.net reciters, each with all 114 surahs of the Ḥafṣ ʿan ʿĀṣim *murattal* recitation (IDs recorded in `backend/app/data/reciters.json`).
* **Tafsir / translations:** `ar.muyassar`, `en.sahih`, `es.cortes` and `fr.hamidullah` all respond with 6,236 entries.

---

## 3. Frontend audit

| Area | Findings |
|---|---|
| Architecture | One 166 KB file. Global functions, 59 inline `onclick=` attributes, monkey-patching, duplicated renderers (two `displaySurahs`, two prayer renderers), `window.*` globals for state. Hard to change safely. |
| CSS | Reasonable custom-property theme, but half of it is minified into one line, there are many inline `style=""` attributes, and spacing and type scales are inconsistent. |
| Design | Busy navbar (11 items, coloured emoji buttons). On mobile the navbar stacks into a tall block of wrapped links. Emoji are used as icons, so they render differently on each OS. |
| Responsiveness | No horizontal overflow at 390 px (Verified), but the nav takes about 40 % of the first mobile screen and the hero is 650 px tall. |
| Accessibility | Modals lack `role="dialog"`, `aria-modal`, focus management, and Escape-to-close (only 3 of 12 modals close on backdrop click). Ayah spans, adhkar cards and the rosary are `div`/`span` with `onclick`, so they are unreachable by keyboard. Gold `#c0964b` on white has a contrast ratio of ≈2.8:1 (fails WCAG AA). There are no skip link, no focus styles, and no `prefers-reduced-motion` support. |
| Loading & error states | Fetch failures are often silent (tafsir/translation stay on "Loading..."). Several messages are hard-coded in Arabic. |
| Browser support | The Web Speech API exists only in Chromium-based browsers and Safari (handled: the microphone is hidden). |

## 4. Backend & data audit

* There is **no backend**. The browser calls 5 third-party origins directly: `api.alquran.cloud`, `www.mp3quran.net`, `api.aladhan.com`, `cdn.islamic.network`, and `server6–13.mp3quran.net` → `cdn.mp3quran.net`.
* This creates a single point of failure. If `api.alquran.cloud` is down, the Quran text, search, tafsir and the surah list all disappear.
* Privacy: the user's precise GPS coordinates are sent from the browser to a third party (Aladhan).
* There is no caching layer: each ayah click makes 2 network calls, and each reciter error downloads 167 KB.

## 5. Security audit

| Check | Result |
|---|---|
| Secrets / credentials in code | None found. The GA measurement ID is public by design. The contact e-mail address is intentionally public (spam exposure is accepted). |
| XSS | `innerHTML` is used with API data (search results `match.text`, surah names, adhkar) and with i18n strings. All sources are currently trusted, but a compromised or modified upstream response would execute in the page. **Medium risk.** |
| Injection into URLs | The ayah-search query is interpolated into a URL path without `encodeURIComponent` (`/`, `?` and `#` change the request). **Low.** |
| CSP / security headers | None. Inline scripts and handlers make a CSP impossible without a refactor. GitHub Pages cannot set headers. |
| `target="_blank"` | Social links lack `rel="noopener noreferrer"`. **Low.** |
| CSRF / SQLi / auth | Not applicable: there is no server, no database and no authentication. |
| Storage | `localStorage` only (profile name, goal, favourites, wird, bookmark): non-sensitive, device-local. `JSON.parse` without guards means corrupt data breaks the page (availability). |
| Dependencies | No package dependencies. Third-party script: Google Tag Manager. |
| Rate limiting | N/A (no server). Upstream APIs are hit directly per user action. |

## 6. Performance audit (measured, desktop, local static server)

| Metric | Value |
|---|---|
| HTML | 166 KB uncompressed, render-blocking inline CSS/JS |
| First Contentful Paint | ≈ 560 ms (local) |
| Surah list visible | ≈ 1.9 s (artificial 700 ms delay after `load`) |
| Requests on load | 9 (excluding images blocked in the test environment) |
| Hero image | Unsplash, 1800 px wide, used as a CSS background (not lazy, not responsive) |
| Icon | 709 KB PNG |
| Fonts | Amiri + Cairo from Google Fonts (`display=swap`, preconnect: good) |
| Runtime | 1 Hz countdown timer (fine). `onscroll` handler without throttling. The full surah grid is re-rendered on every keystroke in the filter. |
| Caching | None. The service worker is not registered. |

## 7. SEO audit

Good: `lang="ar" dir="rtl"`, title, description, canonical URL, Open Graph tags, `robots` meta.
Missing: `twitter:` card, structured data (JSON-LD `WebSite` / `SearchAction`), `robots.txt`, `sitemap.xml`, `hreflang`, apple-touch-icon, `og:image` hosted on the site. Headings are not hierarchical (several `h2`s inside modals precede the page `h1`). There is no `<noscript>` content, so crawlers that do not execute JS see an empty surah list.

## 8. Summary of defects to fix

1. Memorisation lab crashes (`getSkeleton` undefined).
1. The basmala is displayed twice in the reading view (Unicode-order mismatch in the stripping code).
2. Arabic surah filter returns nothing; English requires the exact transliteration.
3. Prayer notifications are promised but never sent.
4. Daily wird resets at UTC midnight instead of local midnight.
5. Prayer times lose localisation or the next-prayer highlight depending on the code path; next-prayer names are always Arabic.
6. The language choice is not persisted; many strings are untranslated.
7. The service worker is not registered; the PWA icons have the wrong sizes.
8. Silent fetch failures (tafsir, translation, prayer).
9. XSS-prone `innerHTML` with remote data; unencoded search query.
10. Accessibility: modals, keyboard access, contrast, focus.
11. Artificial 700 ms load delay; oversized icon; orphaned `Quran.mp3`.
12. Islamic search shows the wrong empty-state message.
13. No documentation, tests, `.gitignore` or dependency management.
