// Page structure of the site (multi-page navigation inside the single index.html, so GitHub Pages, the
// service worker and every existing link keep working without a server or a build step).
//
// Routes are hash paths: "#/quran", "#/quran/18" (open a surah), "#/memorize/plan", "#/learn-prayer/wudu"…
// Old in-page anchors ("#surahs", "#learnSection", "#prayerSection"… used by the manifest shortcuts, the
// original buttons and visitors' bookmarks) still work: the page that contains the element is shown.
//
// Pure functions (no DOM), unit-tested in tests/unit/platform.test.mjs.

/** Every page, in sidebar order. Each is a <section class="page" data-page="…"> in index.html. */
export const PAGES = Object.freeze([
  'home', 'journey', 'assistant',
  'quran', 'tafsir', 'audio', 'favorites',
  'memorize',
  'learn-prayer', 'academy', 'islam',
  'adhkar',
  'prayer',
  'progress', 'notes', 'profile', 'settings',
]);

/** Route names that are not pages themselves but open one (with an action, see main.js). */
export const ALIASES = Object.freeze({ read: 'quran', tasbih: 'adhkar', wudu: 'learn-prayer', reminders: 'journey' });

/**
 * Feature dialogs that became pages: the dialog element now lives inside its page and is shown in place
 * (non-modal). openDialog(id) for one of them navigates to its page, so every existing opener keeps working.
 */
export const PAGE_DIALOGS = Object.freeze({
  adhkarModal: 'adhkar',
  islamModal: 'islam',
  voiceTestModal: 'memorize',
  favoritesModal: 'favorites',
  profileModal: 'profile',
  assistantModal: 'assistant',
  notesModal: 'notes',
  settingsModal: 'settings',
});

/**
 * Parse a location hash.
 *  - "" / "#" / "#/"           → { page: 'home', route: 'home', param: null, path: '' }
 *  - "#/quran/18"              → { page: 'quran', route: 'quran', param: '18', path: 'quran/18' }
 *  - "#/tasbih"                → { page: 'adhkar', route: 'tasbih', param: null, path: 'tasbih' }
 *  - "#/nope"                  → { page: 'home', route: 'home', param: null, path: '', unknown: true }
 *  - "#learnSection" (legacy)  → { anchor: 'learnSection' }
 */
export function parseHash(hash) {
  let raw = String(hash ?? '').replace(/^#/, '');
  try { raw = decodeURIComponent(raw); } catch { /* keep the raw text */ }
  if (raw === '' || raw === '/') return { page: 'home', route: 'home', param: null, path: '' };
  if (!raw.startsWith('/')) return { anchor: raw };
  const parts = raw.slice(1).split('/').filter(Boolean);
  const name = (parts[0] || '').toLowerCase();
  const page = PAGES.includes(name) ? name : ALIASES[name];
  if (!page) return { page: 'home', route: 'home', param: null, path: '', unknown: true };
  // Parameters are short identifiers or numbers only (they are never inserted as HTML anyway).
  const param = parts.slice(1).join('/').slice(0, 60).replace(/[^\p{L}\p{N}_/-]/gu, '') || null;
  return { page, route: name, param, path: param ? `${name}/${param}` : name };
}

/** Hash for a path such as "quran/18" ("" is the home page). */
export const hashFor = (path = '') => (path && path !== 'home' ? `#/${String(path).replace(/^[#/]+/, '')}` : '#/');

/**
 * Which sidebar entry is active for a parsed route: the most specific `data-route` available
 * ("memorize/plan" before "memorize", "read" before "quran").
 */
export function activeRouteKey(parsed, available) {
  if (!parsed || parsed.anchor) return null;
  const list = new Set(available);
  for (const key of [parsed.path, parsed.route, parsed.page]) if (key && list.has(key)) return key;
  return parsed.page === 'home' && list.has('home') ? 'home' : null;
}
