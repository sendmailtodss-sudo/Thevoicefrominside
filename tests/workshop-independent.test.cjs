'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../public/workshop-core.js');
const copy = x => JSON.parse(JSON.stringify(x));
const caseState = () => C.upsertRecord(C.createState(), 'cases', {id:'case-safe', title:'Synthetic source review', excerpt:'No real case data'});

test('hostile import cannot add unexpected state keys or prototype keys', () => {
  const original = C.serialize(caseState());
  for (const key of ['ownerToken', '__proto__', 'constructor', 'prototype']) {
    const json = original.slice(0,-1) + ',"' + key + '":{"polluted":true}}';
    assert.doesNotThrow(() => JSON.parse(json), 'test must contain syntactically valid JSON');
    assert.throws(() => C.parse(json), key);
  }
  assert.equal({}.polluted, undefined);
});

test('schema errors at a nested record leave the previously working state untouched', () => {
  const state = caseState(), before = C.serialize(state), invalid = copy(state);
  invalid.cases[0].caseOwnerEmail = 'synthetic@example.invalid';
  assert.throws(() => C.parse(JSON.stringify(invalid)));
  assert.equal(C.serialize(state), before);
});

test('wrong version and oversized source are rejected before becoming a workspace', () => {
  const state = C.createState(); state.version = 999;
  assert.throws(() => C.parse(JSON.stringify(state)));
  assert.throws(() => C.parse(' '.repeat(2 * 1024 * 1024 + 1)));
});

test('globally duplicated record ids cannot enter through file import', () => {
  const state = C.upsertRecord(caseState(), 'questions', {id:'question-safe',question:'Synthetic question'});
  state.questions[0].id = state.cases[0].id;
  assert.throws(() => C.parse(JSON.stringify(state)));
});

test('record arrays and primitive fields cannot be replaced with objects or coercible values', () => {
  const state = caseState();
  for (const mutate of [s=>s.cases={},s=>s.cases[0].title={toString:'hidden'},s=>s.art.price='1000',s=>s.event.consent='false']) {
    const invalid=copy(state);mutate(invalid);
    assert.throws(() => C.parse(JSON.stringify(invalid)));
  }
});

test('malicious HTML remains literal text throughout JSON roundtrip', () => {
  const payload='<img src=x onerror="globalThis.pwned=true"><script>bad()</script>';
  const state=C.upsertRecord(C.createState(),'cases',{id:'literal',title:payload});
  const imported=C.parse(C.serialize(state));
  assert.equal(imported.cases[0].title,payload);
  assert.equal(globalThis.pwned,undefined);
});

test('changing or withdrawing one local vote cannot create duplicate participants', () => {
  let state=C.upsertRecord(C.createState(),'proposals',{id:'p1',title:'Synthetic proposal',change:'Explain the criteria.'});
  state=C.vote(state,'p1','support');
  state=C.vote(state,'p1','against');
  assert.equal(state.proposals.length,1);
  assert.equal(state.proposals[0].vote,'against');
  state=C.vote(state,'p1',null);
  assert.equal(state.proposals[0].vote,null);
  assert.throws(()=>C.vote(state,'p1','abstain-and-count'));
  assert.throws(()=>C.vote(state,'missing','support'));
});

test('content edits reset local moderation so old approval cannot cover changed text', () => {
  let state=C.upsertRecord(C.createState(),'messages',{id:'m1',alias:'Demo artist',body:'Synthetic body',room:'open'});
  state=C.moderate(state,'m1','approved','Reviewed example');
  assert.equal(state.messages[0].status,'approved');
  state=C.upsertRecord(state,'messages',{id:'m1',body:'Changed synthetic body'});
  assert.equal(state.messages[0].status,'pending');
});

test('rejected moderation needs a reason; appeal can be preserved in exported work', () => {
  let state=C.upsertRecord(C.createState(),'messages',{id:'m2',alias:'Example',body:'Synthetic body',room:'support'});
  assert.throws(()=>C.moderate(state,'m2','rejected',''));
  state=C.moderate(state,'m2','rejected','Synthetic missing permission');
  state=C.upsertRecord(state,'messages',{id:'m2',appeal:'Please review the corrected permission note.'});
  const imported=C.parse(C.serialize(state));
  assert.match(imported.messages[0].appeal,/corrected permission/);
});

test('financial result allocates the full positive net exactly in ore', () => {
  const base=C.createState().art;
  for (const price of [0.01,9.99,1000,999999.99]) {
    for (const platformPercent of [0,12.5,33.33,100]) {
      const r=C.calculateArt({...base,price,production:0,taxReserve:0,platformPercent,quantity:3});
      assert.equal(r.artistOre+r.platformOre,r.netOre);
      for(const k of ['priceOre','productionOre','taxReserveOre','netOre','artistOre','platformOre'])assert.equal(Number.isSafeInteger(r[k]),true,k);
    }
  }
});

test('loss-making sales model does not report positive artist or platform proceeds', () => {
  const r=C.calculateArt({...C.createState().art,price:100,production:90,taxReserve:20,quantity:2});
  assert.equal(r.viable,false);
  assert.ok(r.netOre<0);
  assert.equal(r.artistOre,0);assert.equal(r.platformOre,0);
});

test('finance rejects nonfinite and invalid amounts instead of silently coercing them', () => {
  for (const patch of [{price:NaN},{price:Infinity},{production:-1},{taxReserve:-1},{platformPercent:101},{quantity:0},{quantity:1.5},{price:'100'}]) {
    assert.throws(()=>C.calculateArt({...C.createState().art,...patch}),JSON.stringify(patch));
  }
});

test('empty workspace has zero real draft counts and no invented totals', () => {
  const state=C.createState();
  for(const key of ['cases','proposals','messages','questions','logs'])assert.deepEqual(state[key],[]);
  const result=C.summarize(state);
  assert.equal(typeof result,'object');
  assert.equal(JSON.stringify(result).includes('participant'),false);
});

test('all working sections survive export/import without losing quoted source text', () => {
  let state=caseState();
  state=C.upsertRecord(state,'proposals',{id:'p2',title:'Demo',change:'Improve access'});
  state=C.upsertRecord(state,'questions',{id:'q2',guest:'Fictional guest',question:'What would improve clarity?'});
  state=C.upsertRecord(state,'logs',{id:'l2',error:'Synthetic timeout',url:'https://example.invalid/'});
  state=C.updateSettings(state,'prompt',{task:'sources',body:'A synthetic example',sources:'Document A page 2',goal:'Separate facts and opinion'});
  state=C.updateSettings(state,'event',{title:'Synthetic interview',guest:'Fictional guest',consent:true});
  assert.deepEqual(C.parse(C.serialize(state)),state);
  assert.match(C.buildPrompt(state.prompt,'en'),/Document A page 2/);
});
