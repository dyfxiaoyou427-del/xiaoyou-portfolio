const { chromium } = require('C:/Users/luyaoyao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.work-card').count(), 15);
  await page.screenshot({ path: '.preview/desktop-home-new-projects.png', fullPage: false });
  for (const file of ['aocoskin.html', 'crocs.html', 'mosiimorii-gift.html', 'osm.html', 'tomford.html']) {
    await page.goto(`http://127.0.0.1:4173/${file}`, { waitUntil: 'networkidle' });
    assert(await page.locator('.project-intro h1').count(), file);
    assert(await page.locator('img').count() > 0, file);
    assert.equal(await page.locator('video').count() > 0, ['crocs.html', 'mosiimorii-gift.html', 'osm.html', 'tomford.html'].includes(file));
    await page.screenshot({ path: `.preview/${file.replace('.html', '')}.png`, fullPage: false });
  }
  await page.goto('http://127.0.0.1:4173/corex-fullscreen.html', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('video').count(), 2);
  await page.goto('http://127.0.0.1:4173/shaken.html', { waitUntil: 'networkidle' });
  assert.equal(await page.locator('.project-image').count(), 8);
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  console.log('PASS 新增5个页面、COREX双视频、井理8张图片与首页15个项目均可加载');
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
