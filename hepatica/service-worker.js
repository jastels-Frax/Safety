/* ============================================================
   Hepatica Survey — Service Worker
   ============================================================ */

const CACHE_VERSION = 'v3';
const SHELL_CACHE   = 'hepatica-shell-' + CACHE_VERSION;

const SHELL_ASSETS = [
  '/safety/hepatica/',
  '/safety/hepatica/index.html',
  '/safety/hepatica/style.css',
  '/safety/hepatica/app.js',
  '/safety/hepatica/db.js',
  '/safety/hepatica/manifest.json',
  '/safety/icons/icon-192.png',
  '/safety/icons/icon-512.png',
  '/safety/icons/icon-192-maskable.png',
  '/safety/icons/icon-512-maskable.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL_CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Navigation: always serve shell
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/safety/hepatica/index.html')
        .then(r => r || fetch('/safety/hepatica/index.html'))
    );
    return;
  }

  // Shell assets: cache-first, no network fallback needed offline
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      // Not in cache — try network, then cache the response for later
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const clone = response.clone();
        caches.open(SHELL_CACHE).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
