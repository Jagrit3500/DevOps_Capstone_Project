// Capture a page in headless Chrome using the DevTools Protocol.
// Usage: node scripts/capture-page.mjs URL OUTPUT.png [width] [height]
// Set CAPTURE_AUTHORIZATION for a private page; the value is never logged.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const [url, outputName, widthArg = '1440', heightArg = '1000'] = process.argv.slice(2);
if (!url || !outputName) {
  console.error('Usage: node scripts/capture-page.mjs URL OUTPUT.png [width] [height]');
  process.exit(2);
}

const width = Number(widthArg);
const height = Number(heightArg);
if (!Number.isInteger(width) || !Number.isInteger(height) || width < 320 || height < 320) {
  throw new Error('Width and height must be integers of at least 320 pixels');
}

const output = resolve(outputName);
const chromePath = process.env.CHROME_PATH ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profile = mkdtempSync(join(tmpdir(), 'hireflow-capture-'));
const browser = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
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
  const send = (method, params = {}) => new Promise((accept, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve: accept, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });

  await send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false,
  });
  await send('Network.enable');
  if (process.env.CAPTURE_AUTHORIZATION) {
    await send('Network.setExtraHTTPHeaders', {
      headers: { Authorization: process.env.CAPTURE_AUTHORIZATION },
    });
  }
  await send('Page.enable');
  await send('Page.navigate', { url });

  const expectedText = process.env.CAPTURE_EXPECT_TEXT;
  for (let attempt = 0; attempt < 20; attempt++) {
    await delay(1000);
    const check = await send('Runtime.evaluate', {
      expression: 'document.body?.innerText ?? ""', returnByValue: true,
    });
    if (!expectedText || check.result.value?.includes(expectedText)) break;
    if (attempt === 19) throw new Error(`Page did not display expected text: ${expectedText}`);
  }

  const settleMs = Number(process.env.CAPTURE_SETTLE_MS ?? '3000');
  if (Number.isFinite(settleMs) && settleMs > 0) await delay(Math.min(settleMs, 30000));

  const screenshot = await send('Page.captureScreenshot', {
    format: 'png', captureBeyondViewport: false,
  });
  writeFileSync(output, Buffer.from(screenshot.data, 'base64'));
  console.log(`Captured ${output}`);
} finally {
  socket?.close();
  browser.kill();
}
