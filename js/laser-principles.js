(function () {
  "use strict";
  const content = document.querySelector('.principles-content');
  const dialog = document.querySelector('.principles-lightbox');
  const appRoot = new URL('../', location.href);
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function icon(src, className) {
    const image = node('img', '', className); image.src = new URL(src, appRoot).href; image.alt = ''; return image;
  }
  let priorOverflow = '';
  let imageScale = 1;
  const largeImage = dialog.querySelector('.principles-image-scroll img');
  const imageScroll = dialog.querySelector('.principles-image-scroll');
  let zoomTarget = largeImage;
  function zoom(amount) { imageScale = Math.max(1, Math.min(3, imageScale + amount)); zoomTarget.style.width = (imageScale * 100) + '%'; }
  function scene(photo, url, image) {
    const height = (photo.height || 632) - photo.cropTop;
    const frame = node('div', '', 'principles-scene');
    frame.style.aspectRatio = photo.width + ' / ' + height;
    image = image || node('img'); image.src = url.href; image.alt = photo.alt;
    image.loading = 'lazy'; image.decoding = 'async';
    image.style.top = (-photo.cropTop / height * 100) + '%';
    frame.append(image);
    photo.labels.forEach(function (label) {
      const text = node('span', label.text, 'principles-scene-label');
      text.style.left = (label.x / photo.width * 100) + '%';
      text.style.top = (label.y / height * 100) + '%';
      text.style.width = (label.w / photo.width * 100) + '%';
      text.style.height = (label.h / height * 100) + '%';
      frame.append(text);
    });
    return frame;
  }
  dialog.querySelector('.diagram-zoom-in').addEventListener('click', function () { zoom(.5); });
  dialog.querySelector('.diagram-zoom-out').addEventListener('click', function () { zoom(-.5); });
  function openDiagram(photo, url) {
    if (!dialog.showModal) { window.open(url.href, '_blank', 'noopener'); return; }
    largeImage.src = url.href; largeImage.alt = photo.alt;
    zoomTarget = scene(photo, url, largeImage); imageScroll.replaceChildren(zoomTarget);
    dialog.querySelector('#diagram-dialog-title').textContent = photo.title;
    dialog.querySelector('.diagram-original').href = url.href;
    imageScale = 1; zoom(0);
    priorOverflow = document.body.style.overflow;
    dialog.showModal(); document.body.style.overflow = 'hidden';
  }
  dialog.querySelector('.diagram-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('close', function () { document.body.style.overflow = priorOverflow; });
  fetch(new URL('data/laser-principles.json?v=9', appRoot)).then(function (response) {
    if (!response.ok) throw new Error('原理内容加载失败');
    return response.json();
  }).then(function (data) {
    if (!data || !Array.isArray(data.cards) || data.cards.length !== 5 || !Array.isArray(data.process)) throw new Error('原理内容格式错误');
    const core = node('section', '', 'principles-core'); core.append(node('h2', data.title));
    const coreText = node('p'); let remaining = data.core;
    data.emphasis.forEach(function (phrase) {
      const index = remaining.indexOf(phrase); if (index < 0) return;
      coreText.append(document.createTextNode(remaining.slice(0, index)), node('strong', phrase)); remaining = remaining.slice(index + phrase.length);
    });
    coreText.append(document.createTextNode(remaining)); core.append(coreText);
    const fragment = document.createDocumentFragment(); fragment.append(core);
    data.cards.forEach(function (card, index) {
      const details = node('details', '', 'principles-card');
      const summary = node('summary');
      const heading = node('span', '', 'principles-card-heading');
      heading.append(node('span', String(index + 1).padStart(2, '0'), 'principles-number'), icon('assets/icons/topic-principle-entry.svg', 'principles-icon'), node('strong', card.title), icon('assets/icons/chevron-right.svg', 'principles-expand'));
      const tags = node('span', '', 'principles-tags'); card.tags.forEach(function (tag) { tags.append(node('span', tag, 'principles-tag')); });
      summary.append(heading, tags, node('p', card.core, 'principles-teaser'));
      const detail = node('div', '', 'principles-detail'); card.paragraphs.forEach(function (paragraph) { detail.append(node('p', paragraph)); });
      details.append(summary, detail); fragment.append(details);
    });
    const flow = node('section', '', 'principles-flow'); flow.append(node('h2', 'CO₂ 激光焊接过程'), node('p', '左右滑动查看完整过程', 'principles-flow-help'));
    const list = node('ol', '', 'principles-process'); list.tabIndex = 0; list.setAttribute('aria-label', 'CO₂激光焊接过程，可左右滚动');
    data.process.forEach(function (step) { const item = node('li'); item.append(icon('assets/icons/topic-principle-entry.svg', 'principles-icon'), node('span', step)); list.append(item); }); flow.append(list); fragment.append(flow);
    const diagram = node('section', '', 'principles-diagram'); diagram.append(node('h2', 'CO₂激光焊接原理组图'), node('p', '向下浏览独立插图；点击标题展开，点击图片放大。'));
    data.diagram.images.forEach(function (photo, index) {
      const url = new URL(photo.src, location.href);
      if (url.origin !== appRoot.origin || !url.pathname.startsWith(appRoot.pathname + 'assets/images/topics/co2-') || !url.pathname.endsWith('.png')) throw new Error('示意图必须使用本项目资源');
      const card = node('details', '', 'principles-gallery-card');
      const summary = node('summary'); summary.append(node('strong', String(index + 1).padStart(2, '0') + '｜' + photo.title), icon('assets/icons/chevron-right.svg', 'principles-expand'));
      const figure = node('figure'), button = node('button'); button.type = 'button'; button.setAttribute('aria-label', '查看大图：' + photo.title);
      photo.text.forEach(function (paragraph) { figure.append(node('p', paragraph, 'principles-retyped')); });
      button.append(scene(photo, url)); button.addEventListener('click', function () { openDiagram(photo, url); });
      figure.append(button, node('figcaption', photo.caption)); card.append(summary, figure); diagram.append(card);
    });
    diagram.append(node('p', data.diagram.caption)); fragment.append(diagram, node('p', data.notice, 'principles-notice'));
    content.replaceChildren(fragment); content.dataset.state = 'ready';
  }).catch(function () { content.replaceChildren(node('p', '原理内容暂时无法加载，请刷新后重试。', 'empty-state')); content.dataset.state = 'error'; });
  if ('serviceWorker' in navigator) window.addEventListener('load', function () {
    navigator.serviceWorker.register('../service-worker.js', { scope: '../' }).catch(function () {});
  });
})();
