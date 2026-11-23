# Platform Evolution — Repository Audit (2026-11-23)

Audit of `main` at `31db995`, made **before** any change on `feature/ultimate-quran-platform-evolution`.
Every frontend module, the backend (routes, models, migration, services, security), the service
worker, manifest, CI workflow, tests and documentation were read in full.

The permanent preservation inventory is [`feature_preservation_checklist.md`](feature_preservation_checklist.md)
(sections A–I, unchanged and still binding); section **J** of that file lists what this evolution added.

## 1. Test baseline (recorded before development)

| Suite | Command | Result on `main` |
|---|---|---|
| Backend | `pytest` | 91 passed |
| Lint | `ruff check .` | clean |
| Frontend unit | `npm run test:unit` | 18 / 18 passed |
| End-to-end | `npm run test:e2e` | 62 passed, **1 failed**, 2 skipped |

The failing test was *"CORS allows the Pages origin; Quran text … come from the backend"* — see finding H1.
The two skips are the live-deployment smoke test (needs a URL) and the live-Aladhan proxy test
(the container has no route to `api.aladhan.com`).

## 2. Findings

Severity: **H** high (wrong behaviour or data path) · **M** medium (reliability, UX, maintainability) · **L** low.

| # | Sev | Area | Finding | Resolution |
|---|---|---|---|---|
| H1 | H | `core/api.js` | Any backend error, including a **502 from the prayer-time proxy** when Aladhan is unreachable, marked the *whole* backend as down for 60 s. Quran text, tafsir and search then silently left the verified backend for the public API. This was the real cause of the failing e2e test. | Upstream 502/504 now fall back for that call only. Test made deterministic (prayer-times answer stubbed in the browser; the live path keeps its own test). |
| H2 | H | Memorisation lab | Recognition restarts were immediate and unbounded: a persistent `network` / `audio-capture` error produced a tight `onend → start()` loop. Errors other than *not-allowed* were all reported as one generic message. | New `core/speech.js` controller: bounded restarts with back-off, classified errors (permission, no microphone, network, language, aborted, no-speech), restart on tab return. |
| H3 | H | Memorisation lab | No microphone preflight: availability, permission state and device were unknown until recognition failed. No input selection, no level feedback, no stream cleanup. | New `core/mic.js`: capability/permission detection, device list, `getUserMedia` with `echoCancellation` / `noiseSuppression` / `autoGainControl` *only when the browser reports support*, a level meter, and full track/AudioContext cleanup. |
| H4 | H | Memorisation lab | Feedback was binary (accepted / "not recognised"). The user could not see which words were missing, substituted or repeated, nor the position in the ayah. | New word-alignment engine (`core/recitation.js`): normalisation for hamza/alef/ya/ta-marbuta variants, diacritic-insensitive, edit-distance alignment with per-word status, coverage %, position. Canonical text is never modified. |
| M1 | M | Learn the prayer | The dialog shows five stock **photographs** (external, Pexels) that do not depict each step precisely, and one YouTube link. No structured curriculum, no quizzes, no differences of opinion explained. | Kept as is (preserved). Added a full **"تعلم الصلاة الصحيحة"** section: 18 modules, original posture diagrams for every step, quizzes, progress, transparent notes on scholarly differences, and a sources panel with verification status. |
| M2 | M | Visual identity | Light theme is green/ivory but dark theme is **navy/teal** (`#0b1120`, `#2dd4bf`), unrelated to the brand. Gold used for small text failed contrast in the original (already fixed). | New emerald / forest / ivory / muted-gold token system for both themes; all text pairs re-verified by `contrast.test.mjs`. |
| M3 | M | Hero / PWA | Hero image is loaded from `images.unsplash.com` (not available offline, third-party request on every visit). Installed app has no distinct background. | Original locally-generated geometric artwork (`assets/img/`), used for the hero and as the installed-app (`display-mode: standalone`) background; precached by the service worker. The Unsplash URL is kept for the social preview (`og:image`). |
| M4 | M | Reading | No juz or page navigation, no reading progress, no daily reading goal, one reading appearance. | Juz/page index generated from the verified dataset, reading themes, progress, daily goal, ayah-range repeat. |
| M5 | M | Audio | No sleep timer, no queue, no range repeat, limited speeds (0.75–1.5), no explicit error recovery action, no "recently played". | Added, without changing the 16 reciters, their URLs or the fallback chain. |
| M6 | M | Prayer notifications | Warning fixed at 10 minutes. | Configurable (5/10/15/20/30), default stays 10. |
| M7 | M | Search | Islamic search covers surahs, adhkar and the Message of Islam only; no ayah references (e.g. `2:255`). | Extended to prayer lessons, academy lessons and ayah references; previous results unchanged. |
| L1 | L | Docs | README test counts are stale after this work. | Updated. |
| L2 | L | SW | Latin font subsets and `Quran.mp3` are not precached. | Latin fonts precached; Quran.mp3 left to the network (range requests) as designed. |
| L3 | L | Content | `modal_learn_desc` cites «صلوا كما رأيتموني أصلي». Correct attribution (al-Bukhari) but no reference shown. | New section shows the collection name; online verification links are provided as **search links**, not as verified page URLs (see §4). |

### Checked and found correct (no change needed)

* **Quran text:** 6 236 ayahs, checksums in `backend/app/data/checksums.json`; frontend shows the source text byte-for-byte (`features.test.mjs`).
* **Reciters:** 16 entries, original order and URLs; fallback by mp3quran ID; `Quran.mp3` fallback for Al-Fatihah.
* **Security:** strict CSP without `unsafe-inline`; no remote data through `innerHTML`; SSRF allow-list in `services/upstream.py`; rate limiting; CORS without credentials; security headers. All preserved; new code follows the same rules (static test enforces it).
* **Storage:** original keys `theme`, `quranBookmark`, `islamicProfile`, `dailyWird`, `favoriteSurahs` unchanged. New features use new keys only.
* **Adhkar counts** match `adhkar.json`; **surah/ayah numbering** verified by `test_data_integrity.py`.
* **Database:** one Alembic migration; SQLite/PostgreSQL-neutral types.

## 3. Environment limits met during this work

The development container's network allowed package registries only. `sunnah.com`, `binothaimeen.net`,
`binbaz.org.sa`, `youtube.com`, `wikimedia.org`, `api.aladhan.com` and `mp3quran.net` were unreachable
(DNS / proxy refusal). Consequences, handled honestly:

* No external page could be verified. **No hadith number, page URL or video URL was added as a
  verified reference.** See §4.
* No third-party image could be downloaded and its licence checked; the new background and the posture
  diagrams are **original artwork created for this project** (vector, generated in-repo), so their licence
  is unambiguous.

## 4. Religious-content policy applied

1. Quran citations in lessons are `surah:ayah` references resolved **from the verified local dataset**
   (`backend/app/data/ayahs.json.gz`); a unit test checks each one exists and quotes the canonical text.
2. Hadith are cited by **collection name only** (e.g. "رواه البخاري") for well-known narrations, with a
   *search* link to sunnah.com / dorar.net built from the hadith's opening words. No hadith number is
   asserted.
3. Scholar resources carry a `status`: `existing` (link already on the site before this work, kept
   unchanged), or `search` (a search link on an official platform, clearly labelled as a search).
   Nothing is labelled "verified" that was not verified.
4. Rulings follow the Hanbali classification taught by Sheikh Ibn Uthaymeen in *al-Sharh al-Mumti'*;
   each module states where other schools classify differently. The app states it does not issue
   fatwas, does not represent any scholar, and is no substitute for a qualified teacher.
5. The memorisation lab states that browser speech recognition cannot judge tajweed or pronunciation.
