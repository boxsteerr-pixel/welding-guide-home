import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createHash } from "node:crypto";
const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const ids = ["home", "108", "102", "122", "202", "401", "411", "502"];
await Promise.all(ids.map(async id => {
  const repo = "welding-guide-" + id;
  const base = new URL("https://boxsteerr-pixel.github.io/" + repo + "/");
  const root = path.join(workspace, repo);
  const worker = await readFile(path.join(root, "service-worker.js"), "utf8");
  const assets = JSON.parse(worker.match(/const CORE_ASSETS = (\[[\s\S]*?\])\.map/)[1]);
  const urls = [...new Set(["./service-worker.js", ...assets].map(asset => new URL(asset, base).href))];
  for (const href of urls) {
    const url = new URL(href);
    assert.ok(url.pathname.startsWith(base.pathname));
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, href);
    const bytes = Buffer.from(await response.arrayBuffer());
    const relative = decodeURIComponent(url.pathname.slice(base.pathname.length)) || "index.html";
    assert.equal(digest(bytes), digest(await readFile(path.join(root, relative))), "Published file differs: " + href);
    const type = response.headers.get("content-type") || "";
    if (relative.endsWith(".js")) assert.match(type, /javascript/);
    if (relative.endsWith(".css")) assert.match(type, /css/);
    if (relative.endsWith(".json")) { assert.match(type, /json/); JSON.parse(bytes.toString()); }
    if (relative.endsWith(".html")) assert.match(type, /html/);
  }
  console.log(repo + ": PASS (" + urls.length + " live resources match local release; no 404/MIME/JSON errors)");
}));
