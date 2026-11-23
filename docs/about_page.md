# The «من أنا» page, and the reorganisation of the rosary and prayer learning

## 1. The «من أنا» page (`about.html`)

A separate page, not a dialog. It is reached from the nav bar (🕊️ من أنا) and from the side menu. Because it is
a real page, the browser's back and forward buttons work natively. It shares the site's stylesheet, design
tokens, light/dark theme, language selector and Content Security Policy. The CSP is byte-identical to
`index.html`'s, which a test checks.

| Part | Content |
|---|---|
| Header | A pointed-arch artwork with the title «من أنا». Al-Isra 17:1 is loaded from the verified Quran dataset; it is never typed by hand. |
| Photo | The Al-Aqsa photograph. It is shown only once a verified, licensed local file is configured (see §2). |
| Nasheed | An autoplaying player (see §3). |
| Developers | Two cards with exactly the information supplied: **عبادة أبو فردة**, طالب في جامعة الزيتونة الأردنية, التخصص: الذكاء الاصطناعي; **يونس أبو صعيلك**, طالب في الجامعة الهاشمية. Side by side from 721 px wide, stacked below. No other personal details were added. |
| Dedication | «تم تطوير هذا الموقع لوجه الله تعالى، ابتغاء الأجر والثواب، وخدمةً لكتاب الله وسنة نبيه ﷺ.» / بواسطة: / «عبادة أبو فردة ويونس أبو صعيلك.» |

Files: `about.html`, `assets/js/about.js` (page script), `assets/js/data/about-media.js` (media configuration),
and section 18 of `assets/css/main.css`. The service worker precaches the page, so it works offline after a first
visit. `sitemap.xml` lists it. In development, the backend serves it like `index.html`.

## 2. Media: what is still needed, and how to add it

The photograph and the recording must be **authentic and properly licensed**. While this was built, the
development environment could not reach Wikimedia Commons, YouTube, archive.org or any other media host (the
network proxy refused every connection). So no photograph could be checked, and no recording could be verified
to contain the requested lyrics. Nothing was invented or substituted:

* **No photo configured:** the header shows only the decorative artwork. It is not labelled as Al-Aqsa, and no
  other mosque is shown in its place.
* **No recording configured:** the player says «لم يُضف تسجيل النشيد بعد», its controls are disabled, and
  nothing is played.

### Adding the Al-Aqsa photograph

1. Choose an authentic photograph of Al-Aqsa Mosque (the Qibli mosque or the compound, *not* another mosque) whose
   licence allows republication. Wikimedia Commons has many under CC BY / CC BY-SA. Read the file page: the
   licence, the author, and that the place shown is Al-Aqsa.
2. Resize it to about 1600 × 1000 px and save it as WebP or JPEG, ideally under about 250 KB.
3. Save it as `assets/img/about/al-aqsa.webp`.
4. In `assets/js/data/about-media.js`, set `image.src` to that path, and fill in `credit`, `license`, `licenseUrl` and
   `sourceUrl` exactly as the licence requires. The caption under the photo is built from these fields.
5. Add the file to `SHELL_FILES` in `sw.js` and bump `VERSION`, so the photo is available offline.

The page shows the photo only when `src` is a local path **and** `sourceUrl` and `license` are filled in
(`isConfigured()`), so it cannot be published without its provenance.

### Adding the nasheed

1. Obtain a recording of the nasheed whose lyrics begin «سبّوا خيار الخلق من لهم العلى ولهم مقام في ذرى الأحساب...».
   Listen to it and confirm the lyrics.
2. Confirm that you may publish it: written permission from the munshid or publisher, or an explicit free licence.
   A video on a sharing platform is not a licence.
3. Save it locally as `assets/audio/nasheed.mp3`. MP3 at 96–128 kbps is enough.
4. In `about-media.js`, set `nasheed.src`, and fill in `title`, `performer`, `license` and `sourceUrl`.

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

Tests (`tests/e2e/about.test.mjs`) cover the shipped state as it is. They also run every configured code path
with **test-only stand-in media** (the site's own `Quran.mp3` and icon), injected into the browser by the test;
these stand-ins never appear on the site. Autoplay is tested twice, once with Chromium allowing autoplay and once
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
