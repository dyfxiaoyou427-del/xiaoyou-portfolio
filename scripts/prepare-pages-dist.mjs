import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'site-dist');
const htmlFiles = fs.readdirSync(root).filter(name => name.endsWith('.html'));
const assets = new Set(['styles.css', 'script.js', 'favicon.svg', '.nojekyll']);

for (const name of htmlFiles) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  assets.add(name);
  for (const match of html.matchAll(/\s(?:src|href|poster|data-video-source|data-media-src|data-media-poster)="([^"]+)"/g)) {
    const value = decodeURIComponent(match[1].split(/[?#]/)[0]);
    if (!value || /^(?:#|https?:|mailto:|data:)/.test(value)) continue;
    assets.add(value.replace(/^\.\//, ''));
  }
}

fs.rmSync(output, { recursive: true, force: true });
for (const relative of assets) {
  const source = path.resolve(root, relative);
  if (!source.startsWith(root + path.sep) || !fs.existsSync(source)) continue;
  const target = path.join(output, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

console.log(`已准备 ${assets.size} 个发布文件。`);
