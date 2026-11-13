import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Rule: an added element may only style and script itself (see AGENTS.md).
test('the landing hero style sheet only targets the hero or hero-gated states', async () => {
  const css = (await readFile('public/assets/journey/hero.css', 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  const withoutKeyframes = css.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const selectors = [...withoutKeyframes.matchAll(/([^{}]+)\{[^{}]*\}/g)].map(match => match[1].trim()).filter(text => text && !text.startsWith('@'));
  assert.ok(selectors.length > 20);
  for (const group of selectors) for (const selector of group.split(',')) {
    assert.match(selector, /sj-hero|data-hero/, `hero.css must not style unrelated parts: ${selector.trim()}`);
  }
});

test('the landing hero script never edits the journey manifest, scenes or scroll position', async () => {
  const source = await readFile('public/assets/journey/hero.js', 'utf8');
  assert.doesNotMatch(source, /manifest\.json|scrollTo\(|\.enabled\s*=|StemmenJourney/);
});
