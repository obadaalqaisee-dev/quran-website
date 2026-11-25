// «💬 مساعد الموقع» dialog: answers questions about using the site and Islamic questions from the site's own
// verified content (see core/assistant.js). No AI model, no account and no request is made for the answers
// themselves; the optional Quran search uses the same Quran search the site already had (online).
// Everything shown comes from the site's static strings or verified data and is inserted with textContent.

import { searchAyahs } from '../core/api.js';
import { normalizeArabic } from '../core/arabic.js';
import { asksForRuling, buildKnowledge, excerpt, matchHelp, searchKnowledge, terms } from '../core/assistant.js';
import { h } from '../core/dom.js';
import { getLang, onLanguageChange, t } from '../core/i18n.js';
import { closeDialog, onDialogOpen, openDialog } from '../core/modal.js';
import { surahName } from '../core/quran.js';
import { ACADEMY_LESSONS } from '../data/academy.js';
import { ADHKAR } from '../data/adhkar.js';
import { LESSONS } from '../data/prayer-lessons.js';
import { LANGUAGES, translations } from '../data/translations.js';
import { openTasbeeh } from './adhkar.js';
import { openLesson } from './learn.js';

let actions = { readSurah: () => {}, openPlan: () => {} };
const el = {};
let knowledge = null;

const SUGGESTIONS = ['asst_s1', 'asst_s2', 'asst_s3', 'asst_s4', 'asst_s5', 'asst_s6'];
const byLang = (key) => Object.fromEntries(LANGUAGES.map((l) => [l, translations[l][key] ?? translations.ar[key]]));

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

// ---------------------------------------------------------------------------------------- render
const bubble = (who, ...children) => h('div', { class: `asst-msg asst-msg--${who}` }, ...children);

function helpBlock(topics) {
  const [main, ...more] = topics;
  return h('div', { class: 'asst-help' },
    h('p', { class: 'asst-help-title' }, h('span', { attrs: { 'aria-hidden': 'true' }, text: main.icon }), ` ${t(`help_${main.id}_q`)}`),
    h('p', { text: t(`help_${main.id}`) }),
    main.action ? h('button', { class: 'btn btn-primary btn-small', type: 'button', text: t('asst_go'), on: { click: () => runAction(main.action) } }) : null,
    more.length ? h('div', { class: 'asst-related' },
      h('span', { class: 'small muted', text: t('asst_related') }),
      ...more.map((topic) => h('button', { class: 'chip-btn', type: 'button', text: `${topic.icon} ${t(`help_${topic.id}_q`)}`, on: { click: () => answer(t(`help_${topic.id}_q`), [topic]) } })))
      : null);
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
  return String(question).replace(/[ً-ٰٟۖ-ۭـ]/g, '').split(/[^\p{L}\p{N}]+/u)
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

function answer(question, forcedTopics = null) {
  const q = String(question).trim().slice(0, 300);
  if (!q) return;
  el.log.append(bubble('user', h('p', { text: q })));
  el.suggestWrap.hidden = true; // the suggestions make room for the conversation (they return with the intro)
  const topics = forcedTopics || matchHelp(q);
  const results = forcedTopics ? [] : searchKnowledge(getKnowledge(), q, 4);
  const parts = [];
  if (!forcedTopics && asksForRuling(q)) parts.push(h('p', { class: 'asst-notice', attrs: { role: 'note' }, text: t('asst_ruling_notice') }));
  if (topics.length) parts.push(helpBlock(topics));
  if (results.length) parts.push(knowledgeBlock(results));
  if (!topics.length && !results.length) parts.push(h('p', { text: t('asst_no_answer') }));
  if (!forcedTopics && !topics.length) { // a content question: offer the Quran text search too
    const quran = quranSearchBlock(q);
    if (quran) parts.push(quran);
  }
  if (results.length || (!topics.length && !forcedTopics)) parts.push(h('p', { class: 'small muted asst-disclaimer', text: t('asst_disclaimer') }));
  const reply = bubble('bot', ...parts);
  el.log.append(reply);
  // Keep the newest exchange in view; trim very long conversations.
  while (el.log.children.length > 40) el.log.firstElementChild.remove();
  reply.scrollIntoView({ block: 'nearest' });
}

function renderIntro() {
  el.log.replaceChildren(bubble('bot',
    h('p', { text: t('asst_welcome') }),
    h('p', { class: 'small muted', text: t('asst_disclaimer') })));
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

