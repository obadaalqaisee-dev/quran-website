// Application entry point: wires the feature modules together. No inline handlers are used anywhere,
// so the Content Security Policy can forbid inline scripts.

import { initialLanguage, setLanguage } from './core/i18n.js';
import { initDialogs } from './core/modal.js';
import { initAdhkar } from './features/adhkar.js';
import { initAyahSearch } from './features/ayah-search.js';
import { initFavorites, refreshFavorites } from './features/favorites.js';
import { initIslamicSearch } from './features/islamic-search.js';
import { initPlayer, playSurah } from './features/player.js';
import { initPrayer } from './features/prayer.js';
import { initProfile, welcome } from './features/profile.js';
import { initReader, readSurah } from './features/reader.js';
import { initRosary } from './features/rosary.js';
import { initSurahList, renderBookmarkBanner } from './features/surahs.js';
import { initTheme } from './features/theme.js';
import { initMemorization, notifyMemoChange } from './features/memorization.js';
import { initVoiceLab } from './features/voice-lab.js';
import { initWird, setWird } from './features/wird.js';

function initLanguageSelect() {
  const select = document.getElementById('langSelect');
  select.value = document.documentElement.lang;
  select.addEventListener('change', () => setLanguage(select.value));
}

function initTopButton() {
  const button = document.getElementById('topButton');
  const hero = document.getElementById('home');
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('main').focus({ preventScroll: true });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { button.hidden = entry.isIntersecting; }, { rootMargin: '-300px 0px 0px 0px' })
      .observe(hero);
  } else {
    button.hidden = false;
  }
}

function hideBrokenHero() {
  const img = document.querySelector('.hero-bg');
  const hide = () => { img.hidden = true; }; // the gradient background remains
  if (img.complete && img.naturalWidth === 0) hide();
  else img.addEventListener('error', hide, { once: true });
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => { /* offline support is optional */ });
  });
}

function boot() {
  setLanguage(initialLanguage(), { persist: false });
  initDialogs();
  initTheme();
  initLanguageSelect();
  initTopButton();
  hideBrokenHero();

  // Surah actions are shared by several features.
  const openReader = (n, ayahIndex = null) => readSurah(n, ayahIndex);
  initPlayer();
  initReader({
    onBookmark: () => {
      setWird('quran', true, { announce: false }); // saving a bookmark completes the Quran wird (as before)
      renderBookmarkBanner();
    },
  });
  initSurahList({ playSurah, readSurah: openReader });
  initFavorites({ readSurah: openReader });
  initWird();
  initPrayer();
  initAdhkar();
  initRosary();
  initAyahSearch({ readSurah: openReader });
  initIslamicSearch({ readSurah: openReader });
  initVoiceLab({ onMemoChange: notifyMemoChange });
  initMemorization();
  initProfile({ onReset: refreshFavorites });
  welcome();
  registerServiceWorker();
  document.documentElement.classList.add('js-ready');
}

boot();
