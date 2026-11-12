import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { spatialPhraseStates, spatialBudget, inferBrainSilhouettes, sampleStrand, sourceToPlate, clipStrandToViewport, registerNeuralStrands, selectStrandPair } from '../public/assets/journey/spatial-thoughts.mjs';

const catalog = JSON.parse(fs.readFileSync(new URL('../public/assets/journey/spatial-glyphs.json', import.meta.url)));
const source = fs.readFileSync(new URL('../public/assets/journey/journey.js', import.meta.url), 'utf8');
const approved = JSON.parse(source.match(/const EXPRESSION_TEXT=(\{[^;]+\});/)[1]);

test('all eleven current phrases have exact immutable font targets in every journey language', () => {
  for (const [locale, entries] of Object.entries(catalog.locales)) {
    assert.deepEqual(entries.map(entry => entry.text), approved[locale === 'zh-Hans' ? 'zh' : locale]);
    assert.equal(entries.length, 11);
    assert.deepEqual(catalog.fonts[locale].missingCodepoints, []);
    for (const entry of entries) {
      assert.equal(entry.stringSHA256, createHash('sha256').update(entry.text).digest('hex'));
      assert.equal(entry.samples.length, entry.particleCount * 3);
      assert.ok(entry.particleCount > 1500);
      assert.equal(entry.lines.join(locale === 'zh-Hans' ? '' : ' '), entry.text);
      for (let i = 0; i < entry.samples.length; i += 3) {
        assert.ok(entry.samples[i] >= 0 && entry.samples[i] < entry.width);
        assert.ok(entry.samples[i + 1] >= 0 && entry.samples[i + 1] < entry.height);
        assert.ok(entry.samples[i + 2] >= 105 && entry.samples[i + 2] <= 255);
      }
    }
  }
});

test('absolute strand packets reconstruct complete lifecycles with at most two populations and one readable phrase', () => {
  const held = new Set(), formed = new Set(), dissolved = new Set();let population=0;
  for (let i = 0; i <= 1000; i++) {
    const progress = i / 1000;
    const direct = spatialPhraseStates(progress);
    const forward = spatialPhraseStates(progress);
    spatialPhraseStates(1); spatialPhraseStates(0);
    const reverse = spatialPhraseStates(progress);
    assert.deepEqual(direct, forward); assert.deepEqual(direct, reverse);
    const active = direct.filter(state => state.visible);
    assert.ok(active.length <= 2, `${progress}: ${active.length}`);population+=active.length;
    assert.ok(active.filter(state=>state.readable).length<=1);
    active.filter(state => state.phase > .40 && state.phase < .59).forEach(state => held.add(state.index));
    active.filter(state => state.phase > .08 && state.phase < .38).forEach(state => formed.add(state.index));
    active.filter(state => state.phase > .80 && state.phase < .98).forEach(state => dissolved.add(state.index));
  }
  assert.equal(held.size, 11);
  assert.equal(formed.size, 11); assert.equal(dissolved.size, 11);
  assert.ok(population/1001>1.2&&population/1001<1.6,`mean population ${population/1001}`);
  for(const boundary of [4/11,7/11]){
    assert.equal(spatialPhraseStates(boundary).filter(state=>state.visible).length,0);
    const cut=Math.round(boundary*11);
    assert.ok(spatialPhraseStates(boundary-.00001).filter(state=>state.visible).every(state=>state.index<cut));
    assert.ok(spatialPhraseStates(boundary+.00001).filter(state=>state.visible).every(state=>state.index>=cut));
  }
  assert.deepEqual(spatialPhraseStates(null), []);
});

test('a packet requires two distinct supported cable geometries, never two names for one path',()=>{
  const path=(id,y)=>({id,confidence:.9,points:[0,.33,.66,1].map(x=>({x:.1+x*.8,y,z:-2}))});
  assert.equal(selectStrandPair([],0),null);
  assert.equal(selectStrandPair([path('a',.3)],0),null);
  assert.equal(selectStrandPair([path('a',.3),path('b',.3)],0),null);
  const pair=selectStrandPair([path('a',.3),path('b',.7)],0);
  assert.equal(pair.source.id,'a');assert.equal(pair.destination.id,'b');
  assert.equal(selectStrandPair([path('a',.3),{...path('b',.7),confidence:.1}],0),null);
});

test('cover projection retains offscreen source evidence and polyline sampling passes actual vertices',()=>{
  const center=sourceToPlate({x:.5,y:.5,z:-3},390,844);assert.ok(Math.abs(center.x-.5)<1e-12);assert.equal(center.y,.5);assert.equal(center.z,-3);
  assert.ok(sourceToPlate({x:.1,y:.5},390,844).x<0,'a cropped source point must not become a fake viewport-edge anchor');
  const points=[{x:0,y:0,z:0},{x:.5,y:0,z:-1},{x:.5,y:.5,z:-2}];
  assert.deepEqual(sampleStrand(points,.5),points[1]);
});

test('authored noncenter cover crop maps a real cable and its registered pixels with the same source rectangle',()=>{
  const viewport={width:320,height:844},sourceWidth=1280,sourceHeight=720,scale=Math.max(viewport.width/sourceWidth,viewport.height/sourceHeight),cropWidth=viewport.width/scale;
  const sourceCrop={x:(sourceWidth-cropWidth)*.47,y:0,width:cropWidth,height:720,sourceWidth,sourceHeight};
  const endpoint={x:499/1280,y:113/720,z:-3};
  assert.ok(sourceToPlate(endpoint,320,844).x<0,'centered cover genuinely crops the cable end');
  const shifted=sourceToPlate(endpoint,320,844,1280,720,sourceCrop);
  assert.ok(shifted.x>0&&shifted.x<.15);assert.ok(Math.abs(shifted.x-(499-sourceCrop.x)/sourceCrop.width)<1e-12);assert.equal(shifted.z,-3);
  const points=[[480,134],[486,127],[493,119],[499,113]].map(([x,y])=>sourceToPlate({x:x/1280,y:y/720,z:-3},320,844,1280,720,sourceCrop));
  const width=160,height=422,data=new Uint8ClampedArray(width*height*4);
  for(let i=0;i<2000;i++){const point=sampleStrand(points,i/1999),x=Math.round(point.x*width),y=Math.round(point.y*height);if(x>=0&&x<width&&y>=0&&y<height)data.set([180,200,230,255],(y*width+x)*4);}
  const registered=registerNeuralStrands({data,width,height},[{id:'actual-shifted-cable',points,sourceEvidence:{type:'synthetic-filament'}}],{...viewport,sourceCrop});
  assert.equal(registered.length,1);
  registered[0].points.forEach((point,index)=>{assert.ok(Math.abs(registered[0].sourcePixels[index][0]-(sourceCrop.x+point.x*sourceCrop.width))<1e-9);assert.ok(Math.abs(registered[0].sourcePixels[index][1]-(sourceCrop.y+point.y*sourceCrop.height))<1e-9);});
});

test('current RGB ridge registration rejects missing/misregistered paths instead of manufacturing anchors',()=>{
  const width=160,height=100,data=new Uint8ClampedArray(width*height*4);
  const a=[{x:.1,y:.8,z:1},{x:.3,y:.6,z:0},{x:.6,y:.5,z:-1},{x:.9,y:.4,z:-2}];
  const b=[{x:.15,y:.1,z:-2},{x:.4,y:.15,z:-3},{x:.65,y:.2,z:-4},{x:.85,y:.3,z:-5}];
  const line=points=>{for(let i=0;i<2000;i++){const p=sampleStrand(points,i/1999),x=Math.round(p.x*width),y=Math.round(p.y*height);data.set([160,190,230,255],(y*width+x)*4);}};
  line(a);line(b);
  const authored=[{id:'one-actual-cable',points:a,sourceEvidence:{type:'synthetic-filament',currentPTS:2}},{id:'different-actual-cable',points:b,sourceEvidence:{type:'synthetic-filament',currentPTS:2}}];
  const registered=registerNeuralStrands({data,width,height},authored,{width:1280,height:720});
  assert.equal(registered.length,2);
  for(const strand of registered){assert.ok(strand.confidence>=.3);assert.equal(strand.sourceEvidence.currentPTS,2);assert.equal(strand.sourceEvidence.registration,'current-plate perpendicular luminous ridge');assert.ok(strand.sourcePixels.every(p=>p[0]>=0&&p[0]<=1280&&p[1]>=0&&p[1]<=720));}
  assert.deepEqual(registered,registerNeuralStrands({data,width,height},authored,{width:1280,height:720}));
  assert.equal(registerNeuralStrands({data:new Uint8ClampedArray(data.length),width,height},authored).length,0);
  const unsupported=authored.map(strand=>({...strand,points:strand.points.map(p=>({...p,y:p.y+.15}))}));
  assert.equal(registerNeuralStrands({data,width,height},unsupported).length,0);
});

test('portrait registration samples a supported short visible cable end before trimming the cropped path',()=>{
  const width=160,height=100,data=new Uint8ClampedArray(width*height*4);
  for(let x=0;x<=16;x++)data.set([180,200,230,255],(50*width+x)*4);
  // Almost the entire observed source cable is outside the portrait viewport.
  // Its real visible end is still long enough to carry the packet.
  const points=[{x:-2,y:.5,z:-2},{x:-1,y:.5,z:-2},{x:-.4,y:.5,z:-2},{x:.10,y:.5,z:-2}];
  const clipped=clipStrandToViewport(points);
  assert.ok(clipped.length>=2);assert.ok(Math.abs(clipped[0].x-.025)<1e-12);assert.ok(Math.abs(clipped.at(-1).x-.1)<1e-12);
  const authored=[{id:'short-supported-portrait-end',points,sourceEvidence:{type:'synthetic-filament',currentPTS:6.1}}];
  const registered=registerNeuralStrands({data,width,height},authored,{width:390,height:844});
  assert.equal(registered.length,1);assert.ok(registered[0].confidence>=.3);
  assert.ok(registered[0].points.every(point=>point.x>=.025&&point.x<=.11));
  assert.deepEqual(clipStrandToViewport(points.map(point=>({...point,x:point.x-.2}))),[]);
  assert.equal(registerNeuralStrands({data,width,height},authored.map(strand=>({...strand,points:points.map(point=>({...point,x:point.x-.2}))}))).length,0);
  assert.equal(registerNeuralStrands({data:new Uint8ClampedArray(data.length),width,height},authored).length,0);
});

test('mobile reduces trails and physical pixels without discarding glyph strokes', () => {
  const desktop = spatialBudget(1440, 900, 2), mobile = spatialBudget(390, 844, 3);
  assert.ok(desktop.pixelRatio ** 2 * 1440 * 900 <= 2100001);
  assert.ok(mobile.pixelRatio ** 2 * 390 * 844 <= 1100001);
  assert.ok(mobile.trailSamples < desktop.trailSamples);
  assert.equal(mobile.portrait, true);
});

test('inferred plate silhouettes reject stars and green streams, retaining separated depth bands', () => {
  const width = 120, height = 80, data = new Uint8ClampedArray(width * height * 4);
  const rectangle = (x, y, w, h, rgb) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) data.set([...rgb, 255], (yy * width + xx) * 4);
  };
  rectangle(8, 25, 30, 28, [110, 150, 190]);
  rectangle(60, 24, 12, 10, [130, 155, 195]);
  rectangle(95, 10, 5, 5, [130, 150, 180]);
  rectangle(38, 29, 22, 1, [180, 190, 210]);
  rectangle(45, 40, 35, 3, [15, 240, 35]);
  rectangle(90, 60, 1, 1, [255, 255, 255]);
  const first = inferBrainSilhouettes({ data, width, height });
  assert.deepEqual(first, inferBrainSilhouettes({ data, width, height }));
  assert.deepEqual(first.components.map(component => component.band), [3, 2, 1]);
  const alpha = (x, y) => first.pixels[(y * width + x) * 4 + 3];
  assert.equal(alpha(20, 30), 255);
  assert.equal(alpha(50, 41), 0);
  assert.equal(alpha(50, 29), 0, 'thin white connections must not merge brain silhouettes');
  assert.equal(alpha(90, 60), 0);
  assert.equal(alpha(7, 25), 0, 'connection dilation must not enlarge the output mask');
});
