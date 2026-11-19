// Surah list: 114 cards (number, names, ☆ favourite, 🎧 listen, 📖 read), the filter box and the
// "resume reading" bookmark banner.

import { normalizeArabic, normalizeLatin, surahNameKey } from '../core/arabic.js';
import { debounce, delegateActions, h } from '../core/dom.js';
import { onLanguageChange, t } from '../core/i18n.js';
import { surahName, surahSubtitle, surahs } from '../core/quran.js';
import { KEYS, getJSON } from '../core/storage.js';
import { isFavorite, onFavoritesChange, toggleFavorite } from './favorites.js';

let actions = { playSurah: () => {}, readSurah: () => {} };

function card(s) {
  const fav = isFavorite(s.number);
  const name = surahName(s.number);
  return h('article', { class: 'surah-card', dataset: { surah: s.number } },
    h('div', { class: 'surah-number', attrs: { 'aria-hidden': 'true' } }, h('span', { text: String(s.number) })),
    h('div', { class: 'surah-info' },
      h('h3', {}, h('span', { class: 'visually-hidden', text: `${s.number}. ` }), name),
      h('p', { text: surahSubtitle(s.number) })),
    h('button', {
      class: 'favorite-btn', type: 'button', text: fav ? '⭐' : '☆', dataset: { action: 'fav', surah: s.number },
      title: fav ? t('fav_remove_label') : t('fav_add_label'),
      attrs: { 'aria-pressed': String(fav), 'aria-label': `${fav ? t('fav_remove_label') : t('fav_add_label')}: ${name}` },
    }),
    h('div', { class: 'surah-actions' },
      h('button', {
        class: 'action-btn', type: 'button', text: '🎧', dataset: { action: 'play', surah: s.number },
        title: t('listen_label'), attrs: { 'aria-label': `${t('listen_label')}: ${name}` },
      }),
      h('button', {
        class: 'action-btn', type: 'button', text: '📖', dataset: { action: 'read', surah: s.number },
        title: t('read_label'), attrs: { 'aria-label': `${t('read_label')}: ${name}` },
      })));
}

/** Forgiving match: Arabic without diacritics/«سورة», English transliteration, number, meaning. */
export function matchesSurah(s, rawQuery) {
  const q = rawQuery.trim();
  if (!q) return true;
  if (/^\d+$/.test(q)) return String(s.number).startsWith(q);
  const ar = normalizeArabic(q).replace(/^سوره\s+/, '');
  if (ar && surahNameKey(s.nameAr).includes(ar)) return true;
  const latin = normalizeLatin(q);
  return !!latin && (normalizeLatin(s.nameEn).includes(latin) || normalizeLatin(s.meaning).includes(latin));
}

function render() {
  const grid = document.getElementById('surahGrid');
  const query = document.getElementById('searchInput').value;
  const list = surahs.filter((s) => matchesSurah(s, query));
  grid.replaceChildren(...list.map(card));
  document.getElementById('surahEmpty').hidden = list.length > 0;
}

export function renderBookmarkBanner() {
  const banner = document.getElementById('bookmarkBanner');
  const bm = getJSON(KEYS.bookmark, null);
  if (!bm || !(bm.surahNum >= 1 && bm.surahNum <= 114)) { banner.hidden = true; return; }
  const label = t('bookmark_resume', { surah: surahName(bm.surahNum), ayah: bm.ayahNumInSurah });
  banner.replaceChildren(h('button', {
    class: 'btn btn-primary', type: 'button', text: label,
    on: { click: () => actions.readSurah(Number(bm.surahNum), Number(bm.ayahIndex)) },
  }));
  banner.hidden = false;
}

export function initSurahList(handlers) {
  actions = handlers;
  const grid = document.getElementById('surahGrid');
  delegateActions(grid, {
    play: (el) => actions.playSurah(Number(el.dataset.surah)),
    read: (el) => actions.readSurah(Number(el.dataset.surah)),
    fav: (el) => toggleFavorite(Number(el.dataset.surah)),
  });
  document.getElementById('searchInput').addEventListener('input', debounce(render, 120));
  onLanguageChange(() => { render(); renderBookmarkBanner(); });
  onFavoritesChange(render);
  render();
  renderBookmarkBanner();
}
