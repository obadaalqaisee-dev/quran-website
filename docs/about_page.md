# The «من أنا» page, and the reorganisation of the rosary and prayer learning

## 1. The «من أنا» page (`about.html`)

A separate page, not a dialog. It is reached from the nav bar (🕊️ من أنا) and from the side menu. Because it is
a real page, the browser's back and forward buttons work natively. It shares the site's stylesheet, design
tokens, light/dark theme, language selector and Content Security Policy. The CSP is byte-identical to
`index.html`'s, which a test checks.

| Part | Content |
|---|---|
| Title | «من أنا» is the page's `h1` for screen readers and the browser tab; it is not shown on screen (at the site owner's request, 2026-11-27). The former header band (pointed-arch artwork with the visible title and Al-Isra 17:1) was removed. At the owner's request the page no longer shows a Quranic verse, and the code that loaded it was removed. |
| Video | The site owner's own video of the Al-Aqsa courtyard and the Qibli Mosque, at the top of the page: silent, no controls, autoplaying in an endless loop (see §2). It replaced the aerial photograph on 2026-11-27. |
| Nasheed | Plays automatically in the background; no player is shown (see §3). |
| Developers | Two cards with exactly the information supplied: **عبادة أبو فردة**, طالب في جامعة الزيتونة الأردنية, التخصص: الذكاء الاصطناعي; **يونس أبو صعيلك**, طالب في الجامعة الهاشمية. Side by side from 721 px wide, stacked below. No other personal details were added. |
| Dedication | «تم تطوير هذا الموقع لوجه الله تعالى، ابتغاء الأجر والثواب، وخدمةً لكتاب الله وسنة نبيه ﷺ.» / بواسطة: / «عبادة أبو فردة ويونس أبو صعيلك.» |

Files: `about.html`, `assets/js/about.js` (page script), `assets/js/data/about-media.js` (media configuration),
and section 18 of `assets/css/main.css`. The service worker precaches the page, so it works offline after a first
visit. `sitemap.xml` lists it. In development, the backend serves it like `index.html`.

## 2. Media

Both files are local and configured in `assets/js/data/about-media.js` with their source and licence:

* **Video (since 2026-11-27):** `assets/video/about/al-aqsa-courtyard.mp4` (478 × 850 portrait, 27 s, 30 fps,
  ~3.4 MB) and its first frame `al-aqsa-courtyard-poster.webp` (~24 KB): the site owner's own recording of the
  courtyard of المسجد الأقصى المبارك with المسجد القبلي. Provided by the owner; it replaced the aerial photograph.
  * **Changes:** re-encoded to H.264 (`-crf 25`, `+faststart`, so playback starts before the download ends) and
    **the audio track was removed**, so the video can never make sound whatever the browser does.
  * **Display:** `<video autoplay muted loop playsinline preload="auto" disablepictureinpicture disableremoteplayback>`
    with no `controls`, in the same rounded card the photo used, captioned «المسجد الأقصى المبارك». It is centred
    and sized so the whole portrait frame fits the screen: `width: min(100%, 440px, 78svh × 478/850)`. It ignores
    pointer events. `about.js` also sets the `muted` property and re-mutes it if anything unmutes it. That
    only ever touches the video element, never the nasheed or any page-wide setting.
  * **Offline:** the service worker does not intercept or precache the MP4 (it is streamed with range requests).
    The poster is precached, so offline the first frame is shown.
* **Previous photo (2026-11-27, same day):** `al-aqsa-compound-1440.webp` / `-800.webp`, an aerial view of the
  compound (Andrew Shiva / Wikipedia, CC BY-SA 4.0, from
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Jerusalem-A-Quds-2013(2)-Aerial-Al-Aqsa_Mosque_Compound-(south_exposure).jpg)).
  Replaced by the owner's video. It is no longer shipped; it remains in the git history.
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

The page plays the nasheed only when its `src` is a local path **and** `sourceUrl` and `license` are filled in
(`isConfigured()`).

## 3. Nasheed playback and browser autoplay rules

* **On entering the page** (a normal load, or coming back with Back/Forward), playback starts immediately,
  **from the beginning**.
* **No visible player (since 2026-11-27, at the owner's request):** the card, music icon, play button, progress
  bar, time, volume slider and status line were removed. Only a hidden `<audio id="nasheedAudio">` remains, with
  the same file and the same playback logic, at full volume (`volume = 1`, never muted). The old `nasheedVolume`
  key is no longer read. The state is exposed as `data-state` on the audio element (for tests).
* **Autoplay blocked:** browsers decide whether a page may start audible audio by itself. Desktop Chrome and Edge
  usually allow it once the visitor has interacted with the site, for example by clicking «من أنا». Safari and mobile
  browsers often refuse. When the browser refuses (`NotAllowedError`), no player is brought back: the nasheed starts
  on the visitor's **first interaction anywhere on the page** (tap, click or key press; `pointerdown`, `pointerup`,
  `touchend`, `keydown`, `click`), and those listeners are removed as soon as it plays. The muted video is not
  affected: browsers allow muted autoplay, so it plays either way.
* **Video and nasheed are independent:** two separate media elements. The video is muted and has no audio track;
  the nasheed is never muted. Neither changes the other.
* **Leaving the page:** `pagehide` pauses the nasheed. No other page plays it.
* **While on the page:** changing the language or the theme never restarts or stops the nasheed or the video.
* **Offline:** the service worker does not intercept audio (range requests go straight to the file), so the
  nasheed needs a connection unless the browser has cached it.

Tests (`tests/e2e/about.test.mjs`) load and play the real video and nasheed files. They check that the video and the nasheed play at the same time, with the video muted, looping and without controls, and the nasheed audible at full volume. They check that no part of the old player is rendered and that the page shows no Quranic verse. They also check that the video keeps its proportions and fits the screen at desktop, tablet and phone sizes. Autoplay is tested twice: once with Chromium allowing autoplay, and once with it refusing audible autoplay without a user gesture, where the first tap or key press starts the nasheed.

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
