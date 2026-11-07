# XIAOYOU 三维设计师作品集

基于 `design.md`、`AGENT.md`、`SKILL.md` 与用户原始作品素材制作的静态网站。白灰界面、横向画廊、作品筛选、列表索引、黑底实验页、关于面板与完整项目详情。

## 查看网站

推荐双击当前目录中的 **启动预览.cmd**，自动启动本地服务器并打开浏览器：

http://127.0.0.1:4173/

也可以在此目录运行 `npm run dev`。服务器仅监听本机，不会发布到互联网。若端口占用，可指定其他端口，例如 PowerShell 中运行 `$env:PORT=4174` 后再运行 `npm run dev`。

无需安装前端依赖，开发服务器使用 Node.js 内置模块。直接双击 `index.html` 也可以浏览；视频拖动和剪贴板功能推荐使用本地服务器。

## 已实现的内容

- 当前共 15 个项目，提供按类型筛选、横向滚动、鼠标拖动、左右键与索引视图；其中新增 AOCOSKIN、CROCS、MOSIIMORII 新年礼盒、OSM 与 TOM FORD 页面。
- 作品详情支持完整视频、影片静帧、品牌长图、大图查看和下一项目；保留原有三个品牌详情页的文件名。
- 实验页接入原有实验影片与图像，支持网格放大与按需播放。
- 关于面板支持关闭、Escape 和焦点返回；另有无需 JavaScript 的独立关于页面。
- 合作入口将姓名、邮箱与想法整理为可复制的项目简报，仅在页面内处理，未连接邮件或提交服务。
- 视频首页采用派生封面，点击播放时才加载原片，不在首页启动全部大视频。
- 新加入的 COREX、井理鸡尾酒、洗护线素材已分别补入对应详情页；新增项目文件夹的图片与视频也已按命名归档到各自页面。
- 首页、实验、详情和弹窗图片首次进入视野时，以 20px 模糊短暂呈现，再用约 400ms 变清晰；缓存图片也保留这段过渡。系统开启减少动态效果时直接显示清晰内容。

## 维护内容

项目名称、年份、分类、说明、素材路径集中在 `content.mjs`。

修改该文件或页面模板 `scripts/build.mjs` 后，运行 `npm run build` 更新全部 HTML 页面。调整视觉与交互时分别编辑 `styles.css`、`script.js`。

`images/` 为原始素材的副本，`images/covers/` 是从素材制作的 WebP 封面与静帧。原始素材不被覆盖。F 盘原站没有被修改。

`scripts/prepare_assets.py`、`scripts/prepare_video_covers.cjs` 用于本次封面制作，不参与网站运行；需要当前机器上的 Pillow、Playwright、Sharp 和 Chrome。以后替换素材时可以直接自行提供封面，无需运行这些脚本。

## 验证

`node scripts/check-site.mjs` 检查页面、资源路径及重复 ID。

本机浏览器验收脚本为 `scripts/verify-browser.cjs`；运行后截图与检查报告保存在 `.preview/`。脚本使用当前电脑的 Chrome 与随运行环境提供的 Playwright，不是网站运行依赖。

`node scripts/verify-blur.cjs` 单独检查正常动效下的模糊到清晰、缓存与慢网加载、离屏作品、弹窗、减少动态效果和失败回退。

## 发布到 GitHub Pages

项目已经包含 `.github/workflows/pages.yml`。将整个文件夹推送到 GitHub 仓库后，GitHub Actions 会自动运行 `npm run build` 并发布网站。

第一次发布时，在 GitHub 仓库中打开 **Settings → Pages**，将 **Source** 设置为 **GitHub Actions**。之后每次推送到 `master` 或 `main` 分支，网站都会自动更新。

如果仓库名不是 `用户名.github.io`，发布地址通常是：

`https://你的用户名.github.io/仓库名/`

媒体原片较大，上线前建议继续压缩视频；图片和页面已经可以直接用于 GitHub Pages 静态托管。
