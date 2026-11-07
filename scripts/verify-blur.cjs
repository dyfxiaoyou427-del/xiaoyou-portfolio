const { chromium } = require('C:/Users/luyaoyao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const base = 'http://127.0.0.1:4173/';
const blur = el => parseFloat(getComputedStyle(el).filter.replace('blur(', '')) || 0;

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.focusSamples = [];
      const sample = () => {
        const img = document.querySelector('.media-frame img, .project-cover img');
        if (img?.naturalWidth) window.focusSamples.push({ filter: getComputedStyle(img).filter, loaded: img.complete });
        if (window.focusSamples.length < 150) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    await page.route('**/images/covers/*.webp', async route => {
      const response = await route.fetch();
      await new Promise(resolve => setTimeout(resolve, 300));
      await route.fulfill({ response });
    });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const first = page.locator('.media-frame img').first();
    await page.waitForFunction(() => {
      const img = document.querySelector('.media-frame img');
      return img.naturalWidth > 0 && img.dataset.reveal === 'revealing';
    });
    assert(await first.evaluate(blur) > 10, 'Loaded cover should start visibly blurred');
    await first.evaluate(img => img.getAnimations().forEach(animation => { animation.pause(); animation.currentTime = 80; }));
    await page.screenshot({ path: path.resolve(__dirname, '../.preview/blur-loading.png') });
    await first.evaluate(img => img.getAnimations().forEach(animation => animation.play()));
    await page.waitForFunction(() => document.querySelector('.media-frame img').dataset.reveal === 'ready');
    assert.equal(await first.evaluate(blur), 0);
    const samples = await page.evaluate(() => window.focusSamples);
    assert(samples.some(sample => /blur\(/.test(sample.filter) && parseFloat(sample.filter.slice(5)) > 10));
    assert(samples.some(sample => /blur\(/.test(sample.filter) && parseFloat(sample.filter.slice(5)) > 0 && parseFloat(sample.filter.slice(5)) < 10));
    console.log('PASS 慢网图片实际加载后由20px模糊连续过渡到清晰');

    // Covers may be prefetched before the visitor gets to them. They should
    // still reveal after waiting beyond the failure-recovery window.
    await page.waitForTimeout(8100);
    await page.locator('.work-card').last().scrollIntoViewIfNeeded();
    const last = page.locator('.media-frame img').last();
    await page.waitForFunction(() => document.querySelector('.work-card:last-child img').dataset.reveal === 'revealing');
    assert(await last.evaluate(blur) > 0);
    await page.waitForFunction(() => document.querySelector('.work-card:last-child img').dataset.reveal === 'ready');
    assert.equal(await last.evaluate(blur), 0);
    console.log('PASS 新进入画廊的作品同样模糊后清晰');

    await page.unroute('**/images/covers/*.webp');
    await page.goto(base + 'roopy-fullscreen.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('.project-cover img').dataset.reveal === 'ready');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('.project-cover img').dataset.reveal === 'revealing');
    assert(await page.locator('.project-cover img').evaluate(blur) > 0);
    await page.waitForFunction(() => document.querySelector('.project-cover img').dataset.reveal === 'ready');
    console.log('PASS 缓存命中的封面仍能看到对焦过渡');

    await page.locator('[data-lightbox]').first().click();
    await page.waitForFunction(() => document.querySelector('.media-dialog-body img')?.dataset.reveal === 'revealing');
    assert(await page.locator('.media-dialog-body img').evaluate(blur) > 0);
    await page.waitForFunction(() => document.querySelector('.media-dialog-body img')?.dataset.reveal === 'ready');
    console.log('PASS 弹窗大图加载后恢复清晰');

    await page.goto(base + 'research.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('.lab-image img').dataset.reveal === 'revealing');
    assert(await page.locator('.lab-image img').first().evaluate(blur) > 0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.lab-image img').first().evaluate(blur), 0);
    await page.goto(base);
    assert.equal(await first.evaluate(blur), 0);
    console.log('PASS 减少动态效果在加载前和动画途中都能立即显示清晰内容');

    const plain = await browser.newContext({ javaScriptEnabled: false });
    const nojs = await plain.newPage();
    await nojs.goto(base);
    assert.equal(await nojs.locator('.media-frame img').first().evaluate(blur), 0);
    await plain.close();
    console.log('PASS 关闭JavaScript后图片保持清晰');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.route('**/images/covers/minicare*.webp', route => route.abort());
    await page.goto(base, { waitUntil: 'networkidle' });
    assert.equal(await first.evaluate(blur), 0);
    assert(await page.locator('.project-link').first().getAttribute('href'));
    assert.deepEqual(errors, []);
    console.log('PASS 图片失败后清除模糊，保留作品入口；无脚本错误');
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
