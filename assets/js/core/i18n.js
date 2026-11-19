import { translations, LANGUAGES } from '../data/translations.js';
import { $$ } from './dom.js';
import { KEYS, getString, setString } from './storage.js';

let current = 'ar';
const listeners = new Set();

export const getLang = () => current;
export const isArabic = () => current === 'ar';

/** Translate a key, substituting {placeholders}. Falls back to Arabic, then to the key. */
export function t(key, vars) {
  let value = translations[current]?.[key] ?? translations.ar[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, String(v));
  return value;
}

const HAS_MARKUP = /<[a-z][\s\S]*>/i;

/** Apply translations to [data-i18n], [data-i18n-placeholder|-aria-label|-title] inside root. */
export function applyTranslations(root = document) {
  for (const el of $$('[data-i18n]', root)) {
    const value = t(el.dataset.i18n);
    // Only the static strings in translations.js can contain markup (<strong>, <span>).
    if (HAS_MARKUP.test(value)) el.innerHTML = value;
    else el.textContent = value;
  }
  for (const attr of ['placeholder', 'aria-label', 'title']) {
    const data = `i18n${attr.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())}`;
    for (const el of $$(`[data-i18n-${attr}]`, root)) el.setAttribute(attr, t(el.dataset[data]));
  }
}

export function setLanguage(lang, { persist = true } = {}) {
  current = LANGUAGES.includes(lang) ? lang : 'ar';
  const html = document.documentElement;
  html.lang = current;
  html.dir = current === 'ar' ? 'rtl' : 'ltr';
  if (persist) setString(KEYS.lang, current);
  applyTranslations();
  for (const fn of listeners) fn(current);
}

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Initial language: saved choice, else Arabic (the site's primary language, as before). */
export function initialLanguage() {
  const saved = getString(KEYS.lang);
  return LANGUAGES.includes(saved) ? saved : 'ar';
}

/** Locale for Intl formatting. */
export const locale = () => ({ ar: 'ar', en: 'en', es: 'es', fr: 'fr' })[current];
