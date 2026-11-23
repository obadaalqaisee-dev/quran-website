// Unit tests for the platform evolution: recitation engine, speech/mic helpers, memorisation store,
// learning content integrity (Quran references against the verified dataset), Quran index, links,
// and storage-key compatibility.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { gunzipSync } from 'node:zlib';

import { stripBasmala } from '../../assets/js/core/arabic.js';
import { alignRecitation, compareWords, isPerfect, normalizeWord, recitationScore, tokenize } from '../../assets/js/core/recitation.js';
import { loadAyahs, loadJSON } from './data.mjs';

const REPO = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, REPO), 'utf8');
const ayahs = loadAyahs();
const ayah = (s, n) => {
  const a = ayahs.find((x) => x.surah === s && x.numberInSurah === n);
  return { ...a, text: stripBasmala(a.text, s, n), simple: stripBasmala(a.simple, s, n) };
};

// Minimal browser globals for modules that touch storage or the document.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k),
};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };

// ------------------------------------------------------------------ recitation engine
test('normalisation unifies alef, hamza, ya/alef maqsura and ta marbuta, and drops Quranic marks', () => {
  assert.equal(normalizeWord('أَحَدٌ'), normalizeWord('احد'));
  assert.equal(normalizeWord('إِلَٰهَ'), normalizeWord('اله'));
  assert.equal(normalizeWord('ٱلصَّلَوٰةَ'), normalizeWord('الصلوه'));
  assert.equal(normalizeWord('هُدًۭى'), normalizeWord('هدي'));
  assert.equal(normalizeWord('رَحْمَةً'), normalizeWord('رحمه'));
  assert.equal(normalizeWord('مُؤْمِن'), normalizeWord('مومن'));
  assert.equal(normalizeWord('﴿١﴾'), '');
  assert.equal(compareWords('ٱلصَّلَوٰةَ', 'الصلاة'), 'spelling');
  assert.equal(compareWords('ٱلْكِتَٰبُ', 'الكتاب'), 'spelling');
  assert.equal(compareWords('رَبِّ', 'الناس'), null);
});

test('every ayah, recited in standard spelling, is recognised as complete (6,236 ayahs)', () => {
  const incomplete = ayahs.filter((a) => !alignRecitation(stripBasmala(a.text, a.surah, a.numberInSurah), stripBasmala(a.simple, a.surah, a.numberInSurah)).complete);
  assert.deepEqual(incomplete.map((a) => `${a.surah}:${a.numberInSurah}`), []);
});

test('the canonical text is never modified: result words are the Uthmani words', () => {
  const a = ayah(2, 255);
  const r = alignRecitation(a.text, a.simple);
  assert.deepEqual(r.words.map((w) => w.text), tokenize(a.text));
  assert.equal(r.words.map((w) => w.text).join(' '), a.text.split(/\s+/).filter((w) => normalizeWord(w)).join(' '));
});

test('missing, substituted and repeated words, position and pending words', () => {
  const t = ayah(1, 2).text; // ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ
  const partial = alignRecitation(t, 'الحمد لله');
  assert.equal(partial.position, 2);
  assert.deepEqual(partial.words.map((w) => w.status), ['correct', 'correct', 'pending', 'pending']);
  assert.ok(partial.onTrack && !partial.complete);
  const missing = alignRecitation(t, 'الحمد لله العالمين');
  assert.deepEqual(missing.missing, [2]);
  const sub = alignRecitation(t, 'الحمد لله رب الناس');
  assert.deepEqual(sub.substitutions.map((s) => s.heard), ['الناس']);
  assert.ok(!sub.complete);
  const rep = alignRecitation(t, 'الحمد لله لله رب العالمين');
  assert.deepEqual(rep.repeated, ['لله']);
  assert.ok(rep.complete && isPerfect(rep));
  assert.equal(recitationScore(alignRecitation(t, 'الحمد لله رب العالمين')), 100);
  assert.ok(recitationScore(missing) < 100);
  const wrong = alignRecitation(ayah(112, 1).text, 'السلام عليكم ورحمة الله');
  assert.ok(!wrong.onTrack && !wrong.complete);
});

// ------------------------------------------------------------------ speech and microphone helpers
test('speech errors are classified; permission and missing microphone are fatal', async () => {
  const { classifySpeechError } = await import('../../assets/js/core/speech.js');
  assert.deepEqual(classifySpeechError('not-allowed'), { reason: 'denied', fatal: true });
  assert.deepEqual(classifySpeechError('audio-capture'), { reason: 'no-mic', fatal: true });
  assert.equal(classifySpeechError('network').fatal, false);
  assert.equal(classifySpeechError('no-speech').silent, true);
});

test('recogniser: transcript is consumed between ayahs without restarting; restarts are bounded', async () => {
  const { RecitationListener } = await import('../../assets/js/core/speech.js');
  const heard = [];
  const errors = [];
  class Fake {
    start() { this.started = (this.started || 0) + 1; this.onstart?.(); }
    stop() { this.onend?.(); }
    abort() { this.onend?.(); }
  }
  globalThis.SpeechRecognition = Fake;
  const l = new RecitationListener({ onTranscript: (t, f) => heard.push([t, f]), onError: (r, f) => errors.push([r, f]) });
  l.start();
  const results = (...items) => ({ results: items.map(([text, isFinal]) => Object.assign([{ transcript: text }], { isFinal })) });
  l.rec.onresult(results(['قل هو الله احد', true]));
  l.consume();
  l.rec.onresult(results(['قل هو الله احد', true], ['الله الصمد', false]));
  assert.deepEqual(heard.at(-1), ['الله الصمد', false]);
  l.consume(); // consumes the words of the interim result too
  l.rec.onresult(results(['قل هو الله احد', true], ['الله الصمد لم يلد', true]));
  assert.deepEqual(heard.at(-1), ['لم يلد', true]);
  assert.equal(l.rec.started, 1, 'no restart between ayahs');
  l.rec.onerror({ error: 'not-allowed' });
  assert.deepEqual(errors.at(-1), ['denied', true]);
  assert.equal(l.wanted, false);
  delete globalThis.SpeechRecognition;
});

test('microphone constraints only request processing the browser supports', async () => {
  const { buildAudioConstraints, classifyMediaError } = await import('../../assets/js/core/mic.js');
  assert.deepEqual(buildAudioConstraints('', { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: true }).audio,
    { echoCancellation: { ideal: true }, noiseSuppression: { ideal: true }, autoGainControl: { ideal: true }, channelCount: { ideal: 1 } });
  assert.deepEqual(buildAudioConstraints('', {}), { audio: true, video: false });
  assert.deepEqual(buildAudioConstraints('abc', { deviceId: true }).audio, { deviceId: { exact: 'abc' } });
  assert.equal(classifyMediaError({ name: 'NotAllowedError' }), 'denied');
  assert.equal(classifyMediaError({ name: 'NotFoundError' }), 'no-device');
  assert.equal(classifyMediaError({ name: 'NotReadableError' }), 'busy');
});

// ------------------------------------------------------------------ memorisation store
test('memorisation store: progress, mistakes, spaced revision, streak, corrupt data', async () => {
  const m = await import('../../assets/js/core/memorization-store.js');
  store.set('memorizationData', '{oops');
  const memo = m.loadMemo();
  assert.equal(memo.plan.dailyTarget, 5);
  m.recordAyah(memo, 112, 1, { today: '2026-11-20' });
  m.recordAyah(memo, 112, 2, { today: '2026-11-21' });
  m.recordMistake(memo, 112, 3, { missing: ['لم'], today: '2026-11-21' });
  assert.equal(m.ayahsMastered(memo, 112), 2);
  assert.equal(m.todayCount(memo, '2026-11-21'), 1);
  m.recordAyah(memo, 112, 2, { today: '2026-11-21' }); // the same ayah again (repetition mode)
  assert.equal(m.todayCount(memo, '2026-11-21'), 1, 'distinct ayahs per day');
  assert.equal(memo.surahs['112'].ayahs['2'].ok, 2, 'each correct recitation is still recorded');
  assert.equal(m.streak(memo, '2026-11-21'), 2);
  m.recordCompletion(memo, 112, { today: '2026-11-21' });
  assert.deepEqual(m.dueRevisions(memo, '2026-11-21'), []);
  assert.deepEqual(m.dueRevisions(memo, '2026-11-22'), [{ surah: 112, due: '2026-11-22' }]); // +1 day
  m.recordCompletion(memo, 112, { today: '2026-11-22', clean: true });
  assert.equal(memo.surahs['112'].nextReview, '2026-11-25'); // +3 days
  m.recordCompletion(memo, 112, { today: '2026-11-25', clean: false });
  assert.equal(memo.surahs['112'].nextReview, '2026-11-26'); // a revision with mistakes steps back
  m.setMemorized(memo, 1, true, { today: '2026-11-25' });
  assert.equal(m.memoTotals(memo, (n) => ({ 1: 7, 112: 4 })[n]).surahs, 2);
  assert.equal(memo.mistakes.length, 1);
});

// ------------------------------------------------------------------ learning content integrity
test('prayer curriculum: 18 modules, 4-language titles, valid quizzes, 10 illustrated steps', async () => {
  const { LESSONS, POSTURES, allQuestions } = await import('../../assets/js/data/prayer-lessons.js');
  assert.equal(LESSONS.length, 18);
  const titles = LESSONS.map((l) => l.title.ar);
  for (const required of ['شروط الصلاة', 'أركان الصلاة', 'واجبات الصلاة', 'سنن الصلاة', 'صفة الوضوء', 'صفة الصلاة خطوة بخطوة',
    'صلاة الفجر', 'صلاة الظهر', 'صلاة العصر', 'صلاة المغرب', 'صلاة العشاء', 'التشهد', 'التسليم', 'أخطاء شائعة في الصلاة',
    'أحكام سجود السهو', 'صلاة المسافر', 'صلاة الجماعة', 'أسئلة واختبارات لتقييم الفهم']) assert.ok(titles.includes(required), required);
  for (const l of LESSONS) {
    for (const lang of ['ar', 'en', 'es', 'fr']) assert.ok(l.title[lang] && l.summary[lang], `${l.id} ${lang}`);
  }
  for (const q of allQuestions()) {
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, q.q);
    assert.ok(q.explain.length > 5);
  }
  assert.deepEqual(POSTURES.map((p) => p.id), ['qiyam', 'takbir', 'qabd', 'ruku', 'itidal', 'sujud', 'jalsa', 'tashahhud', 'tawarruk', 'tasleem']);
  for (const p of POSTURES) {
    assert.ok(existsSync(new URL(p.img, REPO)), p.img);
    assert.ok(read(p.img).includes('<title>'), `${p.img} has an accessible title`);
    for (const lang of ['ar', 'en', 'es', 'fr']) assert.ok(p.title[lang]);
  }
});

test('every Quran citation in the lessons exists in the verified dataset and is the intended ayah', async () => {
  const { LESSONS } = await import('../../assets/js/data/prayer-lessons.js');
  const { ACADEMY_LESSONS } = await import('../../assets/js/data/academy.js');
  const { normalizeArabic } = await import('../../assets/js/core/arabic.js');
  const refs = [...LESSONS, ...ACADEMY_LESSONS].flatMap((l) => l.blocks.filter((b) => b.type === 'quran'));
  assert.ok(refs.length >= 20);
  for (const ref of refs) {
    const [s, a] = ref.ref.split(':').map(Number);
    const found = ayahs.find((x) => x.surah === s && x.numberInSurah === a);
    assert.ok(found, `${ref.ref} exists`);
    assert.ok(normalizeArabic(found.simple).includes(normalizeArabic(ref.expect)), `${ref.ref} contains «${ref.expect}»`);
  }
});

test('hadith are cited by collection, with a search link, and no invented reference numbers', async () => {
  const { LESSONS, dorarSearch } = await import('../../assets/js/data/prayer-lessons.js');
  const { ACADEMY_LESSONS } = await import('../../assets/js/data/academy.js');
  const hadith = [...LESSONS, ...ACADEMY_LESSONS].flatMap((l) => l.blocks.filter((b) => b.type === 'hadith'));
  assert.ok(hadith.length >= 15);
  for (const h of hadith) {
    assert.match(h.source, /البخاري|مسلم|متفق عليه|أبو داود|الترمذي|النسائي|ابن ماجه/, h.text);
    assert.doesNotMatch(h.source, /\d/, 'no hadith number asserted');
    assert.ok(h.search.length >= 8);
  }
  assert.equal(dorarSearch('صلوا كما'), 'https://dorar.net/hadith/search?q=%D8%B5%D9%84%D9%88%D8%A7%20%D9%83%D9%85%D8%A7');
});

test('scholar resources: https only, honest status, no fabricated deep links; backend copy in sync', async () => {
  const { SCHOLARS, VERIFY_TOOLS } = await import('../../assets/js/data/scholar-resources.js');
  const all = SCHOLARS.flatMap((s) => s.resources);
  for (const r of all) {
    assert.match(r.url, /^https:\/\//);
    assert.ok(['existing', 'official', 'search'].includes(r.status), r.id);
    assert.equal(r.checked, false, 'nothing claims a live check that did not happen');
    if (r.status === 'search') assert.match(r.url, /search_query=|\/search\?/);
    if (r.status === 'official') assert.match(r.url, /^https:\/\/[^/]+\/$/, 'official sites link to the home page only');
  }
  assert.deepEqual(all.filter((r) => r.status === 'existing').map((r) => r.url), ['https://www.youtube.com/watch?v=W-jX2kY0vR8']);
  const backend = loadJSON('learning_resources.json').resources;
  assert.deepEqual(backend.map((r) => [r.id, r.url, r.status]), [...all, ...VERIFY_TOOLS].map((r) => [r.id, r.url, r.status]));
});

test('academy courses reference existing lessons', async () => {
  const { COURSES, findLesson } = await import('../../assets/js/data/academy.js');
  assert.equal(COURSES.length, 5);
  for (const c of COURSES) for (const id of c.lessons) assert.ok(findLesson(id), `${c.id}: ${id}`);
});

// ------------------------------------------------------------------ Quran index
test('juz/page/sajda index equals the verified dataset', async () => {
  const { JUZ_STARTS, PAGE_STARTS, SAJDA } = await import('../../assets/js/data/quran-index.js');
  const mushaf = await import('../../assets/js/core/mushaf.js');
  const raw = loadAyahsWithIndex();
  assert.equal(JUZ_STARTS.length, 30);
  assert.equal(PAGE_STARTS.length, 604);
  assert.deepEqual(SAJDA, raw.filter((r) => r[8]).map((r) => [r[1], r[2]]));
  for (const r of raw.filter((_, i) => i % 37 === 0)) {
    assert.equal(mushaf.juzOf(r[1], r[2]), r[5], `juz of ${r[1]}:${r[2]}`);
    assert.equal(mushaf.pageOf(r[1], r[2]), r[6], `page of ${r[1]}:${r[2]}`);
  }
  assert.ok(mushaf.isSajda(96, 19));
});

function loadAyahsWithIndex() {
  return JSON.parse(gunzipSync(readFileSync(new URL('backend/app/data/ayahs.json.gz', REPO))).toString('utf8')).rows;
}

// ------------------------------------------------------------------ search helpers
test('ayah references are parsed in Arabic, English and numeric forms', async () => {
  const { parseAyahRef } = await import('../../assets/js/features/islamic-search.js');
  assert.deepEqual(parseAyahRef('2:255'), [2, 255]);
  assert.deepEqual(parseAyahRef('2 255'), [2, 255]);
  assert.deepEqual(parseAyahRef('البقرة 255'), [2, 255]);
  assert.deepEqual(parseAyahRef('سورة الكهف 10'), [18, 10]);
  assert.deepEqual(parseAyahRef('Al-Baqara 255'), [2, 255]);
  assert.equal(parseAyahRef('1:8'), null, 'Al-Fatihah has 7 ayahs');
  assert.equal(parseAyahRef('الرحمن'), null);
});

// ------------------------------------------------------------------ links and assets
test('every internal link, dialog opener, local asset and precached file exists', () => {
  const html = read('index.html');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, target] of html.matchAll(/href="#([^"]*)"/g)) assert.ok(target === '' || ids.has(target), `#${target}`);
  for (const [, target] of html.matchAll(/data-open="([^"]+)"/g)) assert.match(html, new RegExp(`<dialog[^>]*id="${target}"`), target);
  for (const [, attr] of html.matchAll(/\s(?:src|href)="([^"#:][^"]*)"/g)) {
    if (/^(https?:|mailto:|data:)/.test(attr) || attr === './') continue;
    assert.ok(existsSync(new URL(attr, REPO)), attr);
  }
  const manifest = JSON.parse(read('manifest.json'));
  for (const icon of manifest.icons) assert.ok(existsSync(new URL(icon.src, REPO)), icon.src);
  for (const s of manifest.shortcuts) assert.ok(ids.has(s.url.split('#')[1]), s.url);
  const sw = read('sw.js');
  const list = sw.slice(sw.indexOf('const SHELL_FILES = ['), sw.indexOf('];', sw.indexOf('const SHELL_FILES = [')));
  const files = [...list.matchAll(/'([^']+)'/g)].map((m) => m[1]).filter((f) => f !== './');
  assert.ok(files.length > 60);
  for (const f of files) assert.ok(existsSync(new URL(f, REPO)), `sw precache ${f}`);
  const css = read('assets/css/main.css');
  for (const [, u] of css.matchAll(/url\("([^"]+)"\)/g)) assert.ok(existsSync(new URL(u, new URL('assets/css/', REPO))), u);
});

test('JavaScript only uses translation keys that exist in all four languages', async () => {
  const { translations, LANGUAGES } = await import('../../assets/js/data/translations.js');
  const { readdirSync } = await import('node:fs');
  const walk = (d) => readdirSync(new URL(d, REPO), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
  const keys = new Set();
  for (const f of walk('assets/js').filter((x) => x.endsWith('.js'))) for (const m of read(f).matchAll(/\bt\('([a-z0-9_]+)'/g)) keys.add(m[1]);
  for (const lang of LANGUAGES) for (const k of keys) assert.ok(k in translations[lang], `${lang}: ${k}`);
});

// ------------------------------------------------------------------ storage compatibility
test('original storage keys are unchanged; new features only add new keys', async () => {
  const { KEYS, RESETTABLE } = await import('../../assets/js/core/storage.js');
  const original = {
    theme: 'theme', bookmark: 'quranBookmark', profile: 'islamicProfile', wird: 'dailyWird', favorites: 'favoriteSurahs',
    stats: 'islamicStats', lang: 'lang', rosary: 'rosaryCount', fontScale: 'quranFontScale', reciter: 'reciter',
    notify: 'prayerNotify', speed: 'playbackRate',
  };
  for (const [k, v] of Object.entries(original)) assert.equal(KEYS[k], v, k);
  assert.deepEqual(RESETTABLE, ['islamicProfile', 'dailyWird', 'favoriteSurahs', 'islamicStats']);
  const added = Object.values(KEYS).filter((v) => !Object.values(original).includes(v));
  assert.equal(new Set(Object.values(KEYS)).size, Object.values(KEYS).length, 'no key reused');
  assert.ok(added.length >= 8);
});

test('settings defaults keep the original behaviour (10-minute prayer warning, Sahih International)', async () => {
  store.delete('userSettings');
  const { getSettings, updateSettings } = await import('../../assets/js/core/settings.js');
  assert.deepEqual(getSettings(), { dailyGoal: 10, notifyBefore: 10, alwaysTafsir: false, arTranslation: 'en.sahih' });
  updateSettings({ notifyBefore: 7 }); // not an allowed choice → default
  assert.equal(getSettings().notifyBefore, 10);
  store.set('userSettings', '"corrupt"');
  assert.equal(getSettings().dailyGoal, 10);
});
