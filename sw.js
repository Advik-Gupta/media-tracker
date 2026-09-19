/* Media Vault service worker.

   Strategy: network-first, cache-as-you-go. Every same-origin GET (pages,
   CSS, JS, data files) is tried on the network first, and the response is
   cached for next time; if the network fails - offline, or a flaky
   connection on a phone - whatever was last cached is served instead.
   That keeps content fresh on every successful load without needing a
   build-time list of what to precache, while still making the app usable
   offline for anything you've already opened.

   /api/* calls are always network-only - search results and episode data
   should never be served stale from a cache. */

const CACHE = "media-vault-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || Response.error())),
  );
});
