// End-to-end tests for the platform evolution, in a real browser against the site served like
// GitHub Pages (no backend), with third-party APIs answered from the verified datasets.
// The original feature suite (features.test.mjs) keeps guarding everything that existed before.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { after, before, describe, test } from 'node:test';

import {
  AYAHS, EDITIONS, FAKE_SPEECH, chromium, autoReveal, collectErrors, fakeMedia, mockUpstream, speechError, startPagesServer,
} from './helpers.mjs';

const require = createRequire(import.meta.url);
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

let browser;
let site;
before(async () => { browser = await chromium.launch(); site = await startPagesServer(); });
after(async () => { await browser?.close(); await site?.close(); });

async function open({ init = [], storage = null, viewport = { width: 1366, height: 900 }, upstream = {}, bypassCSP = false, colorScheme = 'light' } = {}) {
  // reducedMotion: the pulsing microphone button is otherwise never "stable" for Playwright clicks
  // (the stylesheet honours prefers-reduced-motion).
  const context = await browser.newContext({ viewport, locale: 'ar', bypassCSP, colorScheme, reducedMotion: 'reduce' });
  const calls = await mockUpstream(context, upstream);
  for (const script of init) await context.addInitScript(script);
  if (storage) await context.addInitScript((s) => { if (!sessionStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem('__seeded', '1'); } }, storage);
  const page = autoReveal(await context.newPage());
  const errors = collectErrors(page);
  await page.goto(site.url);
  await page.waitForSelector('#surahGrid .surah-card');
  return { context, page, errors, calls };
}
const close = async ({ context, errors }) => { await context.close(); assert.deepEqual(errors, [], 'no JavaScript errors'); };
const text = (page, sel) => page.textContent(sel);
const ayahText = (s, n) => AYAHS.find((a) => a.surah === s && a.numberInSurah === n).text;

async function axe(page, include) {
  await page.addScriptTag({ content: AXE });
  return page.evaluate(async (sel) => {
    const res = await window.axe.run(sel ? { include: [sel] } : document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return res.violations.map((v) => ({ id: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
  }, include);
}

// ===================================================================== navigation preserved + added
describe('navigation', () => {
  test('all original nav items remain in the sidebar; prayer learning and the academy have their pages', async () => {
    const s = await open();
    const { page } = s;
    const labels = (await page.locator('.side-link .side-label').allTextContents()).map((t) => t.trim());
    for (const label of ['المصحف وفهرس السور', 'مواقيت الصلاة والتقويم الهجري', 'الأذكار وحصن المسلم', 'رسالة الإسلام', 'البحث في الآيات', 'التسميع والحفظ', 'تعلم الصلاة الصحيحة', 'الأكاديمية الإسلامية', 'من أنا', 'المفضلة', 'حسابي', 'تسجيل دخول', 'تبرع', 'تواصل معنا', 'الإعدادات', 'ملاحظاتي', 'المساعد']) {
      assert.ok(labels.includes(label), label);
    }
    await page.click('.side-link[data-route="learn-prayer"]');
    assert.ok(await page.isVisible('#learnSection'));
    await page.click('.side-link[data-route="settings"]');
    assert.ok(await page.locator('#settingsModal').evaluate((d) => d.open));
    await close(s);
  });
});

// ===================================================================== learn the prayer
describe('learn the correct prayer', () => {
  test('18 modules, illustrated 10-step tutorial, lesson with verified Quran text, quiz and progress', async () => {
    const s = await open();
    const { page } = s;
    assert.equal(await page.locator('#lessonGrid .lesson-card').count(), 18);
    // Tutorial: 10 steps, each with its own diagram.
    const srcs = new Set();
    for (let i = 0; i < 10; i += 1) {
      srcs.add(await page.locator('#postureTutorial .stepper-figure img').getAttribute('src'));
      if (i < 9) await page.locator('#postureTutorial .stepper-nav .btn-primary').click();
    }
    assert.equal(srcs.size, 10);
    assert.match(await text(page, '#postureTutorial .stepper-title'), /10\. التسليم/);
    assert.ok(await page.locator('#postureTutorial .stepper-nav .btn-primary').isDisabled());
    // The diagrams load (offline-capable local files). Wait for the load instead of checking the instant the
    // step changes: on a slow CI runner the image may still be decoding (this was a flaky failure in CI).
    await page.waitForFunction(() => { const img = document.querySelector('#postureTutorial img'); return img.complete && img.naturalWidth > 0; }, null, { timeout: 10_000 });
    assert.ok(await page.locator('#postureTutorial img').evaluate((img) => img.complete && img.naturalWidth > 0));

    // Lesson: wudu — the Quran citation is the verified text of 5:6.
    await page.click('#lessonGrid [data-id="wudu"]');
    await page.waitForFunction(() => !/…/.test(document.querySelector('#lessonBody .cite--quran .cite-text').textContent));
    assert.equal(await text(page, '#lessonBody .cite--quran .cite-text'), `﴿${ayahText(5, 6)}﴾`);
    const hadithLink = await page.locator('#lessonBody .cite--hadith a').first();
    assert.match(await hadithLink.getAttribute('href'), /^https:\/\/dorar\.net\/hadith\/search\?q=/);
    assert.equal(await hadithLink.getAttribute('rel'), 'noopener noreferrer');
    assert.ok(await page.locator('#lessonBody .diff-box').count() >= 1, 'scholarly differences are shown');
    // Quiz: one right and one wrong answer.
    await page.locator('#lessonBody .quiz-q').nth(0).locator('.quiz-option').nth(1).click();
    await page.locator('#lessonBody .quiz-q').nth(1).locator('.quiz-option').nth(1).click();
    assert.match(await text(page, '#lessonBody .quiz-result'), /1 من 2/);
    assert.deepEqual(JSON.parse(await page.evaluate(() => localStorage.getItem('learningProgress'))).quizzes.wudu.score, 1);
    await page.click('#lessonDone');
    assert.match(await text(page, '#lessonDone'), /مكتمل/);
    await page.keyboard.press('Escape');
    assert.match(await text(page, '#learnProgressText'), /1 من 18/);
    assert.ok(await page.locator('#lessonGrid [data-id="wudu"].is-done').count());
    // Clicking the reference opens the Mushaf at that ayah.
    await page.click('#lessonGrid [data-id="travel"]');
    await page.locator('#lessonBody .cite-ref').first().click();
    await page.waitForSelector('#ayah-100.active-ayah');
    await close(s);
  });

  test('scholars panel: honest link status, no endorsement, external links are safe', async () => {
    const s = await open();
    const { page } = s;
    assert.equal(await page.locator('#scholarGrid .scholar-card').count(), 3);
    const statuses = await page.locator('#scholarGrid .status-pill').allTextContents();
    assert.ok(statuses.includes('موقع رسمي') && statuses.includes('نتائج بحث') && statuses.includes('رابط كان منشورًا في الموقع'));
    for (const a of await page.locator('#learnSection a[target="_blank"]').all()) assert.equal(await a.getAttribute('rel'), 'noopener noreferrer');
    assert.match(await text(page, '#learnSection'), /لا يعني ذكر عالم هنا أنه يزكّي هذا الموقع/);
    await close(s);
  });

  test('academy: five courses, objectives, lessons and completion', async () => {
    const s = await open();
    const { page } = s;
    assert.equal(await page.locator('#courseGrid .course-card').count(), 5);
    await page.click('#courseGrid [data-id="tajweed"]');
    assert.equal(await page.locator('#courseBody .course-lesson').count(), 4);
    await page.locator('#courseBody .course-lesson').first().click();
    assert.ok(await page.locator('#lessonModal').evaluate((d) => d.open));
    assert.match(await text(page, '#lessonBody'), /التلقي/, 'states that tajweed is learnt from a teacher');
    await page.click('#lessonDone');
    await page.keyboard.press('Escape');
    assert.match(await text(page, '#courseGrid [data-id="tajweed"]'), /1 من 4/);
    assert.match(await text(page, '#academySection'), /ليس إجازة أو شهادة شرعية/);
    await close(s);
  });
});

// ===================================================================== memorisation lab
async function openLab(page, surah, mode = null) {
  await page.click('[data-open="voiceTestModal"]');
  if (mode) await page.selectOption('#labMode', mode);
  await page.selectOption('#voiceSurahSelect', String(surah));
  await page.waitForSelector('#labLive:not([hidden])');
}
const speak = async (page, words, isFinal = true) => {
  await page.waitForFunction(() => window.__recognition?.running);
  await page.evaluate(([w, f]) => window.__speak(w, f), [words, isFinal]);
};

describe('memorisation lab', () => {
  test('word-level feedback: position, missing word, substitution; progress and mistake history saved', async () => {
    const s = await open({ init: [FAKE_SPEECH] });
    const { page } = s;
    await openLab(page, 1);
    await page.click('#micBtn');
    await speak(page, 'بسم الله', false);
    assert.match(await text(page, '#labPosition'), /الكلمة 3 من 4/);
    assert.equal(await page.locator('#labWords .lab-word.is-correct').count(), 2);
    await speak(page, 'بسم الله الرحمن الرحيم');
    await page.waitForFunction(() => document.querySelectorAll('#recitedAyahsContainer .ayah-span').length === 1);
    // Ayah 2 with a substituted last word: the original sequential matcher (3 of 4 words) still accepts
    // it, as before; the substitution is now reported and recorded in the mistake history.
    await speak(page, 'الحمد لله رب الناس');
    await page.waitForFunction(() => document.querySelectorAll('#recitedAyahsContainer .ayah-span').length === 2);
    const memo = JSON.parse(await page.evaluate(() => localStorage.getItem('memorizationData')));
    assert.equal(Object.keys(memo.surahs['1'].ayahs).length, 2);
    assert.ok(Object.values(memo.days)[0].ayahs >= 2);
    assert.match(memo.mistakes.at(-1).substituted.join(' '), /الناس/);
    // In the self-test the same recitation is not accepted, and the wrong word is shown.
    await page.click('#micBtn');
    await page.selectOption('#labMode', 'test');
    await page.click('#micBtn');
    await speak(page, 'بسم الله الرحمن الرحيم');
    await page.waitForFunction(() => /﴿2﴾/.test(document.getElementById('labPosition').textContent));
    await speak(page, 'الحمد لله رب الناس');
    assert.match(await text(page, '#labNotes'), /الناس/);
    assert.equal(await page.locator('#labWords .lab-word.is-substituted').count(), 1);
    assert.equal(await page.locator('#recitedAyahsContainer .ayah-span').count(), 1);
    await page.click('#labTabPlan');
    assert.match(await text(page, '#planStats'), /2 \/ 5/);
    await close(s);
  });

  test('completing a surah schedules a revision; plan, memorised surahs and mistakes are listed', async () => {
    const s = await open({ init: [FAKE_SPEECH] });
    const { page } = s;
    await openLab(page, 112);
    await page.click('#micBtn');
    await speak(page, 'السلام عليكم ورحمة الله'); // wrong: recorded as a mistake
    for (const line of ['قل هو الله احد', 'الله الصمد', 'لم يلد ولم يولد', 'ولم يكن له كفوا احد']) await speak(page, line);
    await page.waitForSelector('#labSummary:not([hidden])');
    assert.match(await text(page, '#voiceFeedback'), /أتممت السورة بنجاح/);
    const memo = JSON.parse(await page.evaluate(() => localStorage.getItem('memorizationData')));
    assert.ok(memo.surahs['112'].completed && memo.surahs['112'].nextReview);
    assert.equal(memo.mistakes.length, 1);
    await page.click('#labTabPlan');
    await page.selectOption('#planAddSelect', '67');
    await page.click('#planAddBtn');
    await page.selectOption('#memorizedAddSelect', '114');
    await page.click('#memorizedAddBtn');
    assert.equal(await page.locator('#planList [data-action="practice"][data-surah="67"]').count(), 1);
    assert.equal(await page.locator('#memorizedList [data-action="unmemorize"][data-surah="114"]').count(), 1);
    assert.equal(await page.locator('#revisionUpcoming li').count(), 2, 'surah 112 (completed) and 114 (memorised)');
    assert.equal(await page.locator('#mistakeList .mistake').count(), 1);
    // A revision becomes due after its date.
    await page.evaluate(() => {
      const m = JSON.parse(localStorage.getItem('memorizationData'));
      m.surahs['112'].nextReview = '2000-01-01';
      localStorage.setItem('memorizationData', JSON.stringify(m));
    });
    await page.keyboard.press('Escape');
    await page.click('[data-open="voiceTestModal"]');
    await page.click('#labTabPlan');
    await page.locator('#revisionDue button').first().click();
    assert.equal(await page.inputValue('#voiceSurahSelect'), '112');
    await close(s);
  });

  test('modes: ayah-by-ayah pauses, repeat requires N recitations, self-test is strict, hide reveals in place', async () => {
    const s = await open({ init: [FAKE_SPEECH] });
    const { page } = s;
    await openLab(page, 112, 'ayah');
    assert.match(await text(page, '#labWords'), /قُلْ/, 'ayah mode shows the words');
    await page.click('#micBtn');
    await speak(page, 'قل هو الله احد');
    await page.waitForSelector('#labNext:not([hidden])');
    assert.equal(await page.getAttribute('#micBtn', 'aria-pressed'), 'false');
    await page.click('#labNext');
    assert.match(await text(page, '#labPosition'), /﴿2﴾/);

    await page.selectOption('#labMode', 'repeat');
    await page.selectOption('#labRepeat', { value: '2' });
    await page.click('#micBtn');
    await speak(page, 'قل هو الله احد');
    assert.match(await text(page, '#voiceFeedback'), /1 من 2/);
    await speak(page, 'قل هو الله احد');
    await page.waitForFunction(() => /﴿2﴾/.test(document.getElementById('labPosition').textContent));

    await page.click('#micBtn'); // stop
    await page.selectOption('#labMode', 'test');
    assert.ok(await page.isDisabled('#labHint'), 'no hints in self-test');
    await page.click('#micBtn');
    await speak(page, 'قل هو الله'); // 3 of 4 words: accepted in sequential mode, not in the self-test
    await page.waitForTimeout(150);
    assert.equal(await page.locator('#recitedAyahsContainer .ayah-span').count(), 0);
    await page.click('#labRetry');
    await speak(page, 'قل هو الله احد');
    await page.waitForFunction(() => document.querySelectorAll('#recitedAyahsContainer .ayah-span').length === 1);

    await page.click('#micBtn');
    await page.selectOption('#labMode', 'hide');
    assert.equal(await page.locator('#recitedAyahsContainer .hidden-ayah').count(), 4);
    assert.match(await text(page, '#lab-ayah-1'), /•/, 'ayah 2 is hidden');
    await page.click('#micBtn');
    await speak(page, 'قل هو الله احد');
    await page.waitForSelector('#lab-ayah-0.is-revealed');
    await page.click('#labPeek');
    assert.doesNotMatch(await text(page, '#lab-ayah-1'), /•/, 'peek reveals the current ayah');
    assert.ok((await text(page, '#lab-ayah-1')).includes(AYAHS.find((a) => a.surah === 112 && a.numberInSurah === 2).text.split(' ')[1]));
    assert.equal(await page.evaluate(() => localStorage.getItem('memorizationMode')), 'hide');
    await close(s);
  });

  test('microphone: denied permission is explained without starting; test shows devices, processing, cleanup', async () => {
    const denied = await open({ init: [FAKE_SPEECH, fakeMedia({ permission: 'denied' })] });
    await openLab(denied.page, 112);
    await denied.page.click('#micBtn');
    await denied.page.waitForFunction(() => /القفل/.test(document.getElementById('micStatus').textContent));
    assert.ok(!(await denied.page.evaluate(() => window.__recognition?.running)), 'recognition not started');
    await close(denied);

    const ok = await open({ init: [FAKE_SPEECH, fakeMedia({ permission: 'granted' })] });
    const { page } = ok;
    await page.click('[data-open="voiceTestModal"]');
    await page.click('#micTestBtn');
    await page.waitForFunction(() => /يعمل/.test(document.getElementById('micStatus').textContent));
    assert.match(await text(page, '#micStatus'), /إلغاء الصدى/);
    const constraints = await page.evaluate(() => window.__gumConstraints);
    assert.deepEqual(constraints.audio.echoCancellation, { ideal: true });
    assert.deepEqual(constraints.audio.noiseSuppression, { ideal: true });
    assert.deepEqual(constraints.audio.autoGainControl, { ideal: true });
    assert.match(await text(page, '#micDevice'), /USB Microphone/);
    await page.keyboard.press('Escape'); // closing the lab releases the microphone
    await page.waitForFunction(() => window.__tracksStopped === 1);
    await close(ok);

    const none = await open({ init: [FAKE_SPEECH, fakeMedia({ gum: 'NotFoundError' })] });
    await none.page.click('[data-open="voiceTestModal"]');
    await none.page.click('#micTestBtn');
    await none.page.waitForFunction(() => /لم يُعثر على ميكروفون/.test(document.getElementById('micStatus').textContent));
    await close(none);
  });

  test('speech-recognition failures: permission and repeated network errors stop with a clear message', async () => {
    const s = await open({ init: [FAKE_SPEECH] });
    const { page } = s;
    await openLab(page, 112);
    await page.click('#micBtn');
    await page.waitForFunction(() => window.__recognition?.running);
    await speechError(page, 'not-allowed');
    await page.waitForFunction(() => /لم يتم السماح/.test(document.getElementById('voiceResultText').textContent));
    assert.equal(await page.getAttribute('#micBtn', 'aria-pressed'), 'false');
    await page.click('#micBtn');
    for (let i = 0; i < 3; i += 1) {
      await page.waitForFunction(() => window.__recognition?.running, null, { timeout: 5000 });
      await speechError(page, 'network');
    }
    await page.waitForFunction(() => /اتصال بالإنترنت/.test(document.getElementById('voiceResultText').textContent));
    await close(s);
  });
});

// ===================================================================== reader, player, dashboard, settings, search
describe('reading and listening', () => {
  test('juz and page navigation, reading theme, sajda mark, reading log and daily goal', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="read"][data-surah="1"]');
    await page.waitForSelector('#ayah-6');
    await page.click('.reader-tools summary');
    await page.selectOption('#juzSelect', { value: '2' });
    await page.waitForFunction(() => /\s2$/.test(document.getElementById('readingLabel').textContent) && document.getElementById('ayah-141'));
    await page.waitForFunction(() => /الجزء 2/.test(document.getElementById('readingPosition').textContent));
    await page.fill('#pageInput', '597'); // page 597 starts with surah 95
    await page.press('#pageInput', 'Enter');
    await page.waitForFunction(() => /\s95$/.test(document.getElementById('readingLabel').textContent));
    await page.selectOption('#juzSelect', { value: '30' });
    await page.waitForFunction(() => /\s78$/.test(document.getElementById('readingLabel').textContent));
    await page.click('#surahGrid [data-action="read"][data-surah="96"]');
    await page.waitForSelector('#ayah-18');
    assert.equal(await page.locator('#readingText .sajda-mark').count(), 1, '96:19 is a sajda ayah');
    await page.selectOption('#readingTheme', 'sepia');
    assert.ok(await page.locator('.reading-box.reading-theme--sepia').count());
    assert.equal(await page.evaluate(() => localStorage.getItem('readingTheme')), 'sepia');
    await page.evaluate(() => document.getElementById('ayah-3').scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => (JSON.parse(localStorage.getItem('readingLog') || '{}').seen || []).length >= 3, null, { timeout: 8000 });
    await page.waitForFunction(() => /من 10 آيات اليوم/.test(document.getElementById('journeyGrid').textContent));
    await close(s);
  });

  test('ayah range repeat and auto-continue', async () => {
    const s = await open();
    const { page } = s;
    await page.click('#surahGrid [data-action="read"][data-surah="112"]');
    await page.waitForSelector('#ayah-3');
    await page.click('.reader-tools summary');
    await page.selectOption('#rangeFrom', { value: '1' });
    await page.selectOption('#rangeTo', { value: '2' });
    await page.selectOption('#rangeTimes', { value: '1' });
    await page.click('#rangePlay');
    const src = () => page.evaluate(() => document.getElementById('ayahPlayer').src.split('/').pop());
    const end = () => page.evaluate(() => document.getElementById('ayahPlayer').dispatchEvent(new Event('ended')));
    const first = AYAHS.find((a) => a.surah === 112).id;
    assert.equal(await src(), `${first + 1}.mp3`);
    await end();
    assert.equal(await src(), `${first + 2}.mp3`);
    await end();
    assert.match(await text(page, '#rangePlay'), /تشغيل المقطع/, 'range finished');
    await page.check('#ayahAutoNext');
    await page.click('#ayah-0');
    await end();
    assert.equal(await src(), `${first + 1}.mp3`);
    await close(s);
  });

  test('player: sleep timer at end of surah, queue, recently played, extra speeds, retry after failure', async () => {
    const s = await open({ upstream: { audioFail: (u) => /\/s_gmd\/|\/audio\/ghamdi\//.test(u) } });
    const { page } = s;
    for (const v of ['0.5', '0.75', '1', '1.25', '1.5', '1.75', '2']) assert.equal(await page.locator(`#speedSelect option[value="${v}"]`).count(), 1);
    await page.click('#surahGrid [data-action="play"][data-surah="36"]');
    await page.waitForFunction(() => /036\.mp3$/.test(document.getElementById('audioPlayer').src));
    await page.click('.player-queue summary');
    await page.selectOption('#queueSelect', { value: '67' });
    await page.click('#queueAdd');
    const ended = () => page.evaluate(() => document.getElementById('audioPlayer').dispatchEvent(new Event('ended')));
    await ended();
    await page.waitForFunction(() => /067\.mp3$/.test(document.getElementById('audioPlayer').src), null, { timeout: 5000 });
    await page.waitForFunction(() => /الشيخ/.test(document.getElementById('playerSubtitle').textContent)); // playing
    await page.selectOption('#sleepTimer', { value: 'end' });
    await ended();
    await page.waitForTimeout(300);
    assert.match(await page.evaluate(() => document.getElementById('audioPlayer').src), /067\.mp3$/, 'did not advance');
    assert.match(await text(page, '#playerSubtitle'), /مؤقت الإيقاف/);
    const recent = JSON.parse(await page.evaluate(() => localStorage.getItem('recentAudio')));
    assert.deepEqual(recent.map((r) => r.surah).slice(0, 2), [67, 36]);
    await page.waitForFunction(() => /يس/.test(document.getElementById('journeyGrid').textContent));
    // A reciter whose every link fails offers a retry button.
    await page.selectOption('#reciterSelect', 'ghamdi');
    await page.waitForSelector('#playerRetry:not([hidden])', { timeout: 15000 });
    await close(s);
  });
});

describe('dashboard, settings and search', () => {
  test('dashboard shows only real data; companion shows verified verse and dhikr', async () => {
    const s = await open({ storage: { quranBookmark: '{"surahNum":18,"ayahIndex":9,"ayahNumInSurah":10}' } });
    const { page } = s;
    assert.equal(await page.locator('#journeyGrid .journey-card').count(), 6);
    assert.match(await text(page, '#journeyGrid'), /آية 10/);
    assert.match(await text(page, '#journeyGrid'), /0 من 10 آيات اليوم/);
    assert.match(await text(page, '#journeyGrid'), /لم تستمع إلى أي تلاوة بعد/);
    await page.waitForFunction(() => !/…/.test(document.querySelector('.companion-verse').textContent));
    const verse = (await text(page, '.companion-verse')).replace(/^﴿|﴾$/g, '');
    assert.ok(AYAHS.some((a) => a.text.endsWith(verse)), 'verse of the day is verbatim dataset text');
    await close(s);
  });

  test('settings: goals, notification minutes, translation and tafsir preferences, preferred reciter', async () => {
    const s = await open();
    const { page } = s;
    await page.click('[data-open="settingsModal"]');
    await page.fill('#setDailyGoal', '25');
    await page.press('#setDailyGoal', 'Tab');
    await page.selectOption('#setNotifyBefore', { value: '15' });
    await page.selectOption('#setTranslation', 'fr.hamidullah');
    await page.selectOption('#setReciter', 'muaiqly');
    const settings = JSON.parse(await page.evaluate(() => localStorage.getItem('userSettings')));
    assert.deepEqual(settings, { dailyGoal: 25, notifyBefore: 15, alwaysTafsir: false, arTranslation: 'fr.hamidullah' });
    assert.equal(await page.evaluate(() => localStorage.getItem('reciter')), 'muaiqly', 'original key reused');
    await page.keyboard.press('Escape');
    assert.match(await text(page, '#journeyGrid'), /من 25 آيات اليوم/);
    await page.click('#surahGrid [data-action="read"][data-surah="1"]');
    await page.waitForSelector('#ayah-1');
    await page.click('#ayah-1');
    await page.waitForFunction((t) => document.getElementById('translationText').textContent === t, EDITIONS['fr.hamidullah'][1]);
    assert.equal(await text(page, '#translationLabel'), 'Traduction Française:');
    // Tafsir in the English interface when enabled.
    await page.click('[data-open="settingsModal"]');
    await page.check('#setTafsir');
    await page.keyboard.press('Escape');
    await page.selectOption('#langSelect', 'en');
    await page.click('#ayah-2');
    await page.waitForFunction((t) => document.getElementById('tafsirText').textContent === t, EDITIONS['ar.muyassar'][2]);
    assert.ok(await page.isVisible('#tafsirWrapper'));
    await close(s);
  });

  test('Islamic search: ayah references, lessons and tafsir (on request)', async () => {
    const s = await open();
    const { page } = s;
    await page.click('.tool-card[data-open="islamicSearchModal"]');
    await page.fill('#islamicSearchInput', 'البقرة 255');
    await page.press('#islamicSearchInput', 'Enter');
    assert.match(await text(page, '#islamicSearchResults'), /📍/);
    await page.fill('#islamicSearchInput', 'سجود السهو');
    await page.press('#islamicSearchInput', 'Enter');
    assert.match(await text(page, '#islamicSearchResults'), /أحكام سجود السهو/);
    await page.fill('#islamicSearchInput', 'الخاشعين');
    await page.press('#islamicSearchInput', 'Enter');
    await page.getByText('ابحث أيضًا في التفسير الميسر').click();
    await page.waitForSelector('#islamicSearchResults .search-group h3');
    assert.match(await text(page, '#islamicSearchResults .search-group'), /التفسير الميسر/);
    await page.locator('#islamicSearchResults .search-group .search-result').first().click();
    await page.waitForSelector('#readingText .active-ayah');
    await close(s);
  });
});

// ===================================================================== preservation, accessibility, PWA
describe('preservation, accessibility and PWA', () => {
  test('using every new feature leaves the original storage keys untouched', async () => {
    const original = {
      theme: 'dark', favoriteSurahs: '[36,67]', quranBookmark: '{"surahNum":18,"ayahIndex":9,"ayahNumInSurah":10}',
      islamicProfile: '{"name":"Ali","goal":"x"}', dailyWird: '{"2026-01-01":{"quran":true}}', rosaryCount: '33',
      lang: 'ar', reciter: 'basit', playbackRate: '1.25', quranFontScale: '2', prayerNotify: 'false',
    };
    const s = await open({ storage: original, init: [FAKE_SPEECH] });
    const { page } = s;
    await page.click('#lessonGrid [data-id="pillars"]');
    await page.click('#lessonDone');
    await page.keyboard.press('Escape');
    await openLab(page, 112);
    await page.click('#micBtn');
    await speak(page, 'قل هو الله احد');
    await page.keyboard.press('Escape');
    await page.click('[data-open="settingsModal"]');
    await page.selectOption('#setNotifyBefore', { value: '20' });
    await page.keyboard.press('Escape');
    const now = await page.evaluate((keys) => Object.fromEntries(keys.map((k) => [k, localStorage.getItem(k)])), Object.keys(original));
    assert.deepEqual(now, original);
    await close(s);
  });

  for (const target of ['#learnSection', '#academySection', '#dashboardSection']) {
    test(`axe: ${target} has no WCAG 2.1 A/AA violations (light and dark)`, async () => {
      for (const colorScheme of ['light', 'dark']) {
        const s = await open({ bypassCSP: true, colorScheme });
        await s.page.waitForTimeout(300);
        assert.deepEqual(await axe(s.page, target), [], colorScheme);
        await s.context.close();
      }
    });
  }

  for (const [dialog, opener] of [['settingsModal', '[data-open="settingsModal"]'], ['lessonModal', '#lessonGrid [data-id="sahw"]'], ['courseModal', '#courseGrid [data-id="prayer"]']]) {
    test(`axe: dialog #${dialog}`, async () => {
      const s = await open({ bypassCSP: true });
      await s.page.locator(opener).first().click();
      assert.ok(await s.page.evaluate((d) => document.getElementById(d).contains(document.activeElement), dialog), 'focus inside');
      assert.deepEqual(await axe(s.page, `#${dialog}`), []);
      await s.context.close();
    });
  }

  test('axe: memorisation lab, both tabs', async () => {
    const s = await open({ bypassCSP: true, init: [FAKE_SPEECH] });
    await openLab(s.page, 1);
    assert.deepEqual(await axe(s.page, '#voiceTestModal'), []);
    await s.page.click('#labTabPlan');
    assert.deepEqual(await axe(s.page, '#voiceTestModal'), []);
    await s.context.close();
  });

  test('PWA: launch screen only in standalone mode; artwork and diagrams work offline', async () => {
    const s = await open();
    const { page, context } = s;
    assert.equal(await page.locator('.app-splash').evaluate((el) => getComputedStyle(el).display), 'none');
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();
    await page.waitForSelector('#lessonGrid .lesson-card');
    assert.ok(await page.locator('.hero-bg').evaluate((img) => img.complete && img.naturalWidth > 0), 'hero artwork offline');
    await page.locator('#postureTutorial img').scrollIntoViewIfNeeded(); // loading="lazy"
    await page.waitForFunction(() => { const img = document.querySelector('#postureTutorial img'); return img.complete && img.naturalWidth > 0; });
    const manifest = await page.evaluate(async () => (await fetch('manifest.json')).json());
    assert.equal(manifest.theme_color, '#0b3a2e');
    assert.ok(manifest.shortcuts.some((x) => x.url.endsWith('#learnSection')));
    await close(s);
  });
});
