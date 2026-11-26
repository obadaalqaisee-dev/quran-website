// Platform transformation: sidebar navigation, pages, direct links, refresh, back/forward, the home dashboard,
// the Quran Journey and the conversational assistant — in a real browser, served like GitHub Pages, with the
// third-party APIs answered from the verified datasets (mocked; this does not test the live upstream services).

import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import { chromium, collectErrors, mockUpstream, startPagesServer } from './helpers.mjs';

let browser;
let site;
before(async () => { browser = await chromium.launch(); site = await startPagesServer(); });
after(async () => { await browser?.close(); await site?.close(); });

async function open({ viewport = { width: 1366, height: 900 }, hash = '', storage = null } = {}) {
  const context = await browser.newContext({ viewport, locale: 'ar' });
  await mockUpstream(context);
  if (storage) await context.addInitScript((s) => { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); }, storage);
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(site.url + hash);
  await page.waitForFunction(() => document.documentElement.classList.contains('js-ready'));
  return { context, page, errors };
}
const close = async ({ context, errors }) => { await context.close(); assert.deepEqual(errors, [], 'no JavaScript errors'); };
const plain = (text) => String(text).replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
const visiblePage = (page) => page.evaluate(() => [...document.querySelectorAll('.page')].filter((p) => !p.hidden).map((p) => p.dataset.page).join(','));
const activeLink = (page) => page.evaluate(() => document.querySelector('.side-link[aria-current="page"]')?.dataset.route ?? null);

describe('navigation', () => {
  test('sidebar opens each page, marks it active, and back/forward and refresh work', async () => {
    const s = await open();
    const { page } = s;
    assert.equal(await visiblePage(page), 'home');
    assert.equal(await activeLink(page), 'home');
    for (const route of ['quran', 'tafsir', 'audio', 'memorize', 'learn-prayer', 'academy', 'islam', 'adhkar', 'prayer', 'progress', 'notes', 'profile', 'settings', 'journey', 'assistant', 'favorites']) {
      await page.click(`.side-link[data-route="${route}"]`);
      assert.equal(await visiblePage(page), route, route);
      assert.equal(await activeLink(page), route);
    }
    await page.goBack();
    assert.equal(await visiblePage(page), 'assistant');
    await page.goBack();
    assert.equal(await visiblePage(page), 'journey');
    await page.goForward();
    assert.equal(await visiblePage(page), 'assistant');
    await page.reload();
    await page.waitForFunction(() => document.documentElement.classList.contains('js-ready'));
    assert.equal(await visiblePage(page), 'assistant', 'refresh keeps the page');
    assert.ok(await page.locator('#assistantModal').evaluate((d) => d.open), 'page dialog shown in place');
    await close(s);
  });

  test('direct links: routes with parameters and the old anchors', async () => {
    let s = await open({ hash: '#/quran/112' });
    await s.page.waitForSelector('#readingText .ayah-span');
    assert.equal(await visiblePage(s.page), 'quran');
    assert.match(plain(await s.page.textContent('#readingName')), /الإخلاص/);
    await close(s);
    s = await open({ hash: '#/memorize/plan' });
    assert.equal(await s.page.getAttribute('#labTabPlan', 'aria-selected'), 'true');
    assert.equal(await activeLink(s.page), 'memorize/plan');
    await close(s);
    s = await open({ hash: '#/tasbih' });
    assert.equal(await visiblePage(s.page), 'adhkar');
    assert.ok(await s.page.isVisible('#tasbeehPanel'));
    await close(s);
    s = await open({ hash: '#learnSection' }); // manifest shortcut of the previous version
    assert.equal(await visiblePage(s.page), 'learn-prayer');
    await close(s);
    s = await open({ hash: '#/no-such-page' });
    assert.equal(await visiblePage(s.page), 'home');
    await close(s);
  });

  test('old openers still work: dialog ids navigate to their pages, modals still open', async () => {
    const s = await open();
    const { page } = s;
    await page.evaluate(() => { const b = document.createElement('button'); b.dataset.open = 'voiceTestModal'; b.id = 'legacy'; b.textContent = 'lab'; document.body.append(b); });
    await page.click('#legacy');
    assert.equal(await visiblePage(page), 'memorize');
    await page.click('.side-group[data-group="more"] .side-group-btn');
    await page.click('.side-link[data-open="contactModal"]');
    assert.ok(await page.locator('#contactModal').evaluate((d) => d.open));
    await page.keyboard.press('Escape');
    assert.ok(!(await page.locator('#contactModal').evaluate((d) => d.open)), 'modal closes on Escape');
    assert.ok(await page.locator('#voiceTestModal').evaluate((d) => d.open), 'the page stays');
    await page.click('.side-link[data-route="home"]');
    assert.ok(!(await page.locator('#voiceTestModal').evaluate((d) => d.open)), 'leaving the page closes it');
    await close(s);
  });

  test('reading from the home page opens the reader page; back returns home', async () => {
    const s = await open();
    const { page } = s;
    await page.selectOption('#homeSurahSelect', '114');
    await page.click('#homeOpenForm button[type="submit"]');
    await page.waitForSelector('#readingText .ayah-span');
    assert.equal(await visiblePage(page), 'quran');
    await page.goBack();
    assert.equal(await visiblePage(page), 'home');
    assert.match(plain(await page.textContent('#homeRecent')), /الناس/, 'recently read');
    await close(s);
  });

  test('collapse is remembered; mobile menu opens, closes on Escape and on navigation', async () => {
    let s = await open();
    await s.page.click('#sidebarCollapse');
    assert.ok(await s.page.evaluate(() => document.documentElement.classList.contains('sidebar-collapsed')));
    await s.page.reload();
    assert.ok(await s.page.evaluate(() => document.documentElement.classList.contains('sidebar-collapsed')));
    await close(s);
    s = await open({ viewport: { width: 390, height: 844 } });
    const { page } = s;
    assert.ok(!(await page.isVisible('.sidebar')));
    await page.click('#sidebarToggle');
    assert.ok(await page.isVisible('.side-link[data-route="quran"]'));
    assert.equal(await page.getAttribute('#sidebarToggle', 'aria-expanded'), 'true');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.documentElement.classList.contains('sidebar-open'));
    await page.click('#sidebarToggle');
    await page.click('.side-link[data-route="adhkar"]');
    assert.equal(await visiblePage(page), 'adhkar');
    assert.ok(!(await page.evaluate(() => document.documentElement.classList.contains('sidebar-open'))));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal scroll');
    await close(s);
  });
});

describe('home dashboard', () => {
  test('dates, five prayers with the next one, continue reading, six quick actions', async () => {
    const s = await open({ storage: { quranBookmark: JSON.stringify({ surahNum: 18, ayahIndex: 9, ayahNumInSurah: 10 }) } });
    const { page } = s;
    await page.waitForSelector('#homePrayerList .home-prayer-item');
    assert.equal(await page.locator('#homePrayerList .home-prayer-item').count(), 5);
    assert.equal(await page.locator('#homePrayerList .is-next').count(), 1);
    assert.ok((await page.textContent('#homeHijri')).trim().length > 0);
    assert.equal(await page.locator('.quick-action').count(), 6);
    assert.match(plain(await page.textContent('#homeContinue')), /الكهف/);
    await page.click('#homeContinue button');
    await page.waitForSelector('#ayah-9.active-ayah');
    assert.equal(await visiblePage(page), 'quran');
    await close(s);
  });
});

describe('Quran Journey', () => {
  test('start a path, complete steps, quiz, pause and resume, progress on the home page', async () => {
    const s = await open({ hash: '#/journey' });
    const { page } = s;
    assert.equal(await page.locator('.jr-path').count(), 6);
    await page.click('.jr-path[data-path="read"] .btn-primary');
    assert.equal(await page.evaluate(() => location.hash), '#/journey/read');
    assert.equal(await page.locator('.letters-grid .letter-card').count(), 28);
    await page.click('.jr-step.is-open .jr-step-mark .btn-primary'); // letters
    await page.click('.jr-step.is-open .jr-step-mark .btn-primary'); // harakat
    // the quiz: answer correctly
    for (const [i, answer] of [1, 0, 1, 0, 1].entries()) await page.check(`.jr-quiz input[name="q${i}"][value="${answer}"]`);
    await page.click('.jr-quiz button[type="submit"]');
    await page.waitForFunction(() => document.querySelectorAll('.jr-step .jr-step-num.is-done').length === 3);
    const data = await page.evaluate(() => JSON.parse(localStorage.getItem('quranJourney')));
    assert.deepEqual(Object.keys(data.paths.read.steps).sort(), ['harakat', 'letters', 'letters-quiz']);
    assert.deepEqual(data.paths.read.quiz['letters-quiz'], { score: 5, total: 5 });
    await page.click('.jr-detail-actions .btn-soft'); // pause
    assert.equal((await page.evaluate(() => JSON.parse(localStorage.getItem('quranJourney')))).paths.read.paused, true);
    await page.click('.jr-detail-actions .btn-primary'); // resume
    await page.click('.side-link[data-route="home"]');
    assert.match(await page.textContent('#homeJourneyBody'), /3 من 7/);
    await page.click('#homeJourneyBody a.btn-primary');
    assert.equal(await page.evaluate(() => location.hash), '#/journey/read');
    assert.match(await page.textContent('.jr-step.is-open'), /استمع واتبع/, 'resumes at the first unfinished step');
    await close(s);
  });

  test('steps complete from existing activity; reminders are saved; achievements show', async () => {
    const s = await open({ hash: '#/journey/prayer', storage: { learningProgress: JSON.stringify({ lessons: { wudu: '2026-11-20' } }) } });
    const { page } = s;
    assert.equal(await page.locator('.jr-step .jr-step-num.is-done').count(), 1, 'wudu lesson already finished');
    await page.click('.side-link[data-route="journey/reminders"]');
    await page.check('#rem-quran');
    await page.fill('#journeyReminders input[type="time"] >> nth=0', '21:30');
    await page.locator('#journeyReminders input[type="time"]').first().dispatchEvent('change');
    const rem = await page.evaluate(() => JSON.parse(localStorage.getItem('journeyReminders')));
    assert.equal(rem.quran.on, true);
    assert.equal(rem.quran.time, '21:30');
    assert.equal(await page.locator('#achievementList li').count(), 8);
    await close(s);
  });
});

describe('assistant', () => {
  test('greeting, context-aware follow-ups, becoming Muslim, and safe rendering of input', async () => {
    const s = await open({ hash: '#/assistant' });
    const { page } = s;
    const ask = async (q) => {
      const before = await page.locator('#assistantLog .asst-msg--bot').count();
      await page.fill('#assistantInput', q);
      await page.press('#assistantInput', 'Enter');
      await page.waitForFunction((n) => document.querySelectorAll('#assistantLog .asst-msg--bot').length > n, before);
      return page.locator('#assistantLog .asst-msg--bot').last().textContent();
    };
    assert.match(await ask('السلام عليكم'), /وعليكم السلام/);
    assert.match(await ask('كيف أقرأ القرآن؟'), /المصحف وفهرس السور/);
    assert.match(await ask('وكيف أستمع إليه؟'), /🎧/);
    assert.match(await ask('وكيف أحفظه؟'), /الميكروفون/);
    assert.match(await ask('شكراً لك'), /العفو/);
    const shahada = await ask('كيف أصبح مسلما؟');
    assert.match(shahada, /أشهد أن لا إله إلا الله، وأشهد أن محمدًا رسول الله/);
    assert.match(shahada, /لا يُشترط مسجد ولا احتفال/);
    await page.waitForFunction(() => [...document.querySelectorAll('#assistantLog .asst-ayah')].some((p) => p.textContent.includes('﴿') && p.textContent.length > 10));
    await ask('<img src=x onerror="window.__xss=1">');
    assert.equal(await page.evaluate(() => window.__xss), undefined, 'user text is never parsed as HTML');
    assert.equal(await page.locator('#assistantLog img').count(), 0);
    // the "go" button navigates
    await ask('أين مواقيت الصلاة؟');
    await page.locator('#assistantLog .asst-msg--bot').last().locator('.btn-primary').click();
    assert.equal(await visiblePage(page), 'prayer');
    await close(s);
  });

  test('English interface: greeting and the Shahada answer in English', async () => {
    const s = await open({ hash: '#/assistant', storage: { lang: 'en' } });
    const { page } = s;
    await page.fill('#assistantInput', 'Hello, how can I become a Muslim?');
    await page.press('#assistantInput', 'Enter');
    await page.waitForSelector('#assistantLog .shahada-card');
    const text = await page.locator('#assistantLog .asst-msg--bot').last().textContent();
    assert.match(text, /Hello and welcome/);
    assert.match(text, /I bear witness that there is no deity worthy of worship except Allah/);
    await close(s);
  });
});
