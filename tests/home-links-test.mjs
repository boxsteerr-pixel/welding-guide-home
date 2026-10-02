import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ids = ["108", "102", "122", "202", "401", "411", "502"];
assert.doesNotMatch(await readFile(path.join(root, "welding-guide-home/index.html"), "utf8"), /class="home-return"/);
const bases = ["https://boxsteerr-pixel.github.io/", "http://127.0.0.1:4182/"];
for (const id of ids) {
  const base = path.join(root, "welding-guide-" + id);
  const html = await readFile(path.join(base, "index.html"), "utf8");
  const link = html.match(/<a class="home-return" href="([^"]+)"[^>]+>[\s\S]*?<\/a>/);
  assert.ok(link);
  assert.match(link[0], /<svg/);
  assert.doesNotMatch(link[0], /<span|>HOMEPAGE</);
  for (const origin of bases) assert.equal(new URL(link[1], origin + "welding-guide-" + id + "/").href, origin + "welding-guide-home/");
  const css = await readFile(path.join(base, "css/home-link.css"), "utf8");
  assert.match(css, /min-height: 44px/);
  assert.match(css, /position: absolute; top: env\(safe-area-inset-top/);
  assert.ok(html.indexOf(link[0]) > html.indexOf('<header class="hero">'));
  assert.match(css, /left: env\(safe-area-inset-left/);
  assert.match(css, /focus-visible/);
  const sw = await readFile(path.join(base, "service-worker.js"), "utf8");
  assert.match(sw, /\.\/css\/home-link\.css\?v=/);
  assert.doesNotMatch(css + link[0], /welding-guide\/|[A-Z]:[\\/]/);
}
for (const id of ["laser-principles", "history", "safety"]) {
  const html = await readFile(path.join(root, "welding-guide-home/pages/" + id + ".html"), "utf8");
  assert.match(html, /class="home-return"/);
  assert.match(html, /href="\.\.\/index.html" aria-label="返回HOMEPAGE统一入口"/);
  assert.match(html, /\.\.\/css\/home-link\.css\?v=26/);
}
console.log("Homepage links: PASS (10 child pages, no icon on Home, header-local placement, 44px targets)");
