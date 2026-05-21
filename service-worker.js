/* ============================================================
   Fraxinus PWA — Service Worker
   Strategy: cache-first for shell assets, network-first for
   everything else (future API calls, dynamic content).
   ============================================================ */

const CACHE_VERSION = 'v26';
const SHELL_CACHE   = 'fraxinus-shell-' + CACHE_VERSION;

const SHELL_ASSETS = [
  '/Safety/',
  '/Safety/index.html',
  '/Safety/style.css',
  '/Safety/db.js',
  '/Safety/toolbox.js',
  '/Safety/jsha.js',
  '/Safety/submissions.js',
  '/Safety/documents.js',
  '/Safety/manifest.json',
  '/Safety/icons/icon-192.png',
  '/Safety/icons/icon-512.png',
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
      caches.match('/Safety/index.html').then(function(response) {
        return response || fetch('/Safety/index.html');
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
