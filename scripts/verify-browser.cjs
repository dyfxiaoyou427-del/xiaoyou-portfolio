const { chromium } = require('C:/Users/luyaoyao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'http://127.0.0.1:4173/';
let browser;

(async () => {
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  const mediaRequests = [];
  const checks = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => { if (/\.(mp4|m4v)(?:\?|$)/.test(request.url())) mediaRequests.push(request.url()); });
  const note = message => { checks.push(message); console.log('PASS ' + message); };
  const screenshot = async name => {
    await page.locator('img').evaluateAll(images => images.forEach(image => { image.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.images].every(image => image.complete));
    await page.mouse.move(1, 1);
    const dialogOpen = await page.locator('dialog[open]').count();
    await page.screenshot({ path: path.join(root, '.preview', name + '.png'), fullPage: !dialogOpen });
  };
  const noOverflow = async () => {
    const sizing = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));
    assert(sizing.document <= sizing.width + 1, JSON.stringify(sizing));
  };

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('.media-frame img').first().waitFor();
  assert.equal(await page.locator('.work-card').count(), 15);
  assert.equal(mediaRequests.length, 0, 'The homepage should not fetch full videos');
  await noOverflow();
  await screenshot('desktop-home');
  note('首页包含全部 15 个作品，首屏不请求完整视频');

  await page.locator('[data-filter="ai"]').click();
  assert.equal(await page.locator('.work-card:not([hidden])').count(), 2);
  assert.match(await page.locator('.gallery-count').innerText(), /01\s*\/\s*02/);
  await page.locator('.gallery-next').click();
  await page.waitForTimeout(80);
  assert.match(await page.locator('.gallery-count').innerText(), /02\s*\/\s*02/);
  assert.equal(await page.locator('.gallery-next').isDisabled(), true);
  await page.locator('.work-card:not([hidden]) .project-caption').last().click();
  await page.waitForURL('**/mosiimorii.html');
  assert.equal(await page.locator('.project-intro h1').innerText(), 'MOSIIMORII');
  await page.goBack({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('[data-filter="ai"]').getAttribute('aria-pressed'), 'true');
  assert.match(await page.locator('.gallery-count').innerText(), /02\s*\/\s*02/);
  note('筛选、计数、首尾按钮、项目跳转与返回位置恢复');

  await page.locator('[data-filter="all"]').click();
  await page.locator('.view-switch').click();
  assert.equal(await page.locator('.gallery').evaluate(el => el.classList.contains('is-index')), true);
  await screenshot('desktop-index');
  await page.locator('.view-switch').click();
  await page.locator('.gallery').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(60);
  assert.match(await page.locator('.gallery-count').innerText(), /02\s*\/\s*15/);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(60);
  const galleryBox = await page.locator('.gallery').boundingBox();
  await page.mouse.move(galleryBox.x + 340, galleryBox.y + 120);
  await page.mouse.down();
  await page.mouse.move(galleryBox.x + 100, galleryBox.y + 120, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(350);
  assert.equal(new URL(page.url()).pathname, '/');
  assert(await page.locator('.gallery').evaluate(el => el.scrollLeft) > 80);
  note('索引切换、左右键浏览、鼠标拖动且不误打开项目');

  const aboutTrigger = page.locator('.footer-actions [data-open-about]');
  await aboutTrigger.click();
  assert.equal(await page.locator('#about-dialog').evaluate(el => el.open), true);
  await screenshot('desktop-about');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#about-dialog').evaluate(el => el.open), false);
  assert.equal(await aboutTrigger.evaluate(el => el === document.activeElement), true);
  await page.locator('.footer-actions [data-open-contact]').click();
  const contact = page.locator('#contact-dialog');
  await contact.locator('[name="name"]').fill('视觉测试');
  await contact.locator('[name="email"]').fill('test@example.com');
  await contact.locator('[name="idea"]').fill('一支关于玻璃与光影的产品影片。');
  await contact.locator('[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('#contact-dialog .form-status').textContent.length > 0);
  await screenshot('desktop-contact');
  await page.keyboard.press('Escape');
  note('关于面板、Escape 关闭、焦点返回和项目简报生成');

  await page.goto(base + 'shaken.html', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('video').first().getAttribute('src'), null);
  await page.locator('.video-start').click();
  await page.waitForFunction(() => { const video = document.querySelector('.film-frame video'); return video.readyState >= 2 && video.currentTime > 0; });
  await page.locator('.film-frame video').evaluate(video => video.pause());
  assert.equal(await page.locator('.video-start').isHidden(), true);
  await screenshot('desktop-project');
  const response = await page.request.get(base + 'images/' + encodeURIComponent('井理.m4v'), { headers: { Range: 'bytes=0-99' } });
  assert.equal(response.status(), 206);
  assert.equal((await response.body()).length, 100);
  note('M4V 完整影片实际解码播放，媒体 Range 请求正确');

  await page.goto(base + 'corex-fullscreen.html', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.project-image').count(), 25);
  assert.equal(await page.locator('.project-film').count(), 2);
  await page.locator('.project-image a').first().scrollIntoViewIfNeeded();
  await page.locator('.project-image a').first().click();
  assert.equal(await page.locator('#media-dialog').evaluate(el => el.open), true);
  await page.keyboard.press('Escape');
  note('品牌详情内容完整、大图可打开关闭');

  await page.goto(base + 'research.html', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.lab-card').count(), 8);
  await noOverflow();
  await screenshot('desktop-research');
  await page.locator('.lab-expand').first().click();
  assert.equal(await page.locator('.lab-expand').first().getAttribute('aria-expanded'), 'true');
  await page.locator('.lab-expand').first().click();
  await page.locator('.lab-play').first().click();
  await page.waitForFunction(() => document.querySelector('#media-dialog video')?.readyState >= 2);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('#media-dialog').open && !document.querySelector('#media-dialog video'));
  assert.equal(await page.locator('#media-dialog video').count(), 0);
  note('实验网格放大恢复、实验视频按需播放和关闭释放');

  const sizes = [[390, 844], [844, 390], [768, 1024], [320, 700]];
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.locator('[data-filter="all"]').click();
    await page.waitForTimeout(100);
    await noOverflow();
    await screenshot(`home-${width}x${height}`);
    await page.locator('.footer-actions [data-open-about]').click();
    await noOverflow();
    if (width === 390) await screenshot('mobile-about');
    await page.keyboard.press('Escape');
    note(`${width}×${height} 首页与关于面板无横向溢出`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + 'research.html', { waitUntil: 'networkidle' });
  await noOverflow();
  await screenshot('mobile-research');
  await page.goto(base + 'minicare-fullscreen.html', { waitUntil: 'networkidle' });
  await noOverflow();
  await screenshot('mobile-project');

  const plain = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const plainPage = await plain.newPage();
  await plainPage.goto(base);
  assert.equal(await plainPage.locator('.work-card a.project-link').count(), 15);
  await plainPage.goto(base + 'about.html');
  assert.equal(await plainPage.locator('#page-about-title').isVisible(), true);
  await plain.close();
  note('禁用 JavaScript 后仍可浏览作品和独立关于页面');

  const touchContext = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const touchPage = await touchContext.newPage();
  await touchPage.goto(base, { waitUntil: 'networkidle' });
  const cdp = await touchContext.newCDPSession(touchPage);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y: 350 }] });
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 300 - i * 20, y: 350 }] });
    await touchPage.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await touchPage.waitForTimeout(500);
  assert(await touchPage.locator('.gallery').evaluate(el => el.scrollLeft) > 100);
  assert.equal(new URL(touchPage.url()).pathname, '/');
  await touchContext.close();
  note('手机触摸手势实际滑动画廊，不误打开作品');

  const zoomContext = await browser.newContext({ viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 });
  const zoomPage = await zoomContext.newPage();
  for (const url of ['', 'research.html', 'about.html', 'shaken.html']) {
    await zoomPage.goto(base + url, { waitUntil: 'networkidle' });
    const sizing = await zoomPage.evaluate(() => ({ viewport: innerWidth, width: document.documentElement.scrollWidth }));
    assert(sizing.width <= sizing.viewport + 1, '200% equivalent viewport overflow: ' + url);
  }
  await zoomContext.close();
  note('200% 等效视口检查：作品、实验、关于与项目页内容可浏览');

  await page.goto('file:///' + path.join(root, 'index.html').replaceAll('\\', '/'), { waitUntil: 'load' });
  assert.equal(await page.locator('.work-card').count(), 15);
  await page.locator('[data-filter="ai"]').click();
  assert.equal(await page.locator('.work-card:not([hidden])').count(), 2);
  note('直接以本地文件打开时，作品与筛选可用');

  assert.deepEqual(errors, [], 'Browser errors');
  assert.deepEqual(failed, [], 'HTTP errors');
  const result = { checks, browserErrors: errors, failedResponses: failed, homepageVideosOnInitialLoad: 0, generatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(root, '.preview', 'verification.json'), JSON.stringify(result, null, 2));
  console.log('ALL CHECKS PASSED');
  await browser.close();
})().catch(async error => { console.error(error); if (browser) await browser.close(); process.exitCode = 1; });
