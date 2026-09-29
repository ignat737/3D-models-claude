// browser.mjs — drive the game in headless Chrome when there is no Browser pane (a cloud
// sandbox, CI, a terminal-only agent): a static no-store server on a free port, Chrome / Edge /
// Chromium with software WebGL2 (SwiftShader, works without a GPU), CDP eval and screenshots.
// Zero dependencies: Node 22+ (built-in fetch and WebSocket).
//
//   node tools/browser.mjs --shot=out.png                 # the game as the player starts it
//   node tools/browser.mjs --eval=probe.js --shot=out.png # run probe.js in the page first
//   node tools/browser.mjs --lint                         # Debug3D.lint(): exit 1 on errors
//   node tools/browser.mjs --page=/_utils/editor/ --size=1600x900 --shot=editor.png
//
// probe.js is the BODY of an async function: `await`, then `return` a JSON-able value — it is
// printed. Exit code 1 on an uncaught page exception, a failed eval or lint errors.
// As a library: const page = await openGame(); await page.eval('return 1'); await page.close().
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import url from 'node:url';
import { spawn } from 'node:child_process';

export const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
export const GAME_READY = 'window.app && app.location && app.location.objects.every(o => o.loaded || o.error)';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.fbx': 'application/octet-stream', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
};

// Static files of root, no-store (like tools/dev-server.mjs: a stale cached script lies).
export function serve(root = ROOT) {
  const base = path.resolve(root);
  const server = http.createServer((req, res) => {
    let rel = '';
    try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { /* 404 below */ }
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(base, '.' + rel);
    const ok = rel && file.startsWith(base + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile();
    if (!ok) {
      res.writeHead(404, { 'Cache-Control': 'no-store' });
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve({
      url: `http://127.0.0.1:${/** @type {any} */ (server.address()).port}`,
      close: () => new Promise((r) => { server.closeAllConnections(); server.close(() => r()); }),
    }));
  });
}

// The browser: $CHROME, else the usual install paths, else PATH. Edge and Chromium speak CDP too.
export function findChrome(env = process.env, platform = process.platform) {
  if (env.CHROME) return env.CHROME;
  const win = [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA].filter(Boolean).flatMap(dir => [
    path.win32.join(dir, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.win32.join(dir, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ]);
  const mac = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'];
  const fixed = platform === 'win32' ? win : platform === 'darwin' ? mac : [];
  const found = fixed.find(p => fs.existsSync(p));
  if (found) return found;
  const names = platform === 'win32' ? ['chrome.exe', 'msedge.exe'] : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge'];
  for (const dir of (env.PATH || '').split(path.delimiter).filter(Boolean)) {
    for (const name of names) if (fs.existsSync(path.join(dir, name))) return path.join(dir, name);
  }
  return null;
}

// One CDP page: send, eval, nav, waitFor, shot; logs — console errors and page exceptions.
class Page {
  constructor(ws) {
    this.ws = ws;
    this.seq = 0;
    this.pending = new Map();
    this.waiters = new Map();
    /** @type {{ type: string, text: string }[]} */
    this.logs = [];
    this.url = '';
    this.close = async () => {};
    ws.onmessage = (e) => {
      const m = JSON.parse(String(e.data));
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) p.reject(new Error(`${p.method}: ${m.error.message}`));
        else p.resolve(m.result);
        return;
      }
      if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
        this.logs.push({ type: m.params.type, text: m.params.args.map(a => a.value ?? a.description ?? '').join(' ') });
      } else if (m.method === 'Runtime.exceptionThrown') {
        const d = m.params.exceptionDetails;
        this.logs.push({ type: 'exception', text: (d.exception && d.exception.description) || d.text });
      }
      for (const resolve of this.waiters.get(m.method) || []) resolve(m.params);
      this.waiters.delete(m.method);
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      this.pending.set(id, { resolve, reject, method });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  once(event) {
    return new Promise((resolve) => {
      if (!this.waiters.has(event)) this.waiters.set(event, []);
      this.waiters.get(event).push(resolve);
    });
  }

  // body — the body of an async function; its return value comes back by value.
  async eval(body) {
    const r = await this.send('Runtime.evaluate', { expression: `(async () => {\n${body}\n})()`, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
    return r.result.value;
  }

  async nav(to) {
    const loaded = this.once('Page.loadEventFired');
    await this.send('Page.navigate', { url: to });
    await loaded;
  }

  async waitFor(expr, timeoutMs = 120000) {
    const end = Date.now() + timeoutMs;
    while (!(await this.eval(`return !!(${expr});`))) {
      if (Date.now() > end) throw new Error(`не дождался за ${timeoutMs / 1000} с: ${expr}`);
      await new Promise(r => setTimeout(r, 250));
    }
  }

  async shot(file) {
    const { data } = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    return file;
  }
}

// Headless browser with one page of width × height CSS px.
export async function launch({ width = 1280, height = 720 } = {}) {
  if (typeof WebSocket === 'undefined') throw new Error('нужен Node 22+ (встроенный WebSocket)');
  const exe = findChrome();
  if (!exe) throw new Error('не найден Chrome, Edge или Chromium: укажи путь в переменной окружения CHROME');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcengine-chrome-'));
  const args = [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${dir}`, `--window-size=${width},${height}`,
    // Software WebGL2. --in-process-gpu matters: in containers the separate GPU process fails
    // ("eglInitialize SwANGLE failed") and getContext('webgl2') returns null.
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--in-process-gpu', '--ignore-gpu-blocklist',
    '--disable-dev-shm-usage', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
    ...(process.platform === 'linux' && process.getuid && process.getuid() === 0 ? ['--no-sandbox'] : []),
    'about:blank',
  ];
  // The real path: Chrome started through an absolute symlink (/usr/local/bin/google-chrome ->
  // …/chrome) crashes with SIGTRAP right after start — it looks for its files next to argv[0].
  const proc = spawn(fs.existsSync(exe) ? fs.realpathSync(exe) : exe, args, { stdio: ['ignore', 'ignore', 'pipe'] });
  const cleanup = async () => {
    if (proc.exitCode === null && proc.signalCode === null) {
      const exited = new Promise(r => proc.once('exit', r));
      proc.kill();
      await exited;
    }
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  };
  try {
    const wsUrl = await new Promise((resolve, reject) => {
      let err = '';
      const timer = setTimeout(() => reject(new Error('Chrome не ответил за 30 с:\n' + err.slice(-2000))), 30000);
      proc.stderr.on('data', (d) => {   // stays attached: a full stderr pipe would stall Chrome
        err = (err + d).slice(-8000);
        const m = err.match(/DevTools listening on (ws:\/\/\S+)/);
        if (m) { clearTimeout(timer); resolve(m[1]); }
      });
      proc.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Chrome завершился (${code}):\n` + err.slice(-2000))); });
      proc.once('error', (e) => { clearTimeout(timer); reject(e); });
    });
    const base = 'http://' + new URL(String(wsUrl)).host;
    // A page of our own: connecting to the startup page before it has finished initialising
    // crashes Chrome (SIGTRAP) with --in-process-gpu.
    const target = await (await fetch(base + '/json/new?about:blank', { method: 'PUT' })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('CDP: нет соединения со страницей Chrome')); });
    const page = new Page(ws);
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    page.close = async () => {
      try { ws.close(); } catch { /* already closed */ }
      await cleanup();
    };
    return page;
  } catch (e) {
    await cleanup();
    throw e;
  }
}

// Server + browser + the page loaded and ready (the game: every location object loaded or failed).
export async function openGame({ page: route = '/', width = 1280, height = 720, ready = '' } = {}) {
  const server = await serve();
  let page = null;
  try {
    page = await launch({ width, height });
    await page.nav(server.url + route);
    if (!(await page.eval("return !!document.createElement('canvas').getContext('webgl2');"))) throw new Error('в браузере нет WebGL2');
    await page.waitFor(ready || (route === '/' ? GAME_READY : "document.readyState === 'complete'"));
  } catch (e) {
    if (page) await page.close();
    await server.close();
    throw e;
  }
  const closePage = page.close;
  page.close = async () => { await closePage(); await server.close(); };
  page.url = server.url;
  return page;
}

// Debug3D.lint() of the page's active view: [{ level, code, target, message }].
export async function lint(page) {
  const r = await page.eval("return typeof Debug3D === 'undefined' ? null : (await Debug3D.lint());");
  if (!r) throw new Error('на странице нет Debug3D');
  return r.findings;
}

if (process.argv[1] && path.resolve(process.argv[1]) === url.fileURLToPath(import.meta.url)) {
  const arg = name => (process.argv.find(a => a.startsWith(`--${name}=`)) || '').slice(name.length + 3);
  const [width, height] = (arg('size') || '1280x720').split('x').map(Number);
  let failed = false;
  const page = await openGame({ page: arg('page') || '/', width, height }).catch((e) => {
    console.error(String(e && e.message || e));
    process.exit(1);
  });
  try {
    if (arg('eval')) console.log(JSON.stringify(await page.eval(fs.readFileSync(arg('eval'), 'utf8')), null, 2));
    if (process.argv.includes('--lint')) {
      const findings = await lint(page);
      for (const f of findings) console.log(`  lint ${f.level}: ${f.code} ${f.target} — ${f.message}`);
      console.log(`lint: ${findings.length ? findings.length + ' замечаний' : 'чисто'}`);
      failed = failed || findings.some(f => f.level === 'error');
    }
    if (arg('shot')) {
      await page.eval("if (typeof Debug3D !== 'undefined' && window.World3D) Debug3D.frames(5);");
      console.log('снимок: ' + await page.shot(path.resolve(arg('shot'))));
    }
  } catch (e) {
    console.error(String(e && e.stack || e));
    failed = true;
  } finally {
    for (const l of page.logs) console.log(`  console ${l.type}: ${l.text}`);
    failed = failed || page.logs.some(l => l.type === 'exception');
    await page.close();
  }
  process.exit(failed ? 1 : 0);
}
