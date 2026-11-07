const { chromium } = require('C:/Users/luyaoyao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/minicare-fullscreen.html');
  const caption = page.locator('[data-caption-key]').first();
  const original = await caption.innerText();
  await page.locator('[data-caption-editor]').click();
  assert.equal(await caption.getAttribute('contenteditable'), 'true');
  await caption.fill('自定义产品说明');
  await page.locator('[data-caption-editor]').click();
  assert.equal(await caption.innerText(), '自定义产品说明');
  await page.reload();
  assert.equal(await caption.innerText(), '自定义产品说明');
  await page.locator('[data-caption-editor]').click();
  await page.locator('[data-caption-reset]').click();
  assert.equal(await page.locator('[data-caption-key]').first().innerText(), original);
  console.log('PASS 右侧预览可编辑、保存、刷新保留并重置图片注释');
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
