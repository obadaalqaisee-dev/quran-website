// «💬 المساعد» — the site assistant (its own page, #/assistant; the old dialog id still opens it).
//
// Answers, in this order (core/conversation.js decides; nothing is generated):
//   1. greetings and small talk («السلام عليكم», «شكرًا», «How are you?»…), answered naturally;
//   2. the written knowledge bases: 139 questions about using this site (data/assistant-kb.js) and introductory
//      Islamic knowledge with Quran and hadith references, including a section for people who want to embrace
//      Islam (data/islamic-kb.js). Follow-up questions keep the subject of the previous answer
//      («كيف أقرأ القرآن؟» → «وكيف أستمع إليه؟» → «وكيف أحفظه؟»);
//   3. otherwise, the original behaviour: help topics, passages of the site's verified lessons with their source,
//      and the optional Quran word search (online).
// No AI model, no account, and no request is made for the answers themselves. Everything shown comes from static
// strings or verified data and is inserted with textContent; Quran text is shown from the verified dataset only.

import { getSurah, searchAyahs } from '../core/api.js';
import { normalizeArabic, stripBasmala } from '../core/arabic.js';
import { asksForRuling, buildKnowledge, excerpt, matchHelp, searchKnowledge, terms } from '../core/assistant.js';
import { buildIndex, respond } from '../core/conversation.js';
import { h } from '../core/dom.js';
import { getLang, onLanguageChange, t } from '../core/i18n.js';
import { closeDialog, onDialogOpen, openDialog } from '../core/modal.js';
import { surahName } from '../core/quran.js';
import { ACADEMY_LESSONS } from '../data/academy.js';
import { ADHKAR } from '../data/adhkar.js';
import { SITE_KB } from '../data/assistant-kb.js';
import { ISLAMIC_KB, pickLang } from '../data/islamic-kb.js';
import { SHAHADA } from '../data/journey-paths.js';
import { LESSONS } from '../data/prayer-lessons.js';
import { LANGUAGES, translations } from '../data/translations.js';
import { openTasbeeh } from './adhkar.js';
import { openLesson } from './learn.js';

let actions = { readSurah: () => {}, openPlan: () => {}, navigate: () => {}, openMenu: () => {} };
const el = {};
let knowledge = null;
let kbIndex = null;
let context = null; // conversation context: { lastId, subject, turns }

const SUGGESTIONS = ['asst_s1', 'asst_s2', 'asst_s7', 'asst_s3', 'asst_s8', 'asst_s4', 'asst_s5', 'asst_s6'];
const byLang = (key) => Object.fromEntries(LANGUAGES.map((l) => [l, translations[l][key] ?? translations.ar[key]]));
const ISLAMIC_IDS = new Set(ISLAMIC_KB.map((e) => e.id));
const ALL_ENTRIES = [...SITE_KB, ...ISLAMIC_KB];
const entryById = (id) => ALL_ENTRIES.find((e) => e.id === id) || null;

// The original help topics now answer with the matching knowledge-base entry (up-to-date navigation).
const HELP_TO_KB = {
  read: 'read-quran', listen: 'audio-listen', ayah_audio: 'audio-repeat', tafsir: 'tafsir-read', memorize: 'memo-start',
  mic: 'tr-mic', revision: 'rev-schedule', bookmark: 'read-bookmark', notes: 'fv-notes', prayer_times: 'pt-where',
  notify: 'nt-prayer', adhkar: 'ad-where', rosary: 'ts-where', learn_prayer: 'pl-learn', academy: 'ac-what',
  search: 'search-ayah', settings: 'st-open', theme: 'st-dark', language: 'st-language', insights: 'rev-insights',
  backup: 'of-backup', favorites: 'fv-add', install: 'of-install', sleep: 'audio-sleep', wird: 'db-wird', about: 'ab-who',
};

function getIndex() {
  if (!kbIndex) kbIndex = buildIndex(ALL_ENTRIES);
  return kbIndex;
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
/** Original help-topic actions ({ dialog } | { anchor } | { href } | { run }). */
function runAction(action) {
  if (!action) return;
  if (action.dialog) { openDialog(action.dialog); return; }
  closeDialog('assistantModal');
  if (action.anchor) window.location.hash = action.anchor; // the router shows the page holding the anchor
  else if (action.href) window.location.href = action.href;
  else if (action.run === 'plan') actions.openPlan();
  else if (action.run === 'rosary') openTasbeeh();
  else if (action.run === 'theme') document.getElementById('themeToggle')?.click();
  else if (action.run === 'language') document.getElementById('langSelect')?.focus();
}

/** Knowledge-base actions ({ route } | { dialog } | { lesson } | { href } | { run }). */
function runGo(go) {
  if (!go) return;
  if (typeof go.route === 'string') actions.navigate(go.route);
  else if (go.dialog) openDialog(go.dialog);
  else if (go.lesson) openLesson(go.lesson);
  else if (go.href) window.location.href = go.href;
  else if (go.run === 'tasbih') openTasbeeh();
  else if (go.run === 'menu') actions.openMenu();
  else runAction(go);
}

// ---------------------------------------------------------------------------------------- render helpers
const bubble = (who, ...children) => h('div', { class: `asst-msg asst-msg--${who}` }, ...children);
const paragraphs = (text) => String(text).split('\n').filter((x) => x.trim()).map((line) => h('p', { text: line }));

function shahadaCard() {
  return h('figure', { class: 'shahada-card' },
    h('p', { class: 'shahada-ar', lang: 'ar', dir: 'rtl', text: SHAHADA.ar }),
    h('p', { class: 'shahada-latin', dir: 'ltr', lang: 'en', text: SHAHADA.translit }),
    h('figcaption', { text: pickLang(SHAHADA.meaning, getLang()) }));
}

/** A Quran reference: the verified ayah text (loaded from the dataset) and a button to open it in the reader. */
function quranRef(ref) {
  const [s, a] = ref.split(':').map(Number);
  const text = h('p', { class: 'asst-excerpt asst-ayah', lang: 'ar', dir: 'rtl', text: '…' });
  getSurah(s).then((data) => {
    const ayah = data.ayahs.find((x) => x.numberInSurah === a);
    text.textContent = ayah ? `﴿${stripBasmala(ayah.text, s, a)}﴾` : t('learn_quran_unavailable');
  }).catch(() => { text.textContent = t('learn_quran_unavailable'); });
  return h('li', { class: 'asst-result' }, text,
    h('div', { class: 'asst-source' },
      h('span', { class: 'small', text: `${surahName(s)} — ${t('ayah_label')} ${a}` }),
      h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('asst_open_ayah', { ref: `${surahName(s)} ${a}` }), on: { click: () => actions.readSurah(s, a - 1) } })));
}

function kbBlock(results) {
  const lang = getLang();
  const { entry } = results[0];
  const islamic = ISLAMIC_IDS.has(entry.id);
  const answerText = entry.a[lang] ?? entry.a.en;
  const refs = entry.refs || [];
  const related = results.slice(1, 3).map((r) => r.entry);
  return h('div', { class: 'asst-kb' },
    h('p', { class: 'asst-help-title', text: pickLang(entry.q, lang) }),
    !entry.a[lang] ? h('p', { class: 'small muted', text: t('asst_en_only') }) : null,
    ...paragraphs(answerText),
    entry.widget === 'shahada' ? shahadaCard() : null,
    entry.level === 'difference' ? h('p', { class: 'asst-notice', attrs: { role: 'note' }, text: t('asst_level_difference') }) : null,
    refs.length ? h('div', { class: 'asst-refs' },
      h('p', { class: 'small strong', text: t('asst_refs') }),
      h('ol', { class: 'asst-results' }, ...refs.map((r) => (r.quran ? quranRef(r.quran)
        : h('li', { class: 'asst-result asst-hadith' }, h('span', { class: 'small', text: `📜 ${pickLang(r.hadith, lang === 'ar' ? 'ar' : 'en')}` })))))) : null,
    entry.go ? h('button', { class: 'btn btn-primary btn-small', type: 'button', text: t('asst_go'), on: { click: () => runGo(entry.go) } }) : null,
    related.length ? h('div', { class: 'asst-related' },
      h('span', { class: 'small muted', text: t('asst_related') }),
      ...related.map((r) => h('button', { class: 'chip-btn', type: 'button', text: pickLang(r.q, lang), on: { click: () => answer(pickLang(r.q, lang)) } })))
      : null,
    islamic ? h('p', { class: 'small muted asst-disclaimer', text: t('asst_islamic_note') }) : null);
}

/** "Tell me more": other questions of the same category as the last answer. */
function moreBlock(lastId) {
  const last = entryById(lastId);
  const lang = getLang();
  const others = last ? ALL_ENTRIES.filter((e) => e.cat === last.cat && e.id !== last.id).slice(0, 6) : [];
  if (!others.length) return h('p', { text: t('asst_no_more') });
  return h('div', { class: 'asst-related' },
    h('p', { text: t('asst_more_intro') }),
    ...others.map((e) => h('button', { class: 'chip-btn', type: 'button', text: pickLang(e.q, lang), on: { click: () => answer(pickLang(e.q, lang)) } })));
}

function helpBlock(topics) {
  const [main, ...more] = topics;
  const mapped = entryById(HELP_TO_KB[main.id]);
  if (mapped) return kbBlock([{ entry: mapped }, ...more.map((tp) => entryById(HELP_TO_KB[tp.id])).filter(Boolean).map((entry) => ({ entry }))]);
  return h('div', { class: 'asst-help' },
    h('p', { class: 'asst-help-title' }, h('span', { attrs: { 'aria-hidden': 'true' }, text: main.icon }), ` ${t(`help_${main.id}_q`)}`),
    h('p', { text: t(`help_${main.id}`) }),
    main.action ? h('button', { class: 'btn btn-primary btn-small', type: 'button', text: t('asst_go'), on: { click: () => runAction(main.action) } }) : null);
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
          ref ? h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('asst_open_ayah', { ref: `${surahName(ref[0])} ${ref[1]}` }), on: { click: () => { closeDialog('assistantModal'); actions.readSurah(ref[0], ref[1] - 1); } } }) : null));
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
            h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('btn_open_surah'), on: { click: () => { closeDialog('assistantModal'); actions.readSurah(r.surah, r.numberInSurah - 1); } } }))))));
    } catch {
      box.replaceChildren(h('p', { class: 'small muted', text: t('asst_quran_error') }));
    }
  };
  box.append(h('span', { class: 'small muted', text: t('asst_quran_offer') }),
    ...words.map((w) => h('button', { class: 'chip-btn', type: 'button', lang: 'ar', text: `🔍 ${w}`, on: { click: () => run(w) } })));
  return box;
}

// ---------------------------------------------------------------------------------------- answering
/** The original answer path (help topics, verified passages, Quran search) for questions the bases do not cover. */
function fallbackParts(q) {
  const topics = matchHelp(q);
  const results = searchKnowledge(getKnowledge(), q, 4);
  const parts = [];
  if (topics.length) parts.push(helpBlock(topics));
  if (results.length) parts.push(knowledgeBlock(results));
  if (!topics.length && !results.length) parts.push(h('p', { text: t('asst_no_answer') }));
  if (!topics.length) {
    const quran = quranSearchBlock(q);
    if (quran) parts.push(quran);
  }
  if (results.length || !topics.length) parts.push(h('p', { class: 'small muted asst-disclaimer', text: t('asst_disclaimer') }));
  return parts;
}

export function answer(question) {
  const q = String(question).trim().slice(0, 300);
  if (!q) return;
  el.log.append(bubble('user', h('p', { text: q })));
  el.suggestWrap.hidden = true; // the suggestions make room for the conversation (they return with the intro)

  const r = respond(getIndex(), q, context);
  const parts = [];
  if (asksForRuling(q)) parts.push(h('p', { class: 'asst-notice', attrs: { role: 'note' }, text: t('asst_ruling_notice') }));
  if (r.greeting) parts.push(h('p', { class: 'asst-smalltalk', text: t(`asst_st_${r.greeting}`) }));
  if (r.kind === 'answer') {
    if (r.followUp) parts.push(h('p', { class: 'small muted', text: t('asst_followup_note') }));
    parts.push(kbBlock(r.entries));
    context = r.context;
  } else if (r.kind === 'more') {
    parts.push(moreBlock(context?.lastId));
  } else if (r.kind === 'smalltalk') {
    if (['salam', 'hello', 'morning', 'evening'].includes(r.greeting)) parts.push(h('p', { class: 'small muted', text: t('asst_st_offer') }));
  } else {
    parts.push(...fallbackParts(r.question || q));
  }
  const reply = bubble('bot', ...parts);
  el.log.append(reply);
  // Keep the newest exchange in view; trim very long conversations.
  while (el.log.children.length > 40) el.log.firstElementChild.remove();
  reply.scrollIntoView({ block: 'nearest' });
}

/** Ask a question from elsewhere in the site (e.g. a Quran Journey step): open the assistant and answer it. */
export function askAssistant(question) {
  openDialog('assistantModal');
  if (!el.log.children.length) renderIntro();
  answer(question);
}

function renderIntro() {
  context = null;
  el.log.replaceChildren(bubble('bot',
    h('p', { text: t('asst_welcome_v2') }),
    h('p', { class: 'small muted', text: t('asst_disclaimer_v2') })));
  el.suggestWrap.hidden = false;
  el.suggestions.replaceChildren(...SUGGESTIONS.map((key) => h('button', {
    class: 'chip-btn', type: 'button', text: t(key), on: { click: () => answer(t(key)) },
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
  });
  if (!el.log) return;
  el.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = el.input.value;
    el.input.value = '';
    answer(q);
    el.input.focus();
  });
  onDialogOpen('assistantModal', () => { if (!el.log.children.length) renderIntro(); });
  onLanguageChange(renderIntro);
}
