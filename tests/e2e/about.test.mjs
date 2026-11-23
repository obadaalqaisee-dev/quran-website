// The «من أنا» page (about.html), the rosary in Hisn al-Muslim, and the prayer lesson migrated into the
// academy. The site is served like GitHub Pages; third-party APIs are answered from the verified datasets.
//
// Media: the repository ships about-media.js with no photo or nasheed configured (no verified, licensed
// files could be obtained while this was written). The shipped state is tested as is. The player and
// photo behaviour are tested with STAND-IN media injected by the test only (the site's own Quran.mp3 and
// icon): these stand-ins never appear in the site.

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { AYAHS, REPO, chromium, collectErrors, mockUpstream, startPagesServer } from './helpers.mjs';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const MEDIA_SRC = readFileSync(join(REPO, 'assets/js/data/about-media.js'), 'utf8');
// Test-only configuration: stand-in files and provenance fields, so the configured code paths run.
const STANDIN_MEDIA = MEDIA_SRC
  .replace("src: null, // e.g. 'assets/img/about/al-aqsa.webp'", "src: 'assets/icons/icon-512.png', // test stand-in")
  .replace("src: null, // e.g. 'assets/audio/nasheed.mp3'", "src: 'Quran.mp3', // test stand-in")
  .replaceAll("sourceUrl: '',", "sourceUrl: 'https://example.org/test-source',")
  .replaceAll("license: '',", "license: 'test licence',")
  .replace("credit: '',", "credit: 'Test credit',");

let site;
let allowAutoplay;
let blockAutoplay;
before(async () => {
  site = await startPagesServer();
  allowAutoplay = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  blockAutoplay = await chromium.launch({ args: ['--autoplay-policy=document-user-activation-required'] });
});
after(async () => { await allowAutoplay?.close(); await blockAutoplay?.close(); await site?.close(); });

async function open(browser, { path = 'about.html', viewport = { width: 1366, height: 900 }, media = false, colorScheme = 'light', bypassCSP = false } = {}) {
  const context = await browser.newContext({ viewport, colorScheme, bypassCSP, locale: 'ar', reducedMotion: 'reduce' });
  await mockUpstream(context);
  if (media) await context.route('**/assets/js/data/about-media.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: STANDIN_MEDIA }));
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(site.url + path);
  return { context, page, errors };
}
const close = async ({ context, errors }) => { await context.close(); assert.deepEqual(errors, [], 'no JavaScript errors'); };
const text = (page, sel) => page.textContent(sel);
const state = (page) => page.evaluate(() => document.getElementById('nasheedStatus').dataset.state);

// ===================================================================== page and navigation
describe('«من أنا» page', () => {
  test('opens as a separate page from the navigation; back and forward work', async () => {
    const s = await open(allowAutoplay, { path: '' });
    const { page } = s;
    await page.waitForSelector('#surahGrid .surah-card');
    assert.equal(await page.textContent('.nav-links a[href="about.html"]'), '🕊️ من أنا');
    await page.click('.nav-links a[href="about.html"]');
    await page.waitForURL(/about\.html$/);
    assert.equal(await page.locator('dialog[open]').count(), 0, 'not a modal');
    assert.equal(await page.title(), 'من أنا | القرآن الكريم - The Noble Quran');
    assert.equal(await text(page, 'h1'), 'من أنا');
    await page.goBack();
    await page.waitForSelector('#surahGrid .surah-card');
    assert.match(page.url(), /quran-website\/$/);
    await page.goForward();
    await page.waitForURL(/about\.html$/);
    await page.waitForSelector('#aboutTitle');
    // Also reachable from the side menu.
    await page.goto(site.url);
    await page.click('.menu-btn');
    await page.locator('#sideMenu a[href="about.html"]').click();
    await page.waitForURL(/about\.html$/);
    await close(s);
  });

  test('developers, dedication and the verse are exact; RTL', async () => {
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
    // Quran 17:1 comes from the verified dataset (basmala prefix shown separately, as everywhere on the site).
    await page.waitForSelector('#aqsaVerse:not([hidden])');
    const ayah = AYAHS.find((a) => a.surah === 17 && a.numberInSurah === 1).text;
    assert.ok(ayah.endsWith((await text(page, '#aqsaVerse')).replace(/^﴿|﴾ \[الإسراء: 1\]$/g, '')));
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
      await close(s);
    }
  });

  test('shipped state: no photo or recording configured → no substitute image, honest player status, no playback', async () => {
    const s = await open(allowAutoplay);
    const { page, context } = s;
    const audioRequests = [];
    context.on('request', (r) => { if (/\.(mp3|m4a|ogg)$/.test(r.url())) audioRequests.push(r.url()); });
    assert.ok(await page.isHidden('#aqsaFigure'), 'no photograph is shown in place of Al-Aqsa');
    assert.ok(await page.isHidden('.about-photo-label'), 'the decorative header is not labelled as Al-Aqsa');
    assert.equal(await state(page), 'unavailable');
    assert.equal(await text(page, '#nasheedStatus'), 'لم يُضف تسجيل النشيد بعد.');
    assert.ok(await page.isDisabled('#nasheedPlay'));
    assert.ok(await page.isHidden('#nasheedStart'));
    assert.equal(await text(page, '#nasheedLine'), 'سبّوا خيار الخلق من لهم العلى ولهم مقام في ذرى الأحساب...');
    assert.ok(await page.evaluate(() => document.getElementById('nasheedAudio').paused));
    assert.deepEqual(audioRequests, []);
    await close(s);
  });

  test('configured (stand-in) media: photo with credit, nasheed autoplays from the start, controls work', async () => {
    const s = await open(allowAutoplay, { media: true });
    const { page } = s;
    await page.waitForFunction(() => document.getElementById('nasheedStatus').dataset.state === 'playing');
    assert.ok(!(await page.evaluate(() => document.getElementById('nasheedAudio').paused)));
    assert.ok((await page.evaluate(() => document.getElementById('nasheedAudio').currentTime)) < 3, 'from the beginning');
    assert.equal(await text(page, '#nasheedStatus'), '▶ يُشغَّل الآن');
    assert.ok(await page.isVisible('#aqsaFigure'));
    assert.ok(await page.isVisible('.about-photo-label'));
    assert.equal(await page.getAttribute('#aqsaCredit a', 'rel'), 'noopener noreferrer');
    assert.match(await text(page, '#aqsaCredit'), /Test credit · test licence/);
    // Pause / play, volume (remembered), progress and time.
    await page.click('#nasheedPlay');
    await page.waitForFunction(() => document.getElementById('nasheedStatus').dataset.state === 'paused');
    await page.fill('#nasheedVolume', '0.4');
    assert.equal(await page.evaluate(() => document.getElementById('nasheedAudio').volume), 0.4);
    assert.equal(await page.evaluate(() => localStorage.getItem('nasheedVolume')), '0.4');
    await page.click('#nasheedPlay');
    await page.waitForFunction(() => document.getElementById('nasheedStatus').dataset.state === 'playing');
    await page.waitForFunction(() => document.getElementById('nasheedDuration').textContent !== '0:00');
    // Switching language or theme re-labels the player without restarting the audio.
    const before = await page.evaluate(() => document.getElementById('nasheedAudio').currentTime);
    await page.selectOption('#langSelect', 'en');
    await page.click('#themeToggle');
    assert.equal(await text(page, '#nasheedStatus'), '▶ Now playing');
    assert.ok((await page.evaluate(() => document.getElementById('nasheedAudio').currentTime)) >= before);
    assert.ok(await page.evaluate(() => document.documentElement.classList.contains('dark-mode')));
    await close(s);
  });

  test('autoplay blocked by the browser: one-tap button, no false "playing", then plays', async () => {
    const s = await open(blockAutoplay, { media: true, viewport: { width: 390, height: 844 } });
    const { page } = s;
    await page.waitForFunction(() => document.getElementById('nasheedStatus').dataset.state === 'blocked');
    assert.ok(await page.isVisible('#nasheedStart'));
    assert.ok(await page.evaluate(() => document.getElementById('nasheedAudio').paused));
    assert.doesNotMatch(await text(page, '#nasheedStatus'), /يُشغَّل/);
    assert.match(await text(page, '#nasheedStatus'), /منع المتصفح التشغيل التلقائي/);
    await page.click('#nasheedStart');
    await page.waitForFunction(() => document.getElementById('nasheedStatus').dataset.state === 'playing');
    assert.ok(await page.isHidden('#nasheedStart'));
    await close(s);
  });

  test('leaving the page pauses the nasheed; it never plays on the home page; re-entering starts from the beginning', async () => {
    const s = await open(allowAutoplay, { media: true });
    const { page } = s;
    await page.waitForFunction(() => document.getElementById('nasheedStatus').dataset.state === 'playing');
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
    await page.waitForFunction(() => document.getElementById('nasheedStatus')?.dataset.state === 'playing');
    assert.ok((await page.evaluate(() => document.getElementById('nasheedAudio').currentTime)) < 3);
    await close(s);
  });

  for (const colorScheme of ['light', 'dark']) {
    test(`axe (WCAG 2.1 A/AA), ${colorScheme}: shipped and configured states`, async () => {
      for (const media of [false, true]) {
        const s = await open(allowAutoplay, { colorScheme, media, bypassCSP: true });
        await s.page.waitForTimeout(300);
        await s.page.addScriptTag({ content: AXE });
        const violations = await s.page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }))
          .violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) })));
        assert.deepEqual(violations, [], `media configured: ${media}`);
        await s.context.close();
      }
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
    for (const f of ['about.html', 'assets/js/about.js', 'assets/js/data/about-media.js']) assert.ok(sw.includes(`'${f}'`), f);
    assert.match(readFileSync(join(REPO, 'sitemap.xml'), 'utf8'), /about\.html/);
  });
});

// ===================================================================== relocations
describe('rosary in Hisn al-Muslim; prayer learning in the academy', () => {
  test('rosary tab: saved count kept, counting, phrase and target, old entry point still works', async () => {
    const context = await allowAutoplay.newContext({ locale: 'ar', reducedMotion: 'reduce' });
    await mockUpstream(context);
    await context.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('rosaryCount', '41'); sessionStorage.setItem('seeded', '1'); } });
    const page = await context.newPage();
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
    const page = await context.newPage();
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
    const page = await context.newPage();
    const errors = collectErrors(page);
    await page.goto(site.url);
    await page.waitForSelector('#surahGrid .surah-card');
    assert.equal(await page.locator('[data-open="learnPrayerModal"]').count(), 0);
    assert.equal(await page.locator('#academySection #learnSection #lessonGrid .lesson-card').count(), 18, 'the prayer curriculum is inside the academy');
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
