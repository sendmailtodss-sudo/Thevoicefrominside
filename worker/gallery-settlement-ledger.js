/* Private allocation bookkeeping, not a payment executor.
 * Payment evidence is accepted only from merchandise.js after HMAC and order checks.
 * Cost/account attestations enter through a trusted operator, never a shop HTTP route.
 * Provider onboarding must own bank details; this module accepts provider IDs only.
 */
import {galleryAllocation,validateSettlementActivation} from './gallery-settlement.js';

const ID=/^[a-zA-Z0-9_-]{1,100}$/;
const HASH=/^[a-f0-9]{64}$/;
const MONEY_FIELDS=['taxMinor','shippingMinor','productionMinor','paymentFeeMinor','reserveMinor'];
const money=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000;
const sha256=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
function reject(code){throw new Error(code);}

/** Append these statements to the SAME atomic D1 batch as the verified order/event.
 * Read the order inside that transaction, so stale/lower refunds cannot regress state.
 */
export function settlementEventStatements(db,{orderId,eventId,eventType,payloadHash,now}){
 return [
  db.prepare(`INSERT INTO merch_settlement_orders(order_id,payment_intent,mode,gross_minor,refunded_minor,status,created_at,updated_at)
   SELECT id,payment_intent,mode,CAST(json_extract(quote_json,'$.totalMinor') AS INTEGER),refunded_minor,
    CASE WHEN refunded_minor>0 THEN 'refund_hold' ELSE 'awaiting_confirmed_costs' END,?,?
   FROM merch_orders WHERE id=? AND payment_intent IS NOT NULL AND status IN ('paid','partially_refunded','refunded')
    AND EXISTS(SELECT 1 FROM merch_events WHERE id=? AND payload_hash=?)
   ON CONFLICT(order_id) DO UPDATE SET refunded_minor=MAX(merch_settlement_orders.refunded_minor,excluded.refunded_minor),
    status=CASE WHEN MAX(merch_settlement_orders.refunded_minor,excluded.refunded_minor)>0 THEN 'refund_hold' ELSE merch_settlement_orders.status END,
    updated_at=MAX(merch_settlement_orders.updated_at,excluded.updated_at)`).bind(now,now,orderId,eventId,payloadHash),
  db.prepare(`INSERT INTO merch_settlement_observations(event_id,order_id,event_type,payload_hash,gross_minor,refunded_minor,received_at)
   SELECT ?,order_id,?,?,gross_minor,refunded_minor,? FROM merch_settlement_orders WHERE order_id=?
    AND EXISTS(SELECT 1 FROM merch_events WHERE id=? AND payload_hash=?)
   ON CONFLICT(event_id) DO NOTHING`).bind(eventId,eventType,payloadHash,now,orderId,eventId,payloadHash),
  // Any partial/full refund cancels the entire proposed allocation pending reconciliation.
  // This reverses BOOK entries; it never sends a refund or claws back a provider transfer.
  db.prepare(`INSERT INTO merch_settlement_entries(order_id,entry_key,account_kind,amount_minor,provider_account,source_event_id,created_at)
   SELECT e.order_id,'refund_hold:'||e.entry_key,e.account_kind,-e.amount_minor,e.provider_account,?,?
   FROM merch_settlement_entries e JOIN merch_settlement_orders s ON s.order_id=e.order_id
   WHERE e.order_id=? AND s.refunded_minor>0 AND e.entry_key NOT LIKE 'refund_hold:%'
    AND EXISTS(SELECT 1 FROM merch_events WHERE id=? AND payload_hash=?)
   ON CONFLICT(order_id,entry_key) DO NOTHING`).bind(eventId,now,orderId,eventId,payloadHash),
  db.prepare(`UPDATE merch_settlement_plans SET status='refund_hold',updated_at=MAX(updated_at,?)
   WHERE order_id=? AND EXISTS(SELECT 1 FROM merch_settlement_orders s WHERE s.order_id=? AND s.refunded_minor>0)
    AND EXISTS(SELECT 1 FROM merch_events WHERE id=? AND payload_hash=?)`).bind(now,orderId,orderId,eventId,payloadHash)
 ];
}

function quotedArtist(quote){
 const artists=new Map();
 if(!Array.isArray(quote.items)||!quote.items.length)reject('artist_basis_missing');
 for(const item of quote.items){
  const fees=item.priceBreakdown?.artworkFees;
  if(!Number.isSafeInteger(item.quantity)||item.quantity<1||!Array.isArray(fees)||!fees.length)reject('artist_basis_missing');
  for(const fee of fees){
   if(!ID.test(fee.artistId||'')||!money(fee.amountMinor)||!ID.test(fee.licenseId||'')||!ID.test(fee.licenseVersion||''))reject('artist_basis_missing');
   const total=(artists.get(fee.artistId)||0)+fee.amountMinor*item.quantity;
   if(!money(total))reject('artist_basis_invalid');
   artists.set(fee.artistId,total);
  }
 }
 // Do not invent how residual income should be split between different artists.
 if(artists.size!==1)reject('multi_artist_allocation_requires_review');
 const [artistId,minimumMinor]=[...artists][0];return {artistId,minimumMinor};
}

/** Trusted private operator function. No public route calls it and no provider call
 * exists here. Activation booleans must be backed by the operator's actual evidence;
 * they do not establish a verified merchant, KYC or custody agreement by themselves.
 */
export async function recordGallerySettlementPlan(db,{orderId,costEvidence,activation,operatorReference,now=Date.now()}){
 if(!ID.test(operatorReference||'')||!Number.isSafeInteger(now)||now<0)reject('invalid_operator_reference');
 const row=await db.prepare('SELECT * FROM merch_orders WHERE id=?').bind(orderId).first();
 const receipt=await db.prepare('SELECT * FROM merch_settlement_orders WHERE order_id=?').bind(orderId).first();
 if(!row||!receipt||row.status!=='paid'||row.refunded_minor!==0||receipt.refunded_minor!==0||receipt.payment_intent!==row.payment_intent)reject('payment_not_available');
 const quote=JSON.parse(row.quote_json),artist=quotedArtist(quote),c=costEvidence;
 if(!c||c.confirmed!==true||c.currency!=='NOK'||!ID.test(c.reference||'')||c.paymentIntent!==row.payment_intent||c.paidMinor!==quote.totalMinor||!money(c.paidMinor)||!MONEY_FIELDS.every(k=>money(c[k]))||!Number.isSafeInteger(c.confirmedAt)||c.confirmedAt<row.created_at||c.confirmedAt>now)reject('confirmed_costs_required');
 if(!Array.isArray(c.evidenceHashes)||!c.evidenceHashes.length||c.evidenceHashes.length>20||c.evidenceHashes.some(h=>!HASH.test(h)))reject('cost_evidence_required');
 if(!validateSettlementActivation(activation).ready||activation?.artistId!==artist.artistId||activation?.orderTermsVersion!==quote.termsVersion||!ID.test(activation?.settlementTermsVersion||'')||!HASH.test(activation?.evidenceHash||''))reject('settlement_activation_incomplete');
 const allocation=galleryAllocation({paidMinor:c.paidMinor,...Object.fromEntries(MONEY_FIELDS.map(k=>[k,c[k]])),galleryBps:1000,artistMinimumMinor:artist.minimumMinor});
 const plan={version:1,orderId,paymentIntent:row.payment_intent,mode:row.mode,currency:'NOK',quoteHash:await sha256(row.quote_json),
  artistId:artist.artistId,artistMinimumMinor:artist.minimumMinor,artistProviderAccount:activation.artistProviderAccount,galleryProviderAccount:activation.galleryProviderAccount,
  orderTermsVersion:quote.termsVersion,settlementTermsVersion:activation.settlementTermsVersion,activationEvidenceHash:activation.evidenceHash,
  costReference:c.reference,costEvidenceHashes:[...new Set(c.evidenceHashes)].sort(),costConfirmedAt:c.confirmedAt,operatorReference,allocation,
  execution:false,executionStatus:'not_implemented',refundPolicy:'any_refund_holds_entire_allocation_until_reconciled'};
 const json=JSON.stringify(plan),hash=await sha256(json);
 const entries=[['receipt','clearing',-allocation.paidMinor,null],['tax','tax',allocation.taxMinor,null],['shipping','shipping',allocation.shippingMinor,null],
  ['production','production',allocation.productionMinor,null],['payment_fee','payment_fee',allocation.paymentFeeMinor,null],['reserve','reserve',allocation.reserveMinor,null],
  ['artist','artist',allocation.artistMinor,activation.artistProviderAccount],['gallery','gallery',allocation.galleryMinor,activation.galleryProviderAccount]];
 const statements=[db.prepare(`INSERT INTO merch_settlement_plans(order_id,plan_hash,plan_json,status,created_at,updated_at)
  SELECT id,?,?,'planned_no_transfer',?,? FROM merch_orders
  WHERE id=? AND status='paid' AND refunded_minor=0 AND payment_intent=? AND quote_json=?
  ON CONFLICT(order_id) DO NOTHING`).bind(hash,json,now,now,orderId,row.payment_intent,row.quote_json)];
 for(const [key,kind,amount,account]of entries)statements.push(db.prepare(`INSERT INTO merch_settlement_entries(order_id,entry_key,account_kind,amount_minor,provider_account,created_at)
  SELECT p.order_id,?,?,?,?,? FROM merch_settlement_plans p JOIN merch_orders o ON o.id=p.order_id
  WHERE p.order_id=? AND p.plan_hash=? AND p.status='planned_no_transfer' AND o.status='paid' AND o.refunded_minor=0
  ON CONFLICT(order_id,entry_key) DO NOTHING`).bind(key,kind,amount,account,now,orderId,hash));
 statements.push(db.prepare(`UPDATE merch_settlement_orders SET status='planned_no_transfer',updated_at=MAX(updated_at,?)
  WHERE order_id=? AND refunded_minor=0 AND EXISTS(SELECT 1 FROM merch_settlement_plans p WHERE p.order_id=? AND p.plan_hash=? AND p.status='planned_no_transfer')`).bind(now,orderId,orderId,hash));
 await db.batch(statements);
 const stored=await db.prepare('SELECT plan_hash,plan_json,status FROM merch_settlement_plans WHERE order_id=?').bind(orderId).first();
 if(!stored)reject('payment_changed_during_plan');
 if(stored.plan_hash!==hash)reject('settlement_plan_conflict');
 if(stored.status!=='planned_no_transfer')reject('refund_reconciliation_required');
 return {status:stored.status,planHash:hash,plan:JSON.parse(stored.plan_json),execution:false};
}
