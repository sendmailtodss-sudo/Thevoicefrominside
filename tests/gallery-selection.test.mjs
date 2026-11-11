import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

test('public gallery contains the selected works and the verified Gjenbruk image', async () => {
  const catalog = JSON.parse(await readFile('public/galleri-3d/catalog.json', 'utf8'));
  assert.deepEqual(catalog.items.map(item => item.id), ['fri-presse', 'gjenbruk', 'book-page-256', 'book-page-22', 'book-page-34', 'lar-bak-murene']);
  const image = catalog.items.find(item => item.id === 'gjenbruk').image;
  assert.equal(createHash('sha256').update(await readFile(`public${image}`)).digest('hex'), '16872400f1db5e2c943824b4540506faf285e00bbc1e056b30cc09573a1b36e9');
  for (const item of catalog.items) await readFile(`public${item.image}`);
});
