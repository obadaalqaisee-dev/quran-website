// Recitation comparison engine (pure functions, no DOM): compares what the speech recogniser heard
// with the selected ayah, word by word.
//
// * The canonical Quran text is NEVER modified: normalisation produces comparison keys only, and
//   every result word carries the original Uthmani word for display.
// * Speech recognisers write Modern Standard spelling, the Mushaf uses the Uthmani rasm, and the two
//   differ in long vowels, hamza seats, alef forms and ta marbuta. Keys are built so these spelling
//   differences do not count as mistakes, while a different word still does.
// * Alignment is a word-level edit distance (Levenshtein) with a back-trace, which yields the
//   correct / missing / substituted / repeated / extra classification and the reciter's position.
//
// Limitation (stated in the interface): this compares WORDS. It cannot judge tajweed, makharij or
// vowelling, because browser speech recognition returns plain words, not pronunciation.

// Harakat, tanween, shadda, sukun, dagger alef, Quranic annotation marks, tatweel, small high letters.
const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭ࣓-ࣿـ]/g;
// Quranic punctuation and ornaments: ayah end, rub' el hizb, sajda, ornate parentheses, digits.
const PUNCT = /[۝۞۩﴾﴿٠-٩۰-۹0-9.,،؛:!?؟"'()[\]{}«»\-–—…]/g;

/** Comparison form of one word: no marks, unified alef/hamza/ya/ta-marbuta. Display text is untouched. */
export function normalizeWord(word) {
  return String(word ?? '')
    .replace(/﻿/g, '')
    .replace(MARKS, '')
    .replace(PUNCT, '')
    .replace(/[أإآٱٲٳ]/g, 'ا') // alef with hamza above/below, madda, wasla → bare alef
    .replace(/[ىیۍ]/g, 'ي') // alef maqsura / Persian ya → ya
    .replace(/ة/g, 'ه') // ta marbuta → ha (ASR writes either)
    .replace(/ؤ/g, 'و') // hamza on waw
    .replace(/ئ/g, 'ي') // hamza on ya
    .replace(/\s+/g, '')
    .trim();
}

/** Consonantal skeleton: also drops standalone hamza and long vowels (Uthmani vs. standard spelling). */
export function wordSkeleton(word) {
  const n = normalizeWord(word).replace(/ء/g, '');
  // Keep a word-initial alef (the article «ال» and words like «اذا») so «ال…» stays distinguishable.
  const head = n.startsWith('ا') ? 'ا' : '';
  return head + n.slice(head.length).replace(/[اوي]/g, '');
}

/** Split a text into words, dropping punctuation-only tokens (ayah markers etc.). */
export function tokenize(text) {
  return String(text ?? '').split(/\s+/).filter((w) => normalizeWord(w).length > 0);
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return m || n;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/**
 * How well a heard word matches an expected word.
 * @returns {'exact'|'spelling'|'close'|null}  exact = same letters; spelling = same skeleton (Uthmani vs.
 *   standard spelling); close = one-letter slip of the recogniser on a longer word; null = different word.
 */
export function compareWords(expected, heard) {
  const e = normalizeWord(expected);
  const h = normalizeWord(heard);
  if (!e || !h) return null;
  if (e === h) return 'exact';
  const se = wordSkeleton(expected);
  const sh = wordSkeleton(heard);
  if (se && se === sh) return 'spelling';
  // A single letter difference on words of 4+ letters is usually a recogniser slip (e.g. «ص» / «س»).
  if (Math.min(e.length, h.length) >= 4 && levenshtein(e, h) === 1) return 'close';
  if (Math.min(se.length, sh.length) >= 3 && levenshtein(se, sh) === 1 && Math.abs(e.length - h.length) <= 1) return 'close';
  return null;
}

/**
 * Align a heard transcript with an expected ayah.
 *
 * @param {string} expectedText canonical ayah text (Uthmani)
 * @param {string} heardText    transcript from the speech recogniser
 * @returns {{
 *   words: {text:string, status:'correct'|'missing'|'substituted'|'pending', heard?:string, match?:string}[],
 *   extras: {heard:string, after:number, repeated:boolean}[],
 *   substitutions: {index:number, expected:string, heard:string}[],
 *   missing: number[], repeated: string[],
 *   position: number, matched: number, total: number, coverage: number,
 *   complete: boolean, onTrack: boolean, heardCount: number,
 * }}
 * `position` is the index of the next expected word (where the reciter is now); words after it that
 * were not reached yet are 'pending', not 'missing', so feedback during recitation is not premature.
 */
export function alignRecitation(expectedText, heardText) {
  const exp = tokenize(expectedText);
  const heard = tokenize(heardText);
  const m = exp.length;
  const n = heard.length;
  // DP over (expected i, heard j). Cost: match 0, substitution 1, deletion 1, insertion 1.
  const cost = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  const kind = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
  for (let i = 1; i <= m; i += 1) cost[i][0] = i;
  for (let j = 1; j <= n; j += 1) cost[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const match = compareWords(exp[i - 1], heard[j - 1]);
      const diag = cost[i - 1][j - 1] + (match ? 0 : 1);
      const del = cost[i - 1][j] + 1;
      const ins = cost[i][j - 1] + 1;
      const best = Math.min(diag, del, ins);
      cost[i][j] = best;
      kind[i][j] = best === diag ? (match ? `m:${match}` : 's') : best === del ? 'd' : 'i';
    }
  }

  // Back-trace. Trailing expected words the reciter has not reached yet must not count against them,
  // so the end point is the cell of row-minimum cost in the last column (best prefix of the ayah).
  let endI = m;
  if (n > 0) {
    let best = Infinity;
    for (let i = 0; i <= m; i += 1) {
      // cost of aligning all heard words with exp[0..i), the rest of the ayah still pending
      const c = cost[i][n];
      if (c < best || (c === best && i > endI)) { best = c; endI = i; }
    }
  } else {
    endI = 0;
  }

  const words = exp.map((text) => ({ text, status: 'pending' }));
  const extras = [];
  let i = endI;
  let j = n;
  while (i > 0 || j > 0) {
    const k = i > 0 && j > 0 ? kind[i][j] : (i > 0 ? 'd' : 'i');
    if (k && k.startsWith('m:')) {
      words[i - 1] = { text: exp[i - 1], status: 'correct', heard: heard[j - 1], match: k.slice(2) };
      i -= 1; j -= 1;
    } else if (k === 's') {
      words[i - 1] = { text: exp[i - 1], status: 'substituted', heard: heard[j - 1] };
      i -= 1; j -= 1;
    } else if (k === 'd') {
      words[i - 1] = { text: exp[i - 1], status: 'missing' };
      i -= 1;
    } else {
      extras.unshift({ heard: heard[j - 1], after: i - 1, repeated: false });
      j -= 1;
    }
  }

  // An inserted word equal to the expected word just before it (or to the previous heard word) is a
  // repetition («قل هو هو الله»), which is not a mistake in meaning, only reported for information.
  // The alignment may place the duplicate on either side of its twin, so both neighbours are checked.
  for (const extra of extras) {
    const prevExpected = extra.after >= 0 ? exp[extra.after] : null;
    const nextExpected = exp[extra.after + 1] ?? null;
    if ((prevExpected && compareWords(prevExpected, extra.heard)) || (nextExpected && compareWords(nextExpected, extra.heard))) {
      extra.repeated = true;
    }
  }
  for (let x = 1; x < extras.length; x += 1) {
    if (!extras[x].repeated && compareWords(extras[x - 1].heard, extras[x].heard)) extras[x].repeated = true;
  }

  const matched = words.filter((w) => w.status === 'correct').length;
  const position = endI;
  const total = m;
  const coverage = total ? matched / total : 0;
  const needed = total <= 2 ? total : Math.ceil(total * 0.7);
  const lastReached = position === total && words[total - 1]?.status === 'correct';
  return {
    words,
    extras,
    substitutions: words.map((w, index) => ({ ...w, index })).filter((w) => w.status === 'substituted')
      .map((w) => ({ index: w.index, expected: w.text, heard: w.heard })),
    missing: words.map((w, index) => (w.status === 'missing' ? index : -1)).filter((x) => x >= 0),
    repeated: extras.filter((e) => e.repeated).map((e) => e.heard),
    position,
    matched,
    total,
    coverage,
    complete: total > 0 && matched >= needed && lastReached,
    onTrack: total > 0 && (words[0]?.status === 'correct' || coverage >= 0.5),
    heardCount: n,
  };
}

/** Strict standard used by self-test mode: every word recited (spelling variants allowed). */
export const isPerfect = (analysis) => analysis.total > 0 && analysis.matched === analysis.total;

/** Score 0–100 for history and self-tests. Extras that are not repetitions cost half a word. */
export function recitationScore(analysis) {
  if (!analysis.total) return 0;
  const penalties = analysis.extras.filter((e) => !e.repeated).length * 0.5;
  return Math.max(0, Math.round(((analysis.matched - penalties) / analysis.total) * 100));
}
