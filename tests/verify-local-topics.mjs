import assert from 'node:assert/strict';
const root = new URL(process.argv[2] || 'http://127.0.0.1:4182/welding-guide-home/');
const checked = new Set();
async function resource(url) {
  if (checked.has(url.href)) return;
  assert.equal(url.origin, root.origin);
  assert.ok(url.pathname.startsWith(root.pathname));
  const response = await fetch(url);
  assert.equal(response.status, 200, url.href);
  checked.add(url.href);
  const type = response.headers.get('content-type') || '';
  if (url.pathname.endsWith('.json')) { assert.ok(type.includes('json')); await response.json(); }
  if (url.pathname.endsWith('.js')) assert.ok(type.includes('javascript'));
  if (url.pathname.endsWith('.css')) {
    assert.ok(type.includes('css'));
    const css = await response.text();
    for (const match of css.matchAll(/url\("([^"]+)"\)/g)) await resource(new URL(match[1], url));
  }
}
for (const id of ['laser-principles', 'history', 'safety']) {
  const page = new URL(`pages/${id}.html`, root);
  const response = await fetch(page);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.doesNotMatch(html, /[A-Z]:[\\/]|welding-guide\/assets/);
  for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) await resource(new URL(match[1], page));
}
const sw = await (await fetch(new URL('service-worker.js', root))).text();
const core = sw.match(/const CORE_ASSETS = (\[[\s\S]*?\])\.map/);
assert.ok(core);
for (const asset of JSON.parse(core[1])) await resource(new URL(asset, root));
assert.ok(sw.includes('name.startsWith("welding-guide-home-")'));
console.log(`Topics HTTP assets: PASS (${checked.size} unique resources, no 404, MIME and JSON checked)`);
