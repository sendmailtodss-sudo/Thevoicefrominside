/* Merchandise only: no connection to the separate legal-help fund or account. */
import {configuredDesigner,priceMerchDesign,MerchDesignError,COMMUNITY_MARK} from './merch-design.js';
import {settlementEventStatements} from './gallery-settlement-ledger.js';
const PREFIX='/api/shop';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TOKEN=/^[0-9a-f]{64}$/;
const encoder=new TextEncoder();
const products=[...['white','black','navy'].flatMap(color=>['S','M','L','XL','XXL','XXXL'].map(size=>({sku:`shirt-${color}-${size}`,type:'shirt',name:{no:{white:'Hvit T-skjorte',black:'Svart T-skjorte',navy:'Marineblå T-skjorte'}[color],en:{white:'White T-shirt',black:'Black T-shirt',navy:'Navy T-shirt'}[color]},size,color,priceMinor:null,available:false}))),{sku:'wallpaper-custom',type:'wallpaper',name:{no:'Veggtapet etter mål',en:'Custom wallpaper'},size:'custom',priceMinor:null,available:false},{sku:'stencil-150x200',type:'stencil',name:{no:'Malingssjablong',en:'Painting stencil'},size:'150 × 200 cm',priceMinor:null,available:false}];
const artworks=[{id:'redhood',name:{no:'Rødhette i gangen',en:'Little Red Riding Hood in the corridor'},image:'/design-assets/merch/redhood.jpeg',artist:'Innsatt 2601-46',available:false},{id:'gjenbruk',name:{no:'Gjenbruk',en:'Reuse'},image:'/design-assets/book-r8/page-354.webp',artist:'Innsatt 2601-46',available:false}];
export function disabledCatalog(){return {enabled:false,mode:'closed',status:'not_open',currency:'NOK',termsVersion:null,shippingMinor:null,seller:null,designer:{enabled:false},products:structuredClone(products),artworks:structuredClone(artworks)};}
class ShopError extends Error {constructor(code,message,status=400){super(message);this.code=code;this.status=status;}}
const fail=(...args)=>{throw new ShopError(...args)};
function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});}
const first=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const digest=async text=>hex(await crypto.subtle.digest('SHA-256',encoder.encode(text)));
function exact(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))fail('invalid_input','Unexpected or missing fields.');}
function text(value,min,max){return typeof value==='string'&&value.trim()===value&&value.length>=min&&value.length<=max&&!/[\u0000-\u001f\u007f]/.test(value);}
function money(n,min=0,max=100000000){return Number.isSafeInteger(n)&&n>=min&&n<=max;}
function safePath(value){return typeof value==='string'&&/^\/[a-zA-Z0-9/_-]+\/$/.test(value)&&!value.startsWith('//');}
function config(env){
  try {
    const c=JSON.parse(env.MERCH_CONFIG_JSON||'null'),mode=env.MERCH_STRIPE_MODE;
    if(!c||!['test','live'].includes(mode)||!text(c.version,1,64)||!text(c.termsVersion,1,64)||c.fulfilmentReady!==true||!money(c.shippingMinor)||!c.prices||Array.isArray(c.prices)||typeof c.prices!=='object'||!Array.isArray(c.licensedArtworkIds))return null;
    const designer=configuredDesigner(c.designer);
    if(!designer&&(!c.licensedArtworkIds.length||!Object.keys(c.prices).length))return null;
    const s=c.seller;if(!s||!text(s.name,2,200)||!/^\d{9}$/.test(s.organisationNumber)||!text(s.address,5,500)||!text(s.email,5,254)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)||!text(s.phone,5,40)||!safePath(s.withdrawalFormUrl)||!safePath(s.termsUrl)||!safePath(s.privacyUrl)||!text(s.deliveryText,10,2000)||!text(s.returnsText,10,3000))return null;
    if(Object.entries(c.prices).some(([sku,price])=>!products.some(p=>p.sku===sku&&p.type==='shirt')||!money(price,100,10000000)))return null;
    if(c.licensedArtworkIds.some(id=>!artworks.some(a=>a.id===id))||new Set(c.licensedArtworkIds).size!==c.licensedArtworkIds.length)return null;
    if(typeof env.STRIPE_SECRET_KEY!=='string'||!env.STRIPE_SECRET_KEY.startsWith(`sk_${mode}_`)||typeof env.STRIPE_WEBHOOK_SECRET!=='string'||!env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')||!env.DB)return null;
    return {version:c.version,termsVersion:c.termsVersion,fulfilmentReady:true,shippingMinor:c.shippingMinor,designer,prices:Object.fromEntries(Object.entries(c.prices).sort()),licensedArtworkIds:[...c.licensedArtworkIds].sort(),seller:{name:s.name,organisationNumber:s.organisationNumber,address:s.address,email:s.email,phone:s.phone,withdrawalFormUrl:s.withdrawalFormUrl,termsUrl:s.termsUrl,privacyUrl:s.privacyUrl,deliveryText:s.deliveryText,returnsText:s.returnsText},mode};
  }catch{return null;}
}
function catalog(env,c){
  if(!c)return disabledCatalog();const enabled=env.MERCH_ENABLED==='true'&&env.MERCH_PAUSED!=='true';
  const artistWorks=new Map(artworks.map(a=>[a.id,{...a,available:enabled&&c.licensedArtworkIds.includes(a.id)}]));
  for(const [id,a]of Object.entries(c.designer?.artworks||{})){
    const prior=artistWorks.get(id);artistWorks.set(id,{...prior,id,name:{no:a.nameNo||prior?.name.no||id,en:a.nameEn||prior?.name.en||a.nameNo||id},image:a.image||prior?.image||null,artist:a.artistName,artistId:a.artistId,available:prior?.available||false,designerAvailable:enabled&&a.licenseActive,feeMinor:a.feeMinor,feeBasis:a.feeBasis,licenseActive:a.licenseActive});
  }
  return {enabled,mode:c.mode,status:enabled?'ready':env.MERCH_PAUSED==='true'?'paused':'not_open',currency:'NOK',termsVersion:c.termsVersion,shippingMinor:c.shippingMinor,seller:c.seller,designer:c.designer?{...c.designer,enabled}: {enabled:false},products:products.map(p=>({...p,priceMinor:c.prices[p.sku]??null,productionMinor:c.designer?.productionMinorBySku[p.sku]??null,available:enabled&&Object.hasOwn(c.prices,p.sku),designerAvailable:enabled&&!!c.designer&&Object.hasOwn(c.designer.productionMinorBySku,p.sku)})),artworks:[...artistWorks.values()]};
}
function sameOrigin(request,url){if(request.headers.get('Origin')!==url.origin||![null,'none','same-origin'].includes(request.headers.get('Sec-Fetch-Site')))fail('origin_rejected','Use this site to continue.',403);}
async function rawBody(request,limit){
  const declared=request.headers.get('Content-Length');if(declared&&(!/^\d+$/.test(declared)||Number(declared)>limit))fail('too_large','Request too large.',413);
  if(!request.body)fail('invalid_input','A request body is required.');
  const reader=request.body.getReader();let n=0;const chunks=[];
  try{while(true){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>limit){await reader.cancel();fail('too_large','Request too large.',413);}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(n);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
async function body(request){if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type')||''))fail('invalid_input','Send JSON.',415);try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await rawBody(request,16384)));}catch(e){if(e instanceof ShopError)throw e;fail('invalid_input','Invalid JSON.');}}
function parsedQuote(row){return JSON.parse(row.quote_json);}
function orderDTO(row,now){const q=parsedQuote(row);return {id:row.id,status:row.status==='quoted'&&Date.parse(q.expiresAt)<=now?'expired':row.status,currency:'NOK',totalMinor:q.totalMinor,refundedMinor:row.refunded_minor,createdAt:new Date(row.created_at).toISOString(),updatedAt:new Date(row.updated_at).toISOString()};}
function bearer(request){const h=request.headers.get('Authorization')||'';if(!/^Bearer [0-9a-f]{64}$/.test(h))fail('not_found','Order unavailable.',404);return h.slice(7);}
async function getOrder(env,id,token){if(!UUID.test(id)||!TOKEN.test(token))fail('not_found','Order unavailable.',404);const row=await first(env.DB,'SELECT * FROM merch_orders WHERE id=? AND token_hash=?',id,await digest(token));if(!row)fail('not_found','Order unavailable.',404);return row;}
async function quote(request,env,c,now){
  const d=await body(request);exact(d,['items','termsVersion']);if(d.termsVersion!==c.termsVersion)fail('terms_changed','Review the current terms.',409);
  if(!Array.isArray(d.items)||!d.items.length||d.items.length>10)fail('invalid_input','Choose 1–10 different items.');
  const seen=new Set();let quantity=0,subtotal=0;const items=d.items.map(item=>{
    const hasDesign=!!item&&Object.hasOwn(item,'design');
    exact(item,hasDesign?(Object.hasOwn(item,'artworkId')?['sku','artworkId','quantity','design']:['sku','quantity','design']):['sku','artworkId','quantity']);
    const p=products.find(p=>p.sku===item.sku);
    if(!p||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10)fail('unavailable_item','This product or quantity is unavailable.');
    if(hasDesign){
      const priced=priceMerchDesign(item.design,p.sku,c.designer),primary=priced.design.prints[0].artworkId;
      if(Object.hasOwn(item,'artworkId')&&item.artworkId!==primary)fail('invalid_input','Artwork must match the first print.');
      const key=p.sku+':'+JSON.stringify(priced.design);if(seen.has(key))fail('invalid_input','Combine duplicate items.');seen.add(key);quantity+=item.quantity;
      const lineTotalMinor=priced.unitPriceMinor*item.quantity;subtotal+=lineTotalMinor;
      return {sku:p.sku,artworkId:primary,quantity:item.quantity,name:p.name,artworkName:{no:priced.priceBreakdown.artworkFees.map(a=>a.artworkName.no).join(' + '),en:priced.priceBreakdown.artworkFees.map(a=>a.artworkName.en).join(' + ')},size:p.size,color:p.color,...priced,lineTotalMinor};
    }
    const a=artworks.find(a=>a.id===item.artworkId);
    if(!a||!Object.hasOwn(c.prices,p.sku)||!c.licensedArtworkIds.includes(a.id))fail('unavailable_item','This product or artwork is unavailable.');
    const key=p.sku+':'+a.id;if(seen.has(key))fail('invalid_input','Combine duplicate items.');seen.add(key);quantity+=item.quantity;
    const lineTotalMinor=c.prices[p.sku]*item.quantity;subtotal+=lineTotalMinor;
    return {sku:p.sku,artworkId:a.id,quantity:item.quantity,name:p.name,artworkName:a.name,size:p.size,branding:{...COMMUNITY_MARK},brandingCostIncludedInProduction:true,unitPriceMinor:c.prices[p.sku],lineTotalMinor};
  });
  if(quantity>20||!money(subtotal+c.shippingMinor,100))fail('invalid_input','Order exceeds the allowed amount or quantity.');
  const id=crypto.randomUUID(),token=hex(crypto.getRandomValues(new Uint8Array(32))),q={id,expiresAt:new Date(now+15*60000).toISOString(),items,subtotalMinor:subtotal,shippingMinor:c.shippingMinor,totalMinor:subtotal+c.shippingMinor,currency:'NOK',termsVersion:c.termsVersion};
  const result=await run(env.DB,`INSERT INTO merch_orders(id,token_hash,quote_json,config_hash,status,mode,created_at,updated_at) SELECT ?,?,?,?,'quoted',?,?,? WHERE (SELECT COUNT(*) FROM merch_orders WHERE created_at>?)<1000`,id,await digest(token),JSON.stringify(q),await digest(JSON.stringify(c)),c.mode,now,now,now-3600000);
  if(Number(result?.meta?.changes)!==1)fail('busy','Please try again later.',429);
  return response({quote:q,token},201);
}
function stripeParams(row,origin,language){
  const q=parsedQuote(row),path=language==='en'?'/en/shop/':'/butikk/',p=new URLSearchParams({mode:'payment',success_url:`${origin}${path}?order=${row.id}`,cancel_url:`${origin}${path}?order=${row.id}&cancelled=1`,client_reference_id:row.id,locale:language==='en'?'en':'nb','metadata[order_id]':row.id,'payment_intent_data[metadata][order_id]':row.id,'payment_method_types[0]':'card','shipping_address_collection[allowed_countries][0]':'NO',expires_at:String(Math.floor(row.checkout_started/1000)+3600),'consent_collection[terms_of_service]':'required'});
  q.items.forEach((item,i)=>{p.set(`line_items[${i}][price_data][currency]`,'nok');p.set(`line_items[${i}][price_data][unit_amount]`,String(item.unitPriceMinor));p.set(`line_items[${i}][price_data][product_data][name]`,`${item.name.no} ${item.size} · ${item.artworkName.no}`);p.set(`line_items[${i}][quantity]`,String(item.quantity));if(item.design?.branding?.placement==='inside_label')p.set(`line_items[${i}][price_data][product_data][description]`,language==='en'?'Branding: Stemmen fra innsiden on inside label only; no exterior community mark.':'Merking: Stemmen fra innsiden kun på innvendig merkelapp; uten utvendig fellesskapsmerke.');});
  p.set('shipping_options[0][shipping_rate_data][type]','fixed_amount');p.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]',String(q.shippingMinor));p.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]','nok');p.set('shipping_options[0][shipping_rate_data][display_name]','Frakt i Norge / Shipping within Norway');return p;
}
async function checkout(request,env,c,now,fetcher,url){
  const d=await body(request);exact(d,['quoteId','token','idempotencyKey','acceptedTerms','termsVersion','language']);if(d.acceptedTerms!==true||!UUID.test(d.idempotencyKey)||!['no','en'].includes(d.language)||!TOKEN.test(d.token))fail('invalid_input','Confirm the order and terms.');
  let row=await getOrder(env,d.quoteId,d.token);const q=parsedQuote(row);
  if(d.termsVersion!==q.termsVersion)fail('terms_changed','Review the order terms.',409);
  if(row.checkout_key&&row.checkout_key!==`${d.idempotencyKey}:${d.language}`)fail('idempotency_conflict','Retry with the original request ID and language.',409);
  if(row.session_id){if(row.status!=='pending')return response({orderId:row.id,token:d.token,status:row.status,checkoutUrl:null});return response({orderId:row.id,token:d.token,status:row.status,checkoutUrl:row.checkout_url});}
  if(row.status==='quoted'){
    if(!c||env.MERCH_ENABLED!=='true'||env.MERCH_PAUSED==='true')fail('not_open','Checkout is not open.',503);
    if(await digest(JSON.stringify(c))!==row.config_hash||Date.parse(q.expiresAt)<=now)fail('quote_expired','Refresh the order before paying.',409);
    await run(env.DB,`UPDATE merch_orders SET status='creating',checkout_key=?,checkout_started=?,updated_at=? WHERE id=? AND status='quoted'`,`${d.idempotencyKey}:${d.language}`,now,now,row.id);
    row=await getOrder(env,d.quoteId,d.token);
  }
  if(row.checkout_key!==`${d.idempotencyKey}:${d.language}`)fail('idempotency_conflict','This order already has a checkout attempt.',409);
  if(row.status!=='creating'||row.checkout_started+3500000<=now)fail('checkout_expired','This checkout can no longer be resumed. Contact the shop before retrying payment.',409);
  if(env.MERCH_STRIPE_MODE!==row.mode||!env.STRIPE_SECRET_KEY?.startsWith(`sk_${row.mode}_`))fail('not_open','Checkout temporarily unavailable.',503);
  let result;
  try{const res=await fetcher('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`,'Content-Type':'application/x-www-form-urlencoded','Idempotency-Key':`sfi-merch-${row.id}`,'Stripe-Version':'2026-10-28.endive'},body:stripeParams(row,url.origin,d.language),signal:AbortSignal.timeout(15000)});if(!res.ok)fail('provider_unavailable','Payment provider temporarily unavailable. Retry this order.',502);result=await res.json();}catch(e){if(e instanceof ShopError)throw e;fail('provider_unavailable','Payment provider temporarily unavailable. Retry this order.',502);}
  const expectedPrefix=row.mode==='test'?'cs_test_':'cs_live_';let redirect;try{redirect=new URL(result.url);}catch{fail('provider_response','Payment provider returned an invalid session.',502);}
  if(!result.id?.startsWith(expectedPrefix)||redirect.origin!=='https://checkout.stripe.com'||redirect.username||redirect.password||result.amount_total!==q.totalMinor||result.currency!=='nok'||result.metadata?.order_id!==row.id||result.livemode!==(row.mode==='live'))fail('provider_response','Payment provider returned an invalid session.',502);
  await run(env.DB,`UPDATE merch_orders SET session_id=COALESCE(session_id,?),checkout_url=COALESCE(checkout_url,?),status=CASE WHEN status='creating' THEN 'pending' ELSE status END,updated_at=? WHERE id=? AND (session_id IS NULL OR session_id=?)`,result.id,redirect.href,now,row.id,result.id);
  row=await getOrder(env,row.id,d.token);
  if(row.session_id!==result.id)fail('provider_response','Session conflict.',502);
  return response({orderId:row.id,token:d.token,status:row.status,checkoutUrl:row.status==='pending'?row.checkout_url:null});
}
async function verifySignature(raw,header,secret,now){
  if(!secret?.startsWith('whsec_')||typeof header!=='string'||header.length>2048)fail('invalid_signature','Invalid signature.',400);
  const entries=header.split(',').map(x=>x.trim().split('='));const timestamps=entries.filter(x=>x[0]==='t');const signatures=entries.filter(x=>x[0]==='v1'&&/^[a-f0-9]{64}$/.test(x[1]||''));
  if(timestamps.length!==1||!/^\d{10,12}$/.test(timestamps[0][1]||'')||!signatures.length||Math.abs(Math.floor(now/1000)-Number(timestamps[0][1]))>300)fail('invalid_signature','Invalid signature.',400);
  const prefix=encoder.encode(timestamps[0][1]+'.'),message=new Uint8Array(prefix.length+raw.length);message.set(prefix);message.set(raw,prefix.length);
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  for(const [,signature] of signatures){const bytes=Uint8Array.from(signature.match(/../g),x=>parseInt(x,16));if(await crypto.subtle.verify('HMAC',key,bytes,message))return;}
  fail('invalid_signature','Invalid signature.',400);
}
async function webhook(request,env,now){
  if(!env.DB||!env.STRIPE_WEBHOOK_SECRET||!['test','live'].includes(env.MERCH_STRIPE_MODE))fail('not_open','Webhook unavailable.',503);
  const raw=await rawBody(request,262144);await verifySignature(raw,request.headers.get('Stripe-Signature'),env.STRIPE_WEBHOOK_SECRET,now);
  let event;try{event=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw));}catch{fail('invalid_input','Invalid event.');}
  if(!text(event.id,5,200)||!event.id.startsWith('evt_')||event.livemode!==(env.MERCH_STRIPE_MODE==='live')||!event.data?.object)fail('invalid_event','Unexpected event.');
  const hash=hex(await crypto.subtle.digest('SHA-256',raw)),prior=await first(env.DB,'SELECT payload_hash FROM merch_events WHERE id=?',event.id);if(prior){if(prior.payload_hash!==hash)fail('event_conflict','Event conflict.',409);return response({received:true});}
  const o=event.data.object;let row,next,session=null,payment=null,refunded;
  if(['checkout.session.completed','checkout.session.async_payment_succeeded','checkout.session.expired'].includes(event.type)){
    if(!UUID.test(o.metadata?.order_id||''))return response({received:true,ignored:true});
    row=await first(env.DB,'SELECT * FROM merch_orders WHERE id=?',o.metadata.order_id);if(!row)return response({received:true,ignored:true});
    const q=parsedQuote(row);
    if(row.mode!==env.MERCH_STRIPE_MODE||!['creating','pending','paid','partially_refunded','refunded','expired'].includes(row.status)||o.object!=='checkout.session'||o.livemode!==(row.mode==='live')||!o.id?.startsWith(row.mode==='test'?'cs_test_':'cs_live_')||(row.session_id&&row.session_id!==o.id)||o.amount_total!==q.totalMinor||o.currency!=='nok'||o.client_reference_id!==row.id)fail('event_mismatch','Event does not match the order.',409);
    session=o.id;
    if(event.type==='checkout.session.expired')next='expired';
    else if(o.payment_status==='paid'){if(typeof o.payment_intent!=='string'||!/^pi_[a-zA-Z0-9]+$/.test(o.payment_intent))fail('event_mismatch','Missing payment reference.',409);next='paid';payment=o.payment_intent;}
    else next='pending';
    if(row.payment_intent&&payment&&row.payment_intent!==payment)fail('event_mismatch','Payment reference conflict.',409);
    refunded=row.refunded_minor;
  }else if(event.type==='charge.refunded'){
    if(typeof o.payment_intent!=='string')return response({received:true,ignored:true});
    row=await first(env.DB,'SELECT * FROM merch_orders WHERE payment_intent=?',o.payment_intent);
    if(!row)fail('event_order_pending','Awaiting payment confirmation. Retry event.',409);
    const q=parsedQuote(row);if(row.mode!==env.MERCH_STRIPE_MODE||o.object!=='charge'||o.currency!=='nok'||o.amount!==q.totalMinor||!money(o.amount_refunded,0,q.totalMinor))fail('event_mismatch','Refund does not match the order.',409);
    refunded=Math.max(row.refunded_minor,o.amount_refunded);next=refunded===q.totalMinor?'refunded':refunded>0?'partially_refunded':'paid';
  }else return response({received:true,ignored:true});
  // D1 batch is atomic. The event predicate prevents duplicate state transitions;
  // terminal refunds cannot be erased by late payment or expiry notifications.
  const update=env.DB.prepare(`UPDATE merch_orders SET session_id=COALESCE(session_id,?),payment_intent=COALESCE(payment_intent,?),refunded_minor=MAX(refunded_minor,?),status=CASE WHEN MAX(refunded_minor,?)>0 THEN CASE WHEN MAX(refunded_minor,?)=CAST(json_extract(quote_json,'$.totalMinor') AS INTEGER) THEN 'refunded' ELSE 'partially_refunded' END WHEN status='paid' THEN 'paid' WHEN status='expired' AND ?='pending' THEN 'expired' ELSE ? END,updated_at=? WHERE id=? AND NOT EXISTS(SELECT 1 FROM merch_events WHERE id=?)`).bind(session,payment,refunded,refunded,refunded,next,next,now,row.id,event.id);
  const insert=env.DB.prepare('INSERT INTO merch_events(id,order_id,type,payload_hash,received_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(event.id,row.id,event.type,hash,now);
  await env.DB.batch([update,insert,...settlementEventStatements(env.DB,{orderId:row.id,eventId:event.id,eventType:event.type,payloadHash:hash,now})]);
  const stored=await first(env.DB,'SELECT payload_hash FROM merch_events WHERE id=?',event.id);
  if(stored?.payload_hash!==hash)fail('event_conflict','Event conflict.',409);
  return response({received:true});
}
export async function handleMerchandise(request,env={},options={}){
  const url=new URL(request.url);if(url.pathname!==PREFIX&&!url.pathname.startsWith(PREFIX+'/'))return null;
  const now=options.now??Date.now(),fetcher=options.fetch??globalThis.fetch;
  try{
    if(url.search)fail('invalid_input','Unexpected query fields.');
    const path=url.pathname.slice(PREFIX.length),c=config(env);
    if(path==='/catalog'&&request.method==='GET')return response(catalog(env,c));
    if(path==='/webhook'&&request.method==='POST')return await webhook(request,env,now);
    if(path.startsWith('/orders/')&&request.method==='GET'){if(!env.DB)fail('not_found','Order unavailable.',404);return response({order:orderDTO(await getOrder(env,path.slice(8),bearer(request)),now)});}
    const cancelMatch=path.match(/^\/orders\/([0-9a-f-]+)\/cancel$/i);
    if(cancelMatch&&request.method==='POST'){
      sameOrigin(request,url);if(!env.DB)fail('not_found','Order unavailable.',404);
      const data=await body(request);exact(data,['token']);let row=await getOrder(env,cancelMatch[1],data.token);
      await run(env.DB,"UPDATE merch_orders SET status='expired',updated_at=? WHERE id=? AND status='quoted'",now,row.id);
      row=await getOrder(env,row.id,data.token);if(row.status!=='expired')fail('checkout_started','Payment has already started; keep the existing order.',409);
      return response({order:orderDTO(row,now)});
    }
    if(path==='/checkout'&&request.method==='POST'){sameOrigin(request,url);if(!env.DB)fail('not_open','Checkout is not open.',503);return await checkout(request,env,c,now,fetcher,url);}
    if(path==='/quote'&&request.method==='POST'){sameOrigin(request,url);if(!c||env.MERCH_ENABLED!=='true'||env.MERCH_PAUSED==='true')fail('not_open','Checkout is not open.',503);return await quote(request,env,c,now);}
    fail('not_found','Not found.',404);
  }catch(e){if(e instanceof MerchDesignError)return response({error:{code:e.code,message:'The design, artwork licence or configured price is unavailable.'}},400);if(e instanceof ShopError)return response({error:{code:e.code,message:e.message}},e.status);return response({error:{code:'service_unavailable',message:'The shop is temporarily unavailable. Please try again later.'}},503);}
}
