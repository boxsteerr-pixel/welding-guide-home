import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const base = new URL('https://boxsteerr-pixel.github.io/welding-guide-home/');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const read = asset => readFile(new URL('../' + asset, import.meta.url));
const worker = (await read('service-worker.js')).toString();
const assets = JSON.parse(worker.match(/const CORE_ASSETS = (\[[\s\S]*?\])\.map/)[1]);
const paths = [...new Set(['./service-worker.js', ...assets])];
for (let start = 0; start < paths.length; start += 6) {
  await Promise.all(paths.slice(start, start + 6).map(async asset => {
    const url = new URL(asset, base);
    assert.ok(url.pathname.startsWith(base.pathname));
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, url.href);
    const bytes = Buffer.from(await response.arrayBuffer());
    const relative = url.pathname.slice(base.pathname.length) || 'index.html';
    assert.equal(digest(bytes), digest(await read(relative)), 'Published content differs: ' + asset);
    const type = response.headers.get('content-type') || '';
    if (relative.endsWith('.js')) assert.match(type, /javascript/);
    if (relative.endsWith('.css')) assert.match(type, /css/);
    if (relative.endsWith('.json')) { assert.match(type, /json/); JSON.parse(bytes.toString()); }
    if (relative.endsWith('.html')) assert.match(type, /html/);
    if (relative.endsWith('.png')) assert.match(type, /image\/png/);
    if (relative.endsWith('.webp')) assert.match(type, /image\/webp/);
    if (relative.endsWith('.ttf')) assert.match(type, /font\/ttf|application\/(?:x-font-ttf|octet-stream)/);
  }));
}
assert.match(worker, /welding-guide-home-v36/);
assert.ok(worker.includes('name.startsWith("welding-guide-home-")'));
console.log(`Home release: PASS (${paths.length} live URLs match local SHA256; HTTP 200, MIME, JSON and cache namespace verified)`);
