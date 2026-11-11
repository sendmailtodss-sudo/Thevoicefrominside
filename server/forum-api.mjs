/* Private synthetic pilot only. Supabase verifies passwords/JWTs; user RPCs enforce RLS. */
const API_PATH = '/api/forum';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES = ['inmate', 'former', 'relative', 'professional'];
const ROOMS = ['inside', 'relatives'];

class ApiError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
const fail = (status, code) => { throw new ApiError(status, code); };
const json = (status, value, headers = {}) => new Response(JSON.stringify(value), {status, headers: {
  'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store',
  'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...headers
}});

function config(env) {
  if (env.FORUM_PRIVATE_MODE !== 'synthetic' || env.VERCEL_ENV === 'production') fail(404, 'not_found');
  const base = env.FORUM_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const anon = env.FORUM_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  const service = env.FORUM_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !anon || !service) fail(503, 'private_pilot_not_configured');
  let url; try { url = new URL(base); } catch { fail(503, 'private_pilot_not_configured'); }
  if (url.protocol !== 'https:' || !/^[a-z0-9]{20}\.supabase\.co$/.test(url.hostname) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) fail(503, 'private_pilot_not_configured');
  if (!/^[a-z0-9]{20}$/.test(env.FORUM_EXPECTED_PROJECT_REF || '')) fail(503, 'private_pilot_resource_not_pinned');
  if (url.hostname !== `${env.FORUM_EXPECTED_PROJECT_REF}.supabase.co`) fail(503, 'wrong_private_pilot_resource');
  const origins = (env.FORUM_ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (env.VERCEL_URL) origins.push(`https://${env.VERCEL_URL}`);
  const loopback=value=>{try{const u=new URL(value);return u.origin===value&&u.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(u.hostname);}catch{return false;}};
  const local = env.FORUM_ALLOW_INSECURE_LOCAL === '1' && env.VERCEL_ENV === 'development' && !env.VERCEL_URL && origins.length>0 && origins.every(loopback);
  const allowed = new Set(origins.filter(value => {
    try { const o = new URL(value); return o.origin === value && (o.protocol === 'https:' || local && ['localhost', '127.0.0.1', '[::1]'].includes(o.hostname)); } catch { return false; }
  }));
  if (!allowed.size) fail(503, 'private_pilot_origin_not_configured');
  return {base: url.origin, anon, service, local, allowed, cookie: local ? 'sfi_forum_test' : '__Host-sfi_forum'};
}

function exactObject(value, keys, required = keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'invalid_payload');
  if (Object.keys(value).some(k => !keys.includes(k)) || required.some(k => !Object.hasOwn(value, k))) fail(400, 'invalid_payload');
  return value;
}
function text(value, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max || value.includes('\0')) fail(400, 'invalid_payload');
  return value.trim();
}
function uuid(value) { if (typeof value !== 'string' || !UUID.test(value)) fail(400, 'invalid_payload'); return value.toLowerCase(); }
function version(value) { if (!Number.isSafeInteger(value) || value < 1) fail(400, 'invalid_payload'); return value; }
function choice(value, choices) { if (!choices.includes(value)) fail(400, 'invalid_payload'); return value; }
async function readBody(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers.get('content-type') || '')) fail(415, 'json_required');
  const len = request.headers.get('content-length');
  if (len && (!/^\d+$/.test(len) || Number(len) > 16384)) fail(413, 'payload_too_large');
  if (!request.body) return {};
  const reader = request.body.getReader(); const chunks = []; let size = 0;
  try { for (;;) { const {done, value} = await reader.read(); if (done) break; size += value.byteLength; if (size > 16384) { await reader.cancel(); fail(413, 'payload_too_large'); } chunks.push(value); } }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let body; try { body = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes)); } catch { fail(400, 'invalid_json'); }
  if (!body || Array.isArray(body) || typeof body !== 'object') fail(400, 'invalid_payload');
  return body;
}
function csrf(request, cfg) {
  const origin = request.headers.get('origin');
  if (!origin || !cfg.allowed.has(origin)) fail(403, 'origin_denied');
  if (request.headers.get('sec-fetch-site') === 'cross-site') fail(403, 'origin_denied');
}
function tokenCookie(request, cfg) {
  const values = (request.headers.get('cookie') || '').split(';').map(s => s.trim()).filter(s => s.startsWith(cfg.cookie + '='));
  if (values.length !== 1) fail(401, 'login_required');
  let token; try { token = decodeURIComponent(values[0].slice(cfg.cookie.length + 1)); } catch { fail(401, 'login_required'); }
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) || token.length > 16000) fail(401, 'login_required');
  return token;
}
function sessionCookie(cfg, token, maxAge) {
  return `${cfg.cookie}=${encodeURIComponent(token)}; Path=${cfg.local ? API_PATH : '/'}; HttpOnly; SameSite=Strict; Max-Age=${Math.max(0, Math.min(3600, maxAge))}${cfg.local ? '' : '; Secure'}`;
}
function verifiedClaims(token, user) {
  // This parses identity/session claims ONLY AFTER /auth/v1/user validates the token with Supabase.
  let claims; try { claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')); } catch { fail(401, 'invalid_session'); }
  if (claims.sub !== user.id || !UUID.test(claims.session_id || '') || !Number.isSafeInteger(claims.exp) || claims.exp <= Date.now()/1000 || claims.role !== 'authenticated') fail(401, 'invalid_session');
  return claims;
}
function providerError(value, status) {
  const code = value?.code;
  if (['invalid_credentials','invalid_grant','user_not_found'].includes(code)) fail(401, 'invalid_credentials');
  if (status === 401 || code === '28000' || code === 'PGRST301') fail(401, 'invalid_session');
  if (status === 403 || code === '42501') fail(403, 'access_denied');
  if (code === 'P0002') fail(404, 'not_found');
  if (code === 'PT409' || code === '40001' || code === '23505' || status === 409) fail(409, 'conflict');
  if (status === 429 || code === 'P0001' && value?.message === 'quota_exceeded') fail(429, 'quota_exceeded');
  if ((typeof code === 'string' && /^22[A-Z0-9]{3}$/.test(code)) || code === '23514' || status === 400 || status === 422) fail(400, 'invalid_payload');
  fail(503, 'private_provider_unavailable');
}
async function provider(cfg, fetcher, path, {token, admin = false, method = 'GET', body} = {}) {
  const key = admin ? cfg.service : cfg.anon;
  let response; try { response = await fetcher(cfg.base + path, {method, redirect:'error', signal:AbortSignal.timeout(12000), headers:{
    'apikey': key, 'Authorization': `Bearer ${token || key}`, 'Accept':'application/json', ...(body === undefined ? {} : {'Content-Type':'application/json'})
  }, ...(body === undefined ? {} : {body:JSON.stringify(body)})}); } catch { fail(503, 'private_provider_unavailable'); }
  let raw; try { raw = await response.text(); } catch { fail(503, 'private_provider_unavailable'); }
  if (raw.length > 1500000) fail(503, 'private_provider_response_invalid');
  let value = null; try { value = raw ? JSON.parse(raw) : null; } catch { fail(503, 'private_provider_response_invalid'); }
  if (!response.ok) providerError(value, response.status);
  return value;
}
const rpc = (cfg, fetcher, token, action, payload = {}) => provider(cfg, fetcher, '/rest/v1/rpc/sfi_forum_rpc', {token, method:'POST', body:{p_action:action,p_payload:payload}});

function actionPayload(path, b) {
  switch (path) {
    case '/application': exactObject(b,['alias','declared_role','version','ack']); if (b.ack !== true) fail(400,'synthetic_ack_required'); return ['application',{alias:text(b.alias,2,60),declared_role:choice(b.declared_role,ROLES),version:version(b.version),ack:true}];
    case '/threads': exactObject(b,['room','title','body','idempotency_key']); return ['create_thread',{room:choice(b.room,ROOMS),title:text(b.title,3,160),body:text(b.body,1,6000),idempotency_key:uuid(b.idempotency_key)}];
    case '/messages': exactObject(b,['thread_id','body','idempotency_key']); return ['create_message',{thread_id:uuid(b.thread_id),body:text(b.body,1,6000),idempotency_key:uuid(b.idempotency_key)}];
    case '/messages/edit': exactObject(b,['message_id','body','version']); return ['edit_message',{message_id:uuid(b.message_id),body:text(b.body,1,6000),version:version(b.version)}];
    case '/messages/delete': exactObject(b,['message_id','version']); return ['delete_message',{message_id:uuid(b.message_id),version:version(b.version)}];
    case '/messages/report': exactObject(b,['message_id','version','reason']); return ['report_message',{message_id:uuid(b.message_id),version:version(b.version),reason:text(b.reason,3,1500)}];
    case '/messages/moderate': exactObject(b,['message_id','version','state','reason']); return ['moderate_message',{message_id:uuid(b.message_id),version:version(b.version),state:choice(b.state,['active','hidden']),reason:text(b.reason,3,1500)}];
    case '/members/review': exactObject(b,['subject_id','version','decision','rooms','reason']); if (!Array.isArray(b.rooms) || b.rooms.length>2 || b.rooms.some(r=>!ROOMS.includes(r)) || new Set(b.rooms).size!==b.rooms.length) fail(400,'invalid_payload'); return ['review_member',{subject_id:uuid(b.subject_id),version:version(b.version),decision:choice(b.decision,['verify_test','approve','reject','suspend','reopen']),rooms:b.rooms,reason:text(b.reason,3,1500)}];
    case '/privacy/export': exactObject(b,[]); return ['export',{}];
    case '/privacy/erase': exactObject(b,[]); return ['request_erasure',{}];
    default: fail(404,'not_found');
  }
}

export async function handleForumRequest(request, {env = process.env, fetcher = fetch} = {}) {
  let cfg;
  try {
    cfg = config(env);
    const url = new URL(request.url);
    if (!url.pathname.startsWith(API_PATH + '/') || url.pathname.includes('%')) fail(404,'not_found');
    const path = url.pathname.slice(API_PATH.length).replace(/\/$/,'');
    if (!['GET','POST'].includes(request.method)) fail(405,'method_not_allowed');
    if (request.method === 'GET' && path === '/health') return json(200,{ok:true,data:{mode:'synthetic',private:true,realKyc:false,publicRegistration:false,payments:false}});
    if (request.method === 'POST') csrf(request,cfg);
    if (path === '/logout' && request.method === 'POST') {
      exactObject(await readBody(request),[]);
      const clear={'Set-Cookie':sessionCookie(cfg,'',0)};
      try{
        const token=tokenCookie(request,cfg);
        const user=await provider(cfg,fetcher,'/auth/v1/user',{token});verifiedClaims(token,user);
        await rpc(cfg,fetcher,token,'logout');
        let providerRevocationConfirmed=false;
        try{await provider(cfg,fetcher,'/auth/v1/logout?scope=local',{token,method:'POST'});providerRevocationConfirmed=true;}catch{}
        return json(200,{ok:true,data:{loggedOut:true,appRevocationConfirmed:true,providerRevocationConfirmed}},clear);
      }catch(error){
        if(error instanceof ApiError&&error.status===401)return json(200,{ok:true,data:{loggedOut:true,appRevocationConfirmed:false,sessionAlreadyInvalid:true}},clear);
        return json(503,{ok:false,error:{code:'logout_revocation_unconfirmed',message:'logout_revocation_unconfirmed'},data:{loggedOutLocally:true,appRevocationConfirmed:false}},clear);
      }
    }
    if (path === '/login' && request.method === 'POST') {
      const b = exactObject(await readBody(request),['email','password']);
      const email = text(b.email,3,254).toLowerCase();
      if (typeof b.password !== 'string' || !b.password.length || b.password.length > 1024 || b.password.includes('\0')) fail(400,'invalid_payload');
      const password = b.password;
      if (!/^[^\s@]+@[^\s@]+\.invalid$/.test(email)) fail(400,'synthetic_accounts_only');
      const auth = await provider(cfg,fetcher,'/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
      if (!auth?.access_token) fail(503,'private_provider_response_invalid');
      const user = await provider(cfg,fetcher,'/auth/v1/user',{token:auth.access_token});
      const claims = verifiedClaims(auth.access_token,user);
      const sessionExpiry=Math.min(claims.exp,Math.floor(Date.now()/1000)+3600);
      await provider(cfg,fetcher,'/rest/v1/rpc/sfi_forum_register_session',{admin:true,method:'POST',body:{p_user_id:user.id,p_session_id:claims.session_id,p_expires_at:new Date(sessionExpiry*1000).toISOString()}});
      const me = await rpc(cfg,fetcher,auth.access_token,'me');
      return json(200,{ok:true,data:me},{'Set-Cookie':sessionCookie(cfg,auth.access_token,sessionExpiry-Math.floor(Date.now()/1000))});
    }
    const token = tokenCookie(request,cfg);
    const user = await provider(cfg,fetcher,'/auth/v1/user',{token});
    verifiedClaims(token,user);
    let action, payload;
    if (request.method === 'GET') {
      const allowed = {'/me':['me',[]],'/rooms':['rooms',[]],'/threads':['threads',['room']],'/messages':['messages',['thread_id','after_created_at','after_id','limit']],'/reports':['reports',['room']],'/applications':['applications',[]]};
      const route = allowed[path]; if (!route) fail(404,'not_found');
      const required=path==='/messages'?['thread_id']:route[1];
      if ([...url.searchParams.keys()].some(k=>!route[1].includes(k)||url.searchParams.getAll(k).length!==1) || required.some(k=>url.searchParams.getAll(k).length!==1)) fail(400,'invalid_payload');
      action=route[0]; payload=['/threads','/reports'].includes(path)?{room:choice(url.searchParams.get('room'),ROOMS)}:path==='/messages'?{thread_id:uuid(url.searchParams.get('thread_id'))}:{};
      if(path==='/messages'){
        if(url.searchParams.has('limit')){const n=url.searchParams.get('limit');if(!/^[1-9]\d{0,2}$/.test(n)||Number(n)>100)fail(400,'invalid_payload');payload.limit=Number(n);}
        if(url.searchParams.has('after_id')||url.searchParams.has('after_created_at')){
          const at=url.searchParams.get('after_created_at');
          if(typeof at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(at)||!Number.isFinite(Date.parse(at)))fail(400,'invalid_payload');
          payload.after={created_at:at,id:uuid(url.searchParams.get('after_id'))};
        }
      }
    } else [action,payload]=actionPayload(path,await readBody(request));
    return json(200,{ok:true,data:await rpc(cfg,fetcher,token,action,payload)});
  } catch (error) {
    const status=error instanceof ApiError?error.status:503;
    const code=error instanceof ApiError?error.code:'private_provider_unavailable';
    return json(status,{ok:false,error:{code,message:code}},status===405?{'Allow':'GET, POST'}:{});
  }
}

export function privateForumEnabled(env=process.env) { return env.FORUM_PRIVATE_MODE==='synthetic' && env.VERCEL_ENV!=='production'; }
