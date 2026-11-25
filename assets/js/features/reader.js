// Reading view: Uthmani text, tap/Enter on an ayah to hear it (Mishary Alafasy), see Tafsir al-Muyassar
// (Arabic interface) and a translation, loop an ayah, save it as the last-read bookmark.
//
// Added by the platform evolution (all original behaviour above is unchanged):
//   * juz and Mushaf-page navigation, and the current juz/page of the active ayah;
//   * reading themes (paper, sepia, night) and the existing font-size controls;
//   * reading progress: ayahs shown on screen are logged per day (daily goal, khatma progress);
//   * continue playback to the next ayah, and repeat a range of ayahs N times;
//   * sajda markers; optional tafsir in every interface language; choice of translation in Arabic UI.

import { AYAH_AUDIO, getAyahEditions, getSurah } from '../core/api.js';
import { stripBasmala } from '../core/arabic.js';
import { h, scrollIntoViewSmart } from '../core/dom.js';
import { getLang, isArabic, onLanguageChange, t } from '../core/i18n.js';
import { isSajda, juzOf, juzStart, pageOf, pageStart } from '../core/mushaf.js';
import { surahName } from '../core/quran.js';
import { markRead } from '../core/reading-log.js';
import { getSettings, onSettingsChange } from '../core/settings.js';
import { KEYS, getJSON, getString, setJSON, setString } from '../core/storage.js';
import { pauseSurah } from './player.js';

// Translation edition per interface language (as the original). Arabic UI shows Sahih International
// unless another translation is chosen in the settings.
const TRANSLATION = { ar: 'en.sahih', en: 'en.sahih', es: 'es.cortes', fr: 'fr.hamidullah' };
const TRANSLATION_LABEL = { ar: 'English Translation:', en: 'English Translation:', es: 'Traducción al Español:', fr: 'Traduction Française:' };
const EDITION_LABEL = { 'en.sahih': TRANSLATION_LABEL.en, 'es.cortes': TRANSLATION_LABEL.es, 'fr.hamidullah': TRANSLATION_LABEL.fr };
const TAFSIR = 'ar.muyassar';
const FONT_MIN = 1.2;
const FONT_MAX = 3.2;
export const READING_THEMES = ['default', 'paper', 'sepia', 'night'];

const el = {};
const state = { surah: 0, ayahs: [], active: null, onBookmark: () => {}, range: null, observer: null, pending: new Set(), flushTimer: 0 };

function renderHeader() {
  if (!state.surah) return;
  el.label.textContent = `${t('surah_label_prefix')} ${state.surah}`;
  el.name.textContent = surahName(state.surah);
}

function ayahNode(ayah, index) {
  return h('span', {
    class: 'ayah-span', id: `ayah-${index}`, dataset: { index, id: ayah.id },
    attrs: { role: 'button', tabindex: '0' }, // its accessible name is the ayah text itself
  },
  stripBasmala(ayah.text, state.surah, ayah.numberInSurah), ' ',
  h('span', { class: 'ayah-number', text: `﴿${ayah.numberInSurah}﴾` }),
  isSajda(state.surah, ayah.numberInSurah) ? h('span', { class: 'sajda-mark', title: t('reader_sajda'), attrs: { 'aria-label': t('reader_sajda') }, text: '۩' }) : null);
}

/**
 * Open a surah. `scrollToAyahIndex` plays and shows that ayah (original behaviour);
 * with { play: false } it is only scrolled into view (juz / page navigation).
 */
export async function readSurah(number, scrollToAyahIndex = null, { play = true } = {}) {
  const n = Number(number);
  if (!(n >= 1 && n <= 114)) return;
  stopRange();
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
    document.dispatchEvent(new CustomEvent('surahrendered', { detail: { surah: n } })); // notes mark their ayahs
    el.controls.hidden = false;
    populateRange();
    observeAyahs();
    renderPosition(0);
    if (scrollToAyahIndex !== null && scrollToAyahIndex >= 0 && scrollToAyahIndex < data.ayahs.length) {
      requestAnimationFrame(() => {
        if (play) playAyah(scrollToAyahIndex);
        else scrollIntoViewSmart(document.getElementById(`ayah-${scrollToAyahIndex}`), 'center');
        renderPosition(scrollToAyahIndex);
      });
    }
  } catch {
    if (state.surah !== n) return;
    el.text.replaceChildren(h('div', { class: 'error-state' },
      h('p', { text: t('reading_error') }),
      h('button', { class: 'btn btn-soft btn-small', type: 'button', text: t('btn_retry'), on: { click: () => readSurah(n, scrollToAyahIndex, { play }) } })));
  }
}

function translationEdition(lang) {
  return lang === 'ar' ? getSettings().arTranslation : TRANSLATION[lang];
}

async function loadDetails() {
  const ayah = state.ayahs[state.active];
  if (!ayah) return;
  const lang = getLang();
  const wantTafsir = isArabic() || getSettings().alwaysTafsir;
  const edition = translationEdition(lang);
  el.tafsirWrap.hidden = !wantTafsir;
  el.translationLabel.textContent = lang === 'ar' ? EDITION_LABEL[edition] : TRANSLATION_LABEL[lang];
  el.translation.textContent = t('translation_loading');
  if (wantTafsir) el.tafsir.textContent = t('tafsir_loading');
  const editions = wantTafsir ? [TAFSIR, edition] : [edition];
  try {
    const texts = await getAyahEditions(ayah.id, editions);
    if (state.ayahs[state.active] !== ayah || getLang() !== lang) return;
    el.translation.textContent = texts[edition] ?? t('details_error');
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
  el.ayahAudio.loop = el.loopCheck.checked && !state.range;
  el.ayahAudio.play().catch(() => {});

  span.after(el.details); // show tafsir and translation right under the ayah (original behaviour)
  el.details.hidden = false;
  el.detailsTitle.textContent = `${t('ayah_label')} ﴿${ayah.numberInSurah}﴾`;
  resetBookmarkButton();
  document.dispatchEvent(new CustomEvent('ayahselect', { detail: { surah: state.surah, ayah: ayah.numberInSurah } }));
  loadDetails();
  renderPosition(index);
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
export const setFontScale = applyFontScale;
export const fontScale = () => currentFontRem();

export function loadBookmark() {
  const bm = getJSON(KEYS.bookmark, null);
  if (bm?.surahNum) readSurah(Number(bm.surahNum), Number(bm.ayahIndex));
}

// ---------------------------------------------------------------- reading theme
export function applyReadingTheme(theme) {
  const value = READING_THEMES.includes(theme) ? theme : 'default';
  for (const th of READING_THEMES) el.box.classList.toggle(`reading-theme--${th}`, th === value);
  if (el.theme) el.theme.value = value;
  setString(KEYS.readingTheme, value);
}

// ---------------------------------------------------------------- juz / page navigation and position
function renderPosition(index) {
  const ayah = state.ayahs[index];
  if (!ayah) return;
  el.position.textContent = t('reader_position', { juz: juzOf(state.surah, ayah.numberInSurah), page: pageOf(state.surah, ayah.numberInSurah) });
}

export function goToPosition([surah, ayah]) {
  return readSurah(surah, ayah - 1, { play: false });
}

function populateJuz() {
  const value = el.juz.value;
  el.juz.replaceChildren(h('option', { value: '', text: t('reader_juz_choose') }),
    ...Array.from({ length: 30 }, (_, i) => h('option', { value: String(i + 1), text: t('reader_juz_n', { n: i + 1 }) })));
  el.juz.value = value;
}

// ---------------------------------------------------------------- reading log (IntersectionObserver)
function observeAyahs() {
  state.observer?.disconnect();
  if (!('IntersectionObserver' in window)) return;
  const timers = new Map();
  state.observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const id = Number(entry.target.dataset.id);
      if (entry.isIntersecting) {
        // Count an ayah once it has stayed (mostly) visible for a second, not while scrolling past.
        timers.set(id, setTimeout(() => { state.pending.add(id); scheduleFlush(); state.observer?.unobserve(entry.target); }, 1000));
      } else {
        clearTimeout(timers.get(id));
      }
    }
  }, { threshold: 0.6 });
  for (const span of el.text.querySelectorAll('.ayah-span')) state.observer.observe(span);
}

function scheduleFlush() {
  clearTimeout(state.flushTimer);
  state.flushTimer = setTimeout(() => { markRead([...state.pending]); state.pending.clear(); }, 400);
}

// ---------------------------------------------------------------- range repeat and auto-continue
function populateRange() {
  const n = state.ayahs.length;
  const options = (sel) => state.ayahs.map((a, i) => h('option', { value: String(i), text: String(a.numberInSurah), selected: i === sel }));
  el.rangeFrom.replaceChildren(...options(0));
  el.rangeTo.replaceChildren(...options(Math.min(n - 1, 4)));
}

function stopRange() {
  state.range = null;
  if (el.rangeBtn) { el.rangeBtn.textContent = t('reader_range_play'); el.rangeBtn.setAttribute('aria-pressed', 'false'); }
  if (el.rangeStatus) el.rangeStatus.textContent = '';
}

function startRange() {
  const from = Number(el.rangeFrom.value) || 0;
  const to = Math.max(from, Number(el.rangeTo.value) || 0);
  el.rangeTo.value = String(to);
  state.range = { from, to, times: Number(el.rangeTimes.value) || 1, round: 1 };
  el.rangeBtn.textContent = t('reader_range_stop');
  el.rangeBtn.setAttribute('aria-pressed', 'true');
  renderRangeStatus();
  playAyah(from);
}

function renderRangeStatus() {
  if (!state.range) return;
  el.rangeStatus.textContent = t('reader_range_status', { round: state.range.round, times: state.range.times });
}

function onAyahEnded() {
  if (state.range) {
    const r = state.range;
    if (state.active < r.to) { playAyah(state.active + 1); return; }
    if (r.round < r.times) { r.round += 1; renderRangeStatus(); playAyah(r.from); return; }
    stopRange();
    return;
  }
  if (el.autoNext.checked && !el.loopCheck.checked && state.active !== null && state.active + 1 < state.ayahs.length) {
    playAyah(state.active + 1);
  }
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
    autoNext: document.getElementById('ayahAutoNext'),
    theme: document.getElementById('readingTheme'),
    juz: document.getElementById('juzSelect'),
    pageForm: document.getElementById('pageForm'),
    page: document.getElementById('pageInput'),
    position: document.getElementById('readingPosition'),
    rangeFrom: document.getElementById('rangeFrom'),
    rangeTo: document.getElementById('rangeTo'),
    rangeTimes: document.getElementById('rangeTimes'),
    rangeBtn: document.getElementById('rangePlay'),
    rangeStatus: document.getElementById('rangeStatus'),
  });

  el.text.addEventListener('click', (event) => {
    const span = event.target.closest('.ayah-span');
    if (span && el.text.contains(span)) { stopRange(); playAyah(Number(span.dataset.index)); }
  });
  el.text.addEventListener('keydown', (event) => {
    const span = event.target.closest?.('.ayah-span');
    if (span && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); stopRange(); playAyah(Number(span.dataset.index)); }
  });
  el.loopCheck.addEventListener('change', () => { el.ayahAudio.loop = el.loopCheck.checked && !state.range; });
  el.ayahAudio.addEventListener('play', pauseSurah);
  el.ayahAudio.addEventListener('ended', onAyahEnded);
  el.bookmark.addEventListener('click', saveBookmark);

  const saved = Number(getJSON(KEYS.fontScale, NaN));
  if (Number.isFinite(saved)) applyFontScale(saved);
  document.getElementById('fontSmaller').addEventListener('click', () => applyFontScale(currentFontRem() - 0.15));
  document.getElementById('fontLarger').addEventListener('click', () => applyFontScale(currentFontRem() + 0.15));

  applyReadingTheme(getString(KEYS.readingTheme, 'default'));
  el.theme.addEventListener('change', () => applyReadingTheme(el.theme.value));
  populateJuz();
  el.juz.addEventListener('change', () => { const pos = juzStart(Number(el.juz.value)); if (pos) goToPosition(pos); });
  el.pageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const pos = pageStart(Math.round(Number(el.page.value)));
    if (pos) goToPosition(pos); else el.page.reportValidity();
  });
  el.rangeBtn.addEventListener('click', () => { if (state.range) { stopRange(); el.ayahAudio.pause(); } else startRange(); });

  onSettingsChange(() => { if (state.active !== null && !el.details.hidden) loadDetails(); });
  onLanguageChange(() => {
    renderHeader();
    populateJuz();
    if (state.ayahs.length) renderPosition(state.active ?? 0);
    if (!state.range) stopRange();
    if (state.active !== null && !el.details.hidden) {
      el.detailsTitle.textContent = `${t('ayah_label')} ﴿${state.ayahs[state.active].numberInSurah}﴾`;
      resetBookmarkButton();
      loadDetails();
    }
  });
}

export const _readerState = state; // for tests
