import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const requiredFiles = ['assets/journey/hero.js','assets/journey/hero.css','assets/journey/journey.js','assets/journey/frame-runtime.mjs','assets/journey/timeline.mjs','assets/journey/journey.css'];
const fail = message => { throw new Error('RELEASE_BLOCKED: '+message); };

// This gate validates measured, source-bound acceptance records. It does not
// turn browser emulation into a physical-device test or judge artistic quality.
export function validateAcceptance({manifestBytes, acceptance, proofs, now=Date.now(), allowSynthetic=false}) {
  const a=acceptance, digest=sha256(manifestBytes), manifest=JSON.parse(String(manifestBytes));
  if(!a||a.schema!==1||a.status!=='PASS')fail('acceptance is missing or not PASS');
  if(a.manifest_sha256!==digest)fail('acceptance belongs to different public source');
  if(!Array.isArray(a.blockers)||a.blockers.length)fail('known blocking failures remain');
  if(!Array.isArray(a.requirements)||!a.requirements.length||a.requirements.some(r=>!r.id||!r.source||!r.change||!Array.isArray(r.checks)||!r.checks.length))fail('requirement-to-change-to-check mapping missing');
  if(a.physical_iPhone_verified!==false)fail('this automated gate cannot certify a physical iPhone');
  if(!Array.isArray(a.proofs)||a.proofs.length<2)fail('Chromium and WebKit proof required');
  const seen=new Set();
  for(const ref of a.proofs){
    const wrapped=proofs[ref.file];
    if(!wrapped||sha256(wrapped.bytes)!==ref.sha256)fail('proof bytes missing or modified');
    const p=wrapped.data;
    if(!p||p.schema!==1||p.status!=='PASS'||p.file_overrides!==false)fail('browser proof is not an actual passing run');
    if(p.synthetic===true&&!allowSynthetic)fail('synthetic proof cannot approve production');
    if(!['chromium','webkit'].includes(p.engine))fail('unsupported browser proof');
    seen.add(p.engine);
    if(p.manifest_sha256!==digest)fail('browser proof belongs to different public source');
    const age=now-Date.parse(p.at);
    if(!Number.isFinite(age)||age< -300000||age>86400000)fail('browser proof is expired or has an invalid time');
    for(const f of requiredFiles)if(p.loaded_files?.[f]!==manifest[f]?.sha256)fail('loaded browser asset does not match candidate: '+f);
    if(!Array.isArray(p.geometry)||p.geometry.length<3||!p.geometry.some(g=>g.scrollY>=50))fail('dynamic scroll geometry not measured');
    for(const g of p.geometry){
      if(![g.hero_width,g.viewport_width,g.scale_x,g.scale_y].every(Number.isFinite)||g.viewport_width<=0||Math.abs(g.hero_width-g.viewport_width)>1||Math.abs(g.scale_x-1)>.001||Math.abs(g.scale_y-1)>.001)fail('entrance stretches outside the visual viewport');
    }
    if(p.viewport_resize_preserved!==true)fail('mobile browser-height changes unverified');
    const first=p.film_entry;
    if(!first||first.pending!==false||!Number.isFinite(first.nonblack_ratio)||first.nonblack_ratio<.05||!Number.isFinite(first.reference_mae)||first.reference_mae>5)fail('first film picture is blank, pending or does not match the source reference');
    if(first.evidence==='verified-rvfc'&&first.pts_matches!==true)fail('verified frame claim has no matching PTS');
    if(!Array.isArray(p.hops)||p.hops.length<2||p.hops.some(h=>h.pending!==false||h.media_error||h.picture_matches!==true))fail('film scene changes failed or were not visually checked');
    if(p.reverse_changed_picture!==true||p.stopped_picture_unchanged!==true)fail('reverse or stop control unverified');
    if(p.errors?.length)fail('browser errors remain');
  }
  if(!seen.has('chromium')||!seen.has('webkit'))fail('both real browser engines required');
  return {status:'PASS',manifest_sha256:digest,engines:[...seen],physical_iPhone_verified:false};
}

export async function assertReleaseAcceptance(root=process.cwd()) {
  let a, manifestBytes;
  try{manifestBytes=await readFile(path.join(root,'PUBLIC-SHA256.json'));a=JSON.parse(await readFile(path.join(root,'RELEASE-ACCEPTANCE.json'),'utf8'))}catch{fail('RELEASE-ACCEPTANCE.json or public source manifest missing')}
  const proofs={};
  for(const ref of a.proofs||[]){
    if(!/^release-evidence\/[a-zA-Z0-9._-]+\.json$/.test(ref.file))fail('unsafe proof path');
    let bytes;try{bytes=await readFile(path.join(root,ref.file))}catch{fail('proof file missing: '+ref.file)}
    try{proofs[ref.file]={bytes,data:JSON.parse(String(bytes))}}catch{fail('proof is not valid JSON')}
  }
  const result=validateAcceptance({manifestBytes,acceptance:a,proofs,allowSynthetic:false});
  console.log(JSON.stringify({releaseAcceptance:result}));return result;
}
