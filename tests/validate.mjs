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
  assert.doesNotMatch(html, new RegExp(`github\\.io/welding-guide-${id}`), `${id} 不应有正式链接`);
}
assert.equal((html.match(/待建设/g) || []).length, 6);
assert.equal(manifest.start_url, "./");
assert.equal(manifest.scope, "./");
assert.equal(manifest.icons.length, 2);
assert.match(sw, /welding-guide-home-v2/);
assert.doesNotMatch(sw, /welding-guide-108|welding-guide\//);
console.log("welding-guide-home validation: PASS");
