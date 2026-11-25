// Daily knowledge challenge («سؤال اليوم»): one question a day, taken ONLY from the quizzes that already exist
// in the prayer curriculum and the academy (assets/js/data/prayer-lessons.js and academy.js). No new religious
// content is written here; each question links back to the lesson it comes from, where its explanation and
// references are. Answers are kept on this device under a NEW key ("dailyChallenge"), last 120 days.

import { ACADEMY_LESSONS } from '../data/academy.js';
import { LESSONS } from '../data/prayer-lessons.js';
import { getJSON, setJSON, KEYS } from './storage.js';

const KEEP_DAYS = 120;

/** Every quiz question of the site, with the lesson it belongs to. Stable order: prayer lessons, then academy. */
export function questionPool() {
  const pool = [];
  for (const lesson of [...LESSONS, ...ACADEMY_LESSONS]) {
    if (!Array.isArray(lesson.quiz)) continue; // 'all' (the final review) repeats the other questions
    lesson.quiz.forEach((item, i) => {
      if (typeof item?.q === 'string' && Array.isArray(item.options) && Number.isInteger(item.answer)) {
        pool.push({ id: `${lesson.id}#${i}`, lessonId: lesson.id, lessonTitle: lesson.title, icon: lesson.icon, ...item });
      }
    });
  }
  return pool;
}

/** The question of a given day (day number since the epoch): the same for everyone on that day. */
export function questionOfDay(day, pool = questionPool()) {
  if (!pool.length) return null;
  // A fixed stride that is coprime with the pool size visits every question before repeating, without
  // showing questions of the same lesson on consecutive days.
  let stride = 7;
  while (gcd(stride, pool.length) !== 1) stride += 1;
  return pool[((day * stride) % pool.length + pool.length) % pool.length];
}
function gcd(a, b) { return b ? gcd(b, a % b) : a; }

export function loadChallenge() {
  const raw = getJSON(KEYS.challenge, null);
  const days = raw?.days && typeof raw.days === 'object' && !Array.isArray(raw.days) ? raw.days : {};
  const clean = {};
  for (const [date, v] of Object.entries(days)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && v && typeof v.q === 'string' && typeof v.ok === 'boolean') clean[date] = { q: v.q, ok: v.ok, choice: Number.isInteger(v.choice) ? v.choice : null };
  }
  return { days: clean };
}

/** Record today's answer (only the first answer of the day counts). */
export function answerChallenge(date, question, choice) {
  const data = loadChallenge();
  if (data.days[date]) return data.days[date];
  const entry = { q: question.id, ok: choice === question.answer, choice };
  data.days[date] = entry;
  for (const key of Object.keys(data.days).sort().slice(0, -KEEP_DAYS)) delete data.days[key];
  setJSON(KEYS.challenge, data);
  return entry;
}

/** Answered / correct counts over all kept days. */
export function challengeStats(data = loadChallenge()) {
  const all = Object.values(data.days);
  return { answered: all.length, correct: all.filter((d) => d.ok).length };
}
