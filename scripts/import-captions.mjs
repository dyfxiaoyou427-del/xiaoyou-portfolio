import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../content.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) throw new Error('请提供从原浏览器导出的注释备份文件路径。');
const backup = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
const object = value => value && typeof value === 'object' && !Array.isArray(value);
if (backup.version !== 1 || !object(backup.captions)) throw new Error('无效的注释备份。');
const target = path.join(root, 'captions.json');
const saved = JSON.parse(fs.readFileSync(target, 'utf8'));
let count = 0;
for (const [id, entries] of Object.entries(backup.captions)) {
  const project = projects.find(item => item.id === id);
  if (!project || !object(entries)) throw new Error(`无法识别的项目：${id}`);
  for (const [image, text] of Object.entries(entries)) {
    if (!project.images.includes(image) || typeof text !== 'string') throw new Error(`无效的图片注释：${id} / ${image}`);
    saved[id] ||= {};
    saved[id][image] = text;
    count += 1;
  }
}
if (!count) throw new Error('备份中没有可导入的注释，请先核对 browserRecords 中的原始记录。');
fs.writeFileSync(target, JSON.stringify(saved, null, 2) + '\n', 'utf8');
console.log(`已将 ${count} 条注释写入 captions.json。请重新生成页面后发布。`);
