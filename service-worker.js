/* ============================================================
   Fraxinus PWA — Service Worker
   Strategy: cache-first for shell assets, network-first for
   everything else (future API calls, dynamic content).
   ============================================================ */

const CACHE_VERSION = 'v3';
const SHELL_CACHE   = 'fraxinus-shell-' + CACHE_VERSION;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/db.js',
  '/toolbox.js',
  '/manifest.json',
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

// ── Fetch: cache-first for shell, network-first for rest ─────

self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cache-first: shell assets (same origin + Google Fonts)
  const isShellAsset =
    (url.origin === self.location.origin) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';

  if (isShellAsset) {
    event.respondWith(cacheFirst(request));
  } else {
    // Network-first for anything else (future API endpoints etc.)
    event.respondWith(networkFirst(request));
  }
});

// ── Strategies ───────────────────────────────────────────────

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Offline and not in cache — return a minimal offline page for navigation
    if (request.mode === 'navigate') {
      const cached = await caches.match('/index.html');
      if (cached) return cached;
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}
