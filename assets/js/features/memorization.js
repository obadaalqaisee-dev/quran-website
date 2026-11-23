// "My plan & progress" panel of the memorisation lab: daily target, plan surahs, previously memorised
// surahs, revision schedule (due / upcoming), progress per surah and mistake history.
// Every number shown is computed from what the user actually recited on this device.

import { delegateActions, h, localDateKey } from '../core/dom.js';
import { onLanguageChange, t } from '../core/i18n.js';
import {
  ayahsMastered, dueRevisions, loadMemo, memoTotals, saveMemo, setMemorized, streak, todayCount, upcomingRevisions,
} from '../core/memorization-store.js';
import { onDialogOpen } from '../core/modal.js';
import { getSurahMeta, surahName, surahs } from '../core/quran.js';
import { toast } from '../core/toast.js';
import { startRevision } from './voice-lab.js';

const listeners = new Set();
export const onMemoChange = (fn) => listeners.add(fn);
export function notifyMemoChange() { for (const fn of listeners) fn(); render(); }

const ayahCount = (n) => getSurahMeta(n)?.ayahCount || 0;

function formatDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  try { return new Intl.DateTimeFormat(document.documentElement.lang, { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d)); } catch { return key; }
}

function surahOptions(placeholder) {
  return [h('option', { value: '', text: placeholder }), ...surahs.map((s) => h('option', { value: String(s.number), text: `${s.number} - ${surahName(s.number)}` }))];
}

function stat(value, label) {
  return h('div', { class: 'mini-stat' }, h('strong', { text: String(value) }), h('span', { text: label }));
}

function progressRow(n, memo) {
  const done = memo.surahs[String(n)]?.memorized ? ayahCount(n) : ayahsMastered(memo, n);
  const pct = Math.min(100, Math.round((done / ayahCount(n)) * 100) || 0);
  const fill = h('span');
  fill.style.width = `${pct}%`; // CSSOM, allowed by the CSP (unlike a style attribute)
  return h('li', { class: 'plan-row' },
    h('span', { class: 'plan-name', text: surahName(n) }),
    h('span', { class: 'progress progress--thin', attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': surahName(n) } }, fill),
    h('span', { class: 'plan-pct', text: `${done}/${ayahCount(n)}` }),
    h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('plan_practice'), dataset: { action: 'practice', surah: n } }),
    h('button', { class: 'icon-btn', type: 'button', text: '✖', dataset: { action: 'unplan', surah: n }, attrs: { 'aria-label': `${t('plan_remove')}: ${surahName(n)}` } }));
}

export function render() {
  const box = document.getElementById('labPanePlan');
  if (!box) return;
  const memo = loadMemo();
  const today = localDateKey();
  const totals = memoTotals(memo, ayahCount);
  const due = dueRevisions(memo, today);
  const upcoming = upcomingRevisions(memo, today);
  const memorized = Object.entries(memo.surahs).filter(([, s]) => s.memorized).map(([n]) => Number(n)).sort((a, b) => a - b);
  const done = todayCount(memo, today);

  document.getElementById('planStats').replaceChildren(
    stat(`${done} / ${memo.plan.dailyTarget}`, t('plan_today')),
    stat(streak(memo, today), t('plan_streak')),
    stat(totals.ayahs, t('plan_total_ayahs')),
    stat(totals.surahs, t('plan_total_surahs')),
  );
  document.getElementById('planTarget').value = String(memo.plan.dailyTarget);

  const list = document.getElementById('planList');
  list.replaceChildren(...(memo.plan.surahs.length
    ? memo.plan.surahs.map((n) => progressRow(n, memo))
    : [h('li', { class: 'muted small', text: t('plan_empty') })]));

  document.getElementById('revisionDue').replaceChildren(...(due.length
    ? due.map((r) => h('li', { class: 'plan-row' },
      h('span', { class: 'plan-name', text: surahName(r.surah) }),
      h('span', { class: 'badge badge--warn', text: t('revision_due_since', { date: formatDate(r.due) }) }),
      h('button', { class: 'btn btn-primary btn-small', type: 'button', text: t('revision_start'), dataset: { action: 'practice', surah: r.surah } })))
    : [h('li', { class: 'muted small', text: t('revision_none') })]));
  document.getElementById('revisionUpcoming').replaceChildren(...upcoming.map((r) => h('li', { class: 'plan-row' },
    h('span', { class: 'plan-name', text: surahName(r.surah) }), h('span', { class: 'muted small', text: formatDate(r.due) }))));

  document.getElementById('memorizedList').replaceChildren(...(memorized.length
    ? memorized.map((n) => h('li', { class: 'chip' }, surahName(n), ' ',
      h('button', { type: 'button', class: 'chip-x', text: '✖', dataset: { action: 'unmemorize', surah: n }, attrs: { 'aria-label': `${t('plan_remove')}: ${surahName(n)}` } })))
    : [h('li', { class: 'muted small', text: t('memorized_empty') })]));

  const mistakes = memo.mistakes.slice(-15).reverse();
  document.getElementById('mistakeList').replaceChildren(...(mistakes.length
    ? mistakes.map((m) => h('li', { class: 'mistake' },
      h('strong', { text: `${surahName(m.surah)} ﴿${m.ayah}﴾` }), ' ',
      h('span', { class: 'muted small', text: formatDate(m.date) }),
      m.missing?.length ? h('p', { class: 'small', lang: 'ar', text: `${t('mistake_missing')}: ${m.missing.join('، ')}` }) : null,
      m.substituted?.length ? h('p', { class: 'small', lang: 'ar', text: `${t('mistake_substituted')}: ${m.substituted.join('، ')}` }) : null))
    : [h('li', { class: 'muted small', text: t('mistakes_empty') })]));
}

function populateSelects() {
  for (const [id, key] of [['planAddSelect', 'plan_add_placeholder'], ['memorizedAddSelect', 'memorized_add_placeholder']]) {
    const sel = document.getElementById(id);
    sel.replaceChildren(...surahOptions(t(key)));
  }
}

function update(fn) {
  const memo = loadMemo();
  fn(memo);
  saveMemo(memo);
  notifyMemoChange();
}

export function initMemorization() {
  const pane = document.getElementById('labPanePlan');
  populateSelects();
  document.getElementById('planTargetForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const value = Math.min(200, Math.max(1, Number(document.getElementById('planTarget').value) || 5));
    update((m) => { m.plan.dailyTarget = value; });
    toast(t('plan_saved'));
  });
  document.getElementById('planAddBtn').addEventListener('click', () => {
    const n = Number(document.getElementById('planAddSelect').value);
    if (!n) return;
    update((m) => { if (!m.plan.surahs.includes(n)) m.plan.surahs.push(n); });
  });
  document.getElementById('memorizedAddBtn').addEventListener('click', () => {
    const n = Number(document.getElementById('memorizedAddSelect').value);
    if (!n) return;
    update((m) => setMemorized(m, n, true));
  });
  delegateActions(pane, {
    practice: (el) => startRevision(Number(el.dataset.surah)),
    unplan: (el) => update((m) => { m.plan.surahs = m.plan.surahs.filter((x) => x !== Number(el.dataset.surah)); }),
    unmemorize: (el) => update((m) => setMemorized(m, Number(el.dataset.surah), false)),
  });
  onDialogOpen('voiceTestModal', render);
  onLanguageChange(() => { populateSelects(); render(); });
  render();
}
