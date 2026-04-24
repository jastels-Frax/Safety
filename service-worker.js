/* ============================================================
   Fraxinus PWA — Service Worker
   Strategy: cache-first for shell assets, network-first for
   everything else (future API calls, dynamic content).
   ============================================================ */

const CACHE_VERSION = 'v10';
const SHELL_CACHE   = 'fraxinus-shell-' + CACHE_VERSION;

const SHELL_ASSETS = [
  '/safety/',
  '/safety/index.html',
  '/safety/style.css',
  '/safety/db.js',
  '/safety/toolbox.js',
  '/safety/jsha.js',
  '/safety/submissions.js',
  '/safety/documents.js',
  '/safety/manifest.json',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&display=swap',
];

// ── Install: pre-cache the app shell ────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove stale caches ───────────────────────────

self.addEventListener('activate', event => {
  const keep = [SHELL_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => !keep.includes(key))
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/safety/index.html').then(function(response) {
        return response || fetch('/safety/index.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
