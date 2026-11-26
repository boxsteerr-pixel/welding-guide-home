(function () {
  "use strict";
  const container = document.querySelector("#topic-content");
  const topicId = document.body.dataset.topic;
  const dataVersion = topicId === "history" ? "36" : "31";
  const dataUrl = new URL("../data/topics.json?v=" + dataVersion, location.href);
  const caseTemplate = document.querySelector("#history-case-template");
  const entryContent = caseTemplate ? container : container.querySelector(".entry-content");

  function element(tag, text) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    return node;
  }

  function appendContent(container, item) {
    const blocks = item.blocks || (item.paragraphs || []).concat(item.images || []);
    blocks.forEach(function (photo) {
      if (typeof photo === "string") {
        container.append(element("p", photo));
        return;
      }
      const url = new URL(photo.src, dataUrl);
      const previewUrl = photo.preview ? new URL(photo.preview.src, dataUrl) : url;
      // Only Home-owned images; no dependencies on any device repository.
      const imageRoot = new URL("../assets/images/", location.href);
      if (!url.href.startsWith(imageRoot.href) || !previewUrl.href.startsWith(imageRoot.href)) return;
      const figure = element("figure"), img = element("img");
      img.alt = photo.alt || "";
      img.loading = "lazy";
      img.decoding = "async";
      if (photo.preview) {
        img.width = photo.preview.width;
        img.height = photo.preview.height;
      }
      img.src = previewUrl.href;
      if (topicId === "history") {
        const link = element("a");
        link.href = url.href;
        link.target = "_blank";
        link.rel = "noopener";
        link.setAttribute("aria-label", "查看大图（新窗口） · " + img.alt);
        link.append(img);
        figure.append(link);
      } else {
        figure.append(img);
      }
      if (photo.caption) figure.append(element("figcaption", photo.caption));
      container.append(figure);
    });
  }

  fetch(dataUrl).then(function (response) {
    if (!response.ok) throw new Error("专题数据加载失败");
    return response.json();
  }).then(function (data) {
    const topic = data.topics[topicId];
    if (!topic || !Array.isArray(topic.items)) throw new Error("专题数据格式错误");
    document.querySelector("h1").setAttribute("aria-label", topic.title);
    document.querySelector(".topic-subtitle").textContent = topic.subtitle;
    document.title = topic.title + " · 焊机操作工快速处置手册";
    if (!topic.items.length) {
      if (caseTemplate) entryContent.replaceChildren(element("p", "暂无历史案例。"));
      container.dataset.state = "empty";
      return;
    }
    entryContent.replaceChildren();
    if (topicId === "safety") {
      const icons = ["lock-fill", "gear-fill", "shield-fill-check", "lightning-fill", "sun-fill", "exclamation-circle-fill"];
      function copy(text, emphasis) {
        const node = element("p");
        let remaining = text || "";
        (emphasis || []).forEach(function (phrase) {
          const position = remaining.indexOf(phrase);
          if (position < 0) return;
          node.append(document.createTextNode(remaining.slice(0, position)), element("strong", phrase));
          remaining = remaining.slice(position + phrase.length);
        });
        node.append(document.createTextNode(remaining));
        return node;
      }
      topic.items.forEach(function (item, index) {
        const risk = element("details");
        risk.className = "safety-risk safety-risk--" + index + (item.priority ? " safety-risk--priority" : "");
        const summary = element("summary"), icon = element("img"), arrow = element("img");
        icon.className = "safety-risk-icon"; icon.alt = "";
        icon.src = new URL("../assets/icons/safety/" + (icons.includes(item.icon) ? item.icon : "exclamation-circle-fill") + ".svg", location.href).href;
        const label = element("span"); label.className = "safety-risk-copy";
        const title = element("strong", (index + 1) + ". " + item.title.replace(/^\d+\.\s*/, "")); title.className = "safety-risk-title";
        if (item.priority) title.append(element("span", "重点要求"));
        label.append(title);
        arrow.className = "safety-chevron"; arrow.alt = "";
        arrow.src = new URL("../assets/icons/safety/chevron-down.svg", location.href).href;
        summary.append(icon, label, arrow);
        const full = element("div"); full.className = "safety-risk-detail";
        full.append(copy(item.summary, item.emphasis));
        risk.append(summary, full); entryContent.append(risk);
      });
      const notice = element("aside"), icon = element("img");
      notice.className = "safety-general-notice";
      icon.src = new URL("../assets/icons/safety/file-earmark-text.svg", location.href).href; icon.alt = "";
      notice.append(icon, element("p", topic.notice)); entryContent.append(notice);
      container.dataset.state = "ready";
      return;
    }
    topic.items.forEach(function (item) {
      const article = element("article");
      article.className = "topic-item";
      if (!caseTemplate) article.append(element("h2", item.title));
      if (item.summary) article.append(element("p", item.summary));
      if (topicId === "history") {
        const hint = element("p", "轻点图片可查看大图。");
        hint.className = "history-image-hint";
        article.append(hint);
      }
      appendContent(article, item);
      (item.sections || []).forEach(function (section) {
        const sectionContent = element("section");
        sectionContent.append(element(caseTemplate ? "h2" : "h3", section.title));
        appendContent(sectionContent, section);
        article.append(sectionContent);
      });
      if (caseTemplate) {
        const entry = caseTemplate.content.cloneNode(true);
        entry.querySelector(".case-title").textContent = item.title;
        entry.querySelector(".entry-content").append(article);
        entryContent.append(entry);
      } else {
        entryContent.append(article);
      }
    });
    container.dataset.state = "ready";
  }).catch(function () {
    container.dataset.state = "error";
    entryContent.replaceChildren(element("p", "内容暂时无法加载，请返回首页或稍后刷新。"));
  });

  if ("serviceWorker" in navigator) window.addEventListener("load", function () {
    navigator.serviceWorker.register("../service-worker.js", { scope: "../" }).catch(function (error) { console.error("专题离线服务注册失败", error); });
  });
})();
