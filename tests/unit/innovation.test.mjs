// Unit tests for the innovation phase: insights engine, listening log, ayah notes, backup/restore and the
// daily knowledge challenge. Pure logic, run in Node with a minimal localStorage stand-in.
import assert from 'node:assert/strict';
import { test } from 'node:test';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k),
};
globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };

const insights = await import('../../assets/js/core/insights.js');
const { KEYS } = await import('../../assets/js/core/storage.js');

// ------------------------------------------------------------------------------------------ dates
test('date helpers are local-calendar based and reject impossible dates', () => {
  assert.equal(insights.addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(insights.addDays('2028-02-28', 1), '2028-02-29', 'leap year');
  assert.equal(insights.addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(insights.daysBetween('2026-03-28', '2026-03-30'), 2, 'DST change does not shift the count');
  assert.equal(insights.daysBetween('2026-01-10', '2026-01-01'), -9);
  assert.equal(insights.parseKey('2026-02-31'), null);
  assert.ok(Number.isNaN(insights.daysBetween('bad', '2026-01-01')));
});

// ---------------------------------------------------------------------------------- activity map
test('activity map: 84 days ending today, levels from real data, streaks', () => {
  const today = '2026-11-25';
  const readingDays = { '2026-11-25': [1, 2, 3], '2026-11-24': Array.from({ length: 20 }, (_, i) => i + 1), '2026-11-23': [5], '2026-11-20': [9] };
  const memoDays = { '2026-11-24': { ayahs: 15 } };
  const listeningDays = { '2026-11-22': 600 }; // 10 minutes
  const days = insights.activityDays({ readingDays, memoDays, listeningDays }, today, 12);
  assert.equal(days.length, 84);
  assert.equal(days.at(-1).date, today);
  assert.equal(days[0].date, '2026-09-03');
  const by = Object.fromEntries(days.map((d) => [d.date, d]));
  assert.deepEqual([by['2026-11-25'].read, by['2026-11-25'].level], [3, 1]);
  assert.equal(by['2026-11-24'].level, 4, '20 read + 2×15 recited = 50');
  assert.deepEqual([by['2026-11-22'].listen, by['2026-11-22'].level], [10, 1]);
  assert.equal(by['2026-11-21'].level, 0);
  const s = insights.streaks(days);
  assert.deepEqual(s, { current: 4, longest: 4, activeDays: 5 });
  // Today not started yet: yesterday's streak is still current.
  const yesterday = insights.activityDays({ readingDays: { '2026-11-24': [1] } }, today, 1);
  assert.equal(insights.streaks(yesterday).current, 1);
  assert.equal(insights.streaks(insights.activityDays({}, today, 2)).current, 0);
});

// --------------------------------------------------------------------------------- khatma planner
test('khatma planner: ayahs and pages per day, on-track check, edge cases', () => {
  const p = insights.khatmaPlan({ read: 236, target: '2026-12-24', today: '2026-11-25', recentAverage: 150 });
  assert.equal(p.remaining, 6000);
  assert.equal(p.daysLeft, 30);
  assert.equal(p.perDay, 200);
  assert.equal(p.pagesPerDay, 19.4); // 200 / 6236 × 604
  assert.equal(p.onTrack, false);
  assert.equal(p.projectedDays, 40);
  assert.equal(insights.khatmaPlan({ read: 0, target: '2026-11-25', today: '2026-11-25' }).perDay, 6236, 'target today = 1 day');
  assert.equal(insights.khatmaPlan({ read: 0, target: '2026-11-24', today: '2026-11-25' }).valid, false);
  assert.equal(insights.khatmaPlan({ read: 6236, target: '2026-11-24', today: '2026-11-25' }).done, true);
  assert.equal(insights.khatmaPlan({ read: 0, target: 'nonsense', today: '2026-11-25' }).valid, false);
  assert.equal(insights.recentAverage({ '2026-11-25': [1, 2], '2026-11-19': [1, 2, 3, 4, 5], '2026-11-18': [1] }, '2026-11-25'), 1);
});

// ------------------------------------------------------------------------- memorisation analytics
const memo = {
  surahs: {
    1: { completed: true, nextReview: '2026-11-20', ayahs: { 1: { ok: 5, mistakes: 0 }, 2: { ok: 1, mistakes: 3 } } },
    112: { memorized: true, nextReview: '2026-11-25', ayahs: { 1: { ok: 2, mistakes: 2 } } },
    114: { completed: true, nextReview: '2026-11-24', ayahs: { 1: { ok: 9, mistakes: 0 } } },
    113: { completed: true, nextReview: '2026-12-01', ayahs: {} },
    2: { completed: false, ayahs: { 255: { ok: 0, mistakes: 1 } } },
  },
  mistakes: [
    { surah: 1, ayah: 2, missing: ['ٱلْحَمْدُ', 'رَبِّ'], substituted: ['حمد'] },
    { surah: 1, ayah: 2, missing: ['ٱلۡحَمۡدُ'] },
    { surah: 112, ayah: 1, missing: ['أَحَدٌ'] },
    { surah: 1, ayah: 2, missing: ['', 42, null] },
  ],
  sessions: [{ score: 60 }, { score: 70 }, { score: 90 }, { score: 100 }, { score: 'x' }],
};

test('weak ayahs: ranked by share of attempts with mistakes', () => {
  const weak = insights.weakAyahs(memo, 3);
  assert.deepEqual(weak.map((w) => `${w.surah}:${w.ayah}`), ['2:255', '1:2', '112:1']);
  assert.equal(weak[1].rate, 0.75);
  assert.deepEqual(insights.weakAyahs({}), []);
});

test('frequently missed words: grouped by normalised spelling, substitutions excluded, junk ignored', () => {
  const words = insights.frequentMissedWords(memo.mistakes);
  assert.equal(words[0].count, 2, 'two spellings of الحمد are one word');
  assert.deepEqual(words[0].places, ['1:2']);
  assert.ok(!words.some((w) => w.word === 'حمد'), 'what the recogniser heard is not shown as Quran text');
  assert.equal(words.length, 3);
  assert.deepEqual(insights.frequentMissedWords(undefined), []);
});

test('revision priority: only due surahs; weak and overdue first; reasons given', () => {
  const list = insights.revisionPriority(memo, '2026-11-25');
  assert.deepEqual(list.map((r) => r.surah), [1, 112, 114]);
  assert.deepEqual(list.map((r) => r.reason), ['weak', 'weak', 'due']);
  assert.equal(list[0].overdue, 5);
  assert.equal(list[1].rate, 50);
  assert.ok(!list.some((r) => r.surah === 113), 'not due yet');
  assert.ok(!list.some((r) => r.surah === 2), 'never scheduled');
});

test('accuracy trend: average and change between halves', () => {
  assert.deepEqual(insights.accuracyTrend(memo.sessions), { count: 4, average: 80, change: 30, scores: [60, 70, 90, 100] });
  assert.equal(insights.accuracyTrend([{ score: 50 }]).change, null);
  assert.equal(insights.accuracyTrend().average, null);
});

test('recommendations: revisions first, time-of-day adhkar, a calm default', () => {
  const base = { dueRevisions: 0, weakAyah: false, readToday: 10, dailyGoal: 10, memoToday: 0, memoGoal: 0, morningDone: true, eveningDone: true, hour: 13, challengeDone: true, lessonsLeft: 0 };
  assert.deepEqual(insights.recommendations(base).map((r) => r.id), ['well-done']);
  const busy = insights.recommendations({ ...base, dueRevisions: 2, weakAyah: true, readToday: 3, hour: 7, morningDone: false, challengeDone: false, lessonsLeft: 4, nextLessonId: 'x' });
  assert.deepEqual(busy.map((r) => r.id), ['revise', 'weak', 'morning', 'read']);
  assert.equal(busy[3].vars.n, 7);
  const evening = insights.recommendations({ ...base, hour: 18, eveningDone: false });
  assert.deepEqual(evening.map((r) => r.id), ['evening']);
  assert.ok(insights.recommendations({ ...base, memoGoal: 5 }).some((r) => r.id === 'memo'));
});

test('listening summary', () => {
  const s = insights.listeningSummary({ days: { '2026-11-25': 300, '2026-11-20': 600, '2026-10-01': 6000 }, reciters: { afs: 100, basit: 900 } }, '2026-11-25');
  assert.deepEqual(s, { todayMinutes: 5, weekMinutes: 15, totalMinutes: 115, topReciter: 'basit' });
  assert.equal(insights.listeningSummary(null, '2026-11-25').topReciter, null);
});

// ------------------------------------------------------------------------------------ listening log
test('listening log: accumulates, validates, prunes to 90 days', async () => {
  store.clear();
  const { addListening, loadListening } = await import('../../assets/js/core/listening-log.js');
  assert.equal(addListening(0, 'afs'), false);
  assert.equal(addListening(-5, 'afs'), false);
  assert.equal(addListening(99999, 'afs'), false, 'implausible values are rejected');
  addListening(30, 'afs', '2026-11-25');
  addListening(12.4, 'afs', '2026-11-25');
  addListening(10, '<script>', '2026-11-25');
  assert.deepEqual(loadListening(), { days: { '2026-11-25': 52 }, reciters: { afs: 42 } });
  for (let i = 0; i < 95; i += 1) addListening(1, 'ayah', insights.addDays('2026-01-01', i));
  assert.equal(Object.keys(loadListening().days).length, 90);
  store.set(KEYS.listening, '{"days":[1,2],"reciters":"x"}');
  assert.deepEqual(loadListening(), { days: {}, reciters: {} }, 'corrupt data is ignored');
});

// ------------------------------------------------------------------------------------------- notes
test('ayah notes: add, update, collections, limits, corrupt data', async () => {
  store.clear();
  const notes = await import('../../assets/js/core/notes.js');
  assert.equal(notes.NOTES_KEY, 'ayahNotes');
  assert.equal(notes.saveNote(0, 1), false);
  assert.equal(notes.saveNote(1, 300), false);
  assert.ok(notes.saveNote(2, 255, { collection: 'memorize', note: 'آية الكرسي' }, '2026-11-25'));
  assert.ok(notes.saveNote(1, 1, { collection: 'nope', note: 'x'.repeat(5000) }, '2026-11-25'));
  assert.equal(notes.noteFor(1, 1).collection, 'reflect', 'unknown collection falls back');
  assert.equal(notes.noteFor(1, 1).note.length, notes.MAX_NOTE);
  assert.ok(notes.saveNote(2, 255, { collection: 'review', note: 'updated' }));
  assert.equal(notes.loadNotes().items.length, 2, 'an ayah appears once');
  const id = notes.addCollection('  أدعية   الصباح  ');
  assert.equal(id, 'c:أدعية الصباح');
  assert.ok(notes.saveNote(3, 8, { collection: id }));
  assert.equal(notes.noteFor(3, 8).collection, id);
  assert.equal(notes.addCollection('   '), null);
  assert.deepEqual(notes.listNotes().map((i) => `${i.surah}:${i.ayah}`), ['1:1', '2:255', '3:8'], 'Mushaf order');
  assert.deepEqual(notes.listNotes({ collection: 'review' }).map((i) => i.ayah), [255]);
  assert.deepEqual(notes.listNotes({ query: 'UPDATED' }).map((i) => i.ayah), [255]);
  assert.deepEqual(notes.collectionCounts(), { reflect: 1, review: 1, [id]: 1 });
  notes.removeNote(2, 255);
  assert.equal(notes.noteFor(2, 255), null);
  store.set('ayahNotes', '{"items":[{"surah":"5","ayah":3,"collection":"c:gone","note":7},{"surah":999,"ayah":1},{"surah":5,"ayah":3}],"custom":[1,"x"]}');
  const loaded = notes.loadNotes();
  assert.equal(loaded.items.length, 1, 'invalid and duplicate items dropped');
  assert.deepEqual([loaded.items[0].collection, loaded.items[0].note], ['reflect', '']);
  assert.deepEqual(loaded.custom, ['x']);
  store.set('ayahNotes', 'not json');
  assert.deepEqual(notes.loadNotes().items, []);
});

// ------------------------------------------------------------------------------------------ backup
test('backup: exports every site key verbatim and nothing else', async () => {
  store.clear();
  const { BACKUP_KEYS, buildBackup } = await import('../../assets/js/core/backup.js');
  for (const k of ['theme', 'quranBookmark', 'islamicProfile', 'dailyWird', 'favoriteSurahs', 'memorizationData', 'ayahNotes', 'listeningLog']) assert.ok(BACKUP_KEYS.includes(k), k);
  store.set('quranBookmark', '{"surahNum":2,"ayahIndex":4,"ayahNumInSurah":5}');
  store.set('theme', 'dark');
  store.set('unrelated-key', 'secret');
  const b = buildBackup(localStorage, new Date('2026-11-25T10:00:00Z'));
  assert.deepEqual(b, { app: 'quran-website', version: 1, exportedAt: '2026-11-25T10:00:00.000Z', data: { theme: 'dark', quranBookmark: '{"surahNum":2,"ayahIndex":4,"ayahNumInSurah":5}' } });
});

test('backup: restore validates the file and only writes known keys', async () => {
  store.clear();
  const { applyBackup, parseBackup, backupFileName } = await import('../../assets/js/core/backup.js');
  assert.equal(parseBackup('{').error, 'json');
  assert.equal(parseBackup('[]').error, 'format');
  assert.equal(parseBackup(JSON.stringify({ app: 'other', version: 1, data: {} })).error, 'app');
  assert.equal(parseBackup(JSON.stringify({ app: 'quran-website', version: 9, data: { theme: 'dark' } })).error, 'version');
  assert.equal(parseBackup(JSON.stringify({ app: 'quran-website', version: 1, data: { evil: 'x' } })).error, 'empty');
  assert.equal(parseBackup('x'.repeat(6 * 1024 * 1024)).error, 'size');
  const ok = parseBackup(JSON.stringify({ app: 'quran-website', version: 1, data: {
    theme: 'light', favoriteSurahs: '[1,18]', dailyWird: '{broken', evil: 'x', ayahNotes: 5, rosaryCount: '33',
  } }));
  assert.ok(ok.ok);
  assert.deepEqual(ok.entries, [['theme', 'light'], ['favoriteSurahs', '[1,18]'], ['rosaryCount', '33']]);
  assert.deepEqual(ok.skipped.sort(), ['ayahNotes', 'dailyWird', 'evil']);
  store.set('islamicProfile', '{"name":"kept"}');
  assert.equal(applyBackup(localStorage, ok.entries), 3);
  assert.equal(store.get('favoriteSurahs'), '[1,18]');
  assert.equal(store.get('islamicProfile'), '{"name":"kept"}', 'keys absent from the file are kept');
  assert.ok(!store.has('evil'));
  assert.equal(backupFileName(new Date('2026-11-25T10:00:00Z')), 'quran-website-backup-2026-11-25.json');
});

// --------------------------------------------------------------------------------- daily challenge
test('daily challenge: every question comes from an existing lesson quiz; one answer per day', async () => {
  store.clear();
  const { questionPool, questionOfDay, answerChallenge, loadChallenge, challengeStats } = await import('../../assets/js/core/challenge.js');
  const { LESSONS } = await import('../../assets/js/data/prayer-lessons.js');
  const { ACADEMY_LESSONS } = await import('../../assets/js/data/academy.js');
  const pool = questionPool();
  const expected = [...LESSONS, ...ACADEMY_LESSONS].filter((l) => Array.isArray(l.quiz)).reduce((n, l) => n + l.quiz.length, 0);
  assert.equal(pool.length, expected);
  assert.ok(pool.length >= 20);
  for (const q of pool) {
    const lesson = [...LESSONS, ...ACADEMY_LESSONS].find((l) => l.id === q.lessonId);
    assert.ok(lesson.quiz.some((x) => x.q === q.q && x.answer === q.answer), q.id);
    assert.ok(q.answer >= 0 && q.answer < q.options.length, q.id);
  }
  // Every question is visited before any repeats.
  const seen = new Set(Array.from({ length: pool.length }, (_, d) => questionOfDay(20000 + d, pool).id));
  assert.equal(seen.size, pool.length);
  assert.equal(questionOfDay(1, []), null);
  const q = questionOfDay(20417, pool);
  const first = answerChallenge('2026-11-25', q, q.answer);
  assert.equal(first.ok, true);
  const second = answerChallenge('2026-11-25', q, (q.answer + 1) % q.options.length);
  assert.equal(second.ok, true, 'only the first answer of the day counts');
  answerChallenge('2026-11-26', q, (q.answer + 1) % q.options.length);
  assert.deepEqual(challengeStats(), { answered: 2, correct: 1 });
  store.set('dailyChallenge', '{"days":{"bad":{"q":"x","ok":true},"2026-01-01":{"q":"x","ok":"yes"}}}');
  assert.deepEqual(loadChallenge().days, {});
});

// ------------------------------------------------------------------------------------- nasheed media
test('nasheed «أبداً لا لن نحيد»: the shipped file is the documented recording (provenance checksum)', async () => {
  const { createHash } = await import('node:crypto');
  const { existsSync, readFileSync } = await import('node:fs');
  const { ABOUT_MEDIA, isConfigured } = await import('../../assets/js/data/about-media.js');
  const n = ABOUT_MEDIA.nasheed;
  assert.equal(n.src, 'assets/audio/abadan-la-lan-nahid.mp3');
  assert.equal(n.firstLine, 'أبداً لا لن نحيد');
  assert.ok(isConfigured(n));
  const file = readFileSync(new URL(`../../${n.src}`, import.meta.url));
  assert.equal(createHash('md5').update(file).digest('hex'), n.md5, 'byte-identical to the Internet Archive copy');
  assert.equal(file.subarray(0, 3).toString('latin1'), 'ID3', 'a real MP3, not a placeholder');
  assert.ok(file.length > 4_000_000);
  assert.ok(!existsSync(new URL('../../assets/audio/ya-dhakir-al-ashab.mp3', import.meta.url)), 'the replaced recording is not shipped');
});
