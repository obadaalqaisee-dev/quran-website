// Backup and restore of everything this site stores on the device. All personal data lives in
// localStorage (there are no accounts), so a file the visitor keeps is the only way to move progress to
// another browser or to survive clearing site data. Nothing is uploaded: the file is made and read locally.
//
// The file contains the raw stored strings, so restoring reproduces the exact original formats (the
// original keys keep their original formats; see docs/feature_preservation_checklist.md §G).

import { KEYS } from './storage.js';

export const BACKUP_APP = 'quran-website';
export const BACKUP_VERSION = 1;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_VALUE = 2 * 1024 * 1024;

/** Every key a backup may contain: every key the site defines (original, evolution and innovation keys). */
export const BACKUP_KEYS = Object.freeze([...new Set(Object.values(KEYS))]);
// Keys whose value is a plain string (not JSON). Everything else must parse as JSON before it is restored.
const STRING_KEYS = new Set([KEYS.theme, KEYS.lang, KEYS.reciter, KEYS.speed, KEYS.labMode, KEYS.micDevice, KEYS.readingTheme, KEYS.notify, KEYS.rosary, KEYS.fontScale, KEYS.nasheedVolume]);

/** Build the backup object from a Storage-like object (localStorage in the browser). */
export function buildBackup(storage, now = new Date()) {
  const data = {};
  for (const key of BACKUP_KEYS) {
    let value = null;
    try { value = storage.getItem(key); } catch { /* storage unavailable */ }
    if (typeof value === 'string') data[key] = value;
  }
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), data };
}

/**
 * Validate a parsed backup. Returns { ok, entries, skipped } or { ok: false, error }.
 * Unknown keys are skipped (never written), values must be strings of reasonable size, and JSON keys must
 * contain valid JSON. Nothing is written by this function.
 */
export function validateBackup(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, error: 'format' };
  if (obj.app !== BACKUP_APP) return { ok: false, error: 'app' };
  if (!Number.isInteger(obj.version) || obj.version < 1 || obj.version > BACKUP_VERSION) return { ok: false, error: 'version' };
  if (!obj.data || typeof obj.data !== 'object' || Array.isArray(obj.data)) return { ok: false, error: 'format' };
  const entries = [];
  const skipped = [];
  for (const [key, value] of Object.entries(obj.data)) {
    if (!BACKUP_KEYS.includes(key) || typeof value !== 'string' || value.length > MAX_VALUE) { skipped.push(key); continue; }
    if (!STRING_KEYS.has(key)) {
      try { JSON.parse(value); } catch { skipped.push(key); continue; }
    }
    entries.push([key, value]);
  }
  if (!entries.length) return { ok: false, error: 'empty' };
  return { ok: true, entries, skipped };
}

/** Parse the text of a backup file. */
export function parseBackup(text) {
  if (typeof text !== 'string' || text.length > MAX_FILE_BYTES) return { ok: false, error: 'size' };
  let obj;
  try { obj = JSON.parse(text); } catch { return { ok: false, error: 'json' }; }
  return validateBackup(obj);
}

/** Write validated entries. Keys absent from the backup are left as they are (merge, not wipe). */
export function applyBackup(storage, entries) {
  let written = 0;
  for (const [key, value] of entries) {
    try { storage.setItem(key, value); written += 1; } catch { /* quota: keep going */ }
  }
  return written;
}

export const backupFileName = (now = new Date()) => `quran-website-backup-${now.toISOString().slice(0, 10)}.json`;
