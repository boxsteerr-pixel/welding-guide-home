import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
for (const id of ["108", "102", "122", "202", "401", "411", "502"]) {
  const app = await readFile(path.join(root, "welding-guide-" + id, "js/app.js"), "utf8");
  const functions = app.slice(app.indexOf("  function sectionFromHash()"), app.indexOf("  function appendList("));
  const initial = app.slice(app.indexOf('  if ("scrollRestoration" in history)'), app.indexOf("  loadManual().catch(showLoadError);"));
  for (const hash of ["", "#home", "#faults", "#maintenance", "#safety", "#section=faults", "#unknown"]) {
    const scrolls = [], routes = [], events = {};
    const location = { hash };
    const history = { scrollRestoration: "auto", replaceState(state, _, url) { routes.push(url); location.hash = url; }, pushState(state, _, url) { routes.push(url); } };
    const expected = ["faults", "maintenance", "safety"].includes(hash.replace(/^#(?:section=)?/, "")) ? hash.replace(/^#(?:section=)?/, "") : "home";
    const ctx = vm.createContext({
      state: {}, sectionNames: ["home", "faults", "maintenance", "safety"], location, history,
      document: { querySelectorAll() { return []; }, querySelector() { return { focus() {} }; } },
      window: { scrollTo(value) { scrolls.push(value); }, addEventListener(name, fn) { events[name] = fn; } }
    });
    vm.runInContext(functions + initial, ctx);
    assert.equal(ctx.state.section, expected);
    assert.equal(history.scrollRestoration, "manual");
    assert.equal(routes[0], "#section=" + expected);
    assert.equal(scrolls[0].behavior, "instant");
    assert.equal(scrolls[0].top, 0);
    events.pageshow({ persisted: false });
    assert.equal(scrolls.at(-1).behavior, "instant");
    vm.runInContext('showSection("safety")', ctx);
    assert.equal(routes.at(-1), "#section=safety");
    assert.equal(scrolls.at(-1).behavior, "smooth");
  }
}
console.log("Initial scroll: PASS (7 devices, legacy/new routes, instant initial top, section navigation)");
