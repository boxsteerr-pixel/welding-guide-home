import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const read = f => readFile(new URL('../' + f, import.meta.url), 'utf8');
const data = JSON.parse(await read('data/laser-principles.json'));
assert.equal(data.cards.length, 5); assert.equal(data.process.length, 8);
assert.match(JSON.stringify(data), /10.6 μm/); assert.match(JSON.stringify(data), /Keyhole/);
assert.doesNotMatch(JSON.stringify(data), /OAP|90°|Air Knife|吸收率|焦点绝对稳定|折射/);
assert.match(data.cards[1].paragraphs[0], /反射镜/);
assert.match(data.cards[3].paragraphs[2], /对于配置填丝系统/);
const diagram = await read('assets/images/topics/co2-welding-principle.svg');
for (const label of ['CO₂激光器','外光路','反射镜','焊接头','聚焦光束','钢板接缝','小孔 Keyhole','熔池','焊缝']) assert.ok(diagram.includes(label));
const html = await read('pages/laser-principles.html');
assert.match(html, /1\. 原理概述/); assert.match(html, /激光焊接的基本原理与特点/);
assert.match(html, /<dialog/); assert.match(html, /manifest.json/);
assert.match(html, /2\. 常见焊接缺陷/); assert.match(html, /class="topic-entry defects-entry"/);
assert.match(html, /内容待补充/);
const worker = await read('service-worker.js');
for (const asset of ['css/laser-principles.css?v=9', 'js/laser-principles.js?v=9', 'data/laser-principles.json?v=9']) assert.ok(worker.includes('./' + asset));
for (const photo of data.diagram.images) assert.ok(worker.includes(photo.src.replace('../', './')));
class Node {
  constructor(tag) { this.tag = tag; this.children = []; this.dataset = {}; this.style = {}; this.attrs = {}; this.handlers = {}; }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(k,v) { this.attrs[k] = v; }
  addEventListener(k,v) { this.handlers[k] = v; }
}
const content = new Node('div'), dialog = new Node('dialog'), close = new Node('button');
const largeImage = new Node('img'), imageScroll = new Node('div'), zoomIn = new Node('button'), zoomOut = new Node('button'), original = new Node('a'), title = new Node('h2');
const dialogNodes = { '.diagram-close': close, '.principles-image-scroll': imageScroll, '.principles-image-scroll img': largeImage, '.diagram-zoom-in': zoomIn, '.diagram-zoom-out': zoomOut, '.diagram-original': original, '#diagram-dialog-title': title };
dialog.querySelector = selector => dialogNodes[selector]; dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; dialog.handlers.close(); };
const doc = { body: new Node('body'), createElement: tag => new Node(tag), createTextNode: text => ({ textContent: text }), createDocumentFragment: () => new Node('fragment'), querySelector: s => s === '.principles-content' ? content : dialog };
doc.body.style.overflow = 'auto';
vm.runInNewContext(await read('js/laser-principles.js'), { document: doc, location: { href: 'https://example.test/welding-guide-home/pages/laser-principles.html' }, URL, navigator: {}, window: {}, fetch: async () => ({ ok: true, json: async () => data }) });
await new Promise(resolve => setImmediate(resolve));
assert.equal(content.dataset.state, 'ready');
const nodes = content.children[0].children, cards = nodes.filter(n => n.tag === 'details');
assert.equal(cards.length, 5);
cards.forEach((card, i) => { assert.equal(card.children[0].children.length, 3); assert.equal(card.children[1].children.length, data.cards[i].paragraphs.length); });
const section = nodes.find(n => n.className === 'principles-diagram');
const gallery = section.children.filter(n => n.tag === 'details');
assert.equal(gallery.length, 4);
assert.ok(!data.diagram.images.some(image => image.title === '小孔与熔池形成'));
assert.ok(data.diagram.images.every(image => !image.src.includes('source-02-transmission')));
for (const [i, card] of gallery.entries()) {
  assert.ok(!card.open);
  assert.match(card.children[0].children[0].textContent, new RegExp(data.diagram.images[i].title));
  const bytes = await readFile(new URL('../' + data.diagram.images[i].src.replace('../', ''), import.meta.url));
  assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
  assert.equal(bytes.readUInt32BE(16), data.diagram.images[i].width);
  assert.equal(bytes.readUInt32BE(20), data.diagram.images[i].height || 632);
  assert.ok(data.diagram.images[i].text.length >= 2);
  const photo = data.diagram.images[i];
  assert.doesNotMatch(JSON.stringify(photo), /\uFFFD/);
  for (const label of photo.labels) {
    assert.ok(label.text.length > 0);
    assert.ok(label.x >= 0 && label.y >= 0 && label.x + label.w <= photo.width);
    assert.ok(label.y + label.h <= (photo.height || 632) - photo.cropTop);
  }
}
const imageButton = card => card.children[1].children.find(child => child.tag === 'button');
imageButton(gallery[0]).handlers.click();
assert.equal(dialog.open, true); assert.equal(doc.body.style.overflow, 'hidden');
assert.match(largeImage.src, /co2-source-08-generation.png$/);
assert.equal(imageScroll.children[0].style.aspectRatio, '1024 / 1536');
assert.equal(imageScroll.children[0].children.length, 1);
assert.equal(imageScroll.children[0].children.length, data.diagram.images[0].labels.length + 1);
zoomIn.handlers.click(); assert.equal(imageScroll.children[0].style.width, '150%');
zoomOut.handlers.click(); assert.equal(imageScroll.children[0].style.width, '100%');
close.handlers.click(); assert.equal(dialog.open, false); assert.equal(doc.body.style.overflow, 'auto');
imageButton(gallery[1]).handlers.click(); assert.match(largeImage.src, /co2-source-09-focusing.png$/);
assert.equal(imageScroll.children[0].style.aspectRatio, '1024 / 1536');
assert.equal(imageScroll.children[0].children.length, 1);
close.handlers.click();
imageButton(gallery[2]).handlers.click(); assert.match(largeImage.src, /co2-source-07-protection.png$/);
assert.equal(title.textContent, data.diagram.images[2].title);
assert.equal(imageScroll.children[0].style.aspectRatio, '1199 / 1312');
assert.equal(imageScroll.children[0].children.length, 1);
close.handlers.click();
imageButton(gallery[3]).handlers.click(); assert.match(largeImage.src, /co2-source-06-crosssection.png$/);
assert.equal(imageScroll.children[0].style.aspectRatio, '1536 / 1024');
assert.equal(imageScroll.children[0].children.length, 1);
close.handlers.click();
console.log('Laser principles: PASS (5 knowledge cards, 8 process nodes, 4 images, replacement protection image, deleted gallery card, folding, zoom)');
