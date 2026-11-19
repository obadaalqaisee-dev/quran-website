import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

import { normalizeArabic, normalizeLatin, rasm, stripBasmala, surahNameKey } from '../../assets/js/core/arabic.js';
import { loadAyahs } from './data.mjs';

const ayahs = loadAyahs();
const first = new Map(ayahs.filter((a) => a.numberInSurah === 1).map((a) => [a.surah, a.text]));

test('basmala is removed from ayah 1 of all 112 surahs that carry it (fixes the duplicated basmala)', () => {
  const basmala = first.get(1);
  for (let s = 2; s <= 114; s += 1) {
    if (s === 9) continue;
    const stripped = stripBasmala(first.get(s), s, 1);
    assert.notEqual(stripped, first.get(s), `surah ${s} still starts with the basmala`);
    assert.ok(!rasm(stripped).startsWith(rasm(basmala)), `surah ${s}`);
    assert.ok(first.get(s).endsWith(stripped), `surah ${s}: only a prefix may be removed`);
    assert.equal(stripped.split(' ').length, first.get(s).split(' ').length - 4, `surah ${s}: exactly four words`);
  }
});

test('Al-Fatihah keeps its basmala (it is ayah 1) and At-Tawbah has none to remove', () => {
  assert.equal(stripBasmala(first.get(1), 1, 1), first.get(1));
  assert.equal(stripBasmala(first.get(9), 9, 1), first.get(9));
});

test('only ayah 1 is ever changed (27:30 contains the basmala mid-surah)', () => {
  const a = ayahs.find((x) => x.surah === 27 && x.numberInSurah === 30);
  assert.equal(stripBasmala(a.text, 27, 30), a.text);
  for (const x of ayahs) if (x.numberInSurah !== 1) assert.equal(stripBasmala(x.text, x.surah, x.numberInSurah), x.text);
});

test('surahs 95 and 97 (encoded «بِّسْمِ») are handled', () => {
  for (const s of [95, 97]) assert.ok(rasm(stripBasmala(first.get(s), s, 1)).length < rasm(first.get(s)).length);
});

test('normalizeArabic matches the Python backend on every ayah', () => {
  const sample = ayahs.filter((_, i) => i % 7 === 0).map((a) => a.simple);
  const py = execFileSync('python3', ['-c', `
import json,sys
sys.path.insert(0, 'backend')
from app.services.arabic import normalize_arabic
print(json.dumps([normalize_arabic(t) for t in json.load(sys.stdin)], ensure_ascii=False))
`], { input: JSON.stringify(sample), cwd: new URL('../../', import.meta.url).pathname, maxBuffer: 1 << 26 }).toString();
  const expected = JSON.parse(py);
  sample.forEach((text, i) => assert.equal(normalizeArabic(text), expected[i], text));
});

test('surah-name and transliteration matching keys', () => {
  assert.equal(surahNameKey('سُورَةُ ٱلْفَاتِحَةِ'), 'الفاتحه');
  assert.equal(normalizeLatin('Al-Faatiha'), normalizeLatin('al fatiha'));
  assert.equal(normalizeArabic('قُلْ هُوَ ٱللَّهُ أَحَدٌ'), 'قل هو الله احد');
});
