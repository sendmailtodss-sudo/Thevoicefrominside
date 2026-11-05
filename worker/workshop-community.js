/* Text community and separately guarded creative submissions. No case-file intake. */
import { handleCreativeCatalog } from './creative-catalog.js';
const PREFIX = '/api/workshop';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LIMITS = Object.freeze({postsPerDay:5,activePosts:200,writesPerDay:100,pageSize:20,bodyBytes:32768});
class ApiError extends Error { constructor(code,message,status=400){super(message);this.code=code;this.status=status;} }
const fail=(code,message,status=400)=>{throw new ApiError(code,message,status);};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const rows=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results||[];
const changed=result=>Number(result?.meta?.changes||0)>0;
function identity(request,env){
  // Only trust these behind the Sites gateway, which strips/protects client-supplied auth headers.
  const id=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
  const userId=id&&id.length<=512&&!/[\u0000-\u001f\u007f]/.test(id)?id:null;
  return {id:userId,moderator:!!(userId&&email&&email.trim().toLowerCase()===String(env.COMMUNITY_MODERATOR_EMAIL||'').trim().toLowerCase())};
}
function enabled(env){return env.WORKSHOP_COMMUNITY_ENABLED==='true'&&typeof env.COMMUNITY_MODERATOR_EMAIL==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.COMMUNITY_MODERATOR_EMAIL.trim());}
function requireUser(user){if(!user.id)fail('authentication_required','Sign in to continue.',401);}
function requireModerator(user){requireUser(user);if(!user.moderator)fail('forbidden','Moderator access is required.',403);}
function text(value,min,max){if(typeof value!=='string')fail('invalid_input','A text field is invalid.');const s=value.trim();if(s.length<min||s.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s))fail('invalid_input','A text field is invalid.');return s;}
function shape(value,required,optional=[]){if(!value||typeof value!=='object'||Array.isArray(value)||Object.getPrototypeOf(value)!==Object.prototype)fail('invalid_input','Send a JSON object.');const allowed=new Set([...required,...optional]);if(Object.keys(value).some(k=>!allowed.has(k))||required.some(k=>!Object.hasOwn(value,k)))fail('invalid_input','Unexpected or missing fields.');return value;}
function version(value){if(!Number.isSafeInteger(value)||value<1||value>1e9)fail('invalid_input','A valid version is required.');return value;}
function id(value){if(typeof value!=='string'||!UUID.test(value))fail('not_found','Post not found.',404);return value;}
function csrf(request,url){if(request.headers.get('Origin')!==url.origin||!['same-origin','none',null].includes(request.headers.get('Sec-Fetch-Site')))fail('origin_rejected','Use this site to submit the request.',403);}
async function readJson(request){
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))fail('invalid_input','Send JSON.',415);
  const length=request.headers.get('Content-Length');if(length&&(!/^\d+$/.test(length)||Number(length)>LIMITS.bodyBytes))fail('too_large','The request is too large.',413);
  if(!request.body)fail('invalid_input','A request body is required.');
  const reader=request.body.getReader(),chunks=[];let size=0;
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>LIMITS.bodyBytes){await reader.cancel();fail('too_large','The request is too large.',413);}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('invalid_input','Invalid JSON.');}
}
async function quota(db,user,day){const result=await db.prepare(`INSERT INTO workshop_write_quota(user_id,day,count) VALUES(?,?,1)
 ON CONFLICT(user_id,day) DO UPDATE SET count=count+1 WHERE count<100`).bind(user.id,day).run();if(!changed(result))fail('quota_exceeded','The daily write limit has been reached. Try again tomorrow.',429);}
const SELECT=`SELECT p.*, (SELECT COUNT(*) FROM workshop_supports s WHERE s.post_id=p.id AND s.version=p.version) AS support_count,
 EXISTS(SELECT 1 FROM workshop_supports s WHERE s.post_id=p.id AND s.version=p.version AND s.user_id=?) AS supported
 FROM workshop_posts p`;
async function visiblePost(db,postId,user){const p=await first(db,SELECT+' WHERE p.id=?',user.id||'',id(postId));if(!p||p.status==='deleted'||(p.status!=='published'&&!user.moderator&&p.user_id!==user.id))fail('not_found','Post not found.',404);return p;}
function own(p,user){requireUser(user);if(p.user_id!==user.id)fail('forbidden','Only the owner can change this post.',403);}
async function dto(db,p,user){
  const isOwn=p.user_id===user.id;
  const out={id:p.id,kind:p.kind,title:p.title,body:p.body,status:p.status,version:p.version,creator:{displayName:p.author_name},createdAt:p.created_at,updatedAt:p.updated_at,owned:isOwn,supportCount:p.status==='published'?Number(p.support_count||0):0,supported:p.status==='published'&&!!p.supported};
  if(isOwn||user.moderator){out.moderationReason=p.moderation_reason;out.appeal=p.appeal_status?{reason:p.appeal_reason,status:p.appeal_status,createdAt:p.appeal_created_at}:null;}
  if(user.moderator){out.reports=await rows(db,'SELECT reason,created_at AS createdAt,version FROM workshop_reports WHERE post_id=? ORDER BY created_at DESC LIMIT 50',p.id);out.reportCount=Number((await first(db,'SELECT COUNT(*) AS count FROM workshop_reports WHERE post_id=?',p.id)).count);}
  return out;
}
async function itemResponse(db,postId,user,status=200){return json({item:await dto(db,await visiblePost(db,postId,user),user)},status);}
function audit(db,{postId,user,action,now,token,reason=''}){return db.prepare(`INSERT INTO workshop_audit(id,post_id,actor_id,action,post_version,created_at,reason)
 SELECT ?,id,?,?,version,?,? FROM workshop_posts WHERE id=? AND mutation_token=?`).bind(crypto.randomUUID(),user.id,action,now,reason,postId,token);}
function checkCAS(result){if(!changed(result))fail('version_conflict','The post changed. Reload it before trying again.',409);}
async function hash(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
async function createPost(db,user,data,now,day){
  shape(data,['idempotencyKey','kind','title','body','publicationAccepted']);
  if(typeof data.idempotencyKey!=='string'||!UUID.test(data.idempotencyKey)||!['proposal','discussion'].includes(data.kind)||data.publicationAccepted!==true)fail('invalid_input','Confirm publication terms and valid post fields.');
  const title=text(data.title,3,160),body=text(data.body,10,6000),digest=await hash(JSON.stringify([data.kind,title,body,true]));
  const prior=await first(db,'SELECT id,status,request_hash FROM workshop_posts WHERE user_id=? AND idempotency_key=?',user.id,data.idempotencyKey);
  if(prior){if(prior.request_hash!==digest)fail('idempotency_conflict','This request ID already belongs to different content.',409);if(prior.status==='deleted')fail('post_deleted','This post was deleted. Use a new request ID for a new post.',409);return await itemResponse(db,prior.id,user);}
  const profile=await first(db,'SELECT display_name FROM workshop_profiles WHERE user_id=?',user.id);if(!profile)fail('profile_required','Save your display name first.',409);
  await quota(db,user,day);const postId=crypto.randomUUID(),token=crypto.randomUUID();
  const result=await db.batch([
    db.prepare(`INSERT INTO workshop_posts(id,user_id,idempotency_key,request_hash,kind,title,body,author_name,status,version,created_at,updated_at,publication_accepted_at,mutation_token)
 SELECT ?,?,?,?,?,?,?,?,'pending',1,?,?,?,? WHERE (SELECT COUNT(*) FROM workshop_posts WHERE user_id=? AND created_at>=?)<5 AND (SELECT COUNT(*) FROM workshop_posts WHERE user_id=? AND status!='deleted')<200
 ON CONFLICT(user_id,idempotency_key) DO NOTHING`).bind(postId,user.id,data.idempotencyKey,digest,data.kind,title,body,profile.display_name,now,now,now,token,user.id,day,user.id),
    audit(db,{postId,user,action:'created',now,token})]);
  if(!changed(result[0])){const duplicate=await first(db,'SELECT id,status,request_hash FROM workshop_posts WHERE user_id=? AND idempotency_key=?',user.id,data.idempotencyKey);if(duplicate){if(duplicate.request_hash!==digest)fail('idempotency_conflict','This request ID already belongs to different content.',409);if(duplicate.status==='deleted')fail('post_deleted','The post has been deleted.',409);return await itemResponse(db,duplicate.id,user);}fail('quota_exceeded','Limit: five new posts per UTC day and 200 active posts.',429);}
  return await itemResponse(db,postId,user,201);
}
export async function handleWorkshopCommunity(request,env,options={}){
  const url=new URL(request.url);if(url.pathname!==PREFIX&&!url.pathname.startsWith(PREFIX+'/'))return null;
  if(url.pathname.startsWith(PREFIX+'/creative/'))return handleCreativeCatalog(request,env,options);
  try{
    const route=url.pathname.slice(PREFIX.length),user=identity(request,env),isEnabled=enabled(env);
    if(route==='/me'&&request.method==='GET'){
      if([...url.searchParams.keys()].some(k=>k!=='lang')||url.searchParams.getAll('lang').length>1||!['no','en',null].includes(url.searchParams.get('lang')))fail('invalid_input','Invalid language.');
      const returnTo=url.searchParams.get('lang')==='en'?'/en/verksted/community/':'/verksted/fellesskap/';
      let profile=null;if(isEnabled){if(!env.DB)fail('storage_unavailable','The service is temporarily unavailable.',503);if(user.id){const p=await first(env.DB,'SELECT display_name FROM workshop_profiles WHERE user_id=?',user.id);if(p)profile={displayName:p.display_name};}}
      return json({enabled:isEnabled,authenticated:!!user.id,moderator:isEnabled&&user.moderator,profile,signInUrl:'/signin-with-chatgpt?returnTo='+encodeURIComponent(returnTo),signOutUrl:'/signout-with-chatgpt?returnTo='+encodeURIComponent(returnTo),limits:LIMITS});
    }
    if(!isEnabled)fail('disabled','The community service is not open.',503);
    if(!env.DB)fail('storage_unavailable','The service is temporarily unavailable.',503);
    const db=env.DB,now=new Date(options.now??Date.now()).toISOString(),day=now.slice(0,10);
    const mutation=['POST','PATCH','DELETE'].includes(request.method);
    if(mutation){requireUser(user);csrf(request,url);}
    else if(request.method!=='GET')fail('method_not_allowed','Unsupported method.',405);
    if(route==='/profile'&&request.method==='POST'){
      const d=shape(await readJson(request),['displayName']),name=text(d.displayName,2,60);await quota(db,user,day);
      await db.prepare(`INSERT INTO workshop_profiles(user_id,display_name,created_at,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,updated_at=excluded.updated_at`).bind(user.id,name,now,now).run();return json({profile:{displayName:name}});
    }
    if(route==='/posts'&&request.method==='GET'){
      if([...url.searchParams.keys()].some(k=>!['view','kind','page'].includes(k))||['view','kind','page'].some(k=>url.searchParams.getAll(k).length>1))fail('invalid_input','Invalid list query.');
      const view=url.searchParams.get('view')||'public',kind=url.searchParams.get('kind'),rawPage=url.searchParams.get('page')||'1';
      if(!['public','mine','moderation'].includes(view)||kind&&!['proposal','discussion'].includes(kind)||!/^([1-9]\d{0,2}|1000)$/.test(rawPage))fail('invalid_input','Invalid list query.');
      if(view==='mine')requireUser(user);if(view==='moderation')requireModerator(user);
      const args=[user.id||''];let where=view==='public'?"p.status='published'":view==='mine'?"p.status!='deleted' AND p.user_id=?":"p.status!='deleted'";if(view==='mine')args.push(user.id);if(kind){where+=' AND p.kind=?';args.push(kind);}const page=Number(rawPage);args.push(21,(page-1)*20);
      const ordering=view==='moderation'?"CASE WHEN p.appeal_status='pending' THEN 0 WHEN p.status='pending' THEN 1 WHEN p.status='published' AND EXISTS(SELECT 1 FROM workshop_reports r WHERE r.post_id=p.id AND r.version=p.version) THEN 2 ELSE 3 END, p.created_at DESC,p.id DESC":'p.created_at DESC,p.id DESC';
      const found=await rows(db,SELECT+' WHERE '+where+' ORDER BY '+ordering+' LIMIT ? OFFSET ?',...args),hasMore=found.length>20;
      return json({items:await Promise.all(found.slice(0,20).map(p=>dto(db,p,user))),page,hasMore,nextPage:hasMore&&page<1000?page+1:null});
    }
    if(route==='/posts'&&request.method==='POST')return await createPost(db,user,await readJson(request),now,day);
    const match=/^\/posts\/([^/]+)(?:\/(moderate|support|report|appeal))?$/.exec(route);if(!match)fail('not_found','Route not found.',404);
    const postId=id(match[1]),action=match[2],p=await visiblePost(db,postId,user);
    if(!action&&request.method==='GET')return json({item:await dto(db,p,user)});
    if(!action&&request.method==='PATCH'){
      own(p,user);const d=shape(await readJson(request),['version','title','body','publicationAccepted']),v=version(d.version),title=text(d.title,3,160),body=text(d.body,10,6000);if(d.publicationAccepted!==true)fail('invalid_input','Confirm the publication terms.');
      const profile=await first(db,'SELECT display_name FROM workshop_profiles WHERE user_id=?',user.id);if(!profile)fail('profile_required','Save your display name first.',409);await quota(db,user,day);const token=crypto.randomUUID();
      const result=await db.batch([
        db.prepare(`UPDATE workshop_posts SET title=?,body=?,author_name=?,status='pending',version=version+1,updated_at=?,publication_accepted_at=?,moderation_reason='',moderated_by=NULL,moderated_at=NULL,appeal_reason='',appeal_status=NULL,appeal_created_at=NULL,appeal_base_version=NULL,mutation_token=? WHERE id=? AND user_id=? AND version=? AND status!='deleted'`).bind(title,body,profile.display_name,now,now,token,postId,user.id,v),
        db.prepare('DELETE FROM workshop_supports WHERE post_id=? AND EXISTS(SELECT 1 FROM workshop_posts WHERE id=? AND mutation_token=?)').bind(postId,postId,token),
        audit(db,{postId,user,action:'edited',now,token})]);checkCAS(result[0]);return await itemResponse(db,postId,user);
    }
    if(!action&&request.method==='DELETE'){
      own(p,user);const d=shape(await readJson(request),['version']),v=version(d.version);await quota(db,user,day);const token=crypto.randomUUID();
      const result=await db.batch([
        db.prepare(`UPDATE workshop_posts SET title='',body='',author_name='',status='deleted',version=version+1,updated_at=?,moderation_reason='',moderated_by=NULL,moderated_at=NULL,appeal_reason='',appeal_status=NULL,appeal_created_at=NULL,appeal_base_version=NULL,mutation_token=? WHERE id=? AND user_id=? AND version=? AND status!='deleted'`).bind(now,token,postId,user.id,v),
        ...['workshop_supports','workshop_reports'].map(table=>db.prepare(`DELETE FROM ${table} WHERE post_id=? AND EXISTS(SELECT 1 FROM workshop_posts WHERE id=? AND mutation_token=?)`).bind(postId,postId,token)),
        db.prepare("UPDATE workshop_audit SET reason='' WHERE post_id=? AND EXISTS(SELECT 1 FROM workshop_posts WHERE id=? AND mutation_token=?)").bind(postId,postId,token),
        audit(db,{postId,user,action:'deleted',now,token})]);checkCAS(result[0]);return json({deleted:true,id:postId});
    }
    if(request.method!=='POST')fail('method_not_allowed','Unsupported method.',405);
    if(action==='moderate'){
      requireModerator(user);const d=shape(await readJson(request),['version','status','reason']),v=version(d.version);if(!['published','rejected'].includes(d.status))fail('invalid_input','Invalid moderation status.');const reason=text(d.reason,d.status==='rejected'?3:0,1500);await quota(db,user,day);const token=crypto.randomUUID();
      const result=await db.batch([
        db.prepare(`UPDATE workshop_posts SET status=?,version=version+1,updated_at=?,moderation_reason=?,moderated_by=?,moderated_at=?,appeal_status=CASE WHEN appeal_status='pending' THEN 'resolved' ELSE appeal_status END,mutation_token=? WHERE id=? AND version=? AND status!='deleted'`).bind(d.status,now,reason,user.id,now,token,postId,v),
        db.prepare('DELETE FROM workshop_supports WHERE post_id=? AND EXISTS(SELECT 1 FROM workshop_posts WHERE id=? AND mutation_token=?)').bind(postId,postId,token),
        audit(db,{postId,user,action:d.status,now,token,reason})]);checkCAS(result[0]);return await itemResponse(db,postId,user);
    }
    if(action==='support'){
      const d=shape(await readJson(request),['supported','version']),v=version(d.version);if(typeof d.supported!=='boolean')fail('invalid_input','Choose support or withdrawal.');await quota(db,user,day);const token=crypto.randomUUID();
      const statement=d.supported?db.prepare(`INSERT INTO workshop_supports(post_id,user_id,version,created_at) SELECT id,?,version,? FROM workshop_posts WHERE id=? AND mutation_token=? ON CONFLICT(post_id,user_id) DO NOTHING`).bind(user.id,now,postId,token):db.prepare('DELETE FROM workshop_supports WHERE post_id=? AND user_id=? AND EXISTS(SELECT 1 FROM workshop_posts WHERE id=? AND mutation_token=?)').bind(postId,user.id,postId,token);
      const result=await db.batch([db.prepare("UPDATE workshop_posts SET mutation_token=? WHERE id=? AND version=? AND status='published' AND kind='proposal'").bind(token,postId,v),statement]);checkCAS(result[0]);return await itemResponse(db,postId,user);
    }
    if(action==='report'){
      const d=shape(await readJson(request),['reason','version']),v=version(d.version),reason=text(d.reason,3,1500);await quota(db,user,day);const token=crypto.randomUUID();
      const result=await db.batch([
        db.prepare("UPDATE workshop_posts SET mutation_token=? WHERE id=? AND version=? AND status='published'").bind(token,postId,v),
        db.prepare(`INSERT INTO workshop_reports(post_id,user_id,version,reason,created_at) SELECT id,?,version,?,? FROM workshop_posts WHERE id=? AND mutation_token=? ON CONFLICT(post_id,user_id,version) DO NOTHING`).bind(user.id,reason,now,postId,token)]);checkCAS(result[0]);
      if(!changed(result[1])){const old=await first(db,'SELECT reason FROM workshop_reports WHERE post_id=? AND user_id=? AND version=?',postId,user.id,v);if(!old||old.reason!==reason)fail('report_exists','A report for this version already exists.',409);}return json({reported:true,id:postId,version:v});
    }
    if(action==='appeal'){
      own(p,user);const d=shape(await readJson(request),['reason','version']),v=version(d.version),reason=text(d.reason,3,1500);if(p.status!=='rejected')fail('version_conflict','Only the current rejected version can be appealed.',409);
      if(p.appeal_status==='pending'){if(p.appeal_reason===reason&&(p.version===v||p.appeal_base_version===v))return await itemResponse(db,postId,user);fail('appeal_exists','A request for reconsideration is already pending.',409);}
      if(p.version!==v)fail('version_conflict','The post changed. Reload it before trying again.',409);await quota(db,user,day);const token=crypto.randomUUID();
      const result=await db.batch([
        db.prepare(`UPDATE workshop_posts SET appeal_reason=?,appeal_status='pending',appeal_created_at=?,appeal_base_version=version,version=version+1,updated_at=?,mutation_token=? WHERE id=? AND user_id=? AND version=? AND status='rejected' AND (appeal_status IS NULL OR appeal_status!='pending')`).bind(reason,now,now,token,postId,user.id,v),
        audit(db,{postId,user,action:'appealed',now,token,reason})]);checkCAS(result[0]);return await itemResponse(db,postId,user);
    }
    fail('not_found','Route not found.',404);
  }catch(e){if(e instanceof ApiError)return json({error:{code:e.code,message:e.message}},e.status);return json({error:{code:'storage_unavailable',message:'The service is temporarily unavailable.'}},503);}
}
