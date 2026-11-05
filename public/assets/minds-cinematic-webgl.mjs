import '/creator-print-placement.js';
import * as THREE from '/vendor/three/three.module.js';

// Optional visual layer. Atlas segments retain the photographic identities;
// artwork and shop destinations remain ordinary HTML links.
export function createCinematic({ canvas, arts, links, requestRender, onAssetError }) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: innerWidth > 700, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 700 ? 1 : 1.5));
  renderer.setClearColor(0x071820, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.set(0, 0, 18);
  const objects = [], textures = [];
  const add = o => { scene.add(o); objects.push(o); return o; };
  const loader = new THREE.TextureLoader();
  const texture = (url, onLoad) => { const t = loader.load(url, loaded => { onLoad?.(loaded); requestRender?.(); }, undefined, () => onAssetError?.()); t.colorSpace = THREE.SRGBColorSpace; textures.push(t); return t; };
  const atlas = loader.load('/design-assets/creators-atlas-20261105.png', () => {
    people.forEach(person => person.maps.forEach(map => { map.image = atlas.image; map.needsUpdate = true; }));
    requestRender?.();
  }, undefined, () => onAssetError?.());
  atlas.colorSpace = THREE.SRGBColorSpace; textures.push(atlas);
  const material = (color, opacity = 1) => new THREE.MeshBasicMaterial({color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide});
  const plane = (w,h,mat) => new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  // Each image strip is independently staged. These are photographic cutouts, not a skeletal rig.
  const people = Array.from({length:8}, (_, i) => {
    const group = add(new THREE.Group());
    group.position.set((i-3.5)*1.6625,-1.65,1);
    const maps = [0,1].map(row => {
      const map = atlas.clone(); map.repeat.set(1/8,.5); map.offset.set(i/8,row ? 0 : .5);
      textures.push(map); return map;
    });
    const poses = maps.map(map => {
      const mesh = plane(13.3/8,3.33,new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
      group.add(mesh); return mesh;
    });
    return {group, maps, poses};
  });
  const starsGeometry = new THREE.BufferGeometry();
  const positions = []; let seed = 4615;
  const rand = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const count = innerWidth < 700 ? 450 : 1000;
  for (let i=0;i<count;i++) { const a=rand()*Math.PI*2, r=2+rand()*12; positions.push(Math.cos(a)*r, (rand()-.5)*9, Math.sin(a)*r-4); }
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
  const stars = add(new THREE.Points(starsGeometry,new THREE.PointsMaterial({color:0xcce7d8,size:.035,transparent:true,opacity:.7,depthWrite:false})));
  // The same scroll clock draws ideas into a central light before the DNA appears.
  const ideaPositions = new Float32Array(72 * 3);
  const ideaGeometry = new THREE.BufferGeometry();
  ideaGeometry.setAttribute('position',new THREE.BufferAttribute(ideaPositions,3));
  const ideas = add(new THREE.Points(ideaGeometry,new THREE.PointsMaterial({color:0xffdfa1,size:.11,transparent:true,opacity:0,depthWrite:false})));
  const glow = add(plane(5,5,new THREE.MeshBasicMaterial({color:0xffe4ad,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending})));
  glow.position.z=-2;
  const helix = new THREE.Group(); add(helix);
  // Batch the helix into two draw calls, and stop submitting it after the handoff.
  const rungs = [], dots = [];
  for(let i=0;i<60;i++) {
    const y=(i-30)*.14, a=i*.32, x=Math.sin(a)*1.05, z=Math.cos(a)*1.05;
    rungs.push(x,y,z,-x,y,-z); dots.push(x,y,z,-x,y,-z);
  }
  const rungGeometry = new THREE.BufferGeometry(); rungGeometry.setAttribute('position',new THREE.Float32BufferAttribute(rungs,3));
  const dotGeometry = new THREE.BufferGeometry(); dotGeometry.setAttribute('position',new THREE.Float32BufferAttribute(dots,3));
  helix.add(new THREE.LineSegments(rungGeometry,new THREE.LineBasicMaterial({color:0x8cc7c3,transparent:true,opacity:.7})));
  helix.add(new THREE.Points(dotGeometry,new THREE.PointsMaterial({color:0xf4d89b,size:.09,transparent:true,opacity:.8,depthWrite:false})));
  // A soft gallery wall appears behind the figures as their work takes shape.
  const wall = add(plane(23,12,new THREE.MeshBasicMaterial({color:0xede7d8,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide})));
  wall.position.set(0,0,-5);
  const emergenceTrails = [];
  for(let i=0;i<8;i++) {
    const x=(i-3.5)*1.66;
    const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,-2),new THREE.Vector3(x,-1.3,1)]),new THREE.LineBasicMaterial({color:0xb8e6da,transparent:true,opacity:0,depthWrite:false}));
    add(line); emergenceTrails.push(line);
  }
  const frames = [], beams = [], shirtArts = [];
  const particlePositions = new Float32Array(8 * 12 * 3);
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
  const particles = add(new THREE.Points(particleGeometry,new THREE.PointsMaterial({color:0xffdfa1,size:.065,transparent:true,opacity:0,depthWrite:false})));
  arts.forEach((art,i) => {
    const x=(i-3.5)*1.65, y=1.5+(i%2)*.15, z=-1.5-Math.abs(i-3.5)*.18;
    const group=new THREE.Group(); group.position.set(x,y,z); group.rotation.y=-x*.018; scene.add(group); objects.push(group);
    const border=plane(1.22,1.55,material(0xd7bd7c)); group.add(border);
    const paper=plane(1.13,1.46,material(0xf7f2e5)); paper.position.z=.01;group.add(paper);
    let image, shirt;
    const placement=globalThis.SFICreatorPrintPlacement(i), unit=3.33/444;
    const artTexture = texture(art.src, loaded => {
      const aspect = loaded.image.width / loaded.image.height;
      if (aspect > 1.04 / 1.36) image.scale.y = (1.04 / aspect) / 1.36;
      else image.scale.x = (1.36 * aspect) / 1.04;
      if (aspect > placement.width / placement.height) shirt.scale.y = (placement.width / aspect) / placement.height;
      else shirt.scale.x = (placement.height * aspect) / placement.width;
    });
    image=plane(1.04,1.36,new THREE.MeshBasicMaterial({map:artTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide})); image.position.z=.02;image.userData.index=i;group.add(image);
    frames.push({group,image});
    const printGroup=new THREE.Group(); people[i].group.add(printGroup);
    shirt=plane(placement.width*unit,placement.height*unit,new THREE.MeshBasicMaterial({map:artTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    shirt.position.set((placement.center-111)*unit, 1.665-(placement.top+placement.height/2)*unit, .02); printGroup.add(shirt);
    const signatureCanvas=document.createElement('canvas');signatureCanvas.width=512;signatureCanvas.height=64;
    const signatureContext=signatureCanvas.getContext('2d');
    const artist=art.artistName || 'Innsatt 2601-46';
    signatureContext.fillStyle='#111';signatureContext.textAlign='center';signatureContext.textBaseline='middle';signatureContext.font='bold 38px Arial';
    signatureContext.fillText(artist==='Innsatt 2601-46'?'Innsatt 260146':artist,256,32,500);
    const signatureTexture=new THREE.CanvasTexture(signatureCanvas);signatureTexture.colorSpace=THREE.SRGBColorSpace;textures.push(signatureTexture);
    const signature=plane(54*unit,9*unit,new THREE.MeshBasicMaterial({map:signatureTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    signature.position.set((placement.center-111)*unit,1.665-(placement.top+placement.height+7)*unit,.021);printGroup.add(signature);
    shirtArts.push({group:printGroup,shirt,signature});
    const beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,-.8,1),new THREE.Vector3(x,y,z)]),new THREE.LineBasicMaterial({color:0xffdc99,transparent:true,opacity:0})); add(beam);beams.push(beam);
  });
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
  function click(event) {
    const rect=canvas.getBoundingClientRect(); pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera); const hit=raycaster.intersectObjects(frames.map(f=>f.image))[0];
    if(hit && frames[hit.object.userData.index].group.visible) links[hit.object.userData.index]?.click();
  }
  canvas.addEventListener('click',click);
  const clamp = n => Math.max(0,Math.min(1,n));
  const smooth = n => {const t=clamp(n);return t*t*(3-2*t);};
  function render(p,phase) {
    const emerge=smooth((p-.22)/.18), turn=smooth((p-.52)/.14), light=smooth((p-.72)/.22);
    const gathering=1-smooth((p-.04)/.12), dnaIn=smooth((p-.055)/.12);
    ideas.visible=gathering>.001; ideas.material.opacity=gathering*.8;
    if (ideas.visible) { for (let i=0;i<72;i++) { const a=i*2.399+phase*.12,r=(2+(i%12)*.52)*(1-smooth(p/.13))+.1; ideaPositions[i*3]=Math.cos(a)*r;ideaPositions[i*3+1]=Math.sin(a)*r*.55;ideaPositions[i*3+2]=-2; } ideaGeometry.attributes.position.needsUpdate=true; }
    glow.material.opacity=Math.sin(smooth(p/.17)*Math.PI)*.13; glow.visible=glow.material.opacity>.001;
    camera.position.x=Math.sin(p*Math.PI)*.55; camera.position.z=18-p*1.2; camera.lookAt(0,0,0);
    stars.rotation.y=phase*.012+p*.22;
    const galleryReveal=smooth((p-.68)/.28);
    wall.material.opacity=galleryReveal*.95; wall.visible=galleryReveal>.001;
    stars.material.opacity=.7*(1-galleryReveal*.85);
    emergenceTrails.forEach((line,i)=>{
      line.material.opacity=Math.sin(emerge*Math.PI)*(.16+(i%2)*.07);
      line.visible=line.material.opacity>.001;
    });
    helix.rotation.y=phase*.18+p*2; helix.scale.setScalar(1+emerge*.3);
    helix.visible=emerge<.999 && dnaIn>.001;
    helix.children.forEach(o=>{o.material.opacity=dnaIn*(1-emerge)*.8;});
    // Individual activity shares one exact turn clock, then one unity and light clock.
    people.forEach(({group,poses},i)=>{
      const individualTurn=turn;
      const activity=Math.sin(phase*(.8+i*.06)+i*1.7)*.018;
      group.position.z=1+emerge*.5;
      group.position.y=-1.65 + activity*emerge*(1-individualTurn);
      group.rotation.z=activity*.55*emerge*(1-individualTurn);
      group.rotation.y=Math.sin(individualTurn*Math.PI)*(.12+(i%3)*.025);
      const frontVisibility=1-smooth((individualTurn-.25)/.30);
      const backVisibility=smooth((individualTurn-.45)/.30);
      poses[0].material.opacity=emerge*frontVisibility*(1-light);
      poses[1].material.opacity=emerge*backVisibility*(1-light);
      poses[0].scale.x=1-individualTurn*.42;
      poses[1].scale.x=.58+individualTurn*.42;
      poses.forEach(o=>{o.visible=o.material.opacity>.001;});
      shirtArts[i].group.scale.x=poses[1].scale.x;
      [shirtArts[i].shirt,shirtArts[i].signature].forEach(o=>{o.material.opacity=emerge*backVisibility*(1-light);o.visible=o.material.opacity>.001;});
    });
    frames.forEach(({group},i)=>{group.visible=emerge>.01; group.position.y=1.5+(i%2)*.15+light*.35; group.children.forEach(o=>o.material.opacity=emerge*(.22+.78*light));});
    beams.forEach(b=>{b.material.opacity=Math.sin(light*Math.PI)*.35;});
    particles.visible=light>.001 && light<.999;
    particles.material.opacity=Math.sin(light*Math.PI)*.85;
    if (particles.visible) {
      for (let i=0;i<8;i++) for (let j=0;j<12;j++) {
        const t=clamp(light*1.28-j*.022), x=(i-3.5)*1.65;
        const k=(i*12+j)*3;
        particlePositions[k]=x+Math.sin(j*2.4+i)*.23*(1-t);
        particlePositions[k+1]=-1.05+(2.55+(i%2)*.15)*t;
        particlePositions[k+2]=1.5+(-3-Math.abs(i-3.5)*.18)*t;
      }
      particleGeometry.attributes.position.needsUpdate=true;
    }
    renderer.render(scene,camera);
  }
  function resize(w,h) {if(!w||!h)return; camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
  function dispose() {
    canvas.removeEventListener('click',click);
    scene.traverse(o=>{o.geometry?.dispose(); if(Array.isArray(o.material))o.material.forEach(m=>m.dispose()); else o.material?.dispose();});
    textures.forEach(t=>t.dispose()); renderer.dispose();
  }
  return {render,resize,dispose};
}
