import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LIMITS,BACKUP_MAX_BYTES,defaultMeta,emptyProject,normalizeMeta,validateProject,mixAudio,encodeWav,demoBeat,makeBackup,readBackup} from '../public/verksted/rapstudio/core.mjs';
import {dictionaries} from '../public/verksted/rapstudio/i18n.mjs';
const meta=()=>({...defaultMeta(),beatGain:1,voiceGain:1,beatRights:true});
const track=(values,rate=8000)=>({sampleRate:rate,channels:[new Float32Array(values)]});
const close=(actual,wanted)=>assert.ok(Math.abs(actual-wanted)<1e-6,`${actual} differs from ${wanted}`);
test('The voice offset inserts silence, crops negative starts and preserves the beat timeline',()=>{
 const beat=track(Array(16).fill(.2)),voice=track(Array(8).fill(.3));
 const delayed=mixAudio({beat,voice},{...meta(),voiceOffset:4/8000},8000);
 assert.equal(delayed.channels[0].length,16);close(delayed.channels[0][3],.2);close(delayed.channels[0][4],.5);close(delayed.channels[0][11],.5);close(delayed.channels[0][12],.2);
 const cropped=mixAudio({beat:null,voice:track([.1,.2,.3,.4,.5,.6,.7,.8])},{...meta(),voiceOffset:-4/8000},8000);
 assert.equal(cropped.channels[0].length,4);close(cropped.channels[0][0],.5);close(cropped.channels[0][3],.8);
});
test('Resampling interpolates actual samples; mono voice reaches both stereo channels',()=>{
 const resampled=mixAudio({beat:track([0,.4,.8,0]),voice:null},meta(),16000);assert.equal(resampled.channels[0].length,8);close(resampled.channels[0][1],.2);close(resampled.channels[0][3],.6);
 const beat={sampleRate:8000,channels:[new Float32Array([.1,.1]),new Float32Array([.2,.2])]},voice=track([.3,.3]);
 const mixed=mixAudio({beat,voice},meta(),8000);close(mixed.channels[0][0],.4);close(mixed.channels[1][0],.5);
});
test('Peak protection preserves relative balance and never emits NaN after float overflow',()=>{
 const mixed=mixAudio({beat:track([.8,.4]),voice:track([.8,.4])},meta(),8000);
 assert.equal(mixed.normalized,true);close(mixed.peakBefore,1.6);close(mixed.channels[0][0],.98);close(mixed.channels[0][1],.49);
 assert.throws(()=>mixAudio({voice:track([3.4e38]),beat:null},{...meta(),voiceGain:1.5},8000),{code:'decodeFailed'});
 assert.throws(()=>mixAudio({voice:track([NaN]),beat:null},meta(),8000),{code:'decodeFailed'});
});
test('WAV bytes have correct duration, stereo interleave, signed PCM and RIFF lengths',()=>{
 const wav=encodeWav({sampleRate:8000,channels:[new Float32Array([-1,-.5,0,.5,1]),new Float32Array([1,.5,0,-.5,-1])]}),view=new DataView(wav.buffer),ascii=(at,n)=>new TextDecoder().decode(wav.slice(at,at+n));
 assert.equal(ascii(0,4),'RIFF');assert.equal(ascii(8,4),'WAVE');assert.equal(ascii(36,4),'data');assert.equal(view.getUint32(4,true),wav.length-8);assert.equal(view.getUint32(40,true),20);assert.equal(view.getUint16(22,true),2);assert.equal(view.getUint32(24,true),8000);assert.equal(view.getUint32(28,true),32000);assert.equal(view.getUint16(34,true),16);
 assert.deepEqual(Array.from({length:10},(_,i)=>view.getInt16(44+i*2,true)),[-32768,32767,-16384,16384,0,0,16384,-16384,32767,-32768]);
});
test('Invalid metadata, durations and empty mixes are rejected without changing source samples',()=>{
 assert.throws(()=>normalizeMeta({...meta(),voiceOffset:Infinity}));assert.throws(()=>normalizeMeta({...meta(),voiceGain:1.51}));assert.throws(()=>normalizeMeta({...meta(),notes:'x'.repeat(12001)}));assert.throws(()=>normalizeMeta({...meta(),unexpected:true}));
 assert.throws(()=>mixAudio({beat:null,voice:null},meta()),{code:'needAudio'});
 const voice=track(new Float32Array(8001)),before=voice.channels[0].slice();assert.throws(()=>mixAudio({beat:null,voice},{...meta(),voiceOffset:180}),{code:'mixTooLong'});assert.deepEqual(voice.channels[0],before);
});
test('The original demo renders reproducible, non-silent audio and a decodable WAV structure',()=>{
 const a=demoBeat(),b=demoBeat();assert.deepEqual(a.channels,b.channels);assert.ok(a.channels[0].some(n=>Math.abs(n)>.1));assert.ok(a.channels[0].every(Number.isFinite));
 const wav=encodeWav(a);assert.equal(new DataView(wav.buffer).getUint32(40,true),a.channels[0].length*2);assert.ok(a.channels[0].length/a.sampleRate>10);
});
test('Backup roundtrip includes both original blobs and all editable project metadata',async()=>{
 const p=emptyProject();p.meta={...meta(),title:'Synthetic project',notes:'Test lines only',voiceOffset:.15};p.tracks.beat={name:'beat.wav',blob:new Blob([encodeWav(demoBeat())],{type:'audio/wav'})};p.tracks.voice={name:'voice.webm',blob:new Blob([new Uint8Array([3,1,4,1,5])],{type:'audio/webm;codecs=opus'})};
 const backup=await makeBackup(p),restored=await readBackup(backup);assert.deepEqual(restored.meta,p.meta);
 for(const kind of ['beat','voice']){assert.equal(restored.tracks[kind].name,p.tracks[kind].name);assert.equal(restored.tracks[kind].blob.type,p.tracks[kind].blob.type);assert.deepEqual(await restored.tracks[kind].blob.arrayBuffer(),await p.tracks[kind].blob.arrayBuffer());}
});
test('Every valid maximum-length Chinese or JSON-escaped note can still be backed up',async()=>{
 for(const notes of ['界'.repeat(LIMITS.notes),'\ud800'.repeat(LIMITS.notes),'\\'.repeat(LIMITS.notes)]){const p=emptyProject();p.meta.notes=notes;const backup=await makeBackup(validateProject(p));assert.equal((await readBackup(backup)).meta.notes,notes);}
});
test('Corruption, truncation, appended bytes, bad magic and oversized containers fail as a whole',async()=>{
 const p=emptyProject();p.tracks.voice={name:'test.wav',blob:new Blob([new Uint8Array([1,2,3,4])],{type:'audio/wav'})};const good=await makeBackup(p),bytes=new Uint8Array(await good.arrayBuffer()),bad=bytes.slice();bad[bad.length-1]^=1;
 for(const file of [new Blob([bad]),good.slice(0,good.size-1),new Blob([good,new Uint8Array([0])]),new Blob([new Uint8Array(20)])])await assert.rejects(readBackup(file),{code:'invalidBackup'});
 class HugeBlob extends Blob{get size(){return BACKUP_MAX_BYTES+1;}}await assert.rejects(readBackup(new HugeBlob()),{code:'invalidBackup'});
 assert.deepEqual(new Uint8Array(await p.tracks.voice.blob.arrayBuffer()),new Uint8Array([1,2,3,4]));assert.equal(p.meta.title,'');
});
test('All three interface dictionaries contain the same complete keys and placeholders',()=>{
 const keys=Object.keys(dictionaries.no).sort();for(const language of ['en','zh-Hans']){assert.deepEqual(Object.keys(dictionaries[language]).sort(),keys);for(const key of keys)assert.deepEqual(dictionaries[language][key].match(/\{\w+\}/g),dictionaries.no[key].match(/\{\w+\}/g));}
});
