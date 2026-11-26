// Gentle daily reminders for the Quran Journey (key "journeyReminders"): at most one per type per day, at a
// time the visitor chooses, only while the site is open (or installed and active). Off by default.
// Pure functions; the scheduling (a one-minute check) lives in features/journey.js.

import { KEYS, getJSON, setJSON } from './storage.js';

export const REMINDER_TYPES = Object.freeze([
  { id: 'quran', time: '20:00', route: 'read' },
  { id: 'memorize', time: '17:00', route: 'memorize' },
  { id: 'revision', time: '18:00', route: 'memorize/plan' },
  { id: 'adhkar', time: '07:00', route: 'adhkar' },
  { id: 'learning', time: '21:00', route: 'journey' },
]);

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeReminders(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const type of REMINDER_TYPES) {
    const r = src[type.id] && typeof src[type.id] === 'object' ? src[type.id] : {};
    out[type.id] = { on: r.on === true, time: TIME.test(r.time) ? r.time : type.time, last: DATE.test(r.last) ? r.last : null };
  }
  return out;
}

export const loadReminders = () => normalizeReminders(getJSON(KEYS.reminders, null));
export const saveReminders = (data) => setJSON(KEYS.reminders, data);

export function setReminder(data, id, { on, time } = {}) {
  if (!data[id]) return data;
  if (typeof on === 'boolean') data[id].on = on;
  if (TIME.test(time)) data[id].time = time;
  return data;
}

/**
 * Reminders due now: switched on, their time today has passed (within `windowMin` minutes, so a visitor who
 * opens the site in the evening is not greeted by the morning reminder), and not yet shown today.
 */
export function dueReminders(data, now = new Date(), windowMin = 90) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const minutes = now.getHours() * 60 + now.getMinutes();
  return REMINDER_TYPES.filter((type) => {
    const r = data[type.id];
    if (!r?.on || r.last === today) return false;
    const [hh, mm] = r.time.split(':').map(Number);
    const at = hh * 60 + mm;
    return minutes >= at && minutes - at <= windowMin;
  }).map((type) => type.id);
}

export function markShown(data, ids, today) {
  for (const id of ids) if (data[id]) data[id].last = today;
  return data;
}
