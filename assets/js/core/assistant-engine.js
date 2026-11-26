// Conversation engine of «💬 مساعد الموقع». Pure functions, no DOM and no network: every reply is built from
// the site's own reviewed data (data/assistant/*.js and the lesson passages of core/assistant.js), so the
// assistant cannot invent a ruling, a Quran quotation or a hadith. No AI model and no external API is used.
//
// A message goes through six stages:
//   1. understand  – detect the language, normalise Arabic (diacritics, letter variants, dialect words,
//                    attached conjunctions and pronouns) and Latin text, and extract terms and entities;
//   2. classify    – small talk, follow-up, tafsir/Quran, ruling request, new-Muslim, site or Islamic question…;
//   3. context     – resolve follow-ups («وكيف أستمع إليه؟», "what about that?") with the topic of the
//                    previous turn; the context lives in memory for the current session only;
//   4. retrieve    – rank the website FAQ and the Islamic knowledge base (weighted, IDF-scored index);
//   5. compose     – a structured reply (blocks), in the visitor's language, with sources and follow-ups;
//   6. validate    – drop any block that is malformed or cites an ayah that does not exist.
//
// The renderer (features/assistant.js) only turns these blocks into DOM nodes with textContent.

import { normalizeArabic } from './arabic.js';
import { asksForRuling, stem } from './assistant.js';
import { SURAHS } from '../data/surahs.js';
import { SITE_FAQ, FAQ_CATEGORIES } from '../data/assistant/site-faq.js';
import { ISLAMIC_KB, KB_CATEGORIES } from '../data/assistant/islamic-kb.js';
import { SMALL_TALK, META_FOLLOWUPS } from '../data/assistant/small-talk.js';
import { ENTITIES } from '../data/assistant/entities.js';

export const LANGS = ['ar', 'en', 'es', 'fr'];
const MAX_INPUT = 300;

// ============================================================================ 1. understanding
/** Language of a message: Arabic script wins; otherwise Spanish/French/English markers, else the UI language. */
export function detectLanguage(text, fallback = 'ar') {
  const s = String(text || '');
  const ar = (s.match(/[؀-ۿ]/g) || []).length;
  const latin = (s.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  if (ar && ar >= latin) return 'ar';
  if (!latin) return LANGS.includes(fallback) ? fallback : 'ar';
  const lower = s.toLowerCase();
  const ws = latinWords(s);
  const score = { en: 0, es: 0, fr: 0 };
  for (const w of ws) for (const lang of ['en', 'es', 'fr']) if (MARKERS[lang].has(w)) score[lang] += 1;
  if (/[ñ¿¡]/.test(lower)) score.es += 2;
  if (/[çèêëœ]|\b(qu'|l'|d'|j'|c'|n')/.test(lower)) score.fr += 2;
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  if (best[1] === 0) return fallback === 'ar' ? 'en' : fallback;
  // A tie between the UI language and another one goes to the UI language.
  if (fallback !== 'ar' && score[fallback] === best[1]) return fallback;
  return best[0];
}

const MARKERS = {
  en: new Set('how what where why who the is are do does can i you my me it this that thanks thank hello hi hey please pray prayer become muslim about tell explain more good morning evening bye okay ok yes'.split(' ')),
  es: new Set('como que donde cual quien el los las una por para gracias hola buenos buenas dias tardes noches oracion rezar puedo quiero es soy estas esta musulman mas explicame adios vale si'.split(' ')),
  fr: new Set('comment quoi ou quel quelle qui je suis est les des une pour merci bonjour bonsoir salut priere prier veux peux devenir musulman vous tu ca plus explique oui au revoir'.split(' ')),
};

function latinWords(text) {
  return String(text || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

/** Dialect and spelling variants → one canonical (normalised) form. Applied before stemming. */
const CANON = new Map(Object.entries({
  // interrogatives (dialects)
  وين: 'اين', فين: 'اين', وينه: 'اين', وينها: 'اين', منين: 'اين', شو: 'ما', ايش: 'ما', اش: 'ما', وش: 'ما', شنو: 'ما',
  شلون: 'كيف', كيفاش: 'كيف', ازاي: 'كيف', كيفيه: 'كيف', ليش: 'لماذا', ليه: 'لماذا', امتي: 'متي', اديش: 'كم', قديش: 'كم', كام: 'كم',
  // wants / abilities
  بدي: 'اريد', ابغي: 'اريد', ابي: 'اريد', عايز: 'اريد', عاوز: 'اريد', حابب: 'اريد', حاب: 'اريد', نفسي: 'اريد', اقدر: 'استطيع', بقدر: 'استطيع', بقدرش: 'استطيع', اعرف: 'اعرف', بعرف: 'اعرف',
  مش: 'لا', مو: 'لا', ماني: 'لا', مب: 'لا', بشتغل: 'يعمل', يشتغل: 'يعمل', شغال: 'يعمل', تشتغل: 'يعمل',
  الاقي: 'اجد', القي: 'اجد', الاقيه: 'اجد', الاقيها: 'اجد', لقيت: 'وجدت', يطلع: 'يظهر', تطلع: 'يظهر', طالع: 'يظهر',
  هلق: 'الان', هسا: 'الان', هسه: 'الان', دلوقتي: 'الان', هيك: 'هكذا', كتير: 'كثير', شوي: 'قليل', منيح: 'جيد', مليح: 'جيد', زين: 'جيد', تمام: 'تمام',
  // common misspellings (after normalisation)
  القران: 'القران', قرءان: 'قران', القرءان: 'القران', الصلاه: 'الصلاه', صلاه: 'صلاه', الوضو: 'الوضوء', وضو: 'وضوء', توضي: 'اتوضا', اتوضي: 'اتوضا', اتوضى: 'اتوضا',
  بالله: 'الله', والله: 'الله', لله: 'الله', فالله: 'الله', الموقع: 'موقع', بالموقع: 'موقع', للموقع: 'موقع',
  مسلمه: 'مسلم', مسلما: 'مسلم', مسلمين: 'مسلم', مسلمون: 'مسلم', انشالله: 'ان شاء الله',
}));

const STOP = new Set([
  // Arabic (normalised)
  'ما', 'ماذا', 'لماذا', 'متي', 'اين', 'كيف', 'كم', 'هل', 'من', 'في', 'عن', 'علي', 'الي', 'او', 'ثم', 'و', 'ف', 'هو', 'هي', 'هذا',
  'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'ان', 'انا', 'انت', 'انتي', 'نحن', 'لي', 'لا', 'مع', 'بين', 'كل', 'اي', 'ممكن', 'اريد', 'استطيع',
  'يعني', 'عند', 'قد', 'كان', 'يكون', 'به', 'بها', 'له', 'لها', 'لك', 'منه', 'منها', 'فيه', 'فيها', 'عنه', 'عنها', 'اليه', 'اليها', 'قبل', 'بعد', 'حكم', 'يجوز', 'جايز', 'فتوي', 'شرعا', 'شرعي', 'لو', 'سمحت', 'رجاء', 'من فضلك', 'فضلك', 'يا', 'اذا', 'لكن', 'بس',
  'هكذا', 'الان', 'شيء', 'شي', 'اشي', 'كثير', 'قليل', 'جدا', 'عندي', 'عندكم', 'هناك', 'ايضا', 'كمان', 'برضو', 'اعمل', 'افعل', 'اسوي', 'سوي',
  'اعرف', 'ابدا', 'لم', 'لن', 'قل', 'لنا', 'علينا', 'يمكن', 'يمكنني', 'يمكنك', 'استطيع', 'تستطيع', 'هنا', 'الا', 'غير', 'حتي', 'عندما', 'لما',
  // English / Spanish / French
  'the', 'a', 'an', 'is', 'are', 'am', 'was', 'what', 'how', 'do', 'does', 'did', 'i', 'can', 'could', 'to', 'of', 'in', 'on', 'for', 'and',
  'or', 'my', 'me', 'it', 'its', 'where', 'when', 'why', 'which', 'with', 'about', 'this', 'that', 'there', 'please', 'you',
  'your', 'be', 'should', 'would', 'want', 'need', 'some', 'any', 'tell', 'know', 'get', 'have', 'has', 'if', 'so', 'just', 'also', 'from',
  'que', 'como', 'el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'es', 'por', 'para', 'mi', 'y', 'o', 'le', 'les', 'des', 'du',
  'est', 'comment', 'quoi', 'je', 'ce', 'pour', 'dans', 'et', 'ou', 'quel', 'quelle', 'sur', 'se', 'puedo', 'puis', 'donde', 'cual', 'lo', 'al',
  'me', 'te', 'su', 'sus', 'mis', 'qu', 'il', 'elle', 'on', 'au', 'aux', 'mon', 'ma', 'mes', 'peux', 'veux', 'quiero', 'hay', 'esta', 'esto',
  'faut', 'dois', 'debo', 'tengo', 'que', 'si', 'ne', 'pas', 'no', 'not', 'dont',
]);

/** Remove an attached conjunction (و/ف) when what remains is still a word (وكيف → كيف, وشروط → شروط). */
function dropConjunction(w) {
  if (w.length >= 4 && /^[وف]/.test(w)) {
    const rest = w.slice(1);
    if (STOP.has(rest) || CANON.has(rest) || rest.length >= 4) return rest;
  }
  return w;
}

/** Morphological variants used for matching: the word, its light stem, without pronoun suffix or verb prefix. */
export function variants(word) {
  const out = new Set([word]);
  const s = stem(word);
  out.add(s);
  for (const base of [word, s]) {
    if (base.length >= 5 && /(ها|هم|كم|ني|نا|هن)$/.test(base)) out.add(base.slice(0, -2));
    else if (base.length >= 5 && /[هك]$/.test(base)) out.add(base.slice(0, -1));
    if (base.length >= 5 && /^[اينت]/.test(base)) out.add(base.slice(1)); // أستمع/يستمع/نستمع → ستمع
  }
  if (s.length > 3 && s.endsWith('ه')) out.add(s.slice(0, -1)); // صلاه ~ صلا (الصلوات → صلو is another variant)
  return [...out].filter((v) => v.length >= 2);
}

/** Tokens of a message: normalised, canonicalised, without stop words. Each token keeps its variants. */
export function tokenize(text) {
  const raw = String(text || '');
  const latin = latinWords(raw);
  let arabic = normalizeArabic(raw).split(/[^\p{L}\p{N}]+/u).filter((w) => /[؀-ۿ]/.test(w));
  arabic = arabic.map(dropConjunction).flatMap((w) => (CANON.get(w) || w).split(' '));
  const out = [];
  const seen = new Set();
  for (const w of [...arabic, ...latin]) {
    if (w.length < 2 || STOP.has(w)) continue;
    const s = w === 'الله' ? w : stem(w); // «الله» is a name, not «ال» + «له»
    if (STOP.has(s) || seen.has(s)) continue;
    seen.add(s);
    out.push({ word: w, stem: s, variants: w === 'الله' ? [w] : variants(w) });
  }
  return out;
}

/** Normalised text (spaces kept) for phrase matching. */
export function normalizeText(text) {
  const raw = String(text || '');
  const arabic = normalizeArabic(raw).split(' ').map(dropConjunction).map((w) => CANON.get(w) || w).join(' ');
  return ` ${arabic} ${latinWords(raw).join(' ')} `.replace(/\s+/g, ' ');
}

// ============================================================================ knowledge index
const FIELD = { key: 1.3, q: 1.0, a: 0.3 };

function indexRecord(rec, texts) {
  const weights = new Map();
  const add = (text, w) => {
    for (const tok of tokenize(text)) for (const v of tok.variants) if ((weights.get(v) || 0) < w) weights.set(v, w);
  };
  for (const k of rec.keys || []) add(k, FIELD.key);
  for (const l of LANGS) if (texts.q?.[l]) add(texts.q[l], FIELD.q);
  for (const l of LANGS) if (texts.a?.[l]) add(texts.a[l], FIELD.a);
  // Multi-word keys: all their tokens must be present for a phrase bonus.
  const phrases = (rec.keys || []).map((k) => tokenize(k)).filter((ts) => ts.length > 1);
  // Signatures of the record's own questions and keys: a question asked exactly this way gets a bonus.
  const sigs = new Set([...(rec.keys || []), ...LANGS.map((l) => texts.q?.[l]).filter(Boolean)].map((t) => signature(t)));
  return { rec, weights, phrases, sigs };
}

function buildIndex(records, textsOf) {
  const docs = records.map((r) => indexRecord(r, textsOf(r)));
  const df = new Map();
  for (const d of docs) for (const v of d.weights.keys()) df.set(v, (df.get(v) || 0) + 1);
  const n = docs.length;
  const idf = (v) => Math.log(1 + n / (1 + (df.get(v) || 0)));
  return { docs, idf, unknownIdf: Math.log(1 + n) };
}

/** Kind of question (where / what / how / why / how many), kept apart from the content words. */
const QTYPES = [
  ['where', / (اين|where|donde|ou se trouve|ou est|ou sont|ou trouver) /],
  ['can', / (ماذا|ما) (يمكن\S*|استطيع)| what can | que puedo | que (puis|peux) /],
  ['many', / (كم|how many|how much|cuantos|cuantas|combien) /],
  ['why', / (لماذا|why|por que|pourquoi) /],
  ['how', / (كيف|how|como|comment) /],
  ['what', / (ما|ماذا|من هو|من هي|what|who|que es|quien|qu est ce|quel|quelle|qui est) /],
];
export function questionType(text) {
  const norm = normalizeText(text);
  for (const [type, re] of QTYPES) if (re.test(norm)) return type;
  return '';
}
const signature = (text, qtype = questionType(text)) => `${qtype}|${tokenize(text).map((t) => t.stem).sort().join(' ')}`;

/** Rank the documents of an index for a list of tokens. */
function rank(index, tokens, limit = 5, sig = '') {
  if (!tokens.length) return [];
  const tokIdf = tokens.map((tok) => Math.max(...tok.variants.map((v) => index.idf(v))));
  const total = tokIdf.reduce((s, x) => s + x, 0);
  const out = [];
  for (const d of index.docs) {
    let score = 0;
    let matched = 0;
    let strong = 0; // matched in a question or key, not only in the answer text
    tokens.forEach((tok, i) => {
      let best = 0;
      let bestW = 0;
      for (const v of tok.variants) { const w = d.weights.get(v); if (w && w * index.idf(v) > best) { best = w * index.idf(v); bestW = w; } }
      if (best) { score += best; matched += tokIdf[i]; if (bestW >= FIELD.q) strong += tokIdf[i]; }
    });
    if (!score) continue;
    const exact = !!sig && d.sigs.has(sig);
    if (exact) score += 4;
    for (const ph of d.phrases) {
      if (ph.every((p) => tokens.some((tok) => tok.variants.some((v) => p.variants.includes(v))))) score += 1.5 * ph.length;
    }
    const coverage = matched / total;
    out.push({ rec: d.rec, score, coverage, strong: strong / total, exact, rankScore: score * (0.4 + coverage) });
  }
  return out.sort((a, b) => b.rankScore - a.rankScore).slice(0, limit);
}

// Legacy site-help texts (help_<id>_q / help_<id>) are reused for the FAQ records that point to them.
let LEGACY = {};
/** Give the engine the interface strings of translations-assistant.js (done once by the UI and the tests). */
export function setLegacyStrings(byLang) { LEGACY = byLang || {}; INDEX.site = null; }

export function faqText(rec, lang) {
  if (rec.legacy) {
    const pick = (key) => LEGACY[lang]?.[key] || LEGACY.ar?.[key] || '';
    return { q: pick(`help_${rec.legacy}_q`), a: pick(`help_${rec.legacy}`) };
  }
  return { q: rec.q?.[lang] || rec.q?.en || rec.q?.ar || '', a: rec.a?.[lang] || rec.a?.en || rec.a?.ar || '' };
}
const faqTexts = (rec) => {
  if (!rec.legacy) return { q: rec.q, a: rec.a };
  const q = {}; const a = {};
  for (const l of LANGS) { const t = faqText(rec, l); q[l] = t.q; a[l] = t.a; }
  return { q, a };
};
export const kbText = (rec, lang) => ({
  q: rec.q?.[lang] || rec.q?.en || rec.q?.ar || '',
  a: rec.a?.[lang] || rec.a?.en || rec.a?.ar || '',
  more: rec.more ? rec.more[lang] || rec.more.en || rec.more.ar : '',
});

const INDEX = { site: null, islam: null };
const siteIndex = () => INDEX.site || (INDEX.site = buildIndex(SITE_FAQ, faqTexts));
const islamIndex = () => INDEX.islam || (INDEX.islam = buildIndex(ISLAMIC_KB, (r) => ({ q: r.q, a: r.a })));

export const findFaq = (id) => SITE_FAQ.find((r) => r.id === id) || null;
export const findKb = (id) => ISLAMIC_KB.find((r) => r.id === id) || null;
export const findRecord = (id) => findFaq(id) || findKb(id);

/** Best website FAQ records for a question (exported for tests and for the islamic-search feature). */
export const searchFaq = (question, limit = 3) => rank(siteIndex(), tokenize(question), limit, signature(question));
export const searchIslamic = (question, limit = 3) => rank(islamIndex(), tokenize(question), limit, signature(question));

// ============================================================================ entities (topics)
/** Topics mentioned in a message (quran, prayer, wudu…), best first. Used for follow-up resolution. */
export function entitiesOf(text) {
  const norm = normalizeText(text);
  const toks = tokenize(text);
  const found = [];
  for (const [id, ent] of Object.entries(ENTITIES)) {
    const hit = ent.words.some((w) => {
      const nw = normalizeText(w).trim();
      if (nw.includes(' ')) return norm.includes(` ${nw} `);
      return toks.some((tok) => tok.variants.includes(nw) || tok.variants.includes(stem(nw)));
    });
    if (hit) found.push(id);
  }
  return found;
}

// ============================================================================ 2. classification
const RE = {
  // Messages that try to change the assistant's rules. The assistant has no model to "jailbreak"; it says so.
  injection: /(ignore|disregard|forget)\s+(all\s+|the\s+|your\s+)?(previous|prior|above)?\s*(instructions|rules|prompt)|system prompt|jailbreak|act as|pretend (to be|you are)|تجاهل (كل )?(التعليمات|الاوامر|القواعد)|انس (كل )?(التعليمات|القواعد)|تصرف ك|انت الان/i,
  referenceNumber: /(?:^|[^\d])(\d{1,3})\s*[:：]\s*(\d{1,3})(?:[^\d]|$)/,
  tafsirWord: /(تفسير|فسر|معني|معنا|شرح|تدبر|meaning|tafsir|tafseer|explain the (surah|ayah|verse)|significado|signification|sens de)/,
  followPronoun: /( اليه | اليها | فيه | فيها | منه | منها | عنه | عنها | به | بها | هذا | هذه | ذلك | تلك | هاد | هاي | هذي | هيدا | it | that | this | them | those | eso | esto | cela | ca | ce )/,
  followLead: /^ ?(و|ف)?(كيف|ماذا|ما|هل|كم|متي|اين|لماذا|طيب|طب|ايضا|كمان) /,
  followEn: /^ ?(and|what about|how about|y|et|and how|and what|and where|what if|y si|et si|et comment|y como) /,
};

/** Surah named in a message («سورة الكهف», «الفاتحة», "Al-Kahf", "surah 18"), or null. */
export function findSurah(text) {
  const norm = normalizeText(text);
  const num = /(?:سوره|surah|sura|sourate|surat)\s*(?:رقم|number|n°|no\.?)?\s*(\d{1,3})\b/i.exec(norm);
  if (num && Number(num[1]) >= 1 && Number(num[1]) <= 114) return Number(num[1]);
  for (const [n, aliases] of SURAH_ALIASES) for (const a of aliases) if (norm.includes(` ${a} `)) return n;
  return null;
}

const SURAH_ALIASES = (() => {
  const list = SURAHS.map(([n, ar, en]) => {
    const name = normalizeArabic(ar).replace(/^سوره /, '');
    const bare = name.replace(/^ال/, '');
    const set = new Set([`سوره ${name}`, `سوره ${bare}`]);
    if (name.length >= 4) set.add(name);
    const latin = latinWords(en).join(' ');
    set.add(`surah ${latin}`); set.add(`sura ${latin}`); set.add(`sourate ${latin}`);
    if (latin.length >= 5) set.add(latin);
    return [n, [...set]];
  });
  // Well-known names that differ from the dataset spelling.
  const extra = { 1: ['فاتحه', 'الفاتحه', 'fatiha', 'fatihah', 'al fatiha', 'al fatihah', 'ام الكتاب', 'ام القران'], 2: ['البقره'], 36: ['يس', 'سوره يس', 'yasin', 'ya sin'], 18: ['الكهف', 'kahf', 'al kahf'], 67: ['الملك', 'تبارك', 'mulk', 'al mulk'], 112: ['الاخلاص', 'ikhlas', 'al ikhlas'], 113: ['الفلق', 'falaq'], 114: ['الناس', 'an nas', 'al nas'], 55: ['الرحمن', 'rahman', 'ar rahman'], 56: ['الواقعه', 'waqiah', 'waqia'], 103: ['العصر', 'al asr'], 97: ['القدر', 'al qadr'], 108: ['الكوثر', 'kawthar'] };
  for (const [n, names] of Object.entries(extra)) list[Number(n) - 1][1].push(...names);
  // Longer aliases first, so «سوره ال عمران» wins over «عمران».
  return list.map(([n, a]) => [n, a.sort((x, y) => y.length - x.length)]);
})();

/** Ayah reference in a message: «2:255», «آية الكرسي», «الآية 5 من سورة البقرة». */
export function findAyahRef(text) {
  const norm = normalizeText(text);
  const m = RE.referenceNumber.exec(String(text));
  if (m) {
    const s = Number(m[1]); const a = Number(m[2]);
    if (isValidRef(s, a)) return { surah: s, ayah: a };
  }
  if (/ (ايه|اية) الكرسي | ayat al kursi | ayatul kursi | kursi /.test(norm)) return { surah: 2, ayah: 255 };
  const surah = findSurah(text);
  if (surah) {
    const n = /(?:ايه|الايه|ayah|verse|aleya|verset)\s*(?:رقم)?\s*(\d{1,3})/.exec(norm);
    if (n && isValidRef(surah, Number(n[1]))) return { surah, ayah: Number(n[1]) };
  }
  return null;
}

export const ayahCount = (s) => SURAHS[s - 1]?.[5] ?? 0;
export const isValidRef = (s, a) => Number.isInteger(s) && Number.isInteger(a) && s >= 1 && s <= 114 && a >= 1 && a <= ayahCount(s);
/** Global ayah number (1–6236) used by the verified editions. */
export function globalAyahId(s, a) {
  let n = 0;
  for (let i = 0; i < s - 1; i++) n += SURAHS[i][5];
  return n + a;
}

/** Small-talk phrases found in a message, and what remains once they are removed. */
export function matchSmallTalk(text, { leadOnly = false } = {}) {
  let norm = normalizeText(text);
  const hits = [];
  for (const intent of SMALL_TALK) {
    if (leadOnly && intent.standalone) continue;
    for (const p of intent.patterns) {
      const np = normalizeText(p).trim();
      if (!np) continue;
      if (norm.includes(` ${np} `)) {
        if (!hits.includes(intent)) hits.push(intent);
        norm = norm.replace(` ${np} `, ' ');
      }
    }
  }
  return { hits, rest: norm.trim() };
}

function matchMeta(text) {
  const norm = normalizeText(text);
  for (const m of META_FOLLOWUPS) for (const p of m.patterns) if (norm.includes(` ${normalizeText(p).trim()} `)) return m;
  return null;
}

/**
 * Classify a message. Returns { intent, ... } with one of:
 * empty · injection · smalltalk · meta · tafsir · ruling · new_muslim · site · islamic · followup · unclear
 */
export function classify(text, ctx = newContext()) {
  const raw = String(text || '').slice(0, MAX_INPUT);
  if (!raw.trim() || !/[\p{L}\p{N}]/u.test(raw)) return { intent: 'empty' };
  if (RE.injection.test(normalizeText(raw)) || RE.injection.test(raw)) return { intent: 'injection' };
  let talk = matchSmallTalk(raw);
  let restTokens = tokenize(talk.rest);
  // «الحمد لله»، «تمام»، «ممتاز»… are small talk only on their own; inside a question they are part of it.
  if (restTokens.length) { talk = matchSmallTalk(raw, { leadOnly: true }); restTokens = tokenize(talk.rest); }
  const meta = matchMeta(raw);
  if (meta && restTokens.length <= 2 && ctx.lastId) return { intent: 'meta', meta, smalltalk: talk.hits };
  if (talk.hits.length && !restTokens.length) return { intent: 'smalltalk', smalltalk: talk.hits };
  const question = talk.hits.length ? talk.rest : raw;
  const tafsirAsked = RE.tafsirWord.test(normalizeText(question));
  const ref = findAyahRef(question);
  const surah = findSurah(question);
  if (ref && (tafsirAsked || /^\s*\d{1,3}\s*[:：]\s*\d{1,3}\s*$/.test(question))) return { intent: 'tafsir', ref, smalltalk: talk.hits, question };
  if (tafsirAsked && surah) return { intent: 'tafsir', ref: { surah, ayah: null }, smalltalk: talk.hits, question };
  if (meta && ctx.lastId) return { intent: 'meta', meta, smalltalk: talk.hits };
  return { intent: 'question', smalltalk: talk.hits, question, ruling: asksForRuling(question) };
}

// ============================================================================ 3. context
export function newContext() { return { lastId: null, lastDomain: null, entity: null, entities: [], turns: 0, lastTafsir: null }; }

/** Remember the topic of this turn (most recent first, at most three, no repeats). */
function pushEntity(ctx, ...ids) {
  for (const id of ids.filter(Boolean).reverse()) {
    ctx.entities = [id, ...ctx.entities.filter((e) => e !== id)].slice(0, 3);
  }
  ctx.entity = ctx.entities[0] || null;
}

/** 0 = not a follow-up, 1 = probably (short or starts with «و…»), 2 = refers back with a pronoun. */
function followUpLevel(text, tokens) {
  const norm = normalizeText(text);
  if (RE.followPronoun.test(norm)) return 2;
  // Attached object pronouns on a verb: أحفظه، أستخدمها، أقرأه
  if (tokens.some((t) => /^[اينت].{2,}(ه|ها|هم)$/.test(t.word))) return 2;
  if (RE.followLead.test(norm) || RE.followEn.test(norm)) return 1;
  return tokens.length <= 2 ? 1 : 0;
}

// ============================================================================ 4. retrieval
const SITE_HINT = /( زر | اضغط | اين اجد | الاقي | اجد | استخدم | قسم | صفحه | تطبيق | الموقع | موقع | site | website | sitio | web | الاعدادات | يعمل | يظهر | button | click | tap | use | section | page | app | feature | settings | botón | pulsar | usar | sección | bouton | utiliser | appuyer | rubrique )/;
const ISLAM_HINT = /( الله | الاسلام | اسلام | مسلم | النبي | الرسول | محمد | الايمان | ايمان | الشهاده | الجنه | النار | القيامه | الملائكه | التوحيد | islam | muslim | allah | prophet | faith | iman | shahada | angels | paradise | musulman | profeta | prophete | fe | foi )/;

function retrieve(question, tokens) {
  const norm = normalizeText(question);
  const sig = `${questionType(question)}|${tokens.map((t) => t.stem).sort().join(' ')}`;
  const site = rank(siteIndex(), tokens, 4, sig);
  const islam = rank(islamIndex(), tokens, 4, sig);
  const siteBoost = SITE_HINT.test(norm) ? 1.25 : 1;
  const islamBoost = ISLAM_HINT.test(norm) && !SITE_HINT.test(norm) ? 1.2 : 1;
  for (const r of site) r.final = r.rankScore * siteBoost;
  for (const r of islam) r.final = r.rankScore * islamBoost;
  const all = [...site.map((r) => ({ ...r, domain: 'site' })), ...islam.map((r) => ({ ...r, domain: 'islam' }))]
    .sort((a, b) => b.final - a.final);
  return all;
}

/** A retrieval result is trusted only when enough of the question is covered. */
const confident = (r, nTokens) => !!r && (r.exact || (r.coverage >= (nTokens <= 2 ? 0.99 : 0.45) && r.strong >= 0.4 && r.score >= 1.2));

// ============================================================================ 5. compose
function textBlocks(text) {
  // Lines starting with «•» or «1.» become a list; other lines are paragraphs.
  const blocks = [];
  let list = null;
  for (const line of String(text || '').split('\n').map((l) => l.trim()).filter(Boolean)) {
    const m = /^(?:•|\d+[.)-])\s*(.+)$/.exec(line);
    if (m) {
      if (!list) { list = { type: 'steps', ordered: /^\d/.test(line), items: [] }; blocks.push(list); }
      list.items.push(m[1]);
    } else { list = null; blocks.push({ type: 'text', text: line }); }
  }
  return blocks;
}

function followupsFor(rec, lang) {
  return (rec.related || []).map(findRecord).filter(Boolean).slice(0, 3).map((r) => ({
    label: (r.legacy ? faqText(r, lang).q : (r.q?.[lang] || r.q?.en || r.q?.ar)),
    id: r.id,
  })).filter((f) => f.label);
}

function composeFaq(rec, lang) {
  const { q, a } = faqText(rec, lang);
  const blocks = [{ type: 'title', text: q, icon: rec.icon || FAQ_CATEGORIES[rec.cat]?.icon || '💡' }, ...textBlocks(a)];
  if (rec.action) blocks.push({ type: 'action', action: rec.action });
  if (rec.lesson) blocks.push({ type: 'lesson', lessonId: rec.lesson });
  return { domain: 'site', recordId: rec.id, blocks, followups: followupsFor(rec, lang), entity: rec.entity || null };
}

function composeKb(rec, lang, { more = false } = {}) {
  const { q, a, more: extra } = kbText(rec, lang);
  const blocks = [{ type: 'title', text: q, icon: rec.icon || KB_CATEGORIES[rec.cat]?.icon || '🕌' }];
  if (rec.ruling) blocks.push({ type: 'notice', key: 'asst_ruling_notice' });
  blocks.push(...textBlocks(a));
  if (more && extra) blocks.push(...textBlocks(extra));
  if (rec.shahada) blocks.push({ type: 'shahada' });
  for (const ref of rec.quran || []) {
    const [s, ay] = ref.ref.split(':').map(Number);
    blocks.push({ type: 'quran', surah: s, ayah: ay, to: ref.to || ay, note: ref.note?.[lang] || ref.note?.en || '' });
  }
  for (const hd of rec.hadith || []) blocks.push({ type: 'hadith', text: hd.text, source: hd.source, search: hd.search, meaning: hd.meaning?.[lang] || '' });
  if (rec.scholars) blocks.push({ type: 'notice', key: 'asst_consult_scholars', tone: 'info' });
  if (rec.action) blocks.push({ type: 'action', action: rec.action });
  if (rec.lesson) blocks.push({ type: 'lesson', lessonId: rec.lesson });
  blocks.push({ type: 'sources', items: sourceList(rec) });
  return { domain: 'islam', recordId: rec.id, blocks, followups: followupsFor(rec, lang), entity: rec.entity || null, next: rec.next || null };
}

function sourceList(rec) {
  const items = [];
  if (rec.quran?.length) items.push({ key: 'asst_src_quran' });
  if (rec.hadith?.length) items.push({ key: 'asst_src_hadith' });
  for (const s of rec.sources || []) items.push(s);
  if (rec.lesson) items.push({ key: 'asst_src_lesson' });
  return items;
}

/** Context-aware answer for one message. `ctx` is updated in place. */
export function respond(text, ctx = newContext(), { uiLang = 'ar' } = {}) {
  const raw = String(text || '').trim().slice(0, MAX_INPUT);
  const lang = detectLanguage(raw, uiLang);
  const cls = classify(raw, ctx);
  const reply = { lang, intent: cls.intent, blocks: [], followups: [], passagesQuery: null, quranSearch: null };
  ctx.turns += 1;
  const greet = (hits) => {
    for (const h of hits || []) {
      const r = h.reply[lang] || h.reply.en;
      reply.blocks.push({ type: 'talk', text: Array.isArray(r) ? r[ctx.turns % r.length] : r });
    }
  };

  if (cls.intent === 'empty') {
    reply.blocks.push({ type: 'text', key: 'asst_empty' });
    return validate(reply);
  }
  if (cls.intent === 'injection') {
    reply.blocks.push({ type: 'text', key: 'asst_injection' });
    reply.followups = starterFollowups();
    return validate(reply);
  }
  if (cls.intent === 'smalltalk') {
    greet(cls.smalltalk);
    const offers = cls.smalltalk.some((h) => h.offerHelp);
    if (offers) reply.followups = starterFollowups();
    reply.intent = 'smalltalk';
    return validate(reply);
  }
  if (cls.intent === 'meta') {
    greet(cls.smalltalk);
    return validate(answerMeta(cls.meta, ctx, lang, reply));
  }
  greet(cls.smalltalk);
  if (cls.intent === 'tafsir') {
    reply.intent = 'tafsir';
    reply.blocks.push({ type: 'tafsir', surah: cls.ref.surah, ayah: cls.ref.ayah });
    ctx.lastTafsir = cls.ref; ctx.lastDomain = 'quran'; pushEntity(ctx, 'tafsir', 'quran');
    // A KB record about this surah (e.g. Al-Fatihah) adds its sourced overview.
    const surahRec = ISLAMIC_KB.find((r) => r.surah === cls.ref.surah && !cls.ref.ayah);
    if (surahRec) { const c = composeKb(surahRec, lang); reply.blocks.push(...c.blocks.filter((b) => b.type !== 'title')); reply.followups = c.followups; ctx.lastId = surahRec.id; reply.recordId = surahRec.id; }
    return validate(reply);
  }

  // A question (possibly a follow-up).
  const question = cls.question;
  let tokens = tokenize(question);
  const ents = entitiesOf(question);
  let results = retrieve(question, tokens);
  let top = results[0];
  let usedContext = false;
  const level = ctx.entities.length ? followUpLevel(question, tokens) : 0;
  // A follow-up is completed with a recent topic: «وكيف أستمع إليه؟» after «كيف أقرأ القرآن؟» → + «القرآن».
  // With a pronoun («إليه»، «أحفظه») the topic is added even if the message names its own verb/topic.
  if (level && !(top && top.exact)) {
    for (const entId of ctx.entities.slice(0, 2)) {
      const ent = ENTITIES[entId];
      if (!ent || ents.includes(entId)) continue;
      if (level < 2 && ents.length) continue;
      const aug = [...tokens, ...tokenize(ent.words[0])];
      const augResults = retrieve(`${question} ${ent.words[0]}`, aug);
      const a = augResults[0];
      if (!a || a.rec.id === ctx.lastId || !confident(a, aug.length)) continue;
      const better = !confident(top, tokens.length) || a.final > top.final * (level === 2 ? 0.9 : 1.05);
      if (better) { results = augResults; top = a; tokens = aug; usedContext = entId; break; }
    }
  }
  reply.usedContext = !!usedContext;

  if (cls.ruling) {
    reply.intent = 'ruling';
    reply.blocks.push({ type: 'notice', key: 'asst_ruling_notice' });
  }
  // Verbatim passages of the site's lessons accompany Islamic answers, rulings, lesson-based FAQ and misses.
  const passages = cls.ruling || !confident(top, tokens.length) || top.domain === 'islam' || !!top.rec.lesson;
  if (confident(top, tokens.length)) {
    const rec = top.rec;
    const c = top.domain === 'site' ? composeFaq(rec, lang) : composeKb(rec, lang);
    if (cls.ruling) c.blocks = c.blocks.filter((b) => !(b.type === 'notice' && b.key === 'asst_ruling_notice'));
    reply.blocks.push(...c.blocks);
    reply.followups = c.followups;
    reply.recordId = rec.id;
    if (reply.intent === 'question') reply.intent = rec.cat === 'new_muslim' ? 'new_muslim' : (top.domain === 'site' ? 'site' : 'islamic');
    ctx.lastId = rec.id; ctx.lastDomain = top.domain;
    pushEntity(ctx, usedContext || ents[0], c.entity);
    // A second, clearly different good match is offered as a follow-up.
    const second = results.find((r) => r.rec.id !== rec.id && confident(r, tokens.length) && r.final >= top.final * 0.8);
    if (second && !reply.followups.some((f) => f.id === second.rec.id)) {
      const label = second.domain === 'site' ? faqText(second.rec, lang).q : kbText(second.rec, lang).q;
      reply.followups.unshift({ label, id: second.rec.id });
    }
  } else if (ents.length) {
    pushEntity(ctx, ents[0]);
  }
  if (passages) reply.passagesQuery = question;
  if (!confident(top, tokens.length)) {
    reply.intent = cls.ruling ? 'ruling' : 'unknown';
    reply.quranSearch = question;
    reply.noAnswerFallback = true; // the UI shows «لم أجد…» if the lesson passages are empty too
    if (cls.ruling) reply.blocks.push({ type: 'notice', key: 'asst_consult_scholars', tone: 'info' });
  }
  reply.followups = reply.followups.slice(0, 4);
  return validate(reply);
}

/** Answer a known record directly (a follow-up chip was pressed): no retrieval, so no misrouting. */
export function respondRecord(id, ctx = newContext(), { uiLang = 'ar' } = {}) {
  const lang = LANGS.includes(uiLang) ? uiLang : 'ar';
  const faq = findFaq(id);
  const kb = faq ? null : findKb(id);
  const reply = { lang, intent: faq ? 'site' : 'islamic', blocks: [], followups: [], passagesQuery: null, quranSearch: null };
  if (!faq && !kb) { reply.blocks.push({ type: 'text', key: 'asst_meta_nothing' }); reply.followups = starterFollowups(); return validate(reply); }
  const c = faq ? composeFaq(faq, lang) : composeKb(kb, lang);
  reply.blocks = c.blocks; reply.followups = c.followups; reply.recordId = id;
  if (kb?.cat === 'new_muslim') reply.intent = 'new_muslim';
  if (kb || faq.lesson) reply.passagesQuery = faq ? faqText(faq, 'ar').q : kbText(kb, 'ar').q;
  ctx.turns += 1; ctx.lastId = id; ctx.lastDomain = faq ? 'site' : 'islam'; pushEntity(ctx, c.entity);
  return validate(reply);
}

function answerMeta(meta, ctx, lang, reply) {
  const rec = findRecord(ctx.lastId);
  reply.intent = 'followup';
  if (!rec) { reply.blocks.push({ type: 'text', key: 'asst_meta_nothing' }); reply.followups = starterFollowups(); return reply; }
  const isKb = !!findKb(rec.id);
  if (meta.kind === 'next') {
    const next = findRecord(rec.next) || findRecord(rec.related?.[0]);
    if (next) {
      reply.blocks.push({ type: 'text', key: 'asst_meta_next' });
      const c = findKb(next.id) ? composeKb(next, lang) : composeFaq(next, lang);
      reply.blocks.push(...c.blocks); reply.followups = c.followups;
      ctx.lastId = next.id; pushEntity(ctx, c.entity);
      return reply;
    }
  }
  if (meta.kind === 'simpler') {
    reply.blocks.push({ type: 'text', key: 'asst_meta_simpler' });
    const { a } = isKb ? kbText(rec, lang) : faqText(rec, lang);
    const first = textBlocks(a).slice(0, 2);
    reply.blocks.push(...first);
    reply.followups = followupsFor(rec, lang);
    return reply;
  }
  // "more"
  if (isKb && rec.more) {
    reply.blocks.push({ type: 'text', key: 'asst_meta_more' });
    reply.blocks.push(...textBlocks(kbText(rec, lang).more));
    reply.blocks.push({ type: 'sources', items: sourceList(rec) });
  } else {
    reply.blocks.push({ type: 'text', key: 'asst_meta_related' });
    reply.passagesQuery = isKb ? kbText(rec, 'ar').q : faqText(rec, 'ar').q;
  }
  reply.followups = followupsFor(rec, lang);
  if (!reply.followups.length) reply.followups = starterFollowups();
  return reply;
}

export const STARTERS = ['asst_s1', 'asst_s2', 'asst_s3', 'asst_s4', 'asst_s5', 'asst_s6'];
const starterFollowups = () => STARTERS.map((key) => ({ key }));

// ============================================================================ 6. validation
const ACTION_KEYS = new Set(['dialog', 'anchor', 'run', 'href']);
const RUNS = new Set(['plan', 'rosary', 'theme', 'language']);

/** Remove anything malformed: unknown block types, invalid ayah references, unsourced hadith, bad actions. */
export function validate(reply) {
  const ok = [];
  for (const b of reply.blocks) {
    if (!b || typeof b !== 'object') continue;
    switch (b.type) {
      case 'title': case 'text': case 'talk':
        if ((typeof b.text === 'string' && b.text.trim()) || typeof b.key === 'string') ok.push(b);
        break;
      case 'steps':
        if (Array.isArray(b.items) && b.items.length && b.items.every((x) => typeof x === 'string' && x.trim())) ok.push(b);
        break;
      case 'notice': case 'shahada': if (b.type === 'shahada' || typeof b.key === 'string') ok.push(b); break;
      case 'quran':
        if (isValidRef(b.surah, b.ayah) && isValidRef(b.surah, b.to) && b.to >= b.ayah && b.to - b.ayah < 10) ok.push(b);
        break;
      case 'tafsir':
        if (Number.isInteger(b.surah) && b.surah >= 1 && b.surah <= 114 && (b.ayah == null || isValidRef(b.surah, b.ayah))) ok.push(b);
        break;
      case 'hadith':
        if (typeof b.text === 'string' && /(رواه|متفق عليه|أخرجه)/.test(b.source || '') && typeof b.search === 'string') ok.push(b);
        break;
      case 'action': {
        const a = b.action || {};
        const keys = Object.keys(a);
        if (keys.length === 1 && ACTION_KEYS.has(keys[0]) && (keys[0] !== 'run' || RUNS.has(a.run))
          && (keys[0] !== 'href' || /^[a-z0-9-]+\.html$/.test(a.href)) && (keys[0] !== 'anchor' || /^#[A-Za-z][\w-]*$/.test(a.anchor))) ok.push(b);
        break;
      }
      case 'lesson': if (typeof b.lessonId === 'string') ok.push(b); break;
      case 'sources': if (Array.isArray(b.items) && b.items.length) ok.push(b); break;
      default: break;
    }
  }
  reply.blocks = ok;
  if (!LANGS.includes(reply.lang)) reply.lang = 'ar';
  reply.followups = (reply.followups || []).filter((f) => f && (typeof f.key === 'string' || (typeof f.label === 'string' && f.label.trim() && typeof f.id === 'string')));
  return reply;
}

// Exposed for tests.
export const _internal = { rank, siteIndex, islamIndex, followUpLevel, confident, retrieve, SURAH_ALIASES };
