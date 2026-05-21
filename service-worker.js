/* ============================================================
   Fraxinus PWA — Service Worker
   Strategy: network-first for navigation, cache-first for
   static assets. Updates silently in the background and
   only reloads when no form data is in progress.
   ============================================================ */

const CACHE_VERSION = 'v28';
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

// ── Activate: remove stale caches, claim clients ─────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(
          cacheNames
            .filter(name => name !== SHELL_CACHE)
            .map(name => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Navigation: network-first so fresh HTML is always fetched
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match('/Safety/index.html'))
    );
    return;
  }

  // Static assets: cache-first, update cache on network hit
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(SHELL_CACHE).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});

// ── Message handler ──────────────────────────────────────────

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
