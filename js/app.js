(function () {
  "use strict";

  const networkStatus = document.querySelector("#network-status");
  const installButton = document.querySelector("#install-button");
  let deferredInstallPrompt = null;

  function updateNetworkStatus() {
    const online = navigator.onLine;
    networkStatus.textContent = online ? "在线" : "离线";
    networkStatus.classList.toggle("offline", !online);
  }

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);
  updateNetworkStatus();

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async function () {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  window.addEventListener("appinstalled", function () {
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });

  // Anchor the decoration to the photo's welding point, not the viewport.
  const hero = document.querySelector(".hero");
  const photo = document.querySelector(".hero__illustration");
  const effect = document.querySelector(".welding-fx");
  // Normalized photo coordinates: center of the welding flare below the nozzle.
  const WELDING_POINT = { x: 0.821, y: 0.646 };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let heroVisible = true;

  function updateEffectPlayback() {
    hero.classList.toggle("effects-paused", document.hidden || !heroVisible || reducedMotion.matches);
  }

  function alignWeldingEffect() {
    if (!photo.naturalWidth || !photo.naturalHeight) return;
    const box = photo.getBoundingClientRect();
    const heroBox = hero.getBoundingClientRect();
    const fit = getComputedStyle(photo).objectFit;
    const ratioX = box.width / photo.naturalWidth;
    const ratioY = box.height / photo.naturalHeight;
    const scale = fit === "cover" ? Math.max(ratioX, ratioY) : Math.min(ratioX, ratioY);
    effect.style.left = (box.left - heroBox.left + box.width / 2 + photo.naturalWidth * scale * (WELDING_POINT.x - .5)) + "px";
    effect.style.top = (box.top - heroBox.top + box.height / 2 + photo.naturalHeight * scale * (WELDING_POINT.y - .5)) + "px";
    effect.hidden = false;
    updateEffectPlayback();
  }

  photo.addEventListener("load", alignWeldingEffect);
  window.addEventListener("resize", alignWeldingEffect);
  if ("ResizeObserver" in window) new ResizeObserver(alignWeldingEffect).observe(hero);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (entries) {
    heroVisible = entries[0].isIntersecting;
    updateEffectPlayback();
  }).observe(hero);
  document.addEventListener("visibilitychange", updateEffectPlayback);
  reducedMotion.addEventListener("change", updateEffectPlayback);
  alignWeldingEffect();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(function (error) {
        console.error("统一入口 Service Worker 注册失败", error);
      });
    });
  }
})();
