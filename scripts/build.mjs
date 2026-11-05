/**
 * Dependency-free development build, derived from the v34 Sites source.
 * Private hosting bindings are intentionally not exported.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const server = path.join(dist, 'server');
const publicRoot = fs.realpathSync(path.join(root, 'public'));
const copiedShared = new Set();
const readText = file => fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
const portable = value => value.split(path.sep).join('/');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(server, { recursive: true });
for (const [source, destination] of [
  ['public', 'client'],
  ['drizzle', 'drizzle'],
]) {
  fs.cpSync(path.join(root, source), path.join(dist, destination), {
    recursive: true,
    dereference: true,
    preserveTimestamps: true,
  });
}

function copyShared(sourcePath) {
  const source = fs.realpathSync(sourcePath);
  const relative = path.relative(publicRoot, source);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error('Shared module must remain inside public/');
  }
  const extension = path.extname(relative);
  const filename = extension ? relative.slice(0, -extension.length) : relative;
  const target = path.join(server, 'shared', `${filename}.js`);
  if (copiedShared.has(source)) return target;
  copiedShared.add(source);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const text = readText(source).replace(/(\bfrom\s*["'])([^"']+)(["'])/g, (match, before, specifier, after) => {
    if (!specifier.startsWith('.')) return match;
    const child = copyShared(path.resolve(path.dirname(source), specifier));
    let next = portable(path.relative(path.dirname(target), child));
    if (!next.startsWith('.')) next = `./${next}`;
    return before + next + after;
  });
  fs.writeFileSync(target, text);
  return target;
}

for (const name of fs.readdirSync(path.join(root, 'worker'))) {
  if (!name.endsWith('.js')) continue;
  // The hosted packager registers Worker modules from the server directory.
  const text = readText(path.join(root, 'worker', name)).replace(
    /(\bfrom\s*["'])\.\.\/public\/([^"']+)(["'])/g,
    (match, before, specifier, after) => {
      const target = copyShared(path.join(publicRoot, specifier));
      return before + './' + portable(path.relative(server, target)) + after;
    },
  );
  fs.writeFileSync(path.join(server, name), text);
}

const config = {
  name: 'stemmen-fra-innsiden',
  main: 'index.js',
  compatibility_date: '2026-10-01',
  assets: {
    directory: '../client',
    binding: 'ASSETS',
    run_worker_first: ['/api/*', '/nedlastinger/*', '/bidrag/*', '/en/bidrag/*'],
  },
  d1_databases: [{
    binding: 'DB',
    database_name: 'stemmen-analytics',
    database_id: '00000000-0000-0000-0000-000000000000',
    migrations_dir: '../drizzle',
  }],
  r2_buckets: [{ binding: 'BUCKET', bucket_name: 'stemmen-community' }],
};
fs.writeFileSync(path.join(server, 'wrangler.json'), JSON.stringify(config, null, 2) + '\n');

function countFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).reduce(
    (count, entry) => count + (entry.isDirectory() ? countFiles(path.join(directory, entry.name)) : entry.isFile() ? 1 : 0),
    0,
  );
}
console.log(JSON.stringify({ files: countFiles(dist), entrypoint: 'server/index.js' }));
