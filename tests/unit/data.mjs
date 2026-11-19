// Loads the verified backend datasets so frontend logic is tested against the real Quran text.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const DATA = new URL('../../backend/app/data/', import.meta.url);

export function loadAyahs() {
  const raw = JSON.parse(gunzipSync(readFileSync(new URL('ayahs.json.gz', DATA))).toString('utf8'));
  return raw.rows.map(([id, surah, numberInSurah, text, simple]) => ({ id, surah, numberInSurah, text, simple }));
}

export const loadJSON = (name) => JSON.parse(readFileSync(new URL(name, DATA), 'utf8'));
