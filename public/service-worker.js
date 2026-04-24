const CACHE = "cuadre-v3";
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

const isSameOrigin = (url) => url.origin === self.location.origin;

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      await Promise.allSettled(
        ASSETS.map(asset => cache.add(asset))
      );
    })
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);

  if (!isSameOrigin(requestUrl)) return;

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
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response("Sin conexion", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        })
    );
    return;
  }

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
