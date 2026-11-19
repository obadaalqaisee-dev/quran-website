# Feature Preservation Checklist

This is the permanent regression list. It was built from a line-by-line reading of the original `index.html` (revision `f4c9b53`) **before** any change was made.

Every row must still exist and work after the modernisation.

* **Automated** names the test that checks the row (see [`testing.md`](testing.md)).
* **Status** records the result of the final verification run.

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
| i18n strings | 124 keys × 4 languages (ar, en, es, fr), copied verbatim | ✅ |
| Adhkar | 36 entries with their repeat counts | ✅ |
| Learn-the-Prayer text | 5 steps × 4 languages | ✅ |
| Message-of-Islam text | 3 sections × 4 languages | ✅ |
| SEO metadata | Title, description, keywords, author, canonical URL, Open Graph | ✅ (extended) |
| Analytics | Google Analytics `G-PMNKGK1Y97` | ✅ |
| PWA manifest | Name, short name, description, colours | ✅ (icons fixed 🔧) |

## G. Behaviours and local storage keys (backward compatible)

The keys `theme`, `quranBookmark`, `islamicProfile`, `dailyWird`, and `favoriteSurahs` keep their names and formats, so existing visitors keep their data. `dailyWird` keeps its `YYYY-MM-DD` keys (now local date).

The following behaviours are preserved: auto-advance to the next surah, surah loop, ayah loop, pausing the surah player when an ayah is played, marking the "Quran" wird done when a bookmark is saved, the welcome toast with the profile name, closing a dialog by clicking its backdrop, and vibration on rosary taps.
