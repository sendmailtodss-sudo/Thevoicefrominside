/* Dated aggregate account reports. No bank integration, payment handling or legal review. */
import { getPublicFundingProvider } from './legal-fund-provider.js';
const PREFIX = '/api/legal-fund';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BODY_LIMIT = 8192;
const MAX_VERSION = 1_000_000_000;
const MAX_MINOR = Number.MAX_SAFE_INTEGER;
const PUBLIC_SOURCE = 'lawyer-confirmed-account-report';
const FIELDS = ['expectedVersion','idempotencyKey','totalReceivedMinor','totalDisbursedMinor','totalRefundedMinor','goalMinor','asOf','bankReconciled','correction','correctionReason'];
class ApiError extends Error {
  constructor(code, message, status=400) { super(message); this.code=code; this.status=status; }
}
const fail = (code,message,status=400) => { throw new ApiError(code,message,status); };
const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const first = (db,sql,...args) => db.prepare(sql).bind(...args).first();
function validIdentity(value) { return typeof value==='string' && value.length>0 && value.length<=512 && value.trim()===value && !/[\u0000-\u0020\u007f]/.test(value); }
function context(request,env) {
  const reporterId=env.LAWYER_ACCOUNT_REPORTER_ID;
  const enabled=env.LEGAL_FUND_REPORTING_ENABLED==='true' && validIdentity(reporterId);
  const paused=enabled && env.LEGAL_FUND_REPORTING_PAUSED==='true';
  // Only valid behind Sites' gateway, which protects these identity headers.
  const header=request.headers.get('oai-authenticated-user-id');
  const userId=validIdentity(header)?header:null;
  return {enabled,paused,userId,reporter:!!userId && userId===reporterId};
}
function noQuery(url) { if(url.searchParams.size) fail('invalid_input','Unexpected query fields.'); }
function sameOrigin(request,url) {
  if(request.headers.get('Origin')!==url.origin || ![null,'none','same-origin'].includes(request.headers.get('Sec-Fetch-Site'))) fail('origin_rejected','Use this site to submit a report.',403);
}
async function readJson(request) {
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||'')) fail('invalid_input','Send JSON.',415);
  const length=request.headers.get('Content-Length');
  if(length && (!/^\d+$/.test(length) || Number(length)>BODY_LIMIT)) fail('too_large','The request is too large.',413);
  if(!request.body) fail('invalid_input','A request body is required.');
  const reader=request.body.getReader(),chunks=[];let size=0;
  try {
    while(true) {
      const {value,done}=await reader.read();if(done)break;
      size+=value.byteLength;
      if(size>BODY_LIMIT) { await reader.cancel();fail('too_large','The request is too large.',413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks) { bytes.set(chunk,offset);offset+=chunk.length; }
  try { return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)); }
  catch { fail('invalid_input','Invalid JSON.'); }
}
function minor(value,positive=false) {
  if(!Number.isSafeInteger(value) || value<(positive?1:0) || value>MAX_MINOR) fail('invalid_input','Amounts must be valid non-negative integer NOK øre; the goal must be positive.');
  return value;
}
function validate(data,now) {
  if(!data || typeof data!=='object' || Array.isArray(data) || Object.getPrototypeOf(data)!==Object.prototype || Object.keys(data).length!==FIELDS.length || FIELDS.some(k=>!Object.hasOwn(data,k))) fail('invalid_input','Unexpected or missing fields.');
  if(!Number.isSafeInteger(data.expectedVersion) || data.expectedVersion<0 || data.expectedVersion>=MAX_VERSION) fail('invalid_input','A valid expected version is required.');
  if(typeof data.idempotencyKey!=='string' || !UUID.test(data.idempotencyKey)) fail('invalid_input','A valid request ID is required.');
  if(data.bankReconciled!==true || typeof data.correction!=='boolean') fail('invalid_input','Confirm account reconciliation and correction status.');
  const received=minor(data.totalReceivedMinor),disbursed=minor(data.totalDisbursedMinor),refunded=minor(data.totalRefundedMinor),goal=minor(data.goalMinor,true);
  const availableBig=BigInt(received)-BigInt(disbursed)-BigInt(refunded);
  if(availableBig<0n) fail('invalid_input','Disbursements and refunds cannot exceed receipts.');
  if(typeof data.asOf!=='string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(data.asOf) || !Number.isFinite(Date.parse(data.asOf)) || new Date(data.asOf).toISOString()!==data.asOf || Date.parse(data.asOf)>Date.parse(now)) fail('invalid_input','Use a valid canonical UTC report date that is not in the future.');
  if(typeof data.correctionReason!=='string') fail('invalid_input','A correction explanation must be text.');
  const reason=data.correctionReason.trim();
  if(/[\u0000-\u001f\u007f]/.test(reason) || (data.correction ? reason.length<10 || reason.length>1000 : reason.length!==0)) fail('invalid_input','Corrections require a private 10–1000 character explanation; ordinary reports use an empty explanation.');
  return {expectedVersion:data.expectedVersion,key:data.idempotencyKey.toLowerCase(),received,disbursed,refunded,available:Number(availableBig),goal,asOf:data.asOf,correction:data.correction,reason};
}
function dto(row) {
  return {totalReceivedMinor:row.total_received_minor,totalDisbursedMinor:row.total_disbursed_minor,totalRefundedMinor:row.total_refunded_minor,availableMinor:row.available_minor,goalMinor:row.goal_minor,asOf:row.as_of,reportedAt:row.reported_at,version:row.version,source:PUBLIC_SOURCE};
}
const latest = db => first(db,'SELECT * FROM legal_fund_reports ORDER BY version DESC LIMIT 1');
async function digest(value) { return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(v=>v.toString(16).padStart(2,'0')).join(''); }
function matchingRetry(prior,hash) {
  if(prior.request_hash!==hash) fail('idempotency_conflict','This request ID belongs to different report data.',409);
  return json({report:dto(prior)});
}
function checkPrior(prior,data) {
  if((prior?.version||0)!==data.expectedVersion) fail('version_conflict','A newer report exists. Reload it before submitting.',409);
  if(!prior && data.correction) fail('invalid_input','There is no previous report to correct.');
  if(prior && data.asOf<prior.as_of) fail('invalid_input','The report date cannot precede the previous report.');
  if(prior && !data.correction && (data.received<prior.total_received_minor || data.disbursed<prior.total_disbursed_minor || data.refunded<prior.total_refunded_minor)) fail('invalid_input','Cumulative totals cannot decrease without an explicit correction.');
}
async function postReport(db,userId,data,now) {
  const hash=await digest(JSON.stringify([userId,data.expectedVersion,data.received,data.disbursed,data.refunded,data.goal,data.asOf,true,data.correction,data.reason]));
  const priorRequest=await first(db,'SELECT * FROM legal_fund_reports WHERE idempotency_key=?',data.key);
  if(priorRequest) return matchingRetry(priorRequest,hash);
  checkPrior(await latest(db),data);
  // One append-only INSERT is the transaction: compare-and-set, date and monotonic checks
  // are re-evaluated against current database state. No previous report is overwritten.
  const result=await db.prepare(`INSERT INTO legal_fund_reports(version,idempotency_key,request_hash,reporter_id,total_received_minor,total_disbursed_minor,total_refunded_minor,available_minor,goal_minor,as_of,reported_at,bank_reconciled,correction,correction_reason)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,1,?,?
    WHERE COALESCE((SELECT MAX(version) FROM legal_fund_reports),0)=?
      AND ? >= COALESCE((SELECT as_of FROM legal_fund_reports ORDER BY version DESC LIMIT 1),'')
      AND (?=1 OR (
        ? >= COALESCE((SELECT total_received_minor FROM legal_fund_reports ORDER BY version DESC LIMIT 1),0)
        AND ? >= COALESCE((SELECT total_disbursed_minor FROM legal_fund_reports ORDER BY version DESC LIMIT 1),0)
        AND ? >= COALESCE((SELECT total_refunded_minor FROM legal_fund_reports ORDER BY version DESC LIMIT 1),0)))
    ON CONFLICT(idempotency_key) DO NOTHING`).bind(data.expectedVersion+1,data.key,hash,userId,data.received,data.disbursed,data.refunded,data.available,data.goal,data.asOf,now,data.correction?1:0,data.reason,data.expectedVersion,data.asOf,data.correction?1:0,data.received,data.disbursed,data.refunded).run();
  if(Number(result?.meta?.changes||0)!==1) {
    const duplicate=await first(db,'SELECT * FROM legal_fund_reports WHERE idempotency_key=?',data.key);
    if(duplicate) return matchingRetry(duplicate,hash);
    fail('version_conflict','A newer report exists. Reload it before submitting.',409);
  }
  const created=await first(db,'SELECT * FROM legal_fund_reports WHERE idempotency_key=?',data.key);
  return json({report:dto(created)},201);
}
export async function handleLegalFund(request,env,options={}) {
  const url=new URL(request.url);
  if(url.pathname!==PREFIX && !url.pathname.startsWith(PREFIX+'/')) return null;
  try {
    const route=url.pathname.slice(PREFIX.length),state=context(request,env);
    if(route==='/provider') {
      noQuery(url);
      if(request.method!=='GET') fail('method_not_allowed','Use GET.',405);
      return json(getPublicFundingProvider(env,options.now??Date.now()));
    }
    if(route==='/me' && request.method==='GET') {
      if([...url.searchParams.keys()].some(k=>k!=='lang') || url.searchParams.getAll('lang').length>1 || ![null,'no','en'].includes(url.searchParams.get('lang'))) fail('invalid_input','Invalid language.');
      const returnTo=url.searchParams.get('lang')==='en'?'/en/lawyer-account/report/':'/advokatkonto/rapport/';
      return json({enabled:state.enabled,paused:state.paused,authenticated:!!state.userId,canReport:state.enabled && !state.paused && state.reporter,signInUrl:'/signin-with-chatgpt?returnTo='+encodeURIComponent(returnTo),signOutUrl:'/signout-with-chatgpt?returnTo='+encodeURIComponent(returnTo)});
    }
    if(route==='/report' && request.method==='GET') {
      noQuery(url);
      if(!state.enabled) return json({enabled:false,paused:false,status:'not_available',report:null});
      if(!env.DB) fail('storage_unavailable','The account report is temporarily unavailable.',503);
      const report=await latest(env.DB);
      return json({enabled:true,paused:state.paused,status:report?(state.paused?'paused':'available'):'not_available',report:report?dto(report):null});
    }
    if(!state.enabled) fail('disabled','Account reporting is not open.',503);
    if(route!=='/report') fail('not_found','Route not found.',404);
    if(request.method!=='POST') fail('method_not_allowed','Unsupported method.',405);
    noQuery(url);
    if(!state.userId) fail('authentication_required','Sign in to continue.',401);
    if(!state.reporter) fail('forbidden','Only the designated account reporter can submit reports.',403);
    if(state.paused) fail('paused','Account reporting is paused. The last dated report remains visible.',503);
    sameOrigin(request,url);
    const now=new Date(options.now??Date.now()).toISOString();
    const data=validate(await readJson(request),now);
    if(!env.DB) fail('storage_unavailable','The account report is temporarily unavailable.',503);
    return await postReport(env.DB,state.userId,data,now);
  } catch(error) {
    if(error instanceof ApiError) return json({error:{code:error.code,message:error.message}},error.status);
    return json({error:{code:'storage_unavailable',message:'The account report is temporarily unavailable.'}},503);
  }
}
