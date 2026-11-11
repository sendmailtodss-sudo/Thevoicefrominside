/* Explicit operator-only synthetic erasure. Not imported by the HTTP API or a scheduler. */
import crypto from 'node:crypto';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TABLES=['members','privacy_jobs','sessions','grants','reviewers','threads','messages','requests','reports','audit','quotas'];
const stable=x=>JSON.stringify(x,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
export const erasureDigest=x=>crypto.createHash('sha256').update(stable(x)).digest('hex');
const stop=code=>{throw Error(code);};
function subjectGuard(subject){if(!UUID.test(subject?.userId||'')||!UUID.test(subject?.jobId||'')||!UUID.test(subject?.intentId||'')||typeof subject?.email!=='string'||!/^[^\s@]+@[^\s@]+\.invalid$/.test(subject.email))stop('synthetic_subject_required');}
export function createErasureClient({url,serviceKey,expectedProjectRef,fetcher=fetch}){
 let u;try{u=new URL(url);}catch{stop('invalid_pinned_provider');}
 if(!/^[a-z0-9]{20}$/.test(expectedProjectRef||'')||u.protocol!=='https:'||u.hostname!==expectedProjectRef+'.supabase.co'||u.port||u.username||u.password||u.search||u.hash||!['','/'].includes(u.pathname)||!serviceKey)stop('invalid_pinned_provider');
 async function call(path,{method='GET',body,count=false,allow404=false}={}){
  let r;try{r=await fetcher(u.origin+path,{method,redirect:'error',headers:{apikey:serviceKey,Authorization:'Bearer '+serviceKey,Accept:'application/json',...(count?{Prefer:'count=exact',Range:'0-499'}:{}),...(body===undefined?{}:{'Content-Type':'application/json',Prefer:'return=representation'})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});}catch{stop('provider_transport_unknown');}
  const text=await r.text();if(text.length>4000000)stop('provider_response_too_large');let data;try{data=text?JSON.parse(text):null;}catch{stop('provider_invalid_json');}
  if(allow404&&r.status===404){if(data?.error_code!=='user_not_found'&&data?.code!=='user_not_found')stop('provider_404_not_user_not_found');return null;}if(!r.ok)stop('provider_request_failed');
  if(count){const range=r.headers.get('content-range')||'';const total=Number(range.split('/')[1]);if(!Number.isSafeInteger(total)||total>500||!Array.isArray(data)||data.length!==total)stop('bounded_inventory_incomplete');}
  return data;
 }
 const table=t=>{if(!TABLES.includes(t))stop('invalid_table');return '/rest/v1/sfi_forum_'+t;};
 return {projectRef:expectedProjectRef,async rows(t,filter){const q=new URLSearchParams({select:'*',...filter});return call(table(t)+'?'+q,{count:true});},async patch(t,filter,body){return call(table(t)+'?'+new URLSearchParams(filter),{method:'PATCH',body});},async authUser(id){if(!UUID.test(id))stop('invalid_subject');return call('/auth/v1/admin/users/'+id,{allow404:true});},async deleteAuth(id){if(!UUID.test(id))stop('invalid_subject');return call('/auth/v1/admin/users/'+id,{method:'DELETE',body:{should_soft_delete:false},allow404:true});}};
}
async function inventory(client,subject,{allowCompleted=false,allowRecovering=false}={}){
 subjectGuard(subject);const user=await client.authUser(subject.userId);
 const own={};for(const t of TABLES){const filter=t==='members'?{user_id:'eq.'+subject.userId}:t==='privacy_jobs'?{id:'eq.'+subject.jobId,subject_id:'eq.'+subject.userId}:t==='threads'||t==='messages'?{author_id:'eq.'+subject.userId}:t==='reports'?{reporter_id:'eq.'+subject.userId}:t==='audit'?{actor_id:'eq.'+subject.userId}:{user_id:'eq.'+subject.userId};own[t]=await client.rows(t,filter);}
 const m=own.members[0],job=own.privacy_jobs[0];if(own.members.length!==1||!m.synthetic_test||m.status!=='deleted'||m.identity_state!=='revoked'||own.privacy_jobs.length!==1||job.subject_id!==subject.userId||job.kind!=='erase')stop('existing_requested_revocation_required');
 if(!own.audit.some(a=>a.action==='erasure_requested'&&a.actor_id===subject.userId&&a.subject_id===subject.userId&&a.record_id===subject.jobId))stop('owner_erasure_request_proof_required');
 if(own.sessions.some(s=>!s.revoked_at)||own.grants.some(g=>g.state!=='revoked')||own.reviewers.some(r=>r.active))stop('access_not_fully_revoked');
 if(user){if(user.id!==subject.userId||user.email!==subject.email||user.user_metadata?.synthetic_only!==true||user.user_metadata?.pilot_intent!==subject.intentId)stop('provider_synthetic_identity_mismatch');}
 else if(!(allowCompleted&&job.state==='completed')&&!(allowRecovering&&['failed','running'].includes(job.state)&&job.attempt>0&&clean({own})))stop('auth_identity_missing_requires_reconciliation');
 const otherMessages=own.threads.length?await client.rows('messages',{thread_id:'in.('+own.threads.map(t=>t.id).join(',')+')',author_id:'neq.'+subject.userId}):[];
 const mutationCount=own.messages.length+own.threads.length+8;if(mutationCount>100)stop('operator_batch_limit');
 return {own,otherMessages,userPresent:!!user};
}
function counts(x){return Object.fromEntries(Object.entries(x.own).map(([k,v])=>[k,v.length]));}
function snapshot(x){return erasureDigest({own:x.own,otherMessages:x.otherMessages,userPresent:x.userPresent});}
function clean(x){return x.own.members.every(m=>m.alias==='Erased test participant'&&m.login_verified_at===null&&m.reviewed_by===null&&m.reviewed_at===null)&&x.own.messages.every(m=>m.body===''&&m.request_hash===null&&m.state==='deleted')&&x.own.threads.every(t=>t.title==='Erased test thread')&&x.own.requests.every(r=>r.request_hash===null)&&x.own.reports.every(r=>r.reason==='Erased test report')&&x.own.audit.every(a=>a.reason==='');}
export async function planSyntheticErasure(client,subject){
 const x=await inventory(client,subject,{allowCompleted:true,allowRecovering:true}),job=x.own.privacy_jobs[0];
 if(!['pending','failed','completed'].includes(job.state))stop('job_requires_operator_reconciliation');
 if(job.state==='completed'&&(!clean(x)||x.userPresent))stop('completed_job_not_verified');
 return {format:1,createdUtc:new Date().toISOString(),projectRef:client.projectRef,syntheticOnly:true,production:false,jobId:subject.jobId,subjectId:subject.userId,intentId:subject.intentId,emailDigest:erasureDigest(subject.email),state:job.state,attempt:job.attempt,inventoryDigest:snapshot(x),counts:counts(x),otherMessagesPreserved:x.otherMessages.length,alreadyCompleted:job.state==='completed',authAlreadyAbsent:!x.userPresent,providerDeletionCompleted:!x.userPresent,effects:['Replace only own message bodies/hashes with deleted tombstones.','Replace only own thread titles; retain thread state and all other authors messages.','Clear own alias/profile review fields, request hashes, own report and own audit reasons.','Keep revoked grants/sessions and pseudonymous UUID/audit/quota metadata.','Hard-delete only the verified synthetic Auth account after cleanup readback; confirm Auth GET404 before marking job completed.'],retained:['Member UUID tombstone and declared_role enum','Thread/message IDs, authorship UUIDs and timestamps','Revoked session/grant records, quota counters and audit action metadata','Other authors content and reports; provider backups/log retention outside this operator']};
}
export async function executeSyntheticErasure(client,subject,plan){
 subjectGuard(subject);if(plan?.format!==1||plan.projectRef!==client.projectRef||plan.subjectId!==subject.userId||plan.jobId!==subject.jobId||plan.intentId!==subject.intentId||plan.emailDigest!==erasureDigest(subject.email)||plan.syntheticOnly!==true||plan.production!==false)stop('reviewed_plan_subject_mismatch');
 if(!Number.isFinite(Date.parse(plan.createdUtc))||Math.abs(Date.now()-Date.parse(plan.createdUtc))>30*60000)stop('reviewed_plan_expired');
 const x=await inventory(client,subject,{allowCompleted:true,allowRecovering:true});if(snapshot(x)!==plan.inventoryDigest)stop('reviewed_inventory_changed');
 const job=x.own.privacy_jobs[0];if(job.state==='completed')return {state:'completed',alreadyCompleted:true,providerDeletionCompleted:true,activeContentPseudonymized:true,retained:plan.retained};
 if(!['pending','failed'].includes(job.state)||job.attempt!==plan.attempt)stop('job_claim_conflict');
 const claimed=await client.patch('privacy_jobs',{id:'eq.'+subject.jobId,subject_id:'eq.'+subject.userId,state:'eq.'+job.state,attempt:'eq.'+job.attempt},{state:'running',attempt:job.attempt+1,completed_at:null});if(claimed.length!==1)stop('job_claim_conflict');
 const attempt=job.attempt+1;let phase='pseudonymization',authDeletionConfirmed=false;
 try{
  for(const m of x.own.messages){if(m.body===''&&m.request_hash===null&&m.state==='deleted')continue;const rows=await client.patch('messages',{id:'eq.'+m.id,author_id:'eq.'+subject.userId,version:'eq.'+m.version},{body:'',request_hash:null,state:'deleted',version:m.version+1,updated_at:new Date().toISOString()});if(rows.length!==1)stop('message_version_conflict');}
  for(const t of x.own.threads){if(t.title==='Erased test thread')continue;const rows=await client.patch('threads',{id:'eq.'+t.id,author_id:'eq.'+subject.userId,version:'eq.'+t.version},{title:'Erased test thread',version:t.version+1});if(rows.length!==1)stop('thread_version_conflict');}
  const member=x.own.members[0];if(member.alias!=='Erased test participant'||member.login_verified_at!==null||member.reviewed_by!==null||member.reviewed_at!==null){const updated=await client.patch('members',{user_id:'eq.'+subject.userId,status:'eq.deleted',identity_state:'eq.revoked',version:'eq.'+member.version},{alias:'Erased test participant',login_verified_at:null,reviewed_by:null,reviewed_at:null,version:member.version+1,updated_at:new Date().toISOString()});if(updated.length!==1)stop('member_version_conflict');}
  await client.patch('requests',{user_id:'eq.'+subject.userId},{request_hash:null});await client.patch('reports',{reporter_id:'eq.'+subject.userId},{reason:'Erased test report'});await client.patch('audit',{actor_id:'eq.'+subject.userId},{reason:''});
  const after=await inventory(client,subject,{allowRecovering:true});if(!clean(after)||erasureDigest(after.otherMessages)!==erasureDigest(x.otherMessages))stop('cleanup_readback_failed');
  phase='auth_delete';let deleteUnknown=false;try{if(x.userPresent)await client.deleteAuth(subject.userId);}catch{deleteUnknown=true;}
  const remaining=await client.authUser(subject.userId);if(remaining)stop(deleteUnknown?'auth_delete_unknown_not_completed':'auth_delete_not_confirmed');authDeletionConfirmed=true;
  phase='completion';const final=await client.patch('privacy_jobs',{id:'eq.'+subject.jobId,subject_id:'eq.'+subject.userId,state:'eq.running',attempt:'eq.'+attempt},{state:'completed',completed_at:new Date().toISOString()});if(final.length!==1)stop('completion_status_unknown');
  const finalJob=await client.rows('privacy_jobs',{id:'eq.'+subject.jobId,subject_id:'eq.'+subject.userId});if(finalJob.length!==1||finalJob[0].state!=='completed')stop('completion_readback_failed');
  return {state:'completed',attempt,providerDeletionCompleted:true,activeContentPseudonymized:true,otherMessagesPreserved:x.otherMessages.length,retained:plan.retained};
 }catch(e){let failureStateConfirmed=false;try{const marked=await client.patch('privacy_jobs',{id:'eq.'+subject.jobId,subject_id:'eq.'+subject.userId,state:'eq.running',attempt:'eq.'+attempt},{state:'failed',completed_at:null});failureStateConfirmed=marked.length===1;}catch{}
  return {state:'failed',attempt,phase,failureCode:/^[a-z_]+$/.test(e.message||'')?e.message:'operation_unknown',failureStateConfirmed,providerDeletionCompleted:authDeletionConfirmed,accessRemainsRevoked:true,requiresOperatorReconciliation:true};
 }
}
