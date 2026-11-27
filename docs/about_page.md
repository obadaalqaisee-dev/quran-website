# The «من أنا» page, and the reorganisation of the rosary and prayer learning

## 1. The «من أنا» page (`about.html`)

A separate page, not a dialog. It is reached from the nav bar (🕊️ من أنا) and from the side menu. Because it is
a real page, the browser's back and forward buttons work natively. It shares the site's stylesheet, design
tokens, light/dark theme, language selector and Content Security Policy. The CSP is byte-identical to
`index.html`'s, which a test checks.

| Part | Content |
|---|---|
| Title | «من أنا» is the page's `h1` for screen readers and the browser tab; it is not shown on screen (at the site owner's request, 2026-11-27). The former header band (pointed-arch artwork with the visible title and Al-Isra 17:1) was removed. At the owner's request the page no longer shows a Quranic verse, and the code that loaded it was removed. |
| Photo | An aerial view of the whole Al-Aqsa Mosque compound, at the top of the page, at its natural proportions (see §2). |
| Nasheed | An autoplaying player (see §3). |
| Developers | Two cards with exactly the information supplied: **عبادة أبو فردة**, طالب في جامعة الزيتونة الأردنية, التخصص: الذكاء الاصطناعي; **يونس أبو صعيلك**, طالب في الجامعة الهاشمية. Side by side from 721 px wide, stacked below. No other personal details were added. |
| Dedication | «تم تطوير هذا الموقع لوجه الله تعالى، ابتغاء الأجر والثواب، وخدمةً لكتاب الله وسنة نبيه ﷺ.» / بواسطة: / «عبادة أبو فردة ويونس أبو صعيلك.» |

Files: `about.html`, `assets/js/about.js` (page script), `assets/js/data/about-media.js` (media configuration),
and section 18 of `assets/css/main.css`. The service worker precaches the page, so it works offline after a first
visit. `sitemap.xml` lists it. In development, the backend serves it like `index.html`.

## 2. Media

Both files are local and configured in `assets/js/data/about-media.js` with their source and licence:

* **Photo (since 2026-11-27):** `assets/img/about/al-aqsa-compound-1440.webp` (1440 × 892, ~340 KB) and
  `al-aqsa-compound-800.webp` (800 × 495, ~105 KB): **المسجد الأقصى المبارك (الحرم القدسي الشريف)** photographed from
  the air from the south on 15 November 2013. The whole compound is visible: **المسجد القبلي** (the mosque with the
  grey lead dome, often mistakenly called "Al-Aqsa Mosque" on its own) in the foreground on the southern wall, and
  **قبة الصخرة المشرفة** (the golden dome), with **قبة السلسلة** beside it, on the raised platform in the centre.
  Both buildings are within the Al-Aqsa Mosque compound; they are different buildings, and the caption names each.
  * **Source:** Wikimedia Commons,
    [File:Jerusalem-A-Quds-2013(2)-Aerial-Al-Aqsa Mosque Compound-(south exposure).jpg](https://commons.wikimedia.org/wiki/File:Jerusalem-A-Quds-2013(2)-Aerial-Al-Aqsa_Mosque_Compound-(south_exposure).jpg)
    (6426 × 3979), itself extracted from the featured picture
    [Jerusalem-2013(2)-Aerial-Temple Mount-(south exposure).jpg](https://commons.wikimedia.org/wiki/File:Jerusalem-2013(2)-Aerial-Temple_Mount-(south_exposure).jpg).
    The file page's Arabic description identifies the Qibli Mosque in front and the Dome of the Rock and Dome of the
    Chain behind it, and states that the whole compound is Al-Aqsa Mosque.
  * **Licence:** CC BY-SA 4.0 (verified on the file page, 2026-11-27). The author's required credit line is
    "Andrew Shiva / Wikipedia" (uploaded by Godot13). The caption shows that credit, linked to the file page, and the
    licence, linked to its deed.
  * **Changes:** not cropped. Resized from the Commons 1920 px rendition and converted to WebP. The adapted files are
    shared under the same licence (CC BY-SA 4.0).
  * **Display:** the image opens the page, in a rounded card, as wide as the content (up to 1060 px), with
    `height: auto`. Its width and height attributes give the browser the aspect ratio before it loads, and nothing is
    cropped (`object-fit` is not used). `srcset`/`sizes` let phones download the 800 px file and larger screens the
    1440 px one. The service worker precaches both.
* **Previous photo (until 2026-11-26):** `dome-of-the-rock.webp`, a close crop of the Dome of the Rock (Andrew
  Shiva, CC BY-SA 4.0). It was replaced because it did not show the compound. It is no longer shipped; it remains in
  the git history.
* **Nasheed (since 2026-11-27):** `assets/audio/firdaws-al-rahman-dhilal.mp3`, «فردوس الرحمن ظلال» (4:30, MP3
  128 kbps, 44.1 kHz stereo). It replaced «أبداً لا لن نحيد» at the site owner's request; the player, autoplay
  behaviour and controls are unchanged.
  * **What it is:** the nasheed «تبصرة» by محمد المقيط (released 2016), widely known by its line «فالغاية والهم
    الأسمى فردوس الرحمن ظلال». This is the original vocal version, not the later re-arrangement «تبصرة (بتوزيع
    جديد)» (archive item `tabsirah-nasheed`, 3:40), which was not used.
  * **Source:** the Internet Archive item
    [qalb_js_hotmail_20160305_0511](https://archive.org/details/qalb_js_hotmail_20160305_0511) (uploaded
    2016-03-05, tagged «اداء المنشد - محمد المقيط»), file `تبصرة.mp3`. The shipped file is byte-identical to it
    (MD5 `dcabf005548ab822f173dd0fc4280eb0`, the value the archive publishes; a unit test checks it).
  * **How it was identified:** archive metadata (title, performer tag, upload date one day after the 2016-03-04
    release), then a speech-to-text pass over the file: the line «فالغاية والهم الأسمى فردوس الرحمن ظلال» is sung at
    about 1:12, and the refrain «معاً نهج حياةٍ جئنا، تبصرة عن كل ضلال» throughout.
  * **Rights:** no upload states a licence or a permission to redistribute. The site owner chose to use the
    recording on their own responsibility. If a rights holder objects, replace `src` in
    `assets/js/data/about-media.js` (the page then says plainly that no recording is available, see `isConfigured()`).
* **Previous nasheed (2026-11-25 to 2026-11-26):** `assets/audio/abadan-la-lan-nahid.mp3`, «أبداً لا لن نحيد»
  (4:33), from the Internet Archive item [wa-a-3do-2](https://archive.org/details/wa-a-3do-2). It is no longer
  shipped; it remains in the git history.
* **Earlier nasheed (until 2026-11-24):** `assets/audio/ya-dhakir-al-ashab.mp3`, «يا ذاكر الأصحاب كن متأدباً» (3:09),
  from the Internet Archive item [ya-dakera-ass7abi](https://archive.org/details/ya-dakera-ass7abi). It is no longer
  shipped; it remains in the git history.

The page shows the photo and plays the nasheed only when `src` is a local path **and** `sourceUrl` and `license`
are filled in (`isConfigured()`).

## 3. Nasheed playback and browser autoplay rules

* **On entering the page** (a normal load, or coming back with Back/Forward), playback starts immediately,
  **from the beginning**.
* **Autoplay blocked:** browsers decide whether a page may start audio by itself. Desktop Chrome and Edge usually
  allow it once the visitor has interacted with the site, for example by clicking «من أنا». Safari and mobile
  browsers often refuse. When the browser refuses (`NotAllowedError`), the page shows a large «▶ اضغط لتشغيل النشيد»
  button with a short, plain message, and one tap starts the nasheed. No error is shown, and the status never
  says "playing" until sound has actually started (the media element's `playing` event).
* **Player:** play/pause, a progress bar you can drag, current time and duration, volume (remembered in the
  `nasheedVolume` key), and a status line.
* **Leaving the page:** `pagehide` pauses the nasheed. No other page plays it.
* **While on the page:** changing the language or the theme updates the labels only; the audio is not restarted.
* **Offline:** the service worker does not intercept audio (range requests go straight to the file), so the
  nasheed needs a connection unless the browser has cached it.

Tests (`tests/e2e/about.test.mjs`) load and play the real photo and nasheed files. They also check that the page shows no Quranic verse, that the photo keeps its natural proportions on desktop, tablet and phone widths, and that phones get the 800 px file. Autoplay is tested twice, once with Chromium allowing autoplay and once
with it refusing autoplay without a user gesture.

## 4. The rosary moved into Hisn al-Muslim

The electronic rosary was a separate nav item («📿 المسبحة») with its own dialog. It is now the last tab of
**حصن المسلم**, also labelled «📿 المسبحة».

* **Unchanged:** the counter button and reset button keep their ids (`#rosaryCounter`, `#rosaryReset`), so
  tap/Enter counting, vibration and reset work exactly as before. The count is still stored under the original
  `rosaryCount` key, so existing counts carry over (tested).
* **Added:** a choice of dhikr phrase and an optional target of 33 or 100, with a notice when the target is
  reached. These are stored under the new key `tasbeehPrefs`.
* **Old entry point:** anything that still opens `rosaryModal` (for example an old link) is redirected to
  Hisn al-Muslim, on the rosary tab (`registerDialogAlias` in `core/modal.js`).
* **Other small tools reviewed:** the remaining tools (daily wird, profile, favourites, Islamic search) are not
  worship counters and stay where they are.

## 5. Prayer learning lives in the academy

* **Side menu:** the «تعلم الصلاة» entry and its dialog were removed, because the academy now holds the full prayer
  course.
* **Content kept from the old dialog:**
  * the introduction and five steps, in all four languages (the same translation keys, so the texts are
    unchanged);
  * the video card for Sheikh Othman Al-Khamees's lesson, with the same link.

  They are now the academy lesson **«صفة صلاة النبي ﷺ»**, which is the first lesson of the prayer course and the
  «ابدأ هنا» button of the prayer track. Each step now uses the matching original diagram instead of the stock
  photographs the dialog used.
* **Academy:** renamed **«الأكاديمية التعليمية الإسلامية»** and moved up the home page, after the prayer times. It
  contains the course cards, then the full **«تعلم الصلاة الصحيحة»** track: 18 lessons, the illustrated tutorial,
  quizzes, and scholars and sources. The track keeps the id `#learnSection`, so the nav item
  «🕋 تعلم الصلاة الصحيحة» and the PWA shortcut still point to it.
