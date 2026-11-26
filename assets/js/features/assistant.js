// «💬 مساعد الموقع» dialog: the conversation UI. The answers are built by core/assistant-engine.js (pure, no
// network) from the site's reviewed data; this module only renders the reply blocks. Every string is inserted
// with textContent (h() children), never as HTML — including what the visitor types.
//
// Network use: none for the answers themselves. Ayah texts, the Tafsir al-Muyassar and translations shown in a
// reply are loaded with the same verified API calls as the Mushaf (core/api.js), and cached like the Mushaf.
// The engine and its knowledge base are evaluated on first use (dynamic import; the files are module-preloaded).
// The conversation context lives in memory only: nothing the visitor writes is stored or sent anywhere.

import { getAyahEditions, getSurah, searchAyahs } from '../core/api.js';
import { fixSurahName, normalizeArabic, stripBasmala } from '../core/arabic.js';
import { buildKnowledge, excerpt, searchKnowledge, terms } from '../core/assistant.js';
import { h } from '../core/dom.js';
import { getLang, onLanguageChange, t } from '../core/i18n.js';
import { closeDialog, onDialogOpen, openDialog } from '../core/modal.js';
import { getSurahMeta, surahName } from '../core/quran.js';
import { ACADEMY_LESSONS, findLesson } from '../data/academy.js';
import { ADHKAR } from '../data/adhkar.js';
import { LESSONS } from '../data/prayer-lessons.js';
import { LANGUAGES, translations } from '../data/translations.js';
import { openTasbeeh } from './adhkar.js';
import { openLesson } from './learn.js';

let actions = { readSurah: () => {}, openPlan: () => {} };
const el = {};
let knowledge = null;
let engine = null;
let ctx = null;

const SUGGESTIONS = ['asst_s1', 'asst_s2', 'asst_s3', 'asst_s4', 'asst_s5', 'asst_s6'];
const TRANSLATION = { en: 'en.sahih', es: 'es.cortes', fr: 'fr.hamidullah' };
const SHAHADA_AR = 'أشهد أن لا إله إلا الله، وأشهد أن محمدًا رسول الله';
const SHAHADA_LATIN = 'Ash-hadu an lā ilāha illā-llāh, wa ash-hadu anna Muḥammadan rasūlu-llāh';
const MAX_LOG = 60;

const byLang = (key) => Object.fromEntries(LANGUAGES.map((l) => [l, translations[l][key] ?? translations.ar[key]]));
/** Translate in the language of the reply (the visitor may write English in the Arabic interface). */
function tl(lang, key, vars) {
  let value = translations[lang]?.[key] ?? translations.ar[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) value = value.replaceAll(`{${k}}`, String(v));
  return value;
}
const dirOf = (lang) => (lang === 'ar' ? 'rtl' : 'ltr');
const surahLabel = (n, lang) => {
  const s = getSurahMeta(n);
  if (!s) return '';
  return lang === 'ar' ? fixSurahName(s.nameAr) : s.nameEn;
};

/** Load the conversation engine once (it brings the knowledge base with it). */
function loadEngine() {
  if (!engine) {
    engine = import('../core/assistant-engine.js').then((m) => {
      m.setLegacyStrings(translations);
      if (!ctx) ctx = m.newContext();
      return m;
    });
    engine.catch(() => { engine = null; });
  }
  return engine;
}

function getKnowledge() {
  if (knowledge) return knowledge;
  const adhkarTitles = Object.fromEntries(Object.keys(ADHKAR).map((c) => [c, byLang(`tab_${c}`)]));
  const sections = [1, 2, 3].map((n) => ({
    id: `islam${n}`, title: byLang(`islam_sec${n}_title`),
    text: LANGUAGES.map((l) => translations[l][`islam_sec${n}_desc`]).filter(Boolean).join(' '),
    textAr: translations.ar[`islam_sec${n}_desc`],
  }));
  knowledge = buildKnowledge({ lessons: [...LESSONS, ...ACADEMY_LESSONS], adhkar: ADHKAR, adhkarTitles, sections });
  return knowledge;
}

// ---------------------------------------------------------------------------------------- actions
function runAction(action) {
  if (!action) return;
  if (action.dialog) { openDialog(action.dialog); return; }
  closeDialog('assistantModal');
  if (action.anchor) {
    const target = document.querySelector(action.anchor);
    if (target) { target.hidden = false; target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  } else if (action.href) {
    window.location.href = action.href;
  } else if (action.run === 'plan') actions.openPlan();
  else if (action.run === 'rosary') openTasbeeh();
  else if (action.run === 'theme') document.getElementById('themeToggle')?.click();
  else if (action.run === 'language') document.getElementById('langSelect')?.focus();
}

const openAyah = (s, a) => { closeDialog('assistantModal'); actions.readSurah(s, a - 1); };

// ---------------------------------------------------------------------------------------- render
const bubble = (who, lang, ...children) => h('div', { class: `asst-msg asst-msg--${who}`, attrs: { lang, dir: dirOf(lang) } }, ...children);

/** One ayah (or a short range) loaded from the verified dataset, with its translation for non-Arabic replies. */
function quranFigure(lang, { surah, ayah, to = ayah, note = '' }) {
  const text = h('p', { class: 'asst-ayah', lang: 'ar', dir: 'rtl', text: '…' });
  const meaning = lang !== 'ar' ? h('p', { class: 'small asst-ayah-meaning', lang, dir: dirOf(lang) }) : null;
  const ref = h('button', {
    class: 'cite-ref', type: 'button', text: tl(lang, 'asst_ayah_ref', { surah: surahLabel(surah, lang), ayah: to > ayah ? `${ayah}–${to}` : ayah }),
    on: { click: () => openAyah(surah, ayah) },
  });
  getSurah(surah).then(async (data) => {
    const list = data.ayahs.filter((x) => x.numberInSurah >= ayah && x.numberInSurah <= to);
    if (!list.length) throw new Error('missing');
    text.textContent = `﴿${list.map((x) => stripBasmala(x.text, surah, x.numberInSurah)).join(' ۝ ')}﴾`;
    if (meaning) {
      const m = await loadEngine();
      const edition = TRANSLATION[lang];
      const parts = await Promise.all(list.map((x) => getAyahEditions(m.globalAyahId(surah, x.numberInSurah), [edition]).then((r) => r[edition]).catch(() => '')));
      const joined = parts.filter(Boolean).join(' ');
      if (joined) meaning.replaceChildren(h('span', { class: 'muted', text: `${tl(lang, 'asst_translation')} ` }), joined);
    }
  }).catch(() => { text.textContent = tl(lang, 'asst_quran_unavailable'); text.classList.add('small', 'muted'); });
  return h('figure', { class: 'cite cite--quran asst-cite' }, text, meaning,
    h('figcaption', {}, ref, note ? h('span', { class: 'muted small', text: ` — ${note}` }) : null));
}

function hadithFigure(lang, b) {
  return h('figure', { class: 'cite cite--hadith asst-cite' },
    h('p', { class: 'cite-text', lang: 'ar', dir: 'rtl', text: b.text }),
    lang !== 'ar' && b.meaning ? h('p', { class: 'small' }, h('span', { class: 'muted', text: `${tl(lang, 'asst_hadith_meaning')} ` }), b.meaning) : null,
    h('figcaption', {},
      h('strong', { lang: 'ar', dir: 'rtl', text: b.source }), ' ',
      h('a', { href: b.search, target: '_blank', rel: 'noopener noreferrer', class: 'cite-link', text: tl(lang, 'learn_verify_hadith') })));
}

function shahadaFigure(lang) {
  return h('figure', { class: 'asst-shahada' },
    h('figcaption', { class: 'asst-help-title', text: `☝️ ${tl(lang, 'asst_shahada_title')}` }),
    h('p', { class: 'asst-shahada-ar', lang: 'ar', dir: 'rtl', text: SHAHADA_AR }),
    h('p', { class: 'small' }, h('span', { class: 'muted', text: `${tl(lang, 'asst_shahada_translit_label')} ` }), h('bdi', { lang: 'ar-Latn', dir: 'ltr', text: SHAHADA_LATIN })),
    h('p', { class: 'small', text: tl(lang, 'asst_shahada_meaning') }));
}

/** Tafsir view: one ayah, or the first ayahs of a surah, with Tafsir al-Muyassar from the verified source. */
function tafsirBlock(lang, { surah, ayah }) {
  const meta = getSurahMeta(surah);
  const count = ayah ? 1 : Math.min(7, meta.ayahCount);
  const first = ayah || 1;
  const box = h('div', { class: 'asst-tafsir' },
    h('p', { class: 'asst-help-title', text: ayah
      ? tl(lang, 'asst_tafsir_title', { surah: surahLabel(surah, lang), ayah })
      : tl(lang, 'asst_surah_title', { surah: surahLabel(surah, lang), type: tl(lang, `revelation_${meta.revelation}`), n: meta.ayahCount }) }));
  const list = h('ol', { class: 'asst-results' }, h('li', { class: 'loading small', text: '…' }));
  box.append(list);
  if (!ayah && meta.ayahCount > count) box.append(h('p', { class: 'small muted', text: tl(lang, 'asst_tafsir_shown', { n: count }) }));
  box.append(h('p', { class: 'small muted', text: tl(lang, 'asst_tafsir_note') }),
    h('button', { class: 'btn btn-soft btn-small', type: 'button', text: tl(lang, 'asst_open_surah'), on: { click: () => openAyah(surah, first) } }));
  (async () => {
    const m = await loadEngine();
    const data = await getSurah(surah);
    const items = data.ayahs.filter((x) => x.numberInSurah >= first && x.numberInSurah < first + count);
    const editions = lang === 'ar' ? ['ar.muyassar'] : ['ar.muyassar', TRANSLATION[lang]];
    const rows = await Promise.all(items.map(async (x) => {
      const ed = await getAyahEditions(m.globalAyahId(surah, x.numberInSurah), editions).catch(() => ({}));
      return h('li', { class: 'asst-result' },
        h('p', { class: 'asst-ayah', lang: 'ar', dir: 'rtl', text: `﴿${stripBasmala(x.text, surah, x.numberInSurah)}﴾ (${x.numberInSurah})` }),
        ed['ar.muyassar'] ? h('p', { class: 'small asst-tafsir-text', lang: 'ar', dir: 'rtl' }, h('strong', { text: `${tl('ar', 'asst_tafsir_label')} ` }), ed['ar.muyassar']) : null,
        lang !== 'ar' && ed[TRANSLATION[lang]] ? h('p', { class: 'small' }, h('span', { class: 'muted', text: `${tl(lang, 'asst_translation')} ` }), ed[TRANSLATION[lang]]) : null,
        h('button', { class: 'cite-ref', type: 'button', text: tl(lang, 'asst_ayah_ref', { surah: surahLabel(surah, lang), ayah: x.numberInSurah }), on: { click: () => openAyah(surah, x.numberInSurah) } }));
    }));
    list.replaceChildren(...rows);
  })().catch(() => list.replaceChildren(h('li', { class: 'small muted', text: tl(lang, 'asst_quran_unavailable') })));
  return box;
}

function renderBlocks(reply) {
  const lang = reply.lang;
  const out = [];
  let current = null; // the answer card (site help or Islamic answer)
  const card = () => {
    if (!current) {
      const islamic = ['islamic', 'new_muslim'].includes(reply.intent);
      current = h('div', { class: islamic ? 'asst-help asst-answer' : 'asst-help' });
      out.push(current);
    }
    return current;
  };
  const place = (node) => (current ? current.append(node) : out.push(node));
  for (const b of reply.blocks) {
    switch (b.type) {
      case 'talk': out.push(h('p', { class: 'asst-talk', text: b.text })); break;
      case 'title': card().append(h('p', { class: 'asst-help-title' }, h('span', { attrs: { 'aria-hidden': 'true' }, text: b.icon || '💡' }), ` ${b.text}`)); break;
      case 'text': place(h('p', { text: b.key ? tl(lang, b.key) : b.text })); break;
      case 'steps': card().append(h(b.ordered ? 'ol' : 'ul', { class: 'asst-steps' }, ...b.items.map((x) => h('li', { text: x })))); break;
      case 'notice': place(h('p', { class: `asst-notice${b.tone === 'info' ? ' asst-notice--info' : ''}`, attrs: { role: 'note' }, text: tl(lang, b.key) })); break;
      case 'shahada': card().append(shahadaFigure(lang)); break;
      case 'quran': card().append(quranFigure(lang, b)); break;
      case 'hadith': card().append(hadithFigure(lang, b)); break;
      case 'tafsir': out.push(tafsirBlock(lang, b)); break;
      case 'action': card().append(h('button', { class: 'btn btn-primary btn-small', type: 'button', text: tl(lang, 'asst_go'), on: { click: () => runAction(b.action) } })); break;
      case 'lesson': {
        const lesson = findLesson(b.lessonId);
        if (lesson) {
          card().append(h('button', {
            class: 'btn btn-soft btn-small', type: 'button',
            text: tl(lang, 'asst_open_lesson_named', { lesson: `${lesson.icon || ''} ${lesson.title?.[lang] || lesson.title?.ar}`.trim() }),
            on: { click: () => { closeDialog('assistantModal'); openLesson(b.lessonId); } },
          }));
        }
        break;
      }
      case 'sources':
        card().append(h('p', { class: 'small asst-sources' }, h('strong', { text: `${tl(lang, 'asst_sources')} ` }),
          b.items.map((s) => (s.key ? tl(lang, s.key) : (s.label?.[lang] || s.label?.ar || ''))).filter(Boolean).join(' · ')));
        break;
      default: break;
    }
  }
  return out;
}

function sourceOf(p) {
  const lang = getLang();
  if (p.kind === 'lesson') {
    return {
      label: t('asst_source_lesson', { lesson: `${p.icon || ''} ${p.title?.[lang] || p.title?.ar || ''}`.trim() }),
      button: h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('asst_open_lesson'), on: { click: () => { closeDialog('assistantModal'); openLesson(p.lessonId); } } }),
    };
  }
  if (p.kind === 'dhikr') {
    return {
      label: t('asst_source_dhikr', { category: p.title?.[lang] || p.title?.ar || '' }),
      button: h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('asst_open_adhkar'), on: { click: () => { openDialog('adhkarModal'); document.getElementById(`tab_${p.category}`)?.click(); } } }),
    };
  }
  return {
    label: t('asst_source_islam', { section: p.title?.[lang] || p.title?.ar || '' }),
    button: h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('asst_open_islam'), on: { click: () => openDialog('islamModal') } }),
  };
}

/** Verbatim passages of the site's lessons and Hisn al-Muslim, each with its source (original behaviour). */
function knowledgeBlock(results) {
  return h('div', { class: 'asst-knowledge' },
    h('p', { class: 'asst-help-title', text: t('asst_from_content') }),
    getLang() !== 'ar' ? h('p', { class: 'small muted', text: t('asst_content_ar') }) : null,
    h('ol', { class: 'asst-results' }, ...results.map(({ passage, hits }) => {
      const src = sourceOf(passage);
      const text = passage.kind === 'section' ? passage.textAr || passage.text : passage.text;
      const ref = passage.ref ? passage.ref.split(':').map(Number) : null;
      return h('li', { class: 'asst-result' },
        h('p', { class: 'asst-excerpt', lang: 'ar', dir: 'rtl', text: excerpt(text, hits) }),
        passage.kind === 'dhikr' && passage.count ? h('p', { class: 'small muted', text: `${t('search_res_dhikr_count')} ${passage.count}` }) : null,
        h('div', { class: 'asst-source' },
          h('span', { class: 'small', text: src.label }),
          src.button,
          ref ? h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('asst_open_ayah', { ref: `${surahName(ref[0])} ${ref[1]}` }), on: { click: () => openAyah(ref[0], ref[1]) } }) : null));
    })));
}

/** Content words of the question as typed (without diacritics), for the Quran text search. */
function quranTerms(question) {
  const keep = new Set(terms(question));
  return String(question).replace(/[ً-ٰٟۖ-ۭـ]/g, '').split(/[^\p{L}\p{N}]+/u)
    .filter((w) => /[؀-ۿ]/.test(w) && w.length > 2)
    .filter((w) => { const n = normalizeArabic(w); return [...keep].some((k) => n.includes(k)); })
    .slice(0, 3);
}

function quranSearchBlock(question) {
  const words = quranTerms(question);
  if (!words.length) return null;
  const box = h('div', { class: 'asst-quran' });
  const run = async (word) => {
    box.replaceChildren(h('p', { class: 'loading small', text: t('asst_quran_loading') }));
    try {
      const { total, results } = await searchAyahs(word);
      if (!results.length) { box.replaceChildren(h('p', { class: 'small muted', text: t('asst_quran_none', { word }) })); return; }
      box.replaceChildren(
        h('p', { class: 'asst-help-title', text: t('asst_quran_title', { word, n: total }) }),
        h('ol', { class: 'asst-results' }, ...results.slice(0, 5).map((r) => h('li', { class: 'asst-result' },
          h('p', { class: 'asst-excerpt asst-ayah', lang: 'ar', dir: 'rtl', text: `﴿${r.text}﴾` }),
          h('div', { class: 'asst-source' },
            h('span', { class: 'small', text: `${surahName(r.surah)} — ${t('ayah_label')} ${r.numberInSurah}` }),
            h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('btn_open_surah'), on: { click: () => openAyah(r.surah, r.numberInSurah) } }))))));
    } catch {
      box.replaceChildren(h('p', { class: 'small muted', text: t('asst_quran_error') }));
    }
  };
  box.append(h('span', { class: 'small muted', text: t('asst_quran_offer') }),
    ...words.map((w) => h('button', { class: 'chip-btn', type: 'button', lang: 'ar', text: `🔍 ${w}`, on: { click: () => run(w) } })));
  return box;
}

function chipsBlock(lang, followups) {
  if (!followups.length) return null;
  return h('div', { class: 'asst-related asst-followups', attrs: { role: 'group', 'aria-label': tl(lang, 'asst_suggest_more') } },
    h('span', { class: 'small muted', text: tl(lang, 'asst_suggest_more') }),
    ...followups.map((f) => {
      const label = f.key ? tl(lang, f.key) : f.label;
      return h('button', { class: 'chip-btn', type: 'button', text: label, on: { click: () => (f.id ? ask(label, { recordId: f.id }) : ask(label)) } });
    }));
}

/** Turn an engine reply into the assistant's bubble. */
function replyBubble(question, reply) {
  const lang = reply.lang;
  const parts = renderBlocks(reply);
  let passages = [];
  if (reply.passagesQuery) {
    const limit = reply.recordId ? 2 : 4;
    passages = searchKnowledge(getKnowledge(), reply.passagesQuery, limit);
    if (!passages.length && reply.passagesQuery !== question) passages = searchKnowledge(getKnowledge(), question, limit);
    if (passages.length) parts.push(knowledgeBlock(passages));
  }
  const nothing = !!reply.noAnswerFallback && !passages.length;
  if (nothing) parts.push(h('p', { text: tl(lang, 'asst_no_answer') }));
  if (reply.quranSearch && reply.noAnswerFallback) {
    const quran = quranSearchBlock(reply.quranSearch);
    if (quran) parts.push(quran);
  }
  const religious = passages.length || ['islamic', 'new_muslim', 'ruling', 'unknown', 'tafsir'].includes(reply.intent);
  if (religious) parts.push(h('p', { class: 'small muted asst-disclaimer', text: tl(lang, 'asst_disclaimer') }));
  const chips = chipsBlock(lang, nothing ? SUGGESTIONS.map((key) => ({ key })) : reply.followups);
  if (chips) parts.push(chips);
  if (!parts.length) parts.push(h('p', { text: tl(lang, 'asst_no_answer') }));
  const b = bubble('bot', lang, ...parts);
  b.dataset.intent = reply.intent;
  return b;
}

let busy = Promise.resolve();

/** Ask a question (typed, a starter or a follow-up chip). Answers are shown in order. */
function ask(question, { recordId = null } = {}) {
  const q = String(question).replace(/\s+/g, ' ').trim().slice(0, 300);
  if (!q) return busy;
  el.log.append(h('div', { class: 'asst-msg asst-msg--user', attrs: { dir: 'auto' } }, h('p', { dir: 'auto', text: q })));
  el.suggestWrap.hidden = true; // the starters make room for the conversation (they return with a new conversation)
  const typing = h('div', { class: 'asst-msg asst-typing', attrs: { role: 'status', 'aria-label': t('asst_typing') } },
    h('span', { attrs: { 'aria-hidden': 'true' } }), h('span', { attrs: { 'aria-hidden': 'true' } }), h('span', { attrs: { 'aria-hidden': 'true' } }));
  el.log.append(typing);
  busy = busy.then(async () => {
    let b;
    try {
      const m = await loadEngine();
      if (!ctx) ctx = m.newContext();
      const reply = recordId ? m.respondRecord(recordId, ctx, { uiLang: getLang() }) : m.respond(q, ctx, { uiLang: getLang() });
      b = replyBubble(q, reply);
    } catch (err) {
      console.error('[assistant]', err);
      b = bubble('bot', getLang(), h('p', { text: t('asst_error') }));
    }
    typing.replaceWith(b);
    while (el.log.children.length > MAX_LOG) el.log.firstElementChild.remove();
    b.scrollIntoView?.({ block: 'nearest' });
  });
  return busy;
}

function renderIntro() {
  ctx = null; // a new conversation forgets the previous topic
  if (engine) engine.then((m) => { if (!ctx) ctx = m.newContext(); }).catch(() => {});
  el.log.replaceChildren(bubble('bot', getLang(),
    h('p', { text: t('asst_welcome') }),
    h('p', { class: 'small muted', text: t('asst_disclaimer') })));
  el.suggestWrap.hidden = false;
  el.suggestions.replaceChildren(...SUGGESTIONS.map((key) => h('button', {
    class: 'chip-btn', type: 'button', text: t(key), on: { click: () => ask(t(key)) },
  })));
}

export function initAssistant(handlers) {
  actions = { ...actions, ...handlers };
  Object.assign(el, {
    log: document.getElementById('assistantLog'),
    form: document.getElementById('assistantForm'),
    input: document.getElementById('assistantInput'),
    suggestions: document.getElementById('assistantSuggestions'),
    suggestWrap: document.querySelector('#assistantModal .asst-suggest'),
    reset: document.getElementById('assistantReset'),
  });
  if (!el.log) return;
  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = el.input.value;
    el.input.value = '';
    ask(q);
    el.input.focus();
  });
  el.reset?.addEventListener('click', () => { renderIntro(); el.input.focus(); });
  onDialogOpen('assistantModal', () => {
    loadEngine().catch(() => {});
    if (!el.log.children.length) renderIntro();
  });
  onLanguageChange(renderIntro);
}
