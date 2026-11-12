import test from 'node:test';
import assert from 'node:assert/strict';
import { transition, progressAt, coverRect, mediaTime, networkProgress, thoughtStates } from '../public/assets/journey/timeline.mjs';

const scenes = [{ id: 'origin', type: 'point', scrollWeight: .3 }, { id: 'one', video: '/one.mp4' }, { id: 'two', video: '/two.mp4', scrollWeight: 1.4 }, { id: 'three', video: '/three.mp4' }, { id: 'art', type: 'art' }];
const near = (a, b, message) => assert.ok(Math.abs(a - b) < 1e-8, `${message}: ${a} vs ${b}`);
const visible = state => [state.left, state.right].filter(layer => layer && layer.opacity > 1e-8);

test('both clips and their opacity are continuous at the logical scene boundary', () => {
  const boundary = progressAt(2, 0, scenes);
  const before = transition(boundary - 1e-11, scenes), after = transition(boundary + 1e-11, scenes);
  assert.equal(before.index, 1); assert.equal(after.index, 2);
  assert.equal(before.left.index, after.left.index); assert.equal(before.right.index, after.right.index);
  near(before.left.fraction, after.left.fraction, 'outgoing frame');
  near(before.right.fraction, after.right.fraction, 'incoming frame');
  near(before.mix, after.mix, 'opacity'); near(transition(boundary, scenes).mix, .5, 'midpoint');
});

test('the same input gives the same two frames after forward, reverse and skipped scenes', () => {
  const p = progressAt(2, .04, scenes), expected = transition(p, scenes);
  for (const previous of [0, .99, .5, .05, p]) {
    transition(previous, scenes);
    assert.deepEqual(transition(p, scenes), expected);
  }
  assert.deepEqual(transition(p, scenes), transition(p, scenes));
});

test('blending has no dark alpha gap and each participating clip only moves forwards', () => {
  const boundary = progressAt(2, 0, scenes), total = 4.7, half = .14 / total;
  let previous;
  for (let i = 0; i <= 100; i++) {
    const state = transition(boundary - half + 2 * half * i / 100, scenes);
    const layers = [state.left, state.right].filter(Boolean);
    near(layers.reduce((sum, item) => sum + item.opacity, 0), 1, 'opaque frame coverage');
    if (state.right && previous?.right) {
      assert.ok(state.left.fraction >= previous.left.fraction - 1e-10);
      assert.ok(state.right.fraction >= previous.right.fraction - 1e-10);
      assert.ok(state.mix >= previous.mix - 1e-10);
    }
    previous = state;
  }
});

test('origin and accessible artwork stops are not blended into premature video', () => {
  for (const [index, fraction] of [[0, .99], [1, .001], [3, .999], [4, .001]]) {
    const state = transition(progressAt(index, fraction, scenes), scenes);
    assert.equal(state.right, null); assert.equal(state.left.index, index);
  }
  assert.equal(transition(.5, [], {}).left, null);
});

test('quiet or zero-span transitions select exactly one deterministic frame', () => {
  const p = progressAt(2, 0, scenes);
  for (const options of [{ enabled: false }, { span: 0 }]) {
    const state = transition(p, scenes, options);
    assert.equal(state.right, null); assert.equal(state.left.opacity, 1); assert.equal(state.left.index, 2);
  }
  for (const p of [-10, NaN, Infinity]) assert.equal(transition(p, scenes).index, 0);
  assert.equal(transition(10, scenes).index, scenes.length - 1);
});

test('blend endpoints meet the ordinary timeline without jumping a clip frame', () => {
  const total = 4.7, boundary = progressAt(2, 0, scenes), half = .14 / total;
  for (const p of [boundary - half, boundary + half]) {
    const a = visible(transition(p - 1e-11, scenes)), b = visible(transition(p + 1e-11, scenes));
    assert.equal(a.length, 1); assert.equal(b.length, 1); assert.equal(a[0].index, b[0].index);
    near(a[0].fraction, b[0].fraction, 'frame at blend edge');
  }
});

test('cover framing fills portrait and landscape screens with independent focal points', () => {
  assert.deepEqual(coverRect(2000, 1000, 1000, 1000), { x: 500, y: 0, width: 1000, height: 1000 });
  assert.equal(coverRect(2000, 1000, 1000, 1000, 0).x, 0);
  assert.equal(coverRect(2000, 1000, 1000, 1000, 100).x, 1000);
  const crop = coverRect(1600, 900, 400, 800);
  near(crop.width, 450, 'portrait source width'); near(crop.x, 575, 'centred portrait crop');
  assert.equal(crop.height, 900);
  for (const size of [0, -1, NaN, Infinity]) assert.equal(coverRect(size, 900, 400, 800), null);
});

test('invalid durations and rapid jumps cannot request a time outside a media resource', () => {
  for (const duration of [0, -1, NaN, Infinity, .01, 2, 8]) {
    for (const progress of [0, .1, .8, 1, .01, .99, .4]) {
      const state = transition(progress, scenes);
      for (const layer of visible(state)) {
        const time = mediaTime(layer.fraction, duration);
        assert.ok(Number.isFinite(time) && time >= 0);
        if (Number.isFinite(duration) && duration > 0) assert.ok(time < duration);
        else assert.equal(time, 0);
      }
    }
  }
});


test('words wait for visible brains and dissolve before the empty vortex frames', () => {
  const sequence = [{id:'galaxy'}, {id:'brains'}, {id:'impulses'}, {id:'vortex'}, {id:'warp'}];
  assert.equal(networkProgress(0,.9,sequence),null);
  assert.equal(networkProgress(1,.219,sequence),null);
  assert.equal(networkProgress(1,.22,sequence),0);
  assert.equal(networkProgress(3,.651,sequence),null);
  assert.equal(networkProgress(4,0,sequence),null);
  assert.ok(Math.abs(networkProgress(3,.65,sequence)-1)<1e-12);
  for (const index of [2,3]) {
    near(networkProgress(index-1,1,sequence),networkProgress(index,0,sequence),'network boundary');
  }
});

test('neural words enter from three directions at distinct depths and reverse exactly', () => {
  const options={width:390,height:710};
  const expected=thoughtStates(.51,11,options);
  for (const progress of [0,.99,.07,.8,.51]) thoughtStates(progress,11,options);
  assert.deepEqual(thoughtStates(.51,11,options),expected);
  assert.deepEqual(new Set(expected.map(s=>s.entry)),new Set(['left','right','center']));
  const early=thoughtStates(0,11,options);
  assert.ok(early[2].x>.49&&early[2].x<.51);assert.ok(early[2].y>1);
  const left=thoughtStates(1/9,11,options)[3],right=thoughtStates(2/9,11,options)[4];
  assert.ok(left.x<0);assert.ok(right.x>1);
  const readable=expected.filter(s=>s.opacity>.9);
  assert.equal(new Set(readable.map(s=>s.z.toFixed(2))).size,readable.length);
});

test('readable neural anchors remain in the visible cover crop on phone and desktop', () => {
  for (const dimensions of [{width:390,height:710},{width:1440,height:777},{width:844,height:266}]) {
    for (let i=0;i<=1000;i++) {
      const states=thoughtStates(i/1000,11,dimensions),visible=states.filter(s=>s.opacity>.05);
      assert.ok(visible.length>=2&&visible.length<=3);
      for (const state of states) {
        assert.ok([state.x,state.y,state.z,state.scale,state.blur].every(Number.isFinite));
        if (state.drift>=.34&&state.drift<=.63) {
          assert.ok(state.x>=.23&&state.x<=.78,JSON.stringify({dimensions,state}));
          assert.ok(state.y>=.22&&state.y<=.8,JSON.stringify({dimensions,state}));
          assert.ok(state.blur<1e-8);
        }
      }
    }
  }
});
