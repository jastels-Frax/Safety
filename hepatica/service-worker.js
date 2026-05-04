/* ============================================================
   Hepatica Survey — Service Worker
   ============================================================ */

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = 'hepatica-shell-' + CACHE_VERSION;

const SHELL_ASSETS = [
  '/safety/hepatica/',
  '/safety/hepatica/index.html',
  '/safety/hepatica/style.css',
  '/safety/hepatica/app.js',
  '/safety/hepatica/db.js',
  '/safety/hepatica/manifest.json',
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

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/safety/hepatica/index.html').then(r => r || fetch('/safety/hepatica/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(r => r || fetch(event.request))
  );
});
