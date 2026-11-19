// Ayah search (up to 20 results). A result opens the reading view at that ayah.

import { searchAyahs } from '../core/api.js';
import { fixSurahName } from '../core/arabic.js';
import { h } from '../core/dom.js';
import { getLang, isArabic, t } from '../core/i18n.js';
import { closeDialog } from '../core/modal.js';
import { getSurahMeta } from '../core/quran.js';

let lastQuery = '';

export function initAyahSearch({ readSurah }) {
  const form = document.getElementById('ayahSearchForm');
  const input = document.getElementById('ayahSearchInput');
  const results = document.getElementById('ayahSearchResults');
  const count = document.getElementById('ayahSearchCount');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (query.length < 2) { input.reportValidity(); return; }
    lastQuery = query;
    count.textContent = '';
    results.replaceChildren(h('div', { class: 'loading', text: t('ayah_search_loading') }));
    try {
      const { total, results: matches } = await searchAyahs(query);
      if (lastQuery !== query) return;
      if (!matches.length) {
        results.replaceChildren(h('p', { class: 'error-state', text: t('ayah_search_no_res') }));
        return;
      }
      count.textContent = t('results_count', { n: total > matches.length ? `${matches.length} / ${total}` : total });
      const lang = getLang();
      results.replaceChildren(...matches.map((m) => {
        const name = isArabic() ? fixSurahName(m.surahNameAr) : getSurahMeta(m.surah)?.nameEn;
        const label = `${name} (${t('ayah_label')} ${m.numberInSurah})`;
        return h('button', {
          type: 'button', class: 'search-result',
          on: { click: () => { closeDialog('ayahSearchModal'); readSurah(m.surah, m.numberInSurah - 1); } },
        },
        h('strong', { text: label, lang }),
        h('span', { class: 'ayah-result-text', lang: 'ar', dir: 'rtl', text: m.text }));
      }));
    } catch {
      if (lastQuery === query) results.replaceChildren(h('p', { class: 'error-state', text: t('ayah_search_error') }));
    }
  });
}
