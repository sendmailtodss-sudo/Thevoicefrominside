/* Explicit opt-in integration check. Creates ONLY synthetic .invalid users in the configured private pilot. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {handleForumRequest} from '../server/forum-api.mjs';

const args=process.argv.slice(2);
const resume=args.includes('--resume-after-business-conflict-fix');
const value=key=>args[args.indexOf(key)+1];
if(!args.includes('--run-private-synthetic')||!args.includes('--credentials')||!args.includes('--out')||!args.includes('--project-ref')){
 console.error('Usage: node --use-env-proxy scripts/check-forum-provider.mjs --run-private-synthetic --credentials /private/provider.env --project-ref EXPECTED_REF --out /private/new-check-directory');process.exit(2);
}
const projectRef=value('--project-ref');if(!/^[a-z0-9]{20}$/.test(projectRef||''))throw Error('invalid_expected_project');
const out=path.resolve(value('--out'));fs.mkdirSync(out,{recursive:true,mode:0o700});fs.chmodSync(out,0o700);
const file=path.resolve(value('--credentials'));if(fs.statSync(file).mode&0o077)throw Error('credentials_file_must_be_private');
const raw={};for(const line of fs.readFileSync(file,'utf8').split('\n')){if(line&&!line.startsWith('#')&&line.includes('=')){const i=line.indexOf('=');raw[line.slice(0,i)]=JSON.parse(line.slice(i+1));}}
const base=raw.SFI_EU_SUPABASE_URL,anon=raw.SFI_EU_SUPABASE_ANON_KEY,service=raw.SFI_EU_SUPABASE_SERVICE_ROLE_KEY;
const providerUrl=new URL(base);
if(providerUrl.protocol!=='https:'||providerUrl.hostname!==`${projectRef}.supabase.co`||providerUrl.port||providerUrl.username||providerUrl.password||providerUrl.search||providerUrl.hash||!['','/'].includes(providerUrl.pathname)||!anon||!service)throw Error('wrong_pilot_resource');
const env={FORUM_PRIVATE_MODE:'synthetic',VERCEL_ENV:'preview',FORUM_SUPABASE_URL:base,FORUM_SUPABASE_ANON_KEY:anon,FORUM_SUPABASE_SERVICE_ROLE_KEY:service,FORUM_EXPECTED_PROJECT_REF:projectRef,FORUM_ALLOWED_ORIGINS:'https://private-check.example.invalid'};
const report={startedUtc:new Date().toISOString(),source:'actual_supabase_private_pilot',projectRef,syntheticOnly:true,production:false,tests:[],providerDeletionCompleted:false};
let phase='initialise';
function assert(ok,label){if(!ok)throw Error(label);report.tests.push({check:label,pass:true});}
function persist(){fs.writeFileSync(path.join(out,'PROVIDER-CHECK-REPORT.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});}
async function remote(endpoint,{admin=false,token,method='GET',body}={}){
 const key=admin?service:anon;const r=await fetch(base+endpoint,{method,redirect:'error',headers:{apikey:key,Authorization:'Bearer '+(token||key),...(body===undefined?{}:{'Content-Type':'application/json','Prefer':'return=representation,resolution=merge-duplicates'})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(15000)});
 const t=await r.text();let data=null;try{data=t?JSON.parse(t):null;}catch{}report.lastRequest={kind:'provider',path:endpoint.split('?')[0],status:r.status,...(/^[A-Z0-9]{5}$/.test(data?.code||'')?{providerCode:data.code}:{})};return {status:r.status,data};
}
const accountPath=path.join(out,'ACCOUNTS-PRIVATE-DO-NOT-UPLOAD.json');
let fixture;
if(fs.existsSync(accountPath))fixture=JSON.parse(fs.readFileSync(accountPath,'utf8'));
else{fixture={intentId:crypto.randomUUID(),createdUtc:new Date().toISOString(),accounts:{}};for(const label of ['inside','relative','moderator','reviewer','pending','erase','quota'])fixture.accounts[label]={email:`${label}-${fixture.intentId}@forum.invalid`,password:crypto.randomBytes(24).toString('base64url')};fs.writeFileSync(accountPath,JSON.stringify(fixture,null,2)+'\n',{mode:0o600});}
if(fixture.testsStarted){
 const priorPath=path.join(out,'PROVIDER-CHECK-REPORT.json');
 const priorBytes=fs.existsSync(priorPath)?fs.readFileSync(priorPath):null;
 const prior=priorBytes&&JSON.parse(priorBytes);
 if(!resume||prior?.passed!==false||prior?.failedPhase!=='persistence_and_idempotency'||prior?.failedCheck!=='changed_payload_same_key_conflicts'||prior?.tests?.length!==49){console.error('Existing test fixture requires explicit reconciliation. No accounts or memberships were changed.');process.exit(2);}
 const archive=path.join(out,'PROVIDER-CHECK-REPORT-v1-PARTIAL49.json');
 if(fs.existsSync(archive)&&!fs.readFileSync(archive).equals(priorBytes))throw Error('prior_evidence_archive_conflict');
 if(!fs.existsSync(archive))fs.writeFileSync(archive,priorBytes,{mode:0o600,flag:'wx'});
 report.priorEvidence={file:path.basename(archive),sha256:crypto.createHash('sha256').update(priorBytes).digest('hex'),passedChecks:49,failedCheck:prior.failedCheck};
 report.resumeMode='same_fixture_after_business_conflict_fix_no_reseed';
}else if(resume){throw Error('resume_requires_exact_prior_partial_failure');}
const saveAccounts=()=>fs.writeFileSync(accountPath,JSON.stringify(fixture,null,2)+'\n',{mode:0o600});
async function api(route,{label,method='GET',body,headers={}}={}){
 const a=label&&fixture.accounts[label];const r=await handleForumRequest(new Request('https://private-check.example.invalid/api/forum'+route,{method,headers:{...(a?.cookie?{Cookie:a.cookie}:{}),...(body===undefined?{}:{Origin:'https://private-check.example.invalid','Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})}),{env});
 const data=await r.json();report.lastRequest={kind:'api',path:route.split('?')[0],status:r.status,errorCode:data.error?.code};return {status:r.status,data,cookie:r.headers.get('set-cookie')};
}
async function login(label){const a=fixture.accounts[label];const r=await api('/login',{method:'POST',body:{email:a.email,password:a.password}});assert(r.status===200,`actual_login_${label}`);a.cookie=r.cookie.split(';')[0];a.token=decodeURIComponent(a.cookie.slice(a.cookie.indexOf('=')+1));saveAccounts();return r.data.data;}
try{
 phase='schema_present';const health=await remote('/rest/v1/sfi_forum_rooms?select=id',{admin:true});assert(health.status===200&&health.data?.length===2,'actual_schema_two_rooms');
 phase='seed_synthetic_auth';
 if(!resume){
 for(const [label,a]of Object.entries(fixture.accounts)){
  if(!a.id){let r=await remote('/auth/v1/admin/users',{admin:true,method:'POST',body:{email:a.email,password:a.password,email_confirm:true,user_metadata:{synthetic_only:true,pilot_intent:fixture.intentId}}});
   if(r.status!==200&&r.status!==201){const list=await remote('/auth/v1/admin/users?page=1&per_page=1000',{admin:true});const found=list.data?.users?.find(u=>u.email===a.email&&u.user_metadata?.pilot_intent===fixture.intentId);if(found)r={status:200,data:found};}
   assert([200,201].includes(r.status)&&r.data?.id,`synthetic_account_created_${label}`);a.id=r.data.id;saveAccounts();
  }
  if(!/^[0-9a-f-]{36}$/i.test(a.id))throw Error('invalid_fixture_subject');
  const actual=await remote('/auth/v1/admin/users/'+encodeURIComponent(a.id),{admin:true});
  assert(actual.status===200&&actual.data?.email===a.email&&actual.data?.user_metadata?.synthetic_only===true&&actual.data?.user_metadata?.pilot_intent===fixture.intentId,`synthetic_account_identity_checked_${label}`);
  const old=await remote('/rest/v1/sfi_forum_members?select=status&user_id=eq.'+a.id,{admin:true});
  assert(old.status===200&&!old.data.some(m=>['deleted','suspended','rejected'].includes(m.status)),`prior_revocation_not_reactivated_${label}`);
  const pending=label==='pending';const member={user_id:a.id,alias:`Test ${label}`,declared_role:label==='relative'?'relative':['reviewer','moderator'].includes(label)?'professional':'former',synthetic_test:true,status:pending?'pending':'approved',identity_state:pending?'pending':'synthetic_verified'};
  const seed=await remote('/rest/v1/sfi_forum_members',{admin:true,method:'POST',body:member});assert([200,201].includes(seed.status),`synthetic_member_seed_${label}`);
 }
 for(const [label,room,role]of [['inside','inside','member'],['relative','relatives','member'],['moderator','inside','moderator'],['erase','inside','member'],['quota','inside','member']]){const r=await remote('/rest/v1/sfi_forum_grants',{admin:true,method:'POST',body:{user_id:fixture.accounts[label].id,room_id:room,access_role:role,state:'active'}});assert([200,201].includes(r.status),`scoped_grant_${label}`);}
 const reviewSeed=await remote('/rest/v1/sfi_forum_reviewers',{admin:true,method:'POST',body:{user_id:fixture.accounts.reviewer.id,active:true}});assert([200,201].includes(reviewSeed.status),'separate_membership_reviewer_seeded');
 fixture.testsStarted=true;saveAccounts();
 phase='auth_and_rooms';for(const label of Object.keys(fixture.accounts))await login(label);
 }else{
 phase='resume_readonly_fixture_verification';
 for(const [label,a]of Object.entries(fixture.accounts)){
  const actual=await remote('/auth/v1/admin/users/'+encodeURIComponent(a.id),{admin:true});
  assert(actual.status===200&&actual.data?.email===a.email&&actual.data?.user_metadata?.synthetic_only===true&&actual.data?.user_metadata?.pilot_intent===fixture.intentId,`resume_synthetic_identity_${label}`);
  const me=await api('/me',{label});
  assert(me.status===200&&me.data.data.member.user_id===a.id&&me.data.data.member.status===(label==='pending'?'pending':'approved'),`resume_original_session_and_state_${label}`);
 }
 }
 let r=await api('/rooms',{label:'inside'});assert(r.status===200&&r.data.data.rooms.map(x=>x.id).join()==='inside','inside_has_only_inside_room');
 r=await api('/rooms',{label:'relative'});assert(r.status===200&&r.data.data.rooms.map(x=>x.id).join()==='relatives','relative_has_only_relatives_room');
 r=await api('/rooms',{label:'reviewer'});assert(r.status===200&&r.data.data.rooms.length===0,'membership_reviewer_does_not_gain_chat_access');
 r=await api('/rooms',{headers:{'oai-authenticated-user-id':fixture.accounts.inside.id}});assert(r.status===401,'forged_sites_header_fails_actual_backend');
 phase='persistence_and_idempotency';let thread,message,payload;
 if(!resume){const threadKey=crypto.randomUUID();r=await api('/threads',{label:'inside',method:'POST',body:{room:'inside',title:'Synthetic creative check',body:'Only invented test content.',idempotency_key:threadKey}});assert(r.status===200&&r.data.data.thread.id,'actual_thread_created');thread=r.data.data.thread;
 const key=crypto.randomUUID();payload={thread_id:thread.id,body:'Synthetic persistent reply.',idempotency_key:key};const pair=await Promise.all([api('/messages',{label:'inside',method:'POST',body:payload}),api('/messages',{label:'inside',method:'POST',body:payload})]);assert(pair.every(x=>x.status===200)&&pair[0].data.data.message.id===pair[1].data.data.message.id&&pair.filter(x=>x.data.data.replayed).length===1,'concurrent_duplicate_is_one_record');message=pair[0].data.data.message;
 const duplicateQuota=await remote('/rest/v1/sfi_forum_quotas?select=bucket,count&user_id=eq.'+fixture.accounts.inside.id,{admin:true});
 assert(duplicateQuota.status===200&&duplicateQuota.data.find(x=>x.bucket==='messages')?.count===1&&duplicateQuota.data.find(x=>x.bucket==='writes')?.count===2,'idempotent_duplicate_debits_quota_only_once');
 }else{
 r=await api('/threads?room=inside',{label:'inside'});const found=r.data.data?.threads?.filter(x=>x.title==='Synthetic creative check'&&x.author_id===fixture.accounts.inside.id);assert(r.status===200&&found?.length===1,'resume_same_original_thread');thread=found[0];
 r=await api('/messages?thread_id='+thread.id,{label:'inside'});const foundMessages=r.data.data?.messages?.filter(x=>x.body==='Synthetic persistent reply.'&&x.author_id===fixture.accounts.inside.id);assert(r.status===200&&foundMessages?.length===1&&foundMessages[0].client_request_id,'resume_same_original_message_and_key');message=foundMessages[0];payload={thread_id:thread.id,body:message.body,idempotency_key:message.client_request_id};
 }
 const conflictStarted=Date.now();const conflictDirect=await remote('/rest/v1/rpc/sfi_forum_rpc',{token:fixture.accounts.inside.token,method:'POST',body:{p_action:'create_message',p_payload:{...payload,body:'Changed synthetic content.'}}});
 assert(conflictDirect.status===409&&conflictDirect.data?.code==='PT409','direct_rpc_business_conflict_is_http409_pt409');report.businessConflict={status:conflictDirect.status,code:conflictDirect.data.code,elapsedMs:Date.now()-conflictStarted};
 r=await api('/messages',{label:'inside',method:'POST',body:{...payload,body:'Changed synthetic content.'}});assert(r.status===409,'changed_payload_same_key_conflicts');
 r=await api('/messages?thread_id='+thread.id,{label:'inside'});assert(r.status===200&&r.data.data.messages.filter(x=>x.id===message.id).length===1,'persisted_message_readback_once');
 const direct=await remote('/rest/v1/sfi_forum_messages?select=id,body&id=eq.'+message.id,{token:fixture.accounts.inside.token});assert(direct.status===200&&direct.data.length===1,'direct_provider_read_authorised_context');
 phase='direct_rls_isolation';r=await api('/messages?thread_id='+thread.id,{label:'relative'});assert(r.status===404,'guessed_cross_room_thread_hidden');
 const denied=await remote('/rest/v1/sfi_forum_messages?select=id,body&id=eq.'+message.id,{token:fixture.accounts.relative.token});assert(denied.status===200&&denied.data.length===0,'direct_provider_cross_room_rls_hides_message');
 const mutation=await remote('/rest/v1/sfi_forum_members?user_id=eq.'+fixture.accounts.relative.id,{token:fixture.accounts.relative.token,method:'PATCH',body:{status:'approved',identity_state:'synthetic_verified'}});assert([401,403].includes(mutation.status),'direct_provider_membership_write_denied');
 phase='durable_concurrent_quota';const quotaThread=await api('/threads',{label:'quota',method:'POST',body:{room:'inside',title:'Synthetic quota check',body:'Only invented quota content.',idempotency_key:crypto.randomUUID()}});assert(quotaThread.status===200,'quota_fixture_thread_created');
 const qSeed=await remote('/rest/v1/sfi_forum_quotas',{admin:true,method:'POST',body:{user_id:fixture.accounts.quota.id,day:new Date().toISOString().slice(0,10),bucket:'messages',count:199}});assert([200,201].includes(qSeed.status),'durable_quota_fixture_at_boundary');
 const qPair=await Promise.all(['first','second'].map(body=>api('/messages',{label:'quota',method:'POST',body:{thread_id:quotaThread.data.data.thread.id,body:'Synthetic quota '+body,idempotency_key:crypto.randomUUID()}})));
 assert(qPair.filter(x=>x.status===200).length===1&&qPair.filter(x=>x.status===429).length===1,'concurrent_quota_boundary_one_success_one_rejection');
 const qCount=await remote('/rest/v1/sfi_forum_quotas?select=bucket,count&user_id=eq.'+fixture.accounts.quota.id,{admin:true});assert(qCount.status===200&&qCount.data.find(x=>x.bucket==='messages')?.count===200&&qCount.data.find(x=>x.bucket==='writes')?.count===2,'quota_rejection_does_not_debit_successful_write_twice');
 phase='membership_review';r=await api('/application',{label:'pending',method:'POST',body:{alias:'Synthetic applicant',declared_role:'former',version:1,ack:true}});assert(r.status===200,'pending_application_persisted');let pending=r.data.data.member;
 const review=async(decision,v= pending.version)=>api('/members/review',{label:'reviewer',method:'POST',body:{subject_id:pending.user_id,version:v,decision,rooms:['inside'],reason:'Synthetic pilot review only.'}});
 r=await review('verify_test');assert(r.status===200&&r.data.data.member.identity_state==='synthetic_verified','synthetic_review_is_separate_from_approval');pending=r.data.data.member;
 r=await review('approve');assert(r.status===200&&r.data.data.member.status==='approved','reviewer_approves_other_synthetic_member');pending=r.data.data.member;
 r=await review('approve',pending.version-1);assert(r.status===409,'stale_review_version_conflicts');
 r=await api('/rooms',{label:'pending'});assert(r.status===200&&r.data.data.rooms.length===1,'approval_effective_on_next_request');
 r=await api('/members/review',{label:'relative',method:'POST',body:{subject_id:fixture.accounts.relative.id,version:1,decision:'approve',rooms:['inside'],reason:'Should fail.'},headers:{'oai-authenticated-user-id':fixture.accounts.reviewer.id}});assert(r.status===403,'normal_member_cannot_self_approve_with_forged_header');
 phase='reports_and_moderation';r=await api('/messages/report',{label:'inside',method:'POST',body:{message_id:message.id,version:message.version,reason:'Synthetic moderation check.'}});assert(r.status===200,'report_persisted');
 r=await api('/reports?room=inside',{label:'moderator'});assert(r.status===200&&r.data.data.reports.some(x=>x.message_id===message.id),'scoped_moderator_lists_reports');
 r=await api('/messages/moderate',{label:'moderator',method:'POST',body:{message_id:message.id,version:message.version,state:'hidden',reason:'Synthetic hide check.'}});assert(r.status===200&&r.data.data.message.state==='hidden','scoped_moderator_hides_message');
 r=await api('/messages?thread_id='+thread.id,{label:'inside'});assert(!r.data.data.messages.some(x=>x.id===message.id),'hidden_message_absent_for_member');
 r=await api('/messages?thread_id='+thread.id,{label:'moderator'});assert(r.data.data.messages.some(x=>x.id===message.id),'hidden_message_visible_to_room_moderator');
 phase='revoke_versus_write';const insideMe=(await api('/me',{label:'inside'})).data.data.member;const oldToken=fixture.accounts.inside.token;const oldClaims=JSON.parse(Buffer.from(oldToken.split('.')[1],'base64url').toString());
 const race=await Promise.all([api('/messages',{label:'inside',method:'POST',body:{thread_id:thread.id,body:'Synthetic concurrency check.',idempotency_key:crypto.randomUUID()}}),api('/members/review',{label:'reviewer',method:'POST',body:{subject_id:insideMe.user_id,version:insideMe.version,decision:'suspend',rooms:[],reason:'Synthetic revoke race.'}})]);
 assert([200,401].includes(race[0].status)&&race[1].status===200,'revoke_write_race_serialised');
 r=await api('/messages?thread_id='+thread.id,{label:'inside'});assert(r.status===401,'existing_session_blocked_after_suspend');
 const directRevoked=await remote('/rest/v1/sfi_forum_messages?select=id,body&thread_id=eq.'+thread.id,{token:oldToken});assert(directRevoked.status===401||directRevoked.status===200&&directRevoked.data.length===0,'revocation_blocks_direct_provider_read_with_old_jwt');
 const resurrection=await remote('/rest/v1/rpc/sfi_forum_register_session',{admin:true,method:'POST',body:{p_user_id:insideMe.user_id,p_session_id:oldClaims.session_id,p_expires_at:new Date(oldClaims.exp*1000).toISOString()}});assert([401,403].includes(resurrection.status)&&resurrection.data?.code==='28000','revoked_session_cannot_be_registered_again');
 phase='privacy_and_logout';r=await api('/threads',{label:'erase',method:'POST',body:{room:'inside',title:'Synthetic erasure check',body:'Only my invented content.',idempotency_key:crypto.randomUUID()}});assert(r.status===200,'erasure_fixture_content_created');const ownMessageId=r.data.data.message.id;
 r=await api('/privacy/export',{label:'erase',method:'POST',body:{}});assert(r.status===200&&r.data.data.scope==='own_data_only'&&r.data.data.export.ownMessages.some(x=>x.id===ownMessageId)&&r.data.data.export.ownMessages.every(x=>x.author_id===fixture.accounts.erase.id),'export_includes_new_own_message_and_no_other_authors');
 r=await api('/privacy/erase',{label:'erase',method:'POST',body:{}});assert(r.status===200&&r.data.data.accessRevoked===true&&r.data.data.providerDeletionCompleted===false&&r.data.data.job.state==='pending','erasure_revokes_access_and_honestly_remains_pending');
 r=await api('/rooms',{label:'erase'});assert(r.status===401,'erasure_revokes_existing_session');
 r=await api('/logout',{label:'relative',method:'POST',body:{}});assert(r.status===200&&r.cookie.includes('Max-Age=0'),'actual_logout_clears_cookie');
 r=await api('/rooms',{label:'relative'});assert(r.status===401,'logged_out_cookie_not_reusable');
 report.completedUtc=new Date().toISOString();report.passed=true;report.totalChecksAcrossEvidence=report.tests.length+(report.priorEvidence?.passedChecks||0);report.livePublicForum=false;report.limitations=['No Vercel/browser deployment tested by this runner.','Erasure job intentionally remains pending; no provider deletion claim.','Synthetic test accounts/rows retained in the private EU pilot for follow-up.'];persist();console.log(JSON.stringify({passed:true,checks:report.tests.length,totalChecksAcrossEvidence:report.totalChecksAcrossEvidence,report:path.join(out,'PROVIDER-CHECK-REPORT.json'),privateAccountsRetained:true}));
}catch(error){report.failedPhase=phase;report.failedCheck=/^[a-zA-Z0-9_]+$/.test(error?.message||'')?error.message:'transport_or_provider_error';report.passed=false;report.completedUtc=new Date().toISOString();persist();console.log(JSON.stringify({passed:false,phase,check:report.failedCheck,report:path.join(out,'PROVIDER-CHECK-REPORT.json')}));process.exitCode=1;}
