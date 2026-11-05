/* Versioned local work files. No network or storage. All validation finishes before commit. */
export const RESUME_SCHEMA = 'maite-work-bundle-v1';
export const MAX_RESUME_BYTES = 90 * 1024 * 1024;
const check = (ok,code='INVALID_WORK_BUNDLE') => { if(!ok)throw new Error(code); };
const obj=(x,keys)=>{check(x&&typeof x==='object'&&!Array.isArray(x));check(Object.keys(x).length===keys.length&&Object.keys(x).every(k=>keys.includes(k)));};
const text=(x,max,required=false)=>check(typeof x==='string'&&x.length<=max&&(!required||x.trim().length>0));
const integer=(x,min,max)=>check(Number.isSafeInteger(x)&&x>=min&&x<=max);
const array=(x,max)=>check(Array.isArray(x)&&x.length<=max);
const bool=x=>check(typeof x==='boolean');
const timestamp=x=>check(typeof x==='string'&&x.length<=30&&!Number.isNaN(Date.parse(x))&&/^\d{4}-\d{2}-\d{2}T/.test(x));
const ident=(x,prefix)=>check(typeof x==='string'&&new RegExp('^'+prefix+'-[0-9a-f-]{36}$','i').test(x));
const unique=(items,key='id')=>check(new Set(items.map(x=>x[key])).size===items.length);
const date=x=>check(x===null||(typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x));
export function encodeBytes(bytes){let out='';for(let i=0;i<bytes.length;i+=24576)out+=btoa(String.fromCharCode(...bytes.subarray(i,i+24576)));return out;}
function decodeBytes(value){text(value,20*1024*1024);check(value.length%4===0&&/^[A-Za-z0-9+/]*={0,2}$/.test(value));const bytes=Uint8Array.from(atob(value),x=>x.charCodeAt(0));check(encodeBytes(bytes)===value);return bytes;}
export async function validateWorkBundle(serialized,{version,hashBytes,safeLaw,metadata,authorities,categories,escalations,draftTypes,evidenceKinds}){
  text(serialized,MAX_RESUME_BYTES);check(new TextEncoder().encode(serialized).byteLength<=MAX_RESUME_BYTES,'WORK_BUNDLE_TOO_LARGE');
  let bundle;try{bundle=JSON.parse(serialized,(key,value)=>{check(!['__proto__','constructor','prototype'].includes(key),'UNSAFE_WORK_BUNDLE');return value;});}catch(error){if(error.message==='UNSAFE_WORK_BUNDLE')throw error;throw new Error('INVALID_WORK_BUNDLE');}
  obj(bundle,['kind','schema','engineVersion','createdAt','containsPotentialPersonalData','encrypted','case','originals']);
  check(bundle.kind==='private-maite-resumable-work'&&bundle.schema===RESUME_SCHEMA&&bundle.engineVersion===version,'UNSUPPORTED_WORK_BUNDLE_VERSION');
  check(bundle.containsPotentialPersonalData===true&&bundle.encrypted===false);timestamp(bundle.createdAt);
  const c=bundle.case;
  obj(c,['id','title','authority','version','createdAt','documents','events','issues','contradictions','laws','drafts','escalationFlags']);
  ident(c.id,'case');text(c.title,200,true);check(authorities.includes(c.authority));integer(c.version,1,1000000);timestamp(c.createdAt);
  obj(c.escalationFlags,escalations);Object.values(c.escalationFlags).forEach(bool);
  array(c.documents,30);unique(c.documents);unique(c.documents,'sha256');
  let currentLength=0,historyLength=0,totalBytes=0;
  for(const d of c.documents){
    obj(d,['id','name','mediaType','sha256','hashVerifiedAgainstBytes','byteLength','expectedPageCount','expectedPageCountKnown','metadata','pages','importedAt']);ident(d.id,'doc');text(d.name,300,true);
    check(['text/plain','text/markdown','application/pdf','image/png','image/jpeg','image/tiff','image/webp'].includes(d.mediaType));check(/^[a-f0-9]{64}$/.test(d.sha256));bool(d.hashVerifiedAgainstBytes);integer(d.byteLength,0,15*1024*1024);totalBytes+=d.byteLength;bool(d.expectedPageCountKnown);integer(d.expectedPageCount,1,1000);timestamp(d.importedAt);
    obj(d.metadata,['decisionDate','receivedDate','servedDate','deadlineDate','deadlineTime','receivedTime','servedTime','servedMethod','deadlineBasis','recipient']);const normalizedMetadata=metadata(d.metadata);check(Object.keys(d.metadata).every(k=>d.metadata[k]===normalizedMetadata[k]));
    array(d.pages,80);check(d.pages.length>0);unique(d.pages,'number');let extractedLength=0;
    for(const p of d.pages){
      obj(p,['number','extractedText','currentText','method','confidence','warnings','revision','reviewed','corrections']);integer(p.number,1,d.expectedPageCount);text(p.extractedText,160000);text(p.currentText,160000);extractedLength+=p.extractedText.length;currentLength+=p.currentText.length;
      check(['manual','native','ocr','embedded','pasted','text'].includes(p.method));check(p.confidence===null||(Number.isFinite(p.confidence)&&p.confidence>=0&&p.confidence<=100));array(p.warnings,30);p.warnings.forEach(w=>text(w,1000));bool(p.reviewed);integer(p.revision,1,41);array(p.corrections,40);check(p.revision===p.corrections.length+1);
      p.corrections.forEach((r,i)=>{obj(r,['fromRevision','toRevision','previousText','reason','at']);check(r.fromRevision===i+1&&r.toRevision===i+2);text(r.previousText,160000);historyLength+=r.previousText.length;text(r.reason,2000,true);timestamp(r.at);});
      check(p.corrections.length?p.corrections[0].previousText===p.extractedText:p.currentText===p.extractedText);
    }
    check(extractedLength<=500000);
  }
  check(currentLength<=2000000&&historyLength<=4000000&&totalBytes<=50*1024*1024);
  const refs=items=>{array(items,12);for(const r of items){obj(r,['documentId','page','revision','start','end','quote']);ident(r.documentId,'doc');integer(r.page,1,1000);integer(r.revision,1,41);integer(r.start,0,160000);integer(r.end,r.start+1,160000);text(r.quote,12000,true);check(r.end-r.start===r.quote.length);const d=c.documents.find(d=>d.id===r.documentId),p=d?.pages.find(p=>p.number===r.page);if(d){check(p&&r.revision<=p.revision);const source=r.revision===p.revision?p.currentText:p.corrections.find(x=>x.fromRevision===r.revision)?.previousText;check(typeof source==='string'&&source.slice(r.start,r.end)===r.quote,'FALSE_QUOTE');}}};
  array(c.events,300);unique(c.events);for(const e of c.events){obj(e,['id','date','kind','description','evidence']);ident(e.id,'event');date(e.date);check(evidenceKinds.includes(e.kind));text(e.description,6000,true);refs(e.evidence);check(e.kind!=='documented_text'||e.evidence.length>0);}
  array(c.laws,40);unique(c.laws);for(const l of c.laws){obj(l,['id','title','text','sourceUrl','validFrom','validUntil','checkedOn','verifiedBy','authorityTypes','digest','verification']);array(l.authorityTypes,authorities.length);text(l.sourceUrl,2000);safeLaw(l);check(l.verification==='human-attested-not-independently-verified-by-software');check(l.digest==='sha256:'+await hashBytes(new TextEncoder().encode(l.text)),'LAW_DIGEST_MISMATCH');}
  array(c.issues,100);unique(c.issues);for(const i of c.issues){obj(i,['id','category','title','reason','support','counterevidence','lawId','missingInformation']);ident(i.id,'issue');check(categories.has(i.category));text(i.title,300,true);text(i.reason,8000,true);refs(i.support);refs(i.counterevidence);check(i.lawId===null||c.laws.some(l=>l.id===i.lawId));array(i.missingInformation,30);i.missingInformation.forEach(x=>text(x,1000));}
  array(c.contradictions,100);unique(c.contradictions);for(const i of c.contradictions){obj(i,['id','description','left','right']);ident(i.id,'conflict');text(i.description,6000,true);refs(i.left);refs(i.right);check(i.left.length&&i.right.length);}
  array(c.drafts,50);unique(c.drafts);for(const d of c.drafts){obj(d,['id','type','documentId','text','recipient','caseRef','requestedChange','revision','materialVersion','status','review','createdAt']);ident(d.id,'draft');check(draftTypes.includes(d.type));check(d.documentId===null||typeof d.documentId==='string');if(d.documentId)ident(d.documentId,'doc');text(d.text,180000);for(const k of ['recipient','caseRef','requestedChange'])text(d[k],12000);integer(d.revision,1,1000000);integer(d.materialVersion,1,c.version);timestamp(d.createdAt);check(['draft','reviewed'].includes(d.status));if(d.status==='draft')check(d.review===null);else{obj(d.review,['reviewer','checkedAt','caseVersion','draftRevision','scope']);text(d.review.reviewer,200,true);timestamp(d.review.checkedAt);check(d.materialVersion===c.version&&d.review.caseVersion===c.version&&d.review.draftRevision===d.revision);check(d.review.scope==='Human review attestation only; not lawyer approval, verified legal deadline or submission.');check(c.documents.length&&c.documents.every(doc=>doc.expectedPageCountKnown&&doc.pages.length===doc.expectedPageCount&&doc.pages.every(p=>p.reviewed&&p.currentText.trim())));const annotations=[...c.events.map(e=>e.evidence),...c.issues.flatMap(i=>[i.support,i.counterevidence]),...c.contradictions.flatMap(i=>[i.left,i.right])].flat();check(annotations.every(r=>c.documents.some(doc=>doc.id===r.documentId&&doc.pages.some(p=>p.number===r.page&&p.revision===r.revision))));}}
  array(bundle.originals,30);unique(bundle.originals,'documentId');const originals=new Map();let bytesRead=0;
  for(const o of bundle.originals){obj(o,['documentId','base64']);const d=c.documents.find(d=>d.id===o.documentId);check(d&&d.hashVerifiedAgainstBytes);const bytes=decodeBytes(o.base64);bytesRead+=bytes.byteLength;check(bytes.byteLength===d.byteLength&&bytesRead<=50*1024*1024);check(await hashBytes(bytes)===d.sha256,'ORIGINAL_HASH_MISMATCH');originals.set(d.id,bytes);}
  check(c.documents.every(d=>d.hashVerifiedAgainstBytes?originals.has(d.id):d.byteLength===0));
  return {caseData:c,originals};
}
