import {test} from 'node:test';
import assert from 'node:assert/strict';
import {witnessDraftFromQuote} from '../public/assets/witness-analysis-bridge.mjs';
const quote={page:2,quote:'Plassering besluttes for å avverge skade.'};
const doc={id:'decision-test',decisionDate:'2025-04-03',participantToken:'private-person',pages:[{number:1,text:'PRIVATE PERSONAL DATA'}, {number:2,text:quote.quote+' Private unrelated information.'}]};
const check={outcome:'flag',reason:'A possible legal issue, not a fact.',verifiedDocumentQuotes:[quote]};
test('only the explicitly selected, source-matched quotation leaves the analysis workspace',()=>{
 const out=witnessDraftFromQuote(doc,check,quote);
 assert.equal(out.quote,quote.quote);assert.equal(out.yearFrom,2025);assert.equal(out.claim,'');assert.equal(out.confirms,'');assert.equal(out.doesNotConfirm,'');
 assert.equal(out.consentPrivate,false);assert.equal(out.requestPublic,false);assert.equal(out.aiFlag,true);
 const raw=JSON.stringify(out);assert.doesNotMatch(raw,/PRIVATE PERSONAL|Private unrelated|private-person|possible legal issue|verified/);
});
test('a model flag does not set an event type or legal status',()=>{const out=witnessDraftFromQuote(doc,check,quote);assert.equal(out.kind,'other');assert.equal(out.institution,'other');assert.equal(out.role,'other');assert.equal('status' in out,false);});
test('unmatched, unselected and oversized quotations cannot be exported',()=>{
 assert.throws(()=>witnessDraftFromQuote(doc,check,{...quote,quote:'Something not in the decision'}),/QUOTE_NOT_CHECKED/);
 assert.throws(()=>witnessDraftFromQuote({...doc,pages:[]},check,quote),/QUOTE_NOT_IN_SOURCE/);
 assert.throws(()=>witnessDraftFromQuote(doc,check,{...quote,quote:'X'.repeat(2001)}),/SELECT_ONE_QUOTE/);
});
test('a future document date must be resolved instead of inventing an event year',()=>{assert.throws(()=>witnessDraftFromQuote({...doc,decisionDate:'2099-01-01'},check,quote),/CHECK_SOURCE_DATE/);});
