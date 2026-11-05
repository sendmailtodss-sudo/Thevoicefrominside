import { normalizeSocialProfile, verifySocialProof } from './social-verification.js';

const PREFIX = '/api/community';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CHANNELS = new Set(['copy','native','x','facebook','bluesky','whatsapp','email']);
const MAX_MULTIPART = 26 * 1024 * 1024;
const recent = new Map();

class ApiError extends Error {
  constructor(code, message, status=400) { super(message); this.code=code; this.status=status; }
}
function fail(code,message,status=400) { throw new ApiError(code,message,status); }
function json(value,status=200) {
  return new Response(JSON.stringify(value), {status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
function userFor(request,env) {
  // These headers are supplied and protected by the Sites authentication gateway.
  const id=request.headers.get('oai-authenticated-user-id');
  const email=request.headers.get('oai-authenticated-user-email');
  return {id:id&&id.length<=512?id:null,moderator:!!(id&&email&&env.COMMUNITY_MODERATOR_EMAIL&&email.toLowerCase()===env.COMMUNITY_MODERATOR_EMAIL.trim().toLowerCase())};
}
function requireUser(user) { if(!user.id) fail('authentication_required','Sign in to continue.',401); }
function requireModerator(user) { requireUser(user); if(!user.moderator) fail('forbidden','Moderator access is required.',403); }
function text(value,min,max,label) {
  if(typeof value!=='string') fail('invalid_input',`${label} is required.`);
  const clean=value.trim();
  if(clean.length<min||clean.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean)) fail('invalid_input',`${label} must contain ${min}–${max} characters.`);
  return clean;
}
function choice(value,allowed,label) { if(!allowed.includes(value)) fail('invalid_input',`Choose a valid ${label}.`); return value; }
async function first(DB,sql,...values) { return DB.prepare(sql).bind(...values).first(); }
async function rows(DB,sql,...values) { return (await DB.prepare(sql).bind(...values).all()).results||[]; }
async function limitedBody(request,limit) {
  if(Number(request.headers.get('Content-Length')||0)>limit) fail('too_large','The request is too large.',413);
  if(!request.body) fail('invalid_input','A request body is required.');
  let size=0;
  return request.body.pipeThrough(new TransformStream({transform(chunk,controller){size+=chunk.byteLength;if(size>limit)throw new ApiError('too_large','The request is too large.',413);controller.enqueue(chunk);}}));
}
async function readJson(request) {
  if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) fail('invalid_input','Send JSON.',415);
  try {
    const value=await new Response(await limitedBody(request,8192)).json();
    if(!value||typeof value!=='object'||Array.isArray(value)) fail('invalid_input','Send a JSON object.');
    return value;
  } catch(e) { if(e instanceof ApiError) throw e; fail('invalid_input','Invalid JSON.'); }
}
async function limitWrites(request,user,now) {
  const source=user.id||request.headers.get('CF-Connecting-IP');
  if(!source) return;
  const minute=Math.floor(now/60000);
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${minute}:${source}`));
  const key=Array.from(new Uint8Array(bytes).slice(0,12),b=>b.toString(16).padStart(2,'0')).join('');
  if(recent.size>=4096){for(const [k,v] of recent)if(v.minute<minute)recent.delete(k);if(recent.size>=4096)fail('rate_limited','Please try again in a minute.',429);}
  const slot=recent.get(key)||{minute,count:0};slot.count++;recent.set(key,slot);
  if(slot.count>40) fail('rate_limited','Please try again in a minute.',429);
}
function profileDTO(p) {
  return p?{displayName:p.display_name,nameKind:p.name_kind,socialUrl:p.social_url,socialProvider:p.social_provider,verified:!!p.verified,proofUrl:p.verified?p.proof_url:null}:null;
}
const SELECT_ITEM=`SELECT c.*, p.display_name, p.name_kind, p.social_url, p.verified,
  (SELECT COUNT(*) FROM community_likes l WHERE l.contribution_id=c.id) AS likes,
  (SELECT COUNT(*) FROM community_shares s WHERE s.contribution_id=c.id) AS shares,
  (SELECT COUNT(*) FROM community_reports r WHERE r.contribution_id=c.id) AS report_count,
  (SELECT COUNT(*) FROM community_likes l WHERE l.contribution_id=c.id AND l.user_id=?) AS liked
  FROM community_contributions c JOIN community_profiles p ON p.user_id=c.user_id`;
function itemDTO(c,user) {
  const own=c.user_id===user.id;
  const result={id:c.id,title:c.title,description:c.description,kind:c.kind,origin:c.origin,inspiration:c.inspiration,altText:c.alt_text,mediaUrl:`${PREFIX}/media/${c.id}`,mediaType:c.media_type,createdAt:c.created_at,status:c.status,featured:!!c.featured,likes:Number(c.likes||0),shares:Number(c.shares||0),liked:!!c.liked,owned:own,creator:{displayName:c.display_name,nameKind:c.name_kind,socialUrl:c.social_url,verified:!!c.verified}};
  if(own||user.moderator)result.promotionAllowed=!!c.promotion_allowed;
  if(user.moderator){result.reportCount=Number(c.report_count||0);if(c.reports)result.reports=c.reports;}
  return result;
}
async function getItem(DB,id,user,requirePublished=false) {
  if(!UUID.test(id))fail('not_found','Contribution not found.',404);
  const c=await first(DB,SELECT_ITEM+' WHERE c.id=?',user.id||'',id);
  if(!c||c.status==='deleted'||c.status==='uploading'||(c.status!=='published'&&(requirePublished||(!user.moderator&&c.user_id!==user.id)))) fail('not_found','Contribution not found.',404);
  if(user.moderator)c.reports=await rows(DB,'SELECT reason, created_at AS createdAt FROM community_reports WHERE contribution_id=? ORDER BY created_at DESC LIMIT 20',id);
  return c;
}

export function detectMedia(bytes,fileName,kind) {
  const ext=(fileName||'').split('.').pop().toLowerCase();
  const ascii=(start,count)=>String.fromCharCode(...bytes.slice(start,start+count));
  let mime=null;
  if(kind==='art') {
    if(['jpg','jpeg'].includes(ext)&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)mime='image/jpeg';
    if(ext==='png'&&bytes.length>=24&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b))mime='image/png';
    if(ext==='webp'&&ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP')mime='image/webp';
  } else if(kind==='music') {
    if(ext==='mp3'&&(ascii(0,3)==='ID3'||(bytes[0]===255&&(bytes[1]&224)===224)))mime='audio/mpeg';
    if(ext==='wav'&&ascii(0,4)==='RIFF'&&ascii(8,4)==='WAVE')mime='audio/wav';
    if(ext==='ogg'&&ascii(0,4)==='OggS')mime='audio/ogg';
    if(ext==='m4a'&&ascii(4,4)==='ftyp'&&['M4A ','M4B ','isom','mp42','mp41'].includes(ascii(8,4)))mime='audio/mp4';
  }
  if(!mime)fail('unsupported_media','Upload a JPEG, PNG or WebP image, or MP3, WAV, OGG or M4A audio with its correct file extension.',415);
  return mime;
}

async function upload(request,env,user,now) {
  requireUser(user);
  if(!env.BUCKET)fail('storage_unavailable','Uploads are temporarily unavailable.',503);
  const p=await first(env.DB,'SELECT * FROM community_profiles WHERE user_id=?',user.id);
  if(!p)fail('profile_required','Save your contributor profile first.',409);
  const type=request.headers.get('Content-Type')||'';
  if(!type.toLowerCase().startsWith('multipart/form-data;'))fail('invalid_input','Send the upload form.',415);
  let data;
  try{data=await new Response(await limitedBody(request,MAX_MULTIPART),{headers:{'Content-Type':type}}).formData();}
  catch(e){if(e instanceof ApiError)throw e;fail('invalid_upload','The upload could not be read.');}
  const key=data.get('idempotencyKey');
  if(typeof key!=='string'||!UUID.test(key))fail('invalid_input','A valid upload request ID is required.');
  const prior=await first(env.DB,'SELECT id,status FROM community_contributions WHERE user_id=? AND idempotency_key=?',user.id,key);
  if(prior){if(prior.status==='uploading')fail('upload_in_progress','This upload is still being processed.',409);if(prior.status==='deleted')fail('upload_removed','This upload has been removed. Start a new upload.',409);return json({item:itemDTO(await getItem(env.DB,prior.id,user),user)},200);}
  const title=text(data.get('title'),1,120,'Title');
  const description=text(data.get('description')||'',0,2000,'Description');
  const kind=choice(data.get('kind'),['art','music'],'contribution type');
  const origin=choice(data.get('origin'),['original','ai-assisted','ai-generated'],'creation method');
  const inspiration=choice(data.get('inspiration'),['home','chapter9','chapter10'],'inspiration');
  const altText=text(data.get('altText')||'',kind==='art'?1:0,400,'Image description');
  if(data.get('rightsAccepted')!=='true')fail('rights_required','Confirm your rights and permission to display this work on the site.');
  const promotion=data.get('promotionAllowed');
  if(promotion!==null&&!['true','false'].includes(promotion))fail('invalid_input','Choose whether promotional reuse is allowed.');
  const files=data.getAll('file');
  const file=files[0];
  if(files.length!==1||!file||typeof file.arrayBuffer!=='function'||!file.name||file.size<16)fail('invalid_upload','Choose one valid media file.');
  const max=kind==='art'?8*1024*1024:25*1024*1024;
  if(file.size>max)fail('too_large',kind==='art'?'Images may be up to 8 MiB.':'Audio may be up to 25 MiB.',413);
  const bytes=new Uint8Array(await file.arrayBuffer());
  const mime=detectMedia(bytes,file.name,kind);
  const id=crypto.randomUUID(), objectKey=`community/${id}`, received=new Date(now).toISOString(),day=received.slice(0,10);
  // The quota and reservation are a single statement, so parallel uploads cannot bypass them.
  const reserve=await env.DB.prepare(`INSERT INTO community_contributions (id,user_id,idempotency_key,title,description,kind,origin,inspiration,alt_text,object_key,media_type,media_size,status,promotion_allowed,rights_accepted_at,created_at)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,?,'uploading',?,?,?
    WHERE (SELECT COUNT(*) FROM community_contributions WHERE user_id=? AND created_at>=?)<3
    AND (SELECT COUNT(*) FROM community_contributions WHERE user_id=? AND status!='deleted')<100
    ON CONFLICT(user_id,idempotency_key) DO NOTHING`).bind(id,user.id,key,title,description,kind,origin,inspiration,altText,objectKey,mime,file.size,promotion==='true'?1:0,received,received,user.id,day,user.id).run();
  if(!reserve.meta?.changes){
    const duplicate=await first(env.DB,'SELECT id,status FROM community_contributions WHERE user_id=? AND idempotency_key=?',user.id,key);
    if(duplicate)fail('upload_in_progress','This upload is already being processed.',409);
    fail('upload_limit','You may submit up to three contributions per UTC day and keep up to 100 uploaded contributions.',429);
  }
  try {
    await env.BUCKET.put(objectKey,bytes,{httpMetadata:{contentType:mime},customMetadata:{contribution:id}});
    await env.DB.prepare("UPDATE community_contributions SET status='pending' WHERE id=? AND status='uploading'").bind(id).run();
  } catch(e) {
    // Failed uploads never become public. A retry can reuse the same request ID after cleanup.
    try{await env.BUCKET.delete(objectKey);await env.DB.prepare("DELETE FROM community_contributions WHERE id=? AND status='uploading'").bind(id).run();}catch{}
    fail('storage_unavailable','The file could not be stored. Please retry.',503);
  }
  return json({item:itemDTO(await getItem(env.DB,id,user),user)},201);
}

async function serveMedia(request,env,id,user) {
  if(!['GET','HEAD'].includes(request.method))fail('method_not_allowed','Use GET or HEAD.',405);
  const c=await getItem(env.DB,id,user);
  if(!env.BUCKET)fail('storage_unavailable','Media is temporarily unavailable.',503);
  const size=c.media_size;
  let offset=0,length=size,partial=false;
  const range=request.headers.get('Range');
  if(range){
    const match=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`,'Cache-Control':'no-store'}});
    if(match[1]){offset=Number(match[1]);const end=match[2]?Math.min(Number(match[2]),size-1):size-1;length=end-offset+1;}
    else{length=Math.min(Number(match[2]),size);offset=size-length;}
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||offset>=size||length<=0)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`,'Cache-Control':'no-store'}});
    partial=true;
  }
  const object=request.method==='HEAD'?await env.BUCKET.head(c.object_key):await env.BUCKET.get(c.object_key,partial?{range:{offset,length}}:undefined);
  if(!object)fail('not_found','Media not found.',404);
  const headers={'Content-Type':c.media_type,'Content-Length':String(length),'Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Cache-Control':'private, no-store','Cross-Origin-Resource-Policy':'same-origin','Content-Disposition':'inline'};
  if(partial)headers['Content-Range']=`bytes ${offset}-${offset+length-1}/${size}`;
  return new Response(request.method==='HEAD'?null:object.body,{status:partial?206:200,headers});
}

export async function handleCommunity(request,env,options={}) {
  const url=new URL(request.url);
  if(url.pathname!==PREFIX&&!url.pathname.startsWith(PREFIX+'/'))return null;
  const route=url.pathname.slice(PREFIX.length),now=options.now??Date.now(),received=new Date(now).toISOString(),user=userFor(request,env);
  try {
    if(!env.DB)fail('service_unavailable','The contribution room is temporarily unavailable.',503);
    if(!['GET','HEAD'].includes(request.method)){
      if(request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site')fail('forbidden_origin','Use this site to make changes.',403);
      await limitWrites(request,user,now);
    }
    if(route==='/me'&&request.method==='GET'){
      const p=user.id?await first(env.DB,'SELECT * FROM community_profiles WHERE user_id=?',user.id):null;
      const returnTo=url.searchParams.get('lang')==='en'?'/en/bidrag/':'/bidrag/';
      return json({authenticated:!!user.id,moderator:user.moderator,profile:profileDTO(p),signInUrl:'/signin-with-chatgpt?returnTo='+encodeURIComponent(returnTo),signOutUrl:'/signout-with-chatgpt?returnTo='+encodeURIComponent(returnTo)});
    }
    if(route==='/profile'&&request.method==='POST'){
      requireUser(user);const data=await readJson(request);
      const name=text(data.displayName,1,80,'Display name'),nameKind=choice(data.nameKind,['name','artist'],'name type');
      const social=normalizeSocialProfile(data.socialUrl);
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO community_profiles (user_id,display_name,name_kind,social_url,social_provider,social_handle,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)
          ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,name_kind=excluded.name_kind,social_provider=excluded.social_provider,social_handle=excluded.social_handle,
          verified=CASE WHEN community_profiles.social_url=excluded.social_url THEN community_profiles.verified ELSE 0 END,
          proof_url=CASE WHEN community_profiles.social_url=excluded.social_url THEN community_profiles.proof_url ELSE NULL END,social_url=excluded.social_url,updated_at=excluded.updated_at`).bind(user.id,name,nameKind,social.profileUrl,social.provider,social.handle,received,received),
        env.DB.prepare('DELETE FROM community_verifications WHERE user_id=? AND social_url!=?').bind(user.id,social.profileUrl)
      ]);
      return json({profile:profileDTO(await first(env.DB,'SELECT * FROM community_profiles WHERE user_id=?',user.id))});
    }
    if(route==='/verification/start'&&request.method==='POST'){
      requireUser(user);
      const p=await first(env.DB,'SELECT * FROM community_profiles WHERE user_id=?',user.id);if(!p)fail('profile_required','Save your contributor profile first.',409);
      const code='SFI-'+crypto.randomUUID(),expiresAt=new Date(now+15*60000).toISOString();
      await env.DB.prepare(`INSERT INTO community_verifications (user_id,code,social_url,expires_at,state,created_at) VALUES (?,?,?,?,'pending',?) ON CONFLICT(user_id) DO UPDATE SET code=excluded.code,social_url=excluded.social_url,expires_at=excluded.expires_at,state='pending',created_at=excluded.created_at`).bind(user.id,code,p.social_url,expiresAt,received).run();
      return json({code,expiresAt,profileUrl:p.social_url});
    }
    if(route==='/verification/complete'&&request.method==='POST'){
      requireUser(user);const data=await readJson(request),proofUrl=text(data.proofUrl,1,1000,'Proof URL');
      const challenge=await first(env.DB,'SELECT * FROM community_verifications WHERE user_id=?',user.id);
      if(!challenge||challenge.expires_at<=received)fail('verification_expired','Create a fresh verification code.',409);
      const claim=await env.DB.prepare("UPDATE community_verifications SET state='checking' WHERE user_id=? AND code=? AND state='pending' AND expires_at>?").bind(user.id,challenge.code,received).run();
      if(!claim.meta?.changes)fail('verification_in_progress','This verification is already being checked.',409);
      try{
        const proof=await verifySocialProof({profileUrl:challenge.social_url,proofUrl,code:challenge.code},options.fetch||fetch);
        const completed=new Date(options.now??Date.now()).toISOString();
        const result=await env.DB.batch([
          env.DB.prepare(`UPDATE community_profiles SET verified=1,proof_url=?,updated_at=? WHERE user_id=? AND social_url=? AND EXISTS(SELECT 1 FROM community_verifications WHERE user_id=? AND code=? AND state='checking' AND expires_at>?)`).bind(proof.proofUrl,completed,user.id,challenge.social_url,user.id,challenge.code,completed),
          env.DB.prepare('DELETE FROM community_verifications WHERE user_id=? AND code=?').bind(user.id,challenge.code)
        ]);
        if(!result[0].meta?.changes)fail('verification_expired','Your profile or code changed. Create a fresh code.',409);
        return json({profile:profileDTO(await first(env.DB,'SELECT * FROM community_profiles WHERE user_id=?',user.id))});
      }catch(e){
        await env.DB.prepare("UPDATE community_verifications SET state='pending' WHERE user_id=? AND code=? AND state='checking'").bind(user.id,challenge.code).run();
        if(/UNIQUE constraint failed: community_profiles\.social_url/.test(e.message||''))fail('profile_already_verified','This social profile is already verified by another signed-in account.',409);
        throw e;
      }
    }
    if(route==='/contributions'&&request.method==='POST')return await upload(request,env,user,now);
    if(route==='/contributions'&&request.method==='GET'){
      const mine=url.searchParams.get('mine')==='1',moderation=url.searchParams.get('moderation')==='1';
      if(mine)requireUser(user);if(moderation)requireModerator(user);
      const conditions=["c.status NOT IN ('deleted','uploading')"],values=[];
      if(mine){conditions.push('c.user_id=?');values.push(user.id);}else if(!moderation)conditions.push("c.status='published'");
      const status=url.searchParams.get('status');if(status&&(mine||moderation)){choice(status,['pending','published','rejected'],'status');conditions.push('c.status=?');values.push(status);}
      for(const [param,column,allowed] of [['type','kind',['art','music']],['inspiration','inspiration',['home','chapter9','chapter10']]]){const v=url.searchParams.get(param);if(v&&v!=='all'){choice(v,allowed,param);conditions.push(`c.${column}=?`);values.push(v);}}
      const sort=url.searchParams.get('sort')||'new';choice(sort,['new','popular'],'sort');
      const raw=url.searchParams.get('cursor')||'0';if(!/^\d{1,6}$/.test(raw))fail('invalid_input','Invalid page cursor.');const offset=Number(raw);
      const clause=' WHERE '+conditions.join(' AND ');
      const total=(await first(env.DB,'SELECT COUNT(*) AS n FROM community_contributions c'+clause,...values)).n;
      const result=await rows(env.DB,SELECT_ITEM+clause+' ORDER BY '+(sort==='popular'?'likes DESC, c.created_at DESC':'c.featured DESC, c.created_at DESC')+' LIMIT 24 OFFSET ?',user.id||'',...values,offset);
      if(moderation){for(const c of result)c.reports=await rows(env.DB,'SELECT reason,created_at AS createdAt FROM community_reports WHERE contribution_id=? ORDER BY created_at DESC LIMIT 20',c.id);}
      return json({items:result.map(c=>itemDTO(c,user)),total:Number(total),nextCursor:offset+result.length<total?String(offset+result.length):null});
    }
    const media=/^\/media\/([^/]+)$/.exec(route);if(media)return await serveMedia(request,env,media[1],user);
    const item=/^\/contributions\/([^/]+)(?:\/(like|share|report|moderate))?$/.exec(route);
    if(item){
      const [,id,action]=item;
      if(!action&&request.method==='GET')return json({item:itemDTO(await getItem(env.DB,id,user),user)});
      if(!action&&request.method==='DELETE'){
        requireUser(user);if(!UUID.test(id))fail('not_found','Contribution not found.',404);
        const c=await first(env.DB,'SELECT * FROM community_contributions WHERE id=?',id);
        if(!c)fail('not_found','Contribution not found.',404);
        if(c.user_id!==user.id&&!user.moderator)fail('forbidden','You can remove only your own contributions.',403);
        await env.DB.prepare("UPDATE community_contributions SET status='deleted', featured=0 WHERE id=?").bind(id).run();
        // Hide the record before deleting the object; even failed object cleanup cannot expose it.
        if(env.BUCKET)await env.BUCKET.delete(c.object_key);
        return json({ok:true});
      }
      if(action&&request.method==='POST'){
        if(action==='moderate'){
          requireModerator(user);const data=await readJson(request);const status=choice(data.status,['published','rejected'],'publication status');
          if(typeof data.featured!=='boolean')fail('invalid_input','Choose whether this contribution is featured.');
          const c=await getItem(env.DB,id,user);if(status==='published'&&(!env.BUCKET||!await env.BUCKET.head(c.object_key)))fail('storage_unavailable','The media must be available before publication.',503);
          await env.DB.prepare("UPDATE community_contributions SET status=?,featured=?,reviewed_at=? WHERE id=? AND status IN ('pending','published','rejected')").bind(status,status==='published'&&data.featured?1:0,received,id).run();
          return json({item:itemDTO(await getItem(env.DB,id,user),user)});
        }
        const c=await getItem(env.DB,id,user,true);
        if(action==='like'){
          requireUser(user);const data=await readJson(request);if(typeof data.liked!=='boolean')fail('invalid_input','Choose like or unlike.');
          if(data.liked)await env.DB.prepare("INSERT OR IGNORE INTO community_likes (contribution_id,user_id,created_at) SELECT ?,?,? WHERE EXISTS(SELECT 1 FROM community_contributions WHERE id=? AND status='published')").bind(id,user.id,received,id).run();
          else await env.DB.prepare('DELETE FROM community_likes WHERE contribution_id=? AND user_id=?').bind(id,user.id).run();
          const likes=(await first(env.DB,'SELECT COUNT(*) AS n FROM community_likes WHERE contribution_id=?',id)).n;
          const liked=!!await first(env.DB,'SELECT 1 FROM community_likes WHERE contribution_id=? AND user_id=?',id,user.id);
          return json({likes:Number(likes),liked});
        }
        if(action==='share'){
          const data=await readJson(request);if(!UUID.test(data.eventId||'')||!CHANNELS.has(data.channel))fail('invalid_input','Invalid share event.');
          const existing=await first(env.DB,'SELECT contribution_id FROM community_shares WHERE event_id=?',data.eventId);if(existing&&existing.contribution_id!==id)fail('invalid_input','This share event ID has already been used.');
          await env.DB.batch([
            env.DB.prepare("INSERT OR IGNORE INTO community_shares (event_id,contribution_id,channel,created_at) SELECT ?,?,?,? WHERE EXISTS(SELECT 1 FROM community_contributions WHERE id=? AND status='published')").bind(data.eventId,id,data.channel,received,id),
            env.DB.prepare("INSERT OR IGNORE INTO analytics_events (event_id,day,kind,path,channel,source,received_at) SELECT ?,?,'share',?,?,'other',? WHERE EXISTS(SELECT 1 FROM community_contributions WHERE id=? AND status='published')").bind(data.eventId,received.slice(0,10),'/bidrag/'+id+'/',data.channel,received,id)
          ]);
          return json({shares:Number((await first(env.DB,'SELECT COUNT(*) AS n FROM community_shares WHERE contribution_id=?',id)).n)});
        }
        if(action==='report'){
          requireUser(user);const data=await readJson(request),reason=text(data.reason,1,1000,'Report reason');
          await env.DB.prepare('INSERT INTO community_reports (contribution_id,user_id,reason,created_at) VALUES (?,?,?,?) ON CONFLICT(contribution_id,user_id) DO UPDATE SET reason=excluded.reason,created_at=excluded.created_at').bind(id,user.id,reason,received).run();
          return json({ok:true});
        }
      }
      fail('method_not_allowed','This action does not support that method.',405);
    }
    fail('not_found','Endpoint not found.',404);
  } catch(e) {
    const known=e instanceof ApiError||e.name==='SocialVerificationError';
    return json({error:known?(e.code||'invalid_input'):'service_unavailable',message:known?e.message:'The contribution room is temporarily unavailable. Please try again.'},known?(e.status||400):503);
  }
}
