// Reading progress: which ayahs were shown in the reading view, per local day, under a NEW key
// ("readingLog"). An ayah counts as read when at least 60 % of it has been on screen for one second.
// `seen` keeps the distinct ayahs ever read (for khatma progress); days older than 90 are pruned.

import { localDateKey } from './dom.js';
import { KEYS, getJSON, setJSON } from './storage.js';

const KEEP_DAYS = 90;
const TOTAL_AYAHS = 6236;

function load() {
  const raw = getJSON(KEYS.readingLog, null);
  const days = raw?.days && typeof raw.days === 'object' && !Array.isArray(raw.days) ? raw.days : {};
  const seen = Array.isArray(raw?.seen) ? raw.seen.filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL_AYAHS) : [];
  return { days, seen };
}

const listeners = new Set();
export const onReadingChange = (fn) => listeners.add(fn);

/** Record global ayah ids as read today. Returns how many were new today. */
export function markRead(ids, today = localDateKey()) {
  const log = load();
  const day = new Set(Array.isArray(log.days[today]) ? log.days[today] : []);
  const seen = new Set(log.seen);
  let added = 0;
  for (const id of ids) {
    if (!(id >= 1 && id <= TOTAL_AYAHS)) continue;
    if (!day.has(id)) { day.add(id); added += 1; }
    seen.add(id);
  }
  if (!added) return 0;
  log.days[today] = [...day];
  for (const key of Object.keys(log.days).sort().slice(0, -KEEP_DAYS)) delete log.days[key];
  setJSON(KEYS.readingLog, { days: log.days, seen: [...seen].sort((a, b) => a - b) });
  for (const fn of listeners) fn();
  return added;
}

export const readToday = (today = localDateKey()) => (Array.isArray(load().days[today]) ? load().days[today].length : 0);
export const readTotal = () => load().seen.length;
export const khatmaPercent = () => Math.floor((readTotal() / TOTAL_AYAHS) * 1000) / 10;
