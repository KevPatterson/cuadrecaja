const CACHE = "cuadre-v2";
const OFFLINE_URL = "/offline.html";
const ASSETS = [
  "/",
  "/nuevo-cuadre-wizard",
  "/historial-de-cuadres",
  "/ajustes",
  "/manifest.json",
  OFFLINE_URL,
  "/assets/images/icon-192.png",
  "/assets/images/icon-512.png",
];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);

  // Do not cache external requests (e.g. OCR API, analytics, fonts).
  if (!isSameOrigin(requestUrl)) return;

  // Navigation requests: network first, fallback to cache/offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const cloned = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, cloned));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const home = await caches.match("/");
          if (home) return home;
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Static assets/API from same origin: stale-while-revalidate.
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, cloned));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
