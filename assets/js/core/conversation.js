// Conversation engine of the site assistant. Deterministic and local: no AI model, no network request, so the
// same question always gets the same reviewed answer, and nothing a visitor types can change the assistant's
// behaviour ("prompt injection" has nothing to act on: the input is only ever matched against fixed keywords).
//
//  * smallTalk(text)          greetings, thanks, "how are you"… in Arabic, English, Spanish and French
//  * tokenize(text)           normalised words with light Arabic stemming (prefixes و ف ب ل ال, attached pronouns)
//  * buildIndex(entries)      prepares knowledge-base entries once
//  * matchEntries(index, q)   ranks entries for a question
//  * isFollowUp(text)         "وكيف أستمع إليه؟", "and how do I memorise it?", "more"…
//  * respond(index, text, context) → { kind, greeting, entries, context } — the whole decision, unit-tested.
//
// Pure functions (no DOM); tests/unit/platform.test.mjs covers them.

import { normalizeArabic } from './arabic.js';

// ------------------------------------------------------------------------------------------ tokens
const STOP = new Set([
  'ما', 'ماذا', 'لماذا', 'متي', 'اين', 'وين', 'كيف', 'كيفيه', 'كم', 'هل', 'من', 'في', 'عن', 'علي', 'الي', 'او', 'ثم', 'يا',
  'هو', 'هي', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'ان', 'انا', 'انت', 'لي', 'لا', 'مع', 'كل', 'اي', 'شو', 'ايش', 'وش',
  'ممكن', 'اريد', 'بدي', 'ابي', 'ابغي', 'اعرف', 'يعني', 'عند', 'قد', 'كان', 'يكون', 'به', 'بها', 'له', 'لها', 'الموقع',
  'ارجو', 'لو', 'سمحت', 'اذا', 'الان', 'اليه', 'عليه', 'فيه', 'منه', 'ذلك', 'هنا',
  'the', 'a', 'an', 'is', 'are', 'what', 'how', 'do', 'does', 'i', 'can', 'to', 'of', 'in', 'on', 'for', 'and', 'or',
  'my', 'me', 'it', 'where', 'when', 'why', 'which', 'with', 'about', 'site', 'website', 'please', 'you', 'your', 'this',
  'that', 'be', 'there', 'should', 'would', 'could', 'tell', 'want', 'need', 'get', 'any', 'way',
  'que', 'como', 'el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'es', 'por', 'para', 'mi', 'y', 'o', 'lo', 'puedo',
  'le', 'les', 'des', 'du', 'est', 'comment', 'quoi', 'je', 'ce', 'pour', 'dans', 'et', 'ou', 'quel', 'quelle', 'sur', 'se', 'puis',
]);

const PRONOUN_SUFFIX = /(هما|هم|ها|كم|نا|ني|ه|ك)$/;

/** Variants of one normalised Arabic word: itself, without a conjunction/preposition/article, without a pronoun. */
function arabicVariants(word) {
  const out = new Set([word]);
  let w = word;
  if (w.length > 3 && /^[وف]/.test(w)) { w = w.slice(1); out.add(w); }
  if (w.length > 4 && /^(بال|كال|لل)/.test(w)) { w = w.slice(w.startsWith('لل') ? 2 : 3); out.add(w); }
  else if (w.length > 3 && w.startsWith('ال')) { w = w.slice(2); out.add(w); }
  else if (w.length > 3 && /^[بل]/.test(w) && !/^(بي|لي)/.test(w)) out.add(w.slice(1));
  for (const v of [...out]) {
    if (v.length > 4 && PRONOUN_SUFFIX.test(v)) out.add(v.replace(PRONOUN_SUFFIX, ''));
    if (v.length > 4 && /(ات|ون|ين)$/.test(v)) out.add(v.slice(0, -2));
  }
  return [...out];
}

/** Words of a text (Arabic normalised; Latin lower-cased without accents), stop words removed. */
export function tokenize(text) {
  const raw = String(text ?? '').slice(0, 500);
  const latin = raw.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const arabic = normalizeArabic(raw).split(/[^\p{L}\p{N}]+/u).filter((w) => /[؀-ۿ]/.test(w));
  const out = [];
  for (const w of arabic) {
    if (STOP.has(w) || w.length < 2) continue;
    const variants = arabicVariants(w).filter((v) => v.length >= 2 && !STOP.has(v));
    if (variants.length) out.push(variants);
  }
  for (const w of latin) if (!STOP.has(w) && (w.length >= 2 || /\d/.test(w))) out.push([w.replace(/s$/, '').length >= 3 ? w.replace(/s$/, '') : w, w]);
  return out; // [[variants of word 1], [variants of word 2], …]
}



/** Does keyword word `k` match one of the question's word variants? Exact, or prefix of 4+ letters. */
function wordMatches(k, variants) {
  for (const v of variants) {
    if (v === k) return true;
    if (k.length >= 4 && v.length >= 4 && (v.startsWith(k) || k.startsWith(v)) && Math.abs(v.length - k.length) <= 3) return true;
  }
  return false;
}

// ------------------------------------------------------------------------------------------ index & matching
/** Prepare entries once: each keyword becomes a list of word variants; the question texts are indexed too. */
const canonical = (variants) => variants[variants.length > 1 && /[؀-ۿ]/.test(variants[0]) ? variants.length - 1 : 0];

export function buildIndex(entries) {
  return entries.map((entry) => {
    const seen = new Set();
    const keys = [];
    for (const k of entry.k || []) {
      const ks = tokenize(k).map(canonical);
      const id = ks.join(' ');
      if (ks.length && !seen.has(id)) { seen.add(id); keys.push(ks); }
    }
    // The entry's own questions, one word list per language (a visitor often types almost the same words).
    const questions = Object.values(entry.q || {}).map((x) => tokenize(x).map(canonical)).filter((ws) => ws.length);
    return { entry, keys, questions };
  });
}

/**
 * Score every entry for a question:
 *  - keywords: the best matching keyword counts (3 per word; a keyword of several words needs all of them),
 *    each further matching keyword adds 1 (at most 3), so long keyword lists do not win by sheer number;
 *  - the entry's own question: 1.5 per question word found, +2 when the question covers nearly all of it.
 * `subject` (from the context) gives a small bonus to entries on the same subject (follow-up questions).
 */
export function matchEntries(index, question, { subject = null, limit = 4, extraTokens = [] } = {}) {
  const asked = tokenize(question);
  const tokens = [...asked, ...extraTokens];
  if (!tokens.length) return [];
  const has = (k) => tokens.some((variants) => wordMatches(k, variants));
  const scored = [];
  for (const item of index) {
    const matched = item.keys.filter((ks) => ks.every(has)).map((ks) => ks.length * 3).sort((a, b) => b - a);
    const kwScore = matched.length ? matched[0] + Math.min(matched.length - 1, 3) : 0;
    let qScore = 0;
    for (const words of item.questions) {
      const hits = asked.filter((variants) => words.some((w) => wordMatches(w, variants))).length;
      const coverage = asked.length ? hits / asked.length : 0;
      const own = words.length ? hits / words.length : 0;
      qScore = Math.max(qScore, hits * 1.5 + (coverage >= 0.75 && own >= 0.6 && hits >= 2 ? 2 : 0));
    }
    if (kwScore === 0 && qScore < 3) continue;
    let score = kwScore + qScore;
    if (subject && item.entry.subject === subject) score += 1.5;
    scored.push({ entry: item.entry, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ------------------------------------------------------------------------------------------ small talk
const SMALL_TALK = [
  // order matters: the reply to «السلام عليكم» is checked before «السلام عليكم» itself
  { id: 'salam_reply', re: /^(و\s*عليكم\s*السلام|وعليكم السلام|wa\s*alaikum|wa\s*alaykum|walaikum|wa\s*alaikoum)/i },
  { id: 'salam', re: /^(السلام\s*عليكم|سلام\s*عليكم|السلام عليكم|سلام|as+alam+u?\s*alai?kum|salam+u?\s*alai?kum|assalamualaikum|salam|salaam)/i },
  { id: 'morning', re: /^(صباح\s*الخير|صباح\s*النور|good\s*morning|buenos\s*dias|bonjour)/i },
  { id: 'evening', re: /^(مساء\s*الخير|مساء\s*النور|good\s*(evening|night)|buenas\s*(tardes|noches)|bonsoir|bonne\s*nuit)/i },
  { id: 'hello', re: /^(مرحبا|اهلا\s*و\s*سهلا|اهلا|هلا|hi|hello|hey|hola|salut|coucou)(?=\s|$)/i },
  { id: 'how_are_you', re: /(كيف\s*(حالك|الحال|انت|أنت)|شلونك|كيفك|how\s*are\s*you|how\s*r\s*u|que\s*tal|como\s*estas|comment\s*(vas|allez)|ca\s*va)/i },
  { id: 'jazak', re: /(جزاك\s*الله|جزاكم\s*الله|بارك\s*الله\s*في|jazak|jazakallah|jzk)/i },
  { id: 'thanks', re: /^(شكرا|شكرًا|شكراً|مشكور|يعطيك العافيه|يعطيك العافية|thanks|thank\s*you|thx|gracias|merci)/i },
  { id: 'bye', re: /^(مع\s*السلامه|مع السلامة|الي\s*اللقاء|إلى اللقاء|في\s*امان\s*الله|bye|goodbye|see\s*you|adios|au\s*revoir)/i },
  { id: 'ok', re: /^(تمام|حسنا|حسنًا|طيب|ok|okay|good|great|bien|vale|d'accord)[\s!.؟?]*$/i },
  { id: 'insha', re: /^(ان\s*شاء\s*الله|إن\s*شاء\s*الله|inshallah|in\s*sha\s*allah)[\s!.]*$/i },
  { id: 'alhamd', re: /^(الحمد\s*لله|الحمدلله|بخير|alhamdulillah|i\s*am\s*(fine|good|well))[\s!.]*$/i },
];

const clean = (text) => normalizeArabic(String(text ?? '')).replace(/[!?.,،؟؛:]+/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Small talk at the start of a message: { id, rest } where `rest` is what follows the greeting
 * («السلام عليكم، كيف أقرأ القرآن؟» → id 'salam', rest «كيف أقرأ القرآن»), or null.
 */
export function smallTalk(text) {
  const raw = String(text ?? '').replace(/[!?.,،؟؛:]+/g, ' ').replace(/\s+/g, ' ').trim();
  const norm = clean(text);
  for (const item of SMALL_TALK) {
    for (const candidate of [norm, raw]) {
      const m = item.re.exec(candidate);
      if (!m) continue;
      // "how are you" may sit anywhere; the others must start the message.
      const rest = item.id === 'how_are_you' ? candidate.replace(m[0], ' ') : candidate.slice(m.index + m[0].length);
      const after = rest.replace(/^\s*(و\s*)?(رحمه\s*الله(\s*وبركاته)?|ورحمه\s*الله(\s*وبركاته)?|wa\s*rahmatullah\S*(\s*wa\s*barakatuh\S*)?|يا\s*\S+)\s*/i, '').trim();
      return { id: item.id, rest: after };
    }
  }
  return null;
}

// ------------------------------------------------------------------------------------------ follow-ups
const FOLLOW_START = /^(و|ف)\s*(كيف|ماذا|ما|هل|اين|متي|لماذا|كم|من)(?=\s|$)|^(وكيف|وماذا|وما|وهل|واين|ومتي|ولماذا|وكم|طيب|طب|يعني|and|also|what about|how about|then|y |et |e )/i;
const MORE = /^(اكثر|المزيد|وضح|اشرح|تفاصيل|زدني|كمل|more|tell me more|details|explain|go on|mas|plus)(?=\s|$)/i;

const BACK_REFS = new Set(['اليه', 'عليه', 'فيه', 'منه', 'عنه', 'له', 'به', 'اليها', 'عليها', 'فيها', 'منها', 'عنها', 'لها', 'بها']);

export function isFollowUp(text) {
  const norm = clean(text).toLowerCase();
  if (!norm) return false;
  if (FOLLOW_START.test(norm) || MORE.test(norm)) return true;
  // short questions that refer back with a pronoun: «أحفظه؟», «how do I memorise it?»
  // («المسبحه» or «الزكاه» end with ه too, but they are nouns with the article, not a verb + pronoun.)
  const words = norm.split(' ');
  if (words.length > 4) return false;
  if (words.some((w) => BACK_REFS.has(w))) return true;
  const last = words[words.length - 1];
  return (/^[اينت]\S{2,}(ه|ها|هم)$/.test(last) && !last.startsWith('ال')) || /\b(it|this|that|them)\b/.test(norm);
}
export const wantsMore = (text) => MORE.test(clean(text).toLowerCase());

/** Subject words carried into a follow-up question (e.g. «القرآن» after a question about reading the Quran). */
export const SUBJECT_TERMS = {
  quran: ['قران'], memorize: ['حفظ'], prayer: ['صلاه'], prayer_times: ['صلاه', 'مواقيت'], adhkar: ['اذكار'],
  islam: ['اسلام'], new_muslim: ['اسلام', 'مسلم'], seerah: ['نبي'], fasting: ['صيام'], zakat: ['زكاه'], hajj: ['حج'],
  purification: ['طهاره'], journey: ['رحله'], notes: ['ملاحظات'], progress: ['تقدم'], settings: ['اعدادات'],
};

// ------------------------------------------------------------------------------------------ decision
/**
 * Decide how to answer. `context` is { lastId, subject, turns } from the previous answer (or null).
 * Returns { kind: 'smalltalk'|'answer'|'more'|'none', greeting, entries: [{entry, score}], followUp, context }.
 * Only the top entry is the answer; the others are offered as related questions.
 */
export function respond(index, text, context = null, { threshold = 3 } = {}) {
  const input = String(text ?? '').trim().slice(0, 300);
  const talk = smallTalk(input);
  const greeting = talk?.id ?? null;
  const question = talk ? talk.rest : input;
  const ctx = { lastId: context?.lastId ?? null, subject: context?.subject ?? null, turns: (context?.turns ?? 0) + 1 };
  if (!question || tokenize(question).length === 0) {
    return { kind: greeting ? 'smalltalk' : 'none', greeting, entries: [], followUp: false, context: ctx };
  }
  const followUp = !!context?.subject && isFollowUp(question);
  if (followUp && wantsMore(question) && context.lastId) {
    return { kind: 'more', greeting, entries: [], followUp, context: ctx };
  }
  const extra = followUp ? (SUBJECT_TERMS[context.subject] || []).map((w) => [w]) : [];
  let entries = matchEntries(index, question, { subject: followUp ? context.subject : null, extraTokens: extra });
  // A follow-up should move on: do not answer the same entry twice in a row when another one matches well.
  if (followUp && entries.length > 1 && entries[0].entry.id === context.lastId && entries[1].score >= threshold) {
    entries = [entries[1], entries[0], ...entries.slice(2)];
  }
  entries = entries.filter((r) => r.score >= threshold);
  if (!entries.length) return { kind: greeting ? 'smalltalk' : 'none', greeting, entries: [], followUp, context: ctx, question };
  const top = entries[0].entry;
  return { kind: 'answer', greeting, entries, followUp, context: { ...ctx, lastId: top.id, subject: top.subject || ctx.subject }, question };
}
