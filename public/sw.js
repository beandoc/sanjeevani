// Sanjeevani Offline Service Worker (PWA Shell)
//
// PRIVACY: caching is opt-in and narrow. Only the routes explicitly listed
// below (public, unauthenticated, no PHI) and hashed Next.js static assets
// (immutable, non-personalized build output) are ever written to the cache.
// Everything else — every authenticated page, every /api/* call — goes
// straight to the network and is never cached, so a signed-out user on a
// shared device can never see a previous user's cached dashboard, vitals, or
// clinical data.
//
// CACHE_NAME must be bumped whenever STATIC_SHELL_URLS or this fetch
// strategy changes, so `activate` evicts the old cache wholesale rather than
// leaving stale (or, before this revision, PHI-bearing) entries behind
// forever under the same key.
const CACHE_NAME = 'sanjeevani-offline-v2';
const OFFLINE_URL = '/offline';

// Public, unauthenticated routes only — see src/middleware.ts PUBLIC_PATHS.
// Never add an authenticated route (e.g. /dashboard, /stress-calculator)
// here: precaching runs at install time regardless of who's using the
// browser, so it would otherwise cache whichever account happens to be
// signed in on this device under a cache key every later visitor shares.
const STATIC_SHELL_URLS = [
  OFFLINE_URL,
  '/privacy',
  '/resources',
  '/modules',
  '/simulations',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL_URLS).catch((err) => {
        console.warn('PWA shell pre-caching warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/** Purges every cache this worker owns. Triggered by the client on sign-out. */
async function clearAllCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CLEAR_CACHES') {
    event.waitUntil(clearAllCaches());
  }
});

function isCacheableAsset(url) {
  // Hashed, immutable Next.js build output — never personalized.
  return url.pathname.startsWith('/_next/static/');
}

function isCacheableShellRoute(url) {
  return STATIC_SHELL_URLS.some((path) => url.pathname === path || url.pathname === `${path}/`);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API calls — every one of these can carry session-scoped,
  // authenticated PHI.
  if (url.pathname.startsWith('/api/')) return;

  // Immutable hashed build assets: cache-first, safe to keep indefinitely.
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Whitelisted public shell routes: stale-while-revalidate, same as before,
  // but scoped to routes we've confirmed carry no per-user data.
  if (isCacheableShellRoute(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse || caches.match(OFFLINE_URL));
        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // Everything else — every authenticated page, every other document —
  // network-only. Falls back to the generic offline page (never a cached
  // real page) only for full-page navigations when there's truly no network.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Non-navigation, non-whitelisted requests: pass straight through, no
  // caching either direction.
});
