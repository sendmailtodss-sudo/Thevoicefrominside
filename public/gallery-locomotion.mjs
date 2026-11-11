// Discrete, opt-in floor movement for this one room. No animation or gamepad polling.
export const FLOOR_BOUNDS=Object.freeze({minX:-7.4,maxX:7.4,minZ:-.45,maxZ:8});
const finitePoint=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
export function validFloorPoint(point){
 if(!finitePoint(point)||Math.abs(point.y)>.08)return false;
 const b=FLOOR_BOUNDS;
 return point.x>=b.minX&&point.x<=b.maxX&&point.z>=b.minZ&&point.z<=b.maxZ&&Math.hypot(point.x-2.25,point.z-.9)>=1.25;
}
export function floorRayTarget(origin,direction){
 if(!finitePoint(origin)||!finitePoint(direction)||origin.y<=.1||direction.y>=-.05)return null;
 const length=Math.hypot(direction.x,direction.y,direction.z);if(length<.00001)return null;
 const distance=-origin.y/direction.y*length;if(distance<.15||distance>12)return null;
 const scale=-origin.y/direction.y,point={x:origin.x+scale*direction.x,y:0,z:origin.z+scale*direction.z};
 return validFloorPoint(point)?point:null;
}
export function teleportRigPosition({enabled,rig,viewer,target}){
 if(enabled!==true||!finitePoint(rig)||!finitePoint(viewer)||!validFloorPoint(target))return null;
 // Account for physical headset displacement. Keep floor height unchanged.
 return {x:rig.x+target.x-viewer.x,y:rig.y,z:rig.z+target.z-viewer.z};
}
export function bindXRController(controller,{onSelect,onConnected,onDisconnected}){
 const bindings=[['select',onSelect],['connected',onConnected],['disconnected',onDisconnected]];
 for(const [event,handler] of bindings)controller.addEventListener(event,handler);
 let bound=true;
 return ()=>{if(!bound)return;bound=false;for(const [event,handler]of bindings)controller.removeEventListener(event,handler)};
}
