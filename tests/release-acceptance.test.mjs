import test from 'node:test';
import assert from 'node:assert/strict';
import {validateAcceptance,sha256} from '../tools/release-acceptance.mjs';
const at='2026-11-17T06:00:00Z',now=Date.parse(at)+1000;
function fixture(){
  const files=['hero.js','hero.css','journey.js','frame-runtime.mjs','timeline.mjs','journey.css'];
  const m=Object.fromEntries(files.map(f=>['assets/journey/'+f,{sha256:sha256(f),bytes:f.length}])),manifestBytes=Buffer.from(JSON.stringify(m)),digest=sha256(manifestBytes),proofs={};
  const a={schema:1,status:'PASS',manifest_sha256:digest,blockers:[],physical_iPhone_verified:false,requirements:[{id:'regression',source:'synthetic unit fixture',change:'fixture only',checks:['mobile'] }],proofs:[]};
  for(const engine of ['chromium','webkit']){
    const p={schema:1,status:'PASS',synthetic:true,engine,at,file_overrides:false,manifest_sha256:digest,loaded_files:Object.fromEntries(Object.entries(m).map(([k,v])=>[k,v.sha256])),geometry:[0,55,75].map(scrollY=>({scrollY,hero_width:390,viewport_width:390,scale_x:1,scale_y:1})),viewport_resize_preserved:true,film_entry:{pending:false,nonblack_ratio:.1695,reference_mae:.38,evidence:'verified-rvfc',pts_matches:true},hops:[{pending:false,picture_matches:true},{pending:false,picture_matches:true}],reverse_changed_picture:true,stopped_picture_unchanged:true,errors:[]};
    const file='release-evidence/'+engine+'.json',bytes=Buffer.from(JSON.stringify(p));proofs[file]={data:p,bytes};a.proofs.push({file,sha256:sha256(bytes)});
  }
  return {manifestBytes,acceptance:a,proofs,now,allowSynthetic:true};
}
function mutate(change){const f=fixture();change(f);for(const ref of f.acceptance.proofs){const p=f.proofs[ref.file];p.bytes=Buffer.from(JSON.stringify(p.data));ref.sha256=sha256(p.bytes)}return f}
test('synthetic successful unit fixture validates only with explicit test allowance',()=>assert.equal(validateAcceptance(fixture()).status,'PASS'));
test('synthetic evidence cannot authorize production',()=>assert.throws(()=>validateAcceptance({...fixture(),allowSynthetic:false}),/synthetic/));
test('missing acceptance blocks',()=>assert.throws(()=>validateAcceptance({...fixture(),acceptance:null}),/missing/));
test('BLOCKED state blocks',()=>assert.throws(()=>validateAcceptance(mutate(f=>f.acceptance.status='BLOCKED')),/not PASS/));
test('known WebKit incident cannot be waved through',()=>assert.throws(()=>validateAcceptance(mutate(f=>f.acceptance.blockers=['black first frame'])),/blocking/));
test('changed public source invalidates earlier approval',()=>assert.throws(()=>validateAcceptance({...fixture(),manifestBytes:Buffer.from('{}')}),/different public source/));
test('missing WebKit blocks',()=>assert.throws(()=>validateAcceptance(mutate(f=>f.acceptance.proofs.pop())),/proof required/));
test('modified evidence bytes block',()=>{const f=fixture();f.proofs[f.acceptance.proofs[0].file].bytes=Buffer.from('{}');assert.throws(()=>validateAcceptance(f),/modified/)});
test('stale test blocks',()=>assert.throws(()=>validateAcceptance({...fixture(),now:now+86400001}),/expired/));
test('overridden source cannot approve real UI',()=>assert.throws(()=>validateAcceptance(mutate(f=>Object.values(f.proofs)[0].data.file_overrides=true)),/actual passing/));
test('old loaded JS blocks even if the report says PASS',()=>assert.throws(()=>validateAcceptance(mutate(f=>Object.values(f.proofs)[0].data.loaded_files['assets/journey/hero.js']='old')),/does not match/));
test('512px visual transform in a 390px viewport blocks',()=>assert.throws(()=>validateAcceptance(mutate(f=>Object.values(f.proofs)[0].data.geometry[1].hero_width=512)),/stretches/));
test('anisotropic distortion blocks without document overflow',()=>assert.throws(()=>validateAcceptance(mutate(f=>Object.values(f.proofs)[0].data.geometry[1].scale_y=.657399)),/stretches/));
test('black first pixels block despite frame34 metadata',()=>assert.throws(()=>validateAcceptance(mutate(f=>Object.values(f.proofs)[1].data.film_entry.nonblack_ratio=0)),/blank/));
test('wrong source picture blocks despite positive luminance',()=>assert.throws(()=>validateAcceptance(mutate(f=>Object.values(f.proofs)[1].data.film_entry.reference_mae=22)),/source reference/));
test('unmatched PTS cannot be called verified',()=>assert.throws(()=>validateAcceptance(mutate(f=>Object.values(f.proofs)[1].data.film_entry.pts_matches=false)),/matching PTS/));
test('pending navigation cannot pass',()=>assert.throws(()=>validateAcceptance(mutate(f=>Object.values(f.proofs)[1].data.hops[0].pending=true)),/scene changes/));
test('physical iPhone claim cannot be created from engine emulation',()=>assert.throws(()=>validateAcceptance(mutate(f=>f.acceptance.physical_iPhone_verified=true)),/physical iPhone/));
