/* Service worker: offline app shell + cached Quran data.
 *
 * - App shell (HTML, CSS, JS, fonts, icons, artwork and prayer diagrams): precached; served stale-while-revalidate so updates arrive on the
 *   next visit. Bump VERSION whenever these files change.
 * - Navigations: network first, falling back to the cached page when offline.
 * - Quran text / tafsir / translations (public API or our backend): stale-while-revalidate, size-capped.
 * - Audio is never intercepted (range requests must go straight to the media servers).
 * - Prayer times and audio look-ups are never cached here (they are time/location dependent).
 */
const VERSION = 'v3.4.0';
const SHELL = `shell-${VERSION}`;
const DATA = 'quran-data-v1';
const DATA_LIMIT = 300;

const SHELL_FILES = [
  './', 'index.html', 'manifest.json', 'assets/css/main.css', 'assets/js/analytics.js', 'assets/js/core/api.js',
  'assets/js/core/arabic.js', 'assets/js/core/dom.js', 'assets/js/core/i18n.js',
  'assets/js/core/memorization-store.js', 'assets/js/core/mic.js', 'assets/js/core/modal.js',
  'assets/js/core/mushaf.js', 'assets/js/core/quran.js', 'assets/js/core/reading-log.js',
  'assets/js/core/recitation.js', 'assets/js/core/settings.js', 'assets/js/core/speech.js',
  'assets/js/core/storage.js', 'assets/js/core/toast.js', 'assets/js/data/academy.js', 'assets/js/data/adhkar.js',
  'assets/js/data/prayer-lessons.js', 'assets/js/data/quran-index.js', 'assets/js/data/reciters.js',
  'assets/js/data/scholar-resources.js', 'assets/js/data/surahs.js', 'assets/js/data/translations-ext.js', 'assets/js/data/translations-insights.js',
  'assets/js/data/translations.js', 'assets/js/features/adhkar.js', 'assets/js/features/ayah-search.js',
  'assets/js/features/dashboard.js', 'assets/js/features/favorites.js', 'assets/js/features/islamic-search.js',
  'assets/js/features/learn.js', 'assets/js/features/memorization.js', 'assets/js/features/player.js',
  'assets/js/features/prayer.js', 'assets/js/features/profile.js', 'assets/js/features/reader.js',
  'assets/js/features/rosary.js', 'assets/js/features/settings-panel.js', 'assets/js/features/surahs.js',
  'assets/js/features/theme.js', 'assets/js/features/voice-lab.js', 'assets/js/features/wird.js',
  'assets/js/main.js', 'assets/fonts/amiri-arabic-400-normal.woff2', 'assets/fonts/amiri-arabic-700-normal.woff2',
  'assets/fonts/cairo-arabic-wght-normal.woff2', 'assets/fonts/amiri-latin-400-normal.woff2',
  'assets/fonts/amiri-latin-700-normal.woff2', 'assets/fonts/cairo-latin-wght-normal.woff2',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png', 'assets/icons/favicon-32.png',
  'assets/icons/maskable-512.png', 'assets/icons/apple-touch-icon.png', 'assets/img/backdrop.svg',
  'assets/img/icon.svg', 'assets/img/pattern.svg', 'assets/img/prayer/itidal.svg', 'assets/img/prayer/jalsa.svg',
  'assets/img/prayer/qabd.svg', 'assets/img/prayer/qiyam.svg', 'assets/img/prayer/ruku.svg',
  'assets/img/prayer/sujud.svg', 'assets/img/prayer/takbir.svg', 'assets/img/prayer/tashahhud.svg',
  'assets/img/prayer/tasleem.svg', 'assets/img/prayer/tawarruk.svg',
  'assets/js/core/assistant.js', 'assets/js/features/assistant.js', 'assets/js/data/translations-assistant.js',
  'assets/js/core/assistant-engine.js', 'assets/js/data/assistant/site-faq.js', 'assets/js/data/assistant/islamic-kb.js',
  'assets/js/data/assistant/small-talk.js', 'assets/js/data/assistant/entities.js',
  'assets/js/core/backup.js', 'assets/js/core/challenge.js', 'assets/js/core/insights.js', 'assets/js/core/listening-log.js',
  'assets/js/core/notes.js', 'assets/js/features/backup-panel.js', 'assets/js/features/insights.js', 'assets/js/features/notes.js',
  'about.html', 'assets/js/about.js', 'assets/js/data/about-media.js', 'assets/img/about/dome-of-the-rock.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL, DATA]);
    for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
    await self.clients.claim();
  })());
});

const isQuranData = (url) =>
  (url.hostname === 'api.alquran.cloud' && /^\/v1\/(surah|ayah)\//.test(url.pathname))
  || /\/api\/v1\/(surahs|ayahs|editions)(\/|$|\?)/.test(url.pathname);

async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - limit; i += 1) await cache.delete(keys[i]);
}

async function staleWhileRevalidate(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
      if (limit) trim(cacheName, limit);
    }
    return response;
  }).catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (request.destination === 'audio' || /\.mp3$/i.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match(request)) || caches.match('index.html')));
    return;
  }
  if (url.origin === self.location.origin && !url.pathname.includes('/api/')) {
    event.respondWith(staleWhileRevalidate(request, SHELL));
    return;
  }
  if (isQuranData(url)) {
    event.respondWith(staleWhileRevalidate(request, DATA, DATA_LIMIT));
    return;
  }
});

// Focus the site when a prayer notification is clicked.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (all.length) return all[0].focus();
    return self.clients.openWindow('./');
  })());
});
