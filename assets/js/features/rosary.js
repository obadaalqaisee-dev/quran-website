// Electronic rosary: tap (or Enter/Space) to count, vibration feedback, reset. The count survives a
// page reload (key "rosaryCount", unchanged).
//
// The rosary now lives in Hisn al-Muslim (its own «المسبحة» tab) instead of a separate dialog; the
// controls keep their ids, so the counting behaviour and saved count are exactly as before.
// Added there: a choice of dhikr phrase and an optional target (33 or 100), stored under a new key.

import { h } from '../core/dom.js';
import { onLanguageChange, t } from '../core/i18n.js';
import { KEYS, getJSON, setJSON } from '../core/storage.js';
import { toast } from '../core/toast.js';

// Well-known phrases of tasbih and dhikr (no claim of a specific count is attached to them here).
export const TASBEEH_PHRASES = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله', 'سبحان الله وبحمده'];
const TARGETS = [0, 33, 100];

function loadPrefs() {
  const raw = getJSON(KEYS.tasbeeh, {});
  const prefs = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    phrase: TASBEEH_PHRASES.includes(prefs.phrase) ? prefs.phrase : TASBEEH_PHRASES[0],
    target: TARGETS.includes(Number(prefs.target)) ? Number(prefs.target) : 0,
  };
}

export function initRosary() {
  const counter = document.getElementById('rosaryCounter');
  const phraseBox = document.getElementById('tasbeehPhrases');
  const phraseText = document.getElementById('tasbeehPhrase');
  const targetSelect = document.getElementById('tasbeehTarget');
  const progress = document.getElementById('tasbeehProgress');
  let count = Number(getJSON(KEYS.rosary, 0)) || 0;
  let prefs = loadPrefs();

  const renderProgress = () => {
    if (!progress) return;
    progress.textContent = prefs.target ? t('tasbeeh_progress', { n: Math.min(count, prefs.target), target: prefs.target }) : '';
  };
  const render = () => { counter.textContent = String(count); renderProgress(); };
  const renderPhrases = () => {
    if (!phraseBox) return;
    phraseBox.replaceChildren(...TASBEEH_PHRASES.map((p) => h('button', {
      type: 'button', class: 'chip tasbeeh-chip', text: p, lang: 'ar',
      attrs: { 'aria-pressed': String(p === prefs.phrase) },
      on: { click: () => { prefs = { ...prefs, phrase: p }; setJSON(KEYS.tasbeeh, prefs); renderPhrases(); } },
    })));
    phraseText.textContent = prefs.phrase;
  };

  counter.addEventListener('click', () => {
    count += 1;
    setJSON(KEYS.rosary, count);
    render();
    if (navigator.vibrate) navigator.vibrate(50);
    if (prefs.target && count === prefs.target) {
      if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
      toast(t('tasbeeh_target_done', { target: prefs.target }));
    }
  });
  document.getElementById('rosaryReset').addEventListener('click', () => {
    count = 0;
    setJSON(KEYS.rosary, 0);
    render();
  });
  targetSelect?.addEventListener('change', () => {
    prefs = { ...prefs, target: Number(targetSelect.value) || 0 };
    setJSON(KEYS.tasbeeh, prefs);
    renderProgress();
  });
  if (targetSelect) targetSelect.value = String(prefs.target);
  onLanguageChange(renderProgress);
  renderPhrases();
  render();
}
