import { spawn } from 'node:child_process';

const url = `http://127.0.0.1:${process.env.PORT || 4173}`;
function openBrowser() {
  const command = process.platform === 'win32' ? 'cmd.exe' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, { windowsHide: true, stdio: 'ignore', detached: true });
  child.on('error', () => console.log(`请在浏览器打开 ${url}`));
  child.unref();
}

let alreadyRunning = false;
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
  alreadyRunning = response.ok && (await response.text()).includes('XIAOYOU');
} catch { /* Start the preview when there is no existing server. */ }
if (alreadyRunning) {
  console.log(`预览已在运行：${url}`);
  openBrowser();
} else {
  const { default: server } = await import('../server.mjs');
  server.on('listening', openBrowser);
}
