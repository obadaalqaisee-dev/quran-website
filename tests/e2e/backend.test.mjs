// Frontend ↔ backend integration, in the production topology:
//   GitHub Pages (static site) ──HTTPS+CORS──▶ FastAPI backend on another origin.
// Also: same-origin development mode, and resilience when the backend is down or rejects the origin.
//
// The backend runs for real (uvicorn + seeded SQLite). Its own upstream calls (prayer times, audio
// look-up) go to the internet only in the tests that need them; Quran text never does.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';

import { EDITIONS, REPO, chromium, collectErrors, mockUpstream, startBackend, startPagesServer } from './helpers.mjs';

let browser;
let site;
let backend;

before(async () => {
  // Chrome's Local Network Access check would prompt before a page on one loopback port may call
  // another. That only happens in this local test topology (production is github.io → public HTTPS
  // API), so it is disabled here to exercise the real cross-origin CORS path.
  browser = await chromium.launch({ args: ['--disable-features=LocalNetworkAccessChecks'] });
  site = await startPagesServer();
  backend = await startBackend({ port: 18631, env: { CORS_ORIGINS: site.origin } });
});
after(async () => {
  await browser?.close();
  await site?.close();
  backend?.close();
});

/** index.html exactly as scripts/set_api_url.py would produce it for `apiUrl`. */
function indexFor(apiUrl) {
  const dir = mkdtempSync(join(tmpdir(), 'idx-'));
  const file = join(dir, 'index.html');
  writeFileSync(file, readFileSync(join(REPO, 'index.html')));
  // The script only accepts https URLs; the test backend is plain http on loopback, so patch the
  // output of a real run with an https placeholder.
  execFileSync('python3', [join(REPO, 'scripts/set_api_url.py'), '--index', file, 'https://api.placeholder.test']);
  return readFileSync(file, 'utf8').replaceAll('https://api.placeholder.test', apiUrl);
}

async function openPagesWithApi(apiUrl, { blockPublicQuranApi = false } = {}) {
  const context = await browser.newContext();
  await mockUpstream(context);
  const html = indexFor(apiUrl);
  await context.route(`${site.url}`, (route) => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
  const publicCalls = [];
  if (blockPublicQuranApi) {
    await context.route(/https:\/\/api\.alquran\.cloud\/.*/, (route) => { publicCalls.push(route.request().url()); return route.abort(); });
  }
  const apiCalls = [];
  context.on('request', (r) => { if (r.url().startsWith(apiUrl)) apiCalls.push(r.url()); });
  const page = await context.newPage();
  const errors = collectErrors(page);
  await page.goto(site.url);
  await page.waitForSelector('#surahGrid .surah-card');
  return { context, page, errors, apiCalls, publicCalls };
}

describe('GitHub Pages frontend + separate backend (production topology)', () => {
  test('CORS allows the Pages origin; Quran text, tafsir, translation and search come from the backend', async () => {
    const { context, page, errors, apiCalls, publicCalls } = await openPagesWithApi(backend.url, { blockPublicQuranApi: true });
    await page.click('#surahGrid [data-action="read"][data-surah="2"]');
    await page.waitForSelector('#ayah-285');
    assert.ok(!(await page.textContent('#ayah-0')).includes('بِسْمِ'));
    await page.click('#ayah-254');
    await page.waitForFunction((txt) => document.getElementById('tafsirText').textContent === txt, EDITIONS['ar.muyassar'][261]);
    await page.waitForFunction((txt) => document.getElementById('translationText').textContent === txt, EDITIONS['en.sahih'][261]);
    await page.click('[data-open="ayahSearchModal"]');
    await page.fill('#ayahSearchInput', 'الرحمن');
    await page.press('#ayahSearchInput', 'Enter');
    await page.waitForSelector('#ayahSearchResults .search-result');
    assert.match(await page.textContent('#ayahSearchCount'), /20 \/ 167/);
    assert.deepEqual(publicCalls, [], 'the public Quran API was not needed');
    for (const path of ['/api/v1/health', '/api/v1/surahs/2', '/api/v1/ayahs/262?editions=', '/api/v1/search?q=']) {
      assert.ok(apiCalls.some((u) => u.includes(path)), `called ${path}`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('a backend that rejects the origin (CORS) or is down: the site falls back to the public APIs', async () => {
    const strict = await startBackend({ port: 18632, env: { CORS_ORIGINS: 'https://someone-else.example' } });
    try {
      for (const api of [strict.url, 'http://127.0.0.1:18699']) {
        const context = await browser.newContext();
        await mockUpstream(context);
        const html = indexFor(api);
        await context.route(`${site.url}`, (route) => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
        const page = await context.newPage();
        await page.goto(site.url);
        await page.click('#surahGrid [data-action="read"][data-surah="1"]');
        await page.waitForFunction(() => document.querySelectorAll('#readingText .ayah-span').length === 7);
        await context.close();
      }
    } finally {
      strict.close();
    }
  });
});

describe('same-origin backend (local development: uvicorn serves the site too)', () => {
  test('the site is served by the backend with security headers and uses /api/v1', async () => {
    const context = await browser.newContext();
    await mockUpstream(context);
    await context.route(/https:\/\/api\.alquran\.cloud\/.*/, (route) => route.abort());
    const page = await context.newPage();
    const errors = collectErrors(page);
    const response = await page.goto(`${backend.url}/`);
    const headers = response.headers();
    assert.match(headers['content-security-policy'], /script-src 'self' https:\/\/www\.googletagmanager\.com/);
    assert.match(headers['content-security-policy'], /frame-ancestors 'none'/);
    assert.equal(headers['x-content-type-options'], 'nosniff');
    await page.waitForSelector('#surahGrid .surah-card');
    await page.click('#surahGrid [data-action="read"][data-surah="114"]');
    await page.waitForFunction(() => document.querySelectorAll('#readingText .ayah-span').length === 6);
    assert.equal(await page.evaluate(async () => (await import('./assets/js/core/api.js')).dataSource()), 'backend');
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('prayer times through the backend proxy (live Aladhan, if reachable)', async (t) => {
    const probe = await fetch(`${backend.url}/api/v1/prayer-times?city=Amman&country=Jordan`).catch(() => null);
    if (!probe || probe.status !== 200) { t.skip('Aladhan not reachable from this environment'); return; }
    const context = await browser.newContext({ geolocation: { latitude: 21.4225, longitude: 39.8262 }, permissions: ['geolocation'] });
    const page = await context.newPage();
    const calls = [];
    page.on('request', (r) => calls.push(r.url()));
    await page.goto(`${backend.url}/`);
    await page.waitForSelector('.prayer-card', { timeout: 20000 });
    assert.ok(calls.some((u) => u.includes('/api/v1/prayer-times?latitude=21.4225&longitude=39.8262')));
    assert.ok(!calls.some((u) => u.includes('api.aladhan.com')), 'the browser never contacts Aladhan directly');
    assert.equal(await page.locator('.prayer-card').count(), 5);
    await context.close();
  });
});
