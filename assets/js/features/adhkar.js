// Hisn al-Muslim: five categories of adhkar with tap-to-count cards (keyboard operable).
// Finishing every morning/evening dhikr also ticks that item in the daily wird.

import { $$, h } from '../core/dom.js';
import { onLanguageChange, t } from '../core/i18n.js';
import { onDialogOpen } from '../core/modal.js';
import { toast } from '../core/toast.js';
import { ADHKAR } from '../data/adhkar.js';
import { getToday, setWird } from './wird.js';

const state = { type: 'morning', counts: [] };

function select(type) {
  state.type = ADHKAR[type] ? type : 'morning';
  state.counts = ADHKAR[state.type].map((d) => d.count);
  for (const tab of $$('[data-adhkar]')) {
    const active = tab.dataset.adhkar === state.type;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  render();
}

function render() {
  const grid = document.getElementById('adhkarGrid');
  grid.setAttribute('aria-labelledby', `tab_${state.type}`);
  grid.replaceChildren(...ADHKAR[state.type].map((dhikr, i) => {
    const left = state.counts[i];
    return h('button', {
      type: 'button', class: `adhkar-card${left === 0 ? ' done' : ''}`, dataset: { index: i },
      attrs: { 'aria-label': `${dhikr.text} — ${left === 0 ? t('dhikr_done_label') : t('dhikr_remaining', { n: left })}` },
    },
    h('span', { class: 'adhkar-text', lang: 'ar', dir: 'rtl', text: dhikr.text }),
    h('span', { class: 'adhkar-count', attrs: { 'aria-hidden': 'true' }, text: left === 0 ? '✓' : String(left) }));
  }));
}

function countDown(index) {
  if (!(state.counts[index] > 0)) return;
  state.counts[index] -= 1;
  if (navigator.vibrate) navigator.vibrate(15);
  render();
  document.querySelector(`#adhkarGrid [data-index="${index}"]`)?.focus();
  const finished = state.counts.every((c) => c === 0);
  if (finished && (state.type === 'morning' || state.type === 'evening') && !getToday()[state.type]) {
    setWird(state.type, true, { announce: false });
    toast(t('wird_auto_done', { name: t(`tab_${state.type}`) }));
  }
}

export function initAdhkar() {
  const tabs = $$('[data-adhkar]');
  for (const tab of tabs) tab.addEventListener('click', () => select(tab.dataset.adhkar));
  // Arrow-key navigation between tabs (WAI-ARIA tabs pattern).
  document.querySelector('#adhkarModal .tabs').addEventListener('keydown', (event) => {
    const i = tabs.indexOf(document.activeElement);
    if (i < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const rtl = document.documentElement.dir === 'rtl';
    const step = (event.key === 'ArrowRight') !== rtl ? 1 : -1;
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + step + tabs.length) % tabs.length;
    tabs[next].focus();
    select(tabs[next].dataset.adhkar);
  });
  document.getElementById('adhkarGrid').addEventListener('click', (event) => {
    const card = event.target.closest('.adhkar-card');
    if (card) countDown(Number(card.dataset.index));
  });
  document.getElementById('adhkarReset').addEventListener('click', () => select(state.type));
  // As in the original, opening Hisn al-Muslim starts on the morning adhkar with fresh counters.
  onDialogOpen('adhkarModal', () => select('morning'));
  onLanguageChange(render);
  select('morning');
}
