// Settings dialog: one place for every personal preference. Preferences that already existed keep
// their original storage keys (reciter, quranFontScale, prayerNotify…); the new ones live in
// "userSettings" (core/settings.js) and "memorizationData" (daily memorisation goal).

import { h } from '../core/dom.js';
import { onLanguageChange, t } from '../core/i18n.js';
import { loadMemo, saveMemo } from '../core/memorization-store.js';
import { onDialogOpen } from '../core/modal.js';
import { NOTIFY_CHOICES, TRANSLATIONS, getSettings, updateSettings } from '../core/settings.js';
import { KEYS, getString, setString } from '../core/storage.js';
import { toast } from '../core/toast.js';
import { RECITERS } from '../data/reciters.js';
import { reciterLabel } from './player.js';
import { renderNotifyButton, requestPrayerNotifications } from './prayer.js';
import { READING_THEMES, applyReadingTheme, fontScale, setFontScale } from './reader.js';

const el = {};
let onMemoGoal = () => {};

function fill() {
  const s = getSettings();
  el.font.value = String(Math.round(fontScale() * 10) / 10);
  el.fontValue.textContent = `${el.font.value}rem`;
  el.theme.value = getString(KEYS.readingTheme, 'default');
  el.reciter.replaceChildren(...RECITERS.map((r) => h('option', { value: r.slug, text: reciterLabel(r) })));
  el.reciter.value = document.getElementById('reciterSelect').value || getString(KEYS.reciter, RECITERS[0].slug);
  el.translation.value = s.arTranslation;
  el.tafsir.checked = s.alwaysTafsir;
  el.dailyGoal.value = String(s.dailyGoal);
  el.memoGoal.value = String(loadMemo().plan.dailyTarget);
  el.notifyBefore.value = String(s.notifyBefore);
  renderNotifyButton(el.notifyBtn);
}

const saved = () => toast(t('settings_saved'));

export function initSettingsPanel({ onMemoGoalChange } = {}) {
  onMemoGoal = onMemoGoalChange || (() => {});
  Object.assign(el, {
    font: document.getElementById('setFont'),
    fontValue: document.getElementById('setFontValue'),
    theme: document.getElementById('setReadingTheme'),
    reciter: document.getElementById('setReciter'),
    translation: document.getElementById('setTranslation'),
    tafsir: document.getElementById('setTafsir'),
    dailyGoal: document.getElementById('setDailyGoal'),
    memoGoal: document.getElementById('setMemoGoal'),
    notifyBefore: document.getElementById('setNotifyBefore'),
    notifyBtn: document.getElementById('setNotifyBtn'),
  });
  el.theme.replaceChildren(...READING_THEMES.map((v) => h('option', { value: v, text: t(`reader_theme_${v}`) })));
  el.translation.replaceChildren(...TRANSLATIONS.map((v) => h('option', { value: v, text: t(`settings_tr_${v.replace('.', '_')}`) })));
  el.notifyBefore.replaceChildren(...NOTIFY_CHOICES.map((m) => h('option', { value: String(m), text: t('settings_minutes', { n: m }) })));

  el.font.addEventListener('input', () => { setFontScale(Number(el.font.value)); el.fontValue.textContent = `${el.font.value}rem`; });
  el.font.addEventListener('change', saved);
  el.theme.addEventListener('change', () => { applyReadingTheme(el.theme.value); saved(); });
  el.reciter.addEventListener('change', () => {
    const select = document.getElementById('reciterSelect');
    select.value = el.reciter.value;
    setString(KEYS.reciter, el.reciter.value);
    select.dispatchEvent(new Event('change')); // same behaviour as the player's own selector
    saved();
  });
  el.translation.addEventListener('change', () => { updateSettings({ arTranslation: el.translation.value }); saved(); });
  el.tafsir.addEventListener('change', () => { updateSettings({ alwaysTafsir: el.tafsir.checked }); saved(); });
  el.dailyGoal.addEventListener('change', () => {
    const v = Math.min(1000, Math.max(1, Math.round(Number(el.dailyGoal.value)) || 10));
    el.dailyGoal.value = String(v);
    updateSettings({ dailyGoal: v });
    saved();
  });
  el.memoGoal.addEventListener('change', () => {
    const v = Math.min(200, Math.max(1, Math.round(Number(el.memoGoal.value)) || 5));
    el.memoGoal.value = String(v);
    const memo = loadMemo();
    memo.plan.dailyTarget = v;
    saveMemo(memo);
    onMemoGoal();
    saved();
  });
  el.notifyBefore.addEventListener('change', () => { updateSettings({ notifyBefore: Number(el.notifyBefore.value) }); saved(); });
  el.notifyBtn.addEventListener('click', () => requestPrayerNotifications(el.notifyBtn));

  onDialogOpen('settingsModal', fill);
  onLanguageChange(() => {
    el.theme.replaceChildren(...READING_THEMES.map((v) => h('option', { value: v, text: t(`reader_theme_${v}`) })));
    el.translation.replaceChildren(...TRANSLATIONS.map((v) => h('option', { value: v, text: t(`settings_tr_${v.replace('.', '_')}`) })));
    el.notifyBefore.replaceChildren(...NOTIFY_CHOICES.map((m) => h('option', { value: String(m), text: t('settings_minutes', { n: m }) })));
    if (document.getElementById('settingsModal').open) fill();
  });
}
