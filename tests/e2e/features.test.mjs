// Feature-preservation suite: every item of docs/feature_preservation_checklist.md, exercised in a real
// browser against the site served exactly as GitHub Pages serves it (static, /quran-website/ sub-path,
// no backend), with third-party APIs answered from the verified datasets.

import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import {
  ADHKAR, AYAHS, EDITIONS, FAKE_NOTIFICATIONS, FAKE_SPEECH, RECITERS, chromium, autoReveal, collectErrors, mockUpstream, sleep, startPagesServer,
} from './helpers.mjs';

let browser;
let site;

before(async () => {
  browser = await chromium.launch();
  site = await startPagesServer();
});
after(async () => {
  await browser?.close();
  await site?.close();
});

async function open({ viewport = { width: 1366, height: 900 }, geolocation = null, upstream = {}, init = [], storage = null, colorScheme = 'light' } = {}) {
  const context = await browser.newContext({
    viewport, colorScheme, locale: 'ar',
    ...(geolocation ? { geolocation, permissions: ['geolocation'] } : {}),
  });
  const calls = await mockUpstream(context, upstream);
  for (const script of init) await context.addInitScript(script);
  if (storage) await context.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, storage);
  const page = autoReveal(await context.newPage());
  const errors = collectErrors(page);
  await page.goto(site.url);
  await page.waitForSelector('#surahGrid .surah-card');
  return { context, page, errors, calls };
}

const close = async ({ context, errors }) => {
  await context.close();
  assert.deepEqual(errors, [], 'no JavaScript errors');
};

// ===================================================================== page & navigation
describe('page structure', () => {
  test('loads under the GitHub Pages sub-path with all sections and no errors', async () => {
    const s = await open();
    const { page } = s;
    assert.equal(await page.title(), 'القرآن الكريم | تلاوة، قراءة، أذكار وتفسير - The Noble Quran');
    assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
    for (const id of ['home', 'dashboardSection', 'prayerSection', 'surahs', 'audio', 'readingSection']) {
      assert.equal(await page.locator(`#${id}`).count(), 1, id);
    }
    assert.equal(await page.locator('.stat-card').count(), 4);
    assert.equal(await page.textContent('.site-footer .developer-name'), 'Developed by Obada najeeb AL-Qaisee #عبادة ابوفردة #');
    assert.equal(await page.locator('.site-footer a[href="https://www.instagram.com/obaalqaisee/"]').count(), 1);
    assert.equal(await page.locator('.site-footer a[href="https://web.facebook.com/obada.alqaisse"]').count(), 1);
    await close(s);
  });

  test('every original navigation item is reachable from the sidebar and works', async () => {
    const s = await open();
    const { page } = s;
    // The original top-bar items (السور، مواقيت الصلاة، حصن المسلم، الإسلام، بحث آيات، التسميع) are sidebar entries now.
    const routes = { quran: 'quran', prayer: 'prayer', adhkar: 'adhkar', islam: 'islam', memorize: 'memorize' };
    for (const [route, pageName] of Object.entries(routes)) {
      await page.click(`.side-link[data-route="${route}"]`);
      assert.equal(await page.evaluate(() => document.documentElement.dataset.page), pageName, route);
    }
    // «📿 المسبحة» stays a tab of Hisn al-Muslim, and also has its own sidebar entry.
    assert.equal(await page.textContent('#adhkarModal #tab_tasbeeh'), '📿 المسبحة');
    await page.click('.side-link[data-route="tasbih"]');
    assert.ok(await page.isVisible('#tasbeehPanel'));
    // Dialogs that became pages are open while their page is shown, and close when it is left.
    for (const [id, route] of [['adhkarModal', 'adhkar'], ['islamModal', 'islam'], ['voiceTestModal', 'memorize']]) {
      await page.click(`.side-link[data-route="${route}"]`);
      assert.ok(await page.locator(`#${id}`).evaluate((d) => d.open), `${id} shown`);
      await page.click('.side-link[data-route="home"]');
      assert.ok(!(await page.locator(`#${id}`).evaluate((d) => d.open)), `${id} closed on leaving`);
    }
    // Ayah search stays a modal dialog.
    await page.click('.side-link[data-open="ayahSearchModal"]');
    assert.ok(await page.locator('#ayahSearchModal').evaluate((d) => d.open));
    await page.keyboard.press('Escape');
    assert.ok(!(await page.locator('#ayahSearchModal').evaluate((d) => d.open)), 'closes on Escape');
    // Original in-page links still work.
    await page.locator('.hero a[href="#surahs"]').click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.page), 'quran');
    await page.goBack();
    await page.locator('.hero a[href="#audio"]').click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.page), 'audio');
    assert.equal(await page.locator('.logo').getAttribute('href'), '#/');
    await close(s);
  });

  test('menu items: favourites, profile, login, donate, contact; modals close by button, Escape and backdrop', async () => {
    const s = await open();
    const { page } = s;
    assert.equal(await page.locator('#learnPrayerModal').count(), 0);
    await page.click('.side-link[data-route="favorites"]');
    assert.ok(await page.locator('#favoritesModal').evaluate((d) => d.open));
    await page.click('.side-link[data-route="profile"]');
    assert.ok(await page.locator('#profileModal').evaluate((d) => d.open));
    await page.click('.side-group[data-group="more"] .side-group-btn');
    for (const id of ['loginModal', 'donateModal', 'contactModal']) {
      await page.click(`.side-link[data-open="${id}"]`);
      assert.ok(await page.locator(`#${id}`).evaluate((d) => d.open), id);
      await page.locator(`#${id} .close-btn`).click();
      assert.ok(!(await page.locator(`#${id}`).evaluate((d) => d.open)), `${id} closes by button`);
    }
    await page.click('.side-link[data-open="donateModal"]');
    await page.mouse.click(5, 300);
    assert.ok(!(await page.locator('#donateModal').evaluate((d) => d.open)), 'backdrop closes');
    // The former «تعلم الصلاة» dialog's content is the lesson «صفة صلاة النبي ﷺ».
    await page.locator('#learnSection [data-id="prophet-prayer"]').click();
    assert.equal(await page.locator('#lessonModal .prayer-step').count(), 5);
    assert.equal(await page.locator('#lessonModal a[href="https://www.youtube.com/watch?v=W-jX2kY0vR8"]').count(), 1);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#contactModal a[href="mailto:obadanajeeb155@gmail.com"]').count(), 1);
    assert.equal(await page.locator('#islamModal .islam-content h3').count(), 3);
    // Login → "open my profile" goes to the profile page and closes the login dialog.
    await page.click('.side-link[data-open="loginModal"]');
    await page.locator('#loginModal .btn-primary').click();
    assert.ok(await page.locator('#profileModal').evaluate((d) => d.open));
    assert.ok(!(await page.locator('#loginModal').evaluate((d) => d.open)));
    await close(s);
  });

  test('back-to-top button appears after scrolling and returns to the top', async () => {
    const s = await open();
    const { page } = s;
    assert.ok(await page.locator('#topButton').isHidden());
    await page.evaluate(() => window.scrollTo(0, 2500));
    await page.waitForSelector('#topButton:not([hidden])');
    await page.click('#topButton');
    await page.waitForFunction(() => window.scrollY < 50);
    await close(s);
  });
});

// ===================================================================== surahs
describe('surah list', () => {
  test('114 surahs with Arabic/English names and the three actions', async () => {
    const s = await open();
    const { page } = s;
    assert.equal(await page.locator('#surahGrid .surah-card').count(), 114);
    const first = page.locator('#surahGrid .surah-card').first();
    assert.match(await first.textContent(), /سورة ٱلْفَاتِحَةِ/);
    assert.match(await first.textContent(), /Al-Faatiha/);
    for (const action of ['fav', 'play', 'read']) assert.equal(await first.locator(`[data-action="${action}"]`).count(), 1);
    await close(s);
  });

  test('filter works with unvowelled Arabic (was broken), English and numbers', async () => {
    const s = await open();
    const { page } = s;
    const count = async (q) => { await page.fill('#searchInput', q); await sleep(250); return page.locator('#surahGrid .surah-card').count(); };
    assert.equal(await count('الفاتحة'), 1);
    assert.equal(await count('سورة البقرة'), 1);
    assert.equal(await count('fatiha'), 1);
    assert.equal(await count('114'), 1);
    assert.equal(await count('qwxv'), 0);
    assert.ok(await page.locator('#surahEmpty').isVisible());
    assert.equal(await count(''), 114);
    await close(s);
  });

  test('favourites: toggle, persist (original key), list, open, remove', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="fav"][data-surah="18"]');
    assert.equal(await page.textContent('#surahGrid [data-action="fav"][data-surah="18"]'), '⭐');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('favoriteSurahs'))), [18]);
    await page.click('.tool-card[data-open="favoritesModal"]');
    assert.equal(await page.locator('#favoritesList .surah-card').count(), 1);
    await page.locator('#favoritesList .action-btn').click();
    await page.waitForSelector('#readingText .ayah-span');
    assert.equal(await page.textContent('#readingLabel'), 'السورة رقم 18');
    await page.click('.tool-card[data-open="favoritesModal"]');
    await page.locator('#favoritesList .favorite-btn').click();
    assert.match(await page.textContent('#favoritesList'), /لم تحفظ أي سورة بعد/);
    await close(s);
  });
});

// ===================================================================== audio
describe('audio player', () => {
  test('all 16 reciters in the original order; playing uses the original URL', async () => {
    const s = await open();
    const { page } = s;
    const options = await page.locator('#reciterSelect option').evaluateAll((o) => o.map((x) => [x.value, x.textContent]));
    assert.deepEqual(options.map((o) => o[0]), RECITERS.map((r) => r.slug));
    assert.deepEqual(options.map((o) => o[1]), RECITERS.map((r) => r.name_ar));
    for (const reciter of RECITERS) {
      await page.selectOption('#reciterSelect', reciter.slug);
      await page.click('#surahGrid [data-action="play"][data-surah="1"]');
      await page.waitForFunction((src) => document.getElementById('audioPlayer').src === src, `${reciter.base_url}001.mp3`);
    }
    await page.waitForFunction(() => !document.getElementById('audioPlayer').paused);
    assert.equal(await page.textContent('#playerTitle'), 'سورة ٱلْفَاتِحَةِ');
    await close(s);
  });

  test('next / previous / loop / auto-advance / speed', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="play"][data-surah="2"]');
    await page.waitForFunction(() => /002\.mp3$/.test(document.getElementById('audioPlayer').src));
    await page.click('#nextSurahBtn');
    await page.waitForFunction(() => /003\.mp3$/.test(document.getElementById('audioPlayer').src));
    await page.click('#prevSurahBtn');
    await page.waitForFunction(() => /002\.mp3$/.test(document.getElementById('audioPlayer').src));
    await page.click('#loopSurahBtn');
    assert.equal(await page.getAttribute('#loopSurahBtn', 'aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.getElementById('audioPlayer').loop), true);
    assert.equal(await page.textContent('#loopSurahBtn'), 'تكرار السورة: مفعل 🔁');
    await page.click('#loopSurahBtn');
    await page.evaluate(() => document.getElementById('audioPlayer').dispatchEvent(new Event('ended')));
    await page.waitForFunction(() => /003\.mp3$/.test(document.getElementById('audioPlayer').src));
    await page.selectOption('#speedSelect', '1.25');
    assert.equal(await page.evaluate(() => document.getElementById('audioPlayer').playbackRate), 1.25);
    assert.equal(await page.evaluate(() => localStorage.getItem('playbackRate')), '1.25');
    await close(s);
  });

  test('changing the reciter replays the current surah with the new reciter', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="play"][data-surah="36"]');
    await page.waitForFunction(() => /basit\/036\.mp3$/.test(document.getElementById('audioPlayer').src));
    await page.selectOption('#reciterSelect', 'muaiqly');
    await page.waitForFunction(() => document.getElementById('audioPlayer').src === 'https://server12.mp3quran.net/maher/036.mp3');
    await close(s);
  });

  test('a failing link falls back to the reciter\'s current server (looked up by ID)', async () => {
    const s = await open({ upstream: { audioFail: (url) => url.includes('server7.mp3quran.net') } });
    const { page, calls } = s;
    await page.click('#surahGrid [data-action="play"][data-surah="5"]');
    await page.waitForFunction(() => document.getElementById('audioPlayer').src === 'https://cdn.mp3quran.net/audio/basit/r1/005.mp3');
    assert.ok(calls.some((c) => c.includes('mp3quran.net/api/v3/reciters?language=ar&reciter=51')));
    await close(s);
  });

  test('Al-Fatihah falls back to the Quran.mp3 stored on the site when every remote link fails', async () => {
    const s = await open({ upstream: { audioFail: () => true } });
    const { page } = s;
    await page.click('#surahGrid [data-action="play"][data-surah="1"]');
    await page.waitForFunction(() => document.getElementById('audioPlayer').src.endsWith('/quran-website/Quran.mp3'));
    await page.waitForFunction(() => /الشاطري/.test(document.getElementById('playerSubtitle').textContent));
    await page.click('#surahGrid [data-action="play"][data-surah="2"]');
    await page.waitForFunction(() => /تعذر تشغيل هذا القارئ/.test(document.getElementById('playerSubtitle').textContent));
    await close(s);
  });

  test('mini player appears when scrolled away from the player and controls playback', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="play"][data-surah="1"]');
    await page.waitForFunction(() => !document.getElementById('audioPlayer').paused);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForSelector('#miniPlayer:not([hidden])');
    assert.match(await page.textContent('#miniTitle'), /الفاتحة|ٱلْفَاتِحَةِ/);
    await page.click('#miniPlay');
    await page.waitForFunction(() => document.getElementById('audioPlayer').paused);
    await page.click('#miniNext');
    await page.waitForFunction(() => /002\.mp3$/.test(document.getElementById('audioPlayer').src));
    await close(s);
  });
});

// ===================================================================== reading
describe('reading view', () => {
  test('basmala shown once: header for surahs 2–114 (not 9), stripped from ayah 1; Al-Fatihah keeps it as ayah 1', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="read"][data-surah="2"]');
    await page.waitForSelector('#ayah-285');
    assert.ok(await page.isVisible('#readingBasmala'));
    const ayah1 = await page.textContent('#ayah-0');
    assert.ok(!ayah1.includes('بِسْمِ'), `ayah 2:1 must not contain the basmala: ${ayah1}`);
    assert.match(ayah1, /^الٓمٓ ﴿1﴾$/);
    assert.equal(await page.locator('#readingText .ayah-span').count(), 286);
    await page.evaluate(() => document.querySelector('#surahGrid [data-action="read"][data-surah="1"]').click());
    await page.waitForFunction(() => document.querySelectorAll('#readingText .ayah-span').length === 7);
    assert.ok(await page.isHidden('#readingBasmala'));
    assert.match(await page.textContent('#ayah-0'), /^بِسْمِ/);
    await page.evaluate(() => document.querySelector('#surahGrid [data-action="read"][data-surah="9"]').click());
    await page.waitForFunction(() => document.querySelectorAll('#readingText .ayah-span').length === 129);
    assert.ok(await page.isHidden('#readingBasmala'));
    await close(s);
  });

  test('Quran text displayed is exactly the verified source text', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="read"][data-surah="112"]');
    await page.waitForSelector('#ayah-3');
    const shown = await page.locator('#readingText .ayah-span').evaluateAll((spans) => spans.map((sp) => sp.firstChild.textContent.trim()));
    const source = AYAHS.filter((a) => a.surah === 112).map((a) => a.text);
    assert.equal(shown.length, 4);
    shown.slice(1).forEach((t, i) => assert.equal(t, source[i + 1]));
    assert.ok(source[0].endsWith(shown[0]));
    await close(s);
  });

  test('ayah click: audio, highlight, tafsir + translation; keyboard works; bookmark + resume + wird', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="read"][data-surah="2"]');
    await page.waitForSelector('#ayah-254');
    await page.click('#ayah-254');
    await page.waitForFunction(() => document.getElementById('ayahPlayer').src.endsWith('/ar.alafasy/262.mp3'));
    assert.ok(await page.locator('#ayah-254').evaluate((e) => e.classList.contains('active-ayah')));
    await page.waitForFunction((txt) => document.getElementById('tafsirText').textContent === txt, EDITIONS['ar.muyassar'][261]);
    await page.waitForFunction((txt) => document.getElementById('translationText').textContent === txt, EDITIONS['en.sahih'][261]);
    assert.equal(await page.textContent('#detailsAyahNumber'), 'الآية ﴿255﴾');
    // Keyboard
    await page.focus('#ayah-0');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.getElementById('ayahPlayer').src.endsWith('/ar.alafasy/8.mp3'));
    // Ayah loop
    await page.check('#ayahLoopCheck');
    assert.ok(await page.evaluate(() => document.getElementById('ayahPlayer').loop));
    // Bookmark (original storage format) → banner → wird
    await page.click('#ayah-4');
    await page.click('#saveBookmarkBtn');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('quranBookmark'))), { surahNum: 2, ayahIndex: 4, ayahNumInSurah: 5 });
    assert.match(await page.textContent('#saveBookmarkBtn'), /✅/);
    assert.ok(await page.isChecked('[data-wird="quran"]'));
    assert.match(await page.textContent('#bookmarkBanner'), /إكمال القراءة \(سورة البَقَرَةِ، آية 5\)/);
    await page.reload();
    await page.waitForSelector('#bookmarkBanner button');
    await page.click('#bookmarkBanner button');
    await page.waitForFunction(() => document.getElementById('ayah-4')?.classList.contains('active-ayah'));
    await close(s);
  });

  test('playing an ayah pauses the surah player and vice versa', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="play"][data-surah="1"]');
    await page.waitForFunction(() => !document.getElementById('audioPlayer').paused);
    await page.click('#surahGrid [data-action="read"][data-surah="1"]');
    await page.waitForSelector('#ayah-2');
    await page.click('#ayah-2');
    await page.waitForFunction(() => document.getElementById('audioPlayer').paused && !document.getElementById('ayahPlayer').paused);
    await close(s);
  });

  test('font size controls change and remember the Quran text size', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="read"][data-surah="1"]');
    await page.waitForSelector('#ayah-0');
    const size = () => page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('readingText')).fontSize));
    const before = await size();
    await page.click('#fontLarger');
    await page.click('#fontLarger');
    assert.ok((await size()) > before);
    await page.reload();
    await page.waitForSelector('#surahGrid .surah-card');
    await page.click('#surahGrid [data-action="read"][data-surah="1"]');
    await page.waitForSelector('#ayah-0');
    assert.ok((await size()) > before, 'font size remembered');
    await close(s);
  });

  test('a network error shows a retry button that recovers', async () => {
    const s = await open();
    const { page, context } = s;
    await context.route(/api\.alquran\.cloud\/v1\/surah\/3\//, (route) => route.abort());
    await page.click('#surahGrid [data-action="read"][data-surah="3"]');
    await page.waitForSelector('#readingText .error-state button');
    await context.unroute(/api\.alquran\.cloud\/v1\/surah\/3\//);
    await page.click('#readingText .error-state button');
    await page.waitForSelector('#ayah-199');
    s.errors.length = 0; // the aborted request logs a network error by design
    await close(s);
  });
});

// ===================================================================== prayer & dashboard
describe('prayer times and dashboard', () => {
  test('uses geolocation when allowed; five localised cards; next prayer highlighted; countdown runs', async () => {
    const s = await open({ geolocation: { latitude: 31.9539, longitude: 35.9106 } });
    const { page, calls } = s;
    await page.waitForSelector('.prayer-card');
    assert.equal(await page.locator('.prayer-card').count(), 5);
    assert.equal(await page.textContent('#prayerLocation'), 'توقيت الصلاة حسب موقعك الحالي 📍');
    assert.ok(calls.some((c) => /aladhan\.com\/v1\/timings\/\d\d-\d\d-\d{4}\?latitude=31\.9539&longitude=35\.9106&method=8/.test(c)));
    assert.equal(await page.locator('.prayer-card.next').count(), 1);
    assert.match(await page.textContent('#hijriDateDisplay'), /9 جُمادى الآخرة 1448 هـ/);
    const c1 = await page.textContent('#prayerCountdown');
    await sleep(1200);
    assert.notEqual(await page.textContent('#prayerCountdown'), c1);
    assert.match(await page.textContent('#prayerCountdown'), /^\d\d:\d\d:\d\d$/);
    await close(s);
  });

  test('falls back to Amman when location is unavailable (original default)', async () => {
    const s = await open();
    const { page, calls } = s;
    await page.waitForSelector('.prayer-card');
    assert.equal(await page.textContent('#prayerLocation'), 'توقيت عمّان، الأردن (الافتراضي)');
    assert.ok(calls.some((c) => c.includes('timingsByCity') && c.includes('city=Amman&country=Jordan&method=8')));
    await close(s);
  });

  test('notifications: a warning with the real minutes left, then "it is time" — even with throttled timers', async () => {
    // Deterministic clock: 12:18:30 local time, Dhuhr at 12:22 (3.5 minutes away).
    const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, locale: 'ar' });
    await mockUpstream(context, { timings: () => ({ Fajr: '05:36', Sunrise: '07:08', Dhuhr: '12:22', Asr: '15:16', Sunset: '17:35', Maghrib: '17:35', Isha: '19:05' }) });
    await context.addInitScript(FAKE_NOTIFICATIONS);
    const page = autoReveal(await context.newPage());
    if (!page.clock) { await context.close(); return; } // Playwright without clock control
    await page.clock.install({ time: new Date(2026, 10, 19, 12, 18, 30) });
    const errors = collectErrors(page);
    await page.goto(site.url);
    await page.waitForSelector('.prayer-card');
    await page.click('.tool-card[data-open="profileModal"]');
    await page.click('#notifyBtn');
    await page.waitForFunction(() => /✅/.test(document.getElementById('notifyBtn').textContent));
    assert.equal(await page.evaluate(() => localStorage.getItem('prayerNotify')), 'true');
    await page.clock.runFor(2000);
    await page.waitForFunction(() => window.__notifications.length === 1);
    assert.equal((await page.evaluate(() => window.__notifications))[0].body, 'بقي 4 دقائق على صلاة الظهر');
    // Jump past Dhuhr without running the intermediate one-second ticks, as a throttled background
    // tab experiences it; then let a single tick run.
    await page.clock.fastForward('04:00');
    await page.clock.runFor(1100);
    await page.waitForFunction(() => window.__notifications.length >= 2);
    const bodies = (await page.evaluate(() => window.__notifications)).map((n) => n.body);
    assert.ok(bodies.includes('حان الآن موعد صلاة الظهر'), JSON.stringify(bodies));
    assert.equal(bodies.filter((b) => b.includes('الظهر')).length, 2, 'each notice is sent once');
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('daily wird: four items, progress, persisted under today\'s local date', async () => {
    const s = await open();
    const { page } = s;
    assert.equal(await page.locator('[data-wird]').count(), 4);
    await page.check('[data-wird="morning"]');
    await page.check('[data-wird="prayer"]');
    assert.equal(await page.textContent('#wirdSummary'), '2 من 4 مكتمل');
    assert.equal(await page.getAttribute('#wirdProgress', 'aria-valuenow'), '50');
    const key = await page.evaluate(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('dailyWird')));
    assert.deepEqual(stored[key], { quran: false, morning: true, evening: false, prayer: true });
    await page.reload();
    assert.ok(await page.isChecked('[data-wird="morning"]'));
    await close(s);
  });
});

// ===================================================================== adhkar, rosary, searches, profile
describe('tools', () => {
  test('Hisn al-Muslim: five tabs with the original adhkar; counting; finishing morning ticks the wird', async () => {
    const s = await open();
    const { page } = s;
    await page.click('[data-open="adhkarModal"]');
    for (const [type, list] of Object.entries(ADHKAR)) {
      await page.click(`#tab_${type}`);
      assert.equal(await page.locator('#adhkarGrid .adhkar-card').count(), list.length, type);
      assert.equal(await page.locator('#adhkarGrid .adhkar-text').first().textContent(), list[0].text);
    }
    await page.click('#tab_morning');
    const counts = ADHKAR.morning.map((d) => d.count);
    for (let i = 0; i < counts.length; i += 1) {
      for (let c = 0; c < counts[i]; c += 1) await page.locator(`#adhkarGrid [data-index="${i}"]`).click();
    }
    assert.equal(await page.locator('#adhkarGrid .adhkar-card.done').count(), counts.length);
    assert.ok(await page.isChecked('[data-wird="morning"]'));
    await page.click('#adhkarReset');
    assert.equal(await page.locator('#adhkarGrid .adhkar-card.done').count(), 0);
    await close(s);
  });

  test('rosary: tap and keyboard increment, survives reload, resets', async () => {
    const s = await open();
    const { page } = s;
    // The rosary now lives in Hisn al-Muslim («المسبحة» tab).
    await page.click('.nav-links [data-open="adhkarModal"]');
    await page.click('#tab_tasbeeh');
    await page.click('#rosaryCounter');
    await page.click('#rosaryCounter');
    await page.focus('#rosaryCounter');
    await page.keyboard.press('Enter');
    assert.equal(await page.textContent('#rosaryCounter'), '3');
    await page.reload();
    await page.waitForSelector('#surahGrid .surah-card');
    assert.equal(await page.textContent('#rosaryCounter'), '3');
    await page.evaluate(() => document.querySelector('[data-open="adhkarModal"]').click());
    await page.click('#tab_tasbeeh');
    await page.click('#rosaryReset');
    assert.equal(await page.textContent('#rosaryCounter'), '0');
    await close(s);
  });

  test('ayah search: results open the reading view at the ayah; empty results; query is URL-encoded', async () => {
    const s = await open();
    const { page, calls } = s;
    await page.click('[data-open="ayahSearchModal"]');
    await page.fill('#ayahSearchInput', 'قل هو الله احد');
    await page.press('#ayahSearchInput', 'Enter');
    await page.waitForSelector('#ayahSearchResults .search-result');
    assert.ok(calls.some((c) => c.includes(encodeURIComponent('قل هو الله احد'))));
    await page.locator('#ayahSearchResults .search-result').first().click();
    await page.waitForFunction(() => document.getElementById('ayah-0')?.classList.contains('active-ayah'));
    assert.equal(await page.textContent('#readingLabel'), 'السورة رقم 112');
    await page.click('[data-open="ayahSearchModal"]');
    await page.fill('#ayahSearchInput', 'كلمةغيرموجودة');
    await page.click('#ayahSearchForm button[type="submit"]');
    await page.waitForSelector('#ayahSearchResults .error-state');
    s.errors.length = 0; // a 404 for "no results" is how the upstream API answers
    await close(s);
  });

  test('Islamic search: surahs, adhkar, Message of Islam, empty prompt', async () => {
    const s = await open();
    const { page } = s;
    await page.click('.tool-card[data-open="islamicSearchModal"]');
    await page.press('#islamicSearchInput', 'Enter');
    assert.match(await page.textContent('#islamicSearchResults'), /اكتب كلمة للبحث/);
    await page.fill('#islamicSearchInput', 'الكهف');
    await page.press('#islamicSearchInput', 'Enter');
    assert.match(await page.textContent('#islamicSearchResults'), /الكَهۡفِ|الكهف|ٱلْكَهْفِ/);
    await page.fill('#islamicSearchInput', 'سبحان الله وبحمده');
    await page.press('#islamicSearchInput', 'Enter');
    assert.ok((await page.locator('#islamicSearchResults .search-result').count()) >= 2);
    await page.fill('#islamicSearchInput', 'الإرهاب');
    await page.press('#islamicSearchInput', 'Enter');
    await page.locator('#islamicSearchResults').getByText('فتح المحتوى').click();
    assert.ok(await page.locator('#islamModal').evaluate((d) => d.open));
    await close(s);
  });

  test('profile: save, welcome toast after reload, statistics, reset with confirmation', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="fav"][data-surah="1"]');
    await page.check('[data-wird="quran"]');
    await page.click('.tool-card[data-open="profileModal"]');
    await page.fill('#profileName', 'عبادة');
    await page.fill('#profileGoal', 'حفظ جزء عم');
    await page.click('#profileForm button[type="submit"]');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('islamicProfile'))), { name: 'عبادة', goal: 'حفظ جزء عم' });
    await page.reload();
    await page.waitForFunction(() => /مرحبًا عبادة/.test(document.getElementById('toast').textContent));
    await page.click('.tool-card[data-open="profileModal"]');
    assert.equal(await page.inputValue('#profileName'), 'عبادة');
    assert.equal(await page.textContent('#profileWirdStat'), '25%');
    assert.equal(await page.textContent('#profileFavStat'), '1');
    page.once('dialog', (d) => d.accept());
    await page.click('#resetLocalData');
    assert.equal(await page.evaluate(() => localStorage.getItem('favoriteSurahs')), null);
    assert.equal(await page.textContent('#profileFavStat'), '0');
    assert.equal(await page.textContent('#surahGrid [data-action="fav"][data-surah="1"]'), '☆');
    await close(s);
  });

  test('memorisation lab (was crashing): correct ayahs are revealed, wrong ones rejected, completion', async () => {
    const s = await open({ init: [FAKE_SPEECH] });
    const { page } = s;
    await page.click('[data-open="voiceTestModal"]');
    await page.selectOption('#voiceSurahSelect', '112');
    await page.waitForSelector('#recitedAyahsContainer .recited-ready');
    await page.click('#micBtn');
    await page.waitForFunction(() => window.__recognition?.running);
    await page.evaluate(() => window.__speak('السلام عليكم ورحمة الله'));
    assert.match(await page.textContent('#voiceFeedback'), /لم أتعرف على الآية/);
    const lines = ['قل هو الله احد', 'الله الصمد', 'لم يلد ولم يولد', 'ولم يكن له كفوا احد'];
    for (const [i, line] of lines.entries()) {
      await page.waitForFunction(() => window.__recognition?.running);
      await page.evaluate((l) => window.__speak(l), line);
      await page.waitForFunction((n) => document.querySelectorAll('#recitedAyahsContainer .ayah-span').length === n, i + 1);
    }
    assert.match(await page.textContent('#voiceFeedback'), /أتممت السورة بنجاح/);
    assert.ok(!(await page.textContent('#recitedAyahsContainer')).includes('بِسْمِ'), 'basmala is not part of ayah 1');
    await close(s);
  });
});

// ===================================================================== language & theme
describe('languages and theme', () => {
  test('switching to English/Spanish/French translates, flips direction and is remembered', async () => {
    const s = await open();
    const { page } = s;
    await page.selectOption('#langSelect', 'en');
    assert.equal(await page.getAttribute('html', 'dir'), 'ltr');
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    assert.equal(await page.textContent('#heroTitle'), 'The Holy Quran');
    assert.equal(await page.locator('#reciterSelect option').first().textContent(), 'Abdul Basit Abdul Samad');
    assert.match(await page.textContent('#surahGrid .surah-card h3'), /Al-Faatiha/);
    await page.waitForSelector('.prayer-card');
    assert.equal(await page.locator('.prayer-card h3').first().textContent(), 'Fajr');
    await page.reload();
    await page.waitForSelector('#surahGrid .surah-card');
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    await page.selectOption('#langSelect', 'es');
    assert.equal(await page.textContent('#heroTitle'), 'El Sagrado Corán');
    assert.equal(await page.textContent('#tab_tasbeeh'), '📿 Tasbih'); // the rosary's label, now its Hisn al-Muslim tab
    await page.selectOption('#langSelect', 'fr');
    assert.equal(await page.textContent('#heroTitle'), 'Le Saint Coran');
    await page.click('#surahGrid [data-action="read"][data-surah="1"]');
    await page.waitForSelector('#ayah-0');
    await page.click('#ayah-1');
    await page.waitForFunction((txt) => document.getElementById('translationText').textContent === txt, EDITIONS['fr.hamidullah'][1]);
    assert.ok(await page.isHidden('#tafsirWrapper'), 'tafsir is shown with the Arabic interface only (as before)');
    await page.selectOption('#langSelect', 'ar');
    assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
    await page.waitForFunction((txt) => document.getElementById('tafsirText').textContent === txt, EDITIONS['ar.muyassar'][1]);
    await close(s);
  });

  test('dark mode toggles, is remembered, and follows the system on first visit', async () => {
    const s = await open();
    const { page } = s;
    assert.ok(!(await page.evaluate(() => document.documentElement.classList.contains('dark-mode'))));
    await page.click('#themeToggle');
    assert.ok(await page.evaluate(() => document.documentElement.classList.contains('dark-mode')));
    assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'dark');
    assert.equal(await page.textContent('#themeToggle .theme-icon'), '☀️');
    await page.reload();
    assert.ok(await page.evaluate(() => document.documentElement.classList.contains('dark-mode')));
    await close(s);
    const d = await open({ colorScheme: 'dark' });
    assert.ok(await d.page.evaluate(() => document.documentElement.classList.contains('dark-mode')));
    await close(d);
  });

  test('existing visitors keep their data (original storage formats are read)', async () => {
    const s = await open({ storage: {
      theme: 'dark', favoriteSurahs: '[36,67]', quranBookmark: '{"surahNum":18,"ayahIndex":9,"ayahNumInSurah":10}',
      islamicProfile: '{"name":"Ali","goal":"x"}',
    } });
    const { page } = s;
    assert.ok(await page.evaluate(() => document.documentElement.classList.contains('dark-mode')));
    assert.equal(await page.textContent('#surahGrid [data-action="fav"][data-surah="67"]'), '⭐');
    assert.match(await page.textContent('#bookmarkBanner'), /آية 10/);
    await close(s);
  });

  test('corrupt local storage never breaks the page', async () => {
    const s = await open({ storage: { favoriteSurahs: '{oops', quranBookmark: 'nonsense', dailyWird: '[1,2', islamicProfile: '"x"' } });
    assert.equal(await s.page.locator('#surahGrid .surah-card').count(), 114);
    await close(s);
  });
});
