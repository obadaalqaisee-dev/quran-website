// «مساعد الموقع» — a site assistant that runs entirely in the browser, with no AI model and no network request
// for its own answers.
//
// 1. Site help: questions such as «كيف أسمّع سورة؟» are matched against a fixed list of topics. Each topic's
//    answer is written in the interface strings (four languages) and comes with a button that opens the feature.
// 2. Islamic questions: answered ONLY with passages that already exist in the site's verified content (the
//    prayer curriculum, the academy, Hisn al-Muslim and «رسالة الإسلام»), each with its source. Nothing is
//    generated: when nothing relevant is found, the assistant says so and refers the visitor to scholars.
//    Questions asking for a ruling (حكم، يجوز، حلال، حرام، فتوى…) always carry a "this is not a fatwa" notice.
//
// Pure functions (no DOM), so matching and ranking are unit-tested.

import { normalizeArabic } from './arabic.js';

// ------------------------------------------------------------------------------------------ text
const STOP = new Set([
  // Arabic (normalised forms)
  'ما', 'ماذا', 'لماذا', 'متي', 'اين', 'وين', 'كيف', 'كيفيه', 'كم', 'هل', 'من', 'في', 'عن', 'علي', 'الي', 'او', 'ثم',
  'هو', 'هي', 'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'ان', 'انا', 'انت', 'لي', 'لا', 'مع', 'بين', 'كل', 'اي', 'شو',
  'ممكن', 'اريد', 'بدي', 'ابي', 'اعرف', 'اعمل', 'يعني', 'عند', 'قد', 'كان', 'يكون', 'به', 'بها', 'له', 'لها', 'الموقع',
  'قبل', 'بعد', 'حكم', 'يجوز', 'جايز', 'فتوي', 'شرعا', 'شرعي',
  // English / Spanish / French
  'the', 'a', 'an', 'is', 'are', 'what', 'how', 'do', 'does', 'i', 'can', 'to', 'of', 'in', 'on', 'for', 'and', 'or',
  'my', 'me', 'it', 'where', 'when', 'why', 'which', 'with', 'about', 'site', 'website', 'que', 'como', 'el', 'la', 'los',
  'las', 'de', 'del', 'en', 'un', 'una', 'es', 'por', 'para', 'mi', 'y', 'o', 'le', 'les', 'des', 'du', 'est', 'comment',
  'quoi', 'je', 'ce', 'pour', 'dans', 'et', 'ou', 'quel', 'quelle', 'sur', 'se', 'puedo', 'puis',
]);

/** Light Arabic stem: drop the article with an attached conjunction/preposition, and plural endings
 *  (والصلاة → صلاه، الصلوات → صلو). Deterministic, so a word and its key always stem alike. */
export function stem(word) {
  let w = word;
  if (w.length > 4 && /^(و|ف|ب|ك|ل)ال/.test(w)) w = w.slice(3);
  else if (w.length > 3 && w.startsWith('ال')) w = w.slice(2);
  else if (w.length > 4 && w.startsWith('لل')) w = w.slice(2);
  if (w.length > 4 && /(ات|ون|ين)$/.test(w)) w = w.slice(0, -2);
  return w;
}

/** Words of a text: Arabic normalised; Latin lower-cased without accents (word boundaries kept). */
function words(text) {
  const latin = String(text || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const latinWords = latin.split(/[^a-z0-9]+/).filter(Boolean); // the Arabic is covered by normalizeArabic
  const arabicWords = normalizeArabic(text).split(/[^\p{L}\p{N}]+/u).filter((w) => /[؀-ۿ]/.test(w));
  return [...arabicWords, ...latinWords];
}

/** Meaningful search terms of a question (normalised, stop words removed, stemmed). */
export function terms(question) {
  const out = [];
  for (const w of words(question)) {
    if (w.length < 2 || STOP.has(w)) continue;
    const s = stem(w);
    if (s.length >= 2 && !STOP.has(s) && !out.includes(s)) out.push(s);
  }
  return out;
}

/** Text prepared once for matching: every word and its stem. */
export function indexText(text) {
  return new Set(words(text).flatMap((w) => [w, stem(w)]));
}

/** Questions asking for a religious ruling: the answer always says the site issues no fatwas. */
const RULING = /(حكم|يجوز|جايز|حلال|حرام|فتوي|فتوه|مكروه|واجب|بدعه|halal|haram|ruling|fatwa|allowed|permissible|permitido|licito|licite|interdit|permis)/;
export const asksForRuling = (question) => RULING.test(words(question).join(' '));

// ------------------------------------------------------------------------------------- site help
/**
 * Help topics. `keys` are matched against the question (any language); the answer is the interface string
 * `help_<id>`; `action` is what the button does: { dialog }, { anchor } or { run } (handled by the UI).
 */
export const HELP_TOPICS = [
  { id: 'read', icon: '📖', action: { anchor: '#surahs' }, keys: ['اقرا', 'قراءه', 'مصحف', 'افتح سوره', 'read', 'mushaf', 'leer', 'lire', 'lecture'] },
  { id: 'listen', icon: '🎧', action: { anchor: '#audio' }, keys: ['استمع', 'اسمع', 'تلاوه', 'قارئ', 'قراء', 'شيخ', 'صوت', 'listen', 'reciter', 'audio', 'escuchar', 'recitador', 'ecouter', 'recitateur'] },
  { id: 'ayah_audio', icon: '🔁', action: { anchor: '#surahs' }, keys: ['تكرار', 'كرر', 'ايه وحده', 'repeat', 'loop', 'repetir', 'repeter'] },
  { id: 'tafsir', icon: '📚', action: { anchor: '#surahs' }, keys: ['تفسير', 'معني', 'ترجمه', 'tafsir', 'meaning', 'translation', 'significado', 'traduccion', 'sens', 'traduction'] },
  { id: 'memorize', icon: '🎙️', action: { dialog: 'voiceTestModal' }, keys: ['احفظ', 'حفظ', 'تسميع', 'سمع', 'اسمع حفظي', 'memorize', 'memorise', 'hifz', 'recite', 'اسمع سوره', 'اسمع حفظ', 'memorizar', 'recitar', 'memoriser', 'reciter'] },
  { id: 'mic', icon: '🎚️', action: { dialog: 'voiceTestModal' }, keys: ['مايك', 'ميكروفون', 'مكرفون', 'microphone', 'mic', 'microfono', 'micro'] },
  { id: 'revision', icon: '🔄', action: { run: 'plan' }, keys: ['مراجعه', 'راجع', 'خطه', 'خطتي', 'revision', 'review', 'plan', 'repaso', 'revision'] },
  { id: 'bookmark', icon: '🔖', action: { anchor: '#surahs' }, keys: ['علامه', 'اخر قراءه', 'وقفت', 'اكمل', 'bookmark', 'continue', 'marcador', 'continuar', 'signet', 'reprendre'] },
  { id: 'notes', icon: '📝', action: { dialog: 'notesModal' }, keys: ['ملاحظه', 'ملاحظات', 'مجموعه', 'تصنيف', 'note', 'notes', 'collection', 'nota', 'coleccion'] },
  { id: 'prayer_times', icon: '🕌', action: { anchor: '#prayerSection' }, keys: ['مواقيت', 'وقت الصلاه', 'اوقات', 'اذان', 'فجر', 'ظهر', 'عصر', 'مغرب', 'عشاء', 'prayer time', 'times', 'adhan', 'horario', 'horaires'] },
  { id: 'notify', icon: '🔔', action: { dialog: 'settingsModal' }, keys: ['تنبيه', 'اشعار', 'اشعارات', 'منبه', 'notification', 'notify', 'reminder', 'notificacion', 'aviso', 'rappel'] },
  { id: 'adhkar', icon: '📿', action: { dialog: 'adhkarModal' }, keys: ['اذكار', 'ذكر', 'حصن', 'صباح', 'مساء', 'نوم', 'dhikr', 'adhkar', 'morning', 'evening', 'manana', 'tarde', 'matin', 'soir'] },
  { id: 'rosary', icon: '📿', action: { run: 'rosary' }, keys: ['مسبحه', 'سبحه', 'تسبيح', 'عداد', 'rosary', 'tasbih', 'counter', 'rosario', 'chapelet'] },
  { id: 'learn_prayer', icon: '🕋', action: { anchor: '#learnSection' }, keys: ['تعلم الصلاه', 'صفه الصلاه', 'كيف اصلي', 'اصلي', 'وضوء', 'learn prayer', 'how to pray', 'pray', 'wudu', 'rezar', 'oracion', 'prier', 'priere'] },
  { id: 'academy', icon: '🎓', action: { anchor: '#academySection' }, keys: ['اكاديميه', 'دوره', 'دورات', 'دروس', 'درس', 'تجويد', 'academy', 'course', 'lesson', 'tajweed', 'academia', 'curso', 'leccion', 'academie', 'cours', 'lecon'] },
  { id: 'search', icon: '🔍', action: { dialog: 'ayahSearchModal' }, keys: ['ابحث', 'بحث', 'اجد ايه', 'search', 'find', 'buscar', 'chercher', 'recherche'] },
  { id: 'settings', icon: '⚙️', action: { dialog: 'settingsModal' }, keys: ['اعدادات', 'خط', 'حجم الخط', 'تكبير', 'settings', 'font', 'size', 'ajustes', 'fuente', 'parametres', 'police'] },
  { id: 'theme', icon: '🌙', action: { run: 'theme' }, keys: ['ليلي', 'داكن', 'مظلم', 'فاتح', 'dark', 'night', 'light mode', 'oscuro', 'nocturne', 'sombre'] },
  { id: 'language', icon: '🌐', action: { run: 'language' }, keys: ['لغه', 'انجليزي', 'عربي', 'language', 'english', 'arabic', 'idioma', 'langue', 'anglais'] },
  { id: 'insights', icon: '📊', action: { anchor: '#insightsTitle' }, keys: ['تقدمي', 'احصائيات', 'تحليل', 'بصيره', 'ختمه', 'اختم', 'progress', 'statistics', 'khatma', 'progreso', 'estadisticas', 'progression', 'statistiques'] },
  { id: 'backup', icon: '💾', action: { dialog: 'profileModal' }, keys: ['نسخه احتياطيه', 'احتياطي', 'انقل', 'جهاز اخر', 'استعاده', 'backup', 'restore', 'transfer', 'copia', 'sauvegarde', 'restaurer'] },
  { id: 'favorites', icon: '⭐', action: { dialog: 'favoritesModal' }, keys: ['مفضله', 'المفضله', 'favorite', 'favourite', 'favorito', 'favori'] },
  { id: 'install', icon: '📲', action: null, keys: ['تثبيت', 'تطبيق', 'شاشه رئيسيه', 'بدون انترنت', 'اوفلاين', 'install', 'app', 'offline', 'instalar', 'aplicacion', 'installer', 'hors ligne'] },
  { id: 'sleep', icon: '⏲️', action: { anchor: '#audio' }, keys: ['مؤقت', 'نوم', 'ايقاف تلقائي', 'قائمه تشغيل', 'sleep', 'timer', 'queue', 'temporizador', 'minuterie'] },
  { id: 'wird', icon: '✅', action: { anchor: '#dashboardSection' }, keys: ['ورد', 'وردي', 'هدف يومي', 'هدف', 'wird', 'daily goal', 'goal', 'meta', 'objectif'] },
  { id: 'about', icon: '🕊️', action: { href: 'about.html' }, keys: ['من انتم', 'من انا', 'المطور', 'طورو', 'نشيد', 'تواصل', 'about', 'developer', 'contact', 'acerca', 'propos'] },
];

const TOPIC_INDEX = HELP_TOPICS.map((topic) => ({
  topic,
  keys: topic.keys.map((k) => terms(k)).filter((ts) => ts.length),
}));

/**
 * Site-help topics matching a question, best first. A key made of several words matches only when all of
 * them are in the question; multi-word keys and exact (unstemmed) hits count more.
 */
export function matchHelp(question, limit = 3) {
  const q = new Set(terms(question));
  if (!q.size) return [];
  const scored = [];
  for (const { topic, keys } of TOPIC_INDEX) {
    let score = 0;
    for (const ks of keys) if (ks.every((k) => q.has(k))) score += ks.length;
    if (score > 0) scored.push({ topic, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.topic);
}

// ------------------------------------------------------------------------------ verified knowledge
/**
 * Turn the site's verified content into citable passages:
 * lessons ({ id, icon, title, blocks }), adhkar ({ category: [{ text, count }] }) and extra sections
 * ([{ id, title, text, source }]). Quran blocks contribute their reference and note only: the ayah text
 * itself is always shown from the verified dataset by the lesson, never stored here.
 */
export function buildKnowledge({ lessons = [], adhkar = {}, adhkarTitles = {}, sections = [] } = {}) {
  const passages = [];
  const titleText = (title) => (title && typeof title === 'object' ? Object.values(title).join(' ') : title || '');
  const push = (p) => { if (p.text && p.text.trim()) passages.push({ ...p, words: indexText(`${titleText(p.title)} ${p.text}`) }); };
  for (const lesson of lessons) {
    for (const block of lesson.blocks || []) {
      const base = { kind: 'lesson', lessonId: lesson.id, icon: lesson.icon, title: lesson.title };
      if (['p', 'note', 'diff'].includes(block.type)) push({ ...base, text: block.text, diff: block.type === 'diff' });
      else if (block.type === 'ul' || block.type === 'ol') push({ ...base, text: block.items.join(' • ') });
      else if (block.type === 'hadith') push({ ...base, text: `${block.text} (${block.source})${block.note ? ` ${block.note}` : ''}` });
      else if (block.type === 'facts') push({ ...base, text: block.items.map((x) => (Array.isArray(x) ? x.join(': ') : x)).join(' • ') });
      else if (block.type === 'quran' && block.note) push({ ...base, text: `﴿${block.ref}﴾ ${block.note}`, ref: block.ref });
    }
    // The lesson's own quiz: question, correct answer and its explanation (already reviewed content).
    for (const item of Array.isArray(lesson.quiz) ? lesson.quiz : []) {
      const answer = item.options?.[item.answer];
      if (typeof item.q === 'string' && answer) push({ kind: 'lesson', lessonId: lesson.id, icon: lesson.icon, title: lesson.title, text: `${item.q} — ${answer}. ${item.explain || ''}`.trim() });
    }
  }
  for (const [category, list] of Object.entries(adhkar)) {
    list.forEach((d, i) => push({ kind: 'dhikr', category, index: i, title: adhkarTitles[category], text: d.text, count: d.count }));
  }
  for (const s of sections) push({ kind: 'section', ...s });
  return passages;
}

/**
 * Rank passages for a question. Score = matched terms (title matches count double for lessons), and at
 * least half of the question's terms (minimum one) must match, so a single common word is not enough.
 */
export function searchKnowledge(passages, question, limit = 5) {
  const q = terms(question);
  if (!q.length) return [];
  const need = Math.max(1, Math.ceil(q.length / 2));
  const out = [];
  for (const p of passages) {
    const hits = q.filter((t) => p.words.has(t));
    if (hits.length < need) continue;
    const titleWords = p.title ? indexText(typeof p.title === 'object' ? Object.values(p.title).join(' ') : p.title) : null;
    const titleHits = titleWords ? q.filter((t) => titleWords.has(t)).length : 0;
    out.push({ passage: p, score: hits.length * 2 + titleHits - (p.diff ? 0.5 : 0), hits });
  }
  // Keep at most two passages per lesson (or adhkar category), so different sources are shown.
  const perSource = new Map();
  return out.sort((a, b) => b.score - a.score).filter((r) => {
    const key = r.passage.lessonId || r.passage.category || r.passage.id;
    const n = perSource.get(key) || 0;
    perSource.set(key, n + 1);
    return n < 2;
  }).slice(0, limit);
}

/** Short excerpt around the first matched term. */
export function excerpt(text, hits = [], max = 260) {
  if (text.length <= max) return text;
  const norm = normalizeArabic(text);
  let at = -1;
  for (const h of hits) { at = norm.indexOf(h); if (at >= 0) break; }
  // normalizeArabic removes diacritics, so positions are approximate: start a little before.
  const start = Math.max(0, Math.min(text.length - max, at < 0 ? 0 : Math.floor(at * (text.length / Math.max(1, norm.length))) - 60));
  return `${start > 0 ? '… ' : ''}${text.slice(start, start + max).trim()}${start + max < text.length ? ' …' : ''}`;
}
