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

test('every diary dropdown uses date and inmate metadata without article titles', async () => {
  let checked = 0;
  for (const file of await htmlFiles('public')) {
    const html = await readFile(file, 'utf8');
    const menu = html.match(/<li class="sfi-section"><a href="\/(?:en\/)?dagbok\/"[^>]*>.*?<\/details><\/li>/)?.[0];
    if (!menu) continue;
    checked++;
    const english = menu.includes('href="/en/dagbok/"');
    const prefix = english ? '/en' : '';
    const inmate = english ? 'Prisoner' : 'Innsatt';
    const unknownDate = english ? 'Date not established' : 'Dato ikke fastslått';
    const entries = [...menu.matchAll(/<li><a href="([^"]+)"><span>([^<]+)<\/span><\/a><\/li>/g)]
      .map(([, href, label]) => [href, label]);
    assert.deepEqual(entries, [
      [`${prefix}/dagbok/fanger-til-gjenbruk/`, `${unknownDate} · ${english ? 'Prisoner number not stated' : 'Innsattnummer ikke oppgitt'}`],
      [`${prefix}/dagbok/lar-bak-murene/`, `${english ? 'Source date' : 'Kildedato'} 11.08.2026 · ${inmate} 260146`],
      [`${prefix}/dagbok/skoleplassen/`, `22.10.2026 · ${inmate} 260146`],
      [`${prefix}/dagbok/nar-dorene-til-kunnskapen-stenges/`, `23.10.2026 · ${inmate} 260146`],
      [`${prefix}/dagbok/fem-minutter-i-skolegangen/`, `04.11.2026 · ${inmate} 250418`],
      [`${prefix}/dagbok/trening/`, `${unknownDate} · ${inmate} 260146`],
      [`${prefix}/dagbok/treningsbeltet/`, `${unknownDate} · ${inmate} 260146`],
      [`${prefix}/boken/normalitetsprinsippet/`, `${unknownDate} · ${inmate} 260146`],
    ], file);
    assert.doesNotMatch(menu, /<small>/, file);
  }
  assert.ok(checked >= 200, 'check the shared navigation throughout both language versions');
});
