// Memorisation progress, plans, revision schedule and mistake history, kept on this device under a NEW
// storage key ("memorizationData"); no existing key is read or changed.
//
// Revision schedule: a surah that has been fully recited (or that the user marks as already memorised)
// is due for revision after 1, 3, 7, 14, 30, then every 60 days; each successful revision moves it to
// the next interval, a revision with mistakes moves it back one step. This is a simple, transparent
// spaced-repetition rule, not a claim about how memory works for every person.

import { localDateKey } from './dom.js';
import { getJSON, setJSON } from './storage.js';

export const MEMO_KEY = 'memorizationData';
export const INTERVALS = [1, 3, 7, 14, 30, 60];
const MAX_MISTAKES = 100;
const MAX_SESSIONS = 60;

const empty = () => ({ v: 1, surahs: {}, plan: { dailyTarget: 5, surahs: [] }, days: {}, mistakes: [], sessions: [] });

/** Read the store, repairing anything malformed (corrupt storage never breaks the lab). */
export function loadMemo() {
  const raw = getJSON(MEMO_KEY, null);
  const base = empty();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const out = { ...base };
  out.surahs = raw.surahs && typeof raw.surahs === 'object' && !Array.isArray(raw.surahs) ? raw.surahs : {};
  const plan = raw.plan && typeof raw.plan === 'object' ? raw.plan : {};
  out.plan = {
    dailyTarget: Math.min(200, Math.max(1, Number(plan.dailyTarget) || base.plan.dailyTarget)),
    surahs: Array.isArray(plan.surahs) ? plan.surahs.map(Number).filter((n) => n >= 1 && n <= 114) : [],
  };
  out.days = raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days) ? raw.days : {};
  const isEntry = (x) => x && typeof x === 'object' && !Array.isArray(x);
  out.mistakes = Array.isArray(raw.mistakes) ? raw.mistakes.filter(isEntry).slice(-MAX_MISTAKES) : [];
  out.sessions = Array.isArray(raw.sessions) ? raw.sessions.filter(isEntry).slice(-MAX_SESSIONS) : [];
  return out;
}

export const saveMemo = (memo) => setJSON(MEMO_KEY, memo);

function surahEntry(memo, n) {
  const key = String(n);
  memo.surahs[key] ??= { ayahs: {}, memorized: false, completed: false, step: -1, nextReview: null, lastReview: null };
  const s = memo.surahs[key];
  if (!s.ayahs || typeof s.ayahs !== 'object') s.ayahs = {};
  return s;
}

const addDays = (dateKey, days) => {
  const [y, m, d] = dateKey.split('-').map(Number);
  return localDateKey(new Date(y, m - 1, d + days));
};

/** Record a correctly recited ayah. Returns the updated store. */
export function recordAyah(memo, surah, ayah, { score = 100, today = localDateKey() } = {}) {
  const s = surahEntry(memo, surah);
  const a = s.ayahs[String(ayah)] || { ok: 0, mistakes: 0, best: 0 };
  a.ok += 1;
  a.best = Math.max(a.best || 0, score);
  a.last = today;
  s.ayahs[String(ayah)] = a;
  // "Ayahs today" counts DISTINCT ayahs, so repetition mode and retries do not inflate the goal.
  const day = memo.days[today] || { ayahs: 0 };
  const keys = new Set(Array.isArray(day.keys) ? day.keys : []);
  const key = `${surah}:${ayah}`;
  if (!keys.has(key)) { keys.add(key); day.ayahs = keys.size; }
  day.keys = [...keys];
  memo.days[today] = day;
  return memo;
}

/** Record a mistake (missing / substituted words) for the history. */
export function recordMistake(memo, surah, ayah, { missing = [], substituted = [], today = localDateKey() } = {}) {
  const s = surahEntry(memo, surah);
  const a = s.ayahs[String(ayah)] || { ok: 0, mistakes: 0, best: 0 };
  a.mistakes += 1;
  s.ayahs[String(ayah)] = a;
  memo.mistakes.push({
    date: today, surah: Number(surah), ayah: Number(ayah),
    missing: missing.slice(0, 12), substituted: substituted.slice(0, 12),
  });
  memo.mistakes = memo.mistakes.slice(-MAX_MISTAKES);
  return memo;
}

/** A whole surah (or selected range) finished: schedule or advance its revision. */
export function recordCompletion(memo, surah, { clean = true, today = localDateKey(), mode = 'classic', score = null } = {}) {
  const s = surahEntry(memo, surah);
  const wasScheduled = s.completed || s.memorized;
  s.completed = true;
  if (!wasScheduled) s.step = 0;
  else s.step = clean ? Math.min(INTERVALS.length - 1, (s.step ?? -1) + 1) : Math.max(0, (s.step ?? 0) - 1);
  s.lastReview = today;
  s.nextReview = addDays(today, INTERVALS[Math.max(0, s.step)]);
  memo.sessions.push({ date: today, surah: Number(surah), mode, clean, score });
  memo.sessions = memo.sessions.slice(-MAX_SESSIONS);
  return memo;
}

/** Mark a surah as memorised before using the app (it enters the revision schedule). */
export function setMemorized(memo, surah, memorized, { today = localDateKey() } = {}) {
  const s = surahEntry(memo, surah);
  s.memorized = !!memorized;
  if (memorized && !s.nextReview) { s.step = 0; s.nextReview = addDays(today, INTERVALS[0]); }
  if (!memorized && !s.completed) { s.step = -1; s.nextReview = null; }
  return memo;
}

/** Surahs whose revision date has arrived, most overdue first. */
export function dueRevisions(memo, today = localDateKey()) {
  return Object.entries(memo.surahs)
    .filter(([, s]) => (s.completed || s.memorized) && s.nextReview && s.nextReview <= today)
    .map(([n, s]) => ({ surah: Number(n), due: s.nextReview }))
    .sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.surah - b.surah));
}

/** Upcoming revisions (not yet due), soonest first. */
export function upcomingRevisions(memo, today = localDateKey(), limit = 8) {
  return Object.entries(memo.surahs)
    .filter(([, s]) => (s.completed || s.memorized) && s.nextReview && s.nextReview > today)
    .map(([n, s]) => ({ surah: Number(n), due: s.nextReview }))
    .sort((a, b) => (a.due < b.due ? -1 : 1))
    .slice(0, limit);
}

/** Distinct ayahs ever recited correctly in a surah. */
export const ayahsMastered = (memo, surah) => Object.values(memo.surahs[String(surah)]?.ayahs || {}).filter((a) => a.ok > 0).length;

export const todayCount = (memo, today = localDateKey()) => memo.days[today]?.ayahs || 0;

/** Totals for dashboards: distinct ayahs recited, surahs completed or memorised. */
export function memoTotals(memo, ayahCountOf) {
  let ayahs = 0;
  let surahs = 0;
  let totalAyahs = 0;
  for (const [n, s] of Object.entries(memo.surahs)) {
    const mastered = Object.values(s.ayahs || {}).filter((a) => a.ok > 0).length;
    const count = ayahCountOf(Number(n)) || 0;
    // A surah marked as memorised counts all of its ayahs.
    ayahs += s.memorized ? Math.max(mastered, count) : mastered;
    if (s.completed || s.memorized) surahs += 1;
    totalAyahs += count;
  }
  return { ayahs, surahs, totalAyahs };
}

/** Consecutive days (ending today or yesterday) with at least one ayah recited. */
export function streak(memo, today = localDateKey()) {
  let count = 0;
  let day = memo.days[today]?.ayahs ? today : addDays(today, -1);
  while (memo.days[day]?.ayahs) { count += 1; day = addDays(day, -1); }
  return count;
}
