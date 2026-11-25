// End-to-end tests for the innovation phase (insights, ayah notes and collections, backup and restore,
// daily challenge, listening statistics), in a real browser against the site served like GitHub Pages
// (no backend), with third-party APIs answered from the verified datasets.
// The original suites (features, evolution, about, quality) keep guarding everything that existed before.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { after, before, describe, test } from 'node:test';

import { chromium, collectErrors, mockUpstream, startPagesServer } from './helpers.mjs';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

let browser;
let site;
before(async () => { browser = await chromium.launch(); site = await startPagesServer(); });
after(async () => { await browser?.close(); await site?.close(); });

const pad = (n) => String(n).padStart(2, '0');
const localKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return localKey(d); };
const TODAY = localKey(new Date());

// The values a visitor of the ORIGINAL site may have stored (feature_preservation_checklist.md §G).
const ORIGINAL = {
  theme: 'light',
  quranBookmark: JSON.stringify({ surahNum: 36, ayahIndex: 4, ayahNumInSurah: 5 }),
  islamicProfile: JSON.stringify({ name: 'عبد الله', goal: 'حفظ جزء عم' }),
  dailyWird: JSON.stringify({ [TODAY]: { quran: true, morning: false, evening: false, prayer: true } }),
  favoriteSurahs: '[1,18,36]',
};

async function open({ storage = null, viewport = { width: 1366, height: 900 }, colorScheme = 'light', locale = 'ar', acceptDownloads = false, bypassCSP = false } = {}) {
  const context = await browser.newContext({ viewport, locale, colorScheme, reducedMotion: 'reduce', acceptDownloads, bypassCSP });
  await mockUpstream(context);
  if (storage) await context.addInitScript((s) => { if (!sessionStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem('__seeded', '1'); } }, storage);
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(site.url);
  await page.waitForSelector('#surahGrid .surah-card');
  await page.waitForSelector('#insightsGrid .insight-card');
  return { context, page, errors };
}
const close = async ({ context, errors }) => { await context.close(); assert.deepEqual(errors, [], 'no JavaScript errors'); };
const storageOf = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);

async function axe(page, include) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async (sel) => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(sel ? { include: [sel] } : document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
    return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  }, include);
}

describe('insights («بصيرة»)', () => {
  test('a new visitor sees honest empty states, the next step and a 12-week map', async () => {
    const s = await open();
    const { page } = s;
    assert.equal((await page.textContent('#insightsTitle')).trim(), '📊 بصيرة: تحليل تقدمك');
    assert.equal(await page.locator('#insightsGrid .insight-card').count(), 4);
    assert.equal(await page.locator('.heat-map .heat-cell').count(), 84);
    assert.equal(await page.locator('.heat-map .heat-cell:not(.heat-0)').count(), 0, 'no invented activity');
    assert.equal((await page.textContent('#insightStreak strong')).trim(), '0');
    assert.match(await page.textContent('#insightMemo'), /لا مراجعات مستحقة اليوم/);
    assert.match(await page.textContent('#insightMemo'), /لم تُسجَّل أخطاء بعد/);
    assert.ok(await page.locator('#insightNext .next-item').count() >= 1);
    assert.match(await page.textContent('#insightNext'), /اقرأ 10 آيات لتبلغ هدفك اليوم/);
    await close(s);
  });

  test('figures come from the stored reading log, memorisation store and listening log', async () => {
    const memo = {
      v: 1,
      surahs: {
        1: { completed: true, step: 0, nextReview: dayOffset(-4), lastReview: dayOffset(-5), ayahs: { 1: { ok: 3, mistakes: 0 }, 2: { ok: 1, mistakes: 3 } } },
        112: { memorized: true, step: 0, nextReview: dayOffset(0), ayahs: {} },
      },
      plan: { dailyTarget: 5, surahs: [] },
      days: { [dayOffset(-1)]: { ayahs: 4, keys: [] } },
      mistakes: [{ date: dayOffset(-1), surah: 1, ayah: 2, missing: ['ٱلْحَمْدُ'], substituted: [] }, { date: dayOffset(-1), surah: 1, ayah: 2, missing: ['ٱلْحَمْدُ', 'رَبِّ'], substituted: [] }],
      sessions: [{ date: dayOffset(-3), surah: 1, score: 60 }, { date: dayOffset(-2), surah: 1, score: 70 }, { date: dayOffset(-1), surah: 1, score: 90 }, { date: dayOffset(-1), surah: 1, score: 100 }],
    };
    const readingLog = { days: { [TODAY]: [1, 2, 3], [dayOffset(-1)]: [4, 5], [dayOffset(-2)]: [6] }, seen: Array.from({ length: 624 }, (_, i) => i + 1) };
    const s = await open({ storage: {
      memorizationData: JSON.stringify(memo), readingLog: JSON.stringify(readingLog),
      listeningLog: JSON.stringify({ days: { [TODAY]: 1800 }, reciters: { afasy: 1800 } }),
    } });
    const { page } = s;
    assert.equal(await page.locator('.heat-map .heat-cell:not(.heat-0)').count(), 3);
    assert.equal((await page.textContent('#insightStreak strong')).trim(), '3');
    assert.equal((await page.textContent('#insightKhatma strong')).trim(), '10%');
    assert.equal((await page.textContent('#insightListenWeek strong')).trim(), '30');
    assert.match(await page.textContent('#insightActivity'), /مشاري العفاسي/);
    // Revision order: Al-Fatihah (4 days overdue, 75 % mistakes) before Al-Ikhlas (due today).
    const order = await page.locator('#revisionPriority li strong').allTextContents();
    assert.equal(order.length, 2);
    assert.match(order[0], /ٱلْفَاتِحَةِ/);
    assert.match(await page.textContent('#weakAyahs'), /ٱلْفَاتِحَةِ ﴿2﴾/);
    assert.match(await page.textContent('#missedWords'), /ٱلْحَمْدُ.*×2/);
    assert.match(await page.textContent('#accuracyTrend'), /80%.*30/);
    // The first recommendation is the revision, with its reason.
    assert.match(await page.textContent('#insightNext .next-item >> nth=0'), /^\s*🔄\s*راجع سورة ٱلْفَاتِحَةِ/);

    // "Recite" on a weak ayah opens the memorisation lab on exactly that ayah.
    await page.click('#weakAyahs li >> nth=0 >> text=تسميع');
    await page.waitForSelector('#voiceTestModal[open]');
    await page.waitForFunction(() => document.getElementById('labFrom').options.length > 0);
    assert.equal(await page.inputValue('#voiceSurahSelect'), '1');
    assert.equal(await page.inputValue('#labFrom'), '1');
    assert.equal(await page.inputValue('#labTo'), '1');
    await close(s);
  });

  test('khatma planner: ayahs per day from what was actually read; saved under a new key', async () => {
    const s = await open({ storage: { readingLog: JSON.stringify({ days: {}, seen: Array.from({ length: 236 }, (_, i) => i + 1) }) } });
    const { page } = s;
    assert.match(await page.textContent('#insightKhatmaPlan'), /اختر تاريخًا/);
    await page.fill('#khatmaTarget', dayOffset(29));
    await page.click('#insightKhatmaPlan button[type="submit"]');
    await page.waitForSelector('#insightKhatmaPlan .journey-figure');
    assert.equal((await page.textContent('#insightKhatmaPlan .journey-figure')).trim(), '200 آية يوميًا');
    assert.match(await page.textContent('#insightKhatmaPlan'), /تحتاج إلى زيادة وردك/);
    assert.deepEqual(JSON.parse(await storageOf(page, 'khatmaPlan')), { target: dayOffset(29), start: TODAY });
    await page.reload();
    await page.waitForSelector('#insightKhatmaPlan .journey-figure');
    assert.equal(await page.inputValue('#khatmaTarget'), dayOffset(29), 'the plan persists');
    await page.click('#insightKhatmaPlan >> text=إلغاء الخطة');
    assert.equal(await storageOf(page, 'khatmaPlan'), 'null');
    await close(s);
  });

  test('listening statistics count real playing time of the surah player', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid .surah-card[data-surah="1"] [data-action="play"]');
    await page.waitForFunction(() => !document.getElementById('audioPlayer').paused);
    await page.waitForTimeout(3500);
    await page.evaluate(() => document.getElementById('audioPlayer').pause());
    await page.waitForFunction(() => localStorage.getItem('listeningLog') !== null);
    const log = JSON.parse(await storageOf(page, 'listeningLog'));
    const seconds = log.days[TODAY];
    assert.ok(seconds >= 2 && seconds <= 5, `counted ${seconds}s of ~3.5s`);
    assert.deepEqual(Object.keys(log.reciters), [await page.inputValue('#reciterSelect')]);
    await close(s);
  });

  test('all four languages: translated, and no untranslated key names leak', async () => {
    const s = await open();
    const { page } = s;
    const titles = { en: 'Insights: your progress', es: 'Perspectiva: tu progreso', fr: 'Perspective : votre progression' };
    for (const [lang, title] of Object.entries(titles)) {
      await page.selectOption('#langSelect', lang);
      assert.match(await page.textContent('#insightsTitle'), new RegExp(title));
      const body = await page.textContent('#dashboardSection');
      assert.doesNotMatch(body, /\b(insight|insights|next|heat|khatma|challenge|notes|backup)_[a-z_]+\b/, `${lang}: raw key shown`);
    }
    await close(s);
  });
});

describe('daily knowledge challenge', () => {
  test('one question from the site’s own quizzes; the answer is kept for the day', async () => {
    const s = await open();
    const { page } = s;
    const card = page.locator('#challengeCard');
    await card.waitFor();
    assert.ok(await card.locator('.quiz-option').count() >= 2);
    await card.locator('.quiz-option').first().click();
    await page.waitForSelector('#challengeCard .quiz-option.is-correct');
    assert.equal(await card.locator('.quiz-option:disabled').count(), await card.locator('.quiz-option').count());
    const saved = JSON.parse(await storageOf(page, 'dailyChallenge'));
    assert.ok(saved.days[TODAY]);
    assert.match(await card.textContent(), /من \d+ سؤال|من ١ سؤالًا|1 سؤالًا|أجبت صحيحًا/);
    await page.reload();
    await page.waitForSelector('#challengeCard .quiz-option.is-correct');
    // The link opens the lesson the question comes from.
    await card.locator('.link-btn').click();
    await page.waitForSelector('#lessonModal[open]');
    await close(s);
  });
});

describe('ayah notes and collections', () => {
  test('file an ayah in a collection with a note; it is marked in the Mushaf and listed in «ملاحظاتي»', async () => {
    const s = await open();
    const { page } = s;
    await page.evaluate(() => document.getElementById('surahs').scrollIntoView());
    await page.click('#surahGrid .surah-card[data-surah="1"] [data-action="read"]');
    await page.waitForSelector('#ayah-1');
    await page.click('#ayah-1');
    await page.waitForSelector('#ayahDetailsBox:not([hidden])');
    assert.equal(await page.getAttribute('#ayahNoteBtn', 'aria-expanded'), 'false');
    await page.click('#ayahNoteBtn');
    await page.waitForSelector('#ayahNoteForm:not([hidden])');
    await page.selectOption('#ayahNoteCollection', 'memorize');
    await page.fill('#ayahNoteText', 'الحمد لله: الثناء بصفات الكمال <b>not markup</b>');
    await page.click('#ayahNoteForm button[type="submit"]');
    await page.waitForSelector('#ayahNoteForm[hidden]', { state: 'attached' });
    assert.match(await page.textContent('#ayahNoteBtn'), /للحفظ/);
    assert.ok(await page.locator('#ayah-1.has-note').count());
    const stored = JSON.parse(await storageOf(page, 'ayahNotes'));
    assert.deepEqual(stored.items.map((i) => [i.surah, i.ayah, i.collection]), [[1, 2, 'memorize']]);
    // The original "last read" bookmark is a separate feature and is untouched.
    assert.equal(await storageOf(page, 'quranBookmark'), null);

    await page.click('#dashboardSection [data-open="notesModal"]');
    await page.waitForSelector('#notesModal[open] .note-item');
    assert.match(await page.textContent('#notesList'), /ٱلْفَاتِحَةِ ﴿2﴾/);
    assert.match(await page.textContent('#notesList'), /<b>not markup<\/b>/, 'notes are shown as text, never as HTML');
    assert.equal(await page.locator('#notesList b').count(), 0);
    await page.selectOption('#notesFilter', 'review');
    assert.match(await page.textContent('#notesList'), /لا نتائج مطابقة/);
    await page.selectOption('#notesFilter', 'all');
    await page.fill('#notesNewCollectionName', 'تدبر رمضان');
    await page.click('#notesNewCollection button');
    assert.ok(await page.locator('#notesFilter option', { hasText: 'تدبر رمضان' }).count());
    page.once('dialog', (d) => d.accept());
    await page.click('#notesList >> text=حذف');
    await page.waitForSelector('#notesList >> text=لا ملاحظات بعد.');
    assert.equal(await page.locator('#ayah-1.has-note').count(), 0);
    await close(s);
  });

  test('side menu entry and text export', async () => {
    const s = await open({ acceptDownloads: true, storage: { ayahNotes: JSON.stringify({ v: 1, items: [{ surah: 2, ayah: 255, collection: 'reflect', note: 'آية الكرسي', updated: TODAY }], custom: [] }) } });
    const { page } = s;
    await page.click('[data-open="sideMenu"]');
    await page.click('#sideMenu [data-open="notesModal"]');
    await page.waitForSelector('#notesModal[open] .note-item');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#notesExport')]);
    const text = readFileSync(await download.path(), 'utf8');
    assert.match(text, /\(2:255\) — آية الكرسي/);
    await page.click('#notesList >> text=📖 فتح');
    await page.waitForSelector('#ayah-254.has-note');
    await close(s);
  });
});

describe('backup and restore', () => {
  test('export contains the original keys byte-for-byte; restore merges them back', async () => {
    const s = await open({ acceptDownloads: true, storage: { ...ORIGINAL, rosaryCount: '99' } });
    const { page } = s;
    await page.click('[data-open="sideMenu"]');
    await page.click('#sideMenu [data-open="profileModal"]');
    await page.waitForSelector('#profileModal[open]');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#backupExport')]);
    assert.match(download.suggestedFilename(), /^quran-website-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const backup = JSON.parse(readFileSync(await download.path(), 'utf8'));
    assert.equal(backup.app, 'quran-website');
    for (const [k, v] of Object.entries(ORIGINAL)) assert.equal(backup.data[k], v, k);
    assert.equal(backup.data.rosaryCount, '99');
    assert.ok(!('__seeded' in backup.data));

    // Simulate a fresh browser: wipe, then restore from the file.
    await page.evaluate(() => { localStorage.clear(); sessionStorage.setItem('__seeded', '1'); });
    page.once('dialog', (d) => d.accept());
    await page.setInputFiles('#backupImport', { name: 'b.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
    await page.waitForEvent('load');
    await page.waitForSelector('#insightsGrid .insight-card');
    for (const [k, v] of Object.entries(ORIGINAL)) assert.equal(await storageOf(page, k), v, k);
    assert.equal(await storageOf(page, 'rosaryCount'), '99');
    await close(s);
  });

  test('an invalid or foreign file is rejected and nothing is written', async () => {
    const s = await open({ storage: ORIGINAL });
    const { page } = s;
    await page.evaluate(() => document.getElementById('profileModal').showModal());
    const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));
    await page.setInputFiles('#backupImport', { name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{not json') });
    await page.waitForFunction(() => document.getElementById('backupStatus').textContent.length > 0);
    assert.match(await page.textContent('#backupStatus'), /ليس ملفًا صالحًا/);
    await page.setInputFiles('#backupImport', { name: 'y.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ app: 'evil', version: 1, data: { theme: 'dark' } })) });
    await page.waitForFunction(() => /ليس نسخة احتياطية/.test(document.getElementById('backupStatus').textContent));
    assert.equal(await page.evaluate(() => JSON.stringify({ ...localStorage })), before);
    await close(s);
  });
});

describe('compatibility and quality', () => {
  test('using every new feature leaves the original storage keys untouched', async () => {
    const s = await open({ storage: ORIGINAL });
    const { page } = s;
    await page.locator('#challengeCard .quiz-option').first().click();
    await page.fill('#khatmaTarget', dayOffset(10));
    await page.click('#insightKhatmaPlan button[type="submit"]');
    await page.evaluate(() => document.getElementById('surahs').scrollIntoView());
    await page.click('#surahGrid .surah-card[data-surah="2"] [data-action="read"]');
    await page.waitForSelector('#ayah-0');
    await page.click('#ayah-0');
    await page.click('#ayahNoteBtn');
    await page.click('#ayahNoteForm button[type="submit"]');
    await page.waitForFunction(() => localStorage.getItem('ayahNotes') !== null);
    for (const [k, v] of Object.entries(ORIGINAL)) assert.equal(await storageOf(page, k), v, k);
    await close(s);
  });

  for (const scheme of ['light', 'dark']) {
    test(`axe: insights, challenge, notes dialog and backup section (${scheme} theme)`, async () => {
      const s = await open({ colorScheme: scheme, bypassCSP: true, storage: {
        theme: scheme,
        ayahNotes: JSON.stringify({ v: 1, items: [{ surah: 1, ayah: 1, collection: 'dua', note: 'ملاحظة', updated: TODAY }], custom: [] }),
        memorizationData: JSON.stringify({ v: 1, surahs: { 1: { completed: true, nextReview: dayOffset(-1), ayahs: { 2: { ok: 1, mistakes: 2 } } } }, plan: { dailyTarget: 5, surahs: [] }, days: {}, mistakes: [{ surah: 1, ayah: 2, missing: ['رَبِّ'] }], sessions: [] }),
      } });
      const { page } = s;
      assert.deepEqual(await axe(page, '.journey'), []);
      await page.click('#dashboardSection [data-open="notesModal"]');
      await page.waitForSelector('#notesModal .note-item');
      assert.deepEqual(await axe(page, '#notesModal'), []);
      await page.keyboard.press('Escape');
      await page.click('#dashboardSection [data-open="profileModal"]');
      await page.waitForSelector('#profileModal[open]');
      assert.deepEqual(await axe(page, '#profileModal'), []);
      await close(s);
    });
  }

  test('regression: a memorisation history entry without a date (or a null entry) no longer stops the page', async () => {
    // Before this phase, features/memorization.js threw on such an entry during start-up and every later
    // feature (dashboard, learning, profile…) was left uninitialised.
    const s = await open({ storage: { memorizationData: JSON.stringify({ v: 1, surahs: {}, plan: { dailyTarget: 5, surahs: [] }, days: {}, mistakes: [null, { surah: 1, ayah: 2, missing: ['رَبِّ'] }], sessions: [null] }) } });
    const { page } = s;
    assert.ok(await page.locator('#journeyGrid .journey-card').count() >= 6, 'dashboard started');
    assert.match(await page.textContent('#mistakeList'), /ٱلْفَاتِحَةِ ﴿2﴾/);
    await close(s);
  });

  test('phone width: the new sections fit without horizontal scrolling', async () => {
    const s = await open({ viewport: { width: 320, height: 700 } });
    const { page } = s;
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 0, `overflow ${overflow}px`);
    const tooWide = await page.evaluate(() => [...document.querySelectorAll('#insightsGrid .insight-card, #challengeCard')]
      .filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length);
    assert.equal(tooWide, 0);
    await close(s);
  });
});
