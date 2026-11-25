// «بصيرة» — progress insights computed only from data the visitor created on this device (reading log,
// memorisation store, listening log, learning progress). Pure functions, no DOM and no storage access, so
// every figure can be unit-tested. Nothing is estimated from other people's data, and nothing is sent anywhere.
//
// The rules are deliberately simple and explainable: each recommendation and each priority comes with the
// reason that produced it, so the visitor can see why the site suggests something.

import { normalizeArabic } from './arabic.js';

export const TOTAL_AYAHS = 6236;
export const MUSHAF_PAGES = 604;

// ------------------------------------------------------------------------------------------- dates
const pad2 = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export function parseKey(key) {
  if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return dateKey(date) === key ? date : null; // rejects 2026-02-31 and similar
}
export const addDays = (key, days) => {
  const d = parseKey(key);
  return d ? dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)) : null;
};
/** Whole days from `from` to `to` (both YYYY-MM-DD, local), negative when `to` is earlier. */
export function daysBetween(from, to) {
  const a = parseKey(from);
  const b = parseKey(to);
  if (!a || !b) return NaN;
  return Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / 86400000);
}

// ------------------------------------------------------------------------------------ activity map
const count = (v) => (Array.isArray(v) ? v.length : Number.isFinite(v) ? v : 0);

/**
 * One entry per day for the last `weeks` weeks (oldest first, ending today):
 * { date, read: ayahs read, memo: ayahs recited, listen: minutes listened, level: 0..4 }.
 */
export function activityDays({ readingDays = {}, memoDays = {}, listeningDays = {} } = {}, today, weeks = 12) {
  const total = weeks * 7;
  const out = [];
  for (let i = total - 1; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    const read = count(readingDays[date]);
    const memo = Number(memoDays[date]?.ayahs) || 0;
    const listen = Math.round((Number(listeningDays[date]) || 0) / 60);
    // Level: a transparent score — ayahs read + 2 × ayahs recited from memory + minutes listened / 5.
    const score = read + memo * 2 + listen / 5;
    const level = score <= 0 ? 0 : score < 5 ? 1 : score < 15 ? 2 : score < 40 ? 3 : 4;
    out.push({ date, read, memo, listen, level });
  }
  return out;
}

/** Current streak (ending today, or yesterday if today has no activity yet) and longest streak. */
export function streaks(days) {
  const active = days.map((d) => d.level > 0);
  let longest = 0;
  let run = 0;
  for (const a of active) { run = a ? run + 1 : 0; longest = Math.max(longest, run); }
  let current = 0;
  let i = active.length - 1;
  if (i >= 0 && !active[i]) i -= 1; // today not started yet: the streak is still alive
  while (i >= 0 && active[i]) { current += 1; i -= 1; }
  return { current, longest, activeDays: active.filter(Boolean).length };
}

// --------------------------------------------------------------------------------- khatma planner
/**
 * Plan a khatma (completing the Quran) by a target date.
 * `readIds` is the number of distinct ayahs already read; `recentAverage` the ayahs/day over the last 7 days.
 */
export function khatmaPlan({ read = 0, target, today, recentAverage = 0 }) {
  const remaining = Math.max(0, TOTAL_AYAHS - read);
  const daysLeft = daysBetween(today, target) + 1; // the target day itself counts
  if (!Number.isFinite(daysLeft)) return { valid: false, reason: 'invalid' };
  if (remaining === 0) return { valid: true, done: true, remaining, daysLeft, perDay: 0, pagesPerDay: 0, onTrack: true };
  if (daysLeft < 1) return { valid: false, reason: 'past', remaining };
  const perDay = Math.ceil(remaining / daysLeft);
  const pagesPerDay = Math.round((perDay / TOTAL_AYAHS) * MUSHAF_PAGES * 10) / 10;
  return {
    valid: true, done: false, remaining, daysLeft, perDay, pagesPerDay,
    juzPerDay: Math.round((perDay / TOTAL_AYAHS) * 30 * 100) / 100,
    onTrack: recentAverage >= perDay,
    projectedDays: recentAverage > 0 ? Math.ceil(remaining / recentAverage) : null,
  };
}

/** Average ayahs read per day over the last `n` days (today included). */
export function recentAverage(readingDays = {}, today, n = 7) {
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += count(readingDays[addDays(today, -i)]);
  return Math.round((sum / n) * 10) / 10;
}

// ---------------------------------------------------------------------------- memorisation analytics
/** Ayahs with the highest share of attempts that had mistakes (at least one mistake). */
export function weakAyahs(memo, limit = 6) {
  const out = [];
  for (const [surah, s] of Object.entries(memo?.surahs || {})) {
    for (const [ayah, a] of Object.entries(s?.ayahs || {})) {
      const mistakes = Number(a?.mistakes) || 0;
      const ok = Number(a?.ok) || 0;
      if (mistakes < 1) continue;
      out.push({ surah: Number(surah), ayah: Number(ayah), mistakes, ok, rate: mistakes / (mistakes + ok) });
    }
  }
  return out
    .sort((x, y) => y.rate - x.rate || y.mistakes - x.mistakes || x.surah - y.surah || x.ayah - y.ayah)
    .slice(0, limit);
}

/**
 * Words most often missed while reciting from memory (from the mistake history). Words are grouped by their
 * normalised spelling; the Uthmani form seen most often is displayed. Substitutions are what the recogniser
 * heard, not Quran text, so they are not shown as "words of the Quran".
 */
export function frequentMissedWords(mistakes = [], limit = 8) {
  const groups = new Map();
  for (const m of Array.isArray(mistakes) ? mistakes : []) {
    for (const word of Array.isArray(m?.missing) ? m.missing : []) {
      if (typeof word !== 'string' || !word.trim()) continue;
      const key = normalizeArabic(word);
      if (!key) continue;
      const g = groups.get(key) || { key, count: 0, forms: new Map(), places: new Set() };
      g.count += 1;
      g.forms.set(word, (g.forms.get(word) || 0) + 1);
      if (m.surah && m.ayah) g.places.add(`${m.surah}:${m.ayah}`);
      groups.set(key, g);
    }
  }
  return [...groups.values()]
    .map((g) => ({
      word: [...g.forms.entries()].sort((a, b) => b[1] - a[1])[0][0],
      count: g.count,
      places: [...g.places].slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, limit);
}

/** Mistake rate of a surah (share of ayah attempts with mistakes), 0 when never attempted. */
export function surahMistakeRate(memo, surah) {
  let mistakes = 0;
  let ok = 0;
  for (const a of Object.values(memo?.surahs?.[String(surah)]?.ayahs || {})) {
    mistakes += Number(a?.mistakes) || 0;
    ok += Number(a?.ok) || 0;
  }
  return mistakes + ok ? mistakes / (mistakes + ok) : 0;
}

/**
 * Revisions ordered by need. The revision dates themselves are unchanged (core/memorization-store.js); this only
 * decides which due surah to revise FIRST: priority = days overdue + 10 × mistake rate (a surah often recited
 * with mistakes goes before an equally overdue clean one). Each item carries the reason shown to the user.
 */
export function revisionPriority(memo, today) {
  return Object.entries(memo?.surahs || {})
    .filter(([, s]) => (s?.completed || s?.memorized) && s?.nextReview && s.nextReview <= today)
    .map(([n, s]) => {
      const overdue = Math.max(0, daysBetween(s.nextReview, today));
      const rate = surahMistakeRate(memo, n);
      const reason = rate >= 0.25 ? 'weak' : overdue >= 3 ? 'overdue' : 'due';
      return { surah: Number(n), due: s.nextReview, overdue, rate: Math.round(rate * 100), priority: overdue + rate * 10, reason };
    })
    .sort((a, b) => b.priority - a.priority || a.surah - b.surah);
}

/** Accuracy of recent recitation sessions: average, and the change between the older and newer half. */
export function accuracyTrend(sessions = [], n = 10) {
  const scores = (Array.isArray(sessions) ? sessions : [])
    .map((s) => Number(s?.score))
    .filter((x) => Number.isFinite(x) && x >= 0 && x <= 100)
    .slice(-n);
  if (!scores.length) return { count: 0, average: null, change: null, scores };
  const avg = (xs) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
  const half = Math.floor(scores.length / 2);
  const change = scores.length >= 4 ? avg(scores.slice(half)) - avg(scores.slice(0, half)) : null;
  return { count: scores.length, average: avg(scores), change, scores };
}

// -------------------------------------------------------------------------------- listening summary
export function listeningSummary(log, today, days = 7) {
  const dayMap = log?.days || {};
  let week = 0;
  for (let i = 0; i < days; i += 1) week += Number(dayMap[addDays(today, -i)]) || 0;
  const reciters = Object.entries(log?.reciters || {})
    .filter(([, s]) => Number(s) > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = Object.values(dayMap).reduce((a, b) => a + (Number(b) || 0), 0);
  return {
    todayMinutes: Math.round((Number(dayMap[today]) || 0) / 60),
    weekMinutes: Math.round(week / 60),
    totalMinutes: Math.round(total / 60),
    topReciter: reciters[0]?.[0] ?? null,
  };
}

// ---------------------------------------------------------------------------------- recommendations
/**
 * "What to do next": up to `limit` suggestions, most useful first, each with the reason that produced it.
 * Input is a plain summary so the rules can be tested without a browser:
 * { dueRevisions, weakAyah, readToday, dailyGoal, memoToday, memoGoal, hasBookmark, lessonsLeft,
 *   nextLessonId, morningDone, eveningDone, hour, challengeDone }
 */
export function recommendations(ctx, limit = 4) {
  const out = [];
  const hour = Number.isFinite(ctx.hour) ? ctx.hour : 12;
  if (ctx.dueRevisions > 0) out.push({ id: 'revise', icon: '🔄', priority: 100 + ctx.dueRevisions });
  if (ctx.weakAyah) out.push({ id: 'weak', icon: '🎯', priority: 80 });
  if (ctx.readToday < ctx.dailyGoal) out.push({ id: 'read', icon: '📖', priority: 70, vars: { n: ctx.dailyGoal - ctx.readToday } });
  if (hour >= 4 && hour < 12 && !ctx.morningDone) out.push({ id: 'morning', icon: '☀️', priority: 75 });
  if (hour >= 15 && hour < 22 && !ctx.eveningDone) out.push({ id: 'evening', icon: '🌙', priority: 75 });
  if (ctx.memoGoal > 0 && ctx.memoToday < ctx.memoGoal && !ctx.dueRevisions) out.push({ id: 'memo', icon: '🧠', priority: 60, vars: { n: ctx.memoGoal - ctx.memoToday } });
  if (!ctx.challengeDone) out.push({ id: 'challenge', icon: '💡', priority: 40 });
  if (ctx.lessonsLeft > 0 && ctx.nextLessonId) out.push({ id: 'lesson', icon: '🎓', priority: 30 });
  if (!out.length) out.push({ id: 'well-done', icon: '🌿', priority: 0 });
  return out.sort((a, b) => b.priority - a.priority).slice(0, limit);
}
