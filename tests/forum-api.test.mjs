import test from 'node:test';
import assert from 'node:assert/strict';
import {handleForumRequest} from '../server/forum-api.mjs';

const userId='11111111-1111-4111-8111-111111111111';
const sessionId='22222222-2222-4222-8222-222222222222';
const body64=Buffer.from(JSON.stringify({sub:userId,session_id:sessionId,exp:Math.floor(Date.now()/1000)+1800,role:'authenticated'})).toString('base64url');
const token=`e30.${body64}.testsignature`;
const env={FORUM_PRIVATE_MODE:'synthetic',VERCEL_ENV:'preview',FORUM_SUPABASE_URL:'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',FORUM_SUPABASE_ANON_KEY:'example-anon',FORUM_SUPABASE_SERVICE_ROLE_KEY:'example-service',FORUM_EXPECTED_PROJECT_REF:'aaaaaaaaaaaaaaaaaaaa',FORUM_ALLOWED_ORIGINS:'https://preview.example.invalid'};
function req(path,{method='GET',body,headers={}}={}){return new Request('https://preview.example.invalid/api/forum'+path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json','Origin':'https://preview.example.invalid'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});}
const cookie={Cookie:`__Host-sfi_forum=${token}`};
function providerStub(){const calls=[];return {calls,fetcher:async(url,init)=>{calls.push({url,init});if(url.includes('/auth/v1/token'))return Response.json({access_token:token,refresh_token:'never-expose-this'});if(url.endsWith('/auth/v1/user'))return Response.json({id:userId});if(url.endsWith('sfi_forum_register_session'))return Response.json({registered:true});if(url.includes('/auth/v1/logout'))return new Response(null,{status:204});return Response.json({member:{user_id:userId,synthetic_test:true},rooms:[]});}};}

test('production and missing opt-in remain closed even with valid-looking provider settings',async()=>{
 for(const e of [{...env,VERCEL_ENV:'production'},{...env,FORUM_PRIVATE_MODE:undefined}]){
  const r=await handleForumRequest(req('/health'),{env:e,fetcher:()=>{throw Error('must not contact provider');}});assert.equal(r.status,404);
 }
});
test('forged Sites identity headers cannot authenticate and no provider is called',async()=>{
 let calls=0;const r=await handleForumRequest(req('/rooms',{headers:{'oai-authenticated-user-id':userId,'oai-authenticated-user-email':'example@forum.invalid'}}),{env,fetcher:()=>{calls++;}});
 assert.equal(r.status,401);assert.equal(calls,0);assert.equal(r.headers.get('Cache-Control'),'private, no-store');
});
test('a different or unpinned provider resource stays closed without provider access',async()=>{
 for(const e of [{...env,FORUM_EXPECTED_PROJECT_REF:undefined},{...env,FORUM_EXPECTED_PROJECT_REF:'bbbbbbbbbbbbbbbbbbbb'}]){
  let calls=0;const r=await handleForumRequest(req('/health'),{env:e,fetcher:()=>{calls++;}});assert.equal(r.status,503);assert.equal(calls,0);
 }
});
test('cross-origin and missing-origin writes fail before provider access',async()=>{
 for(const origin of ['https://attacker.example.invalid','null','']){
  const p=providerStub();const r=await handleForumRequest(req('/messages',{method:'POST',body:{},headers:{...cookie,Origin:origin,Host:'attacker.example.invalid'}}),{env,fetcher:p.fetcher});assert.equal(r.status,403);assert.equal(p.calls.length,0);
 }
});
test('only login-derived verified subject and session reach service registration; tokens never leave cookie',async()=>{
 const p=providerStub();const password='  preserve spaces  ';
 const r=await handleForumRequest(req('/login',{method:'POST',body:{email:'member@forum.invalid',password},headers:{'oai-authenticated-user-id':'attacker'}}),{env,fetcher:p.fetcher});
 assert.equal(r.status,200);assert.equal(p.calls.length,4);assert.equal(JSON.parse(p.calls[0].init.body).password,password);
 assert.equal(JSON.parse(p.calls[2].init.body).p_user_id,userId);assert.equal(JSON.parse(p.calls[2].init.body).p_session_id,sessionId);
 assert.equal(p.calls[2].init.headers.apikey,'example-service');assert.equal(p.calls[3].init.headers.apikey,'example-anon');
 const text=await r.text();assert(!text.includes(token));assert(!text.includes('refresh'));const set=r.headers.get('Set-Cookie');assert.match(set,/HttpOnly/);assert.match(set,/Secure/);assert.match(set,/SameSite=Strict/);assert.match(set,/Path=\//);assert(!set.includes('Domain='));
});
test('real email and caller-supplied approval fields are rejected before login',async()=>{
 for(const b of [{email:'someone@example.com',password:'not-real'},{email:'member@forum.invalid',password:'not-real',approved:true}]){
  const p=providerStub();const r=await handleForumRequest(req('/login',{method:'POST',body:b}),{env,fetcher:p.fetcher});assert.equal(r.status,400);assert.equal(p.calls.length,0);
 }
});
test('ordinary forum requests use user JWT and anon key, never a service role',async()=>{
 const p=providerStub();const r=await handleForumRequest(req('/threads?room=inside',{headers:cookie}),{env,fetcher:p.fetcher});assert.equal(r.status,200);assert.equal(p.calls.length,2);
 for(const c of p.calls){assert.equal(c.init.headers.apikey,'example-anon');assert.equal(c.init.headers.Authorization,'Bearer '+token);assert.equal(c.init.redirect,'error');}
 assert.deepEqual(JSON.parse(p.calls[1].init.body),{p_action:'threads',p_payload:{room:'inside'}});
});
test('message cursor preserves timestamp precision and requires both cursor fields',async()=>{
 const at='2026-11-11T21:00:00.123456+00:00';const p=providerStub();
 const r=await handleForumRequest(req('/messages?'+new URLSearchParams({thread_id:userId,after_created_at:at,after_id:sessionId,limit:'100'}),{headers:cookie}),{env,fetcher:p.fetcher});assert.equal(r.status,200);
 assert.deepEqual(JSON.parse(p.calls[1].init.body).p_payload,{thread_id:userId,limit:100,after:{created_at:at,id:sessionId}});
 const missing=await handleForumRequest(req('/messages?'+new URLSearchParams({thread_id:userId,after_created_at:at}),{headers:cookie}),{env,fetcher:providerStub().fetcher});assert.equal(missing.status,400);
});
test('duplicate cookie, malformed payload and caller roles cannot reach a write RPC',async()=>{
 const p=providerStub();const duplicate=await handleForumRequest(req('/me',{headers:{Cookie:`__Host-sfi_forum=${token}; __Host-sfi_forum=${token}`}}),{env,fetcher:p.fetcher});assert.equal(duplicate.status,401);assert.equal(p.calls.length,0);
 const r=await handleForumRequest(req('/messages',{method:'POST',headers:cookie,body:{thread_id:userId,body:'hello',idempotency_key:sessionId,role:'moderator'}}),{env,fetcher:p.fetcher});assert.equal(r.status,400);assert.equal(p.calls.length,1);
});
test('body bounds apply to actual streamed bytes even without a Content-Length header',async()=>{
 const p=providerStub();const r=await handleForumRequest(req('/messages',{method:'POST',headers:cookie,body:{thread_id:userId,body:'🙂'.repeat(6000),idempotency_key:sessionId}}),{env,fetcher:p.fetcher});assert.equal(r.status,413);assert.equal(p.calls.length,1);
});
test('database conflicts and durable quotas map to bounded errors without provider text',async()=>{
 for(const [code,message,status] of [['PT409','raw conflict detail',409],['40001','raw conflict detail',409],['42501','raw private detail',403],['P0001','quota_exceeded',429]]){
  const p=providerStub();const base=p.fetcher;p.fetcher=async(url,init)=>url.includes('/rpc/sfi_forum_rpc')?Response.json({code,message,details:'private-query-data'},{status:400}):base(url,init);
  const r=await handleForumRequest(req('/messages',{method:'POST',headers:cookie,body:{thread_id:userId,body:'hello',idempotency_key:sessionId}}),{env,fetcher:p.fetcher});assert.equal(r.status,status);const text=await r.text();assert(!text.includes('raw'));assert(!text.includes('private-query-data'));
 }
});
test('logout revokes the application session before provider signout and clears the cookie',async()=>{
 const p=providerStub();const r=await handleForumRequest(req('/logout',{method:'POST',body:{},headers:cookie}),{env,fetcher:p.fetcher});assert.equal(r.status,200);assert.equal(JSON.parse(p.calls[1].init.body).p_action,'logout');assert(p.calls[2].url.endsWith('/auth/v1/logout?scope=local'));assert.match(r.headers.get('Set-Cookie'),/Max-Age=0/);
});
test('logout clears the HttpOnly cookie even for invalid sessions or an unavailable provider',async()=>{
 const invalid=await handleForumRequest(req('/logout',{method:'POST',body:{}}),{env,fetcher:()=>{throw Error('must not fetch');}});assert.equal(invalid.status,200);assert.match(invalid.headers.get('Set-Cookie'),/Max-Age=0/);assert.equal((await invalid.json()).data.appRevocationConfirmed,false);
 const offline=await handleForumRequest(req('/logout',{method:'POST',body:{},headers:cookie}),{env,fetcher:()=>{throw Error('synthetic offline');}});assert.equal(offline.status,503);assert.match(offline.headers.get('Set-Cookie'),/Max-Age=0/);assert.equal((await offline.json()).data.loggedOutLocally,true);
});
test('an insecure-local flag cannot weaken cookies on a deployed preview',async()=>{
 for(const mode of ['preview','development']){const p=providerStub();const r=await handleForumRequest(req('/login',{method:'POST',body:{email:'member@forum.invalid',password:'example'},headers:{Origin:'https://preview.example.invalid'}}),{env:{...env,VERCEL_ENV:mode,FORUM_ALLOW_INSECURE_LOCAL:'1'},fetcher:p.fetcher});assert.equal(r.status,200);assert.match(r.headers.get('Set-Cookie'),/__Host-sfi_forum=/);assert.match(r.headers.get('Set-Cookie'),/; Secure/);}
});

test('Vercel adapter handles parsed JSON, raw bytes and consumed streams without losing body bounds',async()=>{
 const {forumWebRequest}=await import('../api/forum.mjs');
 const headers={'content-type':'application/json',origin:'https://preview.example.invalid'};
 const b={email:'member@forum.invalid',password:'keep spaces '};
 for(const body of [b,JSON.stringify(b),Buffer.from(JSON.stringify(b))]){
  const p=providerStub();const r=await handleForumRequest(forumWebRequest({url:'/api/forum/login',method:'POST',headers,body}),{env,fetcher:p.fetcher});assert.equal(r.status,200);assert.equal(JSON.parse(p.calls[0].init.body).password,b.password);
 }
 const {Readable}=await import('node:stream');const raw=Readable.from([JSON.stringify(b)]);Object.assign(raw,{url:'/api/forum/login',method:'POST',headers});
 assert.equal((await handleForumRequest(forumWebRequest(raw),{env,fetcher:providerStub().fetcher})).status,200);
 for(const item of [{body:{padding:'x'.repeat(17000)},headers},{body:b,headers:{...headers,'content-length':'17000'}},{body:b,headers:{...headers,'content-length':['1','1']}}]){
  const p=providerStub();const r=await handleForumRequest(forumWebRequest({url:'/api/forum/login',method:'POST',...item}),{env,fetcher:p.fetcher});assert.equal(r.status,413);assert.equal(p.calls.length,0);
 }
});

test('Supabase Auth session-not-found denial normalizes to 401 and cannot reach database RPC',async()=>{
 let calls=0;const r=await handleForumRequest(req('/rooms',{headers:cookie}),{env,fetcher:async()=>{calls++;return Response.json({code:403,error_code:'session_not_found'},{status:403});}});
 assert.equal(r.status,401);assert.equal((await r.json()).error.code,'invalid_session');assert.equal(calls,1);
});
