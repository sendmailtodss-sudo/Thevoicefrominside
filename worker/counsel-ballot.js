/* Advisory invitation preference only. No engagement, spending, payment or case merits decision. */
const PREFIX='/api/counsel-ballot', BODY_LIMIT=1024, WINDOW_MS=600000, MAX_WRITES=10;
class ApiError extends Error {constructor(code,message,status=400){super(message);this.code=code;this.status=status;}}
const fail=(code,message,status=400)=>{throw new ApiError(code,message,status);};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const first=(db,query,...args)=>db.prepare(query).bind(...args).first();
const fields=(v,required,optional=[])=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype&&required.every(k=>Object.hasOwn(v,k))&&Object.keys(v).every(k=>required.includes(k)||optional.includes(k));
const text=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max&&v.trim()===v&&!/[\u0000-\u001f\u007f]/.test(v);
const identifier=v=>text(v,80)&&/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(v);
function config(env){
  try {
    if(typeof env.COUNSEL_BALLOT_CONFIG_JSON!=='string'||env.COUNSEL_BALLOT_CONFIG_JSON.length>65536)return null;
    const c=JSON.parse(env.COUNSEL_BALLOT_CONFIG_JSON);
    if(!fields(c,['version','title','candidates'],['closesAt'])||!identifier(c.version)||!text(c.title,200)||!Array.isArray(c.candidates)||c.candidates.length<1||c.candidates.length>50)return null;
    if(c.closesAt!==undefined&&(typeof c.closesAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(c.closesAt)||!Number.isFinite(Date.parse(c.closesAt))||new Date(c.closesAt).toISOString()!==c.closesAt))return null;
    const ids=new Set();
    for(const candidate of c.candidates){
      if(!fields(candidate,['id','name','firm','officialUrl','status'])||!identifier(candidate.id)||ids.has(candidate.id)||!text(candidate.name,140)||!text(candidate.firm,140)||!text(candidate.officialUrl,2048)||!['proposed','invited','available'].includes(candidate.status))return null;
      const url=new URL(candidate.officialUrl);if(url.protocol!=='https:'||url.username||url.password)return null;
      ids.add(candidate.id);
    }
    return c;
  } catch{return null;}
}
function identity(request){
  // This header is trusted only behind Sites' protected authentication gateway.
  // Do not expose the Worker directly or accept browser-supplied identity headers in a preview server.
  const id=request.headers.get('oai-authenticated-user-id');
  return text(id,512)&&!/[\u0000-\u0020\u007f]/.test(id)?id:null;
}
async function readBody(request){
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))fail('invalid_input','Send JSON.',415);
  const length=request.headers.get('Content-Length');if(length&&(!/^\d+$/.test(length)||Number(length)>BODY_LIMIT))fail('too_large','The request is too large.',413);
  if(!request.body)fail('invalid_input','A request body is required.');
  const reader=request.body.getReader(),chunks=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>BODY_LIMIT){await reader.cancel();fail('too_large','The request is too large.',413);}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('invalid_input','Invalid JSON.');}
}
const empty=()=>({version:null,title:null,closesAt:null,mode:'unconfigured',open:false,candidates:[],totals:{participatingAccounts:null},advisoryOnly:true,countUnit:'site_accounts'});
async function summary(c,env,now){
  if(!c)return empty();
  const enabled=env.COUNSEL_BALLOT_ENABLED==='true',closed=!!c.closesAt&&Date.parse(c.closesAt)<=now;
  let mode=!enabled?'disabled':closed?'closed':'open',counts=null;
  if(env.DB){try{counts=(await env.DB.prepare('SELECT candidate_id,COUNT(*) AS votes FROM counsel_ballot_votes WHERE version=? GROUP BY candidate_id').bind(c.version).all()).results;}catch{mode='unavailable';}}
  else mode='unavailable';
  if(!Array.isArray(counts))counts=null;
  const totals=new Map((counts||[]).map(row=>[row.candidate_id,Number(row.votes)]));
  const candidates=c.candidates.map(candidate=>({...candidate,votes:counts===null?null:(totals.get(candidate.id)||0)}));
  return {version:c.version,title:c.title,closesAt:c.closesAt||null,mode,open:mode==='open',candidates,totals:{participatingAccounts:counts===null?null:candidates.reduce((n,item)=>n+item.votes,0)},advisoryOnly:true,countUnit:'site_accounts'};
}
async function ownChoice(db,c,userId){
  if(!c)return {version:null,candidateId:null,updatedAt:null};
  if(!db)fail('storage_unavailable','The service is temporarily unavailable.',503);
  const row=await first(db,'SELECT candidate_id,updated_at FROM counsel_ballot_votes WHERE version=? AND user_id=?',c.version,userId);
  // A withdrawn candidate is not a current choice; historical rows are never exposed.
  const current=row&&c.candidates.some(candidate=>candidate.id===row.candidate_id);
  return {version:c.version,candidateId:current?row.candidate_id:null,updatedAt:current?row.updated_at:null};
}
async function mutate(db,c,userId,candidateId,now){
  const bucket=Math.floor(now/WINDOW_MS),token=crypto.randomUUID(),at=new Date(now).toISOString();
  const quota=db.prepare(`INSERT INTO counsel_ballot_limits(user_id,bucket,attempts,mutation_token) VALUES(?,?,1,?)
    ON CONFLICT(user_id,bucket) DO UPDATE SET attempts=attempts+1,mutation_token=excluded.mutation_token WHERE attempts<?`).bind(userId,bucket,token,MAX_WRITES);
  const guard='EXISTS(SELECT 1 FROM counsel_ballot_limits WHERE user_id=? AND bucket=? AND mutation_token=?)';
  const vote=candidateId===null
    ?db.prepare('DELETE FROM counsel_ballot_votes WHERE version=? AND user_id=? AND '+guard).bind(c.version,userId,userId,bucket,token)
    :db.prepare(`INSERT INTO counsel_ballot_votes(version,user_id,candidate_id,updated_at) SELECT ?,?,?,? WHERE ${guard}
      ON CONFLICT(version,user_id) DO UPDATE SET candidate_id=excluded.candidate_id,updated_at=excluded.updated_at`).bind(c.version,userId,candidateId,at,userId,bucket,token);
  // D1 batch is transactional. A denied quota cannot change a vote, even under concurrent requests.
  const result=await db.batch([quota,vote,db.prepare('DELETE FROM counsel_ballot_limits WHERE bucket<?').bind(bucket-144)]);
  if(Number(result[0]?.meta?.changes||0)!==1)fail('rate_limited','Too many changes. Try again later.',429);
}
export async function handleCounselBallot(request,env,options={}){
  const url=new URL(request.url);if(url.pathname!==PREFIX&&!url.pathname.startsWith(PREFIX+'/'))return null;
  try{
    if(url.searchParams.size)fail('invalid_input','Unexpected query fields.');
    const route=url.pathname.slice(PREFIX.length),c=config(env),now=options.now??Date.now();
    if(route===''&&request.method==='GET')return json(await summary(c,env,now));
    if(!['/me','/vote','/withdraw'].includes(route))fail('not_found','Route not found.',404);
    if((route==='/me'&&request.method!=='GET')||(route!=='/me'&&request.method!=='POST'))fail('method_not_allowed','Unsupported method.',405);
    const userId=identity(request);if(!userId)fail('authentication_required','Sign in to continue.',401);
    if(route==='/me')return json(await ownChoice(env.DB,c,userId));
    if(request.headers.get('Origin')!==url.origin||![null,'none','same-origin'].includes(request.headers.get('Sec-Fetch-Site')))fail('origin_rejected','Use this site to submit your choice.',403);
    if(!c||env.COUNSEL_BALLOT_ENABLED!=='true')fail('disabled','The advisory choice is not open.',503);
    if(c.closesAt&&Date.parse(c.closesAt)<=now)fail('closed','The advisory choice has closed.',409);
    if(!env.DB)fail('storage_unavailable','The service is temporarily unavailable.',503);
    const body=await readBody(request),required=route==='/vote'?['candidateId','version']:['version'];
    if(!fields(body,required)||!identifier(body.version)||(route==='/vote'&&!identifier(body.candidateId)))fail('invalid_input','Unexpected or invalid fields.');
    if(body.version!==c.version)fail('version_conflict','The candidate list has changed. Reload it before choosing.',409);
    if(route==='/vote'&&!c.candidates.some(candidate=>candidate.id===body.candidateId))fail('inactive_candidate','This candidate is not on the current list.',409);
    await mutate(env.DB,c,userId,route==='/vote'?body.candidateId:null,now);
    return json(await ownChoice(env.DB,c,userId));
  }catch(error){if(error instanceof ApiError)return json({error:error.code,message:error.message},error.status);return json({error:'storage_unavailable',message:'The service is temporarily unavailable.'},503);}
}
