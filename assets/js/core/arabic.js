// Arabic text utilities. These are used for MATCHING only — displayed Quran text is never altered,
// except that the basmala prefix of ayah 1 is shown in the header instead of inside the ayah.
// normalizeArabic() mirrors backend/app/services/arabic.py so both search paths agree.

const DIACRITICS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;

export function normalizeArabic(text) {
  return String(text ?? '')
    .replace(/﻿/g, '')
    .replace(DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Letter skeleton used to compare two spellings of the same words (hamza carriers, tatweel, marks). */
export function rasm(text) {
  return String(text ?? '')
    .replace(/﻿/g, '')
    .replace(/[ً-ٰٟۖ-ۭـء]/g, '')
    .replace(/[أإآٱؤئ]/g, 'ا')
    .replace(/[ىی]/g, 'ي')
    .replace(/\s+/g, '');
}

const BASMALA_RASM = rasm('بسم الله الرحمن الرحيم');

/**
 * In the Uthmani source, ayah 1 of every surah except 1 and 9 begins with the basmala.
 * The page shows the basmala as a header, so it is removed from the ayah text here.
 * The comparison is on the letter skeleton of the first four words, because the source
 * encodes them in more than one way (e.g. «بِّسْمِ» in 95:1 and 97:1). The original site
 * compared exact bytes, never matched, and therefore displayed the basmala twice.
 */
export function stripBasmala(text, surahNumber, ayahNumber = 1) {
  if (ayahNumber !== 1 || surahNumber === 1 || surahNumber === 9) return text;
  const words = String(text).split(' ');
  if (words.length > 4 && rasm(words.slice(0, 4).join(' ')) === BASMALA_RASM) {
    return words.slice(4).join(' ');
  }
  return text;
}

/** Normalise an English transliteration for forgiving matching ("Al-Faatiha" ~ "fatiha"). */
export function normalizeLatin(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .replace(/(.)\1+/g, '$1');
}

/** Surah name without the word «سورة» for matching ("الفاتحة" finds «سُورَةُ ٱلْفَاتِحَةِ»). */
export function surahNameKey(nameAr) {
  return normalizeArabic(nameAr).replace(/^سوره\s+/, '');
}

/** The original site's display fix: drop the vowelling on the word «سورة» only. */
export function fixSurahName(text) {
  return String(text).replace('سُورَةُ ', 'سورة ').replace('سُورَةِ ', 'سورة ');
}
