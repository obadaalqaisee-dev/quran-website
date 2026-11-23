# Feature Preservation Checklist

This is the permanent regression list. It was built from a line-by-line reading of the original `index.html` (revision `f4c9b53`) **before** any change was made.

Every row must still exist and work after the modernisation.

* **Status** records the result of the final verification run on 2026-11-19 (see [`testing.md`](testing.md)).
* §H maps each section to the automated tests that check it.

Legend: ✅ verified working · 🔧 was broken in the original and is now fixed · ⚠️ preserved, with a known limitation noted.

## A. Reciters (القرّاء): all 16 must remain selectable and playable

| # | Reciter (as displayed) | Original base URL (preserved verbatim) | mp3quran reciter / moshaf ID | Status |
|---|---|---|---|---|
| 1 | الشيخ عبد الباسط عبد الصمد | `https://server7.mp3quran.net/basit/` | 51 / 53 | ✅ |
| 2 | الشيخ سعود الشريم | `https://server7.mp3quran.net/shur/` | 31 / 31 | ✅ |
| 3 | الشيخ محمود خليل الحصري | `https://server13.mp3quran.net/husr/` | 118 / 118 | ✅ |
| 4 | الشيخ علي الحذيفي | `https://server9.mp3quran.net/hthfi/` | 74 / 74 | ✅ |
| 5 | الشيخ وديع اليمني | `https://server6.mp3quran.net/wdee3/` | 219 / 219 | ✅ |
| 6 | الشيخ خليفة الطنيجي | `https://server12.mp3quran.net/tnjy/` | 24 / 24 | ✅ |
| 7 | الشيخ ياسر الدوسري | `https://server11.mp3quran.net/yasser/` | 92 / 92 | ✅ |
| 8 | الشيخ أبو بكر الشاطري | `https://server11.mp3quran.net/shatri/` | 4 / 4 | ✅ |
| 9 | الشيخ مشاري العفاسي | `https://server8.mp3quran.net/afs/` | 123 / 123 | ✅ |
| 10 | الشيخ ماهر المعيقلي | `https://server12.mp3quran.net/maher/` | 102 / 102 | ✅ |
| 11 | الشيخ أحمد العجمي | `https://server10.mp3quran.net/ajm/` | 5 / 5 | ✅ |
| 12 | الشيخ فارس عباد | `https://server8.mp3quran.net/frs_a/` | 81 / 81 | ✅ |
| 13 | الشيخ محمد اللحيدان | `https://server8.mp3quran.net/lhdan/` | 107 / 107 | ✅ |
| 14 | الشيخ إدريس أبكر | `https://server6.mp3quran.net/abkr/` | 12 / 12 | ✅ |
| 15 | الشيخ سعد الغامدي | `https://server7.mp3quran.net/s_gmd/` | 30 / 30 | ✅ |
| 16 | الشيخ ناصر القطامي | `https://server6.mp3quran.net/qtm/` | 86 / 86 | ✅ |

The order, Arabic names and English names (`reciter_*` i18n keys) are kept.

* **Per-ayah reciter:** Mishary Alafasy via `cdn.islamic.network/quran/audio/128/ar.alafasy/{n}.mp3`. ✅
* **Local recitation:** `Quran.mp3` (Al-Fatihah, Abu Bakr Al-Shatri) is kept and now used as the offline fallback for Al-Fatihah. 🔧 (it was orphaned)

## B. Navigation

| Item | Original control | Status |
|---|---|---|
| ☰ Menu button → side menu | navbar | ✅ |
| Logo «القرآن الكريم» → `#home` | navbar | ✅ |
| 🌐 Language selector (العربية / English / Español / Français) | navbar | ✅ (now remembered between visits 🔧) |
| 🌙 / ☀️ Dark-mode toggle (persisted) | navbar | ✅ |
| 🎙️ التسميع (memorisation lab) | navbar | 🔧 |
| 🔍 بحث آيات (ayah search) | navbar | ✅ |
| 📿 المسبحة (rosary) | navbar | ✅ |
| 🕌 الإسلام (Message of Islam) | navbar | ✅ |
| 📿 حصن المسلم (adhkar) | navbar | ✅ |
| مواقيت الصلاة → `#prayerSection` | navbar | ✅ |
| السور → `#surahs` | navbar | ✅ |
| Side menu: 🕌 تعلم الصلاة | side menu | ✅ |
| Side menu: ⭐ المفضلة | side menu | ✅ |
| Side menu: 👤 حسابي | side menu | ✅ |
| Side menu: 👤 تسجيل دخول | side menu | ✅ |
| Side menu: 💖 تبرع | side menu | ✅ |
| Side menu: ✉️ تواصل معنا | side menu | ✅ |
| ↑ Back-to-top button (appears after 300 px) | floating | ✅ |

## C. Page sections (in order)

| Section | Contents | Status |
|---|---|---|
| Hero `#home` | Title, subtitle, description, «تصفح السور» → `#surahs`, «استمع للقرآن» → `#audio` | ✅ |
| Stats | 114 سورة · حصن المسلم · تفسير وترجمة · أوقات الصلاة | ✅ |
| Dashboard | Next prayer + live countdown; daily wird (4 checkboxes: القرآن، أذكار الصباح، أذكار المساء، المحافظة على الصلاة) + progress bar + "x of 4"; tool cards ⭐ Favourites, 🔎 Islamic search, 👤 My profile | ✅ (wird day boundary fixed 🔧) |
| Prayer times `#prayerSection` | Location-based times (Amman fallback), Hijri date, 5 prayer cards, next prayer highlighted | ✅ (localised highlight 🔧) |
| Surahs `#surahs` | Resume-bookmark banner, filter box, 114 cards with number, Arabic/English names, ☆/⭐ favourite, 🎧 listen, 📖 read | ✅ (Arabic filter 🔧) |
| Audio `#audio` | Title/subtitle, reciter select (16), audio controls, السابق / تكرار السورة 🔁 / التالي, auto-advance, fallback link resolution | ✅ |
| Reading `#readingSection` (hidden until a surah is opened) | Ayah-loop checkbox + hint, surah label/number, surah name, basmala (hidden for 1 and 9; stripped from ayah 1 except surah 1), clickable ayahs ﴿n﴾, active-ayah highlight, details panel under the ayah (Tafsir al-Muyassar in Arabic UI, translation per language), 🔖 save as last read | ✅ |
| Footer | Title, description, «Developed by Obada najeeb AL-Qaisee #عبادة ابوفردة #», Instagram + Facebook icons, © 2026 | ✅ |

## D. Dialogs (modals)

| Dialog | Must contain | Status |
|---|---|---|
| Login | Title, local-profile explanation, «فتح حسابي» → opens profile | ✅ |
| Donate | «التبرع غير متاح حالياً…» | ✅ |
| Contact | `mailto:obadanajeeb155@gmail.com`, Instagram (`obaalqaisee`), Facebook (`obada.alqaisse`) SVG icons | ✅ |
| Learn the Prayer | Title, intro, **5 illustrated steps** (same text in 4 languages, same 5 Pexels images), YouTube video card (W-jX2kY0vR8, Sheikh Othman Al-Khamis) | ✅ |
| Hisn al-Muslim | Tabs الصباح ☀️ (8), المساء 🌙 (8), النوم 🛏️ (4), بعد الصلاة 🕌 (6), متنوعة 🤲 (10); tap to count down, ✓ when done | ✅ (36 adhkar, verbatim) |
| Message of Islam | 3 sections (Tawhid, against terrorism + Quran 5:32, invitation) | ✅ |
| Rosary | Counter circle, vibration, «تصفير العداد 🔄» | ✅ (now also keyboard-operable and persisted) |
| Ayah search | Input + Enter + button, up to 20 results, click → reading view scrolled to that ayah | ✅ |
| Memorisation lab | Surah select, 🎙️ mic toggle, live transcript, ✔ / ❌ feedback, progressive reveal of ayahs, 🎉 on completion, unsupported-browser message | 🔧 |
| Favourites | List with ⭐ remove and 📖 open | ✅ |
| Islamic search | Surahs + adhkar + Message of Islam content, disclaimer note | ✅ (empty-state message fixed 🔧) |
| My profile | Name, goal, save, reset (with confirm), wird %, favourite count, 🔔 enable notifications | ✅ (notifications now actually fire 🔧) |

## E. Icons (emoji / glyph set used in the UI)

The redesign keeps **every** icon below, either as the original glyph or as an equivalent SVG with the same meaning in the same place:

🕌 🌙 ☀️ 📿 📖 🔁 ✖ 🔖 ⭐ ☆ 👤 🔍 🔎 ✅ ✓ ✔ ❌ ⚠️ 🎉 🛏️ 🤲 🎙️ 🔔 🌐 📍 🎧 💖 ✉️ 🔄 ☰ ↑, plus the Instagram and Facebook SVG logos.

## F. Content and data that must be preserved verbatim

| Data | Count | Status |
|---|---|---|
| Surahs | 114 (Arabic name, English name, English meaning, revelation type, ayah count) | ✅ |
| Ayahs (Uthmani) | 6,236, same `quran-uthmani` text the site always displayed, verified against Tanzil | ✅ |
| i18n strings | 147 keys × 4 languages (ar, en, es, fr), copied verbatim; the 26 keys the Arabic table lacked are filled from the Arabic fallback strings that were hard-coded in the original code | ✅ |
| Adhkar | 36 entries with their repeat counts | ✅ |
| Learn-the-Prayer text | 5 steps × 4 languages | ✅ |
| Message-of-Islam text | 3 sections × 4 languages | ✅ |
| SEO metadata | Title, description, keywords, author, canonical URL, Open Graph | ✅ (extended) |
| Analytics | Google Analytics `G-PMNKGK1Y97` | ✅ |
| PWA manifest | Name, short name, description, colours | ✅ (icons fixed 🔧) |

## G. Behaviours and local storage keys (backward compatible)

The keys `theme`, `quranBookmark`, `islamicProfile`, `dailyWird`, and `favoriteSurahs` keep their names and formats, so existing visitors keep their data. `dailyWird` keeps its `YYYY-MM-DD` keys (now local date).

The following behaviours are preserved: auto-advance to the next surah, surah loop, ayah loop, pausing the surah player when an ayah is played, marking the "Quran" wird done when a bookmark is saved, the welcome toast with the profile name, closing a dialog by clicking its backdrop, and vibration on rosary taps.

## H. How each section is verified

| Section | Automated tests (`tests/e2e/…` unless noted) |
|---|---|
| A. Reciters | `features`: all 16 in original order, each plays its original URL; fallback by mp3quran ID; `Quran.mp3` fallback for Al-Fatihah. `backend/tests/test_api.py::test_reciters_preserve_original_list`. `live`: real audio playback. |
| B. Navigation | `features`: every nav item, all six side-menu items, Escape/button/backdrop closing, back-to-top. `quality`: keyboard flow and focus return. |
| C. Sections | `features`: page structure, surah list, player, reading, prayer, dashboard, footer credits and links. |
| D. Dialogs | `features`: each dialog opens and its content is present. `quality`: axe on 8 dialogs. |
| E. Icons | Present in the markup and translation strings (`unit/logic.test.mjs` checks that every `data-i18n` key exists); visually checked in screenshots. |
| F. Content and data | `backend/tests/test_data_integrity.py`; `unit/logic.test.mjs` (frontend data = backend data; 4 × 238 keys); `features` (displayed Quran text = verified source). |
| G. Storage and behaviours | `features`: original storage formats read; corrupt storage tolerated; auto-advance, loop, ayah loop, pause-on-ayah, bookmark → wird, welcome toast. (Vibration on rosary/adhkar taps is present in the code but cannot be observed in an automated browser.) |

## I. Deliberate presentation changes (nothing was removed)

| Item | Before | Now | Why |
|---|---|---|---|
| Header layout | One row: 9 nav controls + language + theme | Row 1: ☰, logo, 🌐 language, 🌙 theme. Row 2: the 7 nav items (horizontally scrollable on phones). Item order: السور، مواقيت الصلاة، حصن المسلم، الإسلام، المسبحة، بحث آيات، التسميع. | On phones the old header stacked into a tall block that covered about 40 % of the screen. |
| Language options | `🌐 العربية / Arabic`, … | 🌐 icon beside the picker; options `العربية`, `English`, `Español`, `Français` | The long bilingual labels were clipped on phones. Same four languages, same codes. |
| Memorisation-lab nav label (Arabic) | Static HTML `🎙️ التسميع`, replaced at start-up by the original translation `🎙 التسميع` | Unchanged: the original translation string is shown | Kept verbatim. |
| Spanish/French labels that were left in English | `📿 Rosary`, `🔍 Search Ayah`, `🎙️ Voice Test`; FR ayah-loop label in Spanish | `📿 Tasbih`, `🔍 Buscar Aleya` / `🔍 Chercher une Ayah`, `🎙️ Prueba de Recitación` / `🎙️ Test de Récitation`; French label fixed | Translation errors in the original. |
| "Message of Islam" (EN/ES/FR) | First sentence followed by "..." | Full translation of the Arabic paragraphs | The original translations were truncated. The Arabic text is unchanged. |
| Reading view | Basmala in the header **and** at the start of ayah 1 (surahs 2–114 except 9) | Basmala once, in the header | The original stripping code never matched (Unicode encoding mismatch). Al-Fatihah still shows it as ayah 1. |
| Canonical URL | `…/quran-website/index.html` | `…/quran-website/` | Same page; the shorter URL is the one people share. Both keep working. |
| Hero photo | CSS background, 1800 px wide | Responsive `<img>` (640/1200/1800 px) | Faster on phones. Same photo. |
| Icons drawn by the browser | Emoji only | Same emoji, inside consistent round buttons. The mini player adds ⏮ ▶ ⏸ ⏭. | Consistency. No icon was replaced. |
| Fonts | Google Fonts | The same Amiri and Cairo, self-hosted | Privacy, speed, offline use, stricter CSP. |

## J. Platform evolution (2026-11-23): what was added

Sections A–I above were re-verified after the evolution: every row still exists and works, and every
test listed in §H still passes (see [`testing.md`](testing.md)). Nothing was removed. Added:

| Area | Added | Verified by |
|---|---|---|
| Navigation | 🕋 تعلم الصلاة الصحيحة → `#learnSection`, 🎓 الأكاديمية → `#academySection` (nav); ⚙️ settings (header button, side-menu item, dashboard card) | `e2e/evolution` navigation |
| Learn the correct prayer | 18 modules, 10-step illustrated tutorial (original SVG diagrams), quizzes, progress, scholarly differences, scholars and sources with link status. The original «تعلم الصلاة» dialog is unchanged and now links to the full course | `e2e/evolution` learn; `unit/evolution` content integrity (every Quran reference checked against the dataset) |
| Academy | 5 courses (prayer, memorisation, tajweed fundamentals, basics, daily practice) | `e2e/evolution` academy |
| Memorisation lab | Word-level comparison engine, microphone test (device, processing, level, cleanup), robust recogniser, 6 modes, ayah range, retry/hint/skip, plan, daily target, memorised surahs, spaced revision, mistake history. The original sequential behaviour is the default and still passes its original test | `features` (original) + `e2e/evolution` lab + `unit/evolution` engine |
| Reader | Juz and page navigation, reading themes, reading log and daily goal, auto-continue, ayah-range repeat, sajda marks | `e2e/evolution` reading |
| Player | Speeds 0.5×, 1.75×, 2× (original four kept), sleep timer, queue, recently played, retry, open/download | `e2e/evolution` player; original player tests |
| Dashboard | «رحلتي اليومية» and «رفيقك اليومي», computed from on-device data only | `e2e/evolution` dashboard |
| Settings | Font, reading theme, preferred reciter (original `reciter` key), translation in Arabic UI, tafsir in all languages, goals, prayer-warning minutes (default 10 = original) | `e2e/evolution` settings |
| Search | Ayah references, lessons, Tafsir al-Muyassar (on request) after the original result types | `e2e/evolution` search; original Islamic-search test |
| Backend | `/tafsir/search`, `/quran-index`, `/learning/resources`, Alembic 0002 | `backend/tests/test_learning.py` |
| PWA | New icons, launch screen in standalone mode, patterned installed-app background, all artwork precached | `quality` manifest test; `e2e/evolution` PWA |

### New storage keys (no existing key changed)

`memorizationMode`, `memorizationData`, `micDeviceId`, `readingTheme`, `readingLog`, `userSettings`, `recentAudio`,
`learningProgress`. The test *"using every new feature leaves the original storage keys untouched"* seeds all
original keys, uses the new features, and checks every original value byte-for-byte.

## K. Deliberate presentation changes in the evolution (nothing removed)

| Item | Before | Now | Why |
|---|---|---|---|
| Colours | Green/ivory light theme, navy/teal dark theme | Emerald/forest/ivory/muted-gold in both themes (token names unchanged; contrast re-verified) | One identity in both themes |
| Hero background | Photograph from images.unsplash.com | Original local vector artwork (arch + khatam pattern). The Unsplash photo remains the social-preview `og:image` | Works offline, no third-party request, unambiguous licence |
| App icons | Previous PNG icons | New icons generated from `assets/img/icon.svg`; same file names and sizes. Root `icon.png` kept unchanged | PWA redesign |
| Memorisation lab dialog | Standard width | Wide dialog with two tabs; every original control keeps its id and default behaviour | Room for the word view and the plan |
| Reader toolbar | Ayah loop, font size, hint | Same controls, plus a collapsible «أدوات القراءة والتنقل» panel | Keeps the Quran text near the top |

## L. Reorganisation and «من أنا» (requested by the site owners)

Two entry points were removed **only after** their functionality and content were moved (details in
[`about_page.md`](about_page.md)):

| Removed entry | Where it is now | Preserved | Verified by |
|---|---|---|---|
| Nav item «📿 المسبحة» and its dialog | Tab «📿 المسبحة» of حصن المسلم | Same counter and reset ids and behaviour, vibration, saved count (`rosaryCount`). `rosaryModal` openers redirect to the tab. Added: dhikr phrase and 33/100 target (`tasbeehPrefs`). | `features` rosary test (now opens the tab); `about.test.mjs` rosary tests and axe |
| Side-menu «🕌 تعلم الصلاة» and its dialog | Academy lesson «صفة صلاة النبي ﷺ» (first lesson of the prayer course, and the «ابدأ هنا» button) | Introduction, 5 steps and video, with the same translation strings in 4 languages. The stock photos are replaced by the matching original diagrams. | `features` side-menu test (checks the content in its new place); `about.test.mjs` |

Also: the academy is renamed «الأكاديمية التعليمية الإسلامية», moved after the prayer times, and contains the
«تعلم الصلاة الصحيحة» track (ids unchanged). Added: the separate «من أنا» page (`about.html`) with the nav item
«🕊️ من أنا» and a side-menu link. New storage keys: `tasbeehPrefs`, `nasheedVolume`. Every other row of sections
A–K is unchanged.
