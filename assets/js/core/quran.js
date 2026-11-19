// Surah metadata helpers (static data: no network needed to list the 114 surahs).

import { SURAHS } from '../data/surahs.js';
import { fixSurahName } from './arabic.js';
import { isArabic, t } from './i18n.js';

/** @typedef {{number:number, nameAr:string, nameEn:string, meaning:string, revelation:string, ayahCount:number}} Surah */

/** @type {Surah[]} */
export const surahs = SURAHS.map(([number, nameAr, nameEn, meaning, revelation, ayahCount]) => ({
  number, nameAr, nameEn, meaning, revelation, ayahCount,
}));

export const getSurahMeta = (n) => surahs[Number(n) - 1] ?? null;

/** Name in the interface language (Arabic name without vowelled «سورة», as the original showed). */
export function surahName(n) {
  const s = getSurahMeta(n);
  if (!s) return '';
  return isArabic() ? fixSurahName(s.nameAr) : s.nameEn;
}

/** Secondary line: English name in Arabic UI; English meaning otherwise (as the original). */
export function surahSubtitle(n) {
  const s = getSurahMeta(n);
  if (!s) return '';
  const main = isArabic() ? s.nameEn : s.meaning;
  return `${main} · ${t(`revelation_${s.revelation}`)} · ${t('surah_ayahs', { n: s.ayahCount })}`;
}
