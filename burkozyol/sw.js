/* Burkozyol: network first, cached copy when offline */
const CACHE = "burkozyol-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith("burkozyol-") && k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const same = url.origin === self.location.origin;
  const lib = url.hostname === "unpkg.com" || url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com");
  if (!same && !lib) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r && r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then((m) => m || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined)))
  );
});
