'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {webcrypto}=require('node:crypto');
const Core=require('../public/workshop-core.js');
const Backup=require('../public/workshop-backup.js');
const password='A long local password æøå';
const rejects=(promise,code)=>assert.rejects(promise,error=>error.code===code);
const fixture=(async()=>{
  let state=Core.upsertRecord(Core.createState(),'cases',{title:'Kilder og belegg — عربي',experience:'Blåbær 🕊️',excerpt:'Eksakt ordlyd\nmed ny linje'});
  state=Core.updateSettings(state,'art',{title:'Et verk',artist:'Kunstner',license:'Beholder opphavsretten'});
  const raw=Core.serialize(state);
  return {state,raw,envelope:await Backup.encrypt(raw,password)};
})();

test('Unicode state roundtrips with fixed modern algorithms and bounded fields',async()=>{
  const {raw,envelope}=await fixture;
  const data=JSON.parse(envelope);
  assert.deepEqual(Object.keys(data),['format','version','algorithm','kdf','iterations','salt','iv','ciphertext']);
  assert.equal(data.format,Backup.FORMAT);assert.equal(data.version,1);
  assert.equal(data.algorithm,'AES-GCM-256');assert.equal(data.kdf,'PBKDF2-SHA256');assert.equal(data.iterations,600000);
  assert.equal(Buffer.from(data.salt,'base64').length,16);assert.equal(Buffer.from(data.iv,'base64').length,12);
  assert.equal(await Backup.decrypt(envelope,password),raw);
  assert.equal(Backup.isEncryptedEnvelope(envelope),true);
  assert.ok(!envelope.includes('Blåbær'));assert.ok(!envelope.includes(password));
});

test('encrypting the same work twice uses fresh salt, IV and authenticated ciphertext',async()=>{
  const {raw,envelope}=await fixture;
  const second=JSON.parse(await Backup.encrypt(raw,password)),first=JSON.parse(envelope);
  for(const key of ['salt','iv','ciphertext'])assert.notEqual(first[key],second[key]);
});

test('wrong passwords and ciphertext, salt or IV changes share the same error',async()=>{
  const {envelope}=await fixture;
  await rejects(Backup.decrypt(envelope,'Another long password'),'DECRYPT_FAILED');
  for(const field of ['salt','iv','ciphertext']) {
    const data=JSON.parse(envelope),bytes=Buffer.from(data[field],'base64');bytes[0]^=1;data[field]=bytes.toString('base64');
    await rejects(Backup.decrypt(JSON.stringify(data),password),'DECRYPT_FAILED');
  }
});

test('header changes never select attacker algorithms, versions or work factors',async()=>{
  const {envelope}=await fixture;
  for(const [field,value]of[['format','other-backup'],['version',2],['version','1'],['algorithm','AES-CBC'],['kdf','PBKDF2-SHA1'],['iterations',1],['iterations',600001],['iterations',1e12],['iterations','600000']]) {
    const data=JSON.parse(envelope);data[field]=value;
    await rejects(Backup.decrypt(JSON.stringify(data),password),'UNSUPPORTED_FORMAT');
  }
});

test('schema, field types, canonical base64 and binary lengths are strict',async()=>{
  const {envelope}=await fixture;
  for(const alter of [
    x=>{x.extra='data';},x=>{delete x.iv;},x=>{x.salt=null;},x=>{x.iv=[];},x=>{x.ciphertext=1;},
    x=>{x.salt=Buffer.alloc(15).toString('base64');},x=>{x.iv=Buffer.alloc(13).toString('base64');},
    x=>{x.ciphertext=Buffer.alloc(15).toString('base64');},x=>{x.salt=x.salt.replace(/=+$/,'');},
    x=>{x.iv=' '+x.iv;},x=>{x.ciphertext=x.ciphertext.replace(/.$/,'_');},
    x=>{x.salt='AAAAAAAAAAAAAAAAAAAAAB==';},x=>{x.iv={toString:'not bytes'};}
  ]) {const data=JSON.parse(envelope);alter(data);await rejects(Backup.decrypt(JSON.stringify(data),password),'INVALID_ENVELOPE');}
  await rejects(Backup.decrypt(envelope.replace('{','{"version":1,'),password),'INVALID_ENVELOPE');
  await rejects(Backup.decrypt(envelope.replace('{','{"\\u0076ersion":1,'),password),'INVALID_ENVELOPE');
  await rejects(Backup.decrypt(envelope.replace('{','{"__proto__":{},'),password),'INVALID_ENVELOPE');
  assert.equal({}.polluted,undefined);
});

test('oversized and invalid envelopes are rejected before key derivation',async()=>{
  const {envelope}=await fixture;
  let imports=0;
  const context={WorkshopCore:Core,TextEncoder,TextDecoder,Uint8Array,Buffer,crypto:{getRandomValues:()=>{},subtle:{importKey:async()=>{imports++;throw Error('must not run');}}}};
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/workshop-backup.js'),'utf8'),context);
  const api=context.WorkshopBackup;
  const excessive=JSON.parse(envelope);excessive.ciphertext=Buffer.alloc(Backup.MAX_PLAINTEXT_BYTES+17).toString('base64');
  await rejects(api.decrypt(JSON.stringify(excessive),password),'INVALID_ENVELOPE');
  await rejects(api.decrypt(' '.repeat(Backup.MAX_FILE_BYTES+1),password),'FILE_TOO_LARGE');
  const badKdf=JSON.parse(envelope);badKdf.iterations=Number.MAX_SAFE_INTEGER;
  await rejects(api.decrypt(JSON.stringify(badKdf),password),'UNSUPPORTED_FORMAT');
  assert.equal(imports,0);
});

test('password limits are Unicode character counts and never trim or normalize',async()=>{
  const {raw,envelope}=await fixture;
  for(const pass of ['',null,123,'x'.repeat(11),'x'.repeat(1025),'\uD800'+'x'.repeat(12)]) {
    await rejects(Backup.encrypt(raw,pass),'INVALID_PASSPHRASE');
    await rejects(Backup.decrypt(envelope,pass),'INVALID_PASSPHRASE');
  }
  const unicodePass='🦉'.repeat(12),unicode=await Backup.encrypt(raw,unicodePass);
  assert.equal(await Backup.decrypt(unicode,unicodePass),raw);
  const spaces='  Twelve chars plus spaces  ',spaced=await Backup.encrypt(raw,spaces);
  await rejects(Backup.decrypt(spaced,spaces.trim()),'DECRYPT_FAILED');
  const decomposed='e\u0301'.repeat(12),composed=decomposed.normalize('NFC');
  const original=await Backup.encrypt(raw,decomposed);
  await rejects(Backup.decrypt(original,composed),'DECRYPT_FAILED');
});

test('only validated core data is encrypted; malformed and oversized plaintext is rejected',async()=>{
  await rejects(Backup.encrypt('{bad json',password),'INVALID_PLAINTEXT');
  await rejects(Backup.encrypt(JSON.stringify({version:1,secret:'not a workspace'}),password),'INVALID_PLAINTEXT');
  await rejects(Backup.encrypt(' '.repeat(Backup.MAX_PLAINTEXT_BYTES+1),password),'FILE_TOO_LARGE');
});

test('authenticated but semantically invalid plaintext is not restored',async()=>{
  const salt=webcrypto.getRandomValues(new Uint8Array(16)),iv=webcrypto.getRandomValues(new Uint8Array(12));
  const material=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);
  const key=await webcrypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:600000,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt']);
  const ciphertext=await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('StemmenWorkshopBackup|v1|PBKDF2-SHA256|600000|AES-GCM-256'),tagLength:128},key,new TextEncoder().encode('{"version":1,"cases":[]}'));
  const data={format:Backup.FORMAT,version:1,algorithm:'AES-GCM-256',kdf:'PBKDF2-SHA256',iterations:600000,salt:Buffer.from(salt).toString('base64'),iv:Buffer.from(iv).toString('base64'),ciphertext:Buffer.from(ciphertext).toString('base64')};
  await rejects(Backup.decrypt(JSON.stringify(data),password),'DECRYPT_FAILED');
});

test('a work copy is reusable and failed decryption leaves caller state unchanged',async()=>{
  const {raw,envelope}=await fixture;
  let current=Core.upsertRecord(Core.createState(),'logs',{error:'Keep this existing draft'});
  const before=Core.serialize(current);
  try {current=Core.parse(await Backup.decrypt(envelope,'Not the right password'));}catch(error){assert.equal(error.code,'DECRYPT_FAILED');}
  assert.equal(Core.serialize(current),before);
  assert.equal(await Backup.decrypt(envelope,password),raw);
  assert.equal(await Backup.decrypt(envelope,password),raw);
});

test('bounded format detection does not execute, throw or mislabel legacy core files',async()=>{
  const {raw,envelope}=await fixture;
  for(const input of [null,42,'{broken',raw,' '.repeat(Backup.MAX_FILE_BYTES+1),'[]'])assert.equal(Backup.isEncryptedEnvelope(input),false);
  const newer=JSON.parse(envelope);newer.version=2;
  assert.equal(Backup.isEncryptedEnvelope(JSON.stringify(newer)),true);
  await rejects(Backup.decrypt(JSON.stringify(newer),password),'UNSUPPORTED_FORMAT');
});
