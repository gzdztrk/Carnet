// Mon Carnet de Français: keeps the app working offline.
// Change VERSION whenever you upload a new index.html, so phones pick up the update.
const VERSION = "carnet-v30";
const APP_FILES = ["./", "./index.html", "./manifest.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(APP_FILES.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Fonts: keep a copy after the first visit so the app looks the same offline.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.open(VERSION).then((c) =>
        c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }).catch(() => hit))
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // App files: open instantly from the phone, refresh in the background when online.
  event.respondWith(
    caches.open(VERSION).then((c) =>
      c.match(req, { ignoreSearch: true }).then((hit) => {
        const fresh = fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
        if (hit) { event.waitUntil(fresh); return hit; }
        return fresh.then((res) => res || (req.mode === "navigate" ? c.match("./index.html") : Response.error()));
      })
    )
  );
});
