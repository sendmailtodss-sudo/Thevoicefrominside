/**
 * Opt-in head-only metadata follow-up. This is never invoked by the build.
 * Use a separate output directory; the input distribution stays untouched.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const routes = [
  '/', '/en/', '/kunstfellesskap/', '/en/creative-community/',
  '/galleri-3d/', '/en/galleri-3d/', '/dagbok/', '/en/dagbok/',
  '/boken/', '/en/boken/',
  '/boken/normalitetsprinsippet/', '/en/boken/normalitetsprinsippet/',
  ...['2026-11-07-gi-joe', '2026-11-09-vi-krever-svar', '2026-11-11-o-dog']
    .flatMap(slug => [`/dagbok/${slug}/`, `/en/dagbok/${slug}/`]),
];

function decode(value) {
  const named = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0' };
  return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (match, entity) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? match;
    const hex = entity[1].toLowerCase() === 'x';
    return String.fromCodePoint(Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10));
  });
}
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
function attributes(tag) {
  const values = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    values[match[1].toLowerCase()] = decode(match[2] ?? match[3]);
  }
  return values;
}

export function normalizeMetadata(source, route) {
  const match = /(<head\b[^>]*>)([\s\S]*?)(<\/head\s*>)/i.exec(source);
  if (!match) throw new Error(`${route}: expected a complete head`);
  const prefix = source.slice(0, match.index + match[1].length);
  const suffix = source.slice(match.index + match[1].length + match[2].length);
  let head = match[2];
  const changes = [];
  function metadata(key) {
    const found = [...head.matchAll(/<meta\b[^>]*>/gi)].filter(item => {
      const attrs = attributes(item[0]);
      return (attrs.name ?? attrs.property)?.toLowerCase() === key;
    });
    if (found.length > 1) throw new Error(`${route}: conflicting duplicate ${key}; review manually`);
    return found.length ? { tag: found[0][0], attrs: attributes(found[0][0]) } : null;
  }
  function set(key, value) {
    if (!value) return;
    const current = metadata(key);
    if (current?.attrs.content === value) return;
    const attribute = key.startsWith('og:') ? 'property' : 'name';
    const next = `<meta ${attribute}="${key}" content="${escape(value)}">`;
    head = current ? head.replace(current.tag, next) : head + '\n' + next + '\n';
    changes.push(key);
  }
  if (route === '/' || route === '/en/') {
    const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi)];
    if (titles.length !== 1) throw new Error(`${route}: expected one existing title`);
    const title = decode(titles[0][1].trim());
    const description = metadata('description')?.attrs.content;
    if (!description) throw new Error(`${route}: existing homepage description is required`);
    set('og:title', title);
    set('twitter:title', title);
    set('og:description', description);
    set('twitter:description', description);
    set('og:type', 'website');
  } else if (!metadata('description')) {
    const existing = metadata('og:description')?.attrs.content;
    if (existing) set('description', existing);
  }
  return { html: prefix + head + suffix, changes };
}

function main(args) {
  const value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : null;
  const inputArgument = value('--input-root');
  const outputArgument = value('--output-root');
  const write = args.includes('--write');
  if (!inputArgument || (write && !outputArgument)) {
    throw new Error('Usage: node scripts/normalize-page-metadata.mjs --input-root DIR [--output-root SEPARATE_DIR --write]');
  }
  const input = fs.realpathSync(inputArgument);
  const output = outputArgument ? path.resolve(outputArgument) : null;
  if (write) {
    fs.mkdirSync(output, { recursive: true });
    const actualOutput = fs.realpathSync(output);
    if (actualOutput === input || actualOutput.startsWith(input + path.sep) || input.startsWith(actualOutput + path.sep)) {
      throw new Error('Output must be separate from the input tree');
    }
  }
  // Compute and validate the complete plan before writing any HTML.
  const plan = routes.flatMap(route => {
    const relative = path.join(route.slice(1), 'index.html');
    const file = path.join(input, relative);
    if (!fs.existsSync(file)) return [{ route, relative, skipped: 'not present in this distribution' }];
    if (!fs.realpathSync(file).startsWith(input + path.sep)) throw new Error('Input symlink escapes its root');
    const result = normalizeMetadata(fs.readFileSync(file, 'utf8'), route);
    return [{ route, relative, ...result }];
  });
  if (write) for (const item of plan) {
    if (!item.changes?.length) continue;
    const destination = path.join(output, item.relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    // Refuse to follow an existing output symlink outside the output tree.
    if (!fs.realpathSync(path.dirname(destination)).startsWith(fs.realpathSync(output) + path.sep) && path.dirname(destination) !== output) {
      throw new Error('Output symlink escapes its root');
    }
    if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) throw new Error('Output HTML must not be a symlink');
    fs.writeFileSync(destination, item.html, { flag: 'wx' });
  }
  console.log(JSON.stringify({ mode: write ? 'separate-output-only' : 'dry-run', pages: plan.map(({ html, ...item }) => item) }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main(process.argv.slice(2));
