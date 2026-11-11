import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { position, progressAt, mediaTime, thoughtStates } from '../public/assets/journey/timeline.mjs';
import { applyScrollOpening } from '../scripts/apply-scroll-opening.mjs';

const scenes=[{id:'origin',scrollWeight:.3},{id:'big-bang'},{id:'brains'},{id:'gallery'}];
test('scroll positions round-trip and reversing input reverses the same media timeline',()=>{
 for(let i=0;i<scenes.length;i++)for(const fraction of [0,.1,.5,.9,.999]){
  const progress=progressAt(i,fraction,scenes),state=position(progress,scenes);
  assert.equal(state.index,i);assert.ok(Math.abs(state.fraction-fraction)<1e-10);
 }
 const inputs=[.4,.7,.9,.7,.4];
 assert.deepEqual(inputs.map(p=>position(p,scenes))[0],inputs.map(p=>position(p,scenes))[4]);
 assert.deepEqual(position(0,scenes),{index:0,fraction:0,progress:0});
 assert.equal(position(1,scenes).fraction,1);
 assert.ok(mediaTime(.25,8)<mediaTime(.75,8));assert.equal(mediaTime(.25,8),mediaTime(.25,8));
 assert.equal(mediaTime(1,8),8-1/30);
});
test('the neural sequence shows two or three readable expressions and includes all eleven',()=>{
 const seen=new Set();
 for(let n=0;n<=1000;n++){
  const states=thoughtStates(n/1000,11),visible=states.filter(s=>s.opacity>.05);
  assert.ok(visible.length>=2&&visible.length<=3,`${n}: ${visible.length}`);
  for(const s of visible)seen.add(s.index);
 }
 assert.equal(seen.size,11);assert.deepEqual(thoughtStates(null,11),[]);
});
test('homepage migration preserves unrelated original text and is idempotent',()=>{
 const source='<!doctype html><head>Original head</head><main>Before<!-- public-entrances-start --><section class="home-entrances">Original entrance wording</section><!-- public-entrances-end --><!-- minds-landing-start --><section class="sj" id="journey"><img src="/assets/journey/galaxy.webp" alt="" width="1280"></section><!-- minds-landing-end --><article>Original voice, humour, metaphor: æøå.</article></main>';
 const after=applyScrollOpening(source);
 assert.equal(applyScrollOpening(after),after);assert.ok(after.indexOf('Original entrance wording')>after.indexOf('<!-- minds-landing-end -->'));
 assert.ok(after.endsWith('<article>Original voice, humour, metaphor: æøå.</article></main>'));assert.ok(after.includes('Original head'));
 assert.match(after,/data-origin="true"/);assert.match(after,/origin\.svg/);
});
test('new location and actor media remain explicit dependencies rather than invented footage',async()=>{
 const m=JSON.parse(await readFile('public/assets/journey/manifest.json','utf8'));
 assert.equal(m.requestedMediaReplacements.status,'not_produced_not_location_verified');
 assert.ok(m.requestedMediaReplacements.sequence.includes('c7-window-arrival'));
 for(const scene of m.scenes.filter(s=>s.enabled))assert.equal(scene.mode,'scrub');
});

test('the journey preview uses the same six exact originals as the gallery catalogue',async()=>{
 const m=JSON.parse(await readFile('public/assets/journey/manifest.json','utf8'));const c=JSON.parse(await readFile('public/galleri-3d/catalog.json','utf8'));
 const works=m.scenes.find(s=>s.id==='gallery').artworks;assert.equal(works.length,6);assert.deepEqual(works.map(x=>x.id),c.items.map(x=>x.id));assert.deepEqual(works.map(x=>x.src),c.items.map(x=>x.image));
});

test('Chinese fixed gallery controls are complete without replacing editorial dictionaries',async()=>{
 const vm=await import('node:vm');const context={window:{SFI_TRANSLATIONS:{'zh-Hans':{'unrelated-original-paragraph':'preserved-exactly'}}}};
 vm.runInNewContext(await readFile('public/i18n/zh-Hans-journey.js','utf8'),context);
 const dictionary=context.window.SFI_TRANSLATIONS['zh-Hans'];assert.equal(dictionary['unrelated-original-paragraph'],'preserved-exactly');
 for(const file of ['public/gallery-webgl.mjs','public/premium-gallery.js']){
  const source=await readFile(file,'utf8');
  for(const match of source.matchAll(/\bt\('((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)'\)/g)){
   assert.ok(dictionary[match[1].trim()]&&dictionary[match[2].trim()],`${file}: ${match[2]}`);
  }
 }
});
