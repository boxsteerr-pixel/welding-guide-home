# Home 欢迎启动页

欢迎页是 `index.html` 外层临时覆盖层，不新增路由，也不改变原首页正文、专题、设备入口或业务逻辑。

## 文字与动画

- 管理组文字：Noto Serif SC 700，本地字体子集，银白宋体效果。
- “欢迎您”：Ma Shan Zheng 400，本地字体子集，三个字依次于0.40 / 0.52 / 0.64秒开始淡入和轻微上浮。
- 字体仅包含当前10个汉字，总计7928字节；OFL许可证保存在 `assets/fonts/`。更改文字时需准备新的字形子集。加载失败时回退系统字体，不影响退场。
- 数字3→2→1，3秒后开始整体淡出，约3.5秒移除覆盖层。4.5秒JavaScript与4.8秒CSS保护避免用户被锁住。
- 页面转入后台或离开时清理；浏览器从专题返回时不重播。刷新和重新打开正常播放。
- 减少动态效果模式只保留简单淡入/淡出；没有额外动画依赖。

## PWA

Home缓存升级为 `welding-guide-home-v34`，增加本项目背景、CSS、JS和两个本地字体。清理旧缓存只匹配 `welding-guide-home-`，不控制或清理设备PWA资源。

manifest、start_url、scope及现有更新机制保持不变。旧窗口仍在使用旧Service Worker时，应关闭本项目全部窗口后重新打开，使新版本接管。

## 验证

运行 `node tests/splash-test.mjs`、`node tests/splash-cache-test.mjs`、`node tests/splash-font-test.mjs` 检查倒计时、清理、兜底、离线缓存及真实字形。

`node tests/verify-home-release.mjs` 检查线上核心资源HTTP状态、MIME、JSON及与本地文件的SHA256一致性。手机尺寸375/390/430px和原专题返回流程已完成桌面浏览器预览测试；真实手机安装、刘海屏和离线重启仍应做实机确认。
