// Quran Journey progress (key "quranJourney"): which paths were started, paused or finished, which steps
// are done, the visitor's daily/weekly goals, a short learning history and achievements.
//
// Steps can also be completed by existing data (a lesson finished in the academy, a surah recited in the
// lab…): the caller passes those as `autoDone` (a Set of "pathId:stepId"), so nothing is stored twice.
// Pure functions + small load/save helpers; unit-tested in tests/unit/platform.test.mjs.

import { KEYS, getJSON, setJSON } from './storage.js';

export const JOURNEY_KEY = KEYS.journey;
export const DAILY_CHOICES = [1, 2, 3, 5];
export const WEEKLY_CHOICES = [3, 5, 7, 10, 14];
export const HISTORY_LIMIT = 100;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

export function emptyJourney() {
  return { v: 1, active: null, paths: {}, goals: { daily: 1, weekly: 5 }, history: [] };
}

/** Load and sanitise stored progress (corrupt or foreign data never breaks the page). */
export function normalizeJourney(raw) {
  const data = emptyJourney();
  const src = obj(raw);
  for (const [id, p] of Object.entries(obj(src.paths))) {
    if (!/^[a-z0-9-]{1,30}$/.test(id)) continue;
    const steps = {};
    for (const [sid, date] of Object.entries(obj(p?.steps))) if (/^[a-z0-9-]{1,40}$/.test(sid) && DATE.test(date)) steps[sid] = date;
    data.paths[id] = {
      started: DATE.test(p?.started) ? p.started : null,
      paused: p?.paused === true,
      steps,
      last: typeof p?.last === 'string' ? p.last.slice(0, 40) : null,
      quiz: Object.fromEntries(Object.entries(obj(p?.quiz)).filter(([k, v]) => /^[a-z0-9-]{1,40}$/.test(k) && Number.isFinite(v?.score) && Number.isFinite(v?.total))
        .map(([k, v]) => [k, { score: v.score, total: v.total }])),
    };
  }
  data.active = typeof src.active === 'string' && data.paths[src.active] ? src.active : null;
  const goals = obj(src.goals);
  if (DAILY_CHOICES.includes(goals.daily)) data.goals.daily = goals.daily;
  if (WEEKLY_CHOICES.includes(goals.weekly)) data.goals.weekly = goals.weekly;
  data.history = (Array.isArray(src.history) ? src.history : [])
    .filter((h) => h && DATE.test(h.date) && typeof h.kind === 'string' && typeof h.path === 'string')
    .map((h) => ({ date: h.date, kind: h.kind.slice(0, 12), path: h.path.slice(0, 30), step: typeof h.step === 'string' ? h.step.slice(0, 40) : null }))
    .slice(-HISTORY_LIMIT);
  return data;
}

export const loadJourney = () => normalizeJourney(getJSON(JOURNEY_KEY, null));
export const saveJourney = (data) => setJSON(JOURNEY_KEY, data);

function log(data, kind, path, step, today) {
  data.history.push({ date: today, kind, path, step: step || null });
  if (data.history.length > HISTORY_LIMIT) data.history.splice(0, data.history.length - HISTORY_LIMIT);
}

function ensure(data, pathId, today) {
  if (!data.paths[pathId]) data.paths[pathId] = { started: today, paused: false, steps: {}, last: null, quiz: {} };
  return data.paths[pathId];
}

/** Start (or resume) a path and make it the active one. */
export function startPath(data, pathId, today) {
  const isNew = !data.paths[pathId];
  const p = ensure(data, pathId, today);
  if (isNew) log(data, 'start', pathId, null, today);
  else if (p.paused) log(data, 'resume', pathId, null, today);
  p.paused = false;
  data.active = pathId;
  return data;
}

export function pausePath(data, pathId, today) {
  const p = data.paths[pathId];
  if (!p || p.paused) return data;
  p.paused = true;
  log(data, 'pause', pathId, null, today);
  if (data.active === pathId) data.active = null;
  return data;
}

/** Forget a path's progress entirely (the visitor asked to start over). */
export function resetPath(data, pathId) {
  delete data.paths[pathId];
  if (data.active === pathId) data.active = null;
  data.history = data.history.filter((h) => h.path !== pathId);
  return data;
}

export function completeStep(data, pathId, stepId, today) {
  const p = ensure(data, pathId, today);
  if (!data.active) data.active = pathId;
  p.last = stepId;
  if (p.steps[stepId]) return data;
  p.steps[stepId] = today;
  log(data, 'step', pathId, stepId, today);
  return data;
}

export function uncompleteStep(data, pathId, stepId) {
  const p = data.paths[pathId];
  if (p?.steps[stepId]) {
    delete p.steps[stepId];
    data.history = data.history.filter((h) => !(h.kind === 'step' && h.path === pathId && h.step === stepId));
  }
  return data;
}

export function recordQuiz(data, pathId, stepId, score, total, today) {
  const p = ensure(data, pathId, today);
  p.quiz[stepId] = { score, total };
  return data;
}

export function setGoals(data, { daily, weekly } = {}) {
  if (DAILY_CHOICES.includes(daily)) data.goals.daily = daily;
  if (WEEKLY_CHOICES.includes(weekly)) data.goals.weekly = weekly;
  return data;
}

/** Is a step done (stored by the visitor, or detected from existing site data)? */
export const isStepDone = (data, pathId, stepId, autoDone = new Set()) =>
  !!data.paths[pathId]?.steps[stepId] || autoDone.has(`${pathId}:${stepId}`);

/** { done, total, pct, next (first step not done, or null), started, paused, finished } for one path. */
export function pathProgress(path, data, autoDone = new Set()) {
  const total = path.steps.length;
  const doneSteps = path.steps.filter((st) => isStepDone(data, path.id, st.id, autoDone));
  const next = path.steps.find((st) => !isStepDone(data, path.id, st.id, autoDone)) || null;
  const state = data.paths[path.id];
  return {
    done: doneSteps.length, total, pct: total ? Math.round((doneSteps.length / total) * 100) : 0,
    next, started: !!state, paused: !!state?.paused, finished: total > 0 && doneSteps.length === total,
  };
}

/** Overall progress over the paths the visitor started (or all paths when none was started). */
export function overallProgress(paths, data, autoDone = new Set()) {
  const started = paths.filter((p) => data.paths[p.id]);
  const list = started.length ? started : paths;
  let done = 0; let total = 0;
  for (const p of list) { const pr = pathProgress(p, data, autoDone); done += pr.done; total += pr.total; }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, startedPaths: started.length, finishedPaths: paths.filter((p) => pathProgress(p, data, autoDone).finished).length };
}

const stepEvents = (data) => data.history.filter((h) => h.kind === 'step');

/** Steps completed today / during the 7 days ending today (from the history). */
export const stepsOn = (data, day) => stepEvents(data).filter((h) => h.date === day).length;

export function stepsThisWeek(data, today) {
  const end = new Date(`${today}T12:00:00`);
  const start = new Date(end); start.setDate(start.getDate() - 6);
  const from = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  return stepEvents(data).filter((h) => h.date >= from && h.date <= today).length;
}

/** Consecutive days (ending today or yesterday) with at least one completed step. */
export function journeyStreak(data, today) {
  const days = new Set(stepEvents(data).map((h) => h.date));
  const d = new Date(`${today}T12:00:00`);
  const key = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  if (!days.has(key(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(key(d))) { n += 1; d.setDate(d.getDate() - 1); }
  return n;
}

/** Achievements, each { id, earned } (labels are interface strings `jr_ach_<id>`). */
export function achievements(paths, data, autoDone = new Set(), today) {
  const steps = stepEvents(data).length;
  const finished = paths.filter((p) => pathProgress(p, data, autoDone).finished).map((p) => p.id);
  const quizPerfect = Object.values(data.paths).some((p) => Object.values(p.quiz || {}).some((q) => q.total > 0 && q.score === q.total));
  return [
    { id: 'first_path', earned: Object.keys(data.paths).length > 0 },
    { id: 'first_step', earned: steps >= 1 },
    { id: 'ten_steps', earned: steps >= 10 },
    { id: 'quiz_perfect', earned: quizPerfect },
    { id: 'streak3', earned: journeyStreak(data, today) >= 3 },
    { id: 'week_goal', earned: stepsThisWeek(data, today) >= data.goals.weekly },
    { id: 'first_finish', earned: finished.length >= 1 },
    { id: 'all_paths', earned: paths.length > 0 && finished.length === paths.length },
  ];
}

/** The path to show on the home page: the active one, else the most recently touched unfinished one. */
export function currentPath(paths, data, autoDone = new Set()) {
  if (data.active) { const p = paths.find((x) => x.id === data.active); if (p) return p; }
  const touched = [...data.history].reverse().map((h) => h.path);
  for (const id of touched) {
    const p = paths.find((x) => x.id === id);
    if (p && !data.paths[id]?.paused && !pathProgress(p, data, autoDone).finished) return p;
  }
  return null;
}
