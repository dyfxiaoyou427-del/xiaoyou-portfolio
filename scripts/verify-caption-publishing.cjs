const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('C:/Users/luyaoyao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const root = path.resolve(__dirname, '..');
  const previews = path.join(root, '.preview');
  fs.mkdirSync(previews, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(previews, 'caption-publishing-'));
  fs.mkdirSync(path.join(fixture, 'scripts'));
  for (const file of ['content.mjs', 'captions.json', 'scripts/import-captions.mjs', 'scripts/build.mjs']) {
    fs.copyFileSync(path.join(root, file), path.join(fixture, file));
  }
  const { projects } = await import('../content.mjs');
  for (const project of projects) {
    for (const image of project.images) {
      const target = path.join(fixture, 'images', image);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, 'test-only placeholder');
    }
  }
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/index.html');
    await page.evaluate(() => {
      localStorage.setItem('xiaoyou-captions:/minicare-fullscreen.html', JSON.stringify({ 'minicare-0': '旧版本', 'minicare-1': '保留第二张说明' }));
      localStorage.setItem('xiaoyou-captions', JSON.stringify({
        '/minicare-fullscreen.html': { 'minicare-0': '金属 & 光影 <材质> "特写"' },
        '/shaken.html': { 'shaken-8': '井理最后一张', 'shaken-0': '' },
      }));
    });
    await page.goto('http://127.0.0.1:4173/caption-backup.html');
    await page.locator('#export').waitFor();
    await page.waitForFunction(() => !document.querySelector('#export').disabled);
    const downloadEvent = page.waitForEvent('download');
    await page.locator('#export').click();
    const download = await downloadEvent;
    const backupPath = path.join(fixture, 'backup.json');
    await download.saveAs(backupPath);
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    assert.equal(backup.captions.minicare['品牌故事.png'], '金属 & 光影 <材质> "特写"');
    assert.equal(backup.captions.minicare['minicare-continuous.png'], '保留第二张说明');
    assert.equal(backup.captions.shaken['covers/shaken-detail-15.webp'], '井理最后一张');
    assert.equal(backup.captions.shaken['covers/shaken-detail-1.webp'], '');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('xiaoyou-captions'))['/shaken.html']['shaken-8']), '井理最后一张');
    execFileSync(process.execPath, [path.join(fixture, 'scripts/import-captions.mjs'), backupPath]);
    execFileSync(process.execPath, [path.join(fixture, 'scripts/build.mjs')]);
    const html = fs.readFileSync(path.join(fixture, 'minicare-fullscreen.html'), 'utf8');
    assert.ok(html.includes('金属 &amp; 光影 &lt;材质&gt; &quot;特写&quot;'));
    const visitor = await browser.newContext();
    const visitorPage = await visitor.newPage();
    await visitorPage.setContent(html);
    assert.equal(await visitorPage.locator('[data-caption-key="minicare-0"]').innerText(), '金属 & 光影 <材质> "特写"');
    console.log('PASS 多页面旧注释合并、导出保留原记录、导入、文字转义，以及新访客读取发布后的注释。');
    console.log('测试使用隔离文件夹，没有修改真实注释或原浏览器数据。');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
