/* Pure settlement plan. It never moves money or stores bank account numbers.
 * Only a verified payment-provider integration may execute an approved plan.
 */
const minor=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000;
export function galleryAllocation({paidMinor,taxMinor=0,shippingMinor=0,productionMinor,paymentFeeMinor,reserveMinor=0,galleryBps=1000,artistMinimumMinor=0}){
 for(const n of [paidMinor,taxMinor,shippingMinor,productionMinor,paymentFeeMinor,reserveMinor,artistMinimumMinor])if(!minor(n))throw Error('invalid_money');
 if(!Number.isInteger(galleryBps)||galleryBps<0||galleryBps>5000)throw Error('invalid_gallery_rate');
 const costs=taxMinor+shippingMinor+productionMinor+paymentFeeMinor+reserveMinor;
 if(costs>paidMinor)throw Error('costs_exceed_payment');
 const distributableMinor=paidMinor-costs;
 const galleryMinor=Number(BigInt(distributableMinor)*BigInt(galleryBps)/10000n);
 const artistMinor=distributableMinor-galleryMinor;
 if(artistMinor<artistMinimumMinor)throw Error('artist_minimum_not_met');
 return {currency:'NOK',paidMinor,taxMinor,shippingMinor,productionMinor,paymentFeeMinor,reserveMinor,distributableMinor,artistMinor,galleryMinor,galleryBps,basis:'after_confirmed_costs_and_tax',execution:false};
}
export function artworkPoolForMinimum(artistMinimumMinor,galleryBps=1000){
 if(!minor(artistMinimumMinor)||!Number.isInteger(galleryBps)||galleryBps<0||galleryBps>5000)throw Error('invalid_money');
 // Find the smallest pool whose rounded gallery share leaves the artist's minimum.
 let lo=artistMinimumMinor,hi=Number((BigInt(artistMinimumMinor)*10000n+BigInt(10000-galleryBps)-1n)/BigInt(10000-galleryBps));
 while(lo<hi){const m=Math.floor((lo+hi)/2);const gallery=Math.floor(m*galleryBps/10000);if(m-gallery>=artistMinimumMinor)hi=m;else lo=m+1;}return lo;
}
export function validateSettlementActivation(c){
 const missing=[];
 for(const key of ['merchantVerified','providerSplitApproved','artistTermsAccepted','artistAccountVerified','galleryCustodyAgreementAccepted','galleryAccountVerified','refundProcessTested','webhookVerified','idempotentLedgerReady'])if(c?.[key]!==true)missing.push(key);
 if(!/^acct_[A-Za-z0-9]+$/.test(c?.artistProviderAccount||''))missing.push('artistProviderAccount');
 if(!/^acct_[A-Za-z0-9]+$/.test(c?.galleryProviderAccount||''))missing.push('galleryProviderAccount');
 if(c?.artistProviderAccount===c?.galleryProviderAccount)missing.push('separateRecipients');
 return {ready:missing.length===0,missing};
}
