const { chromium } = require('C:/Users/luyaoyao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('C:/Users/luyaoyao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const videos = [
  ['minicare', 'Minicare动态成片.mp4', 6],
  ['roopy-film', '新护手霜配乐最终.mp4', 5],
  ['ecoobix', '12.11配乐1.mp4', 8],
  ['zespri', '佳沛.mp4', 5],
  ['milk', '三只小牛.mp4', 6],
  ['shaken', '井理.m4v', 7],
  ['shaken-ai', '最终配音剪辑 -.m4v', 8],
  ['mosiimorii', '实验.mp4', 5],
  ['lab-creative', '3月18日.m4v', 4],
  ['lab-dynamics', '1月11日.mp4', 4],
  ['lab-ingredients', '成分1.mp4', 4],
  ['tomford', 'TOMFORD视觉/TF口红动态测试.mp4', 3],
];

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
  fs.mkdirSync(path.join(root, 'images/covers'), { recursive: true });
  fs.mkdirSync(path.join(root, '.preview/video-frames'), { recursive: true });
  await page.goto('http://127.0.0.1:4173/');
  const results = [];
  for (const [id, source, seconds] of videos) {
    const result = await page.evaluate(async ({ source, seconds }) => {
      document.body.innerHTML = '';
      document.body.style.cssText = 'margin:0;background:#000;';
      const video = document.createElement('video');
      video.style.cssText = 'display:block;width:100vw;height:100vh;object-fit:contain';
      video.muted = true;
      video.playsInline = true;
      document.body.append(video);
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Video timed out')), 25000));
      const frame = new Promise(async (resolve, reject) => {
        video.addEventListener('error', () => reject(new Error('Cannot decode ' + source)), { once: true });
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = Math.min(seconds, video.duration * 0.3);
        }, { once: true });
        video.addEventListener('seeked', () => {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth, 1400);
          canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve({ duration: video.duration, width: video.videoWidth, height: video.videoHeight, frame: canvas.toDataURL('image/jpeg', 0.94) });
        }, { once: true });
        video.src = '/images/' + source.split('/').map(encodeURIComponent).join('/');
      });
      return Promise.race([frame, timeout]);
    }, { source, seconds }).catch(error => ({ error: error.message }));
    if (result.frame) {
      const buffer = Buffer.from(result.frame.split(',')[1], 'base64');
      await sharp(buffer).webp({ quality: 88 }).toFile(path.join(root, 'images/covers', id + '.webp'));
      const frames = [];
      for (const ratio of [0.12, 0.3, 0.5, 0.7]) {
        const data = await page.evaluate(async time => {
          const video = document.querySelector('video');
          await new Promise(resolve => { video.addEventListener('seeked', resolve, { once: true }); video.currentTime = time; });
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(1400, video.videoWidth);
          canvas.height = Math.round(canvas.width * video.videoHeight / video.videoWidth);
          canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        }, result.duration * ratio);
        frames.push(data);
      }
      for (let i = 0; i < frames.length; i++) {
        fs.writeFileSync(path.join(root, '.preview/video-frames', `${id}-${i}.jpg`), Buffer.from(frames[i], 'base64'));
        await sharp(Buffer.from(frames[i], 'base64')).webp({ quality: 86 }).toFile(path.join(root, 'images/covers', `${id}-frame-${i + 1}.webp`));
      }
      delete result.frame;
    }
    results.push({ id, source, ...result });
    console.log(JSON.stringify(results.at(-1)));
  }
  fs.writeFileSync(path.join(root, '.preview/video-info.json'), JSON.stringify(results, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exitCode = 1; });
