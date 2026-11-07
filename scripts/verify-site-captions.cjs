const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/luyaoyao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const base = process.argv[2] || 'http://127.0.0.1:4173/';
  const captions = JSON.parse(fs.readFileSync(path.join(__dirname, '../captions.json'), 'utf8'));
  const { projects } = await import('../content.mjs');
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext();
    await context.route('**/*', route => ['image', 'media', 'font'].includes(route.request().resourceType()) ? route.abort() : route.continue());
    const page = await context.newPage();
    let count = 0;
    for (const project of projects.filter(item => captions[item.id])) {
      const url = new URL(project.file, base);
      url.searchParams.set('captions', 'published-20261107');
      const response = await page.goto(url.href, { waitUntil: 'domcontentloaded', timeout: 30000 });
      assert.equal(response.status(), 200, project.file);
      for (const [image, text] of Object.entries(captions[project.id])) {
        const index = project.images.indexOf(image);
        const actual = await page.locator(`[data-caption-key="${project.id}-${index}"]`).textContent();
        assert.equal(actual, text, `${project.id} / ${image}`);
        count += 1;
      }
    }
    console.log(`PASS ${Object.keys(captions).length} 个项目、${count} 条注释与 captions.json 完全一致；使用无历史记录的新浏览器访问 ${base}`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
