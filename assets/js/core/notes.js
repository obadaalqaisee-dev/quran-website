// Personal ayah notes and collections, kept on this device under a NEW key ("ayahNotes").
// The original single "last read" bookmark (quranBookmark) is untouched and keeps its own meaning.
//
// { v: 1, items: [{ surah, ayah, collection, note, updated }], custom: [name, …] }
// An ayah appears at most once; its collection and note can be changed. Limits keep storage small and make
// imported data safe to render (text is always inserted with textContent).

import { localDateKey } from './dom.js';
import { KEYS, getJSON, setJSON } from './storage.js';

export const NOTES_KEY = KEYS.notes;
export const BUILTIN_COLLECTIONS = ['reflect', 'memorize', 'review', 'dua'];
export const MAX_NOTE = 1000;
export const MAX_ITEMS = 2000;
export const MAX_CUSTOM = 20;
export const MAX_NAME = 40;

const validRef = (surah, ayah) => Number.isInteger(surah) && surah >= 1 && surah <= 114 && Number.isInteger(ayah) && ayah >= 1 && ayah <= 286;
const cleanName = (name) => (typeof name === 'string' ? name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME) : '');
const validCollection = (c, custom) => BUILTIN_COLLECTIONS.includes(c) || (typeof c === 'string' && c.startsWith('c:') && custom.includes(c.slice(2)));

export function loadNotes() {
  const raw = getJSON(NOTES_KEY, null);
  const custom = [...new Set((Array.isArray(raw?.custom) ? raw.custom : []).map(cleanName).filter(Boolean))].slice(0, MAX_CUSTOM);
  const seen = new Set();
  const items = [];
  for (const it of Array.isArray(raw?.items) ? raw.items : []) {
    const surah = Number(it?.surah);
    const ayah = Number(it?.ayah);
    if (!validRef(surah, ayah) || seen.has(`${surah}:${ayah}`)) continue;
    seen.add(`${surah}:${ayah}`);
    items.push({
      surah, ayah,
      collection: validCollection(it.collection, custom) ? it.collection : 'reflect',
      note: typeof it.note === 'string' ? it.note.slice(0, MAX_NOTE) : '',
      updated: typeof it.updated === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(it.updated) ? it.updated : localDateKey(),
    });
    if (items.length >= MAX_ITEMS) break;
  }
  return { v: 1, items, custom };
}

const listeners = new Set();
export const onNotesChange = (fn) => listeners.add(fn);
function save(data) {
  const ok = setJSON(NOTES_KEY, data);
  for (const fn of listeners) fn();
  return ok;
}

export const noteFor = (surah, ayah, data = loadNotes()) => data.items.find((i) => i.surah === surah && i.ayah === ayah) || null;

/** Add or update the note of an ayah. Returns false if the reference is invalid or storage is full. */
export function saveNote(surah, ayah, { collection = 'reflect', note = '' } = {}, today = localDateKey()) {
  const s = Number(surah);
  const a = Number(ayah);
  if (!validRef(s, a)) return false;
  const data = loadNotes();
  const item = { surah: s, ayah: a, collection: validCollection(collection, data.custom) ? collection : 'reflect', note: String(note).slice(0, MAX_NOTE), updated: today };
  const i = data.items.findIndex((x) => x.surah === s && x.ayah === a);
  if (i >= 0) data.items[i] = item;
  else if (data.items.length >= MAX_ITEMS) return false;
  else data.items.push(item);
  return save(data);
}

export function removeNote(surah, ayah) {
  const data = loadNotes();
  data.items = data.items.filter((x) => !(x.surah === Number(surah) && x.ayah === Number(ayah)));
  return save(data);
}

/** Create a custom collection; returns its id ("c:<name>") or null. */
export function addCollection(name) {
  const clean = cleanName(name);
  if (!clean) return null;
  const data = loadNotes();
  if (!data.custom.includes(clean)) {
    if (data.custom.length >= MAX_CUSTOM) return null;
    data.custom.push(clean);
    save(data);
  }
  return `c:${clean}`;
}

/** Items in Mushaf order, optionally filtered by collection and by text (in the note). */
export function listNotes({ collection = 'all', query = '' } = {}, data = loadNotes()) {
  const q = String(query).trim().toLowerCase();
  return data.items
    .filter((i) => collection === 'all' || i.collection === collection)
    .filter((i) => !q || i.note.toLowerCase().includes(q) || `${i.surah}:${i.ayah}` === q)
    .sort((x, y) => x.surah - y.surah || x.ayah - y.ayah);
}

export function collectionCounts(data = loadNotes()) {
  const counts = {};
  for (const i of data.items) counts[i.collection] = (counts[i.collection] || 0) + 1;
  return counts;
}
