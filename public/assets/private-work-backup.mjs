/* Local encrypted work copies. No I/O beyond an explicitly selected File, no persistence. */
export const BACKUP_VERSION=1, BACKUP_ITERATIONS=600000, HEADER_BYTES=52;
const MiB=1024*1024;
export const BACKUP_PROFILES=Object.freeze({maite:Object.freeze({id:1,maxPlaintextBytes:90*MiB}),analysis:Object.freeze({id:2,maxPlaintextBytes:16*MiB})});
const MAGIC=new TextEncoder().encode('SFI-ENC-WORK'), encoder=new TextEncoder();
const fail=code=>{throw Object.assign(new Error(code),{code});};
const profile=scope=>typeof scope==='string'&&Object.hasOwn(BACKUP_PROFILES,scope)?BACKUP_PROFILES[scope]:fail('BACKUP_SCOPE_INVALID');
const checkAbort=signal=>{if(signal?.aborted)fail('BACKUP_CANCELLED');};
function cryptoReady(){if(!globalThis.crypto?.subtle||!globalThis.crypto?.getRandomValues)fail('BACKUP_CRYPTO_UNAVAILABLE');}
function passwordBytes(password){
 if(typeof password!=='string'||password.length>2048)fail('BACKUP_PASSWORD_INVALID');const length=Array.from(password).length;if(length<12||length>1024)fail('BACKUP_PASSWORD_INVALID');
 for(let i=0;i<password.length;i++){const c=password.charCodeAt(i);if(c>=0xd800&&c<=0xdbff){const next=password.charCodeAt(++i);if(!(next>=0xdc00&&next<=0xdfff))fail('BACKUP_PASSWORD_INVALID');}else if(c>=0xdc00&&c<=0xdfff)fail('BACKUP_PASSWORD_INVALID');}
 return encoder.encode(password);
}
function binary(value){if(value instanceof Uint8Array)return value;if(value instanceof ArrayBuffer)return new Uint8Array(value);fail('BACKUP_INVALID_FORMAT');}
export function isEncryptedWorkBytes(value){const b=binary(value);return b.length>=MAGIC.length&&MAGIC.every((v,i)=>b[i]===v);}
function header(bytes,scope,totalLength=bytes.length){
 const p=profile(scope);if(bytes.length<HEADER_BYTES||!isEncryptedWorkBytes(bytes))fail('BACKUP_INVALID_FORMAT');
 const h=new Uint8Array(HEADER_BYTES);h.set(bytes.subarray(0,HEADER_BYTES));const v=new DataView(h.buffer,h.byteOffset,h.byteLength);
 if(h[12]!==BACKUP_VERSION||h[14]!==0||h[15]!==0||v.getUint32(16)!==BACKUP_ITERATIONS)fail('BACKUP_UNSUPPORTED_FORMAT');
 if(h[13]!==p.id)fail('BACKUP_SCOPE_MISMATCH');const n=v.getUint32(48);
 if(n<16||n>p.maxPlaintextBytes+16||totalLength!==HEADER_BYTES+n)fail('BACKUP_INVALID_LENGTH');
 return {bytes:h,salt:h.slice(20,36),iv:h.slice(36,48)};
}
async function derive(password,salt,usage){const material=await crypto.subtle.importKey('raw',password,'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:BACKUP_ITERATIONS,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,[usage]);}
export async function encryptWorkText(text,password,scope,{signal}={}){
 cryptoReady();checkAbort(signal);const p=profile(scope);if(typeof text!=='string')fail('BACKUP_INVALID_PLAINTEXT');if(text.length>p.maxPlaintextBytes)fail('BACKUP_TOO_LARGE');
 const plain=encoder.encode(text);let pass=null;
 try{if(plain.length>p.maxPlaintextBytes)fail('BACKUP_TOO_LARGE');pass=passwordBytes(password);
  const h=new Uint8Array(HEADER_BYTES),v=new DataView(h.buffer);h.set(MAGIC);h[12]=BACKUP_VERSION;h[13]=p.id;v.setUint32(16,BACKUP_ITERATIONS);h.set(crypto.getRandomValues(new Uint8Array(16)),20);h.set(crypto.getRandomValues(new Uint8Array(12)),36);v.setUint32(48,plain.length+16);
  const key=await derive(pass,h.slice(20,36),'encrypt');checkAbort(signal);const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:h.slice(36,48),additionalData:h,tagLength:128},key,plain));checkAbort(signal);
  const result=new Uint8Array(h.length+encrypted.length);result.set(h);result.set(encrypted,h.length);encrypted.fill(0);return result;
 }finally{pass?.fill(0);plain.fill(0);}
}
export async function decryptWorkBytes(value,password,scope,{signal}={}){
 cryptoReady();checkAbort(signal);const b=binary(value),p=profile(scope);if(b.length>p.maxPlaintextBytes+HEADER_BYTES+16)fail('BACKUP_TOO_LARGE');const h=header(b,scope);let pass=null,plain=null;
 try{pass=passwordBytes(password);const key=await derive(pass,h.salt,'decrypt');checkAbort(signal);
  try{plain=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:h.iv,additionalData:h.bytes,tagLength:128},key,b.subarray(HEADER_BYTES)));if(plain.length>p.maxPlaintextBytes)fail('BACKUP_DECRYPT_FAILED');const text=new TextDecoder('utf-8',{fatal:true}).decode(plain);checkAbort(signal);return text;}catch(e){if(e?.code==='BACKUP_CANCELLED')throw e;fail('BACKUP_DECRYPT_FAILED');}
 }finally{pass?.fill(0);plain?.fill(0);}
}
export async function inspectWorkFile(file,scope,{signal}={}){
 const p=profile(scope);checkAbort(signal);if(!file||!Number.isSafeInteger(file.size)||file.size<1||typeof file.slice!=='function')fail('BACKUP_INVALID_FORMAT');
 if(file.size>p.maxPlaintextBytes+HEADER_BYTES+16)fail('BACKUP_TOO_LARGE');const prefix=new Uint8Array(await file.slice(0,HEADER_BYTES).arrayBuffer());checkAbort(signal);const encrypted=isEncryptedWorkBytes(prefix);
 if(encrypted)header(prefix,scope,file.size);else if(file.size>p.maxPlaintextBytes)fail('BACKUP_TOO_LARGE');return {encrypted};
}
export async function readWorkFile(file,password,scope,{signal}={}){
 const info=await inspectWorkFile(file,scope,{signal});if(info.encrypted&&password==null)fail('BACKUP_PASSWORD_REQUIRED');const bytes=new Uint8Array(await file.arrayBuffer());checkAbort(signal);
 try{const text=info.encrypted?await decryptWorkBytes(bytes,password,scope,{signal}):new TextDecoder('utf-8',{fatal:true}).decode(bytes);checkAbort(signal);return {text,encrypted:info.encrypted};}finally{bytes.fill(0);}
}
