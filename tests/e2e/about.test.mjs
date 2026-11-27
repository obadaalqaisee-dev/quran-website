// The «من أنا» page (about.html), the rosary in Hisn al-Muslim, and the prayer lesson migrated into the
// academy. The site is served like GitHub Pages; third-party APIs are answered from the verified datasets.
//
// Media: the page ships the site owner's silent, looping video of the Al-Aqsa courtyard (it replaced the aerial photograph)
// and the nasheed «فردوس الرحمن ظلال» («تبصرة», محمد المقيط; it replaced «أبداً لا لن نحيد», which had replaced «يا ذاكر
// الأصحاب كن متأدباً», at the site owner's request), played in the background with no visible player. Both are local
// files; the tests play the real files.

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { REPO, chromium, autoReveal, collectErrors, mockUpstream, startPagesServer } from './helpers.mjs';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

let site;
let allowAutoplay;
let blockAutoplay;
before(async () => {
  site = await startPagesServer();
  allowAutoplay = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  blockAutoplay = await chromium.launch({ args: ['--autoplay-policy=document-user-activation-required'] });
});
after(async () => { await allowAutoplay?.close(); await blockAutoplay?.close(); await site?.close(); });

async function open(browser, { path = 'about.html', viewport = { width: 1366, height: 900 }, colorScheme = 'light', bypassCSP = false } = {}) {
  const context = await browser.newContext({ viewport, colorScheme, bypassCSP, locale: 'ar', reducedMotion: 'reduce' });
  await mockUpstream(context);
  const page = autoReveal(await context.newPage());
  const errors = collectErrors(page);
  await page.goto(site.url + path);
  return { context, page, errors };
}
const close = async ({ context, errors }) => { await context.close(); assert.deepEqual(errors, [], 'no JavaScript errors'); };
const text = (page, sel) => page.textContent(sel);
const state = (page) => page.evaluate(() => document.getElementById('nasheedAudio').dataset.state);
const waitState = (page, value) => page.waitForFunction((v) => document.getElementById('nasheedAudio')?.dataset.state === v, value);
const media = (page, id) => page.evaluate((i) => { const m = document.getElementById(i); return { paused: m.paused, muted: m.muted, volume: m.volume, loop: m.loop, controls: m.controls, currentTime: m.currentTime, readyState: m.readyState }; }, id);

// ===================================================================== page and navigation
describe('«من أنا» page', () => {
  test('opens as a separate page from the navigation; back and forward work', async () => {
    const s = await open(allowAutoplay, { path: '' });
    const { page } = s;
    await page.waitForSelector('#surahGrid .surah-card');
    await page.click('.side-group[data-group="more"] .side-group-btn');
    assert.equal((await page.textContent('.sidebar a[href="about.html"]')).trim(), '🕊️من أنا');
    await page.click('.sidebar a[href="about.html"]');
    await page.waitForURL(/about\.html$/);
    assert.equal(await page.locator('dialog[open]').count(), 0, 'not a modal');
    assert.equal(await page.title(), 'من أنا | القرآن الكريم - The Noble Quran');
    assert.equal(await text(page, 'h1'), 'من أنا');
    await page.goBack();
    await page.waitForSelector('#surahGrid .surah-card');
    assert.match(page.url(), /quran-website\/(#\/quran)?$/);
    await page.goForward();
    await page.waitForURL(/about\.html$/);
    await page.waitForSelector('#aboutTitle');
    // Also reachable from the mobile menu.
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto(site.url);
    await page.click('.menu-btn');
    if (await page.getAttribute('.side-group[data-group="more"] .side-group-btn', 'aria-expanded') !== 'true') await page.click('.side-group[data-group="more"] .side-group-btn');
    await page.locator('.sidebar a[href="about.html"]').click();
    await page.waitForURL(/about\.html$/);
    await close(s);
  });

  test('developers and dedication are exact; RTL; no Quranic verse on this page', async () => {
    const s = await open(allowAutoplay);
    const { page } = s;
    const cards = await page.locator('.dev-card').evaluateAll((els) => els.map((e) => [...e.querySelectorAll('h3, p')].map((x) => x.textContent.trim())));
    assert.deepEqual(cards, [
      ['عبادة أبو فردة', 'طالب في جامعة الزيتونة الأردنية', 'التخصص: الذكاء الاصطناعي'],
      ['يونس أبو صعيلك', 'طالب في الجامعة الهاشمية'],
    ]);
    assert.equal(await text(page, '.dedication-text'), 'تم تطوير هذا الموقع لوجه الله تعالى، ابتغاء الأجر والثواب، وخدمةً لكتاب الله وسنة نبيه ﷺ.');
    assert.equal(await text(page, '.dedication-by'), 'بواسطة:');
    assert.equal(await text(page, '.dedication-names'), 'عبادة أبو فردة ويونس أبو صعيلك.');
    assert.equal(await page.getAttribute('html', 'dir'), 'rtl');
    assert.equal(await page.getAttribute('.dev-grid', 'dir'), 'rtl');
    // No Quranic verse on the page (the former Al-Isra 17:1 header was removed).
    await page.waitForFunction(() => !document.getElementById('aqsaFigure').hidden);
    assert.equal(await page.locator('#aqsaVerse, .about-lead').count(), 0);
    assert.doesNotMatch(await text(page, 'main'), /[﴿﴾]|الإسراء/);
    // No visible header above the video: the title is for screen readers only, and the video opens the page.
    assert.equal(await page.locator('.about-hero').count(), 0);
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok(await page.locator('h1').evaluate((h) => h.classList.contains('visually-hidden') && h.getBoundingClientRect().width <= 1));
    const [videoTop, devTop] = await page.locator('#aqsaFigure, .developers').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
    assert.ok(videoTop < devTop && videoTop < 200, 'the video comes first, right under the site header');
    await close(s);
  });

  test('cards side by side on desktop, stacked on mobile; no horizontal scrolling', async () => {
    for (const [viewport, sideBySide] of [[{ width: 1366, height: 900 }, true], [{ width: 768, height: 1024 }, true], [{ width: 390, height: 844 }, false], [{ width: 320, height: 640 }, false]]) {
      const s = await open(allowAutoplay, { viewport });
      const [a, b] = await s.page.locator('.dev-card').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
      if (sideBySide) {
        assert.equal(Math.round(a.top), Math.round(b.top), `${viewport.width}: same row`);
        assert.equal(Math.round(a.width), Math.round(b.width), 'equal width');
        assert.ok(a.left > b.left, 'RTL: the first card is on the right');
      } else {
        assert.ok(b.top >= a.bottom - 1, `${viewport.width}: stacked`);
      }
      assert.ok((await s.page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${viewport.width}: no overflow`);
      // The portrait video (478×850) is shown whole at its natural proportions, centred, within the viewport's width and height.
      await s.page.waitForFunction(() => document.getElementById('aboutVideo').readyState >= 2);
      const v = await s.page.locator('#aboutVideo').evaluate((e) => ({ ...e.getBoundingClientRect().toJSON(), vw: e.videoWidth, vh: e.videoHeight }));
      assert.deepEqual([v.vw, v.vh], [478, 850]);
      assert.ok(Math.abs(v.width / v.height - 478 / 850) < 0.01, `${viewport.width}: not cropped or distorted`);
      assert.ok(v.left >= 0 && v.right <= viewport.width, `${viewport.width}: fits the screen width`);
      assert.ok(v.height <= viewport.height * 0.8 + 1, `${viewport.width}: the whole frame fits the screen height`);
      assert.ok(v.width >= Math.min(viewport.width - 40, 440, viewport.height * 0.78 * 478 / 850) - 3, `${viewport.width}: shown as large as the screen allows`);
      assert.ok(Math.abs((v.left + v.right) / 2 - viewport.width / 2) < 20, `${viewport.width}: centred`);
      await close(s);
    }
  });

  test('shipped media: the owner\'s video replaced the photograph; the nasheed «فردوس الرحمن ظلال» is still shipped', async () => {
    const s = await open(allowAutoplay);
    const { page } = s;
    assert.equal(await page.locator('#aqsaImage, .about-photo img').count(), 0, 'the old photograph is gone');
    assert.equal(await page.locator('#aqsaCredit').count(), 0, 'its photo credit is gone with it');
    assert.equal(await page.getAttribute('#aboutVideo source', 'src'), 'assets/video/about/al-aqsa-courtyard.mp4');
    assert.equal(await page.getAttribute('#aboutVideo source', 'type'), 'video/mp4');
    assert.equal(await page.getAttribute('#aboutVideo', 'poster'), 'assets/video/about/al-aqsa-courtyard-poster.webp');
    assert.equal(await text(page, '.about-photo-label'), 'المسجد الأقصى المبارك');
    await page.waitForFunction(() => document.getElementById('aboutVideo').readyState >= 1);
    assert.ok(Math.abs((await page.evaluate(() => document.getElementById('aboutVideo').duration)) - 27.03) < 0.2);
    // The nasheed file is unchanged and loads: its real duration (4:30) is read from the file.
    assert.equal(await page.getAttribute('#nasheedAudio', 'src'), 'assets/audio/firdaws-al-rahman-dhilal.mp3');
    await page.waitForFunction(() => document.getElementById('nasheedAudio').readyState >= 1);
    assert.ok(Math.abs((await page.evaluate(() => document.getElementById('nasheedAudio').duration)) - 270.86) < 1);
    assert.notEqual(await state(page), 'unavailable');
    await close(s);
  });

  test('silent, control-free, looping video and the audible nasheed play at the same time, independently', async () => {
    const s = await open(allowAutoplay);
    const { page } = s;
    await waitState(page, 'playing');
    await page.waitForFunction(() => { const v = document.getElementById('aboutVideo'); return !v.paused && v.currentTime > 0.3; });
    const video = await media(page, 'aboutVideo');
    assert.deepEqual([video.paused, video.muted, video.loop, video.controls], [false, true, true, false], 'video: playing, muted, looping, no controls');
    for (const attr of ['autoplay', 'muted', 'loop', 'playsinline']) assert.ok(await page.locator('#aboutVideo').evaluate((v, a) => v.hasAttribute(a), attr), attr);
    assert.equal(await page.locator('#aboutVideo[controls]').count(), 0);
    // The video file has no audio track at all.
    assert.equal(await page.evaluate(() => { const v = document.getElementById('aboutVideo'); return v.audioTracks ? v.audioTracks.length : (v.webkitAudioDecodedByteCount ?? 0); }), 0);
    const audio = await media(page, 'nasheedAudio');
    assert.deepEqual([audio.paused, audio.muted, audio.volume], [false, false, 1], 'nasheed: playing, not muted, full volume');
    assert.ok(audio.currentTime < 3, 'from the beginning');
    // Muting is per element: forcing the video muted again never mutes the nasheed.
    await page.evaluate(() => { const v = document.getElementById('aboutVideo'); v.muted = false; });
    assert.equal((await media(page, 'aboutVideo')).muted, true, 'the video cannot be unmuted');
    assert.equal((await media(page, 'nasheedAudio')).muted, false);
    // Seamless loop: seek near the end and see the video wrap around while the nasheed keeps going.
    await page.evaluate(() => { const v = document.getElementById('aboutVideo'); v.currentTime = v.duration - 0.5; });
    await page.waitForFunction(() => { const v = document.getElementById('aboutVideo'); return !v.paused && v.currentTime < 3; }, null, { timeout: 5000 });
    assert.equal((await media(page, 'nasheedAudio')).paused, false);
    // The video does not take clicks (no native controls, no context menu toggles).
    assert.equal(await page.locator('#aboutVideo').evaluate((v) => getComputedStyle(v).pointerEvents), 'none');
    // Switching language or theme never restarts or stops the media.
    const before = (await media(page, 'nasheedAudio')).currentTime;
    await page.selectOption('#langSelect', 'en');
    await page.click('#themeToggle');
    assert.ok((await media(page, 'nasheedAudio')).currentTime >= before);
    assert.equal(await state(page), 'playing');
    assert.equal((await media(page, 'aboutVideo')).paused, false);
    assert.ok(await page.evaluate(() => document.documentElement.classList.contains('dark-mode')));
    await close(s);
  });

  test('no visible audio player: the nasheed has no card, icon, button, timeline, time, volume or status', async () => {
    for (const viewport of [{ width: 1366, height: 900 }, { width: 390, height: 844 }]) {
      const s = await open(allowAutoplay, { viewport });
      const { page } = s;
      await waitState(page, 'playing');
      assert.equal(await page.locator('.nasheed-card, .nasheed-icon, .nasheed-player, #nasheedPlay, #nasheedStart, #nasheedSeek, #nasheedVolume, #nasheedDuration, #nasheedStatus, input[type="range"]').count(), 0);
      assert.ok(await page.isHidden('#nasheedAudio'));
      assert.equal(await page.locator('audio[controls], video[controls]').count(), 0);
      assert.doesNotMatch(await text(page, 'main'), /🎵|🔊|نشيد|يُشغَّل/);
      await close(s);
    }
  });

  test('audible autoplay blocked by the browser: no player comes back; the first tap anywhere starts the nasheed', async () => {
    const s = await open(blockAutoplay, { viewport: { width: 390, height: 844 } });
    const { page } = s;
    await waitState(page, 'blocked');
    assert.ok((await media(page, 'nasheedAudio')).paused, 'no false "playing"');
    // The muted video is allowed to autoplay even under this policy.
    await page.waitForFunction(() => { const v = document.getElementById('aboutVideo'); return !v.paused && v.currentTime > 0.3; });
    assert.equal(await page.locator('#nasheedStart, .nasheed-card, button:visible:has-text("▶")').count(), 0, 'no visible fallback player');
    await page.locator('.dev-card').first().click();
    await waitState(page, 'playing');
    const audio = await media(page, 'nasheedAudio');
    assert.deepEqual([audio.paused, audio.muted, audio.volume], [false, false, 1]);
    assert.equal((await media(page, 'aboutVideo')).muted, true, 'the video stays silent');
    await close(s);
  });

  test('blocked autoplay: a key press also starts the nasheed', async () => {
    const s = await open(blockAutoplay);
    const { page } = s;
    await waitState(page, 'blocked');
    await page.keyboard.press('Tab');
    await waitState(page, 'playing');
    await close(s);
  });

  test('leaving the page pauses the nasheed; it never plays on the home page; re-entering starts from the beginning', async () => {
    const s = await open(allowAutoplay);
    const { page } = s;
    await waitState(page, 'playing');
    // Registered after the page's own pagehide handler, so it sees the state that handler left.
    await page.evaluate(() => {
      window.addEventListener('pagehide', () => {
        sessionStorage.setItem('nasheedPausedOnLeave', document.getElementById('nasheedAudio').paused ? '1' : '0');
      });
    });
    await page.click('.about-back');
    await page.waitForSelector('#surahGrid .surah-card');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('nasheedPausedOnLeave')), '1');
    assert.equal(await page.locator('#nasheedAudio').count(), 0, 'no nasheed element on the home page');
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('audio')].every((a) => a.paused)));
    await page.goBack(); // re-enter the page (possibly restored from the back/forward cache)
    await waitState(page, 'playing');
    assert.ok((await page.evaluate(() => document.getElementById('nasheedAudio').currentTime)) < 3);
    await page.waitForFunction(() => !document.getElementById('aboutVideo').paused);
    await close(s);
  });

  for (const colorScheme of ['light', 'dark']) {
    test(`axe (WCAG 2.1 A/AA), ${colorScheme}`, async () => {
      const s = await open(allowAutoplay, { colorScheme, bypassCSP: true });
      await s.page.waitForTimeout(300);
      await s.page.addScriptTag({ content: AXE });
      const violations = await s.page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }))
        .violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })));
      assert.deepEqual(violations, []);
      await s.context.close();
    });
  }

  test('works offline once the site has been visited (service worker)', async () => {
    const s = await open(allowAutoplay, { path: '' });
    const { page, context } = s;
    await page.waitForSelector('#surahGrid .surah-card');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.goto(`${site.url}about.html`);
    await page.waitForSelector('.dev-card');
    assert.equal(await text(page, '.dedication-names'), 'عبادة أبو فردة ويونس أبو صعيلك.');
    // The service worker never caches audio or video, so offline those files cannot load; those requests are the only allowed errors.
    s.errors.splice(0, s.errors.length, ...s.errors.filter((e) => !e.includes('net::ERR_INTERNET_DISCONNECTED')));
    await close(s);
  });

  test('static checks: same CSP as the home page, inline script allowed by its hash, no inline handlers', () => {
    const index = readFileSync(join(REPO, 'index.html'), 'utf8');
    const about = readFileSync(join(REPO, 'about.html'), 'utf8');
    const csp = (html) => /http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)[1];
    assert.equal(csp(about), csp(index));
    const inline = [...about.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    assert.equal(inline.length, 1);
    assert.ok(csp(about).includes(`'sha256-${createHash('sha256').update(inline[0]).digest('base64')}'`));
    assert.doesNotMatch(about, /\son[a-z]+="/i);
    assert.doesNotMatch(about, /\sstyle="/i);
    for (const [tag] of about.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.match(tag, /rel="noopener noreferrer"/);
    const sw = readFileSync(join(REPO, 'sw.js'), 'utf8');
    for (const f of ['about.html', 'assets/js/about.js', 'assets/js/data/about-media.js', 'assets/video/about/al-aqsa-courtyard-poster.webp']) assert.ok(sw.includes(`'${f}'`), f);
    assert.doesNotMatch(sw, /dome-of-the-rock|al-aqsa-compound|al-aqsa-courtyard\.mp4/, 'the replaced photo is not precached; the video is streamed, not precached');
    assert.doesNotMatch(about, /aqsaVerse|core\/api\.js|core\/arabic\.js/, 'the verse markup and its preloads are gone');
    assert.match(readFileSync(join(REPO, 'sitemap.xml'), 'utf8'), /about\.html/);
  });
});

// ===================================================================== relocations
describe('rosary in Hisn al-Muslim; prayer learning in the academy', () => {
  test('rosary tab: saved count kept, counting, phrase and target, old entry point still works', async () => {
    const context = await allowAutoplay.newContext({ locale: 'ar', reducedMotion: 'reduce' });
    await mockUpstream(context);
    await context.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('rosaryCount', '41'); sessionStorage.setItem('seeded', '1'); } });
    const page = autoReveal(await context.newPage());
    const errors = collectErrors(page);
    await page.goto(site.url);
    await page.waitForSelector('#surahGrid .surah-card');
    await page.click('.nav-links [data-open="adhkarModal"]');
    await page.click('#tab_tasbeeh');
    assert.ok(await page.isHidden('#adhkarGrid'));
    assert.equal(await text(page, '#rosaryCounter'), '41', 'existing count preserved');
    await page.locator('#tasbeehPhrases button', { hasText: 'الحمد لله' }).click();
    assert.equal(await text(page, '#tasbeehPhrase'), 'الحمد لله');
    await page.selectOption('#tasbeehTarget', { value: '33' });
    await page.click('#rosaryReset');
    for (let i = 0; i < 33; i += 1) await page.click('#rosaryCounter');
    assert.equal(await text(page, '#tasbeehProgress'), '33 من 33');
    await page.waitForFunction(() => /أتممت 33/.test(document.getElementById('toast').textContent));
    assert.equal(await page.evaluate(() => localStorage.getItem('rosaryCount')), '33');
    assert.deepEqual(JSON.parse(await page.evaluate(() => localStorage.getItem('tasbeehPrefs'))), { phrase: 'الحمد لله', target: 33 });
    // Switching back to an adhkar tab restores the list.
    await page.click('#tab_morning');
    assert.ok(await page.isVisible('#adhkarGrid'));
    await page.keyboard.press('Escape');
    // The old entry point (rosaryModal) opens the new place.
    await page.evaluate(() => { const b = document.createElement('button'); b.dataset.open = 'rosaryModal'; b.id = 'legacyOpener'; document.body.append(b); });
    await page.evaluate(() => document.getElementById('legacyOpener').click());
    assert.ok(await page.locator('#adhkarModal').evaluate((d) => d.open));
    assert.equal(await page.getAttribute('#tab_tasbeeh', 'aria-selected'), 'true');
    await page.reload();
    await page.click('.nav-links [data-open="adhkarModal"]');
    await page.click('#tab_tasbeeh');
    assert.equal(await text(page, '#rosaryCounter'), '33');
    assert.equal(await text(page, '#tasbeehPhrase'), 'الحمد لله');
    await context.close();
    assert.deepEqual(errors, []);
  });

  test('axe: Hisn al-Muslim on the rosary tab', async () => {
    const context = await allowAutoplay.newContext({ bypassCSP: true, reducedMotion: 'reduce' });
    await mockUpstream(context);
    const page = autoReveal(await context.newPage());
    await page.goto(site.url);
    await page.waitForSelector('#surahGrid .surah-card');
    await page.click('.nav-links [data-open="adhkarModal"]');
    await page.click('#tab_tasbeeh');
    await page.addScriptTag({ content: AXE });
    const v = await page.evaluate(async () => (await window.axe.run({ include: ['#adhkarModal'] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map((x) => x.id));
    assert.deepEqual(v, []);
    await context.close();
  });

  test('the old side-menu entry is gone; its 4-language lesson is in the academy with the diagrams and video', async () => {
    const context = await allowAutoplay.newContext({ locale: 'ar', reducedMotion: 'reduce' });
    await mockUpstream(context);
    const page = autoReveal(await context.newPage());
    const errors = collectErrors(page);
    await page.goto(site.url);
    await page.waitForSelector('#surahGrid .surah-card');
    assert.equal(await page.locator('[data-open="learnPrayerModal"]').count(), 0);
    assert.equal(await page.locator('#learnSection #lessonGrid .lesson-card').count(), 18, 'the prayer curriculum has its own page, linked from the academy');
    await page.click('#learnSection [data-id="prophet-prayer"]');
    assert.equal(await text(page, '#lessonTitle'), '🕌 صفة صلاة النبي ﷺ');
    const steps = await page.locator('#lessonBody .prayer-step h3').allTextContents();
    assert.equal(steps.length, 5);
    assert.equal(steps[0], '1. الوضوء، النية، وتكبيرة الإحرام (القيام)');
    assert.equal(await page.locator('#lessonBody .prayer-step img[src^="assets/img/prayer/"]').count(), 5);
    assert.equal(await page.getAttribute('#lessonBody .video-link', 'href'), 'https://www.youtube.com/watch?v=W-jX2kY0vR8');
    await page.click('#lessonDone');
    await page.keyboard.press('Escape');
    // The academy's prayer course lists it first; the original translations follow the language.
    await page.selectOption('#langSelect', 'en');
    await page.click('#courseGrid [data-id="prayer"]');
    assert.match(await page.locator('#courseBody .course-lesson').first().textContent(), /Prophet|النبي/);
    await page.locator('#courseBody .course-lesson').first().click();
    assert.doesNotMatch(await text(page, '#lessonBody .prayer-step h3'), /[ء-ي]{3}/, 'English step titles');
    await context.close();
    assert.deepEqual(errors, []);
  });
});
