// Capture a genuine mobile viewport using Chrome DevTools Protocol.
// Usage: node scripts/capture-mobile.mjs [url] [output.png]
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const url = process.argv[2] ?? 'http://localhost:3000';
const output = resolve(process.argv[3] ?? 'evidence/mobile-app.png');
const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = mkdtempSync(join(tmpdir(), 'hireflow-mobile-'));
const browser = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });

let socket;
try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let attempt = 0; !existsSync(portFile); attempt++) {
    if (attempt === 100) throw new Error('Chrome did not open its debugging port');
    await delay(100);
  }
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const tabResponse = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!tabResponse.ok) throw new Error(`Chrome tab creation failed: ${tabResponse.status}`);
  const tab = await tabResponse.json();
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((accept, reject) => {
    socket.addEventListener('open', accept, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const response = JSON.parse(data);
    if (!response.id) return;
    const request = pending.get(response.id);
    if (!request) return;
    pending.delete(response.id);
    if (response.error) request.reject(new Error(response.error.message));
    else request.resolve(response.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  });
  await send('Page.enable');
  await send('Page.navigate', { url });
  await delay(4000);
  const check = await send('Runtime.evaluate', {
    expression: 'JSON.stringify({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth })',
    returnByValue: true,
  });
  const dimensions = JSON.parse(check.result.value);
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(output, Buffer.from(screenshot.data, 'base64'));
  console.log(JSON.stringify({ ...dimensions, output }));
  if (dimensions.documentWidth > dimensions.viewport) process.exitCode = 1;
} finally {
  socket?.close();
  browser.kill();
}
