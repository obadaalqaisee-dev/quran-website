// Local storage with the original site's key names (existing visitors keep their data).
// Every access is guarded: private mode, quota errors or corrupt JSON never break the page.

export const KEYS = Object.freeze({
  theme: 'theme', // 'dark' | 'light'  (original)
  bookmark: 'quranBookmark', // { surahNum, ayahIndex, ayahNumInSurah }  (original)
  profile: 'islamicProfile', // { name, goal }  (original)
  wird: 'dailyWird', // { 'YYYY-MM-DD': { quran, morning, evening, prayer } }  (original)
  favorites: 'favoriteSurahs', // number[]  (original)
  stats: 'islamicStats', // (original key, reserved)
  lang: 'lang', // new: remembered language
  rosary: 'rosaryCount', // new: rosary counter survives reloads
  fontScale: 'quranFontScale', // new: reading font size
  reciter: 'reciter', // new: last chosen reciter
  notify: 'prayerNotify', // new: prayer notifications opted in
  speed: 'playbackRate', // new: audio speed
});

// Keys removed by "reset my data" (the original reset exactly these four).
export const RESETTABLE = [KEYS.profile, KEYS.wird, KEYS.favorites, KEYS.stats];

export function getJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function setJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function getString(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

export function setString(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

export function remove(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export function sessionGet(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function sessionSet(key, value) {
  try { sessionStorage.setItem(key, value); } catch { /* ignore */ }
}
