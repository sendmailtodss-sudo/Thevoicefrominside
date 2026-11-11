import test from 'node:test';
import assert from 'node:assert/strict';
import {FLOOR_BOUNDS,validFloorPoint,floorRayTarget,teleportRigPosition,bindXRController} from '../public/gallery-locomotion.mjs';

test('controller ray meets the room floor at an explicit bounded destination',()=>{
 assert.deepEqual(floorRayTarget({x:0,y:1.65,z:6.5},{x:0,y:-.5,z:-1}),{x:0,y:0,z:3.2});
 assert.deepEqual(floorRayTarget({x:-2,y:1.2,z:6},{x:.5,y:-1,z:-2}),{x:-1.4,y:0,z:3.6});
});
test('reject horizon, upward, behind, nonfinite and excessively far controller targets',()=>{
 for(const direction of [{x:0,y:0,z:-1},{x:0,y:1,z:-1},{x:0,y:-.051,z:-1},{x:Infinity,y:-1,z:0}])assert.equal(floorRayTarget({x:0,y:1.65,z:6.5},direction),null);
 assert.equal(floorRayTarget({x:0,y:0,z:6.5},{x:0,y:-1,z:-1}),null);
});
test('wall margins, floor height and sculpture keep-out are actual constraints',()=>{
 for(const target of [{x:FLOOR_BOUNDS.minX-.01,y:0,z:2},{x:FLOOR_BOUNDS.maxX+.01,y:0,z:2},{x:0,y:0,z:FLOOR_BOUNDS.minZ-.01},{x:0,y:0,z:FLOOR_BOUNDS.maxZ+.01},{x:0,y:1,z:2},{x:2.25,y:0,z:.9},{x:2.25,y:0,z:2}])assert.equal(validFloorPoint(target),false);
 assert.equal(validFloorPoint({x:FLOOR_BOUNDS.minX,y:0,z:FLOOR_BOUNDS.maxZ}),true);
});
test('a discrete jump compensates physical headset offset without doubling headset height',()=>{
 const rig={x:0,y:0,z:6.5},viewer={x:.35,y:1.65,z:6.25},target={x:-3,y:0,z:3};
 const moved=teleportRigPosition({enabled:true,rig,viewer,target});assert.deepEqual(moved,{x:-3.35,y:0,z:3.25});
 assert.equal(moved.y+viewer.y,1.65);assert.deepEqual(rig,{x:0,y:0,z:6.5});
 assert.equal(moved.x+(viewer.x-rig.x),target.x);assert.equal(moved.z+(viewer.z-rig.z),target.z);
});
test('unchecked, invalid or obstructed destinations cannot produce movement',()=>{
 const base={rig:{x:0,y:0,z:6.5},viewer:{x:0,y:1.65,z:6.5},target:{x:0,y:0,z:2}};
 for(const enabled of [false,undefined,1,'true'])assert.equal(teleportRigPosition({...base,enabled}),null);
 assert.equal(teleportRigPosition({...base,enabled:true,target:null}),null);
 assert.equal(teleportRigPosition({...base,enabled:true,target:{x:100,y:0,z:2}}),null);
});
test('repeat jumps retain floor height and compensate the current viewer offset',()=>{
 let rig={x:0,y:0,z:6.5};
 for(let i=0;i<20;i++){
  const viewer={x:rig.x+.25,y:1.72,z:rig.z-.3},target={x:i%2?-3:0,y:0,z:i%2?4:6};
  const next=teleportRigPosition({enabled:true,rig,viewer,target});assert.equal(next.y,0);assert.equal(next.x+.25,target.x);assert.ok(Math.abs(next.z-.3-target.z)<1e-9);rig=next;
 }
});

test('controller proxy disconnect and cleanup remove every registered input handler',()=>{
 const proxy=new EventTarget(),events=[];const detach=bindXRController(proxy,{onSelect:()=>events.push('select'),onConnected:()=>events.push('connected'),onDisconnected:()=>events.push('disconnected')});
 for(const type of ['connected','select','disconnected'])proxy.dispatchEvent(new Event(type));assert.deepEqual(events,['connected','select','disconnected']);
 detach();detach();for(const type of ['connected','select','disconnected'])proxy.dispatchEvent(new Event(type));assert.deepEqual(events,['connected','select','disconnected']);
});

test('actual Three ray geometry resolves a frame or sculpture proxy before the floor',async()=>{
 const T=await import('../public/vendor/three/three.module.js');
 const floor=new T.Mesh(new T.PlaneGeometry(17,14),new T.MeshBasicMaterial());floor.rotation.x=-Math.PI/2;floor.position.z=2;floor.userData.teleportFloor=true;floor.updateMatrixWorld();
 const frame=new T.Mesh(new T.PlaneGeometry(3,3),new T.MeshBasicMaterial());frame.position.set(0,1.5,3);frame.updateMatrixWorld();
 const ray=new T.Raycaster(new T.Vector3(0,1.5,6),new T.Vector3(0,-.3,-1).normalize());
 assert.equal(ray.intersectObjects([floor,frame])[0].object,frame);assert.equal(ray.intersectObjects([floor])[0].object,floor);
 const blocker=new T.Mesh(new T.CylinderGeometry(1.05,1.05,3.9,16),new T.MeshBasicMaterial({visible:false}));blocker.position.set(2.25,1.95,.9);blocker.updateMatrixWorld();
 const blockedRay=new T.Raycaster(new T.Vector3(2.25,1.5,6),new T.Vector3(0,-.2,-1).normalize());assert.equal(blockedRay.intersectObjects([floor,blocker])[0].object,blocker);
 for(const item of [floor,frame,blocker]){item.geometry.dispose();item.material.dispose()}
});
