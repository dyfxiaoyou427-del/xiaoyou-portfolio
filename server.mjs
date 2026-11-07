import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let segments;
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    segments = pathname.replaceAll('\\', '/').split('/').filter(Boolean);
    if (segments.some(segment => segment.startsWith('.'))) throw new Error('Private path');
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }
  const target = path.resolve(root, ...(segments.length ? segments : ['index.html']));
  if (!target.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  fs.stat(target, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('没有找到这个文件。');
      return;
    }
    const headers = {
      'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream',
      'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff',
    };
    let start = 0;
    let end = stat.size - 1;
    let status = 200;
    if (request.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (!match || (!match[1] && !match[2])) {
        response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end();
        return;
      }
      if (!match[1]) start = Math.max(0, stat.size - Number(match[2]));
      else {
        start = Number(match[1]);
        if (match[2]) end = Math.min(end, Number(match[2]));
      }
      if (start > end || start >= stat.size) {
        response.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end();
        return;
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length'] = stat.size === 0 ? 0 : end - start + 1;
    response.writeHead(status, headers);
    if (request.method === 'HEAD' || stat.size === 0) return response.end();
    const stream = fs.createReadStream(target, { start, end });
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  });
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `端口 ${port} 已占用，可设置 PORT 后重新启动。` : error);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`XIAOYOU → http://127.0.0.1:${port}`));
export default server;
