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
  // Added by the platform evolution (new keys only; none of the keys above changed):
  labMode: 'memorizationMode', // memorisation-lab mode
  memo: 'memorizationData', // memorisation progress, plan, revisions, mistakes (core/memorization-store.js)
  micDevice: 'micDeviceId', // microphone chosen for the microphone test
  readingTheme: 'readingTheme', // 'default' | 'paper' | 'sepia' | 'night'
  readingLog: 'readingLog', // { 'YYYY-MM-DD': number[] } global ids of ayahs read that day
  settings: 'userSettings', // { dailyGoal, notifyBefore, alwaysTafsir }
  recentAudio: 'recentAudio', // [{ surah, reciter, at }]
  learning: 'learningProgress', // { lessons: { id: date }, quizzes: { id: { score, total, date } } }
  tasbeeh: 'tasbeehPrefs', // { phrase, target } of the rosary in Hisn al-Muslim (the count stays in rosaryCount)
  nasheedVolume: 'nasheedVolume', // volume of the nasheed player on the «من أنا» page
  // Added by the innovation phase (new keys only; none of the keys above changed):
  listening: 'listeningLog', // { days: { date: seconds }, reciters: { slug: seconds } } (core/listening-log.js)
  notes: 'ayahNotes', // { v, items: [{ surah, ayah, collection, note, updated }], custom } (core/notes.js)
  khatma: 'khatmaPlan', // { target: 'YYYY-MM-DD', start: 'YYYY-MM-DD' } khatma planner
  challenge: 'dailyChallenge', // { days: { date: { q, ok } } } daily knowledge challenge
  // Added by the platform transformation (new keys only; none of the keys above changed):
  sidebar: 'sidebarState', // { collapsed, groups: { id: open } } sidebar layout (features/sidebar.js)
  journey: 'quranJourney', // Quran Journey paths, steps, goals and history (core/journey.js)
  reminders: 'journeyReminders', // { id: { on, time, last } } gentle daily reminders (core/reminders.js)
  recentRead: 'recentSurahs', // [surah numbers] surahs opened in the reader, newest first (features/home.js)
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
