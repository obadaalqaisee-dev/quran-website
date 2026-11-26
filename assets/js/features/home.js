// Home dashboard: greeting with today's Gregorian and Hijri dates, today's five prayers with the next one and
// its countdown (the existing prayer feature fills the countdown card), Quran access (continue reading, open a
// surah, recently read surahs), and the notification buttons shared by the home and prayer pages.
// Also wires the small surah picker of the «التفسير والترجمات» page.
//
// Every figure comes from data the site already has; remote text is inserted with textContent only.

import { $$, h } from '../core/dom.js';
import { isArabic, locale, onLanguageChange, t } from '../core/i18n.js';
import { surahName, surahs } from '../core/quran.js';
import { onRouteChange } from '../core/router.js';
import { updateSettings } from '../core/settings.js';
import { KEYS, getJSON, setJSON } from '../core/storage.js';
import { PRAYER_KEYS, formatTime, nextPrayer, prayerData, prayerLabel, renderNotifyButton, requestPrayerNotifications } from './prayer.js';

const RECENT_MAX = 6;
let actions = { readSurah: () => {} };
const el = {};

// ------------------------------------------------------------------ recently read surahs
export function recentSurahs() {
  const list = getJSON(KEYS.recentRead, []);
  return Array.isArray(list) ? list.map(Number).filter((n) => n >= 1 && n <= 114).slice(0, RECENT_MAX) : [];
}

export function rememberSurah(n) {
  const num = Number(n);
  if (!(num >= 1 && num <= 114)) return;
  setJSON(KEYS.recentRead, [num, ...recentSurahs().filter((x) => x !== num)].slice(0, RECENT_MAX));
}

// ------------------------------------------------------------------ dates
function renderDates() {
  const now = new Date();
  try {
    el.date.textContent = new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now);
  } catch { el.date.textContent = now.toDateString(); }
  // Same Hijri date as the prayer page (api.aladhan.com) when it is loaded; otherwise the browser's Umm al-Qura calendar.
  const hijri = prayerData()?.hijri;
  if (hijri) {
    el.hijri.textContent = `${hijri.day} ${isArabic() ? hijri.month_ar : hijri.month_en} ${hijri.year} ${t('hijri_suffix')}`;
  } else {
    try {
      el.hijri.textContent = new Intl.DateTimeFormat(`${locale()}-u-ca-islamic-umalqura`, { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    } catch { el.hijri.textContent = ''; }
  }
}

// ------------------------------------------------------------------ prayers
function renderPrayers() {
  const data = prayerData();
  if (!data) {
    el.prayers.replaceChildren(h('li', { class: 'small muted', text: t('loading_prayers') }));
    return;
  }
  const next = nextPrayer(data.timings);
  el.prayers.replaceChildren(...PRAYER_KEYS.map((key) => h('li', {
    class: `home-prayer-item${next?.key === key ? ' is-next' : ''}`,
    attrs: next?.key === key ? { 'aria-current': 'time' } : {},
  }, h('span', { text: prayerLabel(key) }), h('strong', { dir: 'ltr', text: formatTime(data.timings[key]) }))));
  renderDates();
}

function renderNotifyButtons() {
  for (const button of $$('[data-notify-btn]')) renderNotifyButton(button);
}

// ------------------------------------------------------------------ Quran access
function fillSurahSelect(select) {
  if (!select) return;
  const value = select.value;
  select.replaceChildren(...surahs.map((s) => h('option', { value: String(s.number), text: `${s.number}. ${surahName(s.number)}` })));
  if (value) select.value = value;
}

function renderContinue() {
  const bookmark = getJSON(KEYS.bookmark, null);
  const valid = bookmark && Number(bookmark.surahNum) >= 1 && Number(bookmark.surahNum) <= 114;
  el.continue.replaceChildren(valid
    ? h('button', {
      class: 'btn btn-primary home-continue-btn', type: 'button',
      text: `${t('bookmark_resume', { surah: surahName(Number(bookmark.surahNum)), ayah: bookmark.ayahNumInSurah })}`,
      on: { click: () => actions.readSurah(Number(bookmark.surahNum), Number(bookmark.ayahIndex)) },
    })
    : h('p', { class: 'small muted', text: t('home_no_bookmark') }));
}

function renderRecent() {
  const list = recentSurahs();
  el.recent.replaceChildren(...(list.length
    ? list.map((n) => h('li', {}, h('button', { class: 'chip-btn', type: 'button', text: surahName(n), on: { click: () => actions.readSurah(n, null, { play: false }) } })))
    : [h('li', { class: 'small muted', text: t('home_recent_empty') })]));
}

function render() {
  renderDates();
  renderPrayers();
  renderNotifyButtons();
  fillSurahSelect(el.select);
  fillSurahSelect(el.tafsirSelect);
  renderContinue();
  renderRecent();
}

export function initHome(handlers) {
  actions = { ...actions, ...handlers };
  Object.assign(el, {
    date: document.getElementById('homeDate'),
    hijri: document.getElementById('homeHijri'),
    prayers: document.getElementById('homePrayerList'),
    continue: document.getElementById('homeContinue'),
    select: document.getElementById('homeSurahSelect'),
    form: document.getElementById('homeOpenForm'),
    recent: document.getElementById('homeRecent'),
    tafsirSelect: document.getElementById('tafsirSurahSelect'),
    tafsirForm: document.getElementById('tafsirOpenForm'),
  });
  if (!el.prayers) return;
  el.form.addEventListener('submit', (event) => {
    event.preventDefault();
    actions.readSurah(Number(el.select.value), null, { play: false });
  });
  el.tafsirForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    // Show the tafsir in every interface language (the Arabic interface always shows it), then open the
    // surah on its first ayah so the tafsir panel is visible straight away.
    if (!isArabic()) updateSettings({ alwaysTafsir: true });
    actions.readSurah(Number(el.tafsirSelect.value), 0, { play: false, details: true });
  });
  for (const button of $$('[data-notify-btn]')) {
    button.addEventListener('click', async () => { await requestPrayerNotifications(button); renderNotifyButtons(); });
  }
  document.addEventListener('prayerupdate', renderPrayers);
  document.addEventListener('surahrendered', (event) => { rememberSurah(event.detail?.surah); renderRecent(); });
  document.addEventListener('bookmarkchange', renderContinue);
  onLanguageChange(render);
  onRouteChange((r) => { if (r.page === 'home') { renderContinue(); renderNotifyButtons(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) renderDates(); });
  render();
}
