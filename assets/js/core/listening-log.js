// Listening statistics, kept on this device under a NEW key ("listeningLog"); no existing key is read or changed.
// { days: { 'YYYY-MM-DD': seconds }, reciters: { slug: seconds } }. Only time during which audio was actually
// playing is counted (gaps over 2 s, e.g. seeking or a throttled tab, are ignored). Days older than 90 are pruned.

import { localDateKey } from './dom.js';
import { KEYS, getJSON, setJSON } from './storage.js';

export const LISTENING_KEY = KEYS.listening;
const KEEP_DAYS = 90;
const MAX_STEP = 2; // seconds; larger jumps between two timeupdate events are seeks, not listening

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const clean = (obj) => Object.fromEntries(Object.entries(isObj(obj) ? obj : {})
  .filter(([, v]) => Number.isFinite(Number(v)) && Number(v) >= 0)
  .map(([k, v]) => [k, Math.round(Number(v))]));

export function loadListening() {
  const raw = getJSON(LISTENING_KEY, null);
  return { days: clean(raw?.days), reciters: clean(raw?.reciters) };
}

const listeners = new Set();
export const onListeningChange = (fn) => listeners.add(fn);

/** Add listened seconds for a reciter (slug) or 'ayah' (single-ayah playback). */
export function addListening(seconds, source, today = localDateKey()) {
  const s = Math.round(Number(seconds));
  if (!(s > 0) || s > 6 * 3600) return false;
  const log = loadListening();
  log.days[today] = (log.days[today] || 0) + s;
  if (typeof source === 'string' && /^[a-z0-9_-]{1,40}$/i.test(source)) log.reciters[source] = (log.reciters[source] || 0) + s;
  for (const key of Object.keys(log.days).sort().slice(0, -KEEP_DAYS)) delete log.days[key];
  setJSON(LISTENING_KEY, log);
  for (const fn of listeners) fn();
  return true;
}

/**
 * Track an <audio> element: accumulates real playing time and flushes it every 30 s, on pause/end and when
 * the page is hidden. `source()` returns the reciter slug at flush time.
 */
export function trackAudio(audio, source) {
  let last = null;
  let pending = 0;
  const flush = () => {
    if (pending >= 1) addListening(pending, source());
    pending = 0;
  };
  audio.addEventListener('timeupdate', () => {
    if (audio.paused || audio.seeking) { last = null; return; }
    const now = audio.currentTime;
    if (last !== null) {
      const step = (now - last) / (audio.playbackRate || 1);
      if (step > 0 && step <= MAX_STEP) pending += step;
    }
    last = now;
    if (pending >= 30) flush();
  });
  for (const evt of ['pause', 'ended', 'emptied']) audio.addEventListener(evt, () => { last = null; flush(); });
  audio.addEventListener('seeking', () => { last = null; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  return flush;
}
