// Entry point of the «من أنا» page (about.html): a separate page, so browser back/forward work natively.
//
// Two independent media elements:
//   * #aboutVideo: the site owner's video of the Al-Aqsa courtyard. Always muted (and the file itself has no audio
//     track), no controls, autoplay + loop + playsinline set in the HTML. Only the VIDEO element is muted; nothing
//     here touches the nasheed's volume or mute state, and no page-wide audio setting is changed.
//   * #nasheedAudio: the nasheed, played in the background at its normal volume with no visible player.
//
// Nasheed autoplay:
//   * On entering the page (first load, or coming back from the back/forward cache) playback is attempted
//     immediately, from the beginning.
//   * Browsers may refuse audible autoplay until the visitor has interacted with the site (mobile browsers
//     especially). The refusal (NotAllowedError) is expected: no player is brought back; instead the nasheed starts
//     on the visitor's first interaction anywhere on the page (tap, click or key press). No error is shown.
//   * The state (the audio element's data-state) only says "playing" after the media has actually started.
//   * Leaving the page (pagehide) pauses the nasheed; it does not autoplay anywhere else on the site.

import { initialLanguage, setLanguage } from './core/i18n.js';
import { ABOUT_MEDIA, isConfigured } from './data/about-media.js';
import { initTheme } from './features/theme.js';

const el = {};
const player = { state: 'idle' };

// Events that count as a user activation in current browsers (touchstart and pointerdown on touch screens do not).
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click'];

function setState(state) {
  player.state = state;
  el.audio.dataset.state = state;
}

function onGesture() { if (el.audio.paused) start(); }
function armGestureFallback() { for (const type of GESTURES) window.addEventListener(type, onGesture, { capture: true, passive: true }); }
function disarmGestureFallback() { for (const type of GESTURES) window.removeEventListener(type, onGesture, { capture: true }); }

/** Try to start playback; a refusal by the browser's autoplay policy waits for the first interaction. */
async function start({ fromBeginning = false } = {}) {
  if (fromBeginning) { try { el.audio.currentTime = 0; } catch { /* not seekable yet */ } }
  setState('loading');
  try {
    await el.audio.play();
    // The 'playing' event switches the state to "playing" once sound actually starts.
  } catch (err) {
    if (err?.name === 'NotAllowedError') { setState('blocked'); armGestureFallback(); }
    else if (el.audio.error) setState('error');
    else setState('paused'); // interrupted (e.g. paused while starting): no false "playing"
  }
}

function initNasheed() {
  const media = ABOUT_MEDIA.nasheed;
  if (!isConfigured(media)) { setState('unavailable'); return; }
  const audio = el.audio;
  audio.src = media.src;
  audio.muted = false;
  audio.volume = 1; // the recording's original level

  audio.addEventListener('playing', () => { setState('playing'); disarmGestureFallback(); });
  audio.addEventListener('waiting', () => { if (!audio.paused) setState('loading'); });
  audio.addEventListener('pause', () => { if (!audio.ended && player.state !== 'blocked') setState('paused'); });
  audio.addEventListener('ended', () => setState('ended'));
  audio.addEventListener('error', () => setState('error'));

  // Leaving the page: stop the nasheed. Coming back from the back/forward cache: start again from the beginning.
  window.addEventListener('pagehide', () => audio.pause());
  window.addEventListener('pageshow', (event) => { if (event.persisted) start({ fromBeginning: true }); });

  // Autoplay on entering the page.
  start({ fromBeginning: true });
}

function initVideo() {
  const video = el.video;
  // The muted-autoplay rule needs the property (not only the attribute) to be true. This affects the video only.
  video.muted = true;
  video.defaultMuted = true;
  video.controls = false;
  video.loop = true;
  video.addEventListener('volumechange', () => { if (!video.muted) video.muted = true; });
  // If the file cannot load (e.g. offline: video is streamed, not cached), the precached poster frame stays visible.
  const play = () => video.play().catch(() => { /* the poster stays visible (e.g. data-saver modes) */ });
  if (video.paused) play();
  // Back/forward cache: resume the loop when the page is shown again.
  window.addEventListener('pageshow', (event) => { if (event.persisted && video.paused) play(); });
}

function boot() {
  setLanguage(initialLanguage(), { persist: false });
  initTheme();
  Object.assign(el, {
    audio: document.getElementById('nasheedAudio'),
    video: document.getElementById('aboutVideo'),
  });
  const lang = document.getElementById('langSelect');
  lang.value = document.documentElement.lang;
  lang.addEventListener('change', () => setLanguage(lang.value));
  initVideo();
  initNasheed();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => {}));
  }
  document.documentElement.classList.add('js-ready');
}

boot();

export const _aboutState = player; // for tests
