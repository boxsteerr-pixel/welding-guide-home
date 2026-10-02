(function () {
  "use strict";
  const updates = window.WeldingUpdates;
  const ids = ["101", "108", "102", "122", "202", "401", "411", "502"];
  let checking = false;
  const cards = ids.map(function (id) {
    const project = id === "101" ? "welding-guide" : "welding-guide-" + id;
    const card = document.querySelector('a[href$="/' + project + '/"]');
    if (!card) return null;
    const badge = document.createElement("span");
    badge.className = "device-update-dot";
    badge.hidden = true;
    badge.setAttribute("aria-hidden", "true");
    card.append(badge);
    return { id: id, card: card, badge: badge, label: card.getAttribute("aria-label") };
  }).filter(Boolean);
  function paint() {
    cards.forEach(function (entry) {
      const latest = updates.latest(entry.id);
      const unread = Boolean(latest && latest !== updates.seen(entry.id));
      entry.badge.hidden = !unread;
      entry.card.setAttribute("aria-label", entry.label + (unread ? "，有新版未查看" : ""));
      if (unread) entry.card.setAttribute("title", "有新版未查看");
      else entry.card.removeAttribute("title");
    });
  }
  async function check(entry) {
    const controller = new AbortController();
    const timeout = setTimeout(function () { controller.abort(); }, 5000);
    try {
      // Sibling project URL works both on project Pages and local subdirectory previews.
      const project = entry.id === "101" ? "welding-guide" : "welding-guide-" + entry.id;
      const file = entry.id === "101" ? "service-worker.js" : "data/manual.json";
      const url = new URL("../" + project + "/" + file, location.href);
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      if (!response.ok) return;
      // 101 already publishes APP_VERSION; read that small file, never fetch its photos/content.
      if (entry.id === "101") {
        const source = await response.text();
        const match = source.match(/^\s*const\s+APP_VERSION\s*=\s*["'](\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)["']\s*;/m);
        if (match) updates.rememberLatest({ machineId: "101", manualVersion: match[1] });
        return;
      }
      const manual = await response.json();
      if (!manual.machine || manual.machine.machineId !== entry.id || !updates.version(manual.machine)) return;
      updates.rememberLatest(manual.machine);
    } catch (_) {
      // Offline/failure retains the last known status; it never means "viewed".
    } finally { clearTimeout(timeout); }
  }
  async function refresh() {
    paint();
    if (checking || !navigator.onLine) return;
    checking = true;
    try { await Promise.all(cards.map(check)); }
    finally { checking = false; paint(); }
  }
  window.addEventListener("storage", paint);
  window.addEventListener("pageshow", refresh);
  window.addEventListener("online", refresh);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) refresh();
  });
  refresh();
})();
