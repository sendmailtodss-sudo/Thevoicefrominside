import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public');
const read = file => readFile(path.join(root, file), 'utf8');

test('published journey assets are local and available to the contributor preview', async () => {
  const manifest = JSON.parse(await read('assets/journey/manifest.json'));
  const scenes = manifest.scenes.filter(scene => scene.enabled);
  assert.ok(scenes.length >= 15);
  assert.equal(new Set(scenes.map(scene => scene.id)).size, scenes.length);
  assert.deepEqual(scenes.slice(0, 6).map(scene => scene.id), ['galaxy', 'brains', 'impulses', 'vortex', 'supernova', 'dna']);
  for (const scene of scenes) {
    for (const file of [scene.video, scene.poster]) {
      assert.match(file, /^\/assets\/journey\/[a-z0-9-]+\.(mp4|webp)$/);
      assert.ok((await stat(path.join(root, file))).size > 0, `${scene.id} is available`);
    }
    for (const art of scene.artworks || []) {
      assert.match(art.src, /^\/design-assets\//);
      assert.ok((await stat(path.join(root, art.src))).size > 0, `${art.id} is available`);
    }
  }
  for (const route of ['index.html', 'en/index.html']) {
    const html = await read(route);
    assert.match(html, /data-journey/);
    assert.match(html, /\/assets\/journey\/journey\.js/);
    assert.doesNotMatch(html, /\/__private-preview\//);
    assert.match(html, /noindex,nofollow/);
  }
});
