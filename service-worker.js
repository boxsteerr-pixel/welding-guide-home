const CACHE_NAME = "welding-guide-home-v36";
const APP_ROOT = new URL("./", self.location.href);
const CORE_ASSETS = [
  "./css/splash.css?v=10",
  "./js/splash.js?v=3",
  "./js/splash-sparks.js?v=1",
  "./css/laser-principles.css?v=9",
  "./js/laser-principles.js?v=9",
  "./data/laser-principles.json?v=9",
  "./assets/images/topics/co2-source-08-generation.png",
  "./assets/images/topics/co2-source-09-focusing.png",
  "./assets/images/topics/co2-source-07-protection.png",
  "./assets/images/topics/co2-source-06-crosssection.png",
  "./css/safety.css?v=31",
  "./js/topics.js?v=31",
  "./data/topics.json?v=31",
  "./assets/icons/safety/eyeglasses.svg",
  "./assets/icons/safety/lock-fill.svg",
  "./assets/icons/safety/gear-fill.svg",
  "./assets/icons/safety/shield-fill-check.svg",
  "./assets/icons/safety/lightning-fill.svg",
  "./assets/icons/safety/sun-fill.svg",
  "./assets/icons/safety/exclamation-circle-fill.svg",
  "./assets/icons/safety/file-earmark-text.svg",
  "./assets/icons/safety/chevron-down.svg",
  "./css/mobile-header.css?v=1",
  "./",
  "./index.html",
  "./css/home-link.css?v=26",
  "./css/updates.css?v=23",
  "./js/update-state.js?v=29",
  "./js/updates.js?v=29",
  "./css/style.css",
  "./css/style.css?v=14-blue-light",
  "./css/topic-cards.css?v=28-clean",
  "./assets/images/topics/principle-3d.png",
  "./assets/images/topics/history-3d.png",
  "./assets/images/topics/safety-3d.png",
  "./assets/icons/chevron-right.svg",
  "./js/app.js",
  "./js/app.js?v=21-aligned",
  "./css/topics.css",
  "./css/topics.css?v=19",
  "./js/topics.js",
  "./js/topics.js?v=18",
  "./data/topics.json",
  "./data/topics.json?v=18",
  "./assets/images/topics/principle-page.png",
  "./assets/images/topics/history-page.png",
  "./assets/images/topics/safety-page.png",
  "./assets/icons/topic-principle-entry.svg",
  "./assets/icons/topic-history-entry.svg",
  "./assets/icons/topic-safety-entry.svg",
  "./pages/laser-principles.html",
  "./pages/history.html",
  "./pages/safety.html",
  "./manifest.json",
  "./assets/icons/icon.svg",
  "./assets/icons/welding-head.svg",
  "./assets/icons/feature-principle.svg",
  "./assets/icons/feature-history.svg",
  "./assets/icons/feature-safety.svg",
  "./assets/welding-hero.png",
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
