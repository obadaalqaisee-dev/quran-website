// "Islamic search": surah names, the adhkar and the Message-of-Islam text available in the site.

import { normalizeArabic, normalizeLatin, surahNameKey } from '../core/arabic.js';
import { h } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { closeDialog, openDialog } from '../core/modal.js';
import { surahName, surahs } from '../core/quran.js';
import { ADHKAR } from '../data/adhkar.js';

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

    box.replaceChildren(...(out.length ? out.slice(0, 50) : [h('p', { class: 'empty-state', text: t('empty_search_res') })]));
  });
}
