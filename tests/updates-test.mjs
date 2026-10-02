import assert from "node:assert/strict";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ids = ["101", "108", "102", "122", "202", "401", "411", "502"];
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
assert.equal(device.window.WeldingUpdates.markViewed(machine("999", "1")), false);
assert.equal(values.size, 0, "unknown machine must not participate");
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
  querySelector(selector) { return cards.get(selector.includes('/welding-guide/') ? "101" : selector.match(/guide-(\d+)/)[1]); },
  createElement() { return { hidden: false, setAttribute() {} }; },
  addEventListener(name, fn) { handlers["document:" + name] = fn; }
};
const ctx = context({
  document: doc, navigator: { onLine: true }, location: { href: "https://example.test/welding-guide-home/" },
  URL, AbortController, setTimeout, clearTimeout,
  fetch: async (url, options) => {
    requests.push({ url: url.href, options });
    if (mode === "failure") throw new Error("offline");
    const id = url.pathname.startsWith('/welding-guide/') ? "101" : url.pathname.match(/guide-(\d+)/)[1];
    return { ok: true,
      text: async () => mode === "invalid" ? 'const NOT_APP_VERSION = "9.9.9";' : 'const APP_VERSION = "' + version + '";',
      json: async () => ({ machine: machine(mode === "invalid" ? "999" : id, version) }) };
  }
});
ctx.window.addEventListener = (name, fn) => { handlers[name] = fn; };
vm.runInContext(home, ctx);
const settle = () => new Promise(resolve => setImmediate(resolve));
await settle();
assert.equal(requests.length, 8);
assert.ok(requests.every(r => r.options.cache === "no-store" && r.url.startsWith("https://example.test/welding-guide")));
assert.equal(requests.filter(r => r.url.includes('/welding-guide/'))[0].url, "https://example.test/welding-guide/service-worker.js");
assert.ok([...cards.values()].every(c => !c.badge.hidden), "first visit shows unread");
device.window.WeldingUpdates.markViewed(machine("101", "1.0.0"));
handlers.storage();
assert.ok(cards.get("101").badge.hidden, "101 current version clears its dot");
assert.equal(values.get("welding-guide-updates:seen:108"), undefined, "checking does not mark viewed");
device.window.WeldingUpdates.markViewed(machine("108", "1.0.0"));
handlers.storage();
assert.ok(cards.get("108").badge.hidden, "rendered current version clears its dot");
assert.ok(!cards.get("102").badge.hidden, "another device remains unread");
version = "1.1.0";
await handlers.pageshow();
assert.ok(!cards.get("108").badge.hidden, "new release restores dot");
assert.ok(!cards.get("101").badge.hidden, "101 release restores dot");
device.window.WeldingUpdates.markViewed(machine("101", "1.0.0"));
handlers.storage();
assert.ok(!cards.get("101").badge.hidden, "old offline 101 version does not clear latest dot");
device.window.WeldingUpdates.markViewed(machine("108", "1.0.0"));
handlers.storage();
assert.ok(!cards.get("108").badge.hidden, "loading old offline version does not clear newest dot");
mode = "failure";
await handlers.pageshow();
assert.ok(!cards.get("108").badge.hidden, "failed check preserves last known status");
mode = "invalid";
await handlers.pageshow();
assert.equal(values.get("welding-guide-updates:latest:108"), "1.1.0", "wrong device response ignored");
assert.equal(values.get("welding-guide-updates:latest:101"), "1.1.0", "invalid 101 response ignored");
device.window.WeldingUpdates.markViewed(machine("101", "1.1.0"));
handlers.storage();
assert.ok(cards.get("101").badge.hidden, "101 actual latest version clears its dot");
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
for (const id of ids.filter(id => id !== "101")) {
  const directory = path.resolve(root, "../welding-guide-" + id);
  assert.equal(await readFile(path.join(directory, "js/update-state.js"), "utf8"), helper.replace('["101", "108"', '["108"'));
  const app = await readFile(path.join(directory, "js/app.js"), "utf8");
  assert.match(app, /renderManual\(manual\);\s*\/\/[^\n]*\n\s*if \(window.WeldingUpdates\) window.WeldingUpdates.markViewed\(manual.machine\)/);
  const html = await readFile(path.join(directory, "index.html"), "utf8");
  assert.ok(html.indexOf("update-state.js?v=2") < html.indexOf("app.js?v=8"));
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
    keys: async () => ["welding-guide-home-v27", "welding-guide-" + id + "-v1", "welding-guide-" + id + "-v9", "welding-guide-production-cache"],
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
const manual101 = await readFile(path.resolve(root, "../welding-guide/index.html"), "utf8");
const mark101 = manual101.slice(manual101.indexOf('/* 101更新红点：'), manual101.indexOf('</script>', manual101.indexOf('/* 101更新红点：')));
assert.ok(mark101.length > 0);
function load101(text, localStorage = storage) {
  vm.runInNewContext(mark101, { document: { querySelector: () => ({ textContent: text }) }, localStorage });
}
load101('版本：V1.0.32');
assert.equal(values.get('welding-guide-updates:seen:101'), '1.0.32');
load101('版本：V1.0.31');
assert.equal(values.get('welding-guide-updates:seen:101'), '1.0.31', 'records actual offline page, not network latest');
load101('版本：未知');
assert.equal(values.get('welding-guide-updates:seen:101'), '1.0.31');
load101('版本：V1.0.32', { setItem() { throw Error('blocked'); } });
console.log("Update indicators: PASS (8 devices, 101 actual-page acknowledgement, new/seen/offline/failure/storage/cache isolation)");
