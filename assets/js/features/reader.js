// Reading view: Uthmani text, tap/Enter on an ayah to hear it (Mishary Alafasy), see Tafsir al-Muyassar
// (Arabic interface) and a translation, loop an ayah, save it as the last-read bookmark.

import { AYAH_AUDIO, getAyahEditions, getSurah } from '../core/api.js';
import { stripBasmala } from '../core/arabic.js';
import { h, scrollIntoViewSmart } from '../core/dom.js';
import { getLang, isArabic, onLanguageChange, t } from '../core/i18n.js';
import { surahName } from '../core/quran.js';
import { KEYS, getJSON, setJSON } from '../core/storage.js';
import { pauseSurah } from './player.js';

// Translation edition per interface language (as the original). Arabic UI shows Sahih International.
const TRANSLATION = { ar: 'en.sahih', en: 'en.sahih', es: 'es.cortes', fr: 'fr.hamidullah' };
const TRANSLATION_LABEL = { ar: 'English Translation:', en: 'English Translation:', es: 'Traducción al Español:', fr: 'Traduction Française:' };
const TAFSIR = 'ar.muyassar';
const FONT_MIN = 1.2;
const FONT_MAX = 3.2;

const el = {};
const state = { surah: 0, ayahs: [], active: null, onBookmark: () => {} };

function renderHeader() {
  if (!state.surah) return;
  el.label.textContent = `${t('surah_label_prefix')} ${state.surah}`;
  el.name.textContent = surahName(state.surah);
}

function ayahNode(ayah, index) {
  return h('span', {
    class: 'ayah-span', id: `ayah-${index}`, dataset: { index },
    attrs: { role: 'button', tabindex: '0' }, // its accessible name is the ayah text itself
  },
  stripBasmala(ayah.text, state.surah, ayah.numberInSurah), ' ',
  h('span', { class: 'ayah-number', text: `﴿${ayah.numberInSurah}﴾` }));
}

export async function readSurah(number, scrollToAyahIndex = null) {
  const n = Number(number);
  if (!(n >= 1 && n <= 114)) return;
  state.surah = n;
  state.active = null;
  state.ayahs = [];
  el.section.hidden = false;
  el.controls.hidden = true;
  el.details.hidden = true;
  el.box.append(el.details); // park the details panel outside the text while it is rebuilt
  el.basmala.hidden = n === 1 || n === 9;
  renderHeader();
  el.text.replaceChildren(h('div', { class: 'loading', text: t('reading_loading') }));
  scrollIntoViewSmart(el.section);

  try {
    const data = await getSurah(n);
    if (state.surah !== n) return; // another surah was opened meanwhile
    state.ayahs = data.ayahs;
    const fragment = document.createDocumentFragment();
    data.ayahs.forEach((ayah, i) => fragment.append(ayahNode(ayah, i), ' '));
    el.text.replaceChildren(fragment);
    el.controls.hidden = false;
    if (scrollToAyahIndex !== null && scrollToAyahIndex >= 0 && scrollToAyahIndex < data.ayahs.length) {
      requestAnimationFrame(() => playAyah(scrollToAyahIndex));
    }
  } catch {
    if (state.surah !== n) return;
    el.text.replaceChildren(h('div', { class: 'error-state' },
      h('p', { text: t('reading_error') }),
      h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('btn_retry'), on: { click: () => readSurah(n, scrollToAyahIndex) } })));
  }
}

async function loadDetails() {
  const ayah = state.ayahs[state.active];
  if (!ayah) return;
  const lang = getLang();
  const wantTafsir = isArabic();
  el.tafsirWrap.hidden = !wantTafsir;
  el.translationLabel.textContent = TRANSLATION_LABEL[lang];
  el.translation.textContent = t('translation_loading');
  if (wantTafsir) el.tafsir.textContent = t('tafsir_loading');
  const editions = wantTafsir ? [TAFSIR, TRANSLATION[lang]] : [TRANSLATION[lang]];
  try {
    const texts = await getAyahEditions(ayah.id, editions);
    if (state.ayahs[state.active] !== ayah || getLang() !== lang) return;
    el.translation.textContent = texts[TRANSLATION[lang]] ?? t('details_error');
    if (wantTafsir) el.tafsir.textContent = texts[TAFSIR] ?? t('details_error');
  } catch {
    if (state.ayahs[state.active] !== ayah) return;
    el.translation.textContent = t('details_error');
    if (wantTafsir) el.tafsir.textContent = t('details_error');
  }
}

export function playAyah(index) {
  const ayah = state.ayahs[index];
  const span = document.getElementById(`ayah-${index}`);
  if (!ayah || !span) return;
  state.active = index;
  for (const s of el.text.querySelectorAll('.active-ayah')) s.classList.remove('active-ayah');
  span.classList.add('active-ayah');

  pauseSurah();
  el.ayahAudio.src = AYAH_AUDIO(ayah.id);
  el.ayahAudio.loop = el.loopCheck.checked;
  el.ayahAudio.play().catch(() => {});

  span.after(el.details); // show tafsir and translation right under the ayah (original behaviour)
  el.details.hidden = false;
  el.detailsTitle.textContent = `${t('ayah_label')} ﴿${ayah.numberInSurah}﴾`;
  resetBookmarkButton();
  loadDetails();
  scrollIntoViewSmart(span, 'center');
}

function resetBookmarkButton() {
  clearTimeout(state.bookmarkTimer);
  el.bookmark.textContent = t('btn_save_bookmark');
  el.bookmark.disabled = false;
}

function saveBookmark() {
  const ayah = state.ayahs[state.active];
  if (!ayah) return;
  setJSON(KEYS.bookmark, { surahNum: state.surah, ayahIndex: state.active, ayahNumInSurah: ayah.numberInSurah });
  el.bookmark.textContent = t('bookmark_saved');
  state.bookmarkTimer = setTimeout(resetBookmarkButton, 2000);
  state.onBookmark();
}

function applyFontScale(rem) {
  const value = Math.min(FONT_MAX, Math.max(FONT_MIN, rem));
  if (Number.isFinite(value)) {
    document.documentElement.style.setProperty('--quran-size', `${value}rem`);
    setJSON(KEYS.fontScale, value);
  }
}
function currentFontRem() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--quran-size')) || 1.9;
}

export function loadBookmark() {
  const bm = getJSON(KEYS.bookmark, null);
  if (bm?.surahNum) readSurah(Number(bm.surahNum), Number(bm.ayahIndex));
}

export function initReader({ onBookmark }) {
  state.onBookmark = onBookmark;
  Object.assign(el, {
    section: document.getElementById('readingSection'),
    box: document.querySelector('.reading-box'),
    controls: document.getElementById('ayahControls'),
    label: document.getElementById('readingLabel'),
    name: document.getElementById('readingName'),
    basmala: document.getElementById('readingBasmala'),
    text: document.getElementById('readingText'),
    details: document.getElementById('ayahDetailsBox'),
    detailsTitle: document.getElementById('detailsAyahNumber'),
    tafsirWrap: document.getElementById('tafsirWrapper'),
    tafsir: document.getElementById('tafsirText'),
    translationLabel: document.getElementById('translationLabel'),
    translation: document.getElementById('translationText'),
    bookmark: document.getElementById('saveBookmarkBtn'),
    ayahAudio: document.getElementById('ayahPlayer'),
    loopCheck: document.getElementById('ayahLoopCheck'),
  });

  el.text.addEventListener('click', (event) => {
    const span = event.target.closest('.ayah-span');
    if (span && el.text.contains(span)) playAyah(Number(span.dataset.index));
  });
  el.text.addEventListener('keydown', (event) => {
    const span = event.target.closest?.('.ayah-span');
    if (span && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); playAyah(Number(span.dataset.index)); }
  });
  el.loopCheck.addEventListener('change', () => { el.ayahAudio.loop = el.loopCheck.checked; });
  el.ayahAudio.addEventListener('play', pauseSurah);
  el.bookmark.addEventListener('click', saveBookmark);

  const saved = Number(getJSON(KEYS.fontScale, NaN));
  if (Number.isFinite(saved)) applyFontScale(saved);
  document.getElementById('fontSmaller').addEventListener('click', () => applyFontScale(currentFontRem() - 0.15));
  document.getElementById('fontLarger').addEventListener('click', () => applyFontScale(currentFontRem() + 0.15));

  onLanguageChange(() => {
    renderHeader();
    if (state.active !== null && !el.details.hidden) {
      el.detailsTitle.textContent = `${t('ayah_label')} ﴿${state.ayahs[state.active].numberInSurah}﴾`;
      resetBookmarkButton();
      loadDetails();
    }
  });
}

export const _readerState = state; // for tests
