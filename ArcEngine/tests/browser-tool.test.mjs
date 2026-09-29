// tools/browser.mjs without a browser: the static server (no-store, MIME, nothing outside the
// root) and the browser lookup. The headless run itself is checked by hand (skill headless).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { findChrome, serve } from '../tools/browser.mjs';

const temps = [];
after(() => { for (const dir of temps) fs.rmSync(dir, { recursive: true, force: true }); });

test('сервер: файлы проекта с no-store и MIME, за пределы корня не выходит', async () => {
  const server = await serve();
  try {
    const index = await fetch(server.url + '/');
    assert.equal(index.status, 200);
    assert.equal(index.headers.get('cache-control'), 'no-store');
    assert.match(index.headers.get('content-type'), /text\/html/);
    await index.arrayBuffer();
    const glb = await fetch(server.url + '/3D-models/swordsman.glb');
    assert.equal(glb.headers.get('content-type'), 'model/gltf-binary');
    assert.equal(Buffer.from(await glb.arrayBuffer()).toString('latin1', 0, 4), 'glTF');
    for (const bad of ['/nope.js', '/..%2f..%2fetc%2fpasswd', '/js']) {
      const r = await fetch(server.url + bad);
      assert.equal(r.status, 404, bad);
      await r.arrayBuffer();
    }
  } finally {
    await server.close();
  }
});

test('поиск браузера: CHROME важнее всего, потом PATH, иначе null', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'arcengine-find-'));
  temps.push(dir);
  const name = process.platform === 'win32' ? 'chrome.exe' : 'chromium';
  fs.writeFileSync(path.join(dir, name), '');
  assert.equal(findChrome({ CHROME: '/x/chrome', PATH: dir }), '/x/chrome');
  assert.equal(findChrome({ PATH: dir }, process.platform === 'win32' ? 'win32' : 'linux'), path.join(dir, name));
  assert.equal(findChrome({ PATH: '' }, 'linux'), null);
});
