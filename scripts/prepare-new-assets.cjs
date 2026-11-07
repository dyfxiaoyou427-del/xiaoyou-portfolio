const sharp = require('C:/Users/luyaoyao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const jobs = [
  ['aocoskin', 'AOCOSKIN视觉', [137, 139, 141, 149, 150, 154, 169]],
  ['crocs', 'CROCS视觉', [105, 121, 15, 16, 17]],
  ['mosiimorii-gift', 'MOSIIMORII十二年之约新年礼盒', [10, 11, 12, 13, 14, 5, 6, 7, 8, 9]],
  ['osm', 'OSM视觉', [125, 130, 131]],
  ['roopy-care', '洗护线', ['量子世界品牌设计部门-洗护线策划设计方案_00', '量子世界品牌设计部门-洗护线策划设计方案_08', '量子世界品牌设计部门-洗护线策划设计方案_10', '量子世界品牌设计部门-洗护线策划设计方案_18', '量子世界品牌设计部门-洗护线策划设计方案_24']],
  ['shaken-detail', '井理鸡尾酒图片', [1, 2, 3, 4, 19, 20, 22, 23]],
];

async function run() {
  const output = path.join(root, 'images', 'covers');
  fs.mkdirSync(output, { recursive: true });
  for (const [prefix, folder, names] of jobs) {
    for (const name of names) {
      const source = path.join(root, 'images', folder, `${name}.${folder === '洗护线' ? 'png' : folder === '井理鸡尾酒图片' ? 'png' : folder === 'MOSIIMORII十二年之约新年礼盒' ? 'jpg' : 'png'}`);
      const token = folder === '洗护线' ? String(name).match(/_(\d+)$/)?.[1] || String(name) : String(name).replaceAll(/[^a-zA-Z0-9_-]+/g, '-');
      const target = path.join(output, `${prefix}-${token}.webp`);
      await sharp(source).resize({ width: 1800, withoutEnlargement: true }).webp({ quality: 88, effort: 6 }).toFile(target);
      console.log(path.relative(root, target));
    }
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
