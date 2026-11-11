import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPublicEntrances, entranceSection, stylesheet } from '../scripts/apply-public-entrances.mjs';

test('entrance patch preserves the exact existing page and is idempotent', () => {
  const original = '<!doctype html><html><head><title>Existing title &amp; text</title></head><body><nav>Existing navigation</nav><main><!-- minds-landing-start --><section data-journey>Unchanged journey</section><p>Original voice: æøå, criticism and metaphor.</p></main></body></html>';
  for (const language of ['no', 'en']) {
    const result = applyPublicEntrances(original, language);
    assert.equal(result.replace(stylesheet, '').replace(entranceSection(language), ''), original);
    assert.equal(applyPublicEntrances(result, language), result);
    assert.equal(result.match(/data-journey/g).length, 1);
  }
});

test('unrecognized or conflicting page anchors require review', () => {
  assert.throws(() => applyPublicEntrances('<head></head><main></main>', 'no'));
  assert.throws(() => applyPublicEntrances('<head></head><!-- minds-landing-start --><!-- minds-landing-start -->', 'no'));
  assert.throws(() => applyPublicEntrances('<head></head><!-- public-entrances-start --><!-- minds-landing-start -->', 'no'));
});

test('public entrance destinations do not expose the private forum or application', () => {
  for (const language of ['no', 'en']) {
    const section = entranceSection(language);
    const prefix = language === 'en' ? '/en' : '';
    assert.ok(section.includes(`href="${language === 'en' ? '/en/creative-community/' : '/kunstfellesskap/'}"`));
    for (const route of ['/dagbok/', '/boken/', '/juridisk-motvekt/']) assert.ok(section.includes(`href="${prefix}${route}"`));
    assert.doesNotMatch(section, /(?:for-oss-alle-preview|preview\/portal|\/api\/|<form|<input|KYC|ID-kontroll|identity review)/i);
    assert.match(section, language === 'en' ? /forum and mentorship idea are still in development/ : /Forumet og fadderordningen er foreløpig ideer under utvikling/);
  }
});
