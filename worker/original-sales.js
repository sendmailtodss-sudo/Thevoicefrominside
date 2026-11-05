/* A single physical original has inventory independent of reproduction licences.
 * No external accounts, money or configuration are created by this module.
 */
const PREFIX='/api/originals';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WORK=/^work_[0-9a-f-]{36}$/i;
const ARTIST=/^artist_[0-9a-f-]{36}$/i;
const PROVIDER_ACCOUNT=/^acct_[A-Za-z0-9]{5,100}$/;
const encoder=new TextEncoder();
class OriginalError extends Error{constructor(code,status=400){super(code);this.code=code;this.status=status;}}
const fail=(code,status)=>{throw new OriginalError(code,status);};
const response=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const changed=r=>Number(r?.meta?.changes||0)>0;
const money=v=>Number.isSafeInteger(v)&&v>=0&&v<=100000000;
const text=(v,min,max)=>typeof v==='string'&&v.trim()===v&&v.length>=min&&v.length<=max&&!/[\x00-\x1f\x7f]/.test(v);
const path=v=>typeof v==='string'&&/^\/[A-Za-z0-9/_-]+\/$/.test(v)&&!v.startsWith('//');
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',typeof value==='string'?encoder.encode(value):value)),n=>n.toString(16).padStart(2,'0')).join('');
function exact(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))fail('invalid_input');}
function identity(request){const id=request.headers.get('oai-authenticated-user-id');if(!text(id,1,512))fail('authentication_required',401);return id;}
function sameOrigin(request,url){if(request.headers.get('Origin')!==url.origin||![null,'none','same-origin'].includes(request.headers.get('Sec-Fetch-Site')))fail('origin_rejected',403);}
async function raw(request,max){if(Number(request.headers.get('Content-Length')||0)>max)fail('too_large',413);if(!request.body)fail('invalid_input');const reader=request.body.getReader(),parts=[];let n=0;try{while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>max){await reader.cancel();fail('too_large',413);}parts.push(value);}}finally{reader.releaseLock();}const out=new Uint8Array(n);let o=0;for(const part of parts){out.set(part,o);o+=part.length;}return out;}
async function body(request){if(!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))fail('json_required',415);try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await raw(request,8192)));}catch(e){if(e instanceof OriginalError)throw e;fail('invalid_json');}}
function configuration(env){try{
 const c=JSON.parse(env.ORIGINAL_SALES_CONFIG_JSON||'null'),mode=env.ORIGINAL_STRIPE_MODE;
 if(!c||!['test','live'].includes(mode)||!PROVIDER_ACCOUNT.test(c.providerAccountId||'')||!text(c.version,1,80)||!text(c.termsVersion,1,80)||!money(c.shippingMinor)||c.fulfilmentReady!==true||c.merchantVerified!==true||c.paymentRecipientConfirmed!==true||!c.artistAgreements||typeof c.artistAgreements!=='object'||Array.isArray(c.artistAgreements))return null;
 const s=c.seller;if(!s||!text(s.name,2,200)||!/^\d{9}$/.test(s.organisationNumber)||!text(s.address,5,500)||!text(s.email,5,254)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)||!text(s.phone,5,40)||!path(s.termsUrl)||!path(s.privacyUrl)||!path(s.withdrawalFormUrl)||!text(s.deliveryText,10,2000)||!text(s.returnsText,10,3000))return null;
 const agreements={};for(const [id,a]of Object.entries(c.artistAgreements)){if(!ARTIST.test(id)||!a||a.originalSaleMandate!==true||a.payoutTermsConfirmed!==true||!text(a.version,1,80))return null;agreements[id]={version:a.version,originalSaleMandate:true,payoutTermsConfirmed:true};}
 if(!Object.keys(agreements).length||!env.DB||!env.STRIPE_SECRET_KEY?.startsWith(`sk_${mode}_`)||!env.ORIGINAL_STRIPE_WEBHOOK_SECRET?.startsWith('whsec_'))return null;
 return {version:c.version,termsVersion:c.termsVersion,providerAccountId:c.providerAccountId,shippingMinor:c.shippingMinor,seller:{name:s.name,organisationNumber:s.organisationNumber,address:s.address,email:s.email,phone:s.phone,termsUrl:s.termsUrl,privacyUrl:s.privacyUrl,withdrawalFormUrl:s.withdrawalFormUrl,deliveryText:s.deliveryText,returnsText:s.returnsText},artistAgreements:agreements,mode};
 }catch{return null;}}
function open(env,c){return !!c&&env.ORIGINAL_SALES_ENABLED==='true'&&env.ORIGINAL_SALES_PAUSED!=='true'&&env.WORKSHOP_CREATIVE_ENABLED==='true'&&env.WORKSHOP_COMMUNITY_ENABLED==='true'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.COMMUNITY_MODERATOR_EMAIL||'');}
function dto(row){const q=JSON.parse(row.snapshot_json);return {id:row.id,artworkId:row.artwork_id,status:row.status,currency:'NOK',artworkPriceMinor:q.artworkPriceMinor,shippingMinor:q.shippingMinor,totalMinor:q.totalMinor,refundedMinor:row.refunded_minor,termsVersion:q.termsVersion,holdExpiresAt:new Date(row.hold_expires_at).toISOString(),createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString()};}
async function order(env,id,user){if(!UUID.test(id||''))fail('not_found',404);const row=await first(env.DB,'SELECT * FROM original_orders WHERE id=? AND user_id=?',id,user);if(!row)fail('not_found',404);return row;}

// Only unstarted holds can expire by local time. Creating/pending sessions always
// remain reserved until the payment provider confirms a terminal outcome.
export async function expireUnstartedOriginalReservations(env,{now=Date.now(),limit=20}={}){
 if(!env.DB)return 0;if(!Number.isInteger(limit)||limit<1||limit>100)throw Error('invalid_limit');
 const selected=(await env.DB.prepare("SELECT id,artwork_id FROM original_orders WHERE status='held' AND hold_expires_at<=? ORDER BY hold_expires_at LIMIT ?").bind(now,limit).all()).results||[];let count=0;
 for(const r of selected){const result=await env.DB.batch([
  env.DB.prepare("UPDATE original_orders SET status='expired',updated_at=? WHERE id=? AND status='held' AND hold_expires_at<=?").bind(now,r.id,now),
  env.DB.prepare("UPDATE creative_works SET original_status='available',reservation_id=NULL,reserved_at=NULL WHERE id=? AND original_status='reserved' AND reservation_id=? AND EXISTS(SELECT 1 FROM original_orders WHERE id=? AND status='expired' AND session_id IS NULL AND checkout_started IS NULL)").bind(r.artwork_id,r.id,r.id)
 ]);if(changed(result[0]))count++;}return count;
}
async function reserve(request,env,c,user,now){
 const d=await body(request);exact(d,['artworkId','requestKey','termsVersion']);if(!WORK.test(d.artworkId||'')||!UUID.test(d.requestKey||''))fail('invalid_input');if(d.termsVersion!==c.termsVersion)fail('terms_changed',409);
 const requestHash=await digest(JSON.stringify([d.artworkId,d.termsVersion]));const prior=await first(env.DB,'SELECT * FROM original_orders WHERE user_id=? AND request_key=?',user,d.requestKey);
 if(prior){if(prior.request_hash!==requestHash)fail('idempotency_conflict',409);return response({order:dto(prior)});}
 await expireUnstartedOriginalReservations(env,{now});
 const w=await first(env.DB,"SELECT w.* FROM creative_works w JOIN creative_artists a ON a.id=w.artist_id WHERE w.id=? AND w.status='published' AND w.kind='art' AND w.physical_original=1 AND w.original_sale_allowed=1 AND w.original_status='available' AND w.origin!='ai-generated'",d.artworkId);
 if(!w||!c.artistAgreements[w.artist_id]||!money(w.original_price_minor)||w.original_price_minor<100||!money(w.original_price_minor+c.shippingMinor))fail('original_unavailable',409);
 const id=crypto.randomUUID(),snapshot={artworkId:w.id,artistId:w.artist_id,title:w.title,artistName:w.author_name,artworkPriceMinor:w.original_price_minor,shippingMinor:c.shippingMinor,totalMinor:w.original_price_minor+c.shippingMinor,currency:'NOK',termsVersion:c.termsVersion,seller:c.seller,artistAgreementVersion:c.artistAgreements[w.artist_id].version,providerAccountId:c.providerAccountId};
 const configHash=await digest(JSON.stringify(c)),hold=now+15*60000;
 // Transactional inventory claim; two buyers cannot both insert a saleable hold.
 await env.DB.batch([
  env.DB.prepare(`INSERT INTO original_orders(id,user_id,request_key,request_hash,artwork_id,artist_id,snapshot_json,config_hash,mode,status,hold_expires_at,created_at,updated_at)
   SELECT ?,?,?,?,?,?,?,?,?,'held',?,?,? FROM creative_works w JOIN creative_artists a ON a.id=w.artist_id WHERE w.id=? AND w.version=? AND w.status='published' AND w.kind='art' AND w.origin!='ai-generated' AND w.physical_original=1 AND w.original_sale_allowed=1 AND w.original_status='available' AND w.original_price_minor=? AND (SELECT COUNT(*) FROM original_orders WHERE user_id=? AND created_at>?)<20 ON CONFLICT(user_id,request_key) DO NOTHING`).bind(id,user,d.requestKey,requestHash,w.id,w.artist_id,JSON.stringify(snapshot),configHash,c.mode,hold,now,now,w.id,w.version,w.original_price_minor,user,now-86400000),
  env.DB.prepare("UPDATE creative_works SET original_status='reserved',reservation_id=?,reserved_at=? WHERE id=? AND original_status='available' AND EXISTS(SELECT 1 FROM original_orders WHERE id=? AND status='held')").bind(id,new Date(now).toISOString(),w.id,id)
 ]);
 const row=await first(env.DB,'SELECT * FROM original_orders WHERE user_id=? AND request_key=?',user,d.requestKey);if(!row)fail('original_unavailable',409);if(row.request_hash!==requestHash)fail('idempotency_conflict',409);return response({order:dto(row)},201);
}
function params(row,origin){const q=JSON.parse(row.snapshot_json),en=row.checkout_language==='en',p=new URLSearchParams();p.set('mode','payment');p.set('payment_method_types[0]','card');p.set('client_reference_id',row.id);p.set('metadata[order_id]',row.id);p.set('metadata[kind]','sfi_original');p.set('metadata[artwork_id]',row.artwork_id);p.set('metadata[artist_id]',row.artist_id);p.set('payment_intent_data[metadata][order_id]',row.id);p.set('payment_intent_data[metadata][kind]','sfi_original');p.set('expires_at',String(Math.floor(row.checkout_started/1000)+3600));p.set('shipping_address_collection[allowed_countries][0]','NO');p.set('line_items[0][quantity]','1');p.set('line_items[0][price_data][currency]','nok');p.set('line_items[0][price_data][unit_amount]',String(q.artworkPriceMinor));p.set('line_items[0][price_data][product_data][name]',(en?'Original artwork: ':'Originalverk: ')+q.title);p.set('shipping_options[0][shipping_rate_data][type]','fixed_amount');p.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]',String(q.shippingMinor));p.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]','nok');p.set('shipping_options[0][shipping_rate_data][display_name]',en?'Shipping within Norway':'Frakt i Norge');const route=en?'/en/original-art/':'/originalverk/';p.set('success_url',origin+route+'?originalOrder='+row.id);p.set('cancel_url',origin+route+'?originalOrder='+row.id);return p;}
async function checkout(request,env,c,user,now,fetcher,url){
 const d=await body(request);exact(d,['orderId','acceptedTerms','termsVersion','language']);if(d.acceptedTerms!==true||!['no','en'].includes(d.language))fail('terms_required');let row=await order(env,d.orderId,user);const q=JSON.parse(row.snapshot_json);if(d.termsVersion!==q.termsVersion)fail('terms_changed',409);
 if(row.session_id)return response({order:dto(row),checkoutUrl:row.status==='pending'?row.checkout_url:null});
 if(row.status==='held'){
  if(!open(env,c))fail('not_open',503);if(row.hold_expires_at<=now||row.config_hash!==await digest(JSON.stringify(c)))fail('reservation_expired',409);
  const r=await env.DB.prepare("UPDATE original_orders SET status='creating',checkout_started=?,checkout_language=?,updated_at=? WHERE id=? AND status='held' AND hold_expires_at>? AND EXISTS(SELECT 1 FROM creative_works WHERE id=artwork_id AND original_status='reserved' AND reservation_id=original_orders.id AND original_price_minor=CAST(json_extract(snapshot_json,'$.artworkPriceMinor') AS INTEGER))").bind(now,d.language,now,row.id,now).run();
  row=await order(env,row.id,user);if(!changed(r)&&row.status!=='creating')fail('reservation_conflict',409);
 }
 if(row.status!=='creating'||row.checkout_language!==d.language||row.checkout_started+3500000<=now)fail('checkout_requires_review',409);
 const providerKey=env.STRIPE_SECRET_KEY;
 if(env.ORIGINAL_STRIPE_MODE!==row.mode||!providerKey?.startsWith(`sk_${row.mode}_`))fail('not_open',503);
 // Stripe idempotency keys are scoped to an account, not just test/live mode.
 // Bind both the declared recipient and the actual key's account to this order.
 // Capture the verified key so asynchronous configuration changes cannot switch it.
 if(!PROVIDER_ACCOUNT.test(q.providerAccountId||'')||c?.providerAccountId!==q.providerAccountId)fail('provider_account_changed',409);
 let session;try{
  const accountResponse=await fetcher('https://api.stripe.com/v1/account',{method:'GET',headers:{Authorization:`Bearer ${providerKey}`},signal:AbortSignal.timeout(15000)});if(!accountResponse.ok)fail('provider_unavailable',502);
  const account=await accountResponse.json();if(account.object!=='account'||account.id!==q.providerAccountId||account.charges_enabled!==true)fail('provider_account_unverified',409);
  const r=await fetcher('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${providerKey}`,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':'sfi-original-'+row.id},body:params(row,url.origin),signal:AbortSignal.timeout(15000)});if(!r.ok)fail('provider_unavailable',502);session=await r.json();
 }catch(e){if(e instanceof OriginalError)throw e;fail('provider_unavailable',502);}
 let redirect;try{redirect=new URL(session.url);}catch{fail('invalid_provider_response',502);}
 if(redirect.origin!=='https://checkout.stripe.com'||redirect.username||redirect.password||redirect.port||session.object!=='checkout.session'||session.mode!=='payment'||!session.id?.startsWith(row.mode==='test'?'cs_test_':'cs_live_')||session.livemode!==(row.mode==='live')||session.amount_total!==q.totalMinor||session.currency!=='nok'||session.metadata?.kind!=='sfi_original'||session.metadata?.order_id!==row.id||session.metadata?.artwork_id!==row.artwork_id||session.metadata?.artist_id!==row.artist_id||session.client_reference_id!==row.id)fail('invalid_provider_response',502);
 await env.DB.prepare("UPDATE original_orders SET session_id=COALESCE(session_id,?),checkout_url=COALESCE(checkout_url,?),status=CASE WHEN status='creating' THEN 'pending' ELSE status END,updated_at=? WHERE id=? AND (session_id IS NULL OR session_id=?)").bind(session.id,redirect.href,now,row.id,session.id).run();row=await order(env,row.id,user);if(row.session_id!==session.id)fail('provider_session_conflict',409);return response({order:dto(row),checkoutUrl:row.status==='pending'?row.checkout_url:null});
}
async function cancel(env,id,user,now){let row=await order(env,id,user);await env.DB.batch([
 env.DB.prepare("UPDATE original_orders SET status='cancelled',updated_at=? WHERE id=? AND status='held' AND checkout_started IS NULL").bind(now,row.id),
 env.DB.prepare("UPDATE creative_works SET original_status='available',reservation_id=NULL,reserved_at=NULL WHERE id=? AND original_status='reserved' AND reservation_id=? AND EXISTS(SELECT 1 FROM original_orders WHERE id=? AND status='cancelled' AND checkout_started IS NULL)").bind(row.artwork_id,row.id,row.id)
 ]);row=await order(env,id,user);if(row.status!=='cancelled')fail('checkout_already_started',409);return response({order:dto(row)});}
async function verify(rawBytes,header,secret,now){if(!secret?.startsWith('whsec_')||typeof header!=='string'||header.length>2048)fail('invalid_signature');const pairs=header.split(',').map(s=>s.trim().split('=')),ts=pairs.filter(([k])=>k==='t'),sigs=pairs.filter(([k,v])=>k==='v1'&&/^[a-f0-9]{64}$/.test(v||''));if(ts.length!==1||!/^\d{10,12}$/.test(ts[0][1]||'')||!sigs.length||Math.abs(Math.floor(now/1000)-Number(ts[0][1]))>300)fail('invalid_signature');const prefix=encoder.encode(ts[0][1]+'.'),message=new Uint8Array(prefix.length+rawBytes.length);message.set(prefix);message.set(rawBytes,prefix.length);const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);for(const [,sig]of sigs)if(await crypto.subtle.verify('HMAC',key,Uint8Array.from(sig.match(/../g),v=>parseInt(v,16)),message))return;fail('invalid_signature');}
async function webhook(request,env,now){
 if(!env.DB||!['test','live'].includes(env.ORIGINAL_STRIPE_MODE))fail('not_open',503);const bytes=await raw(request,262144);await verify(bytes,request.headers.get('Stripe-Signature'),env.ORIGINAL_STRIPE_WEBHOOK_SECRET,now);let event;try{event=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail('invalid_json');}
 if(!text(event.id,5,200)||!event.id.startsWith('evt_')||event.livemode!==(env.ORIGINAL_STRIPE_MODE==='live')||!event.data?.object)fail('invalid_event');const hash=await digest(bytes),prior=await first(env.DB,'SELECT payload_hash FROM original_sales_events WHERE id=?',event.id);if(prior){if(prior.payload_hash!==hash)fail('event_conflict',409);return response({received:true});}
 const s=event.data.object;let row,next,payment=null,refund=0;
 if(event.type==='charge.refunded'){
  if(typeof s.payment_intent!=='string')return response({received:true,ignored:true});row=await first(env.DB,'SELECT * FROM original_orders WHERE payment_intent=?',s.payment_intent);
  // Stripe copies PaymentIntent metadata to its charge. A matching original-sale
  // refund that beats the checkout webhook must retry, never be silently lost.
  if(!row){if(s.metadata?.kind==='sfi_original')fail('payment_confirmation_pending',409);return response({received:true,ignored:true});}
  const q=JSON.parse(row.snapshot_json);if(s.object!=='charge'||s.currency!=='nok'||s.amount!==q.totalMinor||!money(s.amount_refunded)||s.amount_refunded>q.totalMinor)fail('event_mismatch',409);refund=Math.max(row.refunded_minor,s.amount_refunded);next=refund===q.totalMinor?'refunded':refund>0?'partially_refunded':'paid';
 }else if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.expired','checkout.session.async_payment_failed'].includes(event.type)){
  if(s.metadata?.kind!=='sfi_original'||!UUID.test(s.metadata?.order_id||''))return response({received:true,ignored:true});row=await first(env.DB,'SELECT * FROM original_orders WHERE id=?',s.metadata.order_id);if(!row)return response({received:true,ignored:true});const q=JSON.parse(row.snapshot_json);
  if(row.mode!==env.ORIGINAL_STRIPE_MODE||s.livemode!==(row.mode==='live')||s.object!=='checkout.session'||s.mode!=='payment'||!s.id?.startsWith(row.mode==='test'?'cs_test_':'cs_live_')||(row.session_id&&row.session_id!==s.id)||s.amount_total!==q.totalMinor||s.currency!=='nok'||s.client_reference_id!==row.id||s.metadata.artwork_id!==row.artwork_id||s.metadata.artist_id!==row.artist_id||row.checkout_started===null)fail('event_mismatch',409);
  if(s.payment_status==='paid'&&['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){if(typeof s.payment_intent!=='string'||!/^pi_[A-Za-z0-9]+$/.test(s.payment_intent))fail('event_mismatch',409);payment=s.payment_intent;next='paid';}
  else if(event.type==='checkout.session.expired'&&s.status==='expired'&&s.payment_status==='unpaid')next='expired';
  else if(event.type==='checkout.session.async_payment_failed'&&s.status==='complete'&&s.payment_status==='unpaid')next='payment_failed';
  else next='pending';
  if(row.payment_intent&&payment&&row.payment_intent!==payment)fail('event_mismatch',409);refund=row.refunded_minor;
 }else return response({received:true,ignored:true});
 if(row.mode!==env.ORIGINAL_STRIPE_MODE)fail('event_mismatch',409);
 const statements=[];
 if(next==='paid')statements.push(env.DB.prepare("UPDATE creative_works SET original_status='sold' WHERE id=? AND original_status='reserved' AND reservation_id=? AND EXISTS(SELECT 1 FROM original_orders WHERE id=? AND status IN ('creating','pending')) AND NOT EXISTS(SELECT 1 FROM original_sales_events WHERE id=?)").bind(row.artwork_id,row.id,row.id,event.id));
 statements.push(env.DB.prepare(`UPDATE original_orders SET session_id=COALESCE(session_id,?),payment_intent=COALESCE(payment_intent,?),refunded_minor=MAX(refunded_minor,?),status=CASE
  WHEN status='needs_review' AND MAX(refunded_minor,?)<CAST(json_extract(snapshot_json,'$.totalMinor') AS INTEGER) THEN 'needs_review'
  WHEN MAX(refunded_minor,?)>0 THEN CASE WHEN MAX(refunded_minor,?)=CAST(json_extract(snapshot_json,'$.totalMinor') AS INTEGER) THEN 'refunded' ELSE 'partially_refunded' END
  WHEN status='paid' THEN 'paid'
  WHEN ?='paid' THEN CASE WHEN EXISTS(SELECT 1 FROM creative_works WHERE id=artwork_id AND original_status='sold' AND reservation_id=original_orders.id) THEN 'paid' ELSE 'needs_review' END
  WHEN status IN ('expired','cancelled','payment_failed','needs_review') THEN status ELSE ? END,updated_at=? WHERE id=? AND NOT EXISTS(SELECT 1 FROM original_sales_events WHERE id=?)`).bind(s.object==='checkout.session'?s.id:null,payment,refund,refund,refund,refund,next,next,now,row.id,event.id));
 if(['expired','payment_failed'].includes(next))statements.push(env.DB.prepare("UPDATE creative_works SET original_status='available',reservation_id=NULL,reserved_at=NULL WHERE id=? AND original_status='reserved' AND reservation_id=? AND EXISTS(SELECT 1 FROM original_orders WHERE id=? AND status IN ('expired','payment_failed') AND payment_intent IS NULL) AND NOT EXISTS(SELECT 1 FROM original_sales_events WHERE id=?)").bind(row.artwork_id,row.id,row.id,event.id));
 statements.push(env.DB.prepare('INSERT INTO original_sales_events(id,order_id,type,payload_hash,received_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(event.id,row.id,event.type,hash,now));await env.DB.batch(statements);
 const storedEvent=await first(env.DB,'SELECT payload_hash FROM original_sales_events WHERE id=?',event.id);if(storedEvent?.payload_hash!==hash)fail('event_conflict',409);
 const final=await first(env.DB,'SELECT status,payment_intent FROM original_orders WHERE id=?',row.id);if(payment&&final.payment_intent!==payment)fail('event_mismatch',409);return response({received:true,requiresReview:final.status==='needs_review'});
}
export async function handleOriginalSales(request,env={},options={}){
 const url=new URL(request.url);if(url.pathname!==PREFIX&&!url.pathname.startsWith(PREFIX+'/'))return null;
 const now=options.now??Date.now(),fetcher=options.fetch??globalThis.fetch;
 try{
  if(url.search)fail('invalid_input');const route=url.pathname.slice(PREFIX.length),c=configuration(env);
  if(route==='/config'&&request.method==='GET')return response({enabled:open(env,c),status:open(env,c)?'ready':'not_open',mode:c?.mode??null,currency:'NOK',termsVersion:c?.termsVersion??null,shippingMinor:c?.shippingMinor??null,seller:c?.seller??null,inventory:'one_physical_original',reproductionRightsIncluded:false});
  if(route==='/webhook'&&request.method==='POST')return await webhook(request,env,now);
  const item=route.match(/^\/artworks\/(work_[0-9a-f-]{36})$/i);
  if(item&&request.method==='GET'){if(!open(env,c))fail('not_open',503);const w=await first(env.DB,"SELECT w.id,w.artist_id,w.title,w.author_name,w.original_status,w.original_price_minor FROM creative_works w JOIN creative_artists a ON a.id=w.artist_id WHERE w.id=? AND w.status='published' AND w.kind='art' AND w.origin!='ai-generated' AND w.physical_original=1 AND w.original_sale_allowed=1",item[1]);if(!w||!c.artistAgreements[w.artist_id])fail('not_found',404);return response({artwork:{id:w.id,title:w.title,artistName:w.author_name,status:w.original_status,priceMinor:w.original_price_minor,currency:'NOK',quantity:1,ownershipClaim:'artist_declared',reproductionRightsIncluded:false}});}
  if(!env.DB)fail('not_open',503);const user=identity(request);
  const id=route.match(/^\/orders\/([0-9a-f-]{36})$/i);if(id&&request.method==='GET')return response({order:dto(await order(env,id[1],user))});
  if(request.method!=='POST')fail('not_found',404);sameOrigin(request,url);
  const cancelId=route.match(/^\/orders\/([0-9a-f-]{36})\/cancel$/i);if(cancelId)return await cancel(env,cancelId[1],user,now);
  if(route==='/checkout')return await checkout(request,env,c,user,now,fetcher,url);
  if(route==='/reservations'){if(!open(env,c))fail('not_open',503);return await reserve(request,env,c,user,now);}
  fail('not_found',404);
 }catch(e){if(e instanceof OriginalError)return response({error:{code:e.code}},e.status);return response({error:{code:'service_unavailable'}},503);}
}
