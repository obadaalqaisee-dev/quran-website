// WCAG 2.1 contrast of the design-token pairs used for text, in both themes (computed from main.css).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const css = readFileSync(new URL('../../assets/css/main.css', import.meta.url), 'utf8');

function tokens(selector) {
  const block = css.slice(css.indexOf(`${selector} {`));
  const body = block.slice(0, block.indexOf('\n}'));
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}
const light = tokens(':root');
const dark = { ...light, ...tokens(':root.dark-mode') };

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

// [foreground, background, minimum] — 4.5 for body text, 3 for large/bold headings and UI components.
const PAIRS = [
  ['text', 'bg', 4.5], ['text', 'surface', 4.5], ['text', 'surface-2', 4.5],
  ['muted', 'bg', 4.5], ['muted', 'surface', 4.5], ['muted', 'surface-2', 4.5],
  ['primary', 'surface', 4.5], ['primary', 'bg', 4.5], ['primary', 'primary-soft', 4.5],
  ['primary-strong', 'surface', 4.5], ['primary-strong', 'surface-2', 4.5],
  ['accent-text', 'surface', 4.5], ['accent-text', 'surface-2', 4.5], ['accent-text', 'bg', 4.5],
  ['quran', 'surface', 7], // Quran text: AAA
  ['on-primary', 'primary', 4.5], ['on-accent', 'accent', 4.5],
  ['danger', 'surface', 4.5], ['success', 'surface', 4.5],
];

for (const [name, theme] of [['light', light], ['dark', dark]]) {
  test(`${name} theme: every text colour pair meets its WCAG contrast minimum`, () => {
    for (const [fg, bg, min] of PAIRS) {
      const r = ratio(theme[fg], theme[bg]);
      assert.ok(r >= min, `${fg} (${theme[fg]}) on ${bg} (${theme[bg]}) = ${r.toFixed(2)} < ${min}`);
    }
  });
}

test('white header/footer/player text on their dark backgrounds', () => {
  for (const bg of [light['header-bg'], dark['header-bg'], light['footer-bg'], dark['footer-bg']]) {
    assert.ok(ratio('#ffffff', bg) >= 7, bg);
  }
  // The original gold is kept for large bold text (logo, footer title: 3:1 minimum) on dark backgrounds;
  // small gold text on the header (nav hover) uses the lighter --accent-on-dark (4.5:1).
  for (const bg of [light['header-bg'], light['footer-bg'], dark['footer-bg']]) assert.ok(ratio(light.accent, bg) >= 3, bg);
  assert.ok(ratio(light['accent-on-dark'], light['header-bg']) >= 4.5);
  assert.ok(ratio(dark['accent-on-dark'], dark['header-bg']) >= 4.5);
  assert.ok(ratio(light.accent, light['footer-bg']) >= 4.5, 'developer credit in the footer');
});

test('documented finding: the original gold #c0964b on the original page background fails AA', () => {
  assert.ok(ratio('#c0964b', '#f9f8f3') < 3);
});
