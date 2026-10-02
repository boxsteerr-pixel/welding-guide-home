import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
const read = file => readFile(new URL("../" + file, import.meta.url), "utf8");
const data = JSON.parse(await read("data/topics.json"));
const topic = data.topics.safety;
assert.equal(topic.items.length, 6);
assert.equal(data.topics.history.items.length, 0);
assert.equal(data.topics['laser-principles'].items.length, 0);
assert.match(topic.items[0].summary, /锁定挂牌（LOTO）.*插入作业区域对应的安全销/);
const html = await read("pages/safety.html"), worker = await read("service-worker.js");
assert.match(html, /<h2>风险识别与防控<\/h2>/);
assert.doesNotMatch(html, /<details class="topic-entry"|1\. 风险识别与防控/);
assert.match(html, /safety.css\?v=31/);
assert.match(worker, /name.startsWith\("welding-guide-home-"\)/);
class Node {
  constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.attributes = {}; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(key, value) { this.attributes[key] = value; }
}
const entry = new Node('div'), container = new Node('section'), heading = new Node('h1'), subtitle = new Node('p');
container.querySelector = () => entry;
const doc = { body: { dataset: { topic: 'safety' } }, createElement: tag => new Node(tag), createTextNode: text => ({ textContent: text }), querySelector: selector => ({ '#topic-content': container, h1: heading, '.topic-subtitle': subtitle })[selector] };
vm.runInNewContext(await read('js/topics.js'), { document: doc, location: { href: 'https://example.test/welding-guide-home/pages/safety.html' }, URL, navigator: {}, window: {}, fetch: async () => ({ ok: true, json: async () => data }) });
await new Promise(resolve => setImmediate(resolve));
assert.equal(container.dataset.state, 'ready');
assert.equal(entry.children.filter(x => x.tag === 'details').length, 6);
entry.children.filter(x => x.tag === 'details').forEach((risk, index) => {
  const summary = risk.children[0], label = summary.children[1];
  assert.equal(label.children.length, 1, 'collapsed summary must contain only its title, never body copy');
  assert.ok(label.children[0].textContent.startsWith((index + 1) + '. '));
  assert.equal(risk.children[1].children[0].tag, 'p', 'requirement copy belongs only in collapsible detail');
});
assert.equal(entry.children.at(-1).className, 'safety-general-notice');
for (const item of topic.items) {
  assert.match(await read('assets/icons/safety/' + item.icon + '.svg'), /<svg/);
  assert.ok(worker.includes('./assets/icons/safety/' + item.icon + '.svg'));
}
assert.ok(worker.includes('./data/topics.json?v=31'));
assert.ok(worker.includes('./js/topics.js?v=31'));
console.log('Safety topic: PASS (6 requirements, LOTO emphasis, rendered nested details, Home-only assets/cache)');
