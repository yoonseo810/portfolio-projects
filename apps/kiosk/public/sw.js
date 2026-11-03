/*
 * Keeps the kiosk usable with no network. The page and its scripts come from the cache when the
 * network is down; check-ins are queued in IndexedDB by the app and never go through this cache.
 */
const BASE = "/kiosk";
const CACHE = "kiosk-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("kiosk-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  // The sync API must always hit the network, so the kiosk knows when it's really online.
  if (url.pathname.startsWith(`${BASE}/api/`)) return;

  if (req.mode === "navigate") {
    // Fresh page when online (and refresh the cached copy); the last good copy when offline.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(BASE, res.clone()));
          return res;
        })
        .catch(() => caches.match(BASE)),
    );
    return;
  }

  if (url.pathname.startsWith(`${BASE}/_next/static/`)) {
    // Hashed file names never change, so the cache can answer first.
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  // Anything else (icons and the like): network first, cache as a fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || Response.error())),
  );
});
