// Favourite surahs (original storage key "favoriteSurahs": an array of numbers).

import { h } from '../core/dom.js';
import { t } from '../core/i18n.js';
import { closeDialog, onDialogOpen } from '../core/modal.js';
import { getSurahMeta, surahName } from '../core/quran.js';
import { KEYS, getJSON, setJSON } from '../core/storage.js';
import { toast } from '../core/toast.js';

const listeners = new Set();
export const onFavoritesChange = (fn) => listeners.add(fn);

export function getFavorites() {
  const list = getJSON(KEYS.favorites, []);
  return Array.isArray(list) ? list.map(Number).filter((n) => n >= 1 && n <= 114) : [];
}

export const isFavorite = (n) => getFavorites().includes(Number(n));

/** Re-render everything that shows favourites (after an external change such as "reset my data"). */
export function refreshFavorites() {
  const list = getFavorites();
  for (const fn of listeners) fn(list);
  renderFavorites();
}

export function toggleFavorite(n) {
  const num = Number(n);
  const current = getFavorites();
  const next = current.includes(num) ? current.filter((x) => x !== num) : [...current, num];
  setJSON(KEYS.favorites, next);
  toast(next.includes(num) ? t('toast_fav_add') : t('toast_fav_rm'));
  for (const fn of listeners) fn(next);
  renderFavorites();
}

let openSurah = () => {};

export function renderFavorites() {
  const box = document.getElementById('favoritesList');
  if (!box) return;
  const favs = getFavorites();
  if (!favs.length) {
    box.replaceChildren(h('p', { class: 'empty-state', text: t('empty_fav') }));
    return;
  }
  box.replaceChildren(...favs.map((n) => {
    const s = getSurahMeta(n);
    return h('div', { class: 'surah-card' },
      h('div', { class: 'surah-number' }, h('span', { text: String(n) })),
      h('div', { class: 'surah-info' }, h('h3', { text: surahName(n) }), h('p', { text: s.nameEn })),
      h('button', {
        class: 'favorite-btn', type: 'button', text: '⭐', title: t('fav_remove_label'),
        attrs: { 'aria-label': `${t('fav_remove_label')}: ${surahName(n)}` },
        on: { click: () => toggleFavorite(n) },
      }),
      h('button', {
        class: 'action-btn', type: 'button', text: '📖', title: t('btn_open_surah'),
        attrs: { 'aria-label': `${t('btn_open_surah')}: ${surahName(n)}` },
        on: { click: () => { closeDialog('favoritesModal'); openSurah(n); } },
      }),
    );
  }));
}

export function initFavorites({ readSurah }) {
  openSurah = readSurah;
  renderFavorites();
  onDialogOpen('favoritesModal', () => renderFavorites());
}
