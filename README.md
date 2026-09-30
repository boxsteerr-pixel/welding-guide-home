# welding-guide-home

操作工快速处置手册统一入口 PWA。

## 边界

- 101链接现有正式手册，108及其余六台设备链接各自独立的已发布手册框架。
- 102、122、202、401、411、502显示“框架已上线 · 内容待录入”。
- Service Worker只缓存本仓库资源，不跨仓库缓存任何设备手册。
- 更新设备入口前须验证对应仓库的 GitHub Pages 已成功部署。

## 本地检查

```powershell
node tests/validate.mjs
```
