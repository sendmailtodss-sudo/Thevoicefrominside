import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

async function htmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : file.endsWith('.html') ? [file] : [];
  }));
  return nested.flat();
}

test('diary menus contain only dated identities and stay within the editorial direction', async () => {
  let checked = 0;
  for (const file of await htmlFiles('public')) {
    const html = await readFile(file, 'utf8');
    const menu = html.match(/<details data-diary-menu>.*?<\/details>/s)?.[0];
    if (!html.includes('data-site-direction="story"')) {
      assert.equal(menu, undefined, `${file}: diary menu belongs only to the editorial direction`);
      continue;
    }
    assert.ok(menu, `${file}: editorial diary menu is reachable`);
    checked++;
    const entries = [...menu.matchAll(/<li><a data-diary-entry href="([^"]+)">([^<]+)<\/a><\/li>/g)]
      .map(([, href, label]) => [href, label]);
    assert.ok(entries.length >= 4, `${file}: all verified dated contributor examples remain available`);
    assert.equal(new Set(entries.map(([href]) => href)).size, entries.length, `${file}: no duplicated destinations`);
    for (const [href, label] of entries) {
      assert.match(href, /^\/(?:en\/)?dagbok\/[^?#]+\/$/, file);
      assert.match(label, /^\d{2}\.\d{2}\.\d{4} · Innsatt \d{4}-?\d{2}$/, `${file}: title or undated placeholder in menu`);
      await readFile(path.join('public', href, 'index.html'));
    }
    assert.ok(entries.some(([, label]) => label.endsWith('250418')), `${file}: retain the other contributor's identity`);
    assert.doesNotMatch(menu, /<small>/, file);
  }
  assert.ok(checked >= 30, 'check editorial navigation throughout both language versions');
});
