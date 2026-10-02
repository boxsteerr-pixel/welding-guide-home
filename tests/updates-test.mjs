import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ids = ["108", "102", "122", "202", "401", "411", "502"];
const helper = await readFile(path.join(root, "js/update-state.js"), "utf8");
const home = await readFile(path.join(root, "js/updates.js"), "utf8");
const values = new Map();
const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
function context(extra = {}) {
  const window = {};
  const ctx = vm.createContext({ window, localStorage: storage, ...extra });
  vm.runInContext(helper, ctx);
  return ctx;
}
const device = context();
const machine = (id, version) => ({ machineId: id, manualVersion: version });
assert.equal(device.window.WeldingUpdates.markViewed(machine("101", "1")), false);
assert.equal(values.size, 0, "101 must not participate");
const handlers = {};
const cards = new Map(ids.map(id => [id, {
  attributes: { "aria-label": id + "手册" },
  getAttribute(name) { return this.attributes[name]; },
  setAttribute(name, value) { this.attributes[name] = value; },
  removeAttribute(name) { delete this.attributes[name]; },
  append(node) { this.badge = node; }
}]));
const requests = [];
let mode = "success";
let version = "1.0.0";
const doc = {
  hidden: false,
  querySelector(selector) { return cards.get(selector.match(/guide-(\d+)/)[1]); },
  createElement() { return { hidden: false, setAttribute() {} }; },
  addEventListener(name, fn) { handlers["document:" + name] = fn; }
};
const ctx = context({
  document: doc, navigator: { onLine: true }, location: { href: "https://example.test/welding-guide-home/" },
  URL, AbortController, setTimeout, clearTimeout,
  fetch: async (url, options) => {
    requests.push({ url: url.href, options });
    if (mode === "failure") throw new Error("offline");
    const id = url.pathname.match(/guide-(\d+)/)[1];
    return { ok: true, json: async () => ({ machine: machine(mode === "invalid" ? "101" : id, version) }) };
  }
});
ctx.window.addEventListener = (name, fn) => { handlers[name] = fn; };
vm.runInContext(home, ctx);
const settle = () => new Promise(resolve => setImmediate(resolve));
await settle();
assert.equal(requests.length, 7);
assert.ok(requests.every(r => r.options.cache === "no-store" && r.url.startsWith("https://example.test/welding-guide-")));
assert.ok([...cards.values()].every(c => !c.badge.hidden), "first visit shows unread");
assert.equal(values.get("welding-guide-updates:seen:108"), undefined, "checking does not mark viewed");
device.window.WeldingUpdates.markViewed(machine("108", "1.0.0"));
handlers.storage();
assert.ok(cards.get("108").badge.hidden, "rendered current version clears its dot");
assert.ok(!cards.get("102").badge.hidden, "another device remains unread");
version = "1.1.0";
await handlers.pageshow();
assert.ok(!cards.get("108").badge.hidden, "new release restores dot");
device.window.WeldingUpdates.markViewed(machine("108", "1.0.0"));
handlers.storage();
assert.ok(!cards.get("108").badge.hidden, "loading old offline version does not clear newest dot");
mode = "failure";
await handlers.pageshow();
assert.ok(!cards.get("108").badge.hidden, "failed check preserves last known status");
mode = "invalid";
await handlers.pageshow();
assert.equal(values.get("welding-guide-updates:latest:108"), "1.1.0", "wrong device response ignored");
device.window.WeldingUpdates.markViewed(machine("108", "1.1.0"));
handlers.storage();
assert.ok(cards.get("108").badge.hidden);
assert.ok(!cards.get("108").attributes["aria-label"].includes("新版"));
ctx.navigator.onLine = false;
const before = requests.length;
await handlers.pageshow();
assert.equal(requests.length, before);
const blocked = context({ localStorage: { getItem() { throw Error(); }, setItem() { throw Error(); } } });
assert.equal(blocked.window.WeldingUpdates.markViewed(machine("108", "1")), false);
assert.equal(blocked.window.WeldingUpdates.latest("108"), null);
for (const id of ids) {
  const directory = path.resolve(root, "../welding-guide-" + id);
  assert.equal(await readFile(path.join(directory, "js/update-state.js"), "utf8"), helper);
  const app = await readFile(path.join(directory, "js/app.js"), "utf8");
  assert.match(app, /renderManual\(manual\);\s*\/\/[^\n]*\n\s*if \(window.WeldingUpdates\) window.WeldingUpdates.markViewed\(manual.machine\)/);
  const html = await readFile(path.join(directory, "index.html"), "utf8");
  assert.ok(html.indexOf("update-state.js?v=2") < html.indexOf("app.js?v=7"));
  const sw = await readFile(path.join(directory, "service-worker.js"), "utf8");
  assert.ok(sw.includes('"./js/update-state.js?v=2"'));
  assert.ok(sw.includes('const CACHE_PREFIX = "welding-guide-' + id + '-"'));
  assert.ok(sw.includes("name.startsWith(CACHE_PREFIX)"));
  const events = {};
  const deleted = [];
  const worker = vm.createContext({ URL, self: {
    location: { href: "https://example.test/welding-guide-" + id + "/service-worker.js", origin: "https://example.test" },
    clients: { claim: async () => {} },
    addEventListener(name, fn) { events[name] = fn; }
  }, caches: {
    keys: async () => ["welding-guide-home-v26", "welding-guide-" + id + "-v1", "welding-guide-" + id + "-v7", "welding-guide-production-cache"],
    delete: async name => { deleted.push(name); }
  } });
  vm.runInContext(sw, worker);
  let activation;
  events.activate({ waitUntil(promise) { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, ["welding-guide-" + id + "-v1"]);
  let intercepted = false;
  events.fetch({ request: { method: "GET", url: "https://example.test/welding-guide/data/manual.json" }, respondWith() { intercepted = true; } });
  assert.equal(intercepted, false, "device worker must not intercept 101");
}
console.log("Update indicators: PASS (7 independent devices, new/seen/offline/failure/storage isolation/101 protection)");
