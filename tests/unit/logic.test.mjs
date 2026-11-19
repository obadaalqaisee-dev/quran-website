import assert from 'node:assert/strict';
import { test } from 'node:test';

import { translations, LANGUAGES } from '../../assets/js/data/translations.js';
import { SURAHS } from '../../assets/js/data/surahs.js';
import { RECITERS } from '../../assets/js/data/reciters.js';
import { ADHKAR } from '../../assets/js/data/adhkar.js';
import { isRecitationCorrect, skeleton } from '../../assets/js/features/voice-lab.js';
import { matchesSurah } from '../../assets/js/features/surahs.js';
import { formatTime, nextPrayer } from '../../assets/js/features/prayer.js';
import { surahs } from '../../assets/js/core/quran.js';
import { stripBasmala } from '../../assets/js/core/arabic.js';
import { loadAyahs, loadJSON } from './data.mjs';

const ayahs = loadAyahs();
// As displayed in the lab: the basmala prefix of ayah 1 is shown separately, not recited as part of it.
const ayah = (s, n) => {
  const a = ayahs.find((x) => x.surah === s && x.numberInSurah === n);
  return { ...a, text: stripBasmala(a.text, s, n) };
};

// ------------------------------------------------------------------ data parity with the backend
test('frontend data modules are identical to the verified backend datasets', () => {
  const surahsJson = loadJSON('surahs.json');
  assert.deepEqual(SURAHS, surahsJson.map((s) => [s.number, s.name_ar, s.name_en, s.name_en_translation, s.revelation_type, s.ayah_count]));
  const reciters = loadJSON('reciters.json');
  assert.deepEqual(RECITERS.map((r) => [r.slug, r.base_url, r.name_ar]), reciters.map((r) => [r.slug, r.base_url, r.name_ar]));
  assert.deepEqual(ADHKAR, loadJSON('adhkar.json').adhkar);
});

test('every language has every key, and every data-i18n key used in index.html exists', async () => {
  const keys = Object.keys(translations.ar);
  for (const lang of LANGUAGES) assert.deepEqual(Object.keys(translations[lang]).sort(), [...keys].sort(), lang);
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const used = [...html.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map((m) => m[1]);
  for (const key of used) assert.ok(key in translations.ar, `missing translation key ${key}`);
  for (const r of RECITERS) assert.ok((r.i18n_key || `reciter_${r.slug}`) in translations.en, r.slug);
});

// ------------------------------------------------------------------ surah filter (was broken for Arabic)
test('surah filter matches unvowelled Arabic, transliteration, meaning and number', () => {
  const find = (q) => surahs.filter((s) => matchesSurah(s, q)).map((s) => s.number);
  assert.deepEqual(find('الفاتحة'), [1]);
  assert.deepEqual(find('سورة الفاتحة'), [1]);
  assert.deepEqual(find('البقرة'), [2]);
  assert.deepEqual(find('fatiha'), [1]);
  assert.deepEqual(find('Al-Faatiha'), [1]);
  assert.ok(find('the cow').includes(2));
  assert.deepEqual(find('114'), [114]);
  assert.equal(find('').length, 114);
  assert.deepEqual(find('qwxv'), []);
  assert.ok(find('الناس').includes(114));
});

// ------------------------------------------------------------------ memorisation lab matcher
test('recitation matcher accepts the full ayah and typical speech-recognition spellings', () => {
  assert.ok(isRecitationCorrect(ayah(1, 2).text, 'الحمد لله رب العالمين'));
  assert.ok(isRecitationCorrect(ayah(112, 1).text, 'قل هو الله احد'));
  assert.ok(isRecitationCorrect(ayah(112, 1).text, 'قل هو الله أحد'));
  assert.ok(isRecitationCorrect(ayah(1, 5).text, 'اياك نعبد واياك نستعين'));
  assert.ok(isRecitationCorrect(ayah(2, 255).text, ayah(2, 255).simple));
});

test('recitation matcher rejects unrelated or fragmentary speech (the original accepted one shared word)', () => {
  assert.ok(!isRecitationCorrect(ayah(1, 2).text, 'الله'));
  assert.ok(!isRecitationCorrect(ayah(2, 255).text, 'الله لا إله إلا هو'));
  assert.ok(!isRecitationCorrect(ayah(112, 1).text, 'السلام عليكم'));
  assert.ok(!isRecitationCorrect(ayah(1, 2).text, 'ا'));
});

test('disjoined letters can be recited by name', () => {
  assert.ok(isRecitationCorrect('الٓمٓ', 'الف لام ميم'));
  assert.ok(isRecitationCorrect('طه', 'طا ها'));
  assert.ok(isRecitationCorrect('يسٓ', 'يا سين'));
  assert.ok(!isRecitationCorrect('الٓمٓ', 'السلام'));
});

test('skeleton drops diacritics, hamza forms and long vowels', () => {
  assert.equal(skeleton('ٱلْحَمْدُ لِلَّهِ'), skeleton('الحمد لله'));
  assert.equal(skeleton('أحد'), skeleton('احد'));
});

// ------------------------------------------------------------------ prayer helpers
test('prayer time formatting and next-prayer selection', () => {
  assert.equal(formatTime('05:36'), '05:36 AM');
  assert.equal(formatTime('12:22'), '12:22 PM');
  assert.equal(formatTime('00:05'), '12:05 AM');
  const timings = { Fajr: '05:00', Dhuhr: '12:00', Asr: '15:00', Maghrib: '17:30', Isha: '19:00' };
  const at = (h, m) => { const d = new Date(2026, 10, 19, h, m); return d; };
  assert.equal(nextPrayer(timings, at(4, 0)).key, 'Fajr');
  assert.equal(nextPrayer(timings, at(13, 0)).key, 'Asr');
  const late = nextPrayer(timings, at(23, 0));
  assert.equal(late.key, 'Fajr');
  assert.equal(late.time.getDate(), 20); // tomorrow
});
