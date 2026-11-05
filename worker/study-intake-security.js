import {sha256,validateBundle} from '../public/assets/analysis-core.mjs';

export const STUDY_PREFIX='/api/study-intake';
export const STUDY_CRON='0 * * * *';
export const STUDY_RETENTION_JOB='study-intake-expiry-v1';
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const enc=new TextEncoder();
export class StudyError extends Error {constructor(code,status=400){super(code);this.code=code;this.status=status;}}
export function requireStudy(value,code,status=400){if(!value)throw new StudyError(code,status);}
export function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
export function shape(value,keys){requireStudy(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===keys.length&&keys.every(k=>Object.hasOwn(value,k)),'invalid_input');}
export const string=(v,min,max)=>typeof v==='string'&&v.length>=min&&v.length<=max&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v);
export function owner(request){const id=request.headers.get('oai-authenticated-user-id');requireStudy(string(id,1,512),'authentication_required',401);return id;}
export function sameOrigin(request){requireStudy(request.headers.get('Origin')===new URL(request.url).origin&&[null,'same-origin','none'].includes(request.headers.get('Sec-Fetch-Site')),'origin_rejected',403);}
export async function readBounded(stream,max){requireStudy(stream,'empty_body');const reader=stream.getReader(),chunks=[];let length=0;try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();throw new StudyError('too_large',413);}chunks.push(value);}}finally{reader.releaseLock();}const bytes=new Uint8Array(length);let n=0;for(const c of chunks){bytes.set(c,n);n+=c.length;}try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new StudyError('invalid_encoding');}}
export async function body(request){requireStudy(/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''),'json_required',415);requireStudy(Number(request.headers.get('Content-Length')||0)<=131072,'too_large',413);let value;try{value=JSON.parse(await readBounded(request.body,131072));}catch(e){if(e instanceof StudyError)throw e;throw new StudyError('invalid_json');}return value;}
const hexKey=value=>typeof value==='string'&&/^[a-f0-9]{64}$/i.test(value);
const keyBytes=value=>Uint8Array.from(value.match(/../g),v=>parseInt(v,16));
const b64=bytes=>btoa(Array.from(bytes,n=>String.fromCharCode(n)).join(''));
const un64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export async function keyedHash(env,value){requireStudy(hexKey(env.STUDY_INTAKE_HASH_KEY),'storage_keys_unavailable',503);const key=await crypto.subtle.importKey('raw',keyBytes(env.STUDY_INTAKE_HASH_KEY),{name:'HMAC',hash:'SHA-256'},false,['sign']);return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(value))),x=>x.toString(16).padStart(2,'0')).join('');}
export async function seal(env,value,aad){requireStudy(hexKey(env.STUDY_INTAKE_STORAGE_KEY),'storage_keys_unavailable',503);const key=await crypto.subtle.importKey('raw',keyBytes(env.STUDY_INTAKE_STORAGE_KEY),'AES-GCM',false,['encrypt']),iv=crypto.getRandomValues(new Uint8Array(12)),plain=enc.encode(JSON.stringify(value));try{return JSON.stringify({v:1,iv:b64(iv),data:b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:enc.encode(aad),tagLength:128},key,plain)))});}finally{plain.fill(0);}}
export async function unseal(env,ciphertext,aad,keyId){requireStudy(keyId===env.STUDY_INTAKE_STORAGE_KEY_ID&&hexKey(env.STUDY_INTAKE_STORAGE_KEY),'storage_keys_unavailable',503);try{const box=JSON.parse(ciphertext);requireStudy(box.v===1&&typeof box.iv==='string'&&typeof box.data==='string'&&box.data.length<=2000000,'stored_content_unavailable',503);const key=await crypto.subtle.importKey('raw',keyBytes(env.STUDY_INTAKE_STORAGE_KEY),'AES-GCM',false,['decrypt']);const iv=un64(box.iv);requireStudy(iv.length===12,'stored_content_unavailable',503);const bytes=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:enc.encode(aad),tagLength:128},key,un64(box.data)));try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}finally{bytes.fill(0);}}catch{throw new StudyError('stored_content_unavailable',503);}}
export function publishers(env){try{const list=JSON.parse(env.STUDY_INTAKE_PUBLISHER_IDS||'[]');return Array.isArray(list)&&list.length<=10&&list.every(x=>string(x,1,512))?list:[];}catch{return [];}}
export function configuration(env){try{
 const c=JSON.parse(env.STUDY_INTAKE_CONFIG_JSON||'null');
 if(!c||!string(c.studyId,3,80)||!/^[a-z0-9-]+$/.test(c.studyId)||!string(c.controllerLabel,3,200)||!/^\/[a-zA-Z0-9/_-]+\/$/.test(c.privacyUrl)||c.privacyUrl.startsWith('//')||!string(c.consentVersion,3,80)||!string(c.providerTermsVersion,3,80)||c.provider!=='openai-chat-completions'||!string(c.model,3,100)||!/^[a-zA-Z0-9._:-]+$/.test(c.model)||!string(c.catalogueVersion,3,80)||!Array.isArray(c.rules)||c.rules.length<1||c.rules.length>8)return null;
 if(!Number.isInteger(c.retentionHours)||c.retentionHours<1||c.retentionHours>24||!Number.isInteger(c.metadataRetentionDays)||c.metadataRetentionDays<1||c.metadataRetentionDays>365||!c.approvals||['controllerAccepted','lawfulBasisReviewed','processorTermsAccepted','retentionApproved','securityApproved','catalogueReviewed'].some(k=>c.approvals[k]!==true))return null;
 if(!hexKey(env.STUDY_INTAKE_STORAGE_KEY)||!hexKey(env.STUDY_INTAKE_HASH_KEY)||!string(env.STUDY_INTAKE_STORAGE_KEY_ID,3,80)||!string(env.STUDY_INTAKE_API_KEY,20,512)||/[\r\n]/.test(env.STUDY_INTAKE_API_KEY))return null;
 if(new Set(c.rules.map(r=>r.id)).size!==c.rules.length)return null;
 for(const r of c.rules){if(!r||!/^[-a-zA-Z0-9_.]{1,80}$/.test(r.id)||!string(r.title,3,300)||!string(r.version,1,100)||!string(r.text,20,50000)||!Array.isArray(r.authorityTypes)||!r.authorityTypes.length)return null;const u=new URL(r.sourceUrl);if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||!['lovdata.no','www.regjeringen.no','www.sivilombudet.no','www.nav.no','www.kriminalomsorgen.no','example.invalid'].includes(u.hostname))return null;if(u.hostname==='example.invalid'&&c.syntheticOnly!==true)return null;}
 if(typeof c.syntheticOnly!=='boolean'||c.rules.reduce((n,r)=>n+r.text.length,0)>40000)return null;
 validateBundle({schemaVersion:1,synthetic:c.syntheticOnly,documents:c.rules.map((r,i)=>({id:'catalogue-check-'+i,participantToken:'catalogue-validation',authority:r.authorityTypes[0],decisionDate:r.validFrom,pages:[{number:1,text:'Catalogue structure validation only.'}]})),rules:c.rules,plan:c.rules.map((r,i)=>({documentId:'catalogue-check-'+i,ruleIds:[r.id]}))});
 return {...c,rules:structuredClone(c.rules)};
 }catch{return null;}}
export const configHash=c=>sha256(JSON.stringify(c));
export async function readiness(env,c,now){if(env.STUDY_INTAKE_ENABLED!=='true'||!c||!env.DB)return{ready:false,reason:'not_configured'};if(env.STUDY_INTAKE_PAUSED==='true')return{ready:false,reason:'paused'};if(env.STUDY_INTAKE_RETENTION_MODE!=='scheduled-hourly-v1')return{ready:false,reason:'retention_not_configured'};try{const r=await env.DB.prepare('SELECT * FROM study_intake_retention WHERE job_id=?').bind(STUDY_RETENTION_JOB).first();if(!r||r.cron!==STUDY_CRON||r.completed_at>now||r.scheduled_at>r.completed_at||r.completed_at-r.scheduled_at>900000||now-r.completed_at>4500000)return{ready:false,reason:'retention_not_verified'};return{ready:true,reason:'ready'};}catch{return{ready:false,reason:'storage_unavailable'};}}

// This rejects several common direct identifiers, not every name, diagnosis,
// third-party fact or identifying combination. Human masking remains explicit.
export function obviousIdentifiers(text){return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|https?:\/\/|\b(?:\d[\s-]?){11}\b|\b(?:fødselsnummer|personnummer|innsattnummer)\s*[:#]?\s*\d/i.test(text);}
