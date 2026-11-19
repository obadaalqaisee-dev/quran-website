// Surah audio player: 16 reciters (original URLs), previous/next, surah loop, auto-advance,
// fallback links, playback speed, lock-screen (Media Session) controls and a persistent mini player.

import { resolveAudio } from '../core/api.js';
import { h, scrollIntoViewSmart } from '../core/dom.js';
import { isArabic, onLanguageChange, t } from '../core/i18n.js';
import { surahName } from '../core/quran.js';
import { KEYS, getString, setString } from '../core/storage.js';
import { RECITERS } from '../data/reciters.js';

const LOCAL_FATIHA = 'Quran.mp3'; // Al-Fatihah, Abu Bakr Al-Shatri (shipped with the original site)

const el = {};
const state = { surah: 0, loop: false, status: null, attempt: 0, urls: [], token: 0 };

export const reciterLabel = (r) => (isArabic() ? r.name_ar : t(r.i18n_key || `reciter_${r.slug}`));
const currentReciter = () => RECITERS.find((r) => r.slug === el.reciter.value) ?? RECITERS[0];

function setStatus(key, vars) {
  state.status = key ? { key, vars } : null;
  renderStatus();
}

function renderStatus() {
  if (!state.status) return;
  const vars = { ...state.status.vars };
  if (state.status.key === 'player_now') vars.reciter = reciterLabel(currentReciter());
  el.subtitle.textContent = t(state.status.key, vars);
}

function renderReciterOptions() {
  const selected = el.reciter.value || getString(KEYS.reciter) || RECITERS[0].slug;
  el.reciter.replaceChildren(...RECITERS.map((r) => h('option', { value: r.slug, text: reciterLabel(r) })));
  el.reciter.value = RECITERS.some((r) => r.slug === selected) ? selected : RECITERS[0].slug;
}

function renderLoopButton() {
  el.loop.textContent = t(state.loop ? 'btn_loop_on' : 'btn_loop_off');
  el.loop.setAttribute('aria-pressed', String(state.loop));
}

function renderTitles() {
  if (!state.surah) return;
  el.title.textContent = surahName(state.surah);
  el.miniTitle.textContent = surahName(state.surah);
  el.miniReciter.textContent = reciterLabel(currentReciter());
  updateMediaSession();
}

function updateMediaSession() {
  if (!('mediaSession' in navigator) || !state.surah) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: surahName(state.surah),
      artist: reciterLabel(currentReciter()),
      album: t('hero_title'),
      artwork: [
        { src: new URL('assets/icons/icon-192.png', document.baseURI).href, sizes: '192x192', type: 'image/png' },
        { src: new URL('assets/icons/icon-512.png', document.baseURI).href, sizes: '512x512', type: 'image/png' },
      ],
    });
  } catch { /* MediaMetadata unsupported */ }
}

async function tryPlay(url, token) {
  el.audio.src = url;
  el.audio.defaultPlaybackRate = Number(el.speed.value);
  el.audio.playbackRate = Number(el.speed.value);
  el.audio.load();
  try {
    await el.audio.play();
    if (token === state.token) setStatus(url.endsWith(LOCAL_FATIHA) ? 'player_local_fatiha' : 'player_now');
    return true;
  } catch (err) {
    if (token !== state.token) return true;
    // Autoplay policy: the source is fine, the browser just wants a user gesture.
    if (err?.name === 'NotAllowedError') { setStatus('player_tap_play'); return true; }
    return false; // media error → caller tries the next URL
  }
}

async function playNextCandidate(token) {
  while (token === state.token && state.attempt < state.urls.length) {
    const url = state.urls[state.attempt];
    state.attempt += 1;
    if (await tryPlay(url, token)) return;
  }
  if (token !== state.token) return;
  // All remote links failed. Al-Fatihah has a copy stored on the site itself.
  if (state.surah === 1 && !state.urls.includes(LOCAL_FATIHA)) {
    state.urls.push(LOCAL_FATIHA);
    if (await tryPlay(LOCAL_FATIHA, token)) return;
  }
  setStatus('player_failed');
}

export async function playSurah(number, { scroll = true } = {}) {
  const n = Number(number);
  if (!(n >= 1 && n <= 114)) return;
  const token = ++state.token;
  state.surah = n;
  state.attempt = 0;
  document.getElementById('ayahPlayer')?.pause();
  renderTitles();
  setStatus('player_loading');
  showMiniPlayer();
  if (scroll) scrollIntoViewSmart(document.getElementById('audio'));

  const reciter = currentReciter();
  const primary = `${reciter.base_url}${String(n).padStart(3, '0')}.mp3`;
  state.urls = [primary];
  // Start the original URL immediately; fetch alternatives only if it fails.
  if (await tryPlay(primary, token)) return;
  if (token !== state.token) return;
  setStatus('player_fallback');
  state.attempt = 1;
  state.urls = await resolveAudio(reciter, n);
  if (state.urls[0] !== primary) state.urls.unshift(primary);
  await playNextCandidate(token);
}

export const pauseSurah = () => el.audio && !el.audio.paused && el.audio.pause();
export const nextSurah = () => { if (state.surah > 0 && state.surah < 114) playSurah(state.surah + 1, { scroll: false }); };
export const previousSurah = () => { if (state.surah > 1) playSurah(state.surah - 1, { scroll: false }); };

function toggleLoop() {
  state.loop = !state.loop;
  el.audio.loop = state.loop;
  renderLoopButton();
}

// ---------------------------------------------------------------- mini player
let audioSectionVisible = true;
function showMiniPlayer() {
  const show = state.surah > 0 && !audioSectionVisible;
  el.mini.hidden = !show;
  document.body.classList.toggle('has-mini-player', show);
}
function renderMiniState() {
  const playing = !el.audio.paused;
  el.miniPlay.querySelector('span').textContent = playing ? '⏸' : '▶';
  el.miniPlay.setAttribute('aria-label', t(playing ? 'player_pause' : 'player_play'));
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

export function initPlayer() {
  Object.assign(el, {
    audio: document.getElementById('audioPlayer'),
    reciter: document.getElementById('reciterSelect'),
    speed: document.getElementById('speedSelect'),
    title: document.getElementById('playerTitle'),
    subtitle: document.getElementById('playerSubtitle'),
    loop: document.getElementById('loopSurahBtn'),
    mini: document.getElementById('miniPlayer'),
    miniPlay: document.getElementById('miniPlay'),
    miniTitle: document.getElementById('miniTitle'),
    miniReciter: document.getElementById('miniReciter'),
    miniProgress: document.getElementById('miniProgress'),
  });

  renderReciterOptions();
  const savedSpeed = getString(KEYS.speed);
  if (savedSpeed && [...el.speed.options].some((o) => o.value === savedSpeed)) el.speed.value = savedSpeed;

  el.reciter.addEventListener('change', () => {
    setString(KEYS.reciter, el.reciter.value);
    if (state.surah) playSurah(state.surah, { scroll: false });
  });
  el.speed.addEventListener('change', () => {
    el.audio.playbackRate = Number(el.speed.value);
    el.audio.defaultPlaybackRate = Number(el.speed.value);
    setString(KEYS.speed, el.speed.value);
  });
  document.getElementById('prevSurahBtn').addEventListener('click', previousSurah);
  document.getElementById('nextSurahBtn').addEventListener('click', nextSurah);
  el.loop.addEventListener('click', toggleLoop);
  document.getElementById('miniPrev').addEventListener('click', previousSurah);
  document.getElementById('miniNext').addEventListener('click', nextSurah);
  el.miniPlay.addEventListener('click', () => (el.audio.paused ? el.audio.play().catch(() => {}) : el.audio.pause()));

  el.audio.addEventListener('ended', () => { if (!state.loop) nextSurah(); });
  el.audio.addEventListener('play', () => { document.getElementById('ayahPlayer')?.pause(); renderMiniState(); });
  el.audio.addEventListener('pause', renderMiniState);
  el.audio.addEventListener('playing', () => { if (state.status?.key === 'player_tap_play') setStatus('player_now'); });
  el.audio.addEventListener('timeupdate', () => {
    const pct = el.audio.duration ? (el.audio.currentTime / el.audio.duration) * 100 : 0;
    el.miniProgress.style.width = `${pct}%`;
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { audioSectionVisible = entry.isIntersecting; showMiniPlayer(); })
      .observe(document.getElementById('audio'));
  }

  if ('mediaSession' in navigator) {
    const ms = navigator.mediaSession;
    const handlers = {
      play: () => el.audio.play().catch(() => {}),
      pause: () => el.audio.pause(),
      previoustrack: previousSurah,
      nexttrack: nextSurah,
    };
    for (const [action, fn] of Object.entries(handlers)) {
      try { ms.setActionHandler(action, fn); } catch { /* unsupported action */ }
    }
  }

  onLanguageChange(() => {
    renderReciterOptions();
    renderLoopButton();
    renderTitles();
    renderStatus();
    renderMiniState();
  });
  renderLoopButton();
}

export const _playerState = state; // for tests
