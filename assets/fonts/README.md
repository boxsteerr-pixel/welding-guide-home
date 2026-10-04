# 启动页字体（本地离线子集）

- `noto-serif-sc-team.ttf`：Noto Serif SC 700，仅含“冷轧焊接管理组”。来源：https://github.com/google/fonts/tree/main/ofl/notoserifsc ，许可证 `NotoSerifSC-OFL.txt`。
- `ma-shan-zheng-welcome.ttf`：Ma Shan Zheng 400，仅含“欢迎您”。来源：https://github.com/googlefonts/mashanzheng ，许可证 `MaShanZheng-OFL.txt`。

字体子集由 Google Fonts 的 `text` 参数提供；随项目本地保存，没有线上字体依赖。约 8 KB，仅作用于启动页。字样发生变化时需重新准备对应字形子集，缺失字形自动采用 CSS 中的系统字体回退。

参考图中的文字是海报美术字；这里使用真实 HTML 文字和开源字体呈现相近的宋体/毛笔风格，不宣称与原图的定制笔形完全一致。
