// "Islamic search": surah names, the adhkar and the Message-of-Islam text available in the site.
// Added (after the original result types, which are unchanged): ayah references such as «2:255» or
// «البقرة 255», the prayer-curriculum and academy lessons, and Tafsir al-Muyassar (online).

import { searchTafsir } from '../core/api.js';
import { normalizeArabic, normalizeLatin, surahNameKey } from '../core/arabic.js';
import { h } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { closeDialog, openDialog } from '../core/modal.js';
import { surahName, surahs } from '../core/quran.js';
import { ADHKAR } from '../data/adhkar.js';
import { lessonIndex, openLesson } from './learn.js';

/** Parse an ayah reference: «2:255», «2 255», «البقرة 255», «al-baqarah 255». Returns [surah, ayah] or null. */
export function parseAyahRef(raw) {
  const text = String(raw).trim();
  let m = /^(\d{1,3})\s*[:：\-/. ]\s*(\d{1,3})$/.exec(text);
  let surah = null;
  let ayah = null;
  if (m) { surah = Number(m[1]); ayah = Number(m[2]); } else {
    m = /^(.+?)\s*[:：\s]\s*(\d{1,3})$/.exec(text);
    if (!m) return null;
    const ar = normalizeArabic(m[1]).replace(/^سوره\s+/, '');
    const latin = normalizeLatin(m[1]);
    const found = surahs.find((s) => (ar && surahNameKey(s.nameAr) === ar) || (latin.length > 2 && normalizeLatin(s.nameEn) === latin));
    if (!found) return null;
    surah = found.number; ayah = Number(m[2]);
  }
  const meta = surahs[surah - 1];
  return meta && ayah >= 1 && ayah <= meta.ayahCount ? [surah, ayah] : null;
}

export function initIslamicSearch({ readSurah }) {
  const form = document.getElementById('islamicSearchForm');
  const input = document.getElementById('islamicSearchInput');
  const box = document.getElementById('islamicSearchResults');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const raw = input.value.trim();
    const q = normalizeArabic(raw);
    if (!q) { box.replaceChildren(h('p', { class: 'empty-state', text: t('empty_search_prompt') })); return; }
    const latin = normalizeLatin(raw);
    const out = [];
    const ref = parseAyahRef(raw);
    if (ref) {
      out.push(h('div', { class: 'search-result' },
        h('strong', { text: `📍 ${surahName(ref[0])} — ${t('ayah_label')} ${ref[1]}` }),
        h('button', {
          class: 'btn btn-soft btn-small', type: 'button', text: t('btn_open_surah'),
          on: { click: () => { closeDialog('islamicSearchModal'); readSurah(ref[0], ref[1] - 1); } },
        })));
    }

    for (const s of surahs) {
      if (out.length >= 30) break;
      const hit = surahNameKey(s.nameAr).includes(q.replace(/^سوره\s+/, ''))
        || (latin && normalizeLatin(s.nameEn).includes(latin));
      if (!hit) continue;
      out.push(h('div', { class: 'search-result' },
        h('strong', { text: `📖 ${surahName(s.number)}` }),
        h('p', { text: s.nameEn }),
        h('button', {
          class: 'btn btn-soft btn-small', type: 'button', text: t('btn_open_surah'),
          on: { click: () => { closeDialog('islamicSearchModal'); readSurah(s.number); } },
        })));
    }

    for (const [type, list] of Object.entries(ADHKAR)) {
      for (const dhikr of list) {
        if (!normalizeArabic(dhikr.text).includes(q)) continue;
        out.push(h('div', { class: 'search-result' },
          h('strong', { text: `${t('search_res_dhikr')} (${t(`tab_${type}`)})` }),
          h('p', { class: 'ayah-result-text', lang: 'ar', dir: 'rtl', text: dhikr.text }),
          h('small', { text: `${t('search_res_dhikr_count')} ${dhikr.count}` })));
      }
    }

    const islamText = document.querySelector('.islam-content')?.textContent || '';
    if (normalizeArabic(islamText).includes(q)) {
      out.push(h('div', { class: 'search-result' },
        h('strong', { text: t('search_res_content') }),
        h('p', { text: t('search_res_content_desc') }),
        h('button', {
          class: 'btn btn-soft btn-small', type: 'button', text: t('btn_open_content'),
          on: { click: () => openDialog('islamModal') },
        })));
    }

    for (const lesson of lessonIndex()) {
      if (out.length >= 60) break;
      const hit = normalizeArabic(lesson.text).includes(q) || (latin.length > 2 && normalizeLatin(lesson.title.en || '').includes(latin));
      if (!hit) continue;
      out.push(h('div', { class: 'search-result' },
        h('strong', { text: `${t('search_res_lesson')} ${lesson.icon} ${lesson.title[document.documentElement.lang] || lesson.title.ar}` }),
        h('button', {
          class: 'btn btn-soft btn-small', type: 'button', text: t('search_open_lesson'),
          on: { click: () => { closeDialog('islamicSearchModal'); openLesson(lesson.id); } },
        })));
    }
    box.replaceChildren(...(out.length ? out.slice(0, 50) : [h('p', { class: 'empty-state', text: t('empty_search_res') })]));
    if (q.length >= 3) {
      // Searching the tafsir needs the network, so it runs only when asked.
      const section = h('div', { class: 'search-group' });
      section.append(h('button', {
        type: 'button', class: 'btn btn-soft btn-small', text: t('search_tafsir_btn'),
        on: { click: () => searchInTafsir(raw, section, box) },
      }));
      box.append(section);
    }
  });

  async function searchInTafsir(query, section, target) {
    section.replaceChildren(h('p', { class: 'loading', text: t('search_tafsir_loading') }));
    try {
      const { total, results } = await searchTafsir(query);
      if (input.value.trim() !== query) return;
      if (!results.length) { section.replaceChildren(h('p', { class: 'small muted', text: t('search_tafsir_none') })); return; }
      target.querySelector('.empty-state')?.remove();
      section.replaceChildren(h('h3', { class: 'small', text: t('search_tafsir_title', { n: total }) }), ...results.map((r) => h('button', {
        type: 'button', class: 'search-result',
        on: { click: () => { closeDialog('islamicSearchModal'); readSurah(r.surah, r.numberInSurah - 1); } },
      },
      h('strong', { text: `${t('search_res_tafsir')} — ${surahName(r.surah)} (${t('ayah_label')} ${r.numberInSurah})` }),
      h('span', { lang: 'ar', dir: 'rtl', text: r.text.length > 220 ? `${r.text.slice(0, 220)}…` : r.text }))));
    } catch {
      section.replaceChildren(h('p', { class: 'small muted', text: t('search_tafsir_error') }));
    }
  }
}
