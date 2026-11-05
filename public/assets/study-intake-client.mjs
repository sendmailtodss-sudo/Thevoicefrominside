/* Private study intake client. Memory only; no telemetry, storage or provider calls. */
export const INTAKE_PREFIX='/api/study-intake';
export const MAX_EXCERPT_CHARS=60000;
export const MAX_RESPONSE_BYTES=1024*1024;
export const JOB_STATUSES=Object.freeze(['prepared','running','complete','failed','uncertain','withdrawn','expired']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clone=value=>structuredClone(value);
export class IntakeError extends Error {constructor(code,status=0){super(code);this.code=code;this.status=status;}}
const requireValue=(value,code)=>{if(!value)throw new IntakeError(code);};
export function validDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
export function maskSelection(text,start,end,label='[REDACTED]'){
 requireValue(typeof text==='string'&&text.length<=MAX_EXCERPT_CHARS,'excerpt_too_large');
 requireValue(Number.isInteger(start)&&Number.isInteger(end)&&start>=0&&end>start&&end<=text.length,'selection_required');
 return text.slice(0,start)+label+text.slice(end);
}
export function identifierWarnings(text){
 if(typeof text!=='string')return [];
 const warnings=[];
 if(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text))warnings.push('email');
 if(/https?:\/\//i.test(text))warnings.push('url');
 if(/\b(?:\d[\s-]?){11}\b|\b(?:fødselsnummer|personnummer|innsattnummer)\s*[:#]?\s*\d/i.test(text))warnings.push('identifier');
 return warnings;
}
export function selectionFrom(input){
 requireValue(input&&typeof input==='object','invalid_selection');
 requireValue(typeof input.authority==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(input.authority),'authority_required');
 requireValue(validDate(input.decisionDate),'decision_date_required');
 requireValue(typeof input.excerpt==='string'&&input.excerpt.trim().length>=20&&input.excerpt.length<=MAX_EXCERPT_CHARS&&!/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(input.excerpt),'excerpt_required');
 requireValue(Array.isArray(input.ruleIds)&&input.ruleIds.length<=8&&new Set(input.ruleIds).size===input.ruleIds.length&&input.ruleIds.every(v=>typeof v==='string'&&/^[-a-zA-Z0-9_.]{1,80}$/.test(v)),'invalid_rules');
 // Deliberately construct only these fields: pasted source, filenames and local
 // notes must never be copied into the outgoing object.
 return {authority:input.authority,decisionDate:input.decisionDate,pages:[{number:1,text:input.excerpt}],ruleIds:[...input.ruleIds]};
}
export function safeJob(value){
 requireValue(value&&UUID.test(value.id)&&JOB_STATUSES.includes(value.status)&&Number.isSafeInteger(value.version)&&value.version>=1,'invalid_server_response');
 return clone(value);
}
function approval(value){
 requireValue(value&&typeof value.approvalDigest==='string'&&/^(?:sha256:)?[0-9a-f]{64}$/i.test(value.approvalDigest)&&value.request&&typeof value.request==='object'&&!Array.isArray(value.request),'invalid_server_response');
 return clone(value);
}
async function boundedJSON(response){
 const reader=response.body?.getReader();
 requireValue(reader,'invalid_server_response');
 let length=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX_RESPONSE_BYTES){await reader.cancel();throw new IntakeError('response_too_large');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new IntakeError('invalid_server_response');}
}
export class StudyIntakeClient {
 constructor({fetcher=(...args)=>globalThis.fetch(...args),uuid=()=>crypto.randomUUID(),timeoutMs=70000}={}){this.fetcher=fetcher;this.uuid=uuid;this.timeoutMs=timeoutMs;this.config=null;this.review=null;this.job=null;this.preview=null;this.result=null;this.busy=false;this.uncertain=false;this.lastOperation=null;this.releaseReview=null;}
 invalidateReview(){this.review=null;this.preview=null;}
 async request(path,{method='GET',body}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.timeoutMs);
  try{
   const response=await this.fetcher(INTAKE_PREFIX+path,{method,credentials:'same-origin',cache:'no-store',redirect:'error',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:controller.signal});
   const data=await boundedJSON(response);
   if(!response.ok){const code=data?.error?.code;throw new IntakeError(typeof code==='string'&&/^[a-z_]{1,100}$/.test(code)?code:'request_failed',response.status);}
   return data;
  }catch(error){if(error instanceof IntakeError)throw error;throw new IntakeError('outcome_unknown');}finally{clearTimeout(timer);}
 }
 async readConfig(language='no'){
  const data=await this.request('/config?lang='+(language==='en'?'en':'no'));
  requireValue(data&&typeof data.enabled==='boolean'&&typeof data.authenticated==='boolean','invalid_server_response');
  this.config=clone(data);return clone(data);
 }
 reviewDraft(input,consents){
  requireValue(!this.busy,'operation_in_progress');
  const selection=selectionFrom(input);
  requireValue(consents?.reviewed===true&&consents.thirdPartyDataReviewed===true&&consents.privateProcessing===true,'consent_required');
  const requestKey=this.uuid();requireValue(UUID.test(requestKey),'crypto_unavailable');
  const payload={requestKey,selection,masking:{mode:'reviewed-redacted-excerpts',reviewed:true,thirdPartyDataReviewed:true},consent:{version:this.config?.consentVersion||'not-configured',privateProcessing:true,aggregateOptIn:consents.aggregateOptIn===true}};
  requireValue(new TextEncoder().encode(JSON.stringify(payload)).byteLength<=131072,'too_large');
  this.review=clone(payload);this.preview=null;return clone(payload);
 }
 async mutation(name,fn){
  requireValue(!this.busy,'operation_in_progress');requireValue(!this.uncertain,'check_status_first');
  this.busy=true;this.lastOperation=name;
  try{return await fn();}catch(error){if(error.code==='outcome_unknown'||error.code==='invalid_server_response'||error.code==='response_too_large'||error.status>=500)this.uncertain=true;throw error;}finally{this.busy=false;}
 }
 async prepare({exactPayloadReviewed=false,syntheticMaterialConfirmed=false}={}){
  requireValue(this.config?.enabled===true,'service_closed');requireValue(this.config.authenticated===true,'authentication_required');
  requireValue(this.review&&exactPayloadReviewed,'outgoing_review_required');
  requireValue(this.config.syntheticOnly!==true||syntheticMaterialConfirmed===true,'synthetic_confirmation_required');
  requireValue(this.review.consent.version===this.config.consentVersion,'consent_version_changed');
  const allowed=new Set((this.config.catalogue?.rules||[]).map(r=>r.id));
  requireValue(this.review.selection.ruleIds.length>0&&this.review.selection.ruleIds.every(id=>allowed.has(id)),'select_available_rules');
  const payload=clone(this.review);
  return this.mutation('prepare',async()=>{const data=await this.request('/jobs',{method:'POST',body:payload});const job=safeJob(data.job),preview=data.preview?approval(data.preview):null;requireValue(job.status!=='prepared'||preview,'invalid_server_response');this.job=job;this.preview=preview;this.result=data.result?clone(data.result):null;this.review=null;return clone(data);});
 }
 async run({confirmedDigest='',allowProviderTransmission=false}={}){
  requireValue(this.config?.enabled===true&&this.config.authenticated===true,'service_closed');
  requireValue(this.job?.status==='prepared'&&this.preview&&allowProviderTransmission===true&&confirmedDigest===this.preview.approvalDigest,'provider_consent_required');
  const id=this.job.id,payload={version:this.job.version,approvalDigest:this.preview.approvalDigest,consentVersion:this.config.consentVersion,allowProviderTransmission:true};
  return this.mutation('run',async()=>{const data=await this.request('/jobs/'+id+'/run',{method:'POST',body:payload});this.job=safeJob(data.job);this.result=data.result?clone(data.result):null;this.preview=null;return clone(data);});
 }
 async refresh(id=this.job?.id){
  requireValue(!this.busy,'operation_in_progress');requireValue(UUID.test(id),'job_required');
  this.busy=true;
  try{const data=await this.request('/jobs/'+id);const job=safeJob(data.job),preview=data.preview?approval(data.preview):null;this.job=job;this.preview=preview;this.result=data.result?clone(data.result):null;this.uncertain=false;return clone(data);}finally{this.busy=false;}
 }
 async list(){const data=await this.request('/jobs');requireValue(Array.isArray(data.jobs)&&data.jobs.length<=1000,'invalid_server_response');return data.jobs.map(safeJob);}
 async withdraw({confirmed=false}={}){
  requireValue(this.job&&confirmed,'withdraw_confirmation_required');
  const id=this.job.id,version=this.job.version;
  return this.mutation('withdraw',async()=>{const data=await this.request('/jobs/'+id,{method:'DELETE',body:{version}});const job=safeJob(data.job);requireValue(job.status==='withdrawn','invalid_server_response');this.job=job;this.preview=null;this.result=null;this.review=null;return clone(data);});
 }
 async progress(){return this.request('/progress');}
 async previewRelease(){requireValue(this.config?.canRelease===true,'reporter_required');const data=await this.request('/release-preview');requireValue(Number.isSafeInteger(data.expectedVersion)&&typeof data.approvalDigest==='string'&&/^(?:sha256:)?[0-9a-f]{64}$/i.test(data.approvalDigest)&&data.summary&&typeof data.summary==='object','invalid_server_response');this.releaseReview={...clone(data),requestKey:this.uuid()};return clone(data);}
 async publishRelease({approvalDigest,privacyReviewed=false,preliminaryOnly=false}={}){requireValue(this.config?.canRelease===true&&this.releaseReview&&this.releaseReview.approvalDigest===approvalDigest&&privacyReviewed===true&&preliminaryOnly===true,'release_consent_required');const r=clone(this.releaseReview);return this.mutation('release',async()=>{const data=await this.request('/releases',{method:'POST',body:{expectedVersion:r.expectedVersion,approvalDigest:r.approvalDigest,requestKey:r.requestKey,privacyReviewed:true,preliminaryOnly:true}});this.releaseReview=null;return data;});}
}
