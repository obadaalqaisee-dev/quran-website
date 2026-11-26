// Application entry point: wires the feature modules together. No inline handlers are used anywhere,
// so the Content Security Policy can forbid inline scripts.

import { initialLanguage, setLanguage } from './core/i18n.js';
import { initDialogs, openDialog } from './core/modal.js';
import { initAdhkar } from './features/adhkar.js';
import { initDashboard, refreshDashboard } from './features/dashboard.js';
import { initAyahSearch } from './features/ayah-search.js';
import { initFavorites, refreshFavorites } from './features/favorites.js';
import { initIslamicSearch } from './features/islamic-search.js';
import { initPlayer, playSurah } from './features/player.js';
import { initPrayer } from './features/prayer.js';
import { initProfile, welcome } from './features/profile.js';
import { initReader, readSurah } from './features/reader.js';
import { initRosary } from './features/rosary.js';
import { initSettingsPanel } from './features/settings-panel.js';
import { initSurahList, renderBookmarkBanner } from './features/surahs.js';
import { initTheme } from './features/theme.js';
import { initLearn } from './features/learn.js';
import { initMemorization, notifyMemoChange, onMemoChange } from './features/memorization.js';
import { initVoiceLab, practiceAyah, startRevision } from './features/voice-lab.js';
import { initAssistant } from './features/assistant.js';
import { initBackupPanel } from './features/backup-panel.js';
import { initInsights } from './features/insights.js';
import { initNotes } from './features/notes.js';
import { trackAudio } from './core/listening-log.js';
import { initWird, setWird } from './features/wird.js';
// Added by the platform transformation: multi-page navigation, sidebar, home dashboard, Quran Journey.
import { setRevealHandler } from './core/dom.js';
import { bindPageDialogs } from './core/modal.js';
import { currentPage, initRouter, navigate, registerRouteAction, revealElement } from './core/router.js';
import { PAGE_DIALOGS } from './core/routes.js';
import { initSidebar, openSidebar } from './features/sidebar.js';
import { initHome } from './features/home.js';
import { initJourney, refreshJourney, showJourney } from './features/journey.js';
import { askAssistant } from './features/assistant.js';
import { openTasbeeh } from './features/adhkar.js';
import { openLesson } from './features/learn.js';
import { getJSON, KEYS } from './core/storage.js';

function initLanguageSelect() {
  const select = document.getElementById('langSelect');
  select.value = document.documentElement.lang;
  select.addEventListener('change', () => setLanguage(select.value));
}

function initTopButton() {
  const button = document.getElementById('topButton');
  const hero = document.getElementById('topSentinel') || document.getElementById('home');
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

/**
 * Start one feature. A feature that fails to start (for example on corrupt stored data) is reported in the
 * console and the rest of the site keeps working, instead of one exception stopping every later feature.
 */
function safely(name, start) {
  try { start(); } catch (err) { console.error(`[${name}] could not start`, err); }
}

function boot() {
  setLanguage(initialLanguage(), { persist: false });
  initDialogs();
  // Pages: dialogs that became pages navigate there; scrolling to an element on another page shows that page.
  bindPageDialogs(PAGE_DIALOGS, navigate, currentPage);
  setRevealHandler(revealElement);
  safely('initSidebar', () => initSidebar());
  initTheme();
  initLanguageSelect();
  initTopButton();
  hideBrokenHero();

  // Surah actions are shared by several features.
  const openReader = (n, ayahIndex = null, opts) => readSurah(n, ayahIndex, opts);
  safely('initPlayer', () => initPlayer());
  safely('initReader', () => initReader({
    onBookmark: () => {
      setWird('quran', true, { announce: false }); // saving a bookmark completes the Quran wird (as before)
      renderBookmarkBanner();
      document.dispatchEvent(new CustomEvent('bookmarkchange'));
    },
  }));
  safely('initSurahList', () => initSurahList({ playSurah, readSurah: openReader }));
  safely('initFavorites', () => initFavorites({ readSurah: openReader }));
  safely('initWird', () => initWird());
  safely('initPrayer', () => initPrayer());
  safely('initAdhkar', () => initAdhkar());
  safely('initRosary', () => initRosary());
  safely('initAyahSearch', () => initAyahSearch({ readSurah: openReader }));
  safely('initIslamicSearch', () => initIslamicSearch({ readSurah: openReader }));
  safely('initVoiceLab', () => initVoiceLab({ onMemoChange: notifyMemoChange }));
  safely('initMemorization', () => initMemorization());

  // Added by the platform evolution: learning, dashboard and settings.
  const openLab = () => openDialog('voiceTestModal');
  const openPlan = () => { openLab(); document.getElementById('labTabPlan').click(); };
  const openSettings = () => openDialog('settingsModal');
  safely('initLearn', () => initLearn({ readSurah: openReader, openLab, openPlan, openSettings }));
  safely('initSettingsPanel', () => initSettingsPanel({ onMemoGoalChange: notifyMemoChange }));
  safely('initDashboard', () => initDashboard({ readSurah: openReader, openLab, openSettings }));
  onMemoChange(refreshDashboard);
  onMemoChange(() => refreshJourney({ keepStep: true }));
  safely('initProfile', () => initProfile({ onReset: refreshFavorites }));

  // Added by the innovation phase: insights, ayah notes and collections, backup, listening statistics.
  safely('initInsights', () => initInsights({
    readSurah: openReader,
    openLab,
    startRevision: (surah) => { openLab(); startRevision(surah); },
    practiceAyah: (surah, ayah) => { openLab(); practiceAyah(surah, ayah); },
  }));
  safely('initNotes', () => initNotes({ readSurah: (n, index) => readSurah(n, index, { play: false }) }));
  safely('initBackupPanel', () => initBackupPanel());
  safely('initAssistant', () => initAssistant({ readSurah: openReader, openPlan, navigate, openMenu: openSidebar }));
  safely('initHome', () => initHome({ readSurah: openReader }));
  safely('initJourney', () => initJourney({
    navigate, readSurah: openReader, openLab, openPlan, openLesson, openDialog, openTasbeeh, ask: askAssistant,
  }));

  // Route actions: "#/quran/18", "#/read", "#/memorize/plan", "#/learn-prayer/wudu", "#/adhkar/evening", "#/journey/…".
  registerRouteAction('quran', (param) => { const n = Number(param); if (n >= 1 && n <= 114) readSurah(n, null, { play: false }); });
  registerRouteAction('read', () => {
    const b = getJSON(KEYS.bookmark, null);
    if (b && Number(b.surahNum) >= 1 && Number(b.surahNum) <= 114) readSurah(Number(b.surahNum), Number(b.ayahIndex) || 0, { play: false });
    else if (!document.getElementById('readingSection').hidden) document.getElementById('readingSection').scrollIntoView();
    else readSurah(1, null, { play: false });
  });
  registerRouteAction('memorize', (param) => {
    const tab = document.getElementById(param === 'plan' ? 'labTabPlan' : 'labTabRecite');
    if (param) tab?.click();
  });
  registerRouteAction('learn-prayer', (param) => { if (param) openLesson(param); });
  registerRouteAction('wudu', () => openLesson('wudu'));
  registerRouteAction('tasbih', () => openTasbeeh());
  registerRouteAction('adhkar', (param) => { if (param) document.getElementById(`tab_${param}`)?.click(); });
  registerRouteAction('journey', (param) => showJourney(param));
  registerRouteAction('reminders', () => showJourney('reminders'));
  safely('trackAudio', () => trackAudio(document.getElementById('audioPlayer'), () => document.getElementById('reciterSelect').value));
  safely('trackAudio', () => trackAudio(document.getElementById('ayahPlayer'), () => 'ayah'));
  welcome();
  initRouter(); // shows the page in the address (direct links, refresh, back/forward)
  registerServiceWorker();
  document.documentElement.classList.add('js-ready');
}

boot();
