// Live smoke test against a real deployment, with the real third-party services (no mocks).
//
//   LIVE_URL=https://obadaalqaisee-dev.github.io/quran-website/ npm run test:e2e -- e2e/live.test.mjs
//
// Skipped unless LIVE_URL is set. Checks the user-visible essentials of the modernised site.
//
// Pre-merge rehearsal of the exact production URL: LIVE_MAP_TO=127.0.0.1:8443 makes the browser
// resolve the LIVE_URL host to a local HTTPS server that serves this branch like GitHub Pages
// (same origin, path, HTTPS, CSP, service-worker scope). Everything else uses the real network.

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { RECITERS, chromium , autoReveal } from './helpers.mjs';

const URL_UNDER_TEST = process.env.LIVE_URL;
let browser;

const MAP_TO = process.env.LIVE_MAP_TO;

before(async () => {
  if (!URL_UNDER_TEST) return;
  const host = new URL(URL_UNDER_TEST).hostname;
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  browser = await chromium.launch(MAP_TO ? {
    args: [`--host-resolver-rules=MAP ${host}:443 ${MAP_TO}`],
    ...(proxy ? { proxy: { server: proxy, bypass: host } } : {}),
  } : {});
});
after(async () => { await browser?.close(); });

test('live deployment: page, surahs, reciters, reading with tafsir, real audio, prayer times', { skip: !URL_UNDER_TEST, timeout: 120000 }, async () => {
  const context = await browser.newContext({ ignoreHTTPSErrors: !!MAP_TO, geolocation: { latitude: 31.9539, longitude: 35.9106 }, permissions: ['geolocation'] });
  const page = autoReveal(await context.newPage());
  const errors = [];
  const requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && /Content Security Policy/.test(m.text())) errors.push(m.text()); });
  page.on('request', (r) => requests.push(r.url()));
  const response = await page.goto(URL_UNDER_TEST);
  assert.equal(response.status(), 200);
  await page.waitForSelector('#surahGrid .surah-card', { timeout: 30000 });
  assert.equal(await page.locator('#surahGrid .surah-card').count(), 114);
  assert.deepEqual(await page.locator('#reciterSelect option').evaluateAll((o) => o.map((x) => x.value)), RECITERS.map((r) => r.slug));

  // Reading: real Quran text, basmala shown once, real tafsir and translation.
  await page.click('#surahGrid [data-action="read"][data-surah="2"]');
  await page.waitForSelector('#ayah-285', { timeout: 30000 });
  assert.match(await page.textContent('#ayah-0'), /^الٓمٓ/);
  await page.click('#ayah-1');
  await page.waitForFunction(() => document.getElementById('tafsirText').textContent.length > 20 && !/جاري/.test(document.getElementById('tafsirText').textContent), null, { timeout: 30000 });
  await page.waitForFunction(() => /book/i.test(document.getElementById('translationText').textContent), null, { timeout: 30000 });

  // Real audio actually starts playing (first reciter, Al-Fatihah).
  await page.click('#surahGrid [data-action="play"][data-surah="1"]');
  await page.waitForFunction(() => { const a = document.getElementById('audioPlayer'); return !a.paused && a.currentTime > 0.5; }, null, { timeout: 45000 });

  // Real prayer times.
  await page.waitForSelector('.prayer-card', { timeout: 30000 });
  assert.equal(await page.locator('.prayer-card').count(), 5);
  assert.match(await page.textContent('#prayerCountdown'), /^\d\d:\d\d:\d\d$/);
  // On *.github.io there can be no same-origin backend, so none is probed.
  if (new URL(URL_UNDER_TEST).hostname.endsWith('.github.io')) {
    assert.ok(!requests.some((u) => u.includes('/api/v1/health')), 'no backend probe on GitHub Pages');
  }
  // Chrome refuses service workers on an origin with an untrusted certificate, which the local
  // rehearsal server has; on the real deployment the certificate is valid.
  if (!MAP_TO) assert.ok(await page.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())), 'service worker registered');
  assert.deepEqual(errors, []);
  await context.close();
});
