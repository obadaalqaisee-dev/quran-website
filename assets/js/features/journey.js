// «رحلتي مع القرآن» — Quran Journey page, its home-page card and the gentle daily reminders.
//
// Paths (data/journey-paths.js) lead the visitor through the site's existing tools. Progress is stored on this
// device (core/journey.js); steps tied to existing activity (a finished lesson, a recited surah, a note, reading
// or listening) are detected from that activity's own data, so nothing is duplicated.
// Everything is rendered with h() (textContent); no remote text is involved.

import { h, localDateKey } from '../core/dom.js';
import { getLang, onLanguageChange, t } from '../core/i18n.js';
import {
  DAILY_CHOICES, WEEKLY_CHOICES, achievements, completeStep, currentPath, isStepDone, journeyStreak, loadJourney,
  overallProgress, pathProgress, pausePath, recordQuiz, resetPath, saveJourney, setGoals, startPath, stepsOn,
  stepsThisWeek, uncompleteStep,
} from '../core/journey.js';
import { ayahsMastered, loadMemo } from '../core/memorization-store.js';
import { loadListening, onListeningChange } from '../core/listening-log.js';
import { loadNotes, onNotesChange } from '../core/notes.js';
import { getSurahMeta } from '../core/quran.js';
import { onReadingChange, readTotal } from '../core/reading-log.js';
import { REMINDER_TYPES, dueReminders, loadReminders, markShown, saveReminders, setReminder } from '../core/reminders.js';
import { onRouteChange } from '../core/router.js';
import { toast } from '../core/toast.js';
import { ARABIC_LETTERS, HARAKAT, JOURNEY_PATHS, SHAHADA, findPath } from '../data/journey-paths.js';
import { loadLearning, onLearningChange } from './learn.js';

let actions = {
  navigate: () => {}, readSurah: () => {}, openLab: () => {}, openPlan: () => {}, openLesson: () => {},
  openDialog: () => {}, openTasbeeh: () => {}, ask: () => {},
};
const el = {};
const view = { path: null, step: null };

const loc = (o) => (o ? o[getLang()] ?? o.en ?? o.ar : '');
const today = () => localDateKey();
const persist = (data) => { saveJourney(data); refresh(); };

// ------------------------------------------------------------------ detection from existing data
/** "pathId:stepId" of steps completed by the visitor's existing activity. */
export function detectAutoDone() {
  const learning = loadLearning();
  const memo = loadMemo();
  const memoAny = Object.values(memo.surahs).some((s) => s?.memorized || s?.completed || Object.keys(s?.ayahs || {}).length > 0);
  const notesAny = loadNotes().items.length > 0;
  const readAny = readTotal() > 0;
  const listening = loadListening();
  const listenAny = Object.values(listening.days).some((sec) => sec > 0);
  const done = new Set();
  for (const path of JOURNEY_PATHS) {
    for (const step of path.steps) {
      const [kind, a, b] = String(step.auto || '').split(':');
      let ok = false;
      if (kind === 'lesson') ok = !!learning.lessons[a];
      else if (kind === 'memo' && a === 'any') ok = memoAny;
      else if (kind === 'memo' && a === 'surah') {
        const n = Number(b);
        const s = memo.surahs[String(n)];
        ok = !!(s?.memorized || s?.completed || (getSurahMeta(n) && ayahsMastered(memo, n) >= getSurahMeta(n).ayahCount));
      } else if (kind === 'notes') ok = notesAny;
      else if (kind === 'read') ok = readAny;
      else if (kind === 'listen') ok = listenAny;
      if (ok) done.add(`${path.id}:${step.id}`);
    }
  }
  return done;
}

// ------------------------------------------------------------------ small pieces
function bar(pct, label) {
  const fill = h('span');
  fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  return h('div', { class: 'progress progress--thin', attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(pct)), 'aria-label': label } }, fill);
}

function runStepAction(path, step, act) {
  const data = loadJourney();
  startPath(data, path.id, today());
  data.paths[path.id].last = step.id;
  saveJourney(data);
  const d = act.do || {};
  if (d.route) actions.navigate(d.route);
  else if (d.surah) actions.readSurah(d.surah, d.ayah ? d.ayah - 1 : null);
  else if (d.lab === 'plan') actions.openPlan();
  else if (d.lab) actions.openLab();
  else if (d.lesson) actions.openLesson(d.lesson);
  else if (d.dialog) actions.openDialog(d.dialog);
  else if (d.tasbih) actions.openTasbeeh();
  else if (d.ask) actions.ask(loc(d.ask));
}

function widget(kind) {
  if (kind === 'letters') {
    return h('ul', { class: 'letters-grid', attrs: { 'aria-label': t('jr_letters_label') } }, ...ARABIC_LETTERS.map(([ch, nameAr, nameEn]) =>
      h('li', { class: 'letter-card' },
        h('span', { class: 'letter-char', lang: 'ar', text: ch }),
        h('span', { class: 'letter-name', lang: 'ar', text: nameAr }),
        h('span', { class: 'letter-latin small muted', text: nameEn }))));
  }
  if (kind === 'harakat') {
    return h('ul', { class: 'letters-grid letters-grid--harakat' }, ...HARAKAT.map(([form, name, sound]) =>
      h('li', { class: 'letter-card' },
        h('span', { class: 'letter-char', lang: 'ar', text: form }),
        h('span', { class: 'letter-name', text: loc(name) }),
        h('span', { class: 'letter-latin small muted', dir: 'ltr', text: sound }))));
  }
  if (kind === 'shahada') {
    return h('figure', { class: 'shahada-card' },
      h('p', { class: 'shahada-ar', lang: 'ar', dir: 'rtl', text: SHAHADA.ar }),
      h('p', { class: 'shahada-latin', dir: 'ltr', lang: 'en', text: SHAHADA.translit }),
      h('figcaption', { text: loc(SHAHADA.meaning) }));
  }
  return null;
}

function quizBlock(path, step) {
  const data = loadJourney();
  const prev = data.paths[path.id]?.quiz?.[step.id];
  const form = h('form', { class: 'jr-quiz' });
  const result = h('p', { class: 'jr-quiz-result', attrs: { role: 'status' } });
  step.quiz.forEach((item, qi) => {
    const options = item.options[getLang()] || item.options.en || item.options.ar;
    form.append(h('fieldset', { class: 'jr-quiz-q' },
      h('legend', { text: `${qi + 1}. ${loc(item.q)}` }),
      ...options.map((opt, oi) => h('label', { class: 'jr-quiz-opt' },
        h('input', { type: 'radio', name: `q${qi}`, value: String(oi), attrs: { required: '' } }), ` ${opt}`))));
  });
  form.append(h('button', { class: 'btn btn-primary btn-small', type: 'submit', text: t('jr_quiz_check') }), result);
  if (prev) result.textContent = t('jr_quiz_prev', { score: prev.score, total: prev.total });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    let score = 0;
    step.quiz.forEach((item, qi) => {
      const chosen = form.querySelector(`input[name="q${qi}"]:checked`);
      const fs = form.querySelectorAll('.jr-quiz-q')[qi];
      const ok = chosen && Number(chosen.value) === item.answer;
      fs.classList.toggle('is-right', !!ok);
      fs.classList.toggle('is-wrong', !ok);
      if (ok) score += 1;
    });
    const total = step.quiz.length;
    const d = loadJourney();
    recordQuiz(d, path.id, step.id, score, total, today());
    startPath(d, path.id, today());
    if (score === total) completeStep(d, path.id, step.id, today());
    saveJourney(d);
    result.textContent = score === total ? t('jr_quiz_pass', { score, total }) : t('jr_quiz_retry', { score, total });
    if (score === total) { toast(t('jr_step_done_toast')); refresh({ keepStep: true }); }
  });
  return form;
}

// ------------------------------------------------------------------ page: overview, paths, detail
function renderOverview(data, auto) {
  const all = overallProgress(JOURNEY_PATHS, data, auto);
  const day = today();
  const todaySteps = stepsOn(data, day);
  const week = stepsThisWeek(data, day);
  el.overview.replaceChildren(
    h('div', { class: 'jr-stats' },
      h('div', { class: 'jr-stat' }, h('strong', { text: `${all.pct}%` }), h('span', { class: 'small', text: t(all.startedPaths ? 'jr_overall' : 'jr_overall_none') })),
      h('div', { class: 'jr-stat' }, h('strong', { text: `${todaySteps}/${data.goals.daily}` }), h('span', { class: 'small', text: t('jr_today') })),
      h('div', { class: 'jr-stat' }, h('strong', { text: `${week}/${data.goals.weekly}` }), h('span', { class: 'small', text: t('jr_week') })),
      h('div', { class: 'jr-stat' }, h('strong', { text: String(journeyStreak(data, day)) }), h('span', { class: 'small', text: t('jr_streak') }))),
    bar(all.pct, t('jr_overall')),
    h('p', { class: 'small muted', text: t('jr_overall_note', { done: all.done, total: all.total, finished: all.finishedPaths }) }));
}

function pathCard(path, data, auto) {
  const pr = pathProgress(path, data, auto);
  const status = pr.finished ? t('jr_status_done') : pr.paused ? t('jr_status_paused') : pr.started ? t('jr_status_active') : t('jr_status_new');
  const buttons = [];
  if (!pr.started) buttons.push(h('button', { class: 'btn btn-primary btn-small', type: 'button', text: t('jr_start'), on: { click: () => { const d = loadJourney(); startPath(d, path.id, today()); saveJourney(d); openPath(path.id); } } }));
  else if (pr.paused) buttons.push(h('button', { class: 'btn btn-primary btn-small', type: 'button', text: t('jr_resume'), on: { click: () => { const d = loadJourney(); startPath(d, path.id, today()); saveJourney(d); openPath(path.id); } } }));
  else buttons.push(h('button', { class: 'btn btn-primary btn-small', type: 'button', text: pr.finished ? t('jr_review') : t('jr_continue'), on: { click: () => openPath(path.id) } }));
  if (pr.started && !pr.paused && !pr.finished) buttons.push(h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('jr_pause'), on: { click: () => { const d = loadJourney(); pausePath(d, path.id, today()); persist(d); toast(t('jr_paused_toast')); } } }));
  return h('article', { class: `jr-path${path.welcoming ? ' jr-path--welcome' : ''}${data.active === path.id ? ' is-active' : ''}`, dataset: { path: path.id } },
    h('h2', { class: 'jr-path-title' }, h('span', { attrs: { 'aria-hidden': 'true' }, text: path.icon }), ` ${loc(path.title)}`),
    h('p', { class: 'small', text: loc(path.desc) }),
    h('p', { class: 'jr-path-meta small' }, h('span', { class: `badge${pr.finished ? ' badge--ok' : ''}`, text: status }), ` ${t('jr_steps_count', { done: pr.done, total: pr.total })}`),
    bar(pr.pct, loc(path.title)),
    pr.next && pr.started ? h('p', { class: 'small muted', text: t('jr_next', { step: loc(pr.next.title) }) }) : null,
    h('div', { class: 'jr-path-actions' }, ...buttons));
}

function stepItem(path, step, index, data, auto, open) {
  const done = isStepDone(data, path.id, step.id, auto);
  const autoOnly = auto.has(`${path.id}:${step.id}`) && !data.paths[path.id]?.steps[step.id];
  const header = h('button', {
    class: 'jr-step-head', type: 'button', attrs: { 'aria-expanded': String(open), 'aria-controls': `jrStep-${step.id}` },
    on: { click: () => { view.step = open ? null : step.id; renderDetail(); } },
  },
  h('span', { class: `jr-step-num${done ? ' is-done' : ''}`, attrs: { 'aria-hidden': 'true' }, text: done ? '✓' : String(index + 1) }),
  h('span', { class: 'jr-step-title', text: loc(step.title) }),
  h('span', { class: 'visually-hidden', text: done ? t('jr_step_done') : t('jr_step_todo') }));
  const body = h('div', { class: 'jr-step-body', id: `jrStep-${step.id}`, hidden: !open });
  if (open) {
    body.append(h('p', { text: loc(step.body) }));
    if (step.list) body.append(h('ul', {}, ...(step.list[getLang()] || step.list.en).map((x) => h('li', { text: x }))));
    if (step.widget) body.append(widget(step.widget));
    if (step.quiz) body.append(quizBlock(path, step));
    if (step.actions?.length) {
      body.append(h('div', { class: 'jr-step-actions' }, ...step.actions.map((act) => h('button', {
        class: 'btn btn-soft btn-small', type: 'button', text: loc(act.label), on: { click: () => runStepAction(path, step, act) },
      }))));
    }
    if (step.auto) body.append(h('p', { class: 'small muted', text: t('jr_auto_note') }));
    if (!step.quiz || done) {
      body.append(h('p', { class: 'jr-step-mark' }, done && !autoOnly
        ? h('button', { class: 'btn btn-ghost-soft btn-small', type: 'button', text: t('jr_undo'), on: { click: () => { const d = loadJourney(); uncompleteStep(d, path.id, step.id); persist(d); } } })
        : done
          ? h('span', { class: 'badge badge--ok', text: t('jr_step_done') })
          : h('button', { class: 'btn btn-primary btn-small', type: 'button', text: t('jr_mark_done'), on: { click: () => {
            const d = loadJourney(); startPath(d, path.id, today()); completeStep(d, path.id, step.id, today()); saveJourney(d);
            toast(t('jr_step_done_toast'));
            const next = pathProgress(path, d, detectAutoDone()).next;
            view.step = next ? next.id : null;
            refresh({ keepStep: true });
          } } })));
    }
  }
  return h('li', { class: `jr-step${done ? ' is-done' : ''}${open ? ' is-open' : ''}` }, header, body);
}

function renderDetail() {
  const path = view.path ? findPath(view.path) : null;
  el.detail.hidden = !path;
  el.paths.hidden = !!path;
  if (!path) { el.detail.replaceChildren(); return; }
  const data = loadJourney();
  const auto = detectAutoDone();
  const pr = pathProgress(path, data, auto);
  const openId = view.step ?? pr.next?.id ?? null;
  el.detail.replaceChildren(
    h('p', {}, h('a', { class: 'link-btn', href: '#/journey', text: t('jr_back') })),
    h('h2', { class: 'jr-detail-title' }, h('span', { attrs: { 'aria-hidden': 'true' }, text: path.icon }), ` ${loc(path.title)}`),
    h('p', { text: loc(path.desc) }),
    h('p', { class: 'small', text: t('jr_steps_count', { done: pr.done, total: pr.total }) }),
    bar(pr.pct, loc(path.title)),
    pr.finished ? h('p', { class: 'badge badge--ok', text: t('jr_path_finished') }) : null,
    h('ol', { class: 'jr-steps' }, ...path.steps.map((st, i) => stepItem(path, st, i, data, auto, st.id === openId))),
    h('div', { class: 'jr-detail-actions' },
      pr.started && !pr.paused
        ? h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('jr_pause'), on: { click: () => { const d = loadJourney(); pausePath(d, path.id, today()); persist(d); toast(t('jr_paused_toast')); } } })
        : h('button', { class: 'btn btn-primary btn-small', type: 'button', text: pr.started ? t('jr_resume') : t('jr_start'), on: { click: () => { const d = loadJourney(); startPath(d, path.id, today()); persist(d); } } }),
      pr.started ? h('button', { class: 'btn btn-ghost-soft btn-small', type: 'button', text: t('jr_reset'), on: { click: () => {
        if (!window.confirm(t('jr_reset_confirm'))) return;
        const d = loadJourney(); resetPath(d, path.id); persist(d);
      } } }) : null));
}

function renderSide(data, auto) {
  // goals
  el.daily.value = String(data.goals.daily);
  el.weekly.value = String(data.goals.weekly);
  const day = today();
  const met = stepsOn(data, day) >= data.goals.daily;
  el.goalStatus.replaceChildren(
    h('p', { class: 'small', text: t('jr_goal_status', { today: stepsOn(data, day), daily: data.goals.daily, week: stepsThisWeek(data, day), weekly: data.goals.weekly }) }),
    met ? h('p', { class: 'badge badge--ok', text: t('jr_goal_met') }) : null);
  // achievements
  el.achievements.replaceChildren(...achievements(JOURNEY_PATHS, data, auto, day).map((a) => h('li', { class: `achievement${a.earned ? ' is-earned' : ''}` },
    h('span', { attrs: { 'aria-hidden': 'true' }, text: a.earned ? '🏅' : '○' }),
    h('span', { text: ` ${t(`jr_ach_${a.id}`)}` }),
    h('span', { class: 'visually-hidden', text: a.earned ? ` — ${t('jr_ach_earned')}` : ` — ${t('jr_ach_locked')}` }))));
  // history
  const hist = [...data.history].reverse().slice(0, 12);
  el.history.replaceChildren(...(hist.length ? hist.map((ev) => {
    const path = findPath(ev.path);
    const step = path?.steps.find((s) => s.id === ev.step);
    return h('li', { class: 'small' }, h('span', { class: 'muted', dir: 'ltr', text: ev.date }), ` — ${t(`jr_hist_${ev.kind}`, { path: path ? loc(path.title) : ev.path, step: step ? loc(step.title) : '' })}`);
  }) : [h('li', { class: 'small muted', text: t('jr_hist_empty') })]));
}

function renderReminders() {
  const data = loadReminders();
  el.reminders.replaceChildren(...REMINDER_TYPES.map((type) => {
    const r = data[type.id];
    const check = h('input', { type: 'checkbox', id: `rem-${type.id}`, checked: r.on });
    const time = h('input', { type: 'time', class: 'reminder-time', value: r.time, attrs: { 'aria-label': `${t(`jr_rem_${type.id}`)} — ${t('jr_rem_time')}` } });
    check.addEventListener('change', async () => {
      const d = loadReminders(); setReminder(d, type.id, { on: check.checked }); saveReminders(d);
      if (check.checked && 'Notification' in window && Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch { /* the in-page notice is used instead */ }
      }
      toast(check.checked ? t('jr_rem_on', { time: d[type.id].time }) : t('jr_rem_off'));
    });
    time.addEventListener('change', () => { const d = loadReminders(); setReminder(d, type.id, { time: time.value }); saveReminders(d); });
    return h('div', { class: 'reminder-row' },
      h('label', { class: 'reminder-label', attrs: { for: `rem-${type.id}` } }, check, ` ${t(`jr_rem_${type.id}`)}`),
      time);
  }));
}

// ------------------------------------------------------------------ home card
function renderHome(data, auto) {
  if (!el.home) return;
  const path = currentPath(JOURNEY_PATHS, data, auto);
  const day = today();
  if (!path) {
    el.home.replaceChildren(
      h('p', { text: t('home_journey_empty') }),
      h('div', { class: 'jr-home-suggest' }, ...['basics', 'read', 'memorize'].map((id) => {
        const p = findPath(id);
        return h('a', { class: 'chip-btn', href: `#/journey/${id}`, text: `${p.icon} ${loc(p.title)}` });
      })),
      h('a', { class: 'btn btn-primary btn-small', href: '#/journey', text: t('home_journey_choose') }));
    return;
  }
  const pr = pathProgress(path, data, auto);
  el.home.replaceChildren(
    h('p', { class: 'jr-home-path' }, h('strong', { text: `${path.icon} ${loc(path.title)}` }), h('span', { class: 'muted small', text: ` — ${t('jr_steps_count', { done: pr.done, total: pr.total })}` })),
    bar(pr.pct, loc(path.title)),
    h('p', { class: 'small', text: `${pr.pct}% · ${t('jr_goal_today', { done: stepsOn(data, day), goal: data.goals.daily })}` }),
    pr.next ? h('p', { class: 'small muted', text: t('jr_next', { step: loc(pr.next.title) }) }) : h('p', { class: 'badge badge--ok', text: t('jr_path_finished') }),
    h('a', { class: 'btn btn-primary btn-small', href: `#/journey/${path.id}`, text: t('home_journey_continue') }));
}

// ------------------------------------------------------------------ refresh & routing
function renderPaths(data, auto) {
  el.paths.replaceChildren(...JOURNEY_PATHS.map((p) => pathCard(p, data, auto)));
}

export function refreshJourney(opts) { refresh(opts); }

function refresh({ keepStep = false } = {}) {
  const data = loadJourney();
  const auto = detectAutoDone();
  if (!keepStep && view.path) view.step = null;
  if (el.overview) {
    renderOverview(data, auto);
    renderPaths(data, auto);
    renderDetail();
    renderSide(data, auto);
  }
  renderHome(data, auto);
}

function openPath(id) {
  actions.navigate(`journey/${id}`);
}

/** Route "journey[/<path>|/reminders]". */
export function showJourney(param) {
  view.path = param && findPath(param) ? param : null;
  view.step = null;
  refresh();
  if (param === 'reminders') requestAnimationFrame(() => { el.remindersCard?.scrollIntoView({ block: 'start' }); el.remindersCard?.focus({ preventScroll: true }); });
  else if (view.path) requestAnimationFrame(() => el.detail.focus({ preventScroll: true }));
}

// ------------------------------------------------------------------ reminders scheduling
async function notify(body) {
  const title = t('jr_rem_title_notify');
  const granted = 'Notification' in window && Notification.permission === 'granted';
  if (granted) {
    const options = { body, icon: 'assets/icons/icon-192.png', badge: 'assets/icons/favicon-32.png', tag: 'journey-reminder' };
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) { await reg.showNotification(title, options); return; }
      new Notification(title, options); return;
    } catch { /* fall back to the in-page notice */ }
  }
  if (!document.hidden) toast(`${title}: ${body}`, { duration: 6000 });
}

function checkReminders() {
  const data = loadReminders();
  const due = dueReminders(data);
  if (!due.length) return;
  saveReminders(markShown(data, due, today()));
  notify(due.map((id) => t(`jr_rem_msg_${id}`)).join(' · '));
}

export function initJourney(handlers) {
  actions = { ...actions, ...handlers };
  Object.assign(el, {
    overview: document.getElementById('journeyOverview'),
    paths: document.getElementById('journeyPaths'),
    detail: document.getElementById('journeyDetail'),
    daily: document.getElementById('jrDailyGoal'),
    weekly: document.getElementById('jrWeeklyGoal'),
    goalStatus: document.getElementById('journeyGoalStatus'),
    reminders: document.getElementById('reminderList'),
    remindersCard: document.getElementById('journeyReminders'),
    achievements: document.getElementById('achievementList'),
    history: document.getElementById('historyList'),
    home: document.getElementById('homeJourneyBody'),
  });
  if (el.daily) {
    el.daily.replaceChildren(...DAILY_CHOICES.map((n) => h('option', { value: String(n), text: String(n) })));
    el.weekly.replaceChildren(...WEEKLY_CHOICES.map((n) => h('option', { value: String(n), text: String(n) })));
    const onGoal = () => { const d = loadJourney(); setGoals(d, { daily: Number(el.daily.value), weekly: Number(el.weekly.value) }); persist(d); };
    el.daily.addEventListener('change', onGoal);
    el.weekly.addEventListener('change', onGoal);
    renderReminders();
  }
  refresh();
  onLearningChange(() => refresh({ keepStep: true }));
  onNotesChange(() => refresh({ keepStep: true }));
  onReadingChange(() => refresh({ keepStep: true }));
  onListeningChange(() => refresh({ keepStep: true }));
  onLanguageChange(() => { refresh({ keepStep: true }); renderReminders(); });
  onRouteChange((r) => { if (r.page === 'home') renderHome(loadJourney(), detectAutoDone()); });
  // Reminders: checked once a minute and when the visitor comes back to the tab.
  checkReminders();
  setInterval(checkReminders, 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { checkReminders(); refresh({ keepStep: true }); } });
}

