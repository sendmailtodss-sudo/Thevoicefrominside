import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('public');
const read = file => readFile(path.join(root, file), 'utf8');
const manifest = async () => JSON.parse(await read('assets/journey/manifest.json'));
const enabledOrder = [
  'origin', 'big-bang', 'brains', 'impulses', 'vortex', 'supernova', 'dna',
  'earth-gate', 'c7-arrival', 'man-wink', 'painter', 'metal', 'streetart', 'poet', 'music-room',
  'collective-portal', 'gallery', 'bergen', 'paris', 'interior', 'stencil',
];

function boxes(bytes, start = 0, end = bytes.length) {
  const result = [];
  for (let at = start; at + 8 <= end;) {
    let size = bytes.readUInt32BE(at), header = 8;
    const type = bytes.toString('ascii', at + 4, at + 8);
    if (size === 1) { size = Number(bytes.readBigUInt64BE(at + 8)); header = 16; }
    if (size === 0) size = end - at;
    assert.ok(Number.isSafeInteger(size) && size >= header && at + size <= end, `valid ${type} box`);
    result.push({ type, start: at + header, end: at + size });
    at += size;
  }
  return result;
}

function videoMetadata(bytes) {
  const child = (box, name) => boxes(bytes, box.start, box.end).find(item => item.type === name);
  const movie = boxes(bytes).find(item => item.type === 'moov');
  assert.ok(movie, 'indexed MP4 movie');
  for (const track of boxes(bytes, movie.start, movie.end).filter(box => box.type === 'trak')) {
    const media = child(track, 'mdia'), handler = child(media, 'hdlr');
    if (bytes.toString('ascii', handler.start + 8, handler.start + 12) !== 'vide') continue;
    const header = child(media, 'mdhd'), version = bytes[header.start];
    const timescale = bytes.readUInt32BE(header.start + (version === 1 ? 20 : 12));
    const ticks = version === 1 ? Number(bytes.readBigUInt64BE(header.start + 24)) : bytes.readUInt32BE(header.start + 16);
    const table = child(child(media, 'minf'), 'stbl');
    const size = child(table, 'stsz'), timing = child(table, 'stts'), description = child(table, 'stsd');
    const frameCount = bytes.readUInt32BE(size.start + 8);
    const timingEntries = bytes.readUInt32BE(timing.start + 4), deltas = [];
    let timedFrames = 0, elapsedTicks = 0;
    const frameTimes = [];
    for (let i = 0; i < timingEntries; i++) {
      const count = bytes.readUInt32BE(timing.start + 8 + i * 8);
      const delta = bytes.readUInt32BE(timing.start + 12 + i * 8);
      timedFrames += count; deltas.push(delta);
      for (let frame = 0; frame < count; frame++) { frameTimes.push(elapsedTicks / timescale); elapsedTicks += delta; }
    }
    const sampleEntry = description.start + 8;
    return { frameCount, timedFrames, timescale, ticks, deltas, frameTimes,
      width: bytes.readUInt16BE(sampleEntry + 32), height: bytes.readUInt16BE(sampleEntry + 34) };
  }
  assert.fail('MP4 contains a video track');
}

test('the complete journey keeps the origin, dense collective minds and every creator in order', async () => {
  const data = await manifest(), scenes = data.scenes.filter(scene => scene.enabled);
  assert.deepEqual(scenes.map(scene => scene.id), enabledOrder);
  assert.equal(new Set(data.scenes.map(scene => scene.id)).size, data.scenes.length);
  assert.equal(scenes[0].type, 'point');
  assert.match(scenes[1].video, /s01-point-galaxy-/);
  for (const id of ['brains', 'impulses', 'vortex']) {
    const scene = scenes.find(item => item.id === id);
    assert.match(scene.video, new RegExp(`legacy-${id}-`));
    assert.equal(scene.frameRate, 30);
    assert.equal(scene.frameCount, 301);
  }
  for (const id of ['painter','metal','poet','music-room']) {
    const scene = scenes.find(item => item.id === id);
    assert.ok(!scene.video.includes('/ui-20261112/'), `${id} preserves the public V7 footage`);
  }
  // User decision 12 Nov 2026: the known-wrong C building (S05) and outfit (S06A)
  // stay public as labelled temporary drafts until corrected media replaces them.
  for (const [id, shot] of [['earth-gate','s04'],['c7-arrival','s05'],['man-wink','s06a']]) {
    const scene = scenes.find(item => item.id === id);
    assert.match(scene.video, new RegExp(`/ui-20261112/${shot}-`));
    assert.equal(scene.reviewStatus, 'draft');
    assert.match(scene.description.en, /Temporary draft/);
  }
  const retired = data.scenes.find(scene => scene.id === 'prison-arrival');
  assert.equal(retired.enabled, false);
  assert.equal(retired.video, '/assets/journey/prison-arrival.mp4');
  assert.equal(scenes.find(scene => scene.id === 'music-room').video, '/assets/journey/prison-music.mp4');
  assert.ok(scenes.every(scene => !/s0[236-9]-|s1[0-2]-/.test(scene.video || '')));
  assert.equal(data.requestedMediaReplacements.status, 'temporary_drafts_published_on_user_instruction');
  assert.equal(data.releaseScope.state, 'neural_update_with_temporary_arrival_drafts');
});

test('enabled media stays local, nested asset paths exist, and exact artwork remains inspectable', async () => {
  const scenes = (await manifest()).scenes.filter(scene => scene.enabled);
  for (const scene of scenes) {
    assert.equal(scene.mode, 'scrub');
    for (const file of [scene.video, scene.poster].filter(Boolean)) {
      assert.match(file, /^\/assets\/journey\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(mp4|webp|svg)$/);
      assert.ok((await stat(path.join(root, file))).size > 0, `${scene.id} is available`);
    }
    for (const art of scene.artworks || []) {
      assert.match(art.src, /^\/design-assets\//);
      assert.ok((await stat(path.join(root, art.src))).size > 0, `${art.id} is available`);
    }
  }
  const painter = scenes.find(scene => scene.id === 'painter');
  const gallery = scenes.find(scene => scene.id === 'gallery');
  assert.ok(gallery.artworks.some(art => art.id === 'lar-bak-murene'));
  assert.match(painter.description.en, /not finished/);
  for (const route of ['index.html', 'en/index.html']) {
    const html = await read(route);
    assert.match(html, /data-journey/);
    assert.match(html, /\/assets\/journey\/journey\.js/);
    assert.doesNotMatch(html, /\/__private-preview\//);
    assert.match(html, /noindex,nofollow/);
  }
});

test('every enabled video declares actual MP4 frames and measured constant or variable cadence', async () => {
  for (const scene of (await manifest()).scenes.filter(item => item.enabled && item.video)) {
    assert.ok((Number.isInteger(scene.frameRate) && scene.frameRate > 0) || Array.isArray(scene.frameTimes), `${scene.id} measured cadence`);
    assert.ok(Number.isInteger(scene.frameCount) && scene.frameCount > 1, `${scene.id} frame count`);
    const actual = videoMetadata(await readFile(path.join(root, scene.video)));
    assert.equal(actual.frameCount, scene.frameCount, `${scene.id} actual samples`);
    assert.equal(actual.timedFrames, scene.frameCount, `${scene.id} timed samples`);
    assert.equal(actual.width, scene.width, `${scene.id} actual width`);
    assert.equal(actual.height, scene.height, `${scene.id} actual height`);
    assert.ok(Math.abs(actual.ticks / actual.timescale - scene.duration) < 1e-7, `${scene.id} actual duration`);
    if (scene.frameTimes) {
      assert.equal(scene.id, 'paris');
      assert.deepEqual(scene.frameTimes, actual.frameTimes, 'V7 Paris has its actual varying sample timestamps');
      assert.ok(scene.frameTimes.at(-1) < scene.duration);
    } else {
      assert.ok(actual.deltas.every(delta => delta * scene.frameRate === actual.timescale), `${scene.id} exact CFR`);
      assert.equal(scene.duration, scene.frameCount / scene.frameRate, `${scene.id} exclusive endpoint`);
      assert.ok((scene.frameCount - 1) / scene.frameRate < scene.duration, `${scene.id} final frame is inside duration`);
    }
  }
});

test('the bounded neural opening preserves explicit cuts and leaves V7 transition settings intact', async () => {
  const scenes = (await manifest()).scenes.filter(scene => scene.enabled);
  for (const id of ['big-bang','brains','impulses','vortex']) {
    assert.equal(scenes.find(scene => scene.id === id).transitionOut.treatment, 'cut', `${id} registered plate boundary`);
  }
  for (const scene of scenes.slice(5)) {
    assert.equal(scene.transitionOut, undefined, `${scene.id} keeps its existing V7 default`);
    assert.equal(scene.transitionIn, undefined, `${scene.id} keeps its existing V7 default`);
  }
});
