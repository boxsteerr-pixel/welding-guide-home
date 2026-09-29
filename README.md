# welding-guide-home

操作工快速处置手册统一入口 PWA。

## 边界

- 只链接已存在的101正式手册和规划中的108手册地址。
- 102、122、202、401、411、502仅显示“待建设”，没有正式链接。
- Service Worker只缓存本仓库资源，不跨仓库缓存任何设备手册。
- 发布前应先更新并验证108链接对应的仓库与 GitHub Pages。

## 本地检查

```powershell
node tests/validate.mjs
```
