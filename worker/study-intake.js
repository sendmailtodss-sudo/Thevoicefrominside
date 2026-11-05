import {validateBundle,requestFor,sha256} from '../public/assets/analysis-core.mjs';
import {STUDY_PREFIX,UUID,StudyError,requireStudy,json,shape,string,owner,sameOrigin,body,keyedHash,seal,unseal,publishers,configuration,readiness,obviousIdentifiers} from './study-intake-security.js';
import {runStudyProvider,STUDY_PROMPT_VERSION,STUDY_SYSTEM_PROMPT,STUDY_REQUEST_SETTINGS} from './study-intake-provider.js';
import {buildStudyRelease} from './study-intake-progress.js';

const LIMITS={maxPages:10,maxTextChars:60000,maxRules:8};
const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const changed=r=>Number(r?.meta?.changes||0)>0;
const iso=n=>new Date(n).toISOString();
const workflowHash=c=>sha256(JSON.stringify([c,STUDY_PROMPT_VERSION,STUDY_SYSTEM_PROMPT,STUDY_REQUEST_SETTINGS]));
function version(value){requireStudy(Number.isSafeInteger(value)&&value>=1,'invalid_version');return value;}
function codingCounts(coding){if(!coding)return null;const checks=JSON.parse(coding).checks;return{checkedPoints:checks.length,flaggedPoints:checks.filter(c=>c.outcome==='flag').length,noFlagPoints:checks.filter(c=>c.outcome==='no_flag').length,insufficientPoints:checks.filter(c=>c.outcome==='insufficient').length};}
function dto(r,now){return{id:r.id,status:r.content_expires_at<=now&&['prepared','running'].includes(r.status)?'expired':r.status,version:r.version,createdAt:iso(r.created_at),contentExpiresAt:iso(r.content_expires_at),metadataExpiresAt:iso(r.metadata_expires_at),aggregateOptIn:!!r.aggregate_opt_in,counts:codingCounts(r.coding_json),failureCode:r.failure_code};}
async function job(env,id,user,now){requireStudy(UUID.test(id||''),'not_found',404);const r=await first(env.DB,'SELECT * FROM study_intake_jobs WHERE id=? AND owner_id=? AND metadata_expires_at>?',id,user,now);requireStudy(r,'not_found',404);return r;}
async function responseFor(env,r,now,status=200){let preview=null,result=null;if(r.content_expires_at>now&&r.status==='prepared'&&r.source_ciphertext){const stored=await unseal(env,r.source_ciphertext,r.id+':source',r.key_id);preview={approvalDigest:r.approval_digest,provider:stored.provider,request:await requestFor(stored.bundle,'document-1'),promptVersion:stored.promptVersion,instructions:stored.instructions,requestSettings:stored.requestSettings};}if(r.content_expires_at>now&&r.status==='complete'&&r.result_ciphertext)result=await unseal(env,r.result_ciphertext,r.id+':result',r.key_id);return json({job:dto(r,now),preview,result},status);}
async function ready(env,c,now){const state=await readiness(env,c,now);requireStudy(state.ready,state.reason,503);}
async function control(env,c,initialize=false){const tag=await sha256(env.STUDY_INTAKE_HASH_KEY);if(initialize)await env.DB.prepare('INSERT INTO study_intake_control(study_id,privacy_key_tag) VALUES(?,?) ON CONFLICT(study_id) DO NOTHING').bind(c.studyId,tag).run();const row=await first(env.DB,'SELECT * FROM study_intake_control WHERE study_id=?',c.studyId);requireStudy(!row||row.privacy_key_tag===tag,'study_key_changed',503);return row??{study_id:c.studyId,privacy_key_tag:tag,version:0,publication_locked:0,current_release:null};}
function selectionInput(d,c){
 shape(d,['requestKey','selection','masking','consent']);requireStudy(UUID.test(d.requestKey||''),'invalid_request_key');
 shape(d.masking,['mode','reviewed','thirdPartyDataReviewed']);requireStudy(d.masking.mode==='reviewed-redacted-excerpts'&&d.masking.reviewed===true&&d.masking.thirdPartyDataReviewed===true,'masking_review_required');
 shape(d.consent,['version','privateProcessing','aggregateOptIn']);requireStudy(d.consent.version===c.consentVersion&&d.consent.privateProcessing===true&&typeof d.consent.aggregateOptIn==='boolean','consent_required');
 const s=d.selection;shape(s,['authority','decisionDate','pages','ruleIds']);requireStudy(string(s.authority,1,80)&&string(s.decisionDate,10,10)&&s.decisionDate<=new Date().toISOString().slice(0,10),'invalid_selection');
 requireStudy(Array.isArray(s.pages)&&s.pages.length>=1&&s.pages.length<=LIMITS.maxPages&&Array.isArray(s.ruleIds)&&s.ruleIds.length>=1&&s.ruleIds.length<=LIMITS.maxRules,'selection_limit');
 let length=0;for(const p of s.pages){shape(p,['number','text']);requireStudy(Number.isInteger(p.number)&&p.number>=1&&p.number<=10000&&string(p.text,1,LIMITS.maxTextChars),'invalid_page');length+=p.text.length;requireStudy(!obviousIdentifiers(p.text),'masking_identifiers_detected');}
 requireStudy(length<=LIMITS.maxTextChars,'selection_limit');requireStudy(new Set(s.ruleIds).size===s.ruleIds.length&&s.ruleIds.every(id=>c.rules.some(r=>r.id===id)),'unknown_rule');
 return structuredClone(s);
}
async function create(request,env,c,user,now){
 await ready(env,c,now);const d=await body(request),s=selectionInput(d,c);await control(env,c,true);
 const ownerToken=await keyedHash(env,c.studyId+':owner:'+user);let bundle;try{bundle=validateBundle({schemaVersion:1,synthetic:c.syntheticOnly,documents:[{id:'document-1',participantToken:'account-'+ownerToken,authority:s.authority,decisionDate:s.decisionDate,pages:s.pages}],rules:c.rules.filter(r=>s.ruleIds.includes(r.id)),plan:[{documentId:'document-1',ruleIds:s.ruleIds}]});}catch{throw new StudyError('invalid_document_or_rule_scope');}
 requireStudy(new TextEncoder().encode(JSON.stringify(bundle)).length<=180000,'selection_limit');
 const hash=await workflowHash(c),normalized=bundle.documents[0],fingerprint=await keyedHash(env,c.studyId+':excerpt:'+normalized.pages.map(p=>p.text).join('\n').normalize('NFKC').replace(/\s+/g,' ').trim());
 const analysisFingerprint=await keyedHash(env,JSON.stringify([fingerprint,normalized.authority,normalized.decisionDate,bundle.plan,hash])),requestHash=await keyedHash(env,JSON.stringify([analysisFingerprint,d.consent,d.masking]));
 const previous=await first(env.DB,'SELECT * FROM study_intake_jobs WHERE owner_id=? AND request_key=?',user,d.requestKey);if(previous){requireStudy(previous.request_hash===requestHash,'idempotency_conflict',409);return responseFor(env,previous,now);}
 const duplicate=await first(env.DB,'SELECT * FROM study_intake_jobs WHERE study_id=? AND owner_id=? AND analysis_fingerprint=?',c.studyId,user,analysisFingerprint);if(duplicate){requireStudy(duplicate.request_hash===requestHash,'existing_analysis_different_consent',409);return responseFor(env,duplicate,now);}
 const id=crypto.randomUUID(),provider={name:'OpenAI',model:c.model,termsVersion:c.providerTermsVersion},modelRequest=await requestFor(bundle,'document-1'),approvalDigest=await sha256(JSON.stringify({request:modelRequest,provider,configHash:hash,consentVersion:c.consentVersion}));
 const source=await seal(env,{bundle,provider,promptVersion:STUDY_PROMPT_VERSION,instructions:STUDY_SYSTEM_PROMPT,requestSettings:STUDY_REQUEST_SETTINGS},id+':source'),contentExpires=now+c.retentionHours*3600000,metadataExpires=now+c.metadataRetentionDays*86400000;
 await env.DB.prepare(`INSERT INTO study_intake_jobs(id,study_id,owner_id,owner_token,request_key,request_hash,document_fingerprint,analysis_fingerprint,status,key_id,source_ciphertext,approval_digest,config_hash,aggregate_opt_in,consent_version,created_at,updated_at,content_expires_at,metadata_expires_at)
 SELECT ?,?,?,?,?,?,?,?,'prepared',?,?,?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM study_intake_jobs WHERE owner_id=? AND created_at>?)<3 AND (SELECT COUNT(*) FROM study_intake_jobs WHERE study_id=?)<1000 ON CONFLICT DO NOTHING`).bind(id,c.studyId,user,ownerToken,d.requestKey,requestHash,fingerprint,analysisFingerprint,env.STUDY_INTAKE_STORAGE_KEY_ID,source,approvalDigest,hash,d.consent.aggregateOptIn?1:0,c.consentVersion,now,now,contentExpires,metadataExpires,user,now-86400000,c.studyId).run();
 const r=await first(env.DB,'SELECT * FROM study_intake_jobs WHERE owner_id=? AND (request_key=? OR (study_id=? AND analysis_fingerprint=?))',user,d.requestKey,c.studyId,analysisFingerprint);requireStudy(r,'capacity_or_daily_limit',429);requireStudy(r.request_hash===requestHash,'idempotency_conflict',409);return responseFor(env,r,now,r.id===id?201:200);
}
async function run(request,env,c,user,id,clock,fetcher){
 const now=clock();await ready(env,c,now);await control(env,c);const d=await body(request);shape(d,['version','approvalDigest','consentVersion','allowProviderTransmission']);version(d.version);requireStudy(d.allowProviderTransmission===true&&d.consentVersion===c.consentVersion,'transmission_consent_required');let r=await job(env,id,user,now);requireStudy(d.approvalDigest===r.approval_digest,'preview_changed',409);
 if(r.status!=='prepared')return responseFor(env,r,now,r.status==='running'?202:200);
 requireStudy(r.config_hash===await workflowHash(c)&&r.consent_version===c.consentVersion,'configuration_changed',409);requireStudy(r.content_expires_at>now,'content_expired',410);
 const stored=await unseal(env,r.source_ciphertext,r.id+':source',r.key_id),token=crypto.randomUUID();
 const updated=await env.DB.prepare("UPDATE study_intake_jobs SET status='running',run_started_at=?,transmission_consent_at=?,run_token=?,version=version+1,updated_at=? WHERE id=? AND owner_id=? AND version=? AND status='prepared' AND content_expires_at>?").bind(now,now,token,now,r.id,user,d.version,now).run();
 if(!changed(updated)){const current=await job(env,id,user,clock());requireStudy(current.status!=='prepared','version_conflict',409);return responseFor(env,current,clock(),current.status==='running'?202:200);}
 try{
  const result=await runStudyProvider(stored.bundle,c,env,{fetcher,now:clock,beforeSend:async()=>!!await first(env.DB,"SELECT id FROM study_intake_jobs WHERE id=? AND status='running' AND run_token=? AND content_expires_at>?",id,token,clock())}),completedAt=clock(),cipher=await seal(env,result,id+':result'),coding=JSON.stringify({checks:result.checks.map(x=>({ruleId:x.ruleId,outcome:x.outcome}))});
  await env.DB.batch([
   env.DB.prepare("UPDATE study_intake_jobs SET status='complete',source_ciphertext=NULL,result_ciphertext=?,coding_json=?,run_token=NULL,version=version+1,updated_at=? WHERE id=? AND status='running' AND run_token=? AND content_expires_at>?").bind(cipher,coding,completedAt,id,token,completedAt),
   env.DB.prepare("UPDATE study_intake_control SET version=version+1 WHERE study_id=? AND EXISTS(SELECT 1 FROM study_intake_jobs WHERE id=? AND status='complete' AND updated_at=?)").bind(c.studyId,id,completedAt)
  ]);
 }catch(e){const code=e instanceof StudyError?e.code:'provider_result_rejected',status=code==='provider_outcome_unknown'?'uncertain':'failed';await env.DB.prepare("UPDATE study_intake_jobs SET status=?,failure_code=?,source_ciphertext=NULL,result_ciphertext=NULL,coding_json=NULL,run_token=NULL,version=version+1,updated_at=? WHERE id=? AND status='running' AND run_token=?").bind(status,code,clock(),id,token).run();}
 r=await job(env,id,user,clock());return responseFor(env,r,clock());
}
async function withdraw(request,env,user,id,now){const d=await body(request);shape(d,['version']);version(d.version);let r=await job(env,id,user,now);if(r.status==='withdrawn')return responseFor(env,r,now);requireStudy(d.version===r.version,'version_conflict',409);const token=crypto.randomUUID();const rs=await env.DB.batch([
 env.DB.prepare("UPDATE study_intake_jobs SET status='withdrawn',source_ciphertext=NULL,result_ciphertext=NULL,coding_json=NULL,aggregate_opt_in=0,run_token=?,failure_code=NULL,version=version+1,updated_at=? WHERE id=? AND owner_id=? AND version=?").bind(token,now,id,user,d.version),
 env.DB.prepare("UPDATE study_intake_control SET version=version+1,publication_locked=CASE WHEN EXISTS(SELECT 1 FROM study_intake_jobs WHERE id=? AND published_at IS NOT NULL) THEN 1 ELSE publication_locked END WHERE study_id=? AND EXISTS(SELECT 1 FROM study_intake_jobs WHERE id=? AND run_token=?)").bind(id,r.study_id,id,token),
 env.DB.prepare("UPDATE study_intake_releases SET guard_ciphertext=NULL WHERE study_id=? AND EXISTS(SELECT 1 FROM study_intake_jobs WHERE id=? AND run_token=? AND published_at IS NOT NULL)").bind(r.study_id,id,token)
 ]);requireStudy(changed(rs[0]),'version_conflict',409);return responseFor(env,await job(env,id,user,now),now);}
function publisher(env,user){requireStudy(publishers(env).includes(user),'forbidden',403);}
async function releaseCandidate(env,c,now){
 const ctl=await control(env,c);requireStudy(!ctl.publication_locked,'publication_requires_privacy_review',409);
 const rows=(await env.DB.prepare("SELECT id,owner_token,document_fingerprint,coding_json,metadata_expires_at FROM study_intake_jobs WHERE study_id=? AND config_hash=? AND status='complete' AND aggregate_opt_in=1 AND coding_json IS NOT NULL AND metadata_expires_at>? ORDER BY id").bind(c.studyId,await workflowHash(c),now).all()).results||[];requireStudy(rows.length<=1000,'publication_capacity_review',409);
 const previousRows=(await env.DB.prepare('SELECT * FROM study_intake_releases WHERE study_id=? ORDER BY created_at,id').bind(c.studyId).all()).results||[];requireStudy(previousRows.length<52,'publication_capacity_review',409);const previous=[];
 for(const p of previousRows){requireStudy(p.guard_ciphertext&&p.guard_expires_at>now,'publication_requires_privacy_review',409);previous.push(await unseal(env,p.guard_ciphertext,p.id+':guard',p.key_id));}
 const records=rows.map(r=>({jobId:r.id,ownerToken:r.owner_token,documentFingerprint:r.document_fingerprint,checks:JSON.parse(r.coding_json).checks}));let candidate;try{candidate=buildStudyRelease(records,{rules:c.rules.map(({id,title,version})=>({id,title,version})),minAccounts:10,previousReleases:previous});}catch{throw new StudyError('publication_privacy_guard',409);}
 requireStudy(new TextEncoder().encode(JSON.stringify(candidate.guard)).length<=750000,'publication_capacity_review',409);
 candidate.publicSummary={...candidate.publicSummary,synthetic:c.syntheticOnly};
 const digest=await sha256(JSON.stringify([c.studyId,ctl.version,candidate.publicSummary,candidate.guard]));return{ctl,rows,...candidate,digest};
}
async function publish(request,env,c,user,now){publisher(env,user);await ready(env,c,now);requireStudy(env.STUDY_INTAKE_PUBLICATION_ENABLED==='true','publication_not_open',503);const d=await body(request);shape(d,['expectedVersion','approvalDigest','requestKey','privacyReviewed','preliminaryOnly']);requireStudy(Number.isSafeInteger(d.expectedVersion)&&d.expectedVersion>=0&&UUID.test(d.requestKey||'')&&d.privacyReviewed===true&&d.preliminaryOnly===true,'publication_confirmation_required');
 const requestHash=await sha256(JSON.stringify(d));const prior=await first(env.DB,'SELECT * FROM study_intake_releases WHERE study_id=? AND request_key=?',c.studyId,d.requestKey);if(prior){requireStudy(prior.request_hash===requestHash,'idempotency_conflict',409);return json({report:JSON.parse(prior.public_json)});}
 const current=await releaseCandidate(env,c,now);requireStudy(d.expectedVersion===current.ctl.version&&d.approvalDigest===current.digest,'publication_changed',409);requireStudy(!current.publicSummary.suppressed,'insufficient_accounts',409);
 const id=crypto.randomUUID(),guard=await seal(env,{publicSummary:current.publicSummary,guard:current.guard},id+':guard'),report={...current.publicSummary,releaseId:id,publishedAt:iso(now),studyId:c.studyId,catalogueVersion:c.catalogueVersion},expiry=Math.min(...current.rows.map(r=>r.metadata_expires_at)),ids=current.rows.map(r=>r.id);
 const statements=[
  env.DB.prepare("INSERT INTO study_intake_releases(id,study_id,request_key,request_hash,public_json,guard_ciphertext,key_id,created_at,guard_expires_at) SELECT ?,?,?,?,?,?,?,?,? FROM study_intake_control WHERE study_id=? AND version=? AND publication_locked=0").bind(id,c.studyId,d.requestKey,requestHash,JSON.stringify(report),guard,env.STUDY_INTAKE_STORAGE_KEY_ID,now,expiry,c.studyId,d.expectedVersion),
  env.DB.prepare('UPDATE study_intake_control SET current_release=?,version=version+1 WHERE study_id=? AND EXISTS(SELECT 1 FROM study_intake_releases WHERE id=?)').bind(id,c.studyId,id)
 ];for(let i=0;i<ids.length;i+=50){const part=ids.slice(i,i+50);statements.push(env.DB.prepare(`UPDATE study_intake_jobs SET published_at=COALESCE(published_at,?) WHERE id IN (${part.map(()=>'?').join(',')}) AND EXISTS(SELECT 1 FROM study_intake_releases WHERE id=?)`).bind(now,...part,id));}
 const rs=await env.DB.batch(statements);requireStudy(changed(rs[0]),'publication_changed',409);return json({report},201);
}
export async function handleStudyIntake(request,env={},options={}){
 const url=new URL(request.url);if(url.pathname!==STUDY_PREFIX&&!url.pathname.startsWith(STUDY_PREFIX+'/'))return null;
 const clock=options.clock??(()=>options.now??Date.now()),now=clock(),route=url.pathname.slice(STUDY_PREFIX.length);try{
  const c=configuration(env);
  if(route==='/config'&&request.method==='GET'){
   requireStudy([...url.searchParams.keys()].every(k=>k==='lang'),'invalid_input');const en=url.searchParams.get('lang')==='en',user=request.headers.get('oai-authenticated-user-id'),state=await readiness(env,c,now);
   return json({enabled:state.ready,authenticated:!!user,canRelease:state.ready&&env.STUDY_INTAKE_PUBLICATION_ENABLED==='true'&&!!user&&publishers(env).includes(user),signInUrl:'/signin-with-chatgpt?returnTo='+encodeURIComponent(en?'/en/analysis/':'/analyse/'),reason:state.reason,syntheticOnly:c?.syntheticOnly??null,consentVersion:c?.consentVersion??null,privacyUrl:c?.privacyUrl??null,controllerLabel:c?.controllerLabel??null,provider:c?{name:'OpenAI',model:c.model}:null,limits:LIMITS,retentionHours:c?.retentionHours??null,metadataRetentionDays:c?.metadataRetentionDays??null,catalogue:c?{version:c.catalogueVersion,rules:c.rules.map(({id,title,version,sourceUrl,validFrom,validUntil,authorityTypes})=>({id,title,version,sourceUrl,validFrom,validUntil,authorityTypes}))}:null});
  }
  requireStudy(!url.search,'invalid_input');
  if(route==='/progress'&&request.method==='GET'){
   if(!c||!env.DB||env.STUDY_INTAKE_PUBLICATION_ENABLED!=='true')return json({status:'not_available',report:null});const ctl=await first(env.DB,'SELECT * FROM study_intake_control WHERE study_id=?',c.studyId);const r=ctl?.current_release?await first(env.DB,'SELECT public_json FROM study_intake_releases WHERE id=?',ctl.current_release):null;return json({status:r?(ctl.publication_locked?'historical':'available'):'not_available',report:r?JSON.parse(r.public_json):null});
  }
  requireStudy(env.DB,'storage_unavailable',503);const user=owner(request);
  if(route==='/jobs'&&request.method==='GET'){const rows=(await env.DB.prepare('SELECT * FROM study_intake_jobs WHERE owner_id=? AND metadata_expires_at>? ORDER BY created_at DESC LIMIT 20').bind(user,now).all()).results||[];return json({jobs:rows.map(r=>dto(r,now))});}
  if(route==='/release-preview'&&request.method==='GET'){publisher(env,user);await ready(env,c,now);const candidate=await releaseCandidate(env,c,now);return json({expectedVersion:candidate.ctl.version,approvalDigest:candidate.digest,summary:candidate.publicSummary});}
  const m=route.match(/^\/jobs\/([0-9a-f-]{36})(\/run)?$/i);
  if(m&&!m[2]&&request.method==='GET')return await responseFor(env,await job(env,m[1],user,now),now);
  requireStudy(['POST','DELETE'].includes(request.method),'not_found',404);sameOrigin(request);
  if(route==='/jobs'&&request.method==='POST')return await create(request,env,c,user,now);
  if(m&&m[2]&&request.method==='POST')return await run(request,env,c,user,m[1],clock,options.fetch??globalThis.fetch);
  if(m&&!m[2]&&request.method==='DELETE')return await withdraw(request,env,user,m[1],now);
  if(route==='/releases'&&request.method==='POST')return await publish(request,env,c,user,now);
  throw new StudyError('not_found',404);
 }catch(e){return json({error:{code:e instanceof StudyError?e.code:'service_unavailable'}},e instanceof StudyError?e.status:503);}
}
