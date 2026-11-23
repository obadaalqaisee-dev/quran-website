// Shared end-to-end test infrastructure.
//
// * startPagesServer(): serves the repository exactly like GitHub Pages — static files under the
//   /quran-website/ sub-path, no special headers, 404.html for unknown paths, and no backend.
// * startBackend(): runs the real FastAPI backend (uvicorn) against a freshly migrated + seeded DB.
// * mockUpstream(): answers the third-party APIs from the verified datasets, so tests are
//   deterministic and run offline. Audio requests are served with the site's own Quran.mp3.

import { spawn, spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { extname, join, normalize } from 'node:path';
import { gunzipSync } from 'node:zlib';

const require = createRequire(import.meta.url);
export const { chromium } = require('playwright');

export const REPO = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
const BACKEND = join(REPO, 'backend');
const DATA = join(BACKEND, 'app', 'data');

// ------------------------------------------------------------------ datasets
const ayahRows = JSON.parse(gunzipSync(readFileSync(join(DATA, 'ayahs.json.gz'))).toString()).rows;
export const AYAHS = ayahRows.map(([id, surah, numberInSurah, text, simple]) => ({ id, surah, numberInSurah, text, simple }));
export const SURAHS = JSON.parse(readFileSync(join(DATA, 'surahs.json'), 'utf8'));
export const RECITERS = JSON.parse(readFileSync(join(DATA, 'reciters.json'), 'utf8'));
export const ADHKAR = JSON.parse(readFileSync(join(DATA, 'adhkar.json'), 'utf8')).adhkar;
const editions = {};
for (const ed of ['ar.muyassar', 'en.sahih', 'es.cortes', 'fr.hamidullah']) {
  editions[ed] = JSON.parse(gunzipSync(readFileSync(join(DATA, `edition-${ed}.json.gz`))).toString()).texts;
}
export const EDITIONS = editions;
export const QURAN_MP3 = readFileSync(join(REPO, 'Quran.mp3'));

// ------------------------------------------------------------------ GitHub Pages-like static server
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
};

export function startPagesServer(port = 0, prefix = '/quran-website') {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    let path = decodeURIComponent(url.pathname);
    if (!path.startsWith(`${prefix}/`) && path !== prefix) return notFound(res);
    path = path.slice(prefix.length) || '/';
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(REPO, path));
    if (!file.startsWith(REPO) || !existsSync(file) || !statSync(file).isFile()) return notFound(res);
    const headers = { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'max-age=600' };
    const size = statSync(file).size;
    const range = req.headers.range && /bytes=(\d+)-(\d*)/.exec(req.headers.range);
    if (range) {
      const start = Number(range[1]);
      const end = range[2] ? Number(range[2]) : size - 1;
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      createReadStream(file, { start, end }).pipe(res);
      return undefined;
    }
    res.writeHead(200, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Length': size });
    createReadStream(file).pipe(res);
    return undefined;
  });
  function notFound(res) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(join(REPO, '404.html')));
  }
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => {
    const { port: actual } = server.address();
    resolve({ url: `http://127.0.0.1:${actual}${prefix}/`, origin: `http://127.0.0.1:${actual}`, close: () => new Promise((r) => server.close(r)) });
  }));
}

// ------------------------------------------------------------------ real backend
const PYTHON = existsSync(join(BACKEND, '.venv', 'bin', 'python')) ? join(BACKEND, '.venv', 'bin', 'python') : 'python3';

export async function startBackend({ port, env = {} }) {
  const dir = mkdtempSync(join(tmpdir(), 'quran-db-'));
  const baseEnv = { ...process.env, DATABASE_URL: `sqlite:///${dir}/e2e.sqlite3`, ENVIRONMENT: 'test', ...env };
  for (const args of [['-m', 'alembic', 'upgrade', 'head'], ['-m', 'app.cli', 'seed']]) {
    const r = spawnSync(PYTHON, args, { cwd: BACKEND, env: baseEnv, encoding: 'utf8' });
    if (r.status !== 0) throw new Error(`backend setup failed: ${r.stderr || r.stdout}`);
  }
  const proc = spawn(PYTHON, ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(port)], { cwd: BACKEND, env: baseEnv, stdio: 'pipe' });
  let log = '';
  proc.stdout.on('data', (d) => { log += d; });
  proc.stderr.on('data', (d) => { log += d; });
  const url = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i += 1) {
    try { if ((await fetch(`${url}/api/v1/health`)).ok) return { url, log: () => log, close: () => proc.kill() }; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  proc.kill();
  throw new Error(`backend did not start:\n${log}`);
}

// ------------------------------------------------------------------ upstream mocks
const strip = (t) => t.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا');

export function defaultTimings(now = new Date()) {
  // Fixed realistic times; tests that need a near prayer override them.
  return { Fajr: '05:36', Sunrise: '07:08', Dhuhr: '12:22', Asr: '15:16', Sunset: '17:35', Maghrib: '17:35', Isha: '19:05' };
}

/**
 * Route all third-party traffic of a browser context.
 * options.audioFail(url) → true makes that audio URL fail (404).
 * options.timings() → prayer timings object.
 */
export async function mockUpstream(context, options = {}) {
  const calls = [];
  const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body), headers: { 'Access-Control-Allow-Origin': '*' } });

  await context.route(/https:\/\/api\.alquran\.cloud\/.*/, (route) => {
    const url = new URL(route.request().url());
    calls.push(url.href);
    let m = /^\/v1\/surah\/(\d+)\/quran-uthmani$/.exec(url.pathname);
    if (m) {
      const n = Number(m[1]);
      return json(route, { code: 200, data: { number: n, ayahs: AYAHS.filter((a) => a.surah === n).map((a) => ({ number: a.id, numberInSurah: a.numberInSurah, text: a.text })) } });
    }
    m = /^\/v1\/ayah\/(\d+)\/([\w.]+)$/.exec(url.pathname);
    if (m) return json(route, { code: 200, data: { number: Number(m[1]), text: EDITIONS[m[2]][Number(m[1]) - 1] } });
    m = /^\/v1\/search\/(.+)\/all\/quran-simple-clean$/.exec(url.pathname);
    if (m) {
      const q = strip(decodeURIComponent(m[1]));
      const matches = AYAHS.filter((a) => strip(a.simple).includes(q)).map((a) => ({
        number: a.id, text: a.simple, numberInSurah: a.numberInSurah, surah: { number: a.surah, name: SURAHS[a.surah - 1].name_ar },
      }));
      return matches.length ? json(route, { code: 200, data: { count: matches.length, matches } }) : json(route, { code: 404, data: 'Nothing found' }, 404);
    }
    // Search in a tafsir/translation edition (used by the Islamic search's tafsir option).
    m = /^\/v1\/search\/(.+)\/all\/([\w.]+)$/.exec(url.pathname);
    if (m && EDITIONS[m[2]]) {
      const q = strip(decodeURIComponent(m[1]));
      const matches = EDITIONS[m[2]].map((text, i) => ({ text, a: AYAHS[i] })).filter((x) => strip(x.text).includes(q))
        .map(({ text, a }) => ({ number: a.id, text, numberInSurah: a.numberInSurah, surah: { number: a.surah, name: SURAHS[a.surah - 1].name_ar } }));
      return matches.length ? json(route, { code: 200, data: { count: matches.length, matches } }) : json(route, { code: 404, data: 'Nothing found' }, 404);
    }
    return json(route, { code: 404 }, 404);
  });

  await context.route(/https:\/\/api\.aladhan\.com\/.*/, (route) => {
    calls.push(route.request().url());
    const timings = (options.timings || defaultTimings)();
    return json(route, { code: 200, data: { timings, date: { hijri: { day: '9', year: '1448', month: { ar: 'جُمادى الآخرة', en: 'Jumādá al-ākhirah' } } } } });
  });

  await context.route(/https:\/\/www\.mp3quran\.net\/api\/.*/, (route) => {
    const url = new URL(route.request().url());
    calls.push(url.href);
    const id = Number(url.searchParams.get('reciter'));
    const rec = RECITERS.find((r) => r.mp3quran_reciter_id === id);
    return json(route, { reciters: rec ? [{ id, moshaf: [{ id: rec.mp3quran_moshaf_id, server: `https://cdn.mp3quran.net/audio/${rec.slug}/r1/`, surah_list: Array.from({ length: 114 }, (_, i) => i + 1).join(',') }] }] : [] });
  });

  await context.route(/https:\/\/(server\d+|cdn)\.mp3quran\.net\/.*\.mp3|https:\/\/cdn\.islamic\.network\/.*\.mp3/, (route) => {
    const url = route.request().url();
    calls.push(url);
    if (options.audioFail?.(url)) return route.fulfill({ status: 404, body: 'not found' });
    return route.fulfill({ status: 200, contentType: 'audio/mpeg', body: QURAN_MP3, headers: { 'Accept-Ranges': 'none' } });
  });

  // Images, fonts and analytics are irrelevant to behaviour; answer them instantly.
  await context.route(/https:\/\/(images\.unsplash\.com|images\.pexels\.com|i\.ytimg\.com)\/.*/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: readFileSync(join(REPO, 'assets/icons/favicon-32.png')) }));
  await context.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await context.route(/https:\/\/(www\.googletagmanager\.com|[\w.]*google-analytics\.com)\/.*/, (route) => route.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  return calls;
}

// ------------------------------------------------------------------ browser fakes
/** Fake Web Speech API: tests call window.__speak(text, isFinal) to deliver a result. */
export const FAKE_SPEECH = `
  (() => {
    class FakeRecognition {
      constructor() { window.__recognition = this; this.running = false; }
      start() { if (this.running) throw new Error('already started'); this.running = true; this.results = []; setTimeout(() => this.onstart && this.onstart(), 0); }
      stop() { if (!this.running) return; this.running = false; setTimeout(() => this.onend && this.onend(), 0); }
      abort() { this.stop(); }
    }
    window.SpeechRecognition = FakeRecognition;
    window.webkitSpeechRecognition = FakeRecognition;
    window.__speak = (text, isFinal = true) => {
      const rec = window.__recognition;
      if (!rec || !rec.running) return false;
      const r = [{ transcript: text }]; r.isFinal = isFinal;
      rec.results.push(r);
      rec.onresult && rec.onresult({ results: rec.results });
      return true;
    };
  })();`;

/** Records notifications instead of showing them; permission is granted on request. */
export const FAKE_NOTIFICATIONS = `
  (() => {
    window.__notifications = [];
    let permission = 'default';
    function N(title, options) { window.__notifications.push({ title, body: options && options.body }); }
    Object.defineProperty(N, 'permission', { get: () => permission });
    N.requestPermission = async () => (permission = 'granted');
    window.Notification = N;
    if (window.ServiceWorkerRegistration) {
      ServiceWorkerRegistration.prototype.showNotification = async function (title, options) { window.__notifications.push({ title, body: options && options.body }); };
    }
  })();`;

export function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    // The deliberate 404 used by tests for failing audio links is not an application error.
    if (/status of 404/.test(text) && /mp3|health/.test(m.location()?.url || '')) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fake microphone for the memorisation lab. options: { permission: 'granted'|'denied'|'prompt',
 * gum: 'ok'|'NotAllowedError'|'NotFoundError' }. Records constraints in window.__gumConstraints and
 * whether tracks were stopped in window.__tracksStopped.
 */
export const fakeMedia = ({ permission = 'prompt', gum = 'ok' } = {}) => `
  (() => {
    window.__tracksStopped = 0;
    const permissions = navigator.permissions;
    const query = permissions && permissions.query.bind(permissions);
    if (permissions) permissions.query = (desc) => desc && desc.name === 'microphone'
      ? Promise.resolve({ state: ${JSON.stringify(permission)}, addEventListener() {} }) : query(desc);
    const md = navigator.mediaDevices || {};
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: md });
    md.getSupportedConstraints = () => ({ echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: true, deviceId: true });
    md.enumerateDevices = async () => [
      { kind: 'audioinput', deviceId: 'default', label: 'Default' },
      { kind: 'audioinput', deviceId: 'mic-usb', label: 'USB Microphone' },
    ];
    md.getUserMedia = async (constraints) => {
      window.__gumConstraints = constraints;
      if (${JSON.stringify(gum)} !== 'ok') { const e = new Error('x'); e.name = ${JSON.stringify(gum)}; throw e; }
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const dest = ctx.createMediaStreamDestination();
      osc.connect(dest); osc.start();
      const stream = dest.stream;
      const [track] = stream.getAudioTracks();
      const stop = track.stop.bind(track);
      track.stop = () => { window.__tracksStopped += 1; stop(); };
      track.getSettings = () => ({ echoCancellation: true, noiseSuppression: true, autoGainControl: true });
      return stream;
    };
  })();`;

/** Make the fake recogniser report an error, as Chrome does (onerror then onend). */
export const speechError = (page, code) => page.evaluate((c) => {
  const rec = window.__recognition;
  rec.onerror?.({ error: c });
  rec.running = false;
  rec.onend?.();
}, code);
