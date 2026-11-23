// Personal preferences added by the platform evolution, stored under a NEW key ("userSettings").
// Preferences that already had their own key (theme, lang, reciter, playbackRate, quranFontScale,
// prayerNotify) keep using it; the settings dialog reads and writes those same keys.

import { KEYS, getJSON, setJSON } from './storage.js';

export const DEFAULTS = Object.freeze({
  dailyGoal: 10, // ayahs to read per day
  notifyBefore: 10, // minutes before a prayer (the original fixed value)
  alwaysTafsir: false, // show Tafsir al-Muyassar in every interface language (originally Arabic UI only)
  arTranslation: 'en.sahih', // translation shown under the tafsir in the Arabic interface (original)
});
export const NOTIFY_CHOICES = [5, 10, 15, 20, 30];
export const TRANSLATIONS = ['en.sahih', 'es.cortes', 'fr.hamidullah'];

const listeners = new Set();
export const onSettingsChange = (fn) => listeners.add(fn);

export function getSettings() {
  const raw = getJSON(KEYS.settings, {});
  const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  return {
    dailyGoal: Math.min(1000, Math.max(1, Number(s.dailyGoal) || DEFAULTS.dailyGoal)),
    notifyBefore: NOTIFY_CHOICES.includes(Number(s.notifyBefore)) ? Number(s.notifyBefore) : DEFAULTS.notifyBefore,
    alwaysTafsir: s.alwaysTafsir === true,
    arTranslation: TRANSLATIONS.includes(s.arTranslation) ? s.arTranslation : DEFAULTS.arTranslation,
  };
}

export function updateSettings(partial) {
  const next = { ...getSettings(), ...partial };
  setJSON(KEYS.settings, next);
  for (const fn of listeners) fn(next);
  return next;
}
