const CACHE_NAME = "welding-guide-home-v2";
const APP_ROOT = new URL("./", self.location.href);
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./manifest.json",
  "./assets/icons/icon.svg",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png"
].map(function (path) { return new URL(path, APP_ROOT).toString(); });

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(CORE_ASSETS); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (name) {
        return name.startsWith("welding-guide-home-") && name !== CACHE_NAME;
      }).map(function (name) { return caches.delete(name); }));
    })
  ]));
});

self.addEventListener("fetch", function (event) {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || !url.pathname.startsWith(APP_ROOT.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(function (response) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      return response;
    }).catch(function () {
      return caches.match(request).then(function (cached) {
        return cached || caches.match(new URL("./index.html", APP_ROOT).toString());
      });
    }));
    return;
  }

  event.respondWith(caches.match(request).then(function (cached) {
    return cached || fetch(request).then(function (response) {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(request, copy); });
      }
      return response;
    });
  }));
});
