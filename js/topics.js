(function () {
  "use strict";
  const container = document.querySelector("#topic-content");
  const topicId = document.body.dataset.topic;
  const dataUrl = new URL("../data/topics.json", location.href);

  function element(tag, text) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    return node;
  }

  fetch(dataUrl).then(function (response) {
    if (!response.ok) throw new Error("专题数据加载失败");
    return response.json();
  }).then(function (data) {
    const topic = data.topics[topicId];
    if (!topic || !Array.isArray(topic.items)) throw new Error("专题数据格式错误");
    document.querySelector("h1").textContent = topic.title;
    document.querySelector(".topic-subtitle").textContent = topic.subtitle;
    document.title = topic.title + " · 操作工快速处置手册";
    if (!topic.items.length) { container.dataset.state = "empty"; return; }
    container.replaceChildren();
    topic.items.forEach(function (item) {
      const article = element("article");
      article.className = "topic-item";
      article.append(element("h2", item.title));
      if (item.summary) article.append(element("p", item.summary));
      (item.paragraphs || []).forEach(function (paragraph) { article.append(element("p", paragraph)); });
      (item.images || []).forEach(function (photo) {
        const url = new URL(photo.src, dataUrl);
        // Only Home-owned images; no dependencies on any device repository.
        const appRoot = new URL("../", location.href);
        if (url.origin !== appRoot.origin || !url.pathname.startsWith(appRoot.pathname + "assets/images/")) return;
        const figure = element("figure"), img = element("img");
        img.src = url.href; img.alt = photo.alt || ""; img.loading = "lazy";
        figure.append(img);
        if (photo.caption) figure.append(element("figcaption", photo.caption));
        article.append(figure);
      });
      container.append(article);
    });
    container.dataset.state = "ready";
  }).catch(function () {
    container.dataset.state = "error";
    container.replaceChildren(element("p", "内容暂时无法加载，请返回首页或稍后刷新。"));
  });

  if ("serviceWorker" in navigator) window.addEventListener("load", function () {
    navigator.serviceWorker.register("../service-worker.js", { scope: "../" }).catch(function (error) { console.error("专题离线服务注册失败", error); });
  });
})();
