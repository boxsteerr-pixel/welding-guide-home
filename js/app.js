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

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js", { scope: "./" }).catch(function (error) {
        console.error("统一入口 Service Worker 注册失败", error);
      });
    });
  }
})();
