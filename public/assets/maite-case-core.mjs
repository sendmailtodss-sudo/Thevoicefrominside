/* MAITE-derived private case workspace. No network, persistence, model calls or submission. */
import { reviewLocally, CATEGORIES, AUTHORITY_TYPES } from './study-core.mjs';
import { makeTranslator } from './maite-i18n.mjs';
import { RESUME_SCHEMA, MAX_RESUME_BYTES, encodeBytes, validateWorkBundle } from './maite-resume.mjs';
export const VERSION = 'maite-case-local-0.2.0';
export const DRAFT_TYPES = Object.freeze(['short_appeal', 'full_appeal', 'access_request', 'extension_request', 'lawyer_brief']);
export const EVIDENCE_KINDS = Object.freeze(['documented_text', 'user_account', 'hypothesis', 'missing_information']);
const dateKeys = ['decisionDate', 'receivedDate', 'servedDate', 'deadlineDate'];
const metaKeys = [...dateKeys, 'deadlineTime', 'receivedTime', 'servedTime', 'servedMethod', 'deadlineBasis', 'recipient'];
const categoryIds = new Set(CATEGORIES.map(c => c.id));
const escalationKeys = ['criminalStrategy', 'selfIncrimination', 'childCoercion', 'courtDeadline', 'immigration', 'largeCompensation', 'conflictOfInterest'];
const escalationLabels = {
  criminalStrategy:'Straffesaksstrategi krever kvalifisert bistand.', selfIncrimination:'Mulig selvinkriminering må vurderes før opplysninger sendes.',
  childCoercion:'Tvangssak om barn krever kvalifisert bistand.', courtDeadline:'En domstolsfrist må avklares med kvalifisert bistand straks.',
  immigration:'Utlendingssak kan kreve særskilt bistand.', largeCompensation:'Større erstatningskrav må vurderes av advokat.', conflictOfInterest:'Mulig interessekonflikt må avklares.'
};
const fail = code => { throw new Error(code); };
const assert = (condition, code) => { if (!condition) fail(code); };
const clone = value => structuredClone(value);
const id = prefix => prefix + '-' + crypto.randomUUID();
const str = (value, max = 10000) => { assert(typeof value === 'string' && value.length <= max, 'INVALID_TEXT'); return value; };
const clean = (value, max = 10000) => str(value ?? '', max).trim();
const osloDate = value => new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Oslo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
function isoDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10) === value;
}
function metadata(input = {}, previous = {}) {
  assert(input && typeof input === 'object' && !Array.isArray(input) && Object.keys(input).every(k => metaKeys.includes(k)), 'INVALID_METADATA');
  const next = { decisionDate:null, receivedDate:null, servedDate:null, deadlineDate:null, deadlineTime:null, receivedTime:null, servedTime:null, servedMethod:'', deadlineBasis:'', recipient:'', ...previous };
  for (const [key,value] of Object.entries(input)) {
    if (dateKeys.includes(key)) { assert(value === null || value === '' || isoDate(value), 'INVALID_DATE'); next[key] = value || null; }
    else if (['deadlineTime','receivedTime','servedTime'].includes(key)) { assert(value === null || value === '' || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value), 'INVALID_TIME'); next[key] = value || null; }
    else next[key] = clean(value, 3000);
  }
  return next;
}
export async function hashBytes(bytes) {
  assert(bytes instanceof Uint8Array || bytes instanceof ArrayBuffer, 'BYTES_REQUIRED');
  const copy = bytes instanceof Uint8Array ? new Uint8Array(bytes) : new Uint8Array(bytes.slice(0));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', copy))].map(x => x.toString(16).padStart(2,'0')).join('');
}
function safeLaw(input) {
  const law = clone(input);
  assert(law && typeof law === 'object' && typeof law.id === 'string' && /^[a-zA-Z0-9._-]{1,80}$/.test(law.id), 'INVALID_LAW');
  str(law.title,300); assert(clean(law.text,50000).length > 0, 'LAW_TEXT_REQUIRED');
  assert(isoDate(law.validFrom) && (law.validUntil === null || law.validUntil === undefined || isoDate(law.validUntil)), 'LAW_DATES_REQUIRED');
  assert(!law.validUntil || law.validUntil >= law.validFrom, 'LAW_DATE_ORDER');
  assert(isoDate(law.checkedOn) && clean(law.verifiedBy,200), 'LAW_REVIEW_PROVENANCE_REQUIRED');
  assert(Array.isArray(law.authorityTypes) && law.authorityTypes.length > 0 && law.authorityTypes.every(a => AUTHORITY_TYPES.includes(a)), 'LAW_SCOPE_REQUIRED');
  let url; try { url = new URL(law.sourceUrl); } catch { fail('INVALID_LAW_SOURCE'); }
  assert(url.protocol==='https:' && !url.username && !url.password && (!url.port || url.port==='443') && ['lovdata.no','www.lovdata.no','www.regjeringen.no','www.stortinget.no','www.kriminalomsorgen.no','www.helsedirektoratet.no','eur-lex.europa.eu'].includes(url.hostname),'UNAPPROVED_LAW_SOURCE');
  return {id:law.id,title:law.title,text:law.text,sourceUrl:law.sourceUrl,validFrom:law.validFrom,validUntil:law.validUntil||null,checkedOn:law.checkedOn,verifiedBy:law.verifiedBy,authorityTypes:law.authorityTypes,digest:law.digest||null,verification:'human-attested-not-independently-verified-by-software'};
}

export class CaseWorkspace {
  #cases = new Map();
  #originals = new Map();
  #clock;
  #t;
  constructor({now = () => new Date().toISOString(),language='nb'} = {}) { assert(typeof now==='function','INVALID_CLOCK'); this.#clock = now; this.#t=makeTranslator(language); }
  #get(handle) {
    assert(handle && typeof handle.caseId==='string' && typeof handle.capability==='string','CASE_ACCESS_DENIED');
    const entry=this.#cases.get(handle.caseId); assert(entry && entry.capability===handle.capability,'CASE_ACCESS_DENIED'); return entry.case;
  }
  #doc(c,documentId) { const d=c.documents.find(v=>v.id===documentId); assert(d,'DOCUMENT_NOT_IN_CASE'); return d; }
  #page(c,documentId,number) { const p=this.#doc(c,documentId).pages.find(v=>v.number===number); assert(p,'PAGE_NOT_FOUND'); return p; }
  #touch(c) { c.version++; for(const draft of c.drafts) { draft.status='draft'; draft.review=null; } }
  #evidence(c,ref) {
    assert(ref && typeof ref==='object' && typeof ref.documentId==='string' && Number.isInteger(ref.page),'INVALID_EVIDENCE');
    const page=this.#page(c,ref.documentId,ref.page);
    assert(ref.revision===page.revision,'STALE_EVIDENCE');
    assert(Number.isInteger(ref.start) && Number.isInteger(ref.end) && ref.start>=0 && ref.end>ref.start && ref.end<=page.currentText.length && ref.end-ref.start<=12000,'INVALID_EVIDENCE_SPAN');
    const quote=page.currentText.slice(ref.start,ref.end); assert(typeof ref.quote==='string' && ref.quote===quote,'FALSE_QUOTE');
    return {documentId:ref.documentId,page:ref.page,revision:ref.revision,start:ref.start,end:ref.end,quote};
  }
  #refs(c,refs,max=12) { assert(Array.isArray(refs) && refs.length<=max,'INVALID_EVIDENCE_LIST'); return refs.map(r=>this.#evidence(c,r)); }
  #refsValid(c,refs) { try { this.#refs(c,refs,24); return true; } catch { return false; } }
  #issueStatus(c,issue) {
    if (issue.missingInformation.length || !issue.support.length || !this.#refsValid(c,[...issue.support,...issue.counterevidence])) return 'unresolved';
    if (![...issue.support,...issue.counterevidence].every(ref=>this.#page(c,ref.documentId,ref.page).reviewed)) return 'unresolved';
    const law=c.laws.find(v=>v.id===issue.lawId);
    if (!law || !law.authorityTypes.includes(c.authority)) return 'unresolved';
    if (!issue.support.every(ref=>{const date=this.#doc(c,ref.documentId).metadata.decisionDate;return date && law.validFrom<=date && (!law.validUntil || law.validUntil>=date);})) return 'unresolved';
    return 'candidate_requires_human_legal_review';
  }
  createCase({title,authority='kriminalomsorg'}={}) {
    assert(clean(title,200).length>0,'CASE_TITLE_REQUIRED'); assert(AUTHORITY_TYPES.includes(authority),'UNKNOWN_AUTHORITY'); assert(this.#cases.size<20,'CASE_LIMIT');
    const caseId=id('case'), capability=id('cap');
    const c={id:caseId,title:clean(title,200),authority,version:1,createdAt:this.#clock(),documents:[],events:[],issues:[],contradictions:[],laws:[],drafts:[],escalationFlags:Object.fromEntries(escalationKeys.map(k=>[k,false]))};
    this.#cases.set(caseId,{capability,case:c});this.#originals.set(caseId,new Map()); return {caseId,capability};
  }
  readCase(handle) {
    const c=this.#get(handle), snapshot=clone(c);
    snapshot.events=snapshot.events.map(e=>({...e,evidenceValid:this.#refsValid(c,e.evidence)}));
    snapshot.issues=snapshot.issues.map(issue=>({...issue,status:this.#issueStatus(c,issue),evidenceValid:this.#refsValid(c,[...issue.support,...issue.counterevidence])}));
    snapshot.contradictions=snapshot.contradictions.map(v=>({...v,evidenceValid:this.#refsValid(c,[...v.left,...v.right])}));
    return snapshot;
  }
  async addDocument(handle,input) {
    const c=this.#get(handle);assert(input && typeof input==='object','INVALID_DOCUMENT');assert(c.documents.length<30,'DOCUMENT_LIMIT');
    const name=clean(input.name,300);assert(name,'DOCUMENT_NAME_REQUIRED');
    const types=['text/plain','text/markdown','application/pdf','image/png','image/jpeg','image/tiff','image/webp'];
    assert(types.includes(input.mediaType || 'text/plain'),'UNSUPPORTED_MEDIA_TYPE');
    assert(Array.isArray(input.pages) && input.pages.length>0 && input.pages.length<=80,'INVALID_PAGES');
    const seen=new Set();let textSize=0;
    const pages=input.pages.map(raw=>{
      assert(Number.isInteger(raw.number) && raw.number>0 && raw.number<=1000 && !seen.has(raw.number),'INVALID_PAGE_NUMBER');seen.add(raw.number);
      const text=str(raw.text ?? raw.extractedText ?? '',160000);textSize+=text.length;
      assert(['manual','native','ocr','embedded','pasted','text'].includes(raw.method||'manual'),'INVALID_EXTRACTION_METHOD');
      assert(raw.confidence===undefined || raw.confidence===null || (Number.isFinite(raw.confidence) && raw.confidence>=0 && raw.confidence<=100),'INVALID_OCR_CONFIDENCE');
      const warnings=(raw.warnings||[]);assert(Array.isArray(warnings)&&warnings.length<=30,'INVALID_EXTRACTION_WARNINGS');warnings.forEach(w=>str(w,1000));
      return {number:raw.number,extractedText:text,currentText:text,method:raw.method||'manual',confidence:raw.confidence??null,warnings:[...warnings],revision:1,reviewed:false,corrections:[]};
    }).sort((a,b)=>a.number-b.number);
    assert(textSize<=500000 && c.documents.reduce((sum,d)=>sum+d.pages.reduce((n,p)=>n+p.currentText.length,0),0)+textSize<=2000000,'CASE_TEXT_LIMIT');
    const expectedPageCountKnown=input.expectedPageCount!==undefined && input.expectedPageCount!==null;
    const expected=input.expectedPageCount ?? Math.max(...pages.map(p=>p.number));assert(Number.isInteger(expected)&&expected>0&&expected<=1000&&expected>=Math.max(...pages.map(p=>p.number)),'INVALID_PAGE_COUNT');
    let bytes=null,sha256=input.sha256?.replace(/^sha256:/,'') || null;
    if(sha256)assert(/^[a-f0-9]{64}$/.test(sha256),'INVALID_HASH');
    if(input.bytes!==undefined && input.bytes!==null) {
      assert(input.bytes instanceof Uint8Array||input.bytes instanceof ArrayBuffer,'BYTES_REQUIRED');
      bytes=new Uint8Array(input.bytes instanceof ArrayBuffer?input.bytes.slice(0):input.bytes);
      assert(bytes.byteLength<=15000000,'DOCUMENT_TOO_LARGE');
      assert(c.documents.reduce((sum,d)=>sum+d.byteLength,0)+bytes.byteLength<=50000000,'CASE_BYTE_LIMIT');
      const actual=await hashBytes(bytes); if(sha256)assert(actual===sha256,'ORIGINAL_HASH_MISMATCH');sha256=actual;
    }
    // Awaiting the digest must not resurrect a deleted case or bypass the current size budget.
    assert(this.#get(handle)===c,'CASE_ACCESS_DENIED');assert(c.documents.length<30,'DOCUMENT_LIMIT');
    assert(c.documents.reduce((sum,d)=>sum+d.pages.reduce((n,p)=>n+p.currentText.length,0),0)+textSize<=2000000,'CASE_TEXT_LIMIT');
    assert(c.documents.reduce((sum,d)=>sum+d.byteLength,0)+(bytes?.byteLength||0)<=50000000,'CASE_BYTE_LIMIT');
    assert(sha256,'ORIGINAL_HASH_REQUIRED');
    assert(!c.documents.some(d=>d.sha256===sha256),'DUPLICATE_ORIGINAL');
    const documentId=id('doc'); const d={id:documentId,name,mediaType:input.mediaType||'text/plain',sha256,hashVerifiedAgainstBytes:Boolean(bytes),byteLength:bytes?.byteLength||0,expectedPageCount:expected,expectedPageCountKnown,metadata:metadata(input.metadata),pages,importedAt:this.#clock()};
    c.documents.push(d);if(bytes)this.#originals.get(c.id).set(documentId,bytes);this.#touch(c);return documentId;
  }
  getOriginal(handle,documentId) { const c=this.#get(handle);this.#doc(c,documentId);const b=this.#originals.get(c.id).get(documentId);return b?new Uint8Array(b):null; }
  deleteDocument(handle,documentId) { const c=this.#get(handle);this.#doc(c,documentId);c.documents=c.documents.filter(d=>d.id!==documentId);this.#originals.get(c.id).delete(documentId);this.#touch(c);return {deleted:true,dependentAnnotationsRequireReview:true}; }
  setDocumentDates(handle,documentId,patch) { const c=this.#get(handle),d=this.#doc(c,documentId);d.metadata=metadata(patch,d.metadata);this.#touch(c);return clone(d.metadata); }
  setExpectedPageCount(handle,documentId,count) { const c=this.#get(handle),d=this.#doc(c,documentId);assert(Number.isInteger(count)&&count>=Math.max(...d.pages.map(p=>p.number))&&count<=1000,'INVALID_PAGE_COUNT');d.expectedPageCount=count;d.expectedPageCountKnown=true;this.#touch(c);return count; }
  reviewPage(handle,documentId,number,{text,reviewed=false,reason=''}={}) {
    const c=this.#get(handle),p=this.#page(c,documentId,number);str(text,160000);str(reason,2000);assert(typeof reviewed==='boolean','INVALID_REVIEW_FLAG');
    const total=c.documents.reduce((sum,d)=>sum+d.pages.reduce((n,v)=>n+v.currentText.length,0),0)-p.currentText.length+text.length;assert(total<=2000000,'CASE_TEXT_LIMIT');
    if(text!==p.currentText){assert(p.corrections.length<40,'PAGE_CORRECTION_LIMIT');assert(c.documents.reduce((sum,d)=>sum+d.pages.reduce((n,v)=>n+v.corrections.reduce((a,r)=>a+r.previousText.length,0),0),0)+p.currentText.length<=4000000,'CORRECTION_HISTORY_LIMIT');assert(clean(reason,2000),'CORRECTION_REASON_REQUIRED');p.corrections.push({fromRevision:p.revision,toRevision:p.revision+1,previousText:p.currentText,reason:reason.trim(),at:this.#clock()});p.currentText=text;p.revision++;}
    p.reviewed=reviewed;this.#touch(c);return clone(p);
  }
  makeEvidence(handle,{documentId,page,start,end,quote}={}) {
    const c=this.#get(handle),p=this.#page(c,documentId,page);
    return this.#evidence(c,{documentId,page,revision:p.revision,start,end,quote:quote===undefined?p.currentText.slice(start,end):quote});
  }
  addEvent(handle,{date=null,kind,description,evidence=[]}={}) {
    const c=this.#get(handle);assert(EVIDENCE_KINDS.includes(kind),'INVALID_EVIDENCE_KIND');assert(date===null||isoDate(date),'INVALID_DATE');assert(clean(description,6000),'DESCRIPTION_REQUIRED');
    const refs=this.#refs(c,evidence);assert(kind!=='documented_text'||refs.length>0,'DOCUMENTED_EVENT_NEEDS_EVIDENCE');assert(c.events.length<300,'EVENT_LIMIT');
    const event={id:id('event'),date,kind,description:description.trim(),evidence:refs};c.events.push(event);this.#touch(c);return event.id;
  }
  async addLaw(handle,input) {
    const c=this.#get(handle),law=safeLaw(input);assert(c.laws.length<40,'LAW_LIMIT');assert(!c.laws.some(l=>l.id===law.id),'LAW_ID_EXISTS');
    const digest='sha256:'+await hashBytes(new TextEncoder().encode(law.text));if(law.digest)assert(law.digest===digest,'LAW_DIGEST_MISMATCH');law.digest=digest;
    assert(this.#get(handle)===c,'CASE_ACCESS_DENIED');assert(c.laws.length<40 && !c.laws.some(l=>l.id===law.id),'LAW_ID_EXISTS');c.laws.push(law);this.#touch(c);return law.id;
  }
  addIssue(handle,{category,title,reason,support=[],counterevidence=[],lawId=null,missingInformation=[]}={}) {
    const c=this.#get(handle);assert(categoryIds.has(category),'INVALID_ISSUE_CATEGORY');assert(clean(title,300)&&clean(reason,8000),'ISSUE_EXPLANATION_REQUIRED');
    const refs=this.#refs(c,support),counter=this.#refs(c,counterevidence);assert(lawId===null||c.laws.some(v=>v.id===lawId),'LAW_NOT_IN_CASE');
    assert(Array.isArray(missingInformation)&&missingInformation.length<=30,'INVALID_MISSING_LIST');missingInformation.forEach(v=>str(v,1000));assert(c.issues.length<100,'ISSUE_LIMIT');
    const issue={id:id('issue'),category,title:title.trim(),reason:reason.trim(),support:refs,counterevidence:counter,lawId,missingInformation:[...missingInformation]};c.issues.push(issue);this.#touch(c);return issue.id;
  }
  addContradiction(handle,{description,left=[],right=[]}={}) {
    const c=this.#get(handle);assert(clean(description,6000),'DESCRIPTION_REQUIRED');const a=this.#refs(c,left),b=this.#refs(c,right);assert(a.length&&b.length,'TWO_SOURCES_REQUIRED');assert(c.contradictions.length<100,'CONTRADICTION_LIMIT');
    const item={id:id('conflict'),description:description.trim(),left:a,right:b};c.contradictions.push(item);this.#touch(c);return item.id;
  }
  setEscalation(handle,flags) {
    const c=this.#get(handle);assert(flags && typeof flags==='object' && Object.keys(flags).every(k=>escalationKeys.includes(k)&&typeof flags[k]==='boolean'),'INVALID_ESCALATION_FLAGS');c.escalationFlags={...c.escalationFlags,...flags};this.#touch(c);
  }
  analyze(handle,{today=osloDate(this.#clock())}={}) {
    const c=this.#get(handle);assert(isoDate(today),'INVALID_DATE');const missing=[],deadlines=[],candidates=[],chronology=[],escalation=[];
    const missingItem=(code,message,documentId=null,page=null)=>missing.push({code,message,documentId,page});
    if(!c.documents.length)missingItem('no_documents',this.#t('Ingen dokumenter er lagt til.'));
    for(const d of c.documents){
      const nums=new Set(d.pages.map(p=>p.number)),absent=Array.from({length:d.expectedPageCount},(_,i)=>i+1).filter(n=>!nums.has(n));
      if(!d.expectedPageCountKnown)missingItem('completeness_unknown',this.#t('Forventet sidetall er ikke oppgitt. Observerte sider beviser ikke at dokumentet er fullstendig.'),d.id);
      if(absent.length)missingItem('missing_pages',this.#t('Mangler oppgitte sider: ')+absent.join(', '),d.id);
      if(!d.hashVerifiedAgainstBytes)missingItem('unverified_hash',this.#t('Originalfilens hash er oppgitt, men ikke kontrollert mot originalbytes i dette arbeidsrommet.'),d.id);
      if(!d.metadata.receivedDate)missingItem('unknown_receipt',this.#t('Faktisk mottaksdato er ukjent. Kontroller underretning og eventuell forkynning.'),d.id);
      if(!d.metadata.decisionDate)missingItem('unknown_decision_date',this.#t('Vedtaksdato er ikke oppgitt eller kontrollert.'),d.id);
      if(!d.metadata.recipient)missingItem('unknown_recipient',this.#t('Riktig mottaker/klageordning må kontrolleres.'),d.id);
      if(d.metadata.decisionDate && d.metadata.receivedDate && d.metadata.receivedDate<d.metadata.decisionDate)missingItem('conflicting_dates',this.#t('Oppgitt mottak er før vedtaksdato. Kontroller datoene; dette beviser ikke feil hos en part.'),d.id);
      if(d.metadata.deadlineDate && d.metadata.receivedDate && d.metadata.deadlineDate<d.metadata.receivedDate)missingItem('deadline_before_receipt',this.#t('Oppgitt frist er før mottaksdato. Be om rask avklaring.'),d.id);
      if(d.metadata.receivedTime&&!d.metadata.receivedDate)missingItem('receipt_time_without_date',this.#t('Mottaksklokkeslett er oppgitt uten dato.'),d.id);
      if(d.metadata.servedTime&&!d.metadata.servedDate)missingItem('service_time_without_date',this.#t('Forkynningsklokkeslett er oppgitt uten dato.'),d.id);
      if(d.metadata.deadlineTime&&!d.metadata.deadlineDate)missingItem('time_without_date',this.#t('Fristklokkeslett er oppgitt uten dato.'),d.id);
      const dayDelta=d.metadata.deadlineDate?Math.round((Date.parse(d.metadata.deadlineDate+'T00:00:00Z')-Date.parse(today+'T00:00:00Z'))/86400000):null;
      const status=dayDelta===null?'unresolved':dayDelta<0?'stated_date_passed':dayDelta===0?'stated_date_today':dayDelta<=3?'stated_date_near':'stated_date_future';
      deadlines.push({documentId:d.id,decisionDate:d.metadata.decisionDate,receivedDate:d.metadata.receivedDate,receivedTime:d.metadata.receivedTime,servedDate:d.metadata.servedDate,servedTime:d.metadata.servedTime,servedMethod:d.metadata.servedMethod,date:d.metadata.deadlineDate,time:d.metadata.deadlineTime,basis:d.metadata.deadlineBasis,recipient:d.metadata.recipient,status,dayDelta,timeZone:'Europe/Oslo',comparisonPrecision:'calendar-day-only',deadlinePrecision:d.metadata.deadlineTime?'stated-date-and-time':'date-only-time-unresolved',calculated:false,legallyVerified:false,extensionGranted:false,warning:this.#t('Oppgitt dato, ikke beregnet eller juridisk bekreftet frist. Varsel sammenligner kalenderdag i Europe/Oslo; klokkeslett, friststart og 48-timersfrister må kontrolleres særskilt. En begjæring om utsettelse endrer ikke fristen.')});
      if(dayDelta===null)escalation.push({code:'unknown_deadline',documentId:d.id,message:this.#t('Avklar frist straks; ingen felles frist er antatt.')});
      else if(dayDelta<=3)escalation.push({code:'urgent_stated_deadline',documentId:d.id,message:this.#t('Oppgitt frist er nær eller passert. Søk kvalifisert bistand raskt.')});
      for(const key of ['decisionDate','receivedDate','servedDate'])if(d.metadata[key])chronology.push({id:d.id+'-'+key,date:d.metadata[key],kind:'user_account',description:({decisionDate:this.#t('Oppgitt vedtaksdato'),receivedDate:this.#t('Oppgitt faktisk mottak'),servedDate:this.#t('Oppgitt forkynning')})[key],documentId:d.id,evidence:[],evidenceValid:true});
      for(const p of d.pages){
        if(!p.reviewed)missingItem('unreviewed_page',this.#t('Kontroller ekstraksjonen mot originalen før teksten brukes som belegg.'),d.id,p.number);
        if(!p.currentText.trim()){missingItem('unreadable_page',this.#t('Siden mangler lesbar tekst. OCR eller manuell avskrift må kontrolleres.'),d.id,p.number);continue;}
        if(p.method==='ocr'&&(p.confidence===null||p.confidence<75))missingItem('low_ocr_confidence',this.#t('OCR-kvaliteten er lav eller ukjent. Tallet er et ekstraksjonssignal, ikke juridisk sikkerhet.'),d.id,p.number);
        for(const warning of p.warnings)missingItem('extraction_warning',warning,d.id,p.number);
        const review=reviewLocally(p.currentText,{authority:c.authority,completeMaterial:false});
        for(const category of review.categories){
          const refs=category.matches.map(quote=>{const start=p.currentText.indexOf(quote);return start<0?null:this.#evidence(c,{documentId:d.id,page:p.number,revision:p.revision,start,end:start+quote.length,quote});}).filter(Boolean);
          if(refs.length)candidates.push({category:category.id,title:this.#t(category.title),question:this.#t(category.question),support:refs,counterevidence:[],status:'unresolved',lawId:null,reason:this.#t('Lokalt ordtreff. Krever kontroll av tekst, relevant regel og andre dokumenter. Fravær eller treff avgjør ikke om et saksbehandlingstrinn faktisk har skjedd.'),sourceReviewed:p.reviewed});
        }
      }
    }
    for(const e of c.events)chronology.push({...clone(e),evidenceValid:this.#refsValid(c,e.evidence)});
    chronology.sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
    for(const [key,value] of Object.entries(c.escalationFlags))if(value)escalation.push({code:key,message:this.#t(escalationLabels[key])});
    const issues=c.issues.map(i=>({...clone(i),status:this.#issueStatus(c,i),evidenceValid:this.#refsValid(c,[...i.support,...i.counterevidence])}));
    for(const issue of issues){if(!issue.evidenceValid)missingItem('stale_issue_evidence',this.#t('Et vurderingspunkt viser til endret/slettet tekst. Belegg må velges på nytt.'));if(issue.status==='unresolved')missingItem('unresolved_issue',this.#t('Vurderingspunkt mangler kontrollert belegg, gjeldende rettskilde eller avklart faktum: ')+issue.title);}
    const contradictions=c.contradictions.map(v=>({...clone(v),evidenceValid:this.#refsValid(c,[...v.left,...v.right])}));
    if(contradictions.length)escalation.push({code:'contradictions_for_review',message:this.#t('Registrerte motstridsspørsmål krever menneskelig vurdering; de beviser ikke at noen har løyet.')});
    return {version:VERSION,caseId:c.id,caseVersion:c.version,method:'fixed-local-search-rules',documentRegister:c.documents.map(d=>({id:d.id,name:d.name,mediaType:d.mediaType,sha256:d.sha256,hashVerifiedAgainstBytes:d.hashVerifiedAgainstBytes,pageCount:d.pages.length,expectedPageCount:d.expectedPageCount,expectedPageCountKnown:d.expectedPageCountKnown,reviewedPageCount:d.pages.filter(p=>p.reviewed).length,metadata:clone(d.metadata)})),chronology,deadlines,missing,candidates,issues,contradictions,escalation,legalConclusion:null,probabilityOfIllegality:null,humanReviewRequired:true};
  }
  generateDraft(handle,type,values={}) {
    const c=this.#get(handle);assert(DRAFT_TYPES.includes(type),'UNKNOWN_DRAFT_TYPE');assert(c.drafts.length<50,'DRAFT_LIMIT');
    if(['short_appeal','full_appeal'].includes(type)&&(c.escalationFlags.courtDeadline||c.escalationFlags.childCoercion))fail('QUALIFIED_REVIEW_REQUIRED_USE_BRIEF');
    const v=Object.fromEntries(['recipient','caseRef','requestedChange','explanation','missingDocuments','sender','date'].map(k=>[k,clean(values[k],12000)]));if(v.date)assert(isoDate(v.date),'INVALID_DATE');
    const documentId=values.documentId || c.documents[0]?.id || null,d=documentId?this.#doc(c,documentId):null;
    const recipient=v.recipient||d?.metadata.recipient||this.#t('[KONTROLLER RIKTIG MOTTAKER]'),caseRef=v.caseRef||this.#t('[SAKSNUMMER / IDENTIFISER VEDTAKET]'),decisionDate=d?.metadata.decisionDate||this.#t('[VEDTAKSDATO]'),change=v.requestedChange||this.#t('[BESKRIV ØNSKET ENDRING]');
    const control=['tilsynsradet','sivilombudet'].includes(c.authority);
    const title={short_appeal:control?this.#t('Kort anmodning om kontroll – utkast'):this.#t('Kort klage – utkast'),full_appeal:control?this.#t('Anmodning om kontroll – utkast'):this.#t('Utfyllende klage – utkast'),access_request:this.#t('Begjæring om partsinnsyn – utkast'),extension_request:this.#t('Anmodning om mer tid – utkast'),lawyer_brief:this.#t('Privat saksoversikt til kvalifisert rådgiver – utkast')}[type];
    let body='';
    if(type==='short_appeal'||type==='full_appeal'){
      body=control?this.#t`Jeg ber om at dere vurderer følgende sak innenfor deres kontrollmandat: ${caseRef}. Dokumentet er datert ${decisionDate}.\n\nJeg ber om følgende vurdering eller oppfølging: ${change}.\n\n[OPPLYS OM TIDLIGERE KLAGER OG SVAR. KONTROLLER VILKÅRENE FOR AT KONTROLLORGANET KAN BEHANDLE SAKEN.]`:this.#t`Jeg klager på vedtaket ${caseRef}, datert ${decisionDate}.\n\nJeg ber om følgende endring: ${change}.`;
      body+=this.#t`\n\nMin begrunnelse:\n${v.explanation||this.#t('[FYLL INN KORT, RIKTIG OG KONKRET BEGRUNNELSE]')}`;
      if(type==='short_appeal')body+=this.#t('\n\nJeg ber om anledning til å supplere begrunnelsen og om skriftlig bekreftelse på mottak. Denne forespørselen innebærer ikke at noen frist er forlenget.');
      else body+=this.#t('\n\nDokumenter og spørsmål som må avklares:\n')+(v.missingDocuments||this.#t('[OPPGI KONKRETE MANGLER, BELEGG OG EVENTUELLE MOTOPPLYSNINGER]'));
    }else if(type==='access_request')body=this.#t`Jeg ber om partsinnsyn i saken ${caseRef}, i den utstrekning gjeldende regler gir meg innsyn.\n\nJeg ber særlig om:\n${v.missingDocuments||this.#t('[LISTE OVER DOKUMENTER / VEDLEGG OG DOKUMENTOVERSIKT]')}\n\nDersom noe holdes tilbake, ber jeg om konkret begrunnelse, riktig regelgrunnlag og informasjon om hvordan innsynsspørsmålet kan prøves. Oppgi en sikker og tilgjengelig måte å gi meg materialet på.`;
    else if(type==='extension_request')body=this.#t`Jeg ber om mer tid til å supplere eller svare i saken ${caseRef}.\n\nBakgrunn:\n${v.explanation||this.#t('[FORKLAR HVORFOR MER TID ER NØDVENDIG]')}\n\nJeg ber om skriftlig svar med presis dato og klokkeslett dersom mer tid kan gis. Jeg legger ikke til grunn at denne anmodningen forlenger eller avbryter en klagefrist. Dersom den aktuelle fristen ikke kan forlenges, ber jeg om informasjon om riktig fremgangsmåte.\n\n[VED BEHOV: SEND OGSÅ EN SELVSTENDIG KLAGE INNEN DEN FRISTEN SOM FAKTISK GJELDER.]`;
    else body=this.#reportText(c,this.analyze(handle),{includeDrafts:false});
    const docs=c.documents.map((doc,i)=>this.#t`${i+1}. ${doc.name} – dokument-ID ${doc.id}; SHA-256 ${doc.sha256}; ${doc.pages.length}/${doc.expectedPageCountKnown?doc.expectedPageCount:this.#t('forventet antall ukjent')} sider.`).join('\n')||this.#t('[INGEN DOKUMENTER REGISTRERT]');
    const warnings=this.#t('PRIVAT UTKAST – IKKE SENDT. Kontroller faktum, kilder, frist, mottaker, vedlegg og signatur. Ingen garanti for fristavbrudd eller rettslig resultat. Kontrollorganer er ikke automatisk ordinære klageinstanser.');
    const text=[warnings,'',title,this.#t('Til: ')+recipient,this.#t('Dato: ')+(v.date||this.#t('[DATO]')),this.#t('Sak: ')+caseRef,'',body,'',this.#t('Vedleggsoversikt (filer legges ikke automatisk ved):'),docs,'',this.#t('Hilsen'),v.sender||this.#t('[NAVN / GODKJENT FULLMEKTIG]')].join('\n');
    assert(text.length<=180000,'DRAFT_TOO_LARGE');
    const draft={id:id('draft'),type,documentId,text,recipient:recipient,caseRef:caseRef,requestedChange:change,revision:1,materialVersion:c.version,status:'draft',review:null,createdAt:this.#clock()};c.drafts.push(draft);return draft.id;
  }
  editDraft(handle,draftId,text) {const c=this.#get(handle),draft=c.drafts.find(d=>d.id===draftId);assert(draft,'DRAFT_NOT_FOUND');str(text,180000);draft.text=text;draft.revision++;draft.status='draft';draft.review=null;return clone(draft);}
  approveDraft(handle,draftId,{reviewer,checkedSources,checkedDates,checkedRecipient}={}) {
    const c=this.#get(handle),draft=c.drafts.find(d=>d.id===draftId);assert(draft,'DRAFT_NOT_FOUND');assert(clean(reviewer,200),'REVIEWER_REQUIRED');assert(checkedSources===true&&checkedDates===true&&checkedRecipient===true,'HUMAN_CHECKS_REQUIRED');
    assert(draft.materialVersion===c.version,'DRAFT_MATERIAL_CHANGED');
    if(draft.type!=='lawyer_brief')assert(draft.recipient&&!['[KONTROLLER','[CHECK THE'].some(v=>draft.recipient.includes(v))&&!['[SAKSNUMMER / IDENTIFISER VEDTAKET]','[CASE REFERENCE / IDENTIFY THE DECISION]'].includes(draft.caseRef),'DRAFT_FIELDS_INCOMPLETE');
    if(['short_appeal','full_appeal'].includes(draft.type))assert(!['[BESKRIV ØNSKET ENDRING]','[DESCRIBE THE REQUESTED CHANGE]'].includes(draft.requestedChange),'DRAFT_FIELDS_INCOMPLETE');
    assert(c.documents.length>0 && c.documents.every(d=>d.expectedPageCountKnown&&d.pages.length===d.expectedPageCount&&d.pages.every(p=>p.reviewed&&p.currentText.trim())),'SOURCE_REVIEW_INCOMPLETE');
    assert(c.events.every(e=>this.#refsValid(c,e.evidence)) && c.issues.every(i=>this.#refsValid(c,[...i.support,...i.counterevidence])) && c.contradictions.every(v=>this.#refsValid(c,[...v.left,...v.right])),'STALE_ANNOTATION');
    draft.status='reviewed';draft.review={reviewer:reviewer.trim(),checkedAt:this.#clock(),caseVersion:c.version,draftRevision:draft.revision,scope:'Human review attestation only; not lawyer approval, verified legal deadline or submission.'};return clone(draft);
  }
  #reportText(c,report,{includeDrafts=true}={}) {
    const lines=[this.#t('PRIVAT ARBEIDSNOTAT – KAN INNEHOLDE PERSONOPPLYSNINGER'),this.#t('Ikke sendt, ikke publisert, ingen juridisk konklusjon eller sannsynlighetsberegning.'),this.#t('Sak: ')+c.title,this.#t('Metode: Lokale søkeregler og menneskets egne opplysninger.'),'', this.#t('DOKUMENTREGISTER')];
    for(const d of report.documentRegister)lines.push(this.#t`${d.name} | ${d.id} | SHA-256 ${d.sha256} | sider ${d.pageCount}/${d.expectedPageCountKnown?d.expectedPageCount:this.#t('forventet antall ukjent')} | gjennomgått ${d.reviewedPageCount}`);
    lines.push('',this.#t('OPPGITTE DATOER – IKKE BEREGNEDE FRISTER'));for(const d of report.deadlines)lines.push(this.#t`${d.documentId}: vedtak ${d.decisionDate||this.#t('ukjent')}, mottak ${d.receivedDate||this.#t('ukjent')} ${d.receivedTime||''}, forkynning ${d.servedDate||this.#t('ukjent')} ${d.servedTime||''} (${d.servedMethod||this.#t('måte ukjent')}), frist ${d.date||this.#t('uavklart')} ${d.time||''}; grunnlag: ${d.basis||this.#t('må avklares')}; mottaker: ${d.recipient||this.#t('må avklares')}.`);
    lines.push('',this.#t('KRONOLOGI'));for(const e of report.chronology)lines.push(`${e.date||this.#t('ukjent dato')} [${e.kind}; ${e.evidenceValid?this.#t('referanser kontrollerbare'):this.#t('REFERANSER FORELDET')}] ${e.description}`, ...e.evidence.map(r=>this.#t`${r.documentId}, s.${r.page}, rev.${r.revision}, tegn ${r.start}–${r.end}: «${r.quote}»`));
    lines.push('',this.#t('MANGELLISTE'));for(const m of report.missing)lines.push(`- ${m.message}${m.documentId?' ['+m.documentId+(m.page?this.#t(', s.')+m.page:'')+']':''}`);
    lines.push('',this.#t('KONTROLLPUNKTER – IKKE BEVISTE LOVBRUDD'));for(const candidate of report.candidates)lines.push(candidate.title+': '+candidate.question,...candidate.support.map(r=>this.#t`${r.documentId}, s.${r.page}, rev.${r.revision}: «${r.quote}»`));
    for(const issue of report.issues)lines.push(`${issue.title} [${issue.status}]: ${issue.reason}`, this.#t('Rettskilde: ')+(issue.lawId||this.#t('mangler – uavklart')),...issue.support.map(r=>this.#t`Belegg ${r.documentId}, s.${r.page}: «${r.quote}»`),...issue.counterevidence.map(r=>this.#t`Motbelegg ${r.documentId}, s.${r.page}: «${r.quote}»`));
    lines.push('',this.#t('MOTSTRIDSSPØRSMÅL'));for(const item of report.contradictions)lines.push(item.description,...item.left.map(r=>this.#t`A ${r.documentId}, s.${r.page}: «${r.quote}»`),...item.right.map(r=>this.#t`B ${r.documentId}, s.${r.page}: «${r.quote}»`));
    lines.push('',this.#t('KVALIFISERT BISTAND / HASTER'));for(const e of report.escalation)lines.push('- '+e.message);
    if(includeDrafts){lines.push('',this.#t('UTKAST'));for(const d of c.drafts)lines.push(this.#t`\n${d.type} ${d.materialVersion!==c.version?this.#t('[SAKSGRUNNLAG ENDRET – LAG NYTT UTKAST] '):''}[${d.status==='reviewed'?this.#t('EGEN GJENNOMGANG REGISTRERT – IKKE JURISTGODKJENNING'):this.#t('IKKE GJENNOMGÅTT')}]\n${d.text}`);}
    return lines.join('\n');
  }
  exportCase(handle,{format='json'}={}) {
    const c=this.#get(handle),report=this.analyze(handle);assert(['json','text'].includes(format),'UNKNOWN_EXPORT_FORMAT');
    if(format==='text')return this.#reportText(c,report);
    return JSON.stringify({kind:'private-maite-case-export',version:VERSION,sent:false,containsPotentialPersonalData:true,originalFilesIncluded:false,warning:this.#t('Ikke anonymisert. Originalbytes er ikke med; bevar egne originalfiler. Egen gjennomgang er ikke juridisk godkjenning. Ingen innsamling eller aggregatbidrag skjer.'),case:this.readCase(handle),analysis:report},null,2);
  }
  exportWorkBundle(handle) {
    const c=this.#get(handle);
    const originals=[...this.#originals.get(c.id)].map(([documentId,bytes])=>({documentId,base64:encodeBytes(bytes)}));
    const text=JSON.stringify({kind:'private-maite-resumable-work',schema:RESUME_SCHEMA,engineVersion:VERSION,createdAt:this.#clock(),containsPotentialPersonalData:true,encrypted:false,case:clone(c),originals});
    assert(new TextEncoder().encode(text).byteLength<=MAX_RESUME_BYTES,'WORK_BUNDLE_TOO_LARGE');return text;
  }
  async importWorkBundle(serialized,{replaceHandle=null,signal=null}={}) {
    const old=replaceHandle?this.#get(replaceHandle):null,oldSnapshot=old?JSON.stringify(old):null;
    const validated=await validateWorkBundle(serialized,{version:VERSION,hashBytes,safeLaw,metadata,authorities:AUTHORITY_TYPES,categories:categoryIds,escalations:escalationKeys,draftTypes:DRAFT_TYPES,evidenceKinds:EVIDENCE_KINDS});
    assert(!signal?.aborted,'IMPORT_CANCELLED');
    const c=validated.caseData;
    if(old){assert(this.#get(replaceHandle)===old&&JSON.stringify(old)===oldSnapshot,'RESTORE_WORK_CHANGED');assert(c.id===old.id,'RESTORE_CASE_MISMATCH');}
    else{assert(!this.#cases.has(c.id),'RESTORE_CASE_EXISTS');assert(this.#cases.size<20,'CASE_LIMIT');}
    // Nothing above mutates live state. Capabilities are fresh; serialized handles are never accepted.
    const capability=id('cap');this.#cases.set(c.id,{capability,case:c});this.#originals.set(c.id,validated.originals);
    return {caseId:c.id,capability};
  }
  deleteCase(handle) { const c=this.#get(handle);this.#originals.get(c.id).clear();this.#originals.delete(c.id);this.#cases.delete(c.id);return {deleted:true,scope:'In-memory workspace references removed; downloaded files, source files and physical-memory remnants are outside this operation.'}; }
  clear() { for(const originals of this.#originals.values())originals.clear();this.#originals.clear();this.#cases.clear();return {cleared:true}; }
}
