import * as THREE from './vendor/three/three.module.js';
import {floorRayTarget,teleportRigPosition,bindXRController} from './gallery-locomotion.mjs';

// A deliberately still, on-demand room: the artwork is never cropped or repainted.
export function createRoom(host, items, {en, onOpen, onExit, initialIndex=0}) {
 const t=(no,english)=>en?english:no;
 const wrap=document.createElement('section');wrap.className='gw-room';wrap.setAttribute('aria-label',t('Tredimensjonalt kunstrom','Three-dimensional art room'));
 wrap.innerHTML=`<div class="gw-top"><div><p class="gw-kicker">${t('KUNSTROMMET','THE ART ROOM')}</p><h2>${t('Se kunsten i et rom','See the art in a room')}</h2></div><button type="button" class="gw-exit">${t('Forlat rommet','Exit room')}</button></div><p class="gw-help">${t('Velg verk med venstre/høyre pil eller sveip. Home/End velger første/siste verk; Enter åpner bildet, og Escape går ut. I VR kan du se deg rundt og peke på et verk med kontrolleren. Valgfri teleportering i VR: slå den på før du går inn, pek på et gyldig gulvpunkt og trykk for ett hopp.','Choose artwork with left/right arrows or a swipe. Home/End select the first/last work; Enter opens it, and Escape exits. In VR, look around and point at a work with the controller. Optional VR teleportation: enable it before entering, point at a valid floor position and press for one jump.')}</p><div class="gw-scene" tabindex="0" role="region" aria-label="${t('Kunstrom. Venstre/høyre velger verk. Home/End velger første/siste. Enter åpner bildet; Escape går ut.','Art room. Left/right select artwork. Home/End select first/last. Enter opens it; Escape exits.')}" aria-describedby="gw-status"></div><div class="gw-controls"><button type="button" class="gw-prev" aria-label="${t('Forrige kunstverk','Previous artwork')}">←</button><div id="gw-status" role="status" aria-live="polite"></div><button type="button" class="gw-next" aria-label="${t('Neste kunstverk','Next artwork')}">→</button><button type="button" class="gw-open">${t('Se hele bildet ↗','Open full artwork ↗')}</button></div>`;
 const sceneEl=wrap.querySelector('.gw-scene'),status=wrap.querySelector('#gw-status'),prev=wrap.querySelector('.gw-prev'),next=wrap.querySelector('.gw-next');
 let renderer;
 try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});} catch {throw new Error('WebGL unavailable')}
 renderer.localClippingEnabled=true;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;sceneEl.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xddd6c8);
 const camera=new THREE.PerspectiveCamera(55,1,.1,100);camera.position.set(0,1.85,8.6);camera.lookAt(0,2.15,0);
 const rig=new THREE.Group();scene.add(rig);rig.add(camera);
 const mat=(color)=>new THREE.MeshBasicMaterial({color}),teleportSurfaces=[];
 function plane(w,h,color,x,y,z,rotation=0){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat(color));mesh.position.set(x,y,z);mesh.rotation.y=rotation;scene.add(mesh);teleportSurfaces.push(mesh);return mesh}
 plane(19,5.5,0xe5dfd2,0,2.75,-2);const floor=plane(17,14,0xafa797,0,0,2);floor.rotation.x=-Math.PI/2;floor.userData.teleportFloor=true;
 plane(14,5.5,0xc9c0b0,-9,2.75,5,Math.PI/2);plane(14,5.5,0xc9c0b0,9,2.75,5,-Math.PI/2);
 plane(19,.12,0xaaa092,0,.12,-1.98);plane(19,.08,0xf4ede0,0,4.9,-1.98);
 // A still star-lit ceiling and a small sculptural installation evoke a shared room
 // without adding animation, external assets, or covering the selected artwork.
 const ceiling=new THREE.Mesh(new THREE.CircleGeometry(3.55,64),mat(0x172028));ceiling.rotation.x=Math.PI/2;ceiling.position.set(0,5.05,.6);scene.add(ceiling);
 for(const [radius,tube,color] of [[3.58,.09,0xc3a16c],[3.78,.035,0xf2e1bf]]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,tube,8,96),mat(color));ring.rotation.x=Math.PI/2;ring.position.set(0,5,.6);scene.add(ring)}
 const stars=[];for(let i=0;i<240;i++){const a=i*2.399963,r=3.42*Math.sqrt((i+.5)/240);stars.push(Math.cos(a)*r,5.035,.6+Math.sin(a)*r)}const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));scene.add(new THREE.Points(starGeometry,new THREE.PointsMaterial({color:0xe5d4b6,size:.035,sizeAttenuation:true})));
 const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.75,.78,.32,48),mat(0xd5cec0));plinth.position.set(2.25,.16,.9);scene.add(plinth);teleportSurfaces.push(plinth);
 const sculptureBlocker=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,3.9,16),new THREE.MeshBasicMaterial({visible:false}));sculptureBlocker.position.set(2.25,1.95,.9);scene.add(sculptureBlocker);teleportSurfaces.push(sculptureBlocker);
 const helix=[];for(let i=0;i<850;i++){const u=i/849,angle=u*Math.PI*9,spread=.10+.45*Math.sin(Math.PI*u);helix.push(2.25+Math.cos(angle)*spread,.27+u*3.6,.9+Math.sin(angle)*spread)}const helixGeometry=new THREE.BufferGeometry();helixGeometry.setAttribute('position',new THREE.Float32BufferAttribute(helix,3));const fallbackSculpture=new THREE.Points(helixGeometry,new THREE.PointsMaterial({color:0xd3aa70,size:.045,sizeAttenuation:true}));scene.add(fallbackSculpture);
 scene.add(new THREE.HemisphereLight(0xfff6e4,0x8c8375,2));const keyLight=new THREE.DirectionalLight(0xffe4b1,2.6);keyLight.position.set(-2,6,5);scene.add(keyLight);
 const group=new THREE.Group();scene.add(group);let index=Math.max(0,Math.min(items.length-1,initialIndex)),active=true,token=0,down=null;const loader=new THREE.TextureLoader(),ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function disposeObject(object){object.traverse(obj=>{obj.geometry?.dispose();for(const material of (Array.isArray(obj.material)?obj.material:[obj.material]))if(material){for(const value of Object.values(material))if(value?.isTexture)value.dispose();material.dispose()}})}
 // Load only after entering the room. Keep the procedural sculpture if loading fails.
 import('./vendor/three/GLTFLoader.js').then(({GLTFLoader})=>new GLTFLoader().load('/design-assets/dna-sculpture-trellis2.glb',gltf=>{const model=gltf.scene;if(!active){disposeObject(model);return}const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3());if(!Number.isFinite(size.y)||size.y<.00001){disposeObject(model);return}const scale=3.3/size.y;model.scale.setScalar(scale);const scaledBox=new THREE.Box3().setFromObject(model),center=scaledBox.getCenter(new THREE.Vector3());model.position.set(2.25-center.x,.23-scaledBox.min.y,.9-center.z);model.traverse(obj=>{if(obj.material){for(const material of (Array.isArray(obj.material)?obj.material:[obj.material])){material.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,1,0),-.32)];material.needsUpdate=true}}});scene.remove(fallbackSculpture);disposeObject(fallbackSculpture);scene.add(model);sceneEl.dataset.sculpture='trellis2';render()},undefined,()=>{sceneEl.dataset.sculpture='fallback'})).catch(()=>{if(active)sceneEl.dataset.sculpture='fallback'});
 function render(){if(session&&teleportToggle.checked)updateTeleportTargets();else hideTeleportTargets();if(active&&(renderer.xr.isPresenting||!document.hidden)&&!renderer.getContext().isContextLost())renderer.render(scene,camera)}
 function resize(){if(!active)return;const rect=sceneEl.getBoundingClientRect();if(!rect.width||!rect.height)return;renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();render()}
 function clear(){group.traverse(obj=>{obj.geometry?.dispose();if(obj.material){obj.material.map?.dispose();obj.material.dispose()}});group.clear()}
 // A physical plaque sits beneath each frame, leaving the artwork itself unobscured.
 function caption(entry,parent){const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f3e9';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#342d28';ctx.lineWidth=10;ctx.strokeRect(5,5,canvas.width-10,canvas.height-10);ctx.fillStyle='#211d19';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 112px sans-serif';ctx.fillText(en?entry.en:entry.no,768,112,1440);ctx.font='72px sans-serif';ctx.fillText(entry.artistName||'Innsatt 2601-46',768,232,1440);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();const plaque=new THREE.Mesh(new THREE.PlaneGeometry(3.65,.65),new THREE.MeshBasicMaterial({map:texture}));plaque.position.set(0,.345,.22);parent.add(plaque)}
 function draw(){const current=++token;clear();const item=items[index];status.textContent=`${index+1} / ${items.length} — ${en?item.en:item.no} · ${en?'AI-assisted':'KI-assistert'} · ${item.artistName||'Innsatt 2601-46'}`;prev.disabled=index===0;next.disabled=index===items.length-1;
  const spatial=renderer.xr.isPresenting&&items.length<=6;
  const positions=[[-5.25,-2,0],[0,-2,0],[5.25,-2,0],[-9,0,Math.PI/2],[-9,5,Math.PI/2],[9,2,-Math.PI/2]];
  const visible=spatial?items.map((_,i)=>i):[-1,0,1].map(offset=>index+offset).filter(i=>items[i]);
  for(const itemIndex of visible){const entry=items[itemIndex];const [x,z,angle]=spatial?positions[itemIndex]:[(itemIndex-index)*5.25,-2,0];const display=new THREE.Group();display.position.set(x,0,z);display.rotation.y=angle;group.add(display);const frame=new THREE.Mesh(new THREE.PlaneGeometry(3.65,4.05),mat(spatial&&itemIndex===index?0xb48a4b:0x342d28));frame.position.set(0,2.48,.12);display.add(frame);const mount=new THREE.Mesh(new THREE.PlaneGeometry(3.45,3.85),mat(0xf7f3e9));mount.position.set(0,2.48,.15);display.add(mount);caption(entry,display);
   loader.load(entry.src,texture=>{if(!active||current!==token){texture.dispose();return}texture.colorSpace=THREE.SRGBColorSpace;const ratio=texture.image.width/texture.image.height;let w=3.22,h=3.62;if(w/h>ratio)w=h*ratio;else h=w/ratio;const artwork=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}));artwork.position.set(0,2.48,.18);artwork.userData.index=itemIndex;display.add(artwork);render()},undefined,()=>{});
  }render()}
 function step(delta){index=Math.max(0,Math.min(items.length-1,index+delta));draw()}
 function open(){onOpen(items[index]);}
 // WebXR is offered only after the browser confirms immersive VR support.
 let session=null, starting=false;
 const vrButton=document.createElement('button');vrButton.type='button';vrButton.className='gw-vr';vrButton.textContent=t('Gå inn i VR','Enter VR');
 const vrMessage=document.createElement('p');vrMessage.className='gw-vr-message';vrMessage.setAttribute('role','status');
 const vrHelp=t('VR krever en støttet nettleser og tilkoblet VR-utstyr. Du kan også bruke rommet her uten VR.','VR requires a supported browser and connected VR equipment. You can also use the room here without VR.');
 vrMessage.textContent=vrHelp;wrap.append(vrMessage);
 const controllerRay=new THREE.Raycaster(),direction=new THREE.Vector3(),origin=new THREE.Vector3(),rotation=new THREE.Matrix4(),viewer=new THREE.Vector3();
 const teleportLabel=document.createElement('label');teleportLabel.className='gw-teleport-label';
 const teleportToggle=document.createElement('input');teleportToggle.type='checkbox';teleportToggle.className='gw-teleport-toggle';
 teleportLabel.append(teleportToggle,document.createTextNode(t('Valgfri teleportering i VR','Optional VR teleportation')));
 const controllers=[];
 function hideTeleportTargets(){for(const entry of controllers)entry.target.visible=false;}
 function controllerHit(controller){
  rotation.identity().extractRotation(controller.matrixWorld);origin.setFromMatrixPosition(controller.matrixWorld);direction.set(0,0,-1).applyMatrix4(rotation);controllerRay.set(origin,direction);
  // Bounded room/collision geometry avoids raycasting the detailed sculpture every XR frame.
  // The nearest surface must be the floor: do not jump through a frame or sculpture proxy.
  const hit=controllerRay.intersectObjects(teleportSurfaces.concat(group.children),true).find(x=>x.object.isMesh);
  if(!hit?.object.userData.teleportFloor)return {hit,target:null};
  return {hit,target:floorRayTarget(origin,direction)};
 }
 function updateTeleportTargets(){
  scene.updateMatrixWorld(true);
  for(const entry of controllers){const target=entry.connected?controllerHit(entry.controller).target:null;entry.target.visible=Boolean(target);if(target)entry.target.position.set(target.x,.015,target.z);}
 }
 [0,1].forEach(i=>{
  const controller=renderer.xr.getController(i),line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0),new THREE.Vector3(0,0,-12)]),new THREE.LineBasicMaterial({color:0xffffff}));controller.add(line);
  const target=new THREE.Mesh(new THREE.RingGeometry(.13,.2,32),new THREE.MeshBasicMaterial({color:0x287d51,side:THREE.DoubleSide}));target.rotation.x=-Math.PI/2;target.visible=false;scene.add(target);
  const entry={controller,target,connected:false};controllers.push(entry);
  entry.connectedHandler=()=>{entry.connected=true};entry.disconnectedHandler=()=>{entry.connected=false;target.visible=false};
  entry.selectHandler=()=>{
   if(!active||!session||!entry.connected)return;
   scene.updateMatrixWorld(true);const {hit,target}=controllerHit(controller);
   if(hit&&Number.isInteger(hit.object.userData.index)){if(hit.object.userData.index!==index){index=hit.object.userData.index;draw()}return;}
   if(!target||!teleportToggle.checked)return;
   renderer.xr.getCamera().getWorldPosition(viewer);
   const destination=teleportRigPosition({enabled:teleportToggle.checked,rig:rig.position,viewer,target});
   if(destination){rig.position.set(destination.x,destination.y,destination.z);hideTeleportTargets();}
  };
  entry.detach=bindXRController(controller,{onSelect:entry.selectHandler,onConnected:entry.connectedHandler,onDisconnected:entry.disconnectedHandler});rig.add(controller);
 });
 teleportToggle.addEventListener('change',()=>{hideTeleportTargets();render()});
 function restoreXR(){session=null;hideTeleportTargets();teleportToggle.checked=false;renderer.setAnimationLoop(null);rig.position.set(0,0,0);camera.position.set(0,1.85,8.6);camera.lookAt(0,2.15,0);vrButton.disabled=false;vrButton.textContent=t('Gå inn i VR','Enter VR');vrMessage.textContent=vrHelp;queueMicrotask(()=>{if(active&&!session){draw();resize()}})}
 async function enterXR(){if(!active||starting||session)return;starting=true;vrButton.disabled=true;let requested;
  try{requested=await navigator.xr.requestSession('immersive-vr',{requiredFeatures:['local-floor']});if(!active){await requested.end();return}session=requested;requested.addEventListener('end',restoreXR,{once:true});renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local-floor');const gl=renderer.getContext();if(gl.makeXRCompatible)await gl.makeXRCompatible();if(!active||session!==requested){await requested.end();return}rig.position.set(0,0,6.5);camera.position.set(0,0,0);camera.rotation.set(0,0,0);await renderer.xr.setSession(requested);if(!active||session!==requested){await requested.end();return}draw();renderer.setAnimationLoop(render);vrButton.disabled=false;vrButton.textContent=t('Avslutt VR','Exit VR');vrMessage.textContent=t('Pek og trykk for å velge et verk. Hvis teleportering er slått på: pek på gulvet til en grønn ring vises, og trykk for å hoppe dit. Avslutt VR for å åpne bildet.','Point and press to select a work. If teleportation is enabled: point at the floor until a green ring appears, then press to jump there. Exit VR to open the image.');}
  catch{if(requested){try{await requested.end()}catch{}}if(session===requested)restoreXR();if(active){vrButton.disabled=false;vrMessage.textContent=t('VR med gulvreferanse kunne ikke startes. Du kan fortsatt bruke kunstrommet her.','VR with a floor reference could not start. You can still use the art room here.')}}finally{starting=false}
 }
 vrButton.addEventListener('click',()=>{if(session){vrButton.disabled=true;session.end().catch(()=>{if(active)vrButton.disabled=false})}else enterXR()});
 if(window.isSecureContext&&navigator.xr?.isSessionSupported){navigator.xr.isSessionSupported('immersive-vr').then(supported=>{if(active&&supported){wrap.querySelector('.gw-controls').append(teleportLabel,vrButton);vrMessage.textContent=t('Velg «Gå inn i VR» når du er klar. VR starter bare når du trykker.','Choose “Enter VR” when you are ready. VR starts only when you press the button.')}}).catch(()=>{});}
 function end(){if(!active)return;active=false;token++;hideTeleportTargets();for(const entry of controllers)entry.detach();observer.disconnect();document.removeEventListener('visibilitychange',visibility);renderer.setAnimationLoop(null);if(session){session.removeEventListener('end',restoreXR);session.end().catch(()=>{});session=null}clear();disposeObject(scene);renderer.dispose();wrap.remove();onExit()}
 const visibility=()=>{if(!document.hidden)resize()};document.addEventListener('visibilitychange',visibility);
 const observer=new ResizeObserver(resize);observer.observe(sceneEl);
 wrap.querySelector('.gw-exit').addEventListener('click',end);prev.addEventListener('click',()=>step(-1));next.addEventListener('click',()=>step(1));wrap.querySelector('.gw-open').addEventListener('click',open);
 sceneEl.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowLeft'?-1:1)}else if(e.key==='Home'||e.key==='End'){e.preventDefault();index=e.key==='Home'?0:items.length-1;draw()}else if(e.key==='Enter'){e.preventDefault();open()}else if(e.key==='Escape'){e.preventDefault();end()}});
 sceneEl.addEventListener('pointercancel',()=>{down=null});sceneEl.addEventListener('lostpointercapture',()=>{down=null});sceneEl.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY}});sceneEl.addEventListener('pointerup',e=>{if(!down)return;const dx=e.clientX-down.x,dy=e.clientY-down.y;down=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){step(dx<0?1:-1);return}if(Math.abs(dx)>10||Math.abs(dy)>10)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(group.children).find(x=>Number.isInteger(x.object.userData.index));if(hit){if(hit.object.userData.index===index)open();else{index=hit.object.userData.index;draw()}}});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();end()});host.before(wrap);draw();resize();sceneEl.focus();return {destroy:end};
}
