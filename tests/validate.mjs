import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => readFile(path.join(root, file), "utf8");
const [html, manifestText, sw] = await Promise.all([read("index.html"), read("manifest.json"), read("service-worker.js")]);
const manifest = JSON.parse(manifestText);

for (const id of ["101", "108", "102", "122", "202", "401", "411", "502"]) {
  assert.match(html, new RegExp(`>${id}<`), `缺少设备 ${id}`);
}
assert.match(html, /https:\/\/boxsteerr-pixel\.github\.io\/welding-guide\//);
assert.match(html, /https:\/\/boxsteerr-pixel\.github\.io\/welding-guide-108\//);
assert.match(html, /MADE BY FANGPING/);
for (const id of ["102", "122", "202", "401", "411", "502"]) {
  assert.match(html, new RegExp(`https://boxsteerr-pixel\\.github\\.io/welding-guide-${id}/`), `${id} 缺少已发布入口`);
}
assert.equal((html.match(/框架已上线 · 内容待录入/g) || []).length, 6);
assert.equal((html.match(/<a class="device-card device-card--ready"/g) || []).length, 8);
assert.equal(manifest.start_url, "./");
assert.equal(manifest.scope, "./");
assert.equal(manifest.icons.length, 2);
assert.match(sw, /welding-guide-home-v12/);
assert.match(html, /class="welding-fx" aria-hidden="true"/);
assert.doesNotMatch(html, /effects-toggle|暂停光效|开启光效/);
assert.doesNotMatch(await read("js/app.js"), /effectsToggle|effectsPaused/);
const textOnly = html.replace(/<[^>]+>/g, "");
for (const title of ["激光焊接原理", "历史回顾", "安全事项"]) assert.ok(textOnly.includes(title));
assert.ok(html.includes("案例学习 · 经验总结"));
assert.equal((html.match(/class="topic-number"/g) || []).length, 3);
for (const id of ["principle", "history", "safety"]) {
  const file = `assets/images/topics/${id}-3d.png`;
  assert.ok(html.includes(`./${file}`));
  assert.ok(sw.includes(`./${file}`));
  const bytes = await readFile(path.join(root, file));
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
}
assert.match(await read("assets/icons/chevron-right.svg"), /<svg/);
const topics = JSON.parse(await read("data/topics.json"));
for (const id of ["laser-principles", "history", "safety"]) {
  assert.ok(html.includes(`href="./pages/${id}.html"`));
  assert.ok(sw.includes(`./pages/${id}.html`));
  const page = await read(`pages/${id}.html`);
  assert.ok(page.includes(`data-topic="${id}"`));
  assert.ok(page.includes('href="../index.html"'));
  assert.ok(page.includes('src="../js/topics.js"'));
  assert.ok(Array.isArray(topics.topics[id].items));
}
assert.match(await read("css/style.css"), /prefers-reduced-motion: reduce/);
for (const icon of ["welding-head", "feature-principle", "feature-history", "feature-safety"]) {
  assert.ok(sw.includes(`./assets/icons/${icon}.svg`));
  assert.match(await read(`assets/icons/${icon}.svg`), /<svg/);
}
assert.match(html, /\.\/assets\/welding-hero\.png/);
assert.match(sw, /\.\/assets\/welding-hero\.png/);
assert.doesNotMatch(sw, /welding-guide-108|welding-guide\//);
console.log("welding-guide-home validation: PASS");
