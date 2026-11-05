import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skip = new Set(['.git', 'node_modules', 'dist']);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (skip.has(entry.name)) return [];
    const file = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Unexpected source symlink: ${file}`);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const failures = [];
let scripts = 0;
for (const file of walk(root)) {
  const relative = path.relative(root, file);
  const text = fs.readFileSync(file, 'utf8');
  if (/\.(?:pdf|docx|zip|sqlite|db|pem|key)$/i.test(file) || /(?:^|[/\\])(?:\.env(?:\..*)?|\.openai)(?:[/\\]|$)/.test(relative)) {
    failures.push(`${relative}: restricted file type or configuration`);
  }
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text) || /(?:ghp_|github_pat_)[A-Za-z0-9_]{25,}/.test(text)) {
    failures.push(`${relative}: possible credential`);
  }
  if (/\.(?:js|mjs|cjs)$/.test(file)) {
    scripts++;
    const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (checked.status !== 0) failures.push(`${relative}: ${checked.stderr}`);
    for (const match of text.matchAll(/(?:from\s*|import\s*|require\s*\()\s*["'](\.[^"']+)["']/g)) {
      if (!fs.existsSync(path.resolve(path.dirname(file), match[1]))) failures.push(`${relative}: missing import ${match[1]}`);
    }
  }
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Source check passed: ${scripts} JavaScript files parse; local imports resolve; export file checks passed.`);
