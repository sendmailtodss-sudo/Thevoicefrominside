import test from 'node:test';
import assert from 'node:assert/strict';
import { frameRequest, matchesFrame, FrameCache, PresentationGate } from '../public/assets/journey/frame-runtime.mjs';

test('measured CFR samples own bounded intervals including fractional rates and final frames', () => {
  for (const rate of [24, 25, 30, 30000 / 1001]) {
    const scene = { frameRate: rate, frameCount: 193 }, duration = 193 / rate;
    assert.equal(frameRequest(0, duration, scene).index, 0);
    assert.equal(frameRequest(1, duration, scene).index, 192);
    assert.equal(frameRequest(1, duration, scene).time, 192 / rate);
    assert.equal(frameRequest(.5, duration, scene).index, 96);
    const sample = frameRequest(96.25 / 193, duration, scene);
    assert.ok(sample.seekTime > sample.time && sample.seekTime < sample.time + sample.duration);
    assert.ok(matchesFrame(sample, 96 / rate + 1e-7));
    assert.equal(matchesFrame(sample, 95 / rate), false);
    assert.equal(matchesFrame(sample, 97 / rate), false);
  }
  assert.equal(frameRequest(1, Infinity), null);
  assert.equal(frameRequest(.3, 8).index, null);
  assert.equal(frameRequest(.3, 8).exact, false);
});

test('variable cadence selects the authored timestamp table without inventing a uniform rate', () => {
  const scene = { frameTimes: [0, .04, .07, .13] };
  const target = frameRequest(.7, .2, scene);
  assert.equal(target.index, 2); assert.equal(target.time, .07);
  assert.ok(target.seekTime > .07 && target.seekTime < .13);
  assert.equal(frameRequest(1, .2, scene).time, .13);
  assert.equal(matchesFrame(target, .04), false);
});

test('A to B to A cannot admit a late B, and each readiness permission is consumed once', () => {
  const gate = new PresentationGate();
  const firstA = gate.request('A', { readiness: true });
  const b = gate.request('B', { readiness: true });
  const finalA = gate.request('A', { readiness: true });
  assert.equal(gate.canPresent(b, 'B', false), false);
  assert.equal(gate.canPresent(firstA, 'A', false), false);
  assert.equal(gate.canPresent(finalA, 'A', false), true);
  gate.presented(finalA);
  assert.equal(gate.canPresent(finalA, 'A', false), false);
  assert.equal(gate.canPresent(finalA, 'A', true), true);
  gate.dispose();
  assert.equal(gate.canPresent(finalA, 'A', true), false);
  assert.equal(gate.request('C'), null);
});

test('strict inputs can cache late results without granting a presentation', () => {
  const gate = new PresentationGate(), epoch = gate.request('cold');
  assert.equal(gate.canPresent(epoch, 'cold', false), false);
  assert.equal(gate.canPresent(epoch, 'cold', true), true);
});

test('decoded samples obey a pixel budget and release stale surfaces on eviction and disposal', () => {
  const released = [], sample = id => ({ source: { close: () => released.push(id) }, width: 2, height: 2 });
  const cache = new FrameCache({ maxPixels: 8, maxEntries: 4 });
  cache.set('a', sample('a')); cache.set('b', sample('b'));
  cache.get('a'); cache.set('c', sample('c'));
  assert.equal(cache.get('b'), null);
  assert.deepEqual(released, ['b']);
  assert.equal(cache.pixels, 8);
  cache.set('a', sample('replacement'));
  assert.deepEqual(released, ['b', 'a']);
  cache.clear();
  assert.equal(cache.pixels, 0);
  assert.equal(cache.entries.size, 0);
  assert.deepEqual(new Set(released), new Set(['a', 'b', 'c', 'replacement']));
});
