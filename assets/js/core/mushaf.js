// Juz / page / sajda lookups for any ayah, from the generated index (data/quran-index.js).

import { JUZ_STARTS, PAGE_STARTS, SAJDA } from '../data/quran-index.js';

const before = ([s1, a1], [s2, a2]) => s1 < s2 || (s1 === s2 && a1 < a2);

/** Index of the last start position that is not after (surah, ayah). */
function lastStart(starts, surah, ayah) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (before([surah, ayah], starts[mid])) hi = mid - 1; else lo = mid;
  }
  return lo;
}

export const juzOf = (surah, ayah) => lastStart(JUZ_STARTS, surah, ayah) + 1;
export const pageOf = (surah, ayah) => lastStart(PAGE_STARTS, surah, ayah) + 1;
const SAJDA_SET = new Set(SAJDA.map(([s, a]) => `${s}:${a}`));
export const isSajda = (surah, ayah) => SAJDA_SET.has(`${surah}:${ayah}`);
export const juzStart = (n) => JUZ_STARTS[n - 1] ?? null;
export const pageStart = (n) => PAGE_STARTS[n - 1] ?? null;
