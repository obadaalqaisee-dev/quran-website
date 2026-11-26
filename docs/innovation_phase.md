# Innovation Phase (2026-11-25), branch `feature/quran-innovative-enhancements`

This phase builds on the existing platform. Nothing was removed (see
[`feature_preservation_checklist.md`](feature_preservation_checklist.md) §M). The site still runs entirely on GitHub
Pages, and every new feature works without the backend and without any new external service.

## 1. Baseline (recorded before any change, on `main` @ `711d28d`)

| Suite | Result |
|---|---|
| Backend pytest | 106 passed |
| ruff · pip-audit | clean · no known vulnerabilities |
| Frontend unit (`node:test`) | 37 passed |
| Playwright end-to-end | 101 passed, 0 failed, 2 skipped (the same two internet-only tests as before) |

## 2. How the ideas were chosen

Established Quran platforms commonly offer bookmarks and notes, reading goals and streaks, and (in dedicated
memorisation apps) speech-based mistake detection. This site already had the hardest of these: word-level
recitation feedback, a mistake history and spaced revision. But it showed that data only as raw lists. The
largest gap was therefore not a missing feature. It was **turning the data the visitor already creates into
guidance**, without accounts, servers or invented numbers.

Every candidate was rated on value, feasibility, user experience, data accuracy, privacy and fit with the
architecture (static site, `localStorage`, optional backend):

| Idea | Decision | Why |
|---|---|---|
| Insights computed from the visitor's own data (activity map, streaks, revision order, weak ayahs, missed words, accuracy trend) | **Built** | High value. The data already exists on the device, so the figures are exact rather than estimated. No privacy cost. |
| Explainable "next step" recommendations | **Built** | Each suggestion shows the rule that produced it. Simple rules, no black box. |
| Khatma planner by target date | **Built** | A common need. It uses the ayahs actually read (reading log), not a guess. |
| Ayah notes and collections | **Built** | Organises reflection and memorisation. It is separate from the original single "last read" bookmark, which is unchanged. |
| Backup and restore of all local data | **Built** | All progress lives in one browser, so clearing site data used to lose everything. A local file fixes this without accounts. |
| Listening statistics | **Built** | Measures real playing time (seeks and paused time are not counted). |
| Daily knowledge challenge | **Built** | Links the academy to daily use. It reuses **only** the quizzes already in the lessons, so no new religious content was written. |
| Cloud sync / accounts | Rejected | It needs a mandatory backend and stores personal data on a server. Backup files give portability without that. |
| AI tafsir, chat or "ask a scholar" | Rejected | The answers could not be guaranteed accurate, and the site must not appear to issue fatwas. |
| Word-level audio/text sync for all 16 reciters | Deferred | It needs per-ayah timing data, which is not available for every reciter on mp3quran.net, and it would add an external API dependency. The per-ayah player already highlights the playing ayah. |
| Points, badges and leaderboards | Rejected | They turn worship into a game. Calm streaks and an encouraging default ("A little done consistently…") were chosen instead. |

## 3. What was built

### «بصيرة» insights (dashboard, under «رفيقك اليومي»)

* **Your next step:** up to four suggestions, ordered as follows. Due revisions come first. Next is the ayah where
  mistakes recur most. Morning or evening adhkar are suggested in their time window, if not yet marked in today's
  wird. Then come the daily reading goal, the memorisation target, today's question, and the next prayer lesson.
  Each suggestion shows its reason and a button that goes straight to the action. When everything is done, a calm
  message replaces the list.
* **Activity map:** 12 weeks of reading (ayahs shown in the reading view), recitation and listening. Each cell has a
  date tooltip, and a text summary is given for screen readers. Alongside it: the current and longest streak, khatma
  %, minutes listened this week, and the most-listened reciter.
* **Khatma planner:** choose a date. The planner shows ayahs per day, approximate pages per day (out of 604), days
  left, and whether the last 7 days' pace is enough. The plan is saved under `khatmaPlan`.
* **Memorisation analysis:**
  * **Suggested revision order:** priority = days overdue + 10 × mistake rate. The revision schedule itself
    (`core/memorization-store.js`) is unchanged; this only decides what to revise first, and each surah shows
    the reason.
  * **Ayahs that need strengthening:** "Recite" opens the lab on exactly that ayah, through the existing range
    selector.
  * **Words most often missed:** grouped by normalised spelling. Only *missing* words are shown, because
    substitutions are what the recogniser heard, not Quran text.
  * **Accuracy trend** over recent sessions, with a note that speech recognition can be wrong.

### Ayah notes and collections

In the reading view, the details panel of any ayah has **«📝 ملاحظة وتصنيف»**. It files the ayah in a collection
(للتدبر, للحفظ, للمراجعة, أدعية قرآنية, or your own) with an optional private note (up to 1,000 characters). Ayahs with
a note are underlined in the Mushaf. The **«ملاحظاتي»** dialog (dashboard tool card and side menu) lists them in
Mushaf order, with a collection filter and search; each can be opened in the Mushaf or deleted. The whole set can
be exported as plain text.

### Backup and restore (profile dialog)

* **Save a backup:** downloads a JSON file with every key the site stores, as the raw stored strings. Restoring
  therefore reproduces the original formats byte for byte.
* **Restore:** the file is validated before anything is written:
  * it must be this site's backup format and version;
  * only the site's own keys are accepted;
  * the file is at most 5 MB, and each value at most 2 MB;
  * JSON keys must contain valid JSON.

  The visitor confirms, the entries are merged, and the page reloads. Keys absent from the file are kept.

### Daily question («💡 سؤال اليوم»)

One question a day from the existing quizzes of the prayer curriculum and the academy (33 questions). A fixed
stride shows every question once before any repeats. The first answer of the day is kept, and a link opens the
source lesson, which holds the explanation and references.

### Listening statistics

The surah player and the per-ayah player count real playing time per day and per reciter (`listeningLog`, 90 days).
The count is flushed every 30 s, on pause and when the page is hidden.

### Site assistant («💬 مساعد الموقع»), added at the owner's request

There is a floating «💬 المساعد» button on every screen, plus entries in the side menu and on the dashboard. The
assistant runs entirely in the browser. **No AI model, no account, no API key and no network request is used for
its answers.**

* **Using the site:** 26 help topics in four languages, including reading, listening, repetition, tafsir,
  memorisation, the microphone, revisions, bookmarks, notes, prayer times, notifications, adhkar, rosary,
  prayer learning, academy, search, settings, dark mode, language, insights, backup, favourites, installation,
  sleep timer and wird. Each topic has step-by-step instructions that use the interface's real button names, and a
  «خذني إليها» button that opens the feature.
* **Islamic questions:** answered **only** with passages that already exist in the site's verified content, each
  with its source and a button to open it:
  * the prayer curriculum and academy lessons, including their reviewed quiz answers;
  * Hisn al-Muslim;
  * «رسالة الإسلام».

  Passages are ranked by matched terms (Arabic light stemming, stop words, at least half of the question's terms).
  The assistant never composes text. When nothing in the content answers, it says so plainly, refers the visitor to
  scholars, and offers a search of the Quran text instead.
* **Rulings:** questions asking for a ruling (حكم، يجوز، حلال، حرام، فتوى…) always carry a notice that the site issues
  no fatwas and that the visitor should ask a trusted scholar or the official fatwa body.
* **Checks:** a unit test checks that every passage the assistant can show is verbatim text from the data modules,
  and that every help topic exists in four languages and points to an element that exists. Typed questions are
  rendered as text.
* **Why not an AI model (option B, deferred):** GitHub Pages cannot hide an API key, and a model can misquote a
  hadith or ruling. The architecture allows adding one later through the optional backend, restricted to these same
  passages with citations, with this local assistant as the fallback.

### Reliability fixes found during the work

* **A memorisation-history entry without a date crashed the start-up** (`features/memorization.js`). Every feature
  started after it (learning, dashboard, profile…) was then left uninitialised. `formatDate` now tolerates such
  entries, and `loadMemo` drops malformed ones.
* **Each feature now starts in isolation** (`safely()` in `main.js`): a feature that fails is reported in the
  console, and the rest of the site keeps working.
* **Backend rate limiter:** memory is now bounded even when every tracked client is active (see
  [`security.md`](security.md)).

## 4. Storage (new keys only; no existing key changed)

| Key | Content |
|---|---|
| `listeningLog` | `{ days: { date: seconds }, reciters: { slug: seconds } }`, 90 days |
| `ayahNotes` | `{ v: 1, items: [{ surah, ayah, collection, note, updated }], custom: [names] }` |
| `khatmaPlan` | `{ target, start }` |
| `dailyChallenge` | `{ days: { date: { q, ok, choice } } }`, 120 days |

The keys are registered in `core/storage.js` (`KEYS`). The tests *"using every new feature leaves the original
storage keys untouched"* (e2e) and *"original storage keys are unchanged"* (unit) still pass.

## 5. Privacy and content integrity

* Everything is computed in the browser from the visitor's own data. Nothing is sent anywhere, and no new network
  request or third-party service was added.
* No Quran text, tafsir, hadith or ruling was written in this phase. The daily question reuses the existing quiz
  questions verbatim, and a unit test checks each one against its lesson.
* Stored and imported text (notes, collection names) is always inserted with `textContent`. A test enters markup
  in a note and checks that it is shown as text.

## 6. Files

New: `assets/js/core/{insights,listening-log,notes,backup,challenge,assistant}.js`,
`assets/js/features/{insights,notes,backup-panel,assistant}.js`, `assets/js/data/translations-{insights,assistant}.js`,
`assets/audio/abadan-la-lan-nahid.mp3`, `tests/unit/innovation.test.mjs`, `tests/e2e/innovation.test.mjs`, this
document.

Changed: `index.html` (insights section, notes button, editor and dialog, backup section, side-menu and dashboard
entries, module preloads), `about.html` (preload), `sw.js` (precache list, `VERSION` v3.3.0),
`assets/css/main.css` (§19), `assets/js/main.js`, `core/storage.js`, `core/memorization-store.js`,
`features/{reader,voice-lab,dashboard,memorization}.js`, `data/{translations,about-media}.js`,
`backend/app/core/rate_limit.py`, `backend/tests/test_security.py`, `tests/e2e/about.test.mjs`, the docs.

Removed: `assets/audio/ya-dhakir-al-ashab.mp3`, the recording replaced at the owner's request (see
[`about_page.md`](about_page.md) §2).
