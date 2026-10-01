const VERSION = 'v4';
const SHELL_CACHE = `f1tv-shell-${VERSION}`;
const ASSET_CACHE = `f1tv-assets-${VERSION}`;
const SHELL_URL = '/index.html';
const OFFLINE_URL = '/offline.html';

// theme-init.js is in the precache because it is render-blocking: if it is
// missing the page paints before the theme is applied, which is exactly the
// dark flash it exists to prevent. The SHELL_CACHE key is versioned, so a stale
// copy cannot be served after this changes.
const PRECACHE = [
  SHELL_URL,
  OFFLINE_URL,
  '/theme-init.js',
  '/favicon.svg',
  '/site.webmanifest',
];

/** Static, long-lived assets we can safely serve cache-first. */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/fonts/') ||
    /\.(?:css|js|woff2?|svg|png|jpe?g|webp|avif|ico)$/i.test(url.pathname)
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // Individually, so one 404 can't abort the whole precache.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache: live APIs, third-party embeds, and cross-origin requests
  // (Google Fonts, formula1.com track maps) — they have their own caching.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;
  if (request.mode === 'navigate' && url.pathname === '/stream') return;

  // --- Navigations: network-first so deploys land immediately, shell as
  // --- fallback so deep links still boot the SPA router offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(SHELL_URL, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(SHELL_URL);
          return cached ?? caches.match(OFFLINE_URL);
        }),
    );
    return;
  }

  // --- Hashed build assets: cache-first, they are immutable.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(ASSET_CACHE).then((c) => c.put(request, clone));
            }
            return response;
          }),
      ),
    );
  }
  // Everything else (icons, manifest) is handled by the browser normally.
});
