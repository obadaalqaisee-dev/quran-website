// Entry point of the «من أنا» page (about.html): a separate page, so browser back/forward work natively.
//
// Nasheed autoplay:
//   * On entering the page (first load, or coming back from the back/forward cache) playback is attempted
//     immediately, from the beginning.
//   * Browsers may refuse audible autoplay until the visitor has interacted with the site (mobile browsers
//     especially). The refusal (NotAllowedError) is expected: a large "tap to play" button is shown and one
//     tap starts the nasheed. No error is shown for it.
//   * The status only says "playing" after the media element has actually started ('playing' event).
//   * Leaving the page (pagehide) pauses the nasheed; it does not autoplay anywhere else on the site.
//   * Language or theme changes re-render labels only; they never restart the audio.

import { getSurah } from './core/api.js';
import { stripBasmala } from './core/arabic.js';
import { initialLanguage, onLanguageChange, setLanguage, t } from './core/i18n.js';
import { KEYS, getString, setString } from './core/storage.js';
import { ABOUT_MEDIA, isConfigured } from './data/about-media.js';
import { initTheme } from './features/theme.js';

const el = {};
const player = { state: 'idle' };

const fmt = (sec) => {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

function setState(state) {
  player.state = state;
  el.status.textContent = t(`nasheed_status_${state}`);
  el.status.dataset.state = state;
  const playing = state === 'playing' || state === 'loading';
  el.play.setAttribute('aria-pressed', String(playing));
  el.play.setAttribute('aria-label', t(playing ? 'nasheed_pause' : 'nasheed_play'));
  el.play.querySelector('span').textContent = playing ? '⏸' : '▶';
  el.start.hidden = state !== 'blocked';
  el.card.dataset.state = state;
}

/** Try to start playback; a refusal by the browser's autoplay policy shows the one-tap button. */
async function start({ fromBeginning = false } = {}) {
  if (fromBeginning) { try { el.audio.currentTime = 0; } catch { /* not seekable yet */ } }
  setState('loading');
  try {
    await el.audio.play();
    // The 'playing' event switches the state to "playing" once sound actually starts.
  } catch (err) {
    if (err?.name === 'NotAllowedError') setState('blocked');
    else if (el.audio.error) setState('error');
    else setState('paused'); // interrupted (e.g. paused while starting): no false "playing"
  }
}

function initNasheed() {
  const media = ABOUT_MEDIA.nasheed;
  el.line.textContent = media.firstLine;
  el.meta.textContent = [media.title, media.performer].filter(Boolean).join(' — ');
  if (!isConfigured(media)) {
    // No verified, licensed recording has been added yet: say so plainly; never pretend to play.
    for (const control of [el.play, el.seek, el.volume]) control.disabled = true;
    setState('unavailable');
    return;
  }
  const audio = el.audio;
  audio.src = media.src;
  const savedVolume = Number(getString(KEYS.nasheedVolume, '0.8'));
  audio.volume = Number.isFinite(savedVolume) ? Math.min(1, Math.max(0, savedVolume)) : 0.8;
  el.volume.value = String(audio.volume);

  audio.addEventListener('playing', () => setState('playing'));
  audio.addEventListener('waiting', () => { if (!audio.paused) setState('loading'); });
  audio.addEventListener('pause', () => { if (!audio.ended && player.state !== 'blocked') setState('paused'); });
  audio.addEventListener('ended', () => setState('ended'));
  audio.addEventListener('error', () => setState('error'));
  audio.addEventListener('loadedmetadata', () => { el.duration.textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', () => {
    el.current.textContent = fmt(audio.currentTime);
    if (audio.duration && !player.seeking) el.seek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
  });

  el.play.addEventListener('click', () => { if (audio.paused) start(); else audio.pause(); });
  el.start.addEventListener('click', () => start());
  el.seek.addEventListener('input', () => { player.seeking = true; });
  el.seek.addEventListener('change', () => {
    player.seeking = false;
    if (audio.duration) audio.currentTime = (Number(el.seek.value) / 1000) * audio.duration;
  });
  el.volume.addEventListener('input', () => {
    audio.volume = Number(el.volume.value);
    setString(KEYS.nasheedVolume, String(audio.volume));
  });

  // Leaving the page: stop the nasheed. Coming back from the back/forward cache: start again from the beginning.
  window.addEventListener('pagehide', () => audio.pause());
  window.addEventListener('pageshow', (event) => { if (event.persisted) start({ fromBeginning: true }); });

  // Autoplay on entering the page.
  start({ fromBeginning: true });
}

function initPhoto() {
  const media = ABOUT_MEDIA.image;
  if (!isConfigured(media)) return; // no verified Al-Aqsa photograph configured: no substitute is shown
  el.img.src = media.src;
  el.img.width = media.width;
  el.img.height = media.height;
  el.img.alt = media.alt;
  el.img.addEventListener('error', () => { el.figure.hidden = true; document.body.classList.remove('has-aqsa-photo'); }, { once: true });
  const credit = document.createElement('a');
  credit.href = media.sourceUrl;
  credit.target = '_blank';
  credit.rel = 'noopener noreferrer';
  credit.textContent = [media.credit, media.license].filter(Boolean).join(' · ');
  el.credit.replaceChildren(document.createTextNode(`${t('about_photo_credit')} `), credit);
  el.figure.hidden = false;
  document.body.classList.add('has-aqsa-photo');
}

async function initVerse() {
  try {
    const data = await getSurah(17);
    const ayah = data.ayahs.find((a) => a.numberInSurah === 1);
    if (!ayah) return;
    el.verse.textContent = `﴿${stripBasmala(ayah.text, 17, 1)}﴾ [الإسراء: 1]`;
    el.verse.hidden = false;
  } catch { /* offline and never loaded: the verse is simply not shown */ }
}

function boot() {
  setLanguage(initialLanguage(), { persist: false });
  initTheme();
  Object.assign(el, {
    card: document.querySelector('.nasheed-card'),
    audio: document.getElementById('nasheedAudio'),
    play: document.getElementById('nasheedPlay'),
    start: document.getElementById('nasheedStart'),
    seek: document.getElementById('nasheedSeek'),
    volume: document.getElementById('nasheedVolume'),
    current: document.getElementById('nasheedCurrent'),
    duration: document.getElementById('nasheedDuration'),
    status: document.getElementById('nasheedStatus'),
    line: document.getElementById('nasheedLine'),
    meta: document.getElementById('nasheedMeta'),
    figure: document.getElementById('aqsaFigure'),
    img: document.getElementById('aqsaImage'),
    credit: document.getElementById('aqsaCredit'),
    verse: document.getElementById('aqsaVerse'),
  });
  const lang = document.getElementById('langSelect');
  lang.value = document.documentElement.lang;
  lang.addEventListener('change', () => setLanguage(lang.value));
  onLanguageChange(() => setState(player.state)); // labels only; the audio is not restarted
  initPhoto();
  initNasheed();
  initVerse();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {}));
  }
  document.documentElement.classList.add('js-ready');
}

boot();

export const _aboutState = player; // for tests
