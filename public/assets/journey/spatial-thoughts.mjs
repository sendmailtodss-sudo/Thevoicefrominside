/* Analytic spatial glyphs, adapted from the verified particle mechanism proof.
 * Input is the parent's COMMITTED plate position. No scheduler or elapsed clock.
 * Plate occlusion is a conservative luminous silhouette with INFERRED depth;
 * it is not a recovered camera, anatomical mesh or measured depth pass.
 */
const SEED = 260146;
const clamp = value => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
const mix = (a, b, p) => a + (b - a) * p;
const smooth = (a,b,value) => { const n=clamp((value-a)/(b-a));return n*n*(3-2*n); };
export function spatialPhraseStates(progress, count = 11) {
  if (progress === null || !Number.isFinite(progress) || count < 1) return [];
  // The two video graphs have separate complete lifecycles. Nothing remains
  // half-formed across their cut; at the exact partition the packet is empty.
  const n=clamp(progress),bounds=count===11?[0,4,7,11]:[0,count];
  const group=Math.max(0,bounds.findIndex((end,index)=>index>0&&n<=end/count)-1),start=bounds[group],size=bounds[group+1]-start;
  const local=(n-start/count)/(size/count),cursor=local*(size+.6);
  return Array.from({ length: count }, (_, index) => {
    const belongs=index>=start&&index<start+size,phase=belongs?(cursor-index+start)/1.6:-1;
    return { index, slot: index % 2, phase, visible: belongs&&phase>1e-10&&phase<1-1e-10, readable: belongs&&phase>=.40&&phase<=.59 };
  });
}
export function spatialBudget(width, height, dpr = 1, compact = false, ios = false) {
  const portrait = width / height < .85;
  const limit = ios ? 700000 : compact || portrait ? 1100000 : 2100000;
  return {
    portrait, maskWidth: compact || portrait ? 224 : 448,
    pixelRatio: Math.max(.5, Math.min(dpr || 1, ios ? 1 : compact || portrait ? 1.25 : 1.5, Math.sqrt(limit / Math.max(1, width * height)))),
    trailStride: ios || compact || portrait ? 48 : 30, trailSamples: ios || compact || portrait ? 3 : 5,
  };
}
const seeded = n => {
  let x = (n + SEED) | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
};

/** Infer only the bright, approximately neutral/blue connected silhouettes.
 * A one-pixel dilation connects brain folds; the OUTPUT keeps original pixels,
 * so the dilation cannot invent an opaque rectangular brain or edge halo.
 * Small stars are removed. Apparent component size supplies three depth bands.
 */
export function inferBrainSilhouettes({ data, width, height }) {
  const total = width * height, bright = new Uint8Array(total), cores = new Uint8Array(total), linked = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const high = Math.max(r, g, b), low = Math.min(r, g, b);
    const luma = r * .2126 + g * .7152 + b * .0722;
    if (luma > 55 && low > high * .34 && b > g * .82 && b > r * .8) bright[i] = 1;
  }
  // Thin white inter-brain filaments must not join all foreground brains into
  // one huge component. Keep locally dense folds/core pixels before linking.
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    if (bright[i] + bright[i - 1] + bright[i + 1] + bright[i - width] + bright[i + width] + bright[i - width - 1] + bright[i - width + 1] + bright[i + width - 1] + bright[i + width + 1] >= 5) cores[i] = 1;
  }
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x;
    linked[i] = cores[i] || cores[i - 1] || cores[i + 1] || cores[i - width] || cores[i + width] || cores[i - width - 1] || cores[i - width + 1] || cores[i + width - 1] || cores[i + width + 1];
  }
  const labels = new Int32Array(total), queue = new Int32Array(total), components = [];
  let serial = 0;
  for (let start = 0; start < total; start++) {
    if (!linked[start] || labels[start]) continue;
    const id = ++serial;
    let head = 0, tail = 1, count = 0, sumX = 0, sumY = 0;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    queue[0] = start; labels[start] = id;
    while (head < tail) {
      const i = queue[head++], x = i % width, y = Math.floor(i / width);
      if (bright[i]) { count++; sumX += x; sumY += y; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
      for (const next of [x ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y ? i - width : -1, y < height - 1 ? i + width : -1]) {
        if (next >= 0 && linked[next] && !labels[next]) { labels[next] = id; queue[tail++] = next; }
      }
    }
    const w = maxX - minX + 1, h = maxY - minY + 1;
    if (count < 13 || w < 5 || h < 5 || w * h > total * .78) continue;
    const extent = Math.sqrt(w * h / total), band = extent > .25 ? 3 : extent > .09 ? 2 : 1;
    components.push({ id, count, x: sumX / count / width, y: sumY / count / height, width: w / width, height: h / height, band, z: [-5.2, -.45, 2.8][band - 1] });
  }
  const bands = new Uint8Array(serial + 1);
  components.forEach(component => { bands[component.id] = component.band; });
  const pixels = new Uint8Array(total * 4);
  for (let i = 0; i < total; i++) if (bright[i] && bands[labels[i]]) {
    pixels[i * 4] = bands[labels[i]] * 85;
    pixels[i * 4 + 3] = 255;
  }
  components.sort((a, b) => b.count - a.count || a.id - b.id);
  return { pixels, components };
}

// These are observed 2D filament paths, not a recovered camera or 3D topology.
// Additional samples can be supplied by the parent through input.strands.
const FILAMENT_KEYS = {
  impulses: [{at:3.5,paths:[
    {id:'impulses-lower-diagonal',points:[[480/1280,414/720],[505/1280,380/720],[665/1280,352/720],[845/1280,320/720]],depths:[2.8,-.45]},
  ]},{at:4.4,paths:[
    {id:'impulses-lower-diagonal',points:[[441/1280,434/720],[481/1280,388/720],[666/1280,358/720],[881/1280,326/720]],depths:[2.8,-.45]},
    {id:'impulses-upper-diagonal',points:[[390/1280,222/720],[432/1280,201/720],[476/1280,175/720],[516/1280,150/720]],depths:[-.45,-5.2]},
  ]},{ at: 5, paths: [
    { id: 'impulses-lower-diagonal', points: [[.30625,.64028],[.35547,.54722],[.51797,.50417],[.69922,.46250]], depths: [2.8,-.45] },
    { id: 'impulses-upper-diagonal', points: [[373/1280,215/720],[445/1280,177/720],[511/1280,135/720],[511/1280,135/720]], depths: [-.45,-5.2] },
  ] },{at:6.5,paths:[
    {id:'impulses-lower-diagonal',points:[[125/1280,647/720],[362/1280,418/720],[655/1280,385/720],[936/1280,357/720]],depths:[2.8,-.45]},
    {id:'impulses-upper-diagonal',points:[[327/1280,185/720],[405/1280,147/720],[495/1280,102/720],[495/1280,102/720]],depths:[-.45,-5.2]},
  ]},{at:7.2,paths:[
    {id:'impulses-lower-diagonal',points:[[100/1280,555/720],[298/1280,438/720],[647/1280,398/720],[967/1280,367/720]],depths:[2.8,-.45]},
    {id:'impulses-upper-diagonal',points:[[307/1280,168/720],[365/1280,139/720],[424/1280,110/720],[484/1280,82/720]],depths:[-.45,-5.2]},
    {id:'impulses-central-vertical',points:[[533/1280,280/720],[552/1280,339/720],[581/1280,390/720],[611/1280,435/720]],depths:[-4,-.45]},
  ]},{at:8,paths:[
    {id:'impulses-lower-diagonal',points:[[140/1280,465/720],[316/1280,438/720],[632/1280,418/720],[1005/1280,383/720]],depths:[2.8,-.45]},
    {id:'impulses-central-vertical',points:[[535/1280,282/720],[560/1280,329/720],[585/1280,373/720],[606/1280,411/720]],depths:[-4,-.45]},
  ]},{at:9.8,paths:[
    {id:'impulses-lower-diagonal',points:[[20/1280,479/720],[356/1280,474/720],[550/1280,470/720],[1120/1280,429/720]],depths:[2.8,-.45]},
    {id:'impulses-central-vertical',points:[[532/1280,270/720],[549/1280,328/720],[572/1280,379/720],[596/1280,435/720]],depths:[-4,-.45]},
  ]}],
  vortex: [
    {at:0,paths:[{id:'vortex-central-left-arm',points:[[635/1280,353/720],[647/1280,337/720],[662/1280,326/720],[673/1280,322/720]],depths:[-4,-1.8]},{id:'vortex-central-lower-arm',points:[[685/1280,327/720],[689/1280,337/720],[694/1280,352/720],[699/1280,371/720]],depths:[-1.8,-3.4]}]},
    {at:1,paths:[{id:'vortex-central-left-arm',points:[[625/1280,363/720],[644/1280,344/720],[660/1280,332/720],[674/1280,325/720]],depths:[-4,-1.8]},{id:'vortex-central-lower-arm',points:[[685/1280,331/720],[694/1280,350/720],[698/1280,376/720],[698/1280,400/720]],depths:[-1.8,-3.4]}]},
    {at:3,paths:[{id:'vortex-central-left-arm',points:[[621/1280,360/720],[637/1280,348/720],[660/1280,330/720],[683/1280,323/720]],depths:[-3.8,-1.4]},{id:'vortex-central-lower-arm',points:[[698/1280,335/720],[701/1280,350/720],[706/1280,366/720],[725/1280,380/720]],depths:[-1.4,-3.2]}]},
    {at:5,paths:[{id:'vortex-central-left-arm',points:[[580/1280,362/720],[625/1280,346/720],[674/1280,328/720],[719/1280,329/720]],depths:[-3.2,-.8]},{id:'vortex-central-lower-arm',points:[[728/1280,336/720],[725/1280,382/720],[746/1280,425/720],[761/1280,468/720]],depths:[-.8,-2.8]}]},
  ],
};

export function sampleStrand(points, fraction) {
  if (!Array.isArray(points) || points.length < 2) return null;
  const lengths = [], segmentLength = (a, b) => Math.hypot(b.x-a.x, b.y-a.y);
  let total = 0;
  for (let i = 1; i < points.length; i++) { const length = segmentLength(points[i-1],points[i]); lengths.push(length); total += length; }
  let remaining = clamp(fraction) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length-1) {
      const t = lengths[i] ? clamp(remaining / lengths[i]) : 0, a = points[i], b = points[i+1];
      return { x: mix(a.x,b.x,t), y: mix(a.y,b.y,t), z: mix(a.z || 0,b.z || 0,t) };
    }
    remaining -= lengths[i];
  }
  return { ...points[0] };
}

function hasSourceCrop(crop) {
  return crop&&['x','y','width','height','sourceWidth','sourceHeight'].every(key=>Number.isFinite(crop[key]))&&crop.width>0&&crop.height>0&&crop.sourceWidth>0&&crop.sourceHeight>0;
}

export function sourceToPlate(point, width, height, sourceWidth = 1280, sourceHeight = 720, sourceCrop = null) {
  if(hasSourceCrop(sourceCrop))return{x:(point.x*sourceCrop.sourceWidth-sourceCrop.x)/sourceCrop.width,y:(point.y*sourceCrop.sourceHeight-sourceCrop.y)/sourceCrop.height,z:point.z||0};
  const scale = Math.max(width/sourceWidth,height/sourceHeight), cropW = width/scale/sourceWidth, cropH = height/scale/sourceHeight;
  return { x: (point.x-(1-cropW)/2)/cropW, y: (point.y-(1-cropH)/2)/cropH, z: point.z || 0 };
}

export function clipStrandToViewport(points,{left=.025,right=.975,top=.035,bottom=.965}={}) {
  const fragments=[];let current=[];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],dx=b.x-a.x,dy=b.y-a.y;
    let enter=0,exit=1,visible=true;
    const p=[-dx,dx,-dy,dy],q=[a.x-left,right-a.x,a.y-top,bottom-a.y];
    for(let edge=0;edge<4;edge++){
      if(Math.abs(p[edge])<1e-12){if(q[edge]<0)visible=false;continue;}
      const t=q[edge]/p[edge];if(p[edge]<0)enter=Math.max(enter,t);else exit=Math.min(exit,t);
    }
    if(!visible||enter>exit){if(current.length>1)fragments.push(current);current=[];continue;}
    const at=t=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z||0,b.z||0,t)}),first=at(enter),last=at(exit);
    if(current.length&&Math.hypot(current.at(-1).x-first.x,current.at(-1).y-first.y)>1e-8){fragments.push(current);current=[];}
    if(!current.length)current.push(first);current.push(last);
  }
  if(current.length>1)fragments.push(current);
  const length=path=>path.reduce((sum,p,i)=>i?sum+Math.hypot(p.x-path[i-1].x,p.y-path[i-1].y):sum,0);
  return fragments.reduce((longest,path)=>length(path)>length(longest)?path:longest,[]);
}

export function selectStrandPair(strands, phraseIndex = 0) {
  const candidates = strands.filter(strand => strand.confidence >= .3 && strand.points?.length >= 4).sort((a,b)=>a.id.localeCompare(b.id));
  if (candidates.length < 2) return null;
  const distinct=(a,b)=>{const p=sampleStrand(a.points,.5),q=sampleStrand(b.points,.5);return Math.hypot(p.x-q.x,p.y-q.y)>.012;};
  const cable=candidates.find(strand=>strand.id==='impulses-lower-diagonal');
  if(cable){
    const branch=candidates.find(strand=>strand.id===(phraseIndex<4?'impulses-upper-diagonal':'impulses-central-vertical'));
    if(!branch||!distinct(cable,branch))return null;
    return phraseIndex%2?{source:branch,destination:cable}:{source:cable,destination:branch};
  }
  const source = candidates[phraseIndex % candidates.length], midpoint = sampleStrand(source.points,.5);
  const destinations = candidates.filter(strand => strand.id !== source.id && (()=>{const point=sampleStrand(strand.points,.5);return Math.hypot(point.x-midpoint.x,point.y-midpoint.y)>.012;})());
  if (!destinations.length) return null;
  return { source, destination: destinations[(phraseIndex + 1) % destinations.length] };
}

/** Register an observed path to thin ridges in THIS committed RGB frame.
 * Search is perpendicular to the observed cable, never an unconstrained search
 * for a nearby bright brain or star. A missing cable produces no invented path.
 */
export function registerNeuralStrands(image, authored, viewport = image) {
  const { data, width, height } = image;
  // The search band is expressed in original-source pixels. Increasing the
  // analysis resolution must not accidentally shrink the tolerated cable bend.
  const radius=Math.max(4,Math.ceil(20*Math.max(width/1280,height/720)));
  const luma = (x,y) => { x=Math.round(x);y=Math.round(y);if(x<0||x>=width||y<0||y>=height)return 0;const i=(y*width+x)*4;return data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722; };
  const registered=[];
  for (const strand of authored) {
    if (!strand.points?.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))) continue;
    // Sample the real visible portion, not a mostly cropped full-frame cable.
    // This preserves a short supported end on portrait without moving it to
    // a viewport edge or inventing an offscreen source.
    const visiblePath=clipStrandToViewport(strand.points);
    if(visiblePath.length<2)continue;
    const candidates=[];
    for(let i=0;i<32;i++) {
      // Avoid the brain endpoints: the packet emerges from the cable itself.
      const t=.10+i/31*.8, point=sampleStrand(visiblePath,t), before=sampleStrand(visiblePath,Math.max(0,t-.025)),after=sampleStrand(visiblePath,Math.min(1,t+.025));
      if(point.x<.025||point.x>.975||point.y<.035||point.y>.965){candidates.push(null);continue;}
      const dx=(after.x-before.x)*width,dy=(after.y-before.y)*height,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
      const px=point.x*width,py=point.y*height;
      let best=null;
      for(let offset=-radius;offset<=radius;offset++) {
        const x=px+nx*offset,y=py+ny*offset,center=luma(x,y);
        const ridge=center-(luma(x+nx*3,y+ny*3)+luma(x-nx*3,y-ny*3))*.5;
        const score=ridge-Math.abs(offset)*1.2;
        if(center>33&&ridge>5&&(!best||score>best.score))best={x:x/width,y:y/height,z:point.z,score};
      }
      candidates.push(best);
    }
    // Keep one visibly supported continuous cable portion, with at most one
    // antialiased sample gap. No path is extended into unseen space.
    let bestRun=[],run=[],gap=0;
    for(const point of candidates) {
      if(point){run.push(point);gap=0;}else if(run.length&&gap++<1){continue;}else{if(run.length>bestRun.length)bestRun=run;run=[];gap=0;}
    }
    if(run.length>bestRun.length)bestRun=run;
    if(bestRun.length<4)continue;
    const length=bestRun.reduce((sum,p,i)=>i?sum+Math.hypot(p.x-bestRun[i-1].x,p.y-bestRun[i-1].y):sum,0);
    if(length<.02)continue;
    const points=[0,1/3,2/3,1].map(t=>sampleStrand(bestRun,t));
    const confidence=Math.min(1,bestRun.length/14);
    const cropScale=Math.max(viewport.width/1280,viewport.height/720),cropW=viewport.width/cropScale/1280,cropH=viewport.height/cropScale/720,crop=hasSourceCrop(viewport.sourceCrop)?viewport.sourceCrop:null;
    const sourcePixels=points.map(p=>crop?[crop.x+p.x*crop.width,crop.y+p.y*crop.height]:[(p.x*cropW+(1-cropW)/2)*1280,(p.y*cropH+(1-cropH)/2)*720]);
    registered.push({id:strand.id,points,confidence,platePixels:points.map(p=>[p.x*viewport.width,p.y*viewport.height]),sourcePixels,sourceEvidence:{...strand.sourceEvidence,registration:'current-plate perpendicular luminous ridge',matchedSamples:bestRun.length,totalSamples:32,searchRadiusSourcePixels:20,depth:'inferred, not measured'}});
  }
  return registered;
}

function observedStrands(input,width,height) {
  if(Array.isArray(input.strands))return input.strands.map((strand,index)=>({...strand,id:String(strand.id??`provided-${index}`),points:strand.points.map(p=>Array.isArray(p)?{x:p[0],y:p[1],z:p[2]||0}:p),sourceEvidence:strand.sourceEvidence||{type:'parent-observed-filament'}}));
  const sceneId=input.sceneId||input.scene,keys=FILAMENT_KEYS[sceneId];
  if(!keys?.length)return [];
  // An unquantized scroll fraction is not evidence of a committed video PTS.
  // Root supplies either an actual rVFC time or a separately labelled seek-time estimate.
  // The latter is not a verified PTS; registration remains tied to the sampled plate RGB.
  if(!Number.isFinite(input.sceneTime))return [];
  const seconds=input.sceneTime;
  return [...new Set(keys.flatMap(key=>key.paths.map(path=>path.id)))].flatMap(id=>{
    // Enlarged-source review rejected the supposed early continuation of this
    // cable. A bright stump plus dark space must never become a claimed line.
    if(id==='impulses-upper-diagonal'&&(seconds<4.4||seconds>7.2))return [];
    if(id==='impulses-central-vertical'&&seconds<7.2)return [];
    const samples=keys.filter(key=>key.paths.some(path=>path.id===id));
    if(seconds<samples[0].at-1.5||seconds>samples.at(-1).at+1.5)return [];
    let upper=samples.findIndex(key=>key.at>=seconds);if(upper<0)upper=samples.length-1;
    let lower=Math.max(0,upper-1);if(samples.length>1&&upper===0)upper=1;
    const from=samples[lower],to=samples[upper],path=from.paths.find(path=>path.id===id),next=to.paths.find(path=>path.id===id),t=from===to?0:(seconds-from.at)/(to.at-from.at);
    return[{id,points:path.points.map((p,index)=>sourceToPlate({x:mix(p[0],next.points[index][0],t),y:mix(p[1],next.points[index][1],t),z:mix(mix(path.depths[0],path.depths[1],index/(path.points.length-1)),mix(next.depths[0],next.depths[1],index/(path.points.length-1)),t)},width,height,1280,720,input.sourceCrop)),sourceEvidence:{type:'observed-2d-filament',sceneId,observedPTS:[from.at,to.at],currentTimeEstimate:seconds,timeBasis:input.sceneTimeEvidence||'unspecified',sourceSize:[1280,720],interpolation:t<0||t>1?'bounded observed-path extrapolation; current RGB must confirm':'between observed 2D paths; current RGB must confirm'}}];
  });
}

const vertexShader = `
attribute vec3 aScatter; attribute vec3 aBend;
attribute float aLag; attribute float aSize; attribute float aCoverage; attribute float aTrail; attribute float aRibbonT;
uniform vec3 uSource[4]; uniform vec3 uDestination[4]; uniform mat4 uPose;
uniform float uProgress; uniform float uPixelHeight; uniform float uPixelRatio; uniform float uPresence; uniform float uGlyphScale;
varying float vCoverage;
vec3 cubic(vec3 a,vec3 b,vec3 c,vec3 d,float t){float q=1.-t;return q*q*q*a+3.*q*q*t*b+3.*q*t*t*c+t*t*t*d;}
vec3 strand(vec3 a,vec3 b,vec3 c,vec3 d,float t){float s=clamp(t,0.,1.)*3.;if(s<1.)return mix(a,b,s);if(s<2.)return mix(b,c,s-1.);return mix(c,d,s-2.);}
void main(){
 float p=uProgress-aTrail;
 float arrive=smoothstep(.12+aLag,.38+aLag,p);
 float collapse=smoothstep(.61+aLag,.735+aLag,p);
 vec3 target=(uPose*vec4(position*uGlyphScale,1.)).xyz;
 vec3 center=(uPose*vec4(0.,0.,0.,1.)).xyz;
 vec3 first=strand(uSource[0],uSource[1],uSource[2],uSource[3],fract(aRibbonT+p*.34))+aScatter*.028;
 vec3 in1=mix(first,center,.28)+vec3(aBend.x*.18,aBend.y*.24,-1.8);
 vec3 in2=target+vec3(aBend.x*.10,aBend.y*.12,-1.4);
 vec3 point=cubic(first,in1,in2,target,arrive);
 if(collapse>0.)point=cubic(target,mix(target,center,.65),center+vec3(0.,0.,-1.3),center+vec3(0.,0.,-2.6),collapse);
 float blink=1.;
 if(p>.73&&p<.775)blink=1.-smoothstep(.73,.755,p);
 if(p>=.775){
  float expand=smoothstep(.775,.94,p);
  point=strand(uDestination[0],uDestination[1],uDestination[2],uDestination[3],mix(.5,fract(aRibbonT+p*.28),expand))+aScatter*.023;
  blink=smoothstep(.775,.81,p);
 }
 vec4 mv=modelViewMatrix*vec4(point,1.);
 gl_Position=projectionMatrix*mv;
 gl_PointSize=clamp(aSize*uGlyphScale*uPixelHeight*projectionMatrix[1][1]/(-mv.z),.6*uPixelRatio,6.*uPixelRatio);
 float visible=smoothstep(0.,.065,p)*(1.-smoothstep(.94,1.,p));
 float selection=step(aBend.z*.5+.5,p>=.775?.12:mix(.12,1.,arrive));
 vCoverage=aCoverage*uPresence*visible*blink*selection*(p>=.775?.24:mix(.30,1.,arrive));
 if(aTrail>0.)vCoverage*=.28*(1.-aTrail/.065)*(step(.001,arrive)*(1.-step(.999,arrive))+step(.001,collapse)*(1.-step(.999,collapse)));
}`;
const fragmentShader = `
precision highp float; varying float vCoverage;
void main(){
 float radius=length(gl_PointCoord-.5)*2.;if(radius>1.||vCoverage<.001)discard;
 float halo=exp(-radius*radius*4.8)*.20;
 float pixel=max(abs(gl_PointCoord.x-.5),abs(gl_PointCoord.y-.5))*2.;
 float core=(1.-smoothstep(.10,.43,pixel))*.46;
 float pin=(1.-smoothstep(.012,.07,pixel))*.035;
 float energy=(halo+core+pin)*vCoverage;
 gl_FragColor=vec4((vec3(.008,.68,.065)*halo+vec3(.018,.92,.095)*core+vec3(.48,1.,.65)*pin)*vCoverage,energy);
 #include <colorspace_fragment>
}`;
const depthVertex = `void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const depthFragment = `
precision highp float; uniform sampler2D uMask; uniform vec2 uBuffer; uniform float uBand;
void main(){vec2 uv=gl_FragCoord.xy/uBuffer;uv.y=1.-uv.y;vec4 mask=texture2D(uMask,uv);if(mask.a<.45||abs(mask.r-uBand)>.13)discard;gl_FragColor=vec4(0.);}`;
const relightVertex=`void main(){gl_Position=vec4(position.xy,1.,1.);}`;
const relightFragment=`
precision highp float; uniform sampler2D uPlate;uniform vec2 uBuffer;uniform vec2 uSource[4];uniform vec2 uDestination[4];uniform vec2 uWord;uniform vec3 uEnergy;uniform float uPresence;
float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;float t=clamp(dot(p-a,d)/max(dot(d,d),.000001),0.,1.);return length(p-a-d*t);}
float cable(vec2 p,vec2 a,vec2 b,vec2 c,vec2 d){return min(segment(p,a,b),min(segment(p,b,c),segment(p,c,d)));}
void main(){
 vec2 uv=gl_FragCoord.xy/uBuffer;vec3 rgb=texture2D(uPlate,uv).rgb;
 vec2 q=vec2(uv.x,1.-uv.y);float aspect=uBuffer.x/uBuffer.y;q.x*=aspect;
 float a=cable(q,uSource[0],uSource[1],uSource[2],uSource[3]);
 float b=cable(q,uDestination[0],uDestination[1],uDestination[2],uDestination[3]);
 float word=length(q-uWord);
 float local=uEnergy.x*exp(-a*a/.00038)+uEnergy.y*exp(-b*b/.00038)+uEnergy.z*exp(-word*word/.010);
 local=clamp(local*uPresence,0.,1.);
 float luminance=dot(rgb,vec3(.2126,.7152,.0722));
 float detail=smoothstep(.006,.045,luminance)*(1.-smoothstep(.50,.96,luminance));
 vec3 emerald=vec3(.13,1.,.34);emerald*=luminance/dot(emerald,vec3(.2126,.7152,.0722));
 rgb=mix(rgb,emerald,local*detail*.73);
 rgb+=vec3(.012,.052,.02)*local*smoothstep(.009,.08,luminance)*.19;
 gl_FragColor=vec4(rgb,1.);
 #include <colorspace_fragment>
}`;
const blurFragment=`
precision highp float;uniform sampler2D uInput;uniform vec2 uStep;varying vec2 vUv;
void main(){vec4 color=texture2D(uInput,vUv)*.227027;
 color+=(texture2D(uInput,vUv+uStep*1.384615)+texture2D(uInput,vUv-uStep*1.384615))*.316216;
 color+=(texture2D(uInput,vUv+uStep*3.230769)+texture2D(uInput,vUv-uStep*3.230769))*.070270;
 gl_FragColor=color;}`;
const screenVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const compositeFragment=`
precision highp float;uniform sampler2D uCore;uniform sampler2D uGlow;uniform float uGlowGain;varying vec2 vUv;
void main(){vec4 core=texture2D(uCore,vUv);vec4 glow=texture2D(uGlow,vUv);vec3 color=core.rgb+glow.rgb*uGlowGain;
 gl_FragColor=vec4(color,max(core.a,clamp(max(glow.r,max(glow.g,glow.b))*uGlowGain,0.,1.)));
 #include <colorspace_fragment>
}`;

let assets;
function loadAssets() {
  assets ||= Promise.all([
    import('../../vendor/three/three.module.js'),
    fetch(new URL('./spatial-glyphs.json', import.meta.url)).then(response => { if (!response.ok) throw Error('Exact glyph targets unavailable'); return response.json(); }),
  ]);
  return assets;
}

export function createSpatialThoughts({ parent, words = [], onReady = () => {} } = {}) {
  if (!parent) throw new TypeError('Spatial thoughts require a visual parent');
  const canvas = document.createElement('canvas');
  canvas.className = 'sj-spatial-thoughts'; canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '3', display: 'none' });
  const fallback = document.createElement('div');
  fallback.className = 'sj-spatial-fallback'; fallback.setAttribute('aria-hidden', 'true');
  Object.assign(fallback.style, { position: 'absolute', inset: '15% 8%', pointerEvents: 'none', zIndex: '3', display: 'none', color: '#8affae', textShadow: '0 1px 8px #000,0 0 18px #075b2c', font: '500 clamp(16px,2.6vw,28px)/1.5 monospace', textAlign: 'center', flexDirection: 'column', justifyContent: 'space-around' });
  parent.append(canvas, fallback);
  let THREE, data, renderer, scene, camera, depthTexture, sampleCanvas, sampleContext, strandCanvas, strandContext, plateTexture, relight;
  let coreTarget,emissionTarget,blurTarget,glowTarget,screenScene,screenCamera,screenQuad,blurMaterial,compositeMaterial;
  let groups = [], masks = [], disposed = false, failed = false, locale = null;
  let currentWords = [...words], lastInput = { progress: null }, width = 0, height = 0, budget, lastDPR = 0;
  let renderCount = 0, lastCPUms = 0, components = [], lastMaskPlate = null, lastMaskKey = '';
  let readyState = 'loading', selected = [], geometryBytes = 0, maskCount = 0;
  let registeredStrands=[],activeRecords=[],strandStatus='awaiting-plate',currentPlateKey=null;
  let lastRenderKey = null, lastRenderPlate = null;
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const compact = (navigator.deviceMemory && navigator.deviceMemory <= 4) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  const vec = (x, y, z) => new THREE.Vector3(x, y, z);
  const inferLocale = () => Object.keys(data?.locales || {}).find(key => data.locales[key].length === currentWords.length && data.locales[key].every((entry, i) => entry.text === currentWords[i])) || null;
  function visibleFallback(input) {
    const states = spatialPhraseStates(input.progress, currentWords.length).filter(state => state.visible);
    fallback.replaceChildren(...states.map(state => { const line = document.createElement('span'); line.textContent = currentWords[state.index]; return line; }));
    fallback.style.display = states.length ? 'flex' : 'none';
    canvas.style.display = 'none';
  }
  function freeGroups() {
    for (const group of groups) { scene?.remove(group); group.geometry.dispose(); group.material.dispose(); }
    groups = []; geometryBytes = 0;
  }
  function worldAt(x, y, z) {
    const ray = vec(x * 2 - 1, 1 - y * 2, .5).unproject(camera).sub(camera.position).normalize();
    return camera.position.clone().addScaledVector(ray, (z - camera.position.z) / ray.z);
  }
  function setCamera(progress) {
    camera.position.set(mix(-.32, .32, progress), mix(.12, .25, progress), mix(20.5, 19.4, progress));
    camera.lookAt(0, .05, -1.2); camera.updateMatrixWorld();
  }
  function compose() {
    if (disposed || !renderer || !data || !width || !height) return;
    lastRenderKey = null; lastRenderPlate = null;
    freeGroups();
    locale = inferLocale(); selected = data.locales[locale] || [];
    if (!selected.length) { readyState = 'fallback'; return; }
    selected.forEach((phrase, phraseIndex) => {
      const positions = [], scatters = [], bends = [], lags = [], sizes = [], coverage = [], trails = [],ribbon=[];
      for (let i = 0; i < phrase.particleCount; i++) {
        const offset = i * 3, r = n => seeded((i + phraseIndex * 200003) * 13 + n);
        const target = vec(phrase.samples[offset] / phrase.width - .5, (phrase.height / 2 - phrase.samples[offset + 1]) / phrase.width, (r(1) - .5) * .012);
        positions.push(target.x, target.y, target.z);
        scatters.push(r(2)-.5,r(3)-.5,r(4)-.5);
        bends.push(r(8) * 2 - 1, r(9) * 2 - 1, r(10) * 2 - 1);
        lags.push(r(6) * .014); sizes.push((3.8 + r(5) * .4)/phrase.width);
        coverage.push(phrase.samples[offset + 2] / 255); trails.push(0);ribbon.push(r(11));
      }
      for (let i = 0; i < phrase.particleCount; i += budget.trailStride) for (let step = 1; step <= budget.trailSamples; step++) {
        for (const array of [positions, scatters, bends]) array.push(...array.slice(i * 3, i * 3 + 3));
        lags.push(lags[i]); sizes.push(sizes[i] * .8); coverage.push(coverage[i]); trails.push(step * .009);ribbon.push(ribbon[i]);
      }
      const geometry = new THREE.BufferGeometry();
      for (const [key, array, size] of [['position', positions, 3], ['aScatter', scatters, 3], ['aBend', bends, 3], ['aLag', lags, 1], ['aSize', sizes, 1], ['aCoverage', coverage, 1], ['aTrail', trails, 1],['aRibbonT',ribbon,1]]) {
        geometry.setAttribute(key, new THREE.Float32BufferAttribute(array, size)); geometryBytes += array.length * 4;
      }
      const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, transparent: true, blending: THREE.AdditiveBlending, depthTest: true, depthWrite: false, toneMapped: false, uniforms: {
        uSource: { value: [vec(0,0,0),vec(0,0,0),vec(0,0,0),vec(0,0,0)] }, uDestination: { value: [vec(0,0,0),vec(0,0,0),vec(0,0,0),vec(0,0,0)] }, uPose: { value: new THREE.Matrix4() }, uProgress: { value: 0 },
        uPixelHeight: { value: canvas.height }, uPixelRatio: { value: renderer.getPixelRatio() }, uPresence: { value: 1 }, uGlyphScale: { value: 1 },
      } });
      const group = new THREE.Points(geometry, material); group.frustumCulled = false; group.visible = false;
      group.userData = { index: phraseIndex, text: phrase.text, glyphParticles: phrase.particleCount };
      scene.add(group); groups.push(group);
    });
    readyState = 'ready';
  }
  function resize(nextWidth, nextHeight) {
    if (width === nextWidth && height === nextHeight && lastDPR === devicePixelRatio) return;
    width = nextWidth; height = nextHeight; lastDPR = devicePixelRatio; budget = spatialBudget(width, height, lastDPR, compact, ios);
    renderer.setPixelRatio(budget.pixelRatio); renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    sampleCanvas.width = budget.maskWidth; sampleCanvas.height = Math.max(1, Math.round(budget.maskWidth * height / width));
    strandCanvas.width=budget.portrait?224:896;strandCanvas.height=Math.max(1,Math.round(strandCanvas.width*height/width));
    coreTarget.setSize(canvas.width,canvas.height);emissionTarget.setSize(Math.max(1,Math.ceil(canvas.width/2)),Math.max(1,Math.ceil(canvas.height/2)));blurTarget.setSize(emissionTarget.width,emissionTarget.height);glowTarget.setSize(emissionTarget.width,emissionTarget.height);
    depthTexture?.dispose();
    depthTexture = new THREE.DataTexture(new Uint8Array(sampleCanvas.width * sampleCanvas.height * 4), sampleCanvas.width, sampleCanvas.height, THREE.RGBAFormat);
    depthTexture.minFilter = depthTexture.magFilter = THREE.LinearFilter; depthTexture.generateMipmaps = false; depthTexture.needsUpdate = true;
    masks.forEach((mask, i) => {
      mask.material.uniforms.uMask.value = depthTexture; mask.material.uniforms.uBuffer.value.set(canvas.width, canvas.height);
      const z = [-5.2, -.45, 2.8][i]; mask.position.set(0, 0, z); mask.scale.set(100, 100, 1);
    });
    lastMaskKey = ''; compose();
  }
  function updateMask(input) {
    const key = `${input.plateKey??`${input.sceneId||input.scene}:${input.sceneTime??input.sceneFraction}`}:${width}:${height}:${input.sourceCrop?JSON.stringify(input.sourceCrop):''}:${input.strands?JSON.stringify(input.strands):''}`;
    if (input.plate === lastMaskPlate && key === lastMaskKey) return;
    lastMaskPlate = input.plate; lastMaskKey = key;currentPlateKey=input.plateKey??key;
    if (!input.plate?.width || !input.plate?.height) { components = [];registeredStrands=[];strandStatus='missing-plate'; masks.forEach(mask => { mask.visible = false; }); return; }
    try {
      sampleContext.drawImage(input.plate, 0, 0, sampleCanvas.width, sampleCanvas.height);
      const image=sampleContext.getImageData(0,0,sampleCanvas.width,sampleCanvas.height),inferred = inferBrainSilhouettes(image);
      components = inferred.components; depthTexture.image.data.set(inferred.pixels); depthTexture.needsUpdate = true; maskCount++;
      strandContext.drawImage(input.plate,0,0,strandCanvas.width,strandCanvas.height);
      registeredStrands=registerNeuralStrands(strandContext.getImageData(0,0,strandCanvas.width,strandCanvas.height),observedStrands(input,width,height),{width,height,sourceCrop:input.sourceCrop});
      strandStatus=!Number.isFinite(input.sceneTime)&&!input.strands?'awaiting-committed-PTS':registeredStrands.length>=2?(input.sceneTimeEvidence==='estimated-seeked-fallback'?'registered-current-plate-estimated-time':'registered-current-plate'):'awaiting-two-visible-strands';
      if(!plateTexture){plateTexture=new THREE.CanvasTexture(input.plate);plateTexture.colorSpace=THREE.SRGBColorSpace;plateTexture.generateMipmaps=false;plateTexture.minFilter=THREE.LinearFilter;relight.material.uniforms.uPlate.value=plateTexture;}
      plateTexture.image=input.plate;plateTexture.needsUpdate=true;
      masks.forEach(mask => { mask.visible = components.length > 0 && input.occlusion !== false; });
    } catch { components = [];registeredStrands=[];strandStatus='plate-unavailable'; masks.forEach(mask => { mask.visible = false; }); }
  }
  function poseFor(group,state,pair) {
    const source=pair.source.points.map(p=>worldAt(p.x,p.y,p.z)),destination=pair.destination.points.map(p=>worldAt(p.x,p.y,p.z));
    const midpoint=sampleStrand(source,.5),end=sampleStrand(destination,.5),origin=vec(midpoint.x,midpoint.y,midpoint.z),towards=vec(end.x,end.y,end.z).sub(origin);
    const tangent=source[3].clone().sub(source[0]).normalize(),normal=vec(-tangent.y,tangent.x,0).normalize();
    if(normal.dot(towards)<0)normal.multiplyScalar(-1);
    let readCenter=origin.clone().addScaledVector(towards,.34).addScaledVector(normal,.70);
    const readZ=[3.7,-.75,-3.3][group.userData.index%3];readCenter.z=readZ;
    const phrase=selected[group.userData.index],span=budget.portrait?.70:.36,ratio=Math.min(1,phrase.width/(budget.portrait?1020:1160));
    const perspective=20/(camera.position.z-readZ),halfW=span*ratio*perspective*.5,halfH=span*ratio*perspective*width/height*phrase.height/phrase.width*.55;
    const projected=readCenter.clone().project(camera),margin=Math.min(.48,Math.max(budget.portrait?.25:.18,halfW+.035));
    const baseX=Math.max(margin,Math.min(1-margin,projected.x*.5+.5)),baseY=Math.max(.23,Math.min(.78,.5-projected.y*.5));
    let placement=null;
    for(const dy of [0,-.075,.075,-.15,.15,-.22,.22])for(const dx of [0,-.08,.08]){
      const x=Math.max(margin,Math.min(1-margin,baseX+dx)),y=Math.max(.22+halfH,Math.min(.84-halfH,baseY+dy));
      let blocked=0;
      for(let row=0;row<5;row++)for(let col=0;col<15;col++){
        const px=Math.round((x+(col/14-.5)*halfW*2)*sampleCanvas.width),py=Math.round((y+(row/4-.5)*halfH*2)*sampleCanvas.height);
        if(px<0||py<0||px>=sampleCanvas.width||py>=sampleCanvas.height){blocked++;continue;}
        const offset=(py*sampleCanvas.width+px)*4,bytes=depthTexture.image.data,band=Math.round(bytes[offset]/85);
        if(bytes[offset+3]>100&&[-Infinity,-5.2,-.45,2.8][band]>readZ)blocked++;
      }
      const score=blocked/75*4+Math.hypot(x-baseX,y-baseY)*1.5;
      if(!placement||score<placement.score)placement={x,y,score,blocked};
    }
    readCenter=worldAt(placement.x,placement.y,readZ);
    const phase=state.phase,converge=smooth(.13,.40,phase),turn=smooth(.59,.735,phase),sign=group.userData.index%2?1:-1;
    const center=origin.clone().lerp(readCenter,converge);center.z-=turn*1.4;
    const angle=Math.atan2(tangent.y,tangent.x),rotation=[mix(sign*.24,-sign*.12,converge),mix(mix(sign*1.08,sign*.43,converge),-sign*1.18,turn),mix(angle,angle*.10,converge)];
    const quaternion=new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
    const wordWidth=2*20*Math.tan(camera.fov*Math.PI/360)*camera.aspect*span*ratio;
    return {source,destination,center,quaternion,scale:wordWidth*mix(.035,1,smooth(.11,.40,phase)),pose:{position:center.toArray(),rotation,width:wordWidth,sourceDepth:origin.z,readDepth:readZ,proxyReadOcclusion:placement.blocked/75,anchor:'derived from selected source/destination filaments; nearby proxy-clear reading gap'}};
  }
  function render(input = {}) {
    if (disposed) return;
    lastInput = { ...input };
    if (input.progress === null || !Number.isFinite(input.progress)) { lastRenderKey = null; lastRenderPlate = null; activeRecords=[];groups.forEach(group=>{group.visible=false;});canvas.style.display = fallback.style.display = 'none'; return; }
    if (!renderer || failed || readyState === 'fallback') { if (failed || readyState === 'fallback') visibleFallback(input); return; }
    const nextWidth = Math.max(1, Math.round(input.width || parent.clientWidth || innerWidth));
    const nextHeight = Math.max(1, Math.round(input.height || parent.clientHeight || innerHeight));
    // Repeated paintPhase calls for the same committed plate and story state
    // must not submit the five-pass graph again. Without a plate key we cannot
    // prove that a mutable canvas still contains the same pixels.
    const renderKey = input.plateKey == null ? null : JSON.stringify([
      input.plateKey, input.progress, nextWidth, nextHeight, devicePixelRatio,
      input.scene, input.sceneId, input.sceneFraction, input.sceneTime, input.sceneTimeEvidence,
      input.sourceCrop, input.strands, input.occlusion, input.particlesOnly, input.presence
    ]);
    if (renderKey !== null && renderKey === lastRenderKey && input.plate === lastRenderPlate && readyState === 'ready') return;
    const began = performance.now();
    resize(nextWidth, nextHeight);
    if (inferLocale() !== locale) compose();
    if (readyState !== 'ready') { visibleFallback(input); return; }
    setCamera(clamp(input.progress)); updateMask(input);
    // The inferred masks and every word use this camera's one depth buffer.
    masks.forEach(mask => { mask.quaternion.copy(camera.quaternion); mask.visible = components.length > 0 && input.occlusion !== false; });
    const states = spatialPhraseStates(input.progress, groups.length);
    activeRecords=[];const energy=new Map();let strongest=null;
    groups.forEach((group, i) => {
      const state = states[i];group.visible=false;
      if (!state.visible) return;
      const pair=selectStrandPair(registeredStrands,i);
      if(!pair){activeRecords.push({...state,text:currentWords[i],rendered:false,reason:strandStatus});return;}
      const formed=poseFor(group,state,pair),uniforms = group.material.uniforms;
      group.visible=true;group.userData.worldPose=formed.pose;
      const presence = Math.min(clamp(input.progress / .025), clamp((1 - input.progress) / .025));
      uniforms.uProgress.value = state.phase; uniforms.uPixelHeight.value = canvas.height; uniforms.uPixelRatio.value = renderer.getPixelRatio(); uniforms.uPresence.value = Number.isFinite(input.presence) ? clamp(input.presence) : presence;
      uniforms.uSource.value.forEach((point,index)=>point.copy(formed.source[index]));uniforms.uDestination.value.forEach((point,index)=>point.copy(formed.destination[index]));
      uniforms.uPose.value.compose(formed.center,formed.quaternion,vec(1,1,1));uniforms.uGlyphScale.value=formed.scale;
      const record={...state,text:currentWords[i],rendered:true,sourceStrand:pair.source,destinationStrand:pair.destination,pose:formed.pose};activeRecords.push(record);
      const life=smooth(0,.08,state.phase)*(1-smooth(.94,1,state.phase));
      const incoming=life*(.32+.68*(1-smooth(.22,.40,state.phase))),outgoing=life*(.26+.74*smooth(.75,.83,state.phase)),word=smooth(.26,.42,state.phase)*(1-smooth(.60,.74,state.phase));
      energy.set(pair.source.id,Math.max(energy.get(pair.source.id)||0,incoming));energy.set(pair.destination.id,Math.max(energy.get(pair.destination.id)||0,outgoing));
      if(!strongest||word>strongest.word)strongest={pair,center:formed.center,word,presence};
    });
    // Diagnostic witness toggles depth without altering plate or particle input.
    if (input.occlusion === false) masks.forEach(mask => { mask.visible = false; });
    if(!strongest){canvas.style.display=fallback.style.display='none';return;}
    const light=relight.material.uniforms,aspect=canvas.width/canvas.height;
    relight.visible=input.particlesOnly!==true;
    for(const [key,path] of [['uSource',strongest.pair.source],['uDestination',strongest.pair.destination]])light[key].value.forEach((point,index)=>point.set(path.points[index].x*aspect,path.points[index].y));
    const screen=strongest.center.clone().project(camera);light.uWord.value.set((screen.x*.5+.5)*aspect,.5-screen.y*.5);light.uEnergy.value.set(energy.get(strongest.pair.source.id)||0,energy.get(strongest.pair.destination.id)||0,strongest.word*.48);light.uPresence.value=strongest.presence;light.uBuffer.value.set(canvas.width,canvas.height);
    canvas.style.display = 'block'; fallback.style.display = 'none';
    // Every pass samples this same committed state. The first target owns the
    // linear scene; only glyph emission enters the low-resolution blur.
    renderer.setRenderTarget(coreTarget);renderer.render(scene,camera);
    const backgroundVisible=relight.visible;relight.visible=false;
    masks.forEach(mask=>mask.material.uniforms.uBuffer.value.set(emissionTarget.width,emissionTarget.height));
    groups.forEach(group=>{group.material.uniforms.uPixelHeight.value=emissionTarget.height;group.material.uniforms.uPixelRatio.value=renderer.getPixelRatio()*.5;});
    renderer.setRenderTarget(emissionTarget);renderer.render(scene,camera);
    relight.visible=backgroundVisible;
    masks.forEach(mask=>mask.material.uniforms.uBuffer.value.set(canvas.width,canvas.height));
    groups.forEach(group=>{group.material.uniforms.uPixelHeight.value=canvas.height;group.material.uniforms.uPixelRatio.value=renderer.getPixelRatio();});
    screenQuad.material=blurMaterial;blurMaterial.uniforms.uInput.value=emissionTarget.texture;blurMaterial.uniforms.uStep.value.set(1/emissionTarget.width,0);
    renderer.setRenderTarget(blurTarget);renderer.render(screenScene,screenCamera);
    blurMaterial.uniforms.uInput.value=blurTarget.texture;blurMaterial.uniforms.uStep.value.set(0,1/emissionTarget.height);
    renderer.setRenderTarget(glowTarget);renderer.render(screenScene,screenCamera);
    screenQuad.material=compositeMaterial;compositeMaterial.uniforms.uCore.value=coreTarget.texture;compositeMaterial.uniforms.uGlow.value=glowTarget.texture;compositeMaterial.uniforms.uGlowGain.value=.90;
    renderer.setRenderTarget(null);renderer.render(screenScene,screenCamera);
    renderCount++; lastCPUms = performance.now() - began;
    lastRenderKey = renderKey; lastRenderPlate = input.plate;
  }
  function setWords(nextWords) {
    if(disposed)return;
    if (nextWords.length === currentWords.length && nextWords.every((word, i) => word === currentWords[i])) return;
    currentWords = [...nextWords]; lastRenderKey = null; lastRenderPlate = null; if (renderer && data) compose();
  }
  function contextLost(event) { event.preventDefault(); lastRenderKey = null; lastRenderPlate = null; failed = true; readyState = 'context-lost'; visibleFallback(lastInput); }
  function contextRestored() { if (disposed) return; lastRenderKey = null; lastRenderPlate = null; failed = false; compose(); lastMaskKey = ''; onReady(); }
  canvas.addEventListener('webglcontextlost', contextLost); canvas.addEventListener('webglcontextrestored', contextRestored);
  const ready = loadAssets().then(([runtime, catalog]) => {
    if (disposed) return;
    THREE = runtime; data = catalog;
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !ios, preserveDrawingBuffer: true, powerPreference: compact || ios ? 'low-power' : 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0x000000, 0);
    const targetType=renderer.extensions.has('EXT_color_buffer_float')?THREE.HalfFloatType:THREE.UnsignedByteType;
    const target=depthBuffer=>{const value=new THREE.WebGLRenderTarget(1,1,{type:targetType,depthBuffer,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:false});value.texture.colorSpace=THREE.LinearSRGBColorSpace;return value;};
    coreTarget=target(true);emissionTarget=target(true);blurTarget=target(false);glowTarget=target(false);
    blurMaterial=new THREE.ShaderMaterial({vertexShader:screenVertex,fragmentShader:blurFragment,depthTest:false,depthWrite:false,toneMapped:false,uniforms:{uInput:{value:null},uStep:{value:new THREE.Vector2()}}});
    compositeMaterial=new THREE.ShaderMaterial({vertexShader:screenVertex,fragmentShader:compositeFragment,depthTest:false,depthWrite:false,toneMapped:false,uniforms:{uCore:{value:null},uGlow:{value:null},uGlowGain:{value:.9}}});
    screenScene=new THREE.Scene();screenCamera=new THREE.Camera();screenQuad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),compositeMaterial);screenQuad.frustumCulled=false;screenScene.add(screenQuad);
    scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(43, 1, .1, 100);
    relight=new THREE.Mesh(new THREE.PlaneGeometry(2,2),new THREE.ShaderMaterial({vertexShader:relightVertex,fragmentShader:relightFragment,depthTest:false,depthWrite:false,toneMapped:false,uniforms:{uPlate:{value:null},uBuffer:{value:new THREE.Vector2(1,1)},uSource:{value:[new THREE.Vector2(),new THREE.Vector2(),new THREE.Vector2(),new THREE.Vector2()]},uDestination:{value:[new THREE.Vector2(),new THREE.Vector2(),new THREE.Vector2(),new THREE.Vector2()]},uWord:{value:new THREE.Vector2()},uEnergy:{value:new THREE.Vector3()},uPresence:{value:0}}}));
    relight.frustumCulled=false;relight.renderOrder=-20;scene.add(relight);
    sampleCanvas = document.createElement('canvas'); sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
    strandCanvas=document.createElement('canvas');strandContext=strandCanvas.getContext('2d',{willReadFrequently:true});
    if (!sampleContext||!strandContext) throw Error('Plate analysis canvas unavailable');
    masks = [1, 2, 3].map(band => {
      const material = new THREE.ShaderMaterial({ vertexShader: depthVertex, fragmentShader: depthFragment, depthTest: true, depthWrite: true, colorWrite: false, uniforms: { uMask: { value: null }, uBuffer: { value: new THREE.Vector2(1, 1) }, uBand: { value: band / 3 } } });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material); plane.frustumCulled = false; plane.renderOrder = -1; scene.add(plane); return plane;
    });
    readyState = 'ready'; onReady();
  }).catch(() => { if (disposed) return; failed = true; readyState = 'fallback'; visibleFallback(lastInput); onReady(); });
  function debug() {
    return { revision: 'spatial-thoughts-strand-2', seed: SEED, three: THREE?.REVISION, state: readyState, disposed, locale, progress: lastInput.progress, plateKey:currentPlateKey,sourceCrop:lastInput.sourceCrop||null,renderCount, maskCount, lastCPUms, budget, viewport: [width, height], drawingBuffer: [canvas.width, canvas.height], geometryBytes,
      active:activeRecords,registeredStrands,strandStatus,composite:lastInput.particlesOnly?'particles-only':'plate+local-relight+particles',lifecycle:{incoming:[.08,.38],read:[.40,.59],collapse:[.60,.74],teleport:[.74,.80],destination:[.80,1],partition:7/11,filamentHandoff:4/11,maxPopulations:2},
      glyphParticles: groups.reduce((sum, group) => sum + group.userData.glyphParticles, 0), renderedParticles: groups.filter(group => group.visible).reduce((sum, group) => sum + group.geometry.attributes.position.count, 0),
      inferredBrainComponents: components.map(({ x, y, width: w, height: h, band, count }) => ({ x, y, width: w, height: h, band, count })),
      occlusion: 'Presented-plate luminous connected silhouettes; apparent-size depth is inferred, not metric or tracked.',relighting:'Local luminance-preserving RGB hue proxy near selected current-plate cable pixels and particle energy; not physical scene light transport.',depthTest: groups.every(group => group.material.depthTest), depthWrite: false,bloom:{type:'same-state half-resolution emissive Gaussian blur',passes:2,output:'single linear composite to sRGB',targetType:coreTarget?.texture.type},clock: 'parent-presented-progress',
      phrases: selected.map(({ id, text, stringSHA256, maskSHA256, particleCount }) => ({ id, text, stringSHA256, maskSHA256, particleCount })),
    };
  }
  function dispose() {
    if (disposed) return; disposed = true; readyState = 'disposed';
    canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
    freeGroups(); masks.forEach(mask => { mask.geometry.dispose(); mask.material.dispose(); });relight?.geometry.dispose();relight?.material.dispose();plateTexture?.dispose(); depthTexture?.dispose();
    [coreTarget,emissionTarget,blurTarget,glowTarget].forEach(target=>target?.dispose());screenQuad?.geometry.dispose();blurMaterial?.dispose();compositeMaterial?.dispose();renderer?.dispose();
    if (sampleCanvas) sampleCanvas.width = sampleCanvas.height = 1;if(strandCanvas)strandCanvas.width=strandCanvas.height=1;canvas.width=canvas.height=1; canvas.remove(); fallback.remove();
    components = [];registeredStrands=[];activeRecords=[];strandStatus='disposed';currentPlateKey=null; lastInput = { progress: null }; lastMaskPlate = null; lastRenderKey = null; lastRenderPlate = null;
  }
  return { setWords, render, dispose, debug, ready, canvas };
}
