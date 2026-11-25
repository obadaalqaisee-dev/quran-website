// «بصيرة» — the personal insights section of the dashboard: what to do next (with the reason), a 12-week
// activity map, streaks, a khatma planner, listening statistics and memorisation analytics (revision order,
// ayahs that need attention, words most often missed, accuracy trend). Also the daily knowledge challenge card.
//
// Every figure is computed by core/insights.js from data created on this device. When there is no data yet,
// the section says so instead of showing zeros as achievements. Text from storage is inserted with textContent.

import { localDateKey, h } from '../core/dom.js';
import { getLang, locale, onLanguageChange, t } from '../core/i18n.js';
import {
  accuracyTrend, activityDays, frequentMissedWords, khatmaPlan, listeningSummary, recentAverage, recommendations,
  revisionPriority, streaks, weakAyahs, TOTAL_AYAHS,
} from '../core/insights.js';
import { answerChallenge, challengeStats, loadChallenge, questionOfDay } from '../core/challenge.js';
import { loadListening, onListeningChange } from '../core/listening-log.js';
import { loadMemo, todayCount } from '../core/memorization-store.js';
import { openDialog } from '../core/modal.js';
import { surahName } from '../core/quran.js';
import { onReadingChange, readToday, readTotal } from '../core/reading-log.js';
import { getSettings, onSettingsChange } from '../core/settings.js';
import { KEYS, getJSON, setJSON } from '../core/storage.js';
import { LESSONS } from '../data/prayer-lessons.js';
import { loadLearning, onLearningChange, openLesson } from './learn.js';
import { reciterBySlug, reciterLabel } from './player.js';
import { getToday } from './wird.js';

let actions = { readSurah: () => {}, openLab: () => {}, startRevision: () => {}, practiceAyah: () => {} };
const el = {};

const fmtDate = (key, opts = { day: 'numeric', month: 'long' }) => {
  const [y, m, d] = key.split('-').map(Number);
  try { return new Intl.DateTimeFormat(locale(), opts).format(new Date(y, m - 1, d)); } catch { return key; }
};
const fmtNum = (n) => { try { return new Intl.NumberFormat(locale()).format(n); } catch { return String(n); } };
const dayNumber = (date = new Date()) => Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);

function panel(id, icon, title, ...children) {
  return h('article', { class: 'insight-card', id },
    h('h3', { class: 'insight-title' }, h('span', { attrs: { 'aria-hidden': 'true' }, text: icon }), ` ${title}`), ...children);
}
const empty = (key) => h('p', { class: 'small muted insight-empty', text: t(key) });

// ------------------------------------------------------------------------------------- what next
function nextActions(today) {
  const memo = loadMemo();
  const settings = getSettings();
  const wird = getToday();
  const learning = loadLearning();
  const nextLesson = LESSONS.find((l) => !learning.lessons[l.id]);
  const due = revisionPriority(memo, today);
  const weak = weakAyahs(memo, 1)[0] || null;
  const list = recommendations({
    dueRevisions: due.length, weakAyah: !!weak, readToday: readToday(today), dailyGoal: settings.dailyGoal,
    memoToday: todayCount(memo, today), memoGoal: memo.plan.surahs.length ? memo.plan.dailyTarget : 0,
    morningDone: !!wird.morning, eveningDone: !!wird.evening, hour: new Date().getHours(),
    challengeDone: !!loadChallenge().days[today], lessonsLeft: LESSONS.length - LESSONS.filter((l) => learning.lessons[l.id]).length,
    nextLessonId: nextLesson?.id,
  });
  const run = {
    revise: () => actions.startRevision(due[0].surah),
    weak: () => actions.practiceAyah(weak.surah, weak.ayah),
    read: () => {
      const b = getJSON(KEYS.bookmark, null);
      if (b?.surahNum >= 1 && b.surahNum <= 114) actions.readSurah(Number(b.surahNum), Number(b.ayahIndex));
      else document.getElementById('surahs')?.scrollIntoView();
    },
    morning: () => openDialog('adhkarModal'),
    evening: () => { openDialog('adhkarModal'); document.getElementById('tab_evening')?.click(); },
    memo: () => actions.openLab(),
    challenge: () => el.challenge?.querySelector('button')?.focus(),
    lesson: () => openLesson(nextLesson.id),
    'well-done': null,
  };
  const vars = {
    revise: { surah: due[0] ? surahName(due[0].surah) : '', n: due.length },
    weak: weak ? { ref: `${surahName(weak.surah)} ﴿${weak.ayah}﴾` } : {},
    lesson: nextLesson ? { lesson: nextLesson.title[getLang()] || nextLesson.title.ar } : {},
  };
  return h('ol', { class: 'next-list' }, ...list.map((r) => h('li', { class: 'next-item' },
    h('span', { class: 'next-icon', attrs: { 'aria-hidden': 'true' }, text: r.icon }),
    h('div', { class: 'next-body' },
      h('strong', { text: t(`next_${r.id.replace('-', '_')}`, { ...vars[r.id], ...r.vars }) }),
      h('span', { class: 'small muted', text: t(`next_${r.id.replace('-', '_')}_why`, { ...vars[r.id], ...r.vars }) })),
    run[r.id] ? h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('next_go'), on: { click: run[r.id] } }) : null)));
}

// ---------------------------------------------------------------------------------- activity map
function activityMap(days) {
  const cols = [];
  for (let w = 0; w < days.length / 7; w += 1) {
    cols.push(h('div', { class: 'heat-col' }, ...days.slice(w * 7, w * 7 + 7).map((d) => {
      const parts = [fmtDate(d.date, { weekday: 'short', day: 'numeric', month: 'short' })];
      if (d.read) parts.push(t('heat_read', { n: d.read }));
      if (d.memo) parts.push(t('heat_memo', { n: d.memo }));
      if (d.listen) parts.push(t('heat_listen', { n: d.listen }));
      if (!d.level) parts.push(t('heat_none'));
      return h('span', { class: `heat-cell heat-${d.level}`, title: parts.join(' · '), attrs: { 'data-date': d.date } });
    })));
  }
  const s = streaks(days);
  const summary = t('heat_summary', { days: s.activeDays, weeks: days.length / 7 });
  return h('div', { class: 'heat-wrap' },
    h('div', { class: 'heat-map', attrs: { role: 'img', 'aria-label': summary } }, ...cols),
    h('div', { class: 'heat-legend small muted', attrs: { 'aria-hidden': 'true' } },
      h('span', { text: t('heat_less') }), ...[0, 1, 2, 3, 4].map((l) => h('span', { class: `heat-cell heat-${l}` })), h('span', { text: t('heat_more') })),
    h('p', { class: 'small muted', text: summary }));
}

function statTiles(days, today) {
  const s = streaks(days);
  const listening = listeningSummary(loadListening(), today);
  const top = listening.topReciter ? (listening.topReciter === 'ayah' ? t('insight_ayah_audio') : (reciterBySlug(listening.topReciter) ? reciterLabel(reciterBySlug(listening.topReciter)) : null)) : null;
  const tile = (value, label, id) => h('div', { class: 'stat-tile', id }, h('strong', { text: value }), h('span', { text: label }));
  return h('div', { class: 'stat-tiles' },
    tile(fmtNum(s.current), t('insight_streak'), 'insightStreak'),
    tile(fmtNum(s.longest), t('insight_longest'), 'insightLongest'),
    tile(`${fmtNum(Math.floor((readTotal() / TOTAL_AYAHS) * 1000) / 10)}%`, t('insight_khatma'), 'insightKhatma'),
    tile(fmtNum(listening.weekMinutes), t('insight_listen_week'), 'insightListenWeek'),
    top ? h('p', { class: 'small muted stat-note', text: t('insight_top_reciter', { reciter: top }) }) : null);
}

// -------------------------------------------------------------------------------- khatma planner
function khatmaPlanner(today) {
  const saved = getJSON(KEYS.khatma, null);
  const target = typeof saved?.target === 'string' ? saved.target : '';
  const input = h('input', { type: 'date', id: 'khatmaTarget', min: today, value: target, required: true });
  const result = h('div', { class: 'khatma-result', attrs: { 'aria-live': 'polite' } });
  const render = (dateValue) => {
    if (!dateValue) { result.replaceChildren(empty('khatma_empty')); return; }
    const plan = khatmaPlan({ read: readTotal(), target: dateValue, today, recentAverage: recentAverage(getJSON(KEYS.readingLog, {})?.days || {}, today) });
    if (!plan.valid) { result.replaceChildren(h('p', { class: 'small bad', text: t('khatma_past') })); return; }
    if (plan.done) { result.replaceChildren(h('p', { class: 'badge badge--ok', text: t('khatma_done') })); return; }
    result.replaceChildren(
      h('p', { class: 'journey-figure', text: t('khatma_per_day', { n: fmtNum(plan.perDay) }) }),
      h('p', { class: 'small muted', text: t('khatma_detail', { pages: fmtNum(plan.pagesPerDay), days: fmtNum(plan.daysLeft), remaining: fmtNum(plan.remaining), date: fmtDate(dateValue, { day: 'numeric', month: 'long', year: 'numeric' }) }) }),
      h('p', { class: `badge ${plan.onTrack ? 'badge--ok' : 'badge--warn'}`, text: t(plan.onTrack ? 'khatma_on_track' : 'khatma_behind') }),
      h('p', { class: 'small muted', text: t('khatma_note') }));
  };
  const form = h('form', { class: 'khatma-form', on: {
    submit: (e) => {
      e.preventDefault();
      if (!input.value) return;
      setJSON(KEYS.khatma, { target: input.value, start: saved?.start || today });
      render(input.value);
    },
  } },
  h('label', { class: 'field-label', htmlFor: 'khatmaTarget', text: t('khatma_label') }),
  h('div', { class: 'khatma-row' }, input,
    h('button', { class: 'btn btn-primary btn-small', type: 'submit', text: t('khatma_save') }),
    target ? h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('khatma_clear'), on: { click: () => { setJSON(KEYS.khatma, null); input.value = ''; render(''); } } }) : null));
  render(target);
  return [form, result];
}

// ------------------------------------------------------------------------- memorisation analytics
function memoInsights(today) {
  const memo = loadMemo();
  const due = revisionPriority(memo, today);
  const weak = weakAyahs(memo, 5);
  const words = frequentMissedWords(memo.mistakes, 8);
  const trend = accuracyTrend(memo.sessions);
  const parts = [];

  parts.push(h('h4', { class: 'insight-sub', text: t('insight_revision_order') }));
  parts.push(due.length
    ? h('ol', { class: 'insight-list', id: 'revisionPriority' }, ...due.slice(0, 5).map((d) => h('li', {},
      h('span', {}, h('strong', { text: surahName(d.surah) }), ' ',
        h('span', { class: 'small muted', text: t(`insight_reason_${d.reason}`, { days: d.overdue, rate: d.rate }) })),
      h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('insight_revise'), on: { click: () => actions.startRevision(d.surah) } }))))
    : empty('insight_no_revisions'));

  parts.push(h('h4', { class: 'insight-sub', text: t('insight_weak_ayahs') }));
  parts.push(weak.length
    ? h('ul', { class: 'insight-list', id: 'weakAyahs' }, ...weak.map((w) => h('li', {},
      h('span', {}, h('strong', { text: `${surahName(w.surah)} ﴿${w.ayah}﴾` }), ' ',
        h('span', { class: 'small muted', text: t('insight_weak_detail', { mistakes: w.mistakes, ok: w.ok }) })),
      h('span', { class: 'insight-actions' },
        h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('insight_open'), on: { click: () => actions.readSurah(w.surah, w.ayah - 1) } }),
        h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('insight_practice'), on: { click: () => actions.practiceAyah(w.surah, w.ayah) } })))))
    : empty('insight_no_weak'));

  parts.push(h('h4', { class: 'insight-sub', text: t('insight_missed_words') }));
  parts.push(words.length
    ? h('ul', { class: 'word-chips', id: 'missedWords' }, ...words.map((w) => h('li', { class: 'word-chip', title: w.places.join(' · ') },
      h('span', { lang: 'ar', dir: 'rtl', class: 'word-chip-text', text: w.word }), h('span', { class: 'word-chip-count', text: `×${fmtNum(w.count)}` }))))
    : empty('insight_no_words'));

  parts.push(h('h4', { class: 'insight-sub', text: t('insight_accuracy') }));
  parts.push(trend.count
    ? h('p', { id: 'accuracyTrend', text: t(trend.change === null ? 'insight_accuracy_value' : trend.change >= 0 ? 'insight_accuracy_up' : 'insight_accuracy_down',
      { avg: trend.average, n: trend.count, change: Math.abs(trend.change ?? 0) }) })
    : empty('insight_no_sessions'));
  parts.push(h('p', { class: 'small muted', text: t('insight_memo_note') }));
  return parts;
}

// ----------------------------------------------------------------------------- daily challenge
export function challengeCard() {
  const today = localDateKey();
  const question = questionOfDay(dayNumber());
  const card = h('article', { class: 'companion-card challenge-card', id: 'challengeCard' }, h('h3', { text: t('challenge_title') }));
  el.challenge = card;
  if (!question) { card.append(empty('challenge_none')); return card; }
  const done = loadChallenge().days[today];
  const feedback = h('p', { class: 'quiz-feedback small', attrs: { 'aria-live': 'polite' } });
  const lessonTitle = question.lessonTitle?.[getLang()] || question.lessonTitle?.ar || '';
  const options = h('div', { class: 'quiz-options' }, ...question.options.map((opt, i) => h('button', {
    type: 'button', class: 'quiz-option', text: opt, dataset: { o: i }, lang: 'ar', dir: 'rtl',
    on: { click: () => reveal(answerChallenge(today, question, i)) },
  })));
  function reveal(entry) {
    for (const b of options.children) {
      b.disabled = true;
      if (Number(b.dataset.o) === question.answer) b.classList.add('is-correct');
      if (entry.choice !== null && Number(b.dataset.o) === entry.choice && !entry.ok) b.classList.add('is-wrong');
    }
    const stats = challengeStats();
    feedback.className = `quiz-feedback small ${entry.ok ? 'ok' : 'bad'}`;
    feedback.textContent = `${entry.ok ? t('learn_quiz_right') : t('learn_quiz_wrong')} ${question.explain || ''}`;
    card.querySelector('.challenge-stats')?.remove();
    card.append(h('p', { class: 'small muted challenge-stats', text: t('challenge_stats', { correct: stats.correct, answered: stats.answered }) }));
  }
  card.append(
    h('p', { class: 'challenge-q', lang: 'ar', dir: 'rtl', text: question.q }),
    options, feedback,
    h('button', { class: 'link-btn small', type: 'button', text: t('challenge_from', { lesson: `${question.icon || ''} ${lessonTitle}`.trim() }), on: { click: () => openLesson(question.lessonId) } }));
  if (done && done.q === question.id) reveal(done);
  return card;
}

// ------------------------------------------------------------------------------------------ render
export function renderInsights() {
  if (!el.root) return;
  const today = localDateKey();
  const days = activityDays({
    readingDays: getJSON(KEYS.readingLog, {})?.days || {},
    memoDays: loadMemo().days,
    listeningDays: loadListening().days,
  }, today, 12);
  el.root.replaceChildren(
    panel('insightNext', '🧭', t('insight_next_title'), nextActions(today)),
    panel('insightActivity', '📅', t('insight_activity_title'), statTiles(days, today), activityMap(days)),
    panel('insightKhatmaPlan', '🎯', t('khatma_title'), ...khatmaPlanner(today)),
    panel('insightMemo', '🧠', t('insight_memo_title'), ...memoInsights(today)),
  );
}

export function initInsights(handlers) {
  actions = { ...actions, ...handlers };
  el.root = document.getElementById('insightsGrid');
  renderInsights();
  for (const subscribe of [onReadingChange, onSettingsChange, onLearningChange, onListeningChange]) subscribe(renderInsights);
  onLanguageChange(renderInsights);
  document.addEventListener('wirdchange', renderInsights);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderInsights(); });
}

