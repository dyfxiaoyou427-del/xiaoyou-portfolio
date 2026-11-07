import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { site, projects, experiments } from '../content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const asset = value => 'images/' + value.split('/').map(encodeURIComponent).join('/');
const cover = project => `images/covers/${project.cover}.webp`;
const arrow = (direction = 'right') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true" class="icon icon-${direction}"><path d="M4 12h15M13 5l7 7-7 7"/></svg>`;
const cross = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true" class="icon"><path d="m6 6 12 12M6 18 18 6"/></svg>';
const brand = '<a class="brand" href="index.html" aria-label="XIAOYOU 作品首页"><span class="brand-symbol" aria-hidden="true">[ x y ]</span><span>XIAOYOU</span></a>';

function head(title, description = site.description) {
  return `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#ffffff"><title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="styles.css"><script src="script.js" defer></script>
</head>`;
}

function footer(active = 'work') {
  return `<footer class="site-footer">
  <a href="index.html" class="footer-intro"><span class="footer-name">Xiaoyou.</span><span>${site.tagline}</span></a>
  <nav class="footer-nav" aria-label="主导航"><a href="index.html" ${active === 'work' ? 'aria-current="page"' : ''}>作品<span lang="en">Work</span></a><a href="research.html" ${active === 'research' ? 'aria-current="page"' : ''}>实验<span lang="en">Research</span></a></nav>
  <div class="footer-discipline"><span>三维视觉 / 动态影像 / 包装设计</span><span class="mono">3D · MOTION · PACKAGING</span></div>
  <div class="footer-actions"><a class="text-action" href="about.html" data-open-about>关于我 ${arrow('up')}</a><a class="text-action" href="about.html#collaborate" data-open-contact>聊聊项目 ${arrow('up')}</a></div>
</footer>`;
}

function aboutContent(titleId = 'about-title') {
  return `<div class="about-content">
  <div class="about-lead"><p class="eyebrow">[ ABOUT THE DESIGNER ]</p><h1 id="${titleId}">让画面，<br>拥有一点<span class="italic">性格。</span></h1><p class="about-intro">我是 XIAOYOU，一名关注产品、材质与运动的三维设计师。<br>做包装，也做会动的画面。</p></div>
  <div class="about-details"><section><p class="eyebrow">01 / 我关注的</p><p>产品怎样出现，材质怎样被看见，镜头怎样让一个小物件变得有记忆点。在理性的结构与感性的表达之间，寻找新的可能。</p></section><section><p class="eyebrow">02 / 创作方向</p><ul class="services"><li><span>三维产品影像</span><span>3D Product Film</span></li><li><span>包装与品牌视觉</span><span>Packaging & Identity</span></li><li><span>动态设计</span><span>Motion Design</span></li><li><span>AI 视觉探索</span><span>AI Exploration</span></li></ul></section><a href="about.html#collaborate" class="about-collaborate text-action" data-open-contact>下一个好想法，从一次对话开始。 ${arrow('up')}</a></div>
  <div class="about-wordmark" aria-hidden="true">XIAOYOU<span>＊</span></div>
  </div>`;
}

function contactForm(prefix = 'contact') {
  return `<div class="contact-content" id="${prefix}-form-content"><p class="eyebrow">[ START A CONVERSATION ]</p><h2 id="${prefix}-title">你有一个<br><span class="italic">怎样的想法？</span></h2><p class="contact-description">把项目的方向、时间与期待整理成一份简报，<br>让下一次沟通更有灵感。</p>
  <form class="brief-form"><label>如何称呼你<input name="name" autocomplete="name" required maxlength="80" placeholder="你的名字 / 品牌名称"></label><label>联系邮箱<input name="email" type="email" autocomplete="email" required maxlength="160" placeholder="you@example.com"></label><label>说说你的项目<textarea name="idea" rows="3" required maxlength="4000" placeholder="想做什么？喜欢的方向、预计时间……"></textarea></label><button type="submit" class="brief-submit">复制项目简报 ${arrow()}</button><p class="form-note">仅在当前页面整理，点击后复制；不会在线发送或保存。</p><textarea class="brief-fallback" aria-label="生成的项目简报，可选择并复制" readonly hidden></textarea><p class="form-status" role="status"></p></form></div>`;
}

function dialogs() {
  return `<dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title"><div class="dialog-top">${brand}<button type="button" class="text-action dialog-close" data-close-dialog>关闭 ${cross}</button></div>${aboutContent()}</dialog>
<dialog id="contact-dialog" class="contact-dialog" aria-labelledby="contact-title"><button type="button" class="dialog-close icon-button" data-close-dialog aria-label="关闭项目简报">${cross}</button>${contactForm()}</dialog>
<dialog id="media-dialog" class="media-dialog" aria-label="作品大图"><div class="media-dialog-top"><span class="media-dialog-title"></span><button type="button" class="text-action" data-close-dialog>关闭 ${cross}</button></div><div class="media-dialog-body"></div></dialog>`;
}

function card(project, index) {
  return `<article class="work-card" data-project="${project.id}" data-categories="${project.filters.join(' ')}" data-format="${project.format}" id="${project.id}">
  <a class="project-link media-frame" href="${project.file}" aria-label="${esc(project.name + ' ' + project.subtitle)}"><img src="${cover(project)}" alt="${esc(project.coverAlt)}" width="1100" height="1100" ${index < 3 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"><span class="open-project">查看项目 ${arrow('up')}</span>${project.video ? `<span class="film-duration"><span class="play-tiny" aria-hidden="true">▶</span> ${project.duration}</span>` : ''}</a>
  <div class="card-meta"><span class="project-code mono">[${project.code}]</span><a href="${project.file}" class="project-caption"><h2>${esc(project.name)}</h2><p>${esc(project.subtitle)}</p></a><span class="project-year mono">${project.year}</span></div>
  </article>`;
}

function indexPage() {
  const filters = [['all', '全部'], ['motion', '三维影像'], ['design', '包装与品牌'], ['ai', 'AI 影像']];
  return `${head('XIAOYOU — 三维设计与动态视觉')}<body class="work-page"><a href="#main" class="skip-link">跳到作品</a>
<div class="page-shell"><header class="work-header">${brand}<h1 class="collection-heading">精选作品<span class="mono">SELECTED WORKS / 2022—2026</span></h1><button class="view-switch text-action" type="button" aria-pressed="false" aria-label="切换为作品索引"><svg viewBox="0 0 22 22" fill="none" stroke="currentColor" aria-hidden="true" class="icon"><path d="M3 5h3m3 0h11M3 11h3m3 0h11M3 17h3m3 0h11"/></svg><span>索引</span></button></header>
<main id="main" class="work-main"><div class="gallery-toolbar"><div class="filters" role="group" aria-label="作品分类">${filters.map(([key, label]) => `<button type="button" class="filter-button" data-filter="${key}" aria-pressed="${key === 'all'}">${label}<sup>${key === 'all' ? projects.length.toString().padStart(2, '0') : projects.filter(p => p.filters.includes(key)).length.toString().padStart(2, '0')}</sup></button>`).join('')}</div><span class="toolbar-note mono">AN ONGOING VISUAL ARCHIVE</span></div>
<div class="current-project" aria-live="polite"><span class="current-code mono">[XY.001]</span><span class="current-name">MINICARE / 元点系列</span></div>
<section class="gallery" tabindex="0" aria-label="作品画廊，可拖动、滚动或使用左右方向键浏览">${projects.map(card).join('')}</section>
<div class="gallery-bottom"><p class="browse-note"><span class="note-cross" aria-hidden="true">＋</span>每一帧，都是一次新的观看。<span class="interaction-hint">滚动 / 拖动以探索 ${arrow()}</span></p><div class="gallery-controls"><span class="gallery-count mono" aria-live="polite">01 <span>/ ${projects.length.toString().padStart(2, '0')}</span></span><button type="button" class="icon-button gallery-prev" aria-label="上一个作品">${arrow('left')}</button><button type="button" class="icon-button gallery-next" aria-label="下一个作品">${arrow()}</button></div></div>
<div class="hover-title" aria-hidden="true"><span></span><small></small></div></main>${footer('work')}</div>${dialogs()}<noscript><p class="noscript-note">可横向滚动查看全部作品，点击封面进入项目。</p></noscript></body></html>`;
}

function researchPage() {
  return `${head('实验 — XIAOYOU')}<body class="research-page"><a href="#main" class="skip-link">跳到实验作品</a><div class="page-shell"><header class="work-header">${brand}<p class="collection-heading">实验室<span class="mono">RESEARCH / OPEN ENDED</span></p><a class="text-action" href="index.html">回到作品 ${arrow('up')}</a></header><main id="main" class="research-main"><div class="research-intro"><h1>一些尚未被定义的<span class="italic">画面。</span></h1><p>关于材质、光影、运动，<br>以及一切值得继续探索的可能。</p><span class="mono">[ STUDIES 01—08 ]</span></div><section class="research-grid" aria-label="视觉实验网格">${experiments.map((item, index) => `<article class="lab-card lab-${item.ratio}" data-expanded="false"><button type="button" class="lab-expand" aria-expanded="false" aria-controls="study-${item.id}" aria-label="放大：${item.name}"><span class="lab-image" id="study-${item.id}"><img src="images/covers/${item.cover}.webp" alt="${item.name}" width="800" height="${item.ratio === 'portrait' ? 1200 : 500}" ${index > 2 ? 'loading="lazy"' : ''} decoding="async"></span><span class="lab-zoom-sign" aria-hidden="true">＋</span></button><div class="lab-meta"><div><span class="mono">[E.${item.id}] ${item.en}</span><h2>${item.name}</h2></div>${item.video ? `<button class="text-action lab-play" type="button" data-media-src="${asset(item.video)}" data-media-poster="images/covers/${item.cover}.webp" data-media-name="${item.name}">播放 ${arrow('up')}</button>` : item.href ? `<a class="text-action" href="${item.href}">项目 ${arrow('up')}</a>` : `<a class="text-action" href="${asset(item.image)}" data-lightbox data-caption="${item.name}">大图 ${arrow('up')}</a>`}</div></article>`).join('')}</section><p class="research-end mono">[ ALWAYS CURIOUS. ALWAYS IN PROGRESS. ]</p></main>${footer('research')}</div>${dialogs()}</body></html>`;
}

function film(project, media = {}) {
  const source = media.src || project.video;
  const duration = media.duration || project.duration;
  const label = media.label || 'THE FILM';
  const title = media.name || `${project.name} ${label}`;
  return `<section id="${media.id || 'film'}" class="project-film" aria-label="${esc(title)}"><div class="section-caption"><span class="mono">[ ${esc(label)} ]</span><span>${esc(duration)} / 完整影片</span></div><div class="film-frame"><video width="${project.id === 'ecoobix' || project.id === 'shaken' ? '1080' : '1920'}" height="${project.id === 'ecoobix' || project.id === 'shaken' ? '1440' : '1080'}" controls playsinline preload="none" poster="${cover(project)}" data-video-source="${asset(source)}" aria-label="${esc(title)}"></video><button type="button" class="video-start">播放完整影片 <span>▶</span></button></div><div class="film-under"><span>以声音、材质与节奏，展开产品的另一面。</span><a href="${asset(source)}" target="_blank" rel="noopener">打开原片 ↗</a></div></section>`;
}

function projectPage(project, index) {
  const next = projects[(index + 1) % projects.length];
  const imgs = project.images.map((src, i) => {
    if (!fs.existsSync(path.join(root, 'images', src))) throw new Error('Missing image: ' + src);
    return `<figure class="project-image"><a href="${asset(src)}" data-lightbox data-caption="${esc(project.name)} / ${String(i + 1).padStart(2, '0')}" aria-label="放大查看 ${esc(project.name)} 项目图像 ${i + 1}"><img src="${asset(src)}" loading="lazy" decoding="async" alt="${esc(project.name)} ${esc(project.subtitle)}，项目图像 ${i + 1}"></a><figcaption><span class="mono">${String(i + 1).padStart(2, '0')} / ${String(project.images.length).padStart(2, '0')}</span><span data-caption-key="${project.id}-${i}">${esc(project.subtitle)}</span></figcaption></figure>`;
  }).join('');
  const detailCover = project.video ? film(project) : project.hideDetailCover ? '' : `<figure class="project-cover"><img src="${cover(project)}" alt="${esc(project.coverAlt)}" fetchpriority="high"></figure>`;
  const extraFilms = (project.videos || []).map(media => film(project, media)).join('');
  return `${head(project.name + ' — ' + project.subtitle + ' / XIAOYOU', project.description)}<body class="project-page"><a href="#main" class="skip-link">跳到项目内容</a><div class="page-shell"><header class="project-header">${brand}<a class="text-action back-link" href="index.html#${project.id}">${arrow('left')} 返回作品</a><div class="project-header-tools"><button type="button" class="text-action caption-edit-toggle" data-caption-editor>编辑注释</button><button type="button" class="text-action caption-reset" data-caption-reset hidden>重置</button><span class="mono project-page-code">[${project.code}]</span></div></header><main id="main" class="project-main"><section class="project-intro"><div><p class="eyebrow">[${project.code}] / ${project.year}</p><h1>${esc(project.name)}</h1><p class="project-subtitle">${esc(project.subtitle)}</p></div><div class="project-description"><p>${project.description}</p><dl><div><dt>创作方向</dt><dd>${project.category}</dd></div><div><dt>工具 / 类型</dt><dd>${project.tools}</dd></div></dl></div></section>${detailCover}${extraFilms}${project.images.length ? `<section class="project-images" aria-label="项目完整图像">${imgs}</section>` : `<section class="film-stills" aria-label="影片静帧"><div class="section-caption"><span class="mono">[ SELECTED FRAMES ]</span><span>影像中的几个瞬间</span></div><div class="stills-grid">${[1, 2, 3, 4].map(i => `<a href="images/covers/${project.id}-frame-${i}.webp" data-lightbox data-caption="${project.name} / 影片静帧 ${i}"><img src="images/covers/${project.id}-frame-${i}.webp" alt="${project.name} 影片静帧 ${i}" loading="lazy" decoding="async"></a>`).join('')}</div></section>`}<a class="next-project" href="${next.file}"><div><span class="eyebrow">[ NEXT PROJECT / ${next.code} ]</span><h2>${next.name}<small>${next.subtitle}</small></h2></div>${arrow()}</a></main>${footer()}</div>${dialogs()}</body></html>`;
}

function aboutPage() {
  return `${head('关于 — XIAOYOU')}<body class="about-page"><div class="page-shell"><header class="work-header">${brand}<a href="index.html" class="text-action">返回作品 ${arrow('up')}</a></header><main>${aboutContent('page-about-title')}<section class="standalone-contact" id="collaborate">${contactForm('page-contact')}</section></main>${footer()}</div>${dialogs()}</body></html>`;
}

const outputs = new Map([['index.html', indexPage()], ['research.html', researchPage()], ['about.html', aboutPage()]]);
projects.forEach((project, index) => outputs.set(project.file, projectPage(project, index)));
for (const [name, html] of outputs) fs.writeFileSync(path.join(root, name), html + '\n', 'utf8');
console.log(`已生成 ${outputs.size} 个静态页面。`);
