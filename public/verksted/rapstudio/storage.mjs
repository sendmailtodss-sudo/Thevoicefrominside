import {validateProject,problem} from './core.mjs';
const DB='sfi-local-rapstudio-v1',STORE='projects';let opening;
function open() {
  if(!globalThis.indexedDB)return Promise.reject(problem('storageUnavailable'));
  if(!opening)opening=new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onerror=()=>{opening=null;reject(problem('storageUnavailable'));};r.onblocked=()=>{opening=null;reject(problem('storageUnavailable'));};r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();opening=null;};resolve(r.result);};});return opening;
}
async function transaction(mode,action) {
  const db=await open();return new Promise((resolve,reject)=>{let value;const tx=db.transaction(STORE,mode);tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(problem(tx.error?.name==='QuotaExceededError'?'storageFull':'saveFailed'));tx.onerror=()=>{};try{const req=action(tx.objectStore(STORE));req.onsuccess=()=>{value=req.result;};}catch{tx.abort();}});
}
export async function loadProject() {const value=await transaction('readonly',store=>store.get('current'));return value?validateProject(value):null;}
export async function saveProject(project) {const value=validateProject(project);await transaction('readwrite',store=>store.put(value,'current'));}
export async function deleteProject() {await transaction('readwrite',store=>store.delete('current'));}
