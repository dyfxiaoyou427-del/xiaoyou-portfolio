import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = fs.readdirSync(root).filter(name => name.endsWith('.html'));
const missing = [];
let references = 0;
for (const name of pages) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
  const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicateIds.length) throw new Error(`${name}: duplicate IDs ${duplicateIds.join(', ')}`);
  for (const match of html.matchAll(/\s(?:src|href|poster|data-video-source|data-media-src|data-media-poster)="([^"]+)"/g)) {
    const value = match[1];
    if (/^(?:#|https?:|mailto:|data:)/.test(value)) continue;
    references++;
    const file = decodeURIComponent(value.split(/[?#]/)[0]);
    if (!fs.existsSync(path.resolve(root, file))) missing.push(`${name} → ${file}`);
  }
  if (!html.includes('lang="zh-CN"')) throw new Error(`${name}: missing language`);
}
if (missing.length) throw new Error(missing.join('\n'));
console.log(`已检查 ${pages.length} 个页面、${references} 个本地资源引用，无缺失文件或重复 ID。`);
