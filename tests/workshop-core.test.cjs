'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../public/workshop-core.js');
const bad = (fn, code) => assert.throws(fn, error => error.code === code);

test('empty state is independent and export/import preserves every structured section', () => {
  let state = C.createState();
  state = C.upsertRecord(state, 'cases', {title:'A decision',source:'Document A',excerpt:'Exact words'});
  state = C.upsertRecord(state, 'proposals', {title:'A clearer rule',change:'Give reasons'});
  state = C.upsertRecord(state, 'messages', {alias:'Artist',body:'A local practice post'});
  state = C.upsertRecord(state, 'questions', {question:'What can be improved?'});
  state = C.upsertRecord(state, 'logs', {error:'An error message',datetime:'2026-11-01T09:25'});
  state = C.updateSettings(state, 'prompt', {body:'Text to inspect',sources:'Document A',goal:'Source table'});
  state = C.updateSettings(state, 'event', {title:'An interview',date:'2026-12-01',consent:true});
  const recovered = C.parse(C.serialize(state));
  assert.deepEqual(recovered,state);
  recovered.cases[0].title = 'Changed copy';
  assert.equal(state.cases[0].title,'A decision');
  assert.equal(C.createState().cases.length,0);
});

test('an invalid change or import leaves the prior working state intact', () => {
  const state = C.upsertRecord(C.createState(),'cases',{id:'case-a',title:'Keep this'});
  const before = C.serialize(state);
  bad(() => C.upsertRecord(state,'cases',{id:'case-a',title:''}),'REQUIRED_TEXT');
  bad(() => C.parse('{unfinished'),'INVALID_JSON');
  assert.equal(C.serialize(state),before);
});

test('editing a prepared case invalidates its local preparation marker', () => {
  let state = C.upsertRecord(C.createState(),'cases',{id:'case-a',title:'Case'});
  state = C.upsertRecord(state,'cases',{id:'case-a',status:'prepared'});
  assert.equal(C.summarize(state).preparedCases,1);
  state = C.upsertRecord(state,'cases',{id:'case-a',excerpt:'A new excerpt'});
  assert.equal(state.cases[0].status,'draft');
});

test('local proposal choice is one choice, replaceable and withdrawable', () => {
  let state = C.upsertRecord(C.createState(),'proposals',{id:'rule-a',title:'Rule',change:'Explain the decision'});
  const original = state;
  state = C.vote(state,'rule-a','support');
  state = C.vote(state,'rule-a','support');
  assert.equal(C.summarize(state).localChoices,1);
  assert.equal(original.proposals[0].vote,null);
  state = C.vote(state,'rule-a','against');
  assert.equal(state.proposals[0].vote,'against');
  state = C.vote(state,'rule-a',null);
  assert.equal(C.summarize(state).localChoices,0);
  bad(() => C.vote(state,'missing','support'),'NOT_FOUND');
});

test('changing proposal wording clears the choice on the old wording', () => {
  let state = C.upsertRecord(C.createState(),'proposals',{id:'rule-a',title:'Rule',change:'Original proposal'});
  state = C.vote(state,'rule-a','support');
  state = C.upsertRecord(state,'proposals',{id:'rule-a',change:'Different proposal'});
  assert.equal(state.proposals[0].vote,null);
  bad(() => C.upsertRecord(state,'proposals',{id:'rule-a',vote:'support'}),'USE_VOTE_ACTION');
});

test('moderation requires a reason for rejection and content edits reopen review', () => {
  let state = C.upsertRecord(C.createState(),'messages',{id:'post-a',alias:'Artist',body:'First wording'});
  bad(() => C.moderate(state,'post-a','rejected',' '),'REJECTION_REASON_REQUIRED');
  state = C.moderate(state,'post-a','rejected','Personal details require editing');
  state = C.upsertRecord(state,'messages',{id:'post-a',appeal:'Please review this reason'});
  assert.equal(state.messages[0].status,'rejected');
  assert.equal(state.messages[0].appeal,'Please review this reason');
  state = C.moderate(state,'post-a','approved','Local exercise');
  state = C.upsertRecord(state,'messages',{id:'post-a',body:'New wording'});
  assert.equal(state.messages[0].status,'pending');
  assert.equal(state.messages[0].reason,'');
  assert.equal(state.messages[0].appeal,'');
  bad(() => C.upsertRecord(state,'messages',{alias:'x',body:'y',status:'approved'}),'USE_MODERATION_ACTION');
});

test('question answers and interview consent cannot silently carry to changed content', () => {
  let state = C.upsertRecord(C.createState(),'questions',{id:'q-a',question:'First question'});
  bad(() => C.upsertRecord(state,'questions',{id:'q-a',status:'answered'}),'ANSWER_REQUIRED');
  state = C.upsertRecord(state,'questions',{id:'q-a',answer:'A draft response',status:'answered'});
  assert.equal(C.summarize(state).answeredQuestions,1);
  state = C.upsertRecord(state,'questions',{id:'q-a',question:'Different question'});
  assert.equal(state.questions[0].status,'queued');
  state = C.updateSettings(state,'event',{title:'First event',consent:true});
  state = C.updateSettings(state,'event',{title:'Different event'});
  assert.equal(state.event.consent,false);
});

test('financial model uses net after explicit costs and conserves every øre', () => {
  const result = C.calculateArt({price:1000,production:275.25,taxReserve:100,platformPercent:12.5});
  assert.equal(result.netOre,62475);
  assert.equal(result.platformOre,7809);
  assert.equal(result.artistOre,54666);
  assert.equal(result.artistOre+result.platformOre+result.productionOre+result.taxReserveOre,result.priceOre);
  assert.equal(result.viable,true);
});

test('zero, single-øre, full-platform and negative-margin cases remain explicit', () => {
  assert.equal(C.calculateArt({price:0}).artistOre,0);
  assert.equal(C.calculateArt({price:0.01,platformPercent:50}).platformOre,1);
  assert.equal(C.calculateArt({price:12.34,platformPercent:100}).artistOre,0);
  const loss = C.calculateArt({price:100,production:101,taxReserve:20});
  assert.deepEqual([loss.netOre,loss.artistOre,loss.platformOre,loss.viable],[-2100,0,0,false]);
});

test('financial input rejects non-finite, fractional øre, invalid quantities and percentage ranges', () => {
  for (const price of [NaN,Infinity,-1,'100',1000001]) bad(() => C.calculateArt({price}),'INVALID_AMOUNT');
  bad(() => C.calculateArt({price:1.001}),'AMOUNT_PRECISION');
  bad(() => C.calculateArt({platformPercent:100.01}),'INVALID_AMOUNT');
  for (const quantity of [0,1.5,10001,'2']) bad(() => C.calculateArt({quantity}),'INVALID_QUANTITY');
});

test('unknown and prototype-shaped fields fail at every import level', () => {
  for (const mutate of [
    s => {s.extra='x';},
    s => {s.art.accountNumber='123';},
    s => {s.prompt.externalModel='x';},
    s => {s.cases=[{id:'c',title:'x',...JSON.parse('{"__proto__":{"polluted":true}}')}];}
  ]) { const state=C.createState();mutate(state);bad(() => C.parse(JSON.stringify(state)),'UNKNOWN_FIELD'); }
  const state=C.createState();state.version=2;bad(() => C.parse(JSON.stringify(state)),'UNSUPPORTED_VERSION');
  assert.equal({}.polluted,undefined);
});

test('duplicate IDs, missing fields, holes and collection limits are rejected', () => {
  let state=C.upsertRecord(C.createState(),'cases',{id:'same',title:'Case'});
  bad(() => C.upsertRecord(state,'logs',{id:'same',error:'Network error'}),'DUPLICATE_ID');
  const missing=C.createState();delete missing.prompt;bad(() => C.parse(JSON.stringify(missing)),'MISSING_FIELD');
  const sparse=C.createState();sparse.logs.length=1;bad(() => C.serialize(sparse),'INVALID_ARRAY');
  for(let i=1;i<50;i++)state=C.upsertRecord(state,'cases',{id:'c-'+i,title:'Case '+i});
  bad(() => C.upsertRecord(state,'cases',{title:'Too many'}),'RECORD_LIMIT');
  assert.equal(state.cases.length,50);
});

test('calendar dates and local clock values are validated without assigning a timezone', () => {
  let state=C.upsertRecord(C.createState(),'cases',{title:'Leap year',date:'2024-02-29'});
  assert.equal(state.cases[0].date,'2024-02-29');
  for(const date of ['2025-02-29','2026-13-01','2026-04-31','0000-01-01'])bad(() => C.upsertRecord(state,'cases',{title:'Bad date',date}),'INVALID_DATE');
  bad(() => C.upsertRecord(state,'logs',{error:'x',datetime:'2026-11-01T25:00'}),'INVALID_DATE');
});

test('deletion is explicit and does not mutate the earlier state', () => {
  const before=C.upsertRecord(C.createState(),'logs',{id:'log-a',error:'Example failure'});
  const after=C.deleteRecord(before,'logs','log-a');
  assert.equal(before.logs.length,1);assert.equal(after.logs.length,0);
  bad(() => C.deleteRecord(after,'logs','log-a'),'NOT_FOUND');
});

test('untrusted text stays literal in drafts and prompts are clearly unexecuted', () => {
  const body='<img src=x onerror="alert(1)">';
  const state=C.upsertRecord(C.createState(),'messages',{alias:'Test',body});
  assert.equal(C.parse(C.serialize(state)).messages[0].body,body);
  const prompt=C.buildPrompt({task:'sources',body,sources:'Document 1',goal:'A table'},'en');
  assert.match(prompt,/not instructions/);assert.match(prompt,/has not run an AI model/);assert.ok(prompt.includes(body));
});

test('input size and accessors are rejected before executing or parsing them', () => {
  bad(() => C.parse(' '.repeat(C.MAX_FILE_BYTES+1)),'FILE_TOO_LARGE');
  let called=false;const item={title:'Normal'};Object.defineProperty(item,'source',{enumerable:true,get(){called=true;return 'unexpected';}});
  bad(() => C.upsertRecord(C.createState(),'cases',item),'INVALID_OBJECT');assert.equal(called,false);
});
