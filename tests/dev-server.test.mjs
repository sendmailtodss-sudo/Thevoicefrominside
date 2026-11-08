import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { once } from 'node:events';
import { createDevServer } from '../scripts/dev.mjs';

test('developer preview serves local assets and keeps external services closed', async t => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-preview-'));
  const publicDir = path.join(temp, 'public');
  await fs.mkdir(path.join(publicDir, 'dev-assets'), { recursive: true });
  await fs.mkdir(path.join(publicDir, 'gallery'));
  await fs.writeFile(path.join(publicDir, 'index.html'), '<!doctype html><h1>Preview</h1>');
  await fs.writeFile(path.join(publicDir, 'gallery', 'index.html'), '<h1>Gallery</h1>');
  await fs.writeFile(path.join(publicDir, 'app.mjs'), 'export const demo = true;');
  await fs.writeFile(path.join(publicDir, 'film.mp4'), '0123456789');
  await fs.writeFile(path.join(publicDir, 'dev-assets', 'example-art.svg'), '<svg xmlns="http://www.w3.org/2000/svg"><text>Example artwork</text></svg>');
  await fs.writeFile(path.join(publicDir, '.env'), 'private fixture');
  await fs.writeFile(path.join(temp, 'outside.txt'), 'outside fixture');
  await fs.symlink(path.join(temp, 'outside.txt'), path.join(publicDir, 'escape.txt'));
  await fs.symlink(temp, path.join(publicDir, 'escape-dir'));
  await fs.symlink(path.join(publicDir, '.env'), path.join(publicDir, 'hidden-alias.txt'));
  const server = createDevServer({ publicDir });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await fs.rm(temp, { recursive: true, force: true }); });
  const port = server.address().port;
  const request = (target, method = 'GET') => new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: target, method }, res => {
      let body = '';
      res.setEncoding('utf8'); res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject); req.end();
  });
  await t.test('HTML, directory indexes, MIME types and HEAD are usable', async () => {
    const root = await request('/');
    assert.equal(root.status, 200); assert.match(root.body, /Preview/);
    assert.equal(root.headers['cache-control'], 'no-store');
    assert.match(root.headers['x-robots-tag'], /noindex/);
    assert.match(root.headers['content-security-policy'], /connect-src 'self'/);
    assert.match((await request('/gallery/')).body, /Gallery/);
    assert.match((await request('/app.mjs')).headers['content-type'], /text\/javascript/);
    const head = await request('/', 'HEAD');
    assert.equal(head.status, 200); assert.equal(head.body, ''); assert.equal(head.headers['content-length'], root.headers['content-length']);
  });
  await t.test('all API methods return a clear disabled response', async () => {
    for (const method of ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS']) {
      const result = await request('/api/contributions?example=1', method);
      assert.equal(result.status, 503); assert.equal(JSON.parse(result.body).error, 'development-disabled');
    }
    assert.equal((await request('/api')).status, 503);
    assert.equal((await request('/%61pi/payments', 'POST')).status, 503);
  });
  await t.test('public film supports seeking while retaining preview safeguards', async () => {
    const url = `http://127.0.0.1:${port}/film.mp4`;
    const part = await fetch(url, { headers: { Range: 'bytes=2-4' } });
    assert.equal(part.status, 206);
    assert.equal(part.headers.get('content-range'), 'bytes 2-4/10');
    assert.equal(part.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');
    assert.equal(await part.text(), '234');
    assert.equal((await fetch(url, { headers: { Range: 'bytes=12-13' } })).status, 416);
    const head = await fetch(url, { method: 'HEAD', headers: { Range: 'bytes=0-2' } });
    assert.equal(head.status, 206); assert.equal(head.headers.get('content-length'), '3');
  });
  await t.test('non-API writes are rejected', async () => {
    const result = await request('/gallery/', 'POST');
    assert.equal(result.status, 405); assert.equal(result.headers.allow, 'GET, HEAD');
  });
  await t.test('missing art uses labeled SVG; absent documents remain missing', async () => {
    const image = await request('/assets/omitted-image.webp');
    assert.equal(image.status, 200); assert.equal(image.headers['content-type'], 'image/svg+xml');
    assert.equal(image.headers['x-preview-asset'], 'example-art'); assert.match(image.body, /Example artwork/);
    assert.equal((await request('/missing.pdf')).status, 404);
    assert.equal((await request('/missing.js')).status, 404);
  });
  await t.test('traversal, dotfiles, encoded paths and escaping symlinks are denied', async () => {
    for (const target of ['/../outside.txt', '/%2e%2e/outside.txt', '/.env', '/%2eenv', '/a/..%2foutside.txt', '/a%5c..%5coutside.txt', '/escape.txt', '/escape-dir/outside.txt', '/hidden-alias.txt']) {
      const result = await request(target);
      assert.equal(result.status, 403, target); assert.doesNotMatch(result.body, /outside fixture|private fixture/);
    }
    assert.equal((await request('/%ZZ')).status, 400);
    assert.equal((await request('/%00')).status, 400);
  });
});

test('private preview video is opt-in and supports byte seeking', async t => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'voice-video-'));
  const video = path.join(temp, 'private.mp4');
  await fs.writeFile(video, '0123456789');
  const server = createDevServer({ privateVideo: video });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => { await new Promise(resolve => server.close(resolve)); await fs.rm(temp, { recursive: true, force: true }); });
  const url = `http://127.0.0.1:${server.address().port}/__private-preview/opening.mp4`;
  const partial = await fetch(url, { headers: { Range: 'bytes=2-4' } });
  assert.equal(partial.status, 206);
  assert.equal(partial.headers.get('content-range'), 'bytes 2-4/10');
  assert.equal(await partial.text(), '234');
  assert.equal((await fetch(url, { headers: { Range: 'bytes=12-13' } })).status, 416);
  assert.equal((await fetch(url, { method: 'POST' })).status, 405);
});

test('private scene directory serves only its own configured files', async t => {
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'voice-scenes-'));
 const scenes=path.join(temp,'scenes'); await fs.mkdir(scenes);
 await fs.writeFile(path.join(scenes,'galaxy.mp4'),'scene data');
 await fs.writeFile(path.join(temp,'secret.mp4'),'outside data');
 await fs.symlink(path.join(temp,'secret.mp4'),path.join(scenes,'escape.mp4'));
 const server=createDevServer({privateMediaDir:scenes});server.listen(0,'127.0.0.1');await once(server,'listening');
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));await fs.rm(temp,{recursive:true,force:true})});
 const base=`http://127.0.0.1:${server.address().port}/__private-preview/scenes/`;
 assert.equal(await (await fetch(base+'galaxy.mp4')).text(),'scene data');
 assert.equal((await fetch(base+'missing.mp4')).status,404);
 assert.equal((await fetch(base+'escape.mp4')).status,403);
 const part=await fetch(base+'galaxy.mp4',{headers:{Range:'bytes=0-4'}});
 assert.equal(part.status,206);assert.equal(await part.text(),'scene');
});
