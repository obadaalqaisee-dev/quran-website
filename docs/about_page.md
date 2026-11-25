# The «من أنا» page, and the reorganisation of the rosary and prayer learning

## 1. The «من أنا» page (`about.html`)

A separate page, not a dialog. It is reached from the nav bar (🕊️ من أنا) and from the side menu. Because it is
a real page, the browser's back and forward buttons work natively. It shares the site's stylesheet, design
tokens, light/dark theme, language selector and Content Security Policy. The CSP is byte-identical to
`index.html`'s, which a test checks.

| Part | Content |
|---|---|
| Header | A pointed-arch artwork with the title «من أنا». Al-Isra 17:1 is loaded from the verified Quran dataset; it is never typed by hand. |
| Photo | The Dome of the Rock in Al-Aqsa Mosque (see §2). |
| Nasheed | An autoplaying player (see §3). |
| Developers | Two cards with exactly the information supplied: **عبادة أبو فردة**, طالب في جامعة الزيتونة الأردنية, التخصص: الذكاء الاصطناعي; **يونس أبو صعيلك**, طالب في الجامعة الهاشمية. Side by side from 721 px wide, stacked below. No other personal details were added. |
| Dedication | «تم تطوير هذا الموقع لوجه الله تعالى، ابتغاء الأجر والثواب، وخدمةً لكتاب الله وسنة نبيه ﷺ.» / بواسطة: / «عبادة أبو فردة ويونس أبو صعيلك.» |

Files: `about.html`, `assets/js/about.js` (page script), `assets/js/data/about-media.js` (media configuration),
and section 18 of `assets/css/main.css`. The service worker precaches the page, so it works offline after a first
visit. `sitemap.xml` lists it. In development, the backend serves it like `index.html`.

## 2. Media

Both files are local and configured in `assets/js/data/about-media.js` with their source and licence:

* **Photo:** `assets/img/about/dome-of-the-rock.webp`, قبة الصخرة المشرفة in Al-Aqsa Mosque, with the Dome of
  the Chain in front. A Wikimedia Commons featured picture by Andrew Shiva, CC BY-SA 4.0
  ([file page](https://commons.wikimedia.org/wiki/File:Jerusalem-2013-Temple_Mount-Dome_of_the_Rock_%26_Chain_02.jpg)).
  It was cropped to 1280 × 800 around the golden dome and saved as WebP (~100 KB). The caption credits the photographer
  and links the file page, and the service worker precaches it.
* **Nasheed (since 2026-11-25):** `assets/audio/abadan-la-lan-nahid.mp3`, «أبداً لا لن نحيد» (4:33, MP3 128 kbps).
  It replaced «يا ذاكر الأصحاب كن متأدباً» at the site owner's request; the player, autoplay behaviour and controls
  are unchanged.
  * **What it is:** track 5, «جند الله», of the album «وأعدوا 2» by تسجيلات الإسراء (Kuwait), performed by عبدالله
    الكندري and صباح عنان. The album's track list names it «جند الله أبداً لا لن نحيد».
  * **Source:** the Internet Archive item [wa-a-3do-2](https://archive.org/details/wa-a-3do-2), file
    `Wa_A3edoo_2_-_05_-_Jond_Allah.mp3`. The shipped file is byte-identical to it (MD5
    `40374cad3619ef30d6ae0dab9d99d2c1`, the value the archive publishes; a unit test checks it).
  * **How it was identified:** three independent archive.org uploads carry this title with matching durations
    (4:28–4:33): `wa-a-3do-2` (full album with label and performers), `lalnn7ed` and `dawla_20140501_1353`. The
    album upload was chosen because it is fully attributed. The other two were not used: one is flagged
    "deemphasize" by the archive, and the other comes from an uploader whose name suggested an extremist-media source.
    The audio itself was not listened to during development; identification rests on this metadata.
  * **Rights:** the file's ID3 tag reads «©2002 Enshad.com». No upload states a licence or a permission to
    redistribute. The site owner was told this and chose to use the recording on their own responsibility. If a
    rights holder objects, replace `src` in `assets/js/data/about-media.js` (the page then says plainly that no
    recording is available, see `isConfigured()`).
* **Previous nasheed (until 2026-11-24):** `assets/audio/ya-dhakir-al-ashab.mp3`, «يا ذاكر الأصحاب كن متأدباً» (3:09),
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

Tests (`tests/e2e/about.test.mjs`) load and play the real photo and nasheed files. Autoplay is tested twice, once with Chromium allowing autoplay and once
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
