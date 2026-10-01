# welding-guide-home

焊机操作工快速处置手册统一入口 PWA。

三个专题页面采用独立蓝/橙/绿主题，内容入口可展开收起；正式资料继续维护data/topics.json内对应items数组。装饰素材来源见assets/images/topics/PAGE-ASSETS.md，视觉核对见design-qa-topics.md。本地资源复核可运行node tests/verify-local-topics.mjs（需先启动本地预览）。

## 边界

- 101链接现有正式手册，108及其余六台设备链接各自独立的已发布手册框架。
- 102、122、202、401、411、502显示“框架已上线 · 内容待录入”。
- Service Worker只缓存本仓库资源，不跨仓库缓存任何设备手册。
- 更新设备入口前须验证对应仓库的 GitHub Pages 已成功部署。

## Home专题页面

- pages/laser-principles.html：激光焊接原理。
- pages/history.html：历史回顾 / 案例学习。
- pages/safety.html：安全事项。
- 三页及共享CSS、JS、数据、图片均在Home仓库内，使用同一个Home PWA和缓存。
- 本阶段items为空，不包含未经确认的技术、安全或案例内容。
- 后续优先修改data/topics.json，对应专题的items可添加：id、title、summary、paragraphs（字符串数组）、images（src/alt/caption）。
- 图片放在assets/images/topics/，src按相对data/topics.json填写；需离线的新增图片加入service-worker.js的CORE_ASSETS。
- 示例条目结构：`{"id":"item-001","title":"标题","summary":"摘要","paragraphs":["正文"],"images":[]}`。

## 本地测试

```powershell
node tests/validate.mjs
```
