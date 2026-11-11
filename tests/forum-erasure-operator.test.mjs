import test from 'node:test';
import assert from 'node:assert/strict';
import {planSyntheticErasure,executeSyntheticErasure,createErasureClient} from '../server/forum-erasure-operator.mjs';

const ID='11111111-1111-4111-8111-111111111111';
const JOB='22222222-2222-4222-8222-222222222222';
const INTENT='33333333-3333-4333-8333-333333333333';
const OTHER='44444444-4444-4444-8444-444444444444';
const THREAD='55555555-5555-4555-8555-555555555555';
const MESSAGE='66666666-6666-4666-8666-666666666666';
const REF='aaaaaaaaaaaaaaaaaaaa';
const subject={userId:ID,jobId:JOB,intentId:INTENT,email:'erase-fixture@forum.invalid'};
const clone=x=>structuredClone(x);

function memoryClient(options={}) {
  const tables={
    members:[{user_id:ID,alias:'Synthetic old alias',declared_role:'former',synthetic_test:true,status:'deleted',identity_state:'revoked',version:3,login_verified_at:'2026-11-11T20:00:00Z',reviewed_by:OTHER,reviewed_at:'2026-11-11T20:00:00Z'}],
    privacy_jobs:[{id:JOB,subject_id:ID,kind:'erase',state:'pending',attempt:0,created_at:'2026-11-11T20:00:00Z',completed_at:null}],
    sessions:[{provider_session_id:'synthetic-session',user_id:ID,revoked_at:'2026-11-11T20:00:00Z'}],
    grants:[{user_id:ID,room_id:'inside',state:'revoked',version:2}],
    reviewers:[{user_id:ID,active:false}],
    threads:[{id:THREAD,author_id:ID,room_id:'inside',title:'My invented title',state:'active',version:1},{id:'other-thread',author_id:OTHER,room_id:'inside',title:'Another title',state:'locked',version:4}],
    messages:[{id:MESSAGE,author_id:ID,thread_id:THREAD,body:'My invented personal text',request_hash:'a'.repeat(64),state:'active',version:2},{id:'other-message',author_id:OTHER,thread_id:THREAD,body:'Other participant text must remain',request_hash:'b'.repeat(64),state:'active',version:7},{id:'own-other-thread',author_id:ID,thread_id:'other-thread',body:'My second invented text',request_hash:'c'.repeat(64),state:'hidden',version:4}],
    requests:[{user_id:ID,request_id:'own-request',request_hash:'d'.repeat(64)},{user_id:OTHER,request_id:'other-request',request_hash:'e'.repeat(64)}],
    reports:[{id:'own-report',reporter_id:ID,message_id:'other-message',reason:'My invented report',state:'pending'},{id:'other-report',reporter_id:OTHER,message_id:MESSAGE,reason:'Another author report remains',state:'pending'}],
    audit:[{id:'owner-request',actor_id:ID,subject_id:ID,action:'erasure_requested',record_id:JOB,reason:''},{id:'own-audit',actor_id:ID,subject_id:OTHER,action:'synthetic_action',reason:'My invented audit reason'},{id:'other-audit',actor_id:OTHER,subject_id:ID,action:'member_reviewed',reason:'Another reviewer reason remains'}],
    quotas:[{user_id:ID,day:'2026-11-11',bucket:'writes',count:2}]
  };
  let auth={id:ID,email:subject.email,user_metadata:{synthetic_only:true,pilot_intent:INTENT}};
  const calls={rows:[],patch:[],authUser:[],deleteAuth:[]};
  function matches(row,filter){
    return Object.entries(filter||{}).every(([key,expression])=>{
      if(expression.startsWith('eq.'))return String(row[key])===expression.slice(3);
      if(expression.startsWith('neq.'))return String(row[key])!==expression.slice(4);
      if(expression.startsWith('in.(')&&expression.endsWith(')'))return expression.slice(4,-1).split(',').includes(String(row[key]));
      throw Error('unsupported_test_filter');
    });
  }
  const client={projectRef:REF,tables,calls,
    async rows(table,filters){calls.rows.push({table,filters:clone(filters)});return clone((tables[table]||[]).filter(row=>matches(row,filters)));},
    async patch(table,filters,body){
      calls.patch.push({table,filters:clone(filters),body:clone(body)});
      if(options.claimRace&&table==='privacy_jobs'&&body.state==='running')return [];
      if(options.cleanupFailure&&table==='messages')throw Error('synthetic_cleanup_failure');
      const rows=(tables[table]||[]).filter(row=>matches(row,filters));for(const row of rows)Object.assign(row,clone(body));return clone(rows);
    },
    async authUser(id){calls.authUser.push(id);return clone(auth);},
    async deleteAuth(id){calls.deleteAuth.push(id);if(options.uncertainDeletePresent)throw Error('synthetic_transport_unknown');auth=null;if(options.uncertainDeleteGone)throw Error('synthetic_transport_unknown');return null;},
    setAuth(value){auth=clone(value);}
  };
  return client;
}

const noWrites=c=>{assert.equal(c.calls.patch.length,0);assert.equal(c.calls.deleteAuth.length,0);};

test('dry run inventories a requested synthetic erasure without writes or plaintext in the plan',async()=>{
 const c=memoryClient(),before=clone(c.tables);const p=await planSyntheticErasure(c,subject);
 assert.equal(p.state,'pending');assert.equal(p.syntheticOnly,true);assert.equal(p.production,false);assert.equal(p.otherMessagesPreserved,1);assert.equal(p.counts.messages,2);
 assert(!JSON.stringify(p).includes('My invented personal text'));assert(!JSON.stringify(p).includes('Synthetic old alias'));assert.deepEqual(c.tables,before);noWrites(c);
});

test('identity, authoritative DB pilot flag and owner erasure request must all be present',async(t)=>{
 await t.test('a real-domain address fails before even an inventory read',async()=>{const c=memoryClient();await assert.rejects(planSyntheticErasure(c,{...subject,email:'person@example.com'}),/synthetic_subject_required/);assert.equal(c.calls.rows.length,0);noWrites(c);});
 await t.test('caller metadata does not replace the DB synthetic flag',async()=>{const c=memoryClient();c.tables.members[0].synthetic_test=false;await assert.rejects(planSyntheticErasure(c,subject),/existing_requested_revocation_required/);noWrites(c);});
 await t.test('a provider identity from another pilot is rejected',async()=>{const c=memoryClient();c.setAuth({id:ID,email:subject.email,user_metadata:{synthetic_only:true,pilot_intent:OTHER}});await assert.rejects(planSyntheticErasure(c,subject),/provider_synthetic_identity_mismatch/);noWrites(c);});
 await t.test('no owner-authored request audit means no executable plan',async()=>{const c=memoryClient();c.tables.audit=c.tables.audit.filter(x=>x.action!=='erasure_requested');await assert.rejects(planSyntheticErasure(c,subject),/owner.*request|requested.*audit|erasure_request|owner_request/);noWrites(c);});
 await t.test('an active grant blocks cleanup rather than silently continuing',async()=>{const c=memoryClient();c.tables.grants[0].state='active';await assert.rejects(planSyntheticErasure(c,subject),/access_not_fully_revoked/);noWrites(c);});
});

test('execution pseudonymises only the owner, preserves thread state and other authors, and is idempotent after readback',async()=>{
 const c=memoryClient();const otherMessage=clone(c.tables.messages.find(x=>x.author_id===OTHER));const otherReport=clone(c.tables.reports.find(x=>x.reporter_id===OTHER));const otherAudit=clone(c.tables.audit.find(x=>x.actor_id===OTHER));const control=clone({sessions:c.tables.sessions,grants:c.tables.grants,quotas:c.tables.quotas});
 const p=await planSyntheticErasure(c,subject);const result=await executeSyntheticErasure(c,subject,p);
 assert.equal(result.state,'completed');assert.equal(result.providerDeletionCompleted,true);assert.equal(c.calls.deleteAuth.length,1);
 assert(c.tables.messages.filter(x=>x.author_id===ID).every(x=>x.body===''&&x.request_hash===null&&x.state==='deleted'));
 assert.equal(c.tables.members[0].user_id,ID);assert.equal(c.tables.members[0].status,'deleted');assert.equal(c.tables.members[0].identity_state,'revoked');assert.equal(c.tables.members[0].alias,'Erased test participant');
 assert.equal(c.tables.threads.find(x=>x.id===THREAD).state,'active');assert.equal(c.tables.threads.find(x=>x.id===THREAD).title,'Erased test thread');assert.equal(c.tables.threads.find(x=>x.author_id===OTHER).title,'Another title');
 assert.deepEqual(c.tables.messages.find(x=>x.author_id===OTHER),otherMessage);assert.deepEqual(c.tables.reports.find(x=>x.reporter_id===OTHER),otherReport);assert.deepEqual(c.tables.audit.find(x=>x.actor_id===OTHER),otherAudit);assert.deepEqual({sessions:c.tables.sessions,grants:c.tables.grants,quotas:c.tables.quotas},control);
 assert.equal(c.tables.reports.find(x=>x.reporter_id===ID).state,'pending');assert.equal(c.tables.requests.find(x=>x.user_id===OTHER).request_hash,'e'.repeat(64));assert.equal(c.tables.privacy_jobs[0].state,'completed');
 const writes=c.calls.patch.length;const again=await executeSyntheticErasure(c,subject,await planSyntheticErasure(c,subject));assert.equal(again.alreadyCompleted,true);assert.equal(c.calls.patch.length,writes);assert.equal(c.calls.deleteAuth.length,1);
});

test('a failed CAS claim stops before content changes and Auth deletion',async()=>{
 const c=memoryClient({claimRace:true});const p=await planSyntheticErasure(c,subject);await assert.rejects(executeSyntheticErasure(c,subject,p),/job_claim_conflict/);
 assert.equal(c.calls.deleteAuth.length,0);assert.equal(c.calls.patch.filter(x=>x.table!=='privacy_jobs').length,0);assert.equal(c.tables.messages[0].body,'My invented personal text');
});

test('cleanup failure is recorded as failed, never as provider deletion or completion',async()=>{
 const c=memoryClient({cleanupFailure:true});const result=await executeSyntheticErasure(c,subject,await planSyntheticErasure(c,subject));
 assert.equal(result.state,'failed');assert.equal(result.providerDeletionCompleted,false);assert.equal(result.accessRemainsRevoked,true);assert.equal(result.requiresOperatorReconciliation,true);assert.equal(c.calls.deleteAuth.length,0);assert.equal(c.tables.privacy_jobs[0].state,'failed');assert.equal(c.tables.members[0].status,'deleted');
});

test('uncertain Auth delete is resolved by the observed GET state',async(t)=>{
 await t.test('GET proves account gone: complete without a second DELETE',async()=>{const c=memoryClient({uncertainDeleteGone:true});const result=await executeSyntheticErasure(c,subject,await planSyntheticErasure(c,subject));assert.equal(result.state,'completed');assert.equal(result.providerDeletionCompleted,true);assert.equal(c.calls.deleteAuth.length,1);});
 await t.test('GET still finds account: keep failed and access revoked',async()=>{const c=memoryClient({uncertainDeletePresent:true});const result=await executeSyntheticErasure(c,subject,await planSyntheticErasure(c,subject));assert.equal(result.state,'failed');assert.equal(result.providerDeletionCompleted,false);assert.equal(c.tables.privacy_jobs[0].state,'failed');assert.equal(c.calls.deleteAuth.length,1);});
});

test('changed inventory or a changed target cannot be executed under a prior reviewed plan',async()=>{
 const c=memoryClient();const p=await planSyntheticErasure(c,subject);c.tables.messages[0].body='A later changed owner message';c.tables.messages[0].version++;
 await assert.rejects(executeSyntheticErasure(c,subject,p),/reviewed_inventory_changed/);noWrites(c);
 await assert.rejects(executeSyntheticErasure(c,{...subject,userId:OTHER},p),/reviewed_plan_subject_mismatch/);noWrites(c);
});

test('provider client pins HTTPS and treats only the documented user-not-found response as absence',async()=>{
 for(const url of [`http://${REF}.supabase.co`,`https://${REF}.supabase.co:444`,`https://${REF}.supabase.co/other`,`https://user@${REF}.supabase.co`,`https://${REF}.supabase.co?x=1`])assert.throws(()=>createErasureClient({url,serviceKey:'synthetic-key',expectedProjectRef:REF}),/invalid_pinned_provider/);
 let calls=0;
 const c=createErasureClient({url:`https://${REF}.supabase.co`,serviceKey:'synthetic-key',expectedProjectRef:REF,fetcher:async()=>{calls++;return Response.json({code:'different_endpoint_missing'},{status:404});}});
 await assert.rejects(c.authUser(ID),error=>/^provider_/.test(error.message));assert.equal(calls,1);
 const valid=createErasureClient({url:`https://${REF}.supabase.co`,serviceKey:'synthetic-key',expectedProjectRef:REF,fetcher:async()=>Response.json({code:'user_not_found'},{status:404})});assert.equal(await valid.authUser(ID),null);
});

test('a clean failed job with Auth already absent can be reconciled without another Auth DELETE',async()=>{
 const c=memoryClient();await executeSyntheticErasure(c,subject,await planSyntheticErasure(c,subject));
 c.tables.privacy_jobs[0].state='failed';c.tables.privacy_jobs[0].completed_at=null;
 const deletes=c.calls.deleteAuth.length;const other=clone(c.tables.messages.find(m=>m.author_id===OTHER));
 const p=await planSyntheticErasure(c,subject);assert.equal(p.authAlreadyAbsent,true);
 const recovered=await executeSyntheticErasure(c,subject,p);assert.equal(recovered.state,'completed');assert.equal(recovered.providerDeletionCompleted,true);assert.equal(c.calls.deleteAuth.length,deletes);assert.deepEqual(c.tables.messages.find(m=>m.author_id===OTHER),other);
 const unsafe=memoryClient();unsafe.setAuth(null);unsafe.tables.privacy_jobs[0].state='failed';unsafe.tables.privacy_jobs[0].attempt=1;
 await assert.rejects(planSyntheticErasure(unsafe,subject),/auth_identity_missing_requires_reconciliation/);noWrites(unsafe);
});
