// The only module that performs network requests for data.
//
// Strategy (see docs/architecture.md §3.1):
//   1. If a backend is configured (<meta name="quran-api" content="https://…">) or present on the
//      same origin ("auto"), use it: verified local data, caching, privacy-preserving proxies.
//   2. Otherwise — or whenever the backend fails — call the original public APIs directly, exactly
//      like the original site did. The GitHub Pages site therefore never depends on the backend.
// Both paths return the same normalised shapes.

import { sessionGet, sessionSet } from './storage.js';

const UPSTREAM = {
  quran: 'https://api.alquran.cloud/v1',
  aladhan: 'https://api.aladhan.com/v1',
  mp3quran: 'https://www.mp3quran.net/api/v3',
};
const TIMEOUT_MS = 12000;
const HEALTH_TIMEOUT_MS = 3000;
const BACKEND_RETRY_MS = 60000;

// ------------------------------------------------------------------ backend detection
function configuredBase() {
  const value = document.querySelector('meta[name="quran-api"]')?.content?.trim() || 'auto';
  if (value === 'none' || value === 'off') return null;
  if (value === 'auto') {
    // GitHub Pages is static: there can be no same-origin backend, so don't probe for one.
    if (location.hostname.endsWith('.github.io')) return null;
    return new URL('api/v1/', document.baseURI).href;
  }
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') return null;
    return new URL('api/v1/', url.href.endsWith('/') ? url.href : `${url.href}/`).href;
  } catch {
    return null;
  }
}

const state = { base: undefined, available: null, checkedAt: 0, probe: null };

async function fetchWithTimeout(url, { timeout = TIMEOUT_MS, ...init } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function backendAvailable() {
  if (state.base === undefined) state.base = configuredBase(); // resolved lazily (testable outside a browser)
  if (!state.base) return false;
  if (state.available === true) return true;
  if (state.available === false && Date.now() - state.checkedAt < BACKEND_RETRY_MS) return false;
  const cacheKey = `quranApi:${state.base}`;
  if (state.available === null) {
    const cached = sessionGet(cacheKey);
    if (cached === 'down') { state.available = false; state.checkedAt = Date.now(); return false; }
  }
  state.probe ??= (async () => {
    try {
      const res = await fetchWithTimeout(`${state.base}health`, { timeout: HEALTH_TIMEOUT_MS, headers: { Accept: 'application/json' } });
      const ok = res.ok && (await res.json())?.status === 'ok';
      state.available = ok;
    } catch {
      state.available = false;
    }
    state.checkedAt = Date.now();
    sessionSet(cacheKey, state.available ? 'up' : 'down');
    state.probe = null;
    return state.available;
  })();
  return state.probe;
}

function markBackendDown() {
  state.available = false;
  state.checkedAt = Date.now();
}

export class ApiError extends Error {}

async function getJSON(url, options) {
  const res = await fetchWithTimeout(url, { headers: { Accept: 'application/json' }, ...options });
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`);
  return res.json();
}

const memo = new Map();
function memoize(key, factory) {
  if (!memo.has(key)) {
    const p = factory().catch((err) => { memo.delete(key); throw err; });
    memo.set(key, p);
  }
  return memo.get(key);
}

/** Try the backend, fall back to upstream on any failure. */
async function viaBackendOr(backendCall, upstreamCall) {
  if (await backendAvailable()) {
    try {
      return await backendCall(state.base);
    } catch (err) {
      if (err instanceof ApiError && /HTTP 4\d\d/.test(err.message)) throw err; // a real "bad request"
      // 502/504 come from the backend itself: it is up, but a third-party service it proxies (prayer
      // times, audio look-up) failed. Fall back for this call only; marking the whole backend down
      // would also move Quran text away from the verified backend data for a minute.
      if (!(err instanceof ApiError && /HTTP 50[24]/.test(err.message))) markBackendDown();
    }
  }
  return upstreamCall();
}

export const dataSource = async () => ((await backendAvailable()) ? 'backend' : 'upstream');

// ------------------------------------------------------------------ Quran text
/** @returns {Promise<{number:number, ayahs:{id:number, numberInSurah:number, text:string}[]}>} */
export function getSurah(number) {
  return memoize(`surah:${number}`, () => viaBackendOr(
    async (base) => {
      const { data } = await getJSON(`${base}surahs/${number}`);
      return { number: data.number, ayahs: data.ayahs.map((a) => ({ id: a.id, numberInSurah: a.number_in_surah, text: a.text })) };
    },
    async () => {
      const { data } = await getJSON(`${UPSTREAM.quran}/surah/${number}/quran-uthmani`);
      return {
        number: data.number,
        ayahs: data.ayahs.map((a) => ({ id: a.number, numberInSurah: a.numberInSurah, text: a.text.replace(/^﻿/, '') })),
      };
    },
  ));
}

/** Tafsir/translation texts for one ayah. @returns {Promise<Record<string,string>>} */
export function getAyahEditions(ayahId, editions) {
  const list = [...editions].sort();
  return memoize(`ayah:${ayahId}:${list.join(',')}`, () => viaBackendOr(
    async (base) => (await getJSON(`${base}ayahs/${ayahId}?editions=${encodeURIComponent(list.join(','))}`)).data.editions,
    async () => {
      const entries = await Promise.all(list.map(async (ed) => {
        const { data } = await getJSON(`${UPSTREAM.quran}/ayah/${ayahId}/${encodeURIComponent(ed)}`);
        return [ed, data.text];
      }));
      return Object.fromEntries(entries);
    },
  ));
}

/** Ayah search (first 20 results, like the original). */
export function searchAyahs(query) {
  const q = query.trim();
  return memoize(`search:${q}`, () => viaBackendOr(
    async (base) => {
      const res = await getJSON(`${base}search?q=${encodeURIComponent(q)}&page_size=20`);
      return {
        total: res.meta.total,
        results: res.data.map((m) => ({ surah: m.surah, surahNameAr: m.surah_name_ar, numberInSurah: m.number_in_surah, text: m.text })),
      };
    },
    async () => {
      const res = await getJSON(`${UPSTREAM.quran}/search/${encodeURIComponent(q)}/all/quran-simple-clean`);
      const data = res?.data;
      if (!data || !data.count) return { total: 0, results: [] };
      return {
        total: data.count,
        results: data.matches.slice(0, 20).map((m) => ({
          surah: m.surah.number, surahNameAr: m.surah.name, numberInSurah: m.numberInSurah, text: m.text.replace(/^﻿/, ''),
        })),
      };
    },
  ));
}

/**
 * Search the text of Tafsir al-Muyassar (first 10 results). Backend: /api/v1/tafsir/search;
 * public API: alquran.cloud's search, which accepts any text edition. Resolves { total, results }.
 */
export function searchTafsir(query, edition = 'ar.muyassar') {
  const q = query.trim();
  return memoize(`tafsir:${edition}:${q}`, () => viaBackendOr(
    async (base) => {
      const res = await getJSON(`${base}tafsir/search?q=${encodeURIComponent(q)}&edition=${encodeURIComponent(edition)}&page_size=10`);
      return { total: res.meta.total, results: res.data.map((m) => ({ id: m.id, surah: m.surah, numberInSurah: m.number_in_surah, text: m.text })) };
    },
    async () => {
      let res;
      try {
        res = await getJSON(`${UPSTREAM.quran}/search/${encodeURIComponent(q)}/all/${encodeURIComponent(edition)}`);
      } catch (err) {
        if (err instanceof ApiError && /HTTP 404/.test(err.message)) return { total: 0, results: [] }; // "nothing found"
        throw err;
      }
      const data = res?.data;
      if (!data || !data.count) return { total: 0, results: [] };
      return {
        total: data.count,
        results: data.matches.slice(0, 10).map((m) => ({ id: m.number, surah: m.surah.number, numberInSurah: m.numberInSurah, text: m.text })),
      };
    },
  ));
}

// ------------------------------------------------------------------ prayer times
function ddmmyyyy(date) {
  return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
}
function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizePrayer(timings, hijri) {
  const pick = (k) => String(timings[k]).slice(0, 5);
  return {
    timings: { Fajr: pick('Fajr'), Sunrise: pick('Sunrise'), Dhuhr: pick('Dhuhr'), Asr: pick('Asr'), Maghrib: pick('Maghrib'), Isha: pick('Isha') },
    hijri,
  };
}

/**
 * @param {{latitude:number, longitude:number}|null} coords  null → Amman, Jordan (the original default)
 */
export function getPrayerTimes(coords, date = new Date(), method = 8) {
  return viaBackendOr(
    async (base) => {
      const params = coords
        ? `latitude=${coords.latitude}&longitude=${coords.longitude}`
        : 'city=Amman&country=Jordan';
      const { data } = await getJSON(`${base}prayer-times?${params}&method=${method}&date=${isoDate(date)}`);
      return normalizePrayer(data.timings, data.date.hijri);
    },
    async () => {
      const url = coords
        ? `${UPSTREAM.aladhan}/timings/${ddmmyyyy(date)}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=${method}`
        : `${UPSTREAM.aladhan}/timingsByCity/${ddmmyyyy(date)}?city=Amman&country=Jordan&method=${method}`;
      const { data } = await getJSON(url);
      const h = data.date.hijri;
      return normalizePrayer(data.timings, { day: h.day, year: h.year, month_ar: h.month.ar, month_en: h.month.en });
    },
  );
}

// ------------------------------------------------------------------ audio
/** Ordered list of playable URLs for a surah. The first is always the original site's URL. */
export async function resolveAudio(reciter, surah) {
  const padded = String(surah).padStart(3, '0');
  const primary = `${reciter.base_url}${padded}.mp3`;
  try {
    return await viaBackendOr(
      async (base) => (await getJSON(`${base}reciters/${encodeURIComponent(reciter.slug)}/audio/${surah}`)).data.urls,
      async () => {
        // Look the reciter up by its verified numeric ID (1.7 KB) instead of downloading the whole
        // catalogue (167 KB) and fuzzy-matching names, as the original did.
        const res = await getJSON(`${UPSTREAM.mp3quran}/reciters?language=ar&reciter=${reciter.mp3quran_reciter_id}`);
        const moshaf = res.reciters?.[0]?.moshaf?.find((m) => m.id === reciter.mp3quran_moshaf_id);
        const server = moshaf?.server?.startsWith('https://') ? moshaf.server.replace(/\/?$/, '/') : null;
        const listed = !moshaf?.surah_list || moshaf.surah_list.split(',').includes(String(surah));
        return server && listed && `${server}${padded}.mp3` !== primary ? [primary, `${server}${padded}.mp3`] : [primary];
      },
    );
  } catch {
    return [primary];
  }
}

export const AYAH_AUDIO = (globalAyah) => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${globalAyah}.mp3`;

// Exposed for tests.
export const _internal = { state, configuredBase, memo };
