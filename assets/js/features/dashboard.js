// Personal dashboard («رحلتي اليومية») and daily companion. Every figure comes from data the visitor
// created on this device (bookmark, reading log, memorisation store, wird, recent audio, learning
// progress); nothing is estimated or invented. Empty states say so instead of showing zeros as goals met.

import { getSurah } from '../core/api.js';
import { stripBasmala } from '../core/arabic.js';
import { h, localDateKey } from '../core/dom.js';
import { getLang, onLanguageChange, t } from '../core/i18n.js';
import { dueRevisions, loadMemo, memoTotals, todayCount } from '../core/memorization-store.js';
import { openDialog } from '../core/modal.js';
import { getSurahMeta, surahName } from '../core/quran.js';
import { khatmaPercent, onReadingChange, readToday, readTotal } from '../core/reading-log.js';
import { getSettings, onSettingsChange } from '../core/settings.js';
import { KEYS, getJSON } from '../core/storage.js';
import { ADHKAR } from '../data/adhkar.js';
import { LESSONS } from '../data/prayer-lessons.js';
import { learningStats, onLearningChange, openLesson } from './learn.js';
import { onRecentChange, playWith, reciterBySlug, reciterLabel, recentlyPlayed } from './player.js';
import { getToday } from './wird.js';

// Self-contained ayahs for the "verse of the day" (references only; the text comes from the dataset).
export const DAILY_AYAHS = [
  '2:152', '2:186', '2:255', '2:286', '3:8', '3:190', '3:200', '7:23', '13:28', '14:7', '16:97', '17:9', '18:10',
  '20:114', '21:87', '25:63', '29:45', '33:41', '39:53', '40:60', '49:13', '55:13', '57:4', '59:18', '65:3', '67:2',
  '94:5', '94:6', '112:1', '2:201',
];

/** Day number since the epoch in local time: the same item for the whole local day. */
export function dayIndex(date = new Date()) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}

let actions = { readSurah: () => {}, openLab: () => {}, openSettings: () => {} };

function bar(pct, label) {
  const fill = h('span');
  fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
  return h('div', { class: 'progress progress--thin', attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(Math.round(pct)), 'aria-label': label } }, fill);
}

function card(icon, title, ...children) {
  return h('article', { class: 'journey-card' }, h('h3', {}, h('span', { attrs: { 'aria-hidden': 'true' }, text: icon }), ` ${title}`), ...children);
}

function renderJourney() {
  const grid = document.getElementById('journeyGrid');
  if (!grid) return;
  const settings = getSettings();
  const memo = loadMemo();
  const bookmark = getJSON(KEYS.bookmark, null);
  const read = readToday();
  const wird = getToday();
  const wirdDone = Object.values(wird).filter(Boolean).length;
  const totals = memoTotals(memo, (n) => getSurahMeta(n)?.ayahCount || 0);
  const due = dueRevisions(memo);
  const recent = recentlyPlayed().slice(0, 3);
  const learning = learningStats();

  const cards = [];
  // 1. Continue reading
  cards.push(card('🔖', t('journey_continue'),
    bookmark?.surahNum >= 1 && bookmark.surahNum <= 114
      ? h('button', { class: 'btn btn-primary btn-small', type: 'button', text: t('bookmark_resume', { surah: surahName(bookmark.surahNum), ayah: bookmark.ayahNumInSurah }), on: { click: () => actions.readSurah(Number(bookmark.surahNum), Number(bookmark.ayahIndex)) } })
      : h('p', { class: 'small muted', text: t('journey_no_bookmark') })));
  // 2. Daily goal and khatma
  cards.push(card('📖', t('journey_goal'),
    h('p', { class: 'journey-figure', text: t('journey_goal_value', { done: read, goal: settings.dailyGoal }) }),
    bar((read / settings.dailyGoal) * 100, t('journey_goal')),
    h('p', { class: 'small muted', text: t('journey_khatma', { pct: khatmaPercent(), n: readTotal() }) }),
    read >= settings.dailyGoal ? h('p', { class: 'badge badge--ok', text: t('journey_goal_met') }) : null));
  // 3. Memorisation
  cards.push(card('🧠', t('journey_memo'),
    h('p', { class: 'journey-figure', text: t('journey_memo_today', { done: todayCount(memo), goal: memo.plan.dailyTarget }) }),
    bar((todayCount(memo) / memo.plan.dailyTarget) * 100, t('journey_memo')),
    h('p', { class: 'small muted', text: t('journey_memo_totals', { ayahs: totals.ayahs, surahs: totals.surahs }) }),
    due.length ? h('p', { class: 'badge badge--warn', text: t('journey_revisions_due', { n: due.length }) }) : null,
    h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('journey_open_lab'), on: { click: () => actions.openLab() } })));
  // 4. Wird and today's adhkar
  cards.push(card('📿', t('journey_wird'),
    h('p', { class: 'journey-figure', text: `${wirdDone * 25}%` }),
    bar(wirdDone * 25, t('journey_wird')),
    h('ul', { class: 'journey-checks small' },
      h('li', { text: `${wird.morning ? '✅' : '⬜'} ${t('tab_morning')}` }),
      h('li', { text: `${wird.evening ? '✅' : '⬜'} ${t('tab_evening')}` })),
    h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('journey_open_adhkar'), on: { click: () => openDialog('adhkarModal') } })));
  // 5. Recently played
  cards.push(card('🎧', t('journey_recent'),
    recent.length
      ? h('ul', { class: 'journey-recent' }, ...recent.map((r) => {
        const reciter = reciterBySlug(r.reciter);
        return h('li', {}, h('button', {
          class: 'link-btn', type: 'button', on: { click: () => playWith(r.surah, r.reciter) },
          text: `▶ ${surahName(r.surah)}${reciter ? ` — ${reciterLabel(reciter)}` : ''}`,
        }));
      }))
      : h('p', { class: 'small muted', text: t('journey_no_recent') })));
  // 6. Learning
  cards.push(card('🎓', t('journey_learning'),
    h('p', { class: 'journey-figure', text: t('journey_learning_value', { done: learning.totalDone, total: learning.total }) }),
    bar((learning.totalDone / learning.total) * 100, t('journey_learning')),
    h('p', { class: 'small muted', text: t('journey_learning_prayer', { done: learning.prayerDone, total: learning.prayerTotal }) }),
    h('a', { class: 'btn btn-soft btn-small', href: '#academySection', text: t('journey_open_academy') })));
  grid.replaceChildren(...cards);
}

async function renderCompanion() {
  const box = document.getElementById('companionGrid');
  if (!box) return;
  const day = dayIndex();
  const [s, a] = DAILY_AYAHS[day % DAILY_AYAHS.length].split(':').map(Number);
  const dailyList = ADHKAR.daily;
  const dhikr = dailyList[day % dailyList.length];
  const lesson = LESSONS[day % LESSONS.length];
  const profile = getJSON(KEYS.profile, {}) || {};
  const verse = h('p', { class: 'companion-verse', lang: 'ar', dir: 'rtl', text: '…' });
  box.replaceChildren(
    h('article', { class: 'companion-card companion-card--verse' },
      h('h3', { text: t('companion_verse') }), verse,
      h('button', { class: 'link-btn', type: 'button', text: `${surahName(s)} ﴿${a}﴾ — ${t('learn_open_in_mushaf')}`, on: { click: () => actions.readSurah(s, a - 1) } })),
    h('article', { class: 'companion-card' },
      h('h3', { text: t('companion_dhikr') }),
      h('p', { class: 'companion-dhikr', lang: 'ar', dir: 'rtl', text: dhikr.text }),
      h('p', { class: 'small muted', text: `${t('search_res_dhikr_count')} ${dhikr.count}` })),
    h('article', { class: 'companion-card' },
      h('h3', { text: t('companion_lesson') }),
      h('p', {}, h('strong', { text: `${lesson.icon} ${lesson.title[getLang()] || lesson.title.ar}` })),
      h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('companion_open_lesson'), on: { click: () => openLesson(lesson.id) } })),
    h('article', { class: 'companion-card' },
      h('h3', { text: t('companion_goal') }),
      typeof profile.goal === 'string' && profile.goal.trim()
        ? h('p', { text: profile.goal.trim() })
        : h('p', { class: 'small muted', text: t('companion_no_goal') }),
      h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('companion_edit_goal'), on: { click: () => openDialog('profileModal') } })),
  );
  try {
    const data = await getSurah(s);
    const ayah = data.ayahs.find((x) => x.numberInSurah === a);
    verse.textContent = ayah ? `﴿${stripBasmala(ayah.text, s, a)}﴾` : t('learn_quran_unavailable');
  } catch {
    verse.textContent = t('learn_quran_unavailable');
  }
}

let lastDay = localDateKey();
export function refreshDashboard() { renderJourney(); }

export function initDashboard(handlers) {
  actions = { ...actions, ...handlers };
  renderJourney();
  renderCompanion();
  onReadingChange(renderJourney);
  onSettingsChange(renderJourney);
  onLearningChange(renderJourney);
  onRecentChange(renderJourney);
  onLanguageChange(() => { renderJourney(); renderCompanion(); });
  document.addEventListener('wirdchange', renderJourney);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    renderJourney();
    if (localDateKey() !== lastDay) { lastDay = localDateKey(); renderCompanion(); }
  });
}
