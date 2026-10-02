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
assert.match(sw, /welding-guide-home-v29/);
assert.match(await read("js/app.js"), /WELDING_POINT = \{ x: 0\.821, y: 0\.646 \}/);
assert.ok(html.includes("./js/app.js?v=21-aligned"));
assert.ok(sw.includes("./js/app.js?v=21-aligned"));
assert.equal(manifest.name, "焊机操作工快速处置手册");
assert.ok(html.includes("<title>焊机操作工快速处置手册</title>"));
assert.ok(html.includes("./css/style.css?v=14-blue-light"));
assert.ok(sw.includes("./css/style.css?v=14-blue-light"));
const homeCss = await read("css/style.css");
assert.match(homeCss, /rgba\(126,211,255,\.4\)/);
assert.match(homeCss, /#a5dfff, #effbff/);
const cardsCss = await read("css/topic-cards.css");
assert.match(cardsCss, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
for (const color of ["#00ceff", "#ffae18", "#1bef59"]) assert.ok(cardsCss.includes(color));
assert.ok(html.includes("./css/topic-cards.css?v=28-clean"));
assert.ok(sw.includes("./css/topic-cards.css?v=28-clean"));
assert.match(html, /class="welding-fx" aria-hidden="true"/);
assert.doesNotMatch(html, /effects-toggle|暂停光效|开启光效/);
assert.doesNotMatch(await read("js/app.js"), /effectsToggle|effectsPaused/);
const textOnly = html.replace(/<[^>]+>/g, "");
for (const title of ["激光焊接原理", "历史回顾", "安全事项"]) assert.ok(textOnly.includes(title));
const cards = html.match(/<a class="hero-feature"[\s\S]*?<\/a>/g) || [];
assert.equal(cards.length, 3);
for (const card of cards) assert.doesNotMatch(card, /<small|topic-english|LASER WELDING BASICS|HISTORY &amp; CASES|SAFETY &amp; NOTICE/);
assert.match(cardsCss, /min-height: 100px/);
assert.doesNotMatch(html, /class="topic-number"|class="topic-arrow"/);
assert.doesNotMatch(cardsCss, /\.topic-number|\.topic-arrow/);
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
  assert.ok(page.includes('src="../js/topics.js?v=18"'));
  assert.ok(page.includes('class="topic-entry"'));
  assert.ok(page.includes('class="entry-content"'));
  assert.ok(page.includes('href="../css/topics.css?v=19"'));
  assert.doesNotMatch(page, /topic-nav|专题导航/);
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
for (const id of ["principle", "history", "safety"]) {
  const file = `assets/images/topics/${id}-page.png`;
  const bytes = await readFile(path.join(root, file));
  assert.equal(bytes.subarray(1, 4).toString(), "PNG");
  assert.ok(sw.includes(`./${file}`));
}
console.log("welding-guide-home validation: PASS");
