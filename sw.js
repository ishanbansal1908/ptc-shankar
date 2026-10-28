// ============================================================
//   PTC BROKERS APP — sw.js (service worker)
//   App ki screens phone me save rakhta hai, taaki app turant
//   khule aur bina internet ke bhi chale. Isme kuch badalna nahi.
// ============================================================

const CACHE = 'ptc-shankar-v3';
const SHELL = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.indexOf('ptc-shankar-') === 0 && k !== CACHE)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Apni files: pehle phone wali copy turant do, peeche se nayi copy le aao
// (agli baar app kholne par naya version). Google (data) wali requests
// ko haath nahi lagate — wo hamesha seedhe internet se jaati hain.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req)
      .then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      })
      .catch(() => null);

    if (cached) {
      e.waitUntil(network);
      return cached;
    }
    const fresh = await network;
    if (fresh) return fresh;
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html');
      if (shell) return shell;
    }
    return Response.error();
  })());
});
