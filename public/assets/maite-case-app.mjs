import { CaseWorkspace } from './maite-case-core.mjs';

import { makeTranslator } from './maite-i18n.mjs';
import { encryptWorkText, inspectWorkFile, readWorkFile } from './private-work-backup.mjs';
import { requestBackupPassword } from './private-backup-dialog.mjs';
const language=location.pathname.startsWith('/en/')?'en':'nb';
const t=makeTranslator(language);
const say=(no,en)=>language==='en'?en:no;
const workspace = new CaseWorkspace({language});
const handles = new Map();
let active = null, selectedDocument = null, selectedPage = 1, selectedDraft = null;
let workbench=null,textScale=1;
const VIEW_KEY='sfi-maite-view-v1';let viewMemory={};
try{const saved=JSON.parse(sessionStorage.getItem(VIEW_KEY)||'null');if(saved&&typeof saved==='object'&&!Array.isArray(saved))viewMemory=saved}catch{}
function rememberView(){if(!active)return;const previous=viewMemory[active.caseId]||{},pages={...(previous.pages||{})};if(selectedDocument)pages[selectedDocument]=selectedPage;viewMemory[active.caseId]={document:selectedDocument,page:selectedPage,draft:selectedDraft,scale:textScale,pane:workbench?.pane||'document',pages};const keys=Object.keys(viewMemory);for(const key of keys.slice(0,Math.max(0,keys.length-20)))delete viewMemory[key];try{sessionStorage.setItem(VIEW_KEY,JSON.stringify(viewMemory))}catch{}}
function applyScale(){const editor=document.getElementById('document-editor');if(editor)editor.style.setProperty('--maite-text-scale',String(textScale));const control=document.getElementById('maite-text-scale');if(control)control.value=String(textScale)}
let generation = 0, importAbort = null, extractor = null, restorePending = false, encryptedExportPending = false;
const $ = id => document.getElementById(id);
const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Oslo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const labels = {kriminalomsorg:t('Kriminalomsorgen'),nav:'NAV',barnevern:t('Barnevern'),statsforvalteren:t('Statsforvalteren'),tilsynsradet:t('Tilsynsrådet'),sivilombudet:t('Sivilombudet')};
const draftLabels = {short_appeal:t('Kort klage'),full_appeal:t('Utfyllende klage'),access_request:t('Partsinnsyn'),extension_request:t('Begjæring om mer tid'),lawyer_brief:t('Oversikt til advokat')};
const kindLabels = {documented_text:t('Dokumenttekst'),user_account:t('Opplyst av brukeren'),hypothesis:t('Hypotese'),missing_information:t('Manglende opplysning')};
const methodLabels = {native:t('Tekstlag i PDF'),text:t('Tekstfil'),ocr:t('Maskinlest bilde (OCR)'),manual:t('Manuell registrering'),pasted:t('Innlimt tekst'),embedded:t('Innebygd tekst')};
const dateFields = {decisionDate:'decision-date',receivedDate:'received-date',receivedTime:'received-time',servedDate:'served-date',servedTime:'served-time',servedMethod:'served-method',deadlineDate:'deadline-date',deadlineTime:'deadline-time',deadlineBasis:'deadline-basis',recipient:'recipient'};
const dateLabels = {unresolved:t('Fristen er uavklart'),stated_date_passed:t('Oppgitt dato er passert'),stated_date_today:t('Oppgitt dato er i dag'),stated_date_near:t('Oppgitt dato nærmer seg'),stated_date_future:t('Oppgitt dato ligger frem i tid')};
const errors = {
  DOWNLOAD_FAILED:say('Nedlastingen kunne ikke startes. Arbeidet er beholdt i fanen; ingen opplysninger er sendt. Prøv igjen og kontroller nettleserens nedlastinger.','The download could not be started. Work is preserved in this tab; nothing was sent. Try again and check browser downloads.'),
  BACKUP_DECRYPT_FAILED:say('Passordet er feil eller filen er skadet/endret. Eksisterende arbeid er beholdt.','The password is incorrect or the file is damaged/modified. Existing work is preserved.'),
  BACKUP_PASSWORD_INVALID:say('Bruk et passord på 12–1024 tegn.','Use a password of 12–1024 characters.'),
  BACKUP_TOO_LARGE:say('Arbeidskopien overskrider størrelsesgrensen. Eksisterende arbeid er beholdt.','The work copy exceeds the size limit. Existing work is preserved.'),
  BACKUP_SCOPE_MISMATCH:say('Dette er en kryptert fil for et annet verktøy. Åpne den i riktig arbeidsrom.','This encrypted file belongs to another tool. Open it in the correct workspace.'),
  BACKUP_CANCELLED:say('Operasjonen ble avbrutt. Eksisterende arbeid er beholdt.','Operation cancelled. Existing work is preserved.'),
  BACKUP_CRYPTO_UNAVAILABLE:say('Lokal kryptering er ikke tilgjengelig i denne nettleseren. Ingen fil er sendt eller lastet ned.','Local encryption is unavailable in this browser. No file was sent or downloaded.'),
  INVALID_WORK_BUNDLE:say('Arbeidskopien er ugyldig eller ufullstendig. Ingen sak er erstattet.','The work file is invalid or incomplete. No case has been replaced.'),
  UNSAFE_WORK_BUNDLE:say('Arbeidskopien inneholder felt som ikke er tillatt. Ingen sak er erstattet.','The work file contains disallowed fields. No case has been replaced.'),
  UNSUPPORTED_WORK_BUNDLE_VERSION:say('Dette er ikke en støttet inmAIte-arbeidskopi. Vanlig rapporteksport kan ikke gjenåpnes.','This is not a supported inmAIte work file. A report export cannot be reopened.'),
  WORK_BUNDLE_TOO_LARGE:say('Arbeidskopien overskrider grensen på 90 MB. Ingen sak er erstattet.','The work file exceeds the 90 MB limit. No case has been replaced.'),
  RESTORE_CASE_EXISTS:say('Denne saken er allerede åpen. Velg den og merk av for erstatning hvis arbeidskopien skal overta.','This case is already open. Select it and tick replace if the work file should replace it.'),
  RESTORE_CASE_MISMATCH:say('Arbeidskopien har en annen saks-ID. Fjern avmerkingen for erstatning for å åpne den som en annen sak.','The work file has a different case ID. Untick replace to open it as a separate case.'),
  RESTORE_WORK_CHANGED:say('Arbeidet ble endret under kontrollen. Ingen sak er erstattet. Lagre og prøv på nytt.','The work changed during validation. No case has been replaced. Save and try again.'),
  CASE_TITLE_REQUIRED:t('Gi saken en kort tittel.'), CASE_LIMIT:t('Denne fanen kan ha høyst 20 saker. Eksporter og slett en sak før du oppretter flere.'),
  CASE_ACCESS_DENIED:t('Saken er lukket eller tilgangen passer ikke. Opprett eller velg en åpen sak.'), DOCUMENT_NOT_IN_CASE:t('Dokumentet tilhører ikke den valgte saken.'),
  DOCUMENT_LIMIT:t('Saken kan inneholde høyst 30 dokumenter.'), DOCUMENT_NAME_REQUIRED:t('Dokumentet trenger et navn.'),
  DOCUMENT_TOO_LARGE:t('Filen er for stor for denne lokale utgaven.'), CASE_BYTE_LIMIT:t('Saken har nådd grensen for originalfiler. Eksporter og rydd før du fortsetter.'),
  CASE_TEXT_LIMIT:t('Saken inneholder for mye tekst for denne utgaven.'), INVALID_PAGE_COUNT:t('Forventet sidetall kan ikke være lavere enn sidene som faktisk er registrert.'),
  DUPLICATE_ORIGINAL:t('Den samme filen er allerede registrert i saken. Den er ikke lagt til en gang til.'),
  ORIGINAL_HASH_MISMATCH:t('Filens kontrollavtrykk stemmer ikke med uttrekket. Filen er ikke lagt til.'), INVALID_TEXT:t('Feltet er for langt eller har ugyldig tekst.'),
  INVALID_DATE:t('Kontroller datoene. Bruk en gyldig kalenderdato eller la feltet stå tomt.'), INVALID_TIME:t('Kontroller klokkeslettet.'),
  CORRECTION_REASON_REQUIRED:t('Forklar hva som er rettet før du lagrer en endret sidetekst.'),
  FALSE_QUOTE:t('Utdraget stemmer ikke nøyaktig med den lagrede teksten på siden.'), INVALID_EVIDENCE_SPAN:t('Utdraget kan ikke forankres på denne siden.'),
  STALE_EVIDENCE:t('Sidens tekst er endret etter at utdraget ble registrert. Registrer belegget på nytt.'),
  DOCUMENTED_EVENT_NEEDS_EVIDENCE:t('En hendelse merket dokumenttekst må ha et nøyaktig utdrag fra dokumentet.'),
  TWO_SOURCES_REQUIRED:t('Registrer et nøyaktig utdrag fra begge kildene.'),
  HUMAN_CHECKS_REQUIRED:t('Kontroller alle tre punktene før du registrerer sluttgjennomgangen.'), REVIEWER_REQUIRED:t('Oppgi hvem som har gjennomgått utkastet.'),
  DRAFT_MATERIAL_CHANGED:t('Sakens grunnlag har endret seg. Lag et nytt utkast og gjennomgå det på nytt.'),
  SOURCE_REVIEW_INCOMPLETE:t('Alle registrerte sider må være med, lesbare og kontrollert mot originalen før sluttgjennomgang kan registreres.'),
  STALE_ANNOTATION:t('Et belegg viser til en eldre siderevisjon. Kontroller grunnlaget på nytt før sluttgjennomgangen.'),
  QUALIFIED_REVIEW_REQUIRED_USE_BRIEF:t('Saken er merket med domstolsfrist eller tvangssak om barn. Bruk oversikten til advokat; en vanlig forvaltningsklage kan være feil fremgangsmåte.'),
  INVALID_PAGES:t('Dokumentet må inneholde lesbare, nummererte sider innenfor grensene.'), UNSUPPORTED_MEDIA_TYPE:t('Denne filtypen støttes ikke. Velg PDF, PNG, JPG eller ren tekst.'),
  DRAFT_LIMIT:t('Saken har nådd grensen for antall utkast.'), EMPTY_FILE:t('Filen er tom.'), FILE_TOO_LARGE:t('Filen overstiger grensen på 10 MB.'),
  TEXT_ENCODING:t('Tekstfilen kan ikke leses som UTF-8. Lagre en UTF-8-kopi lokalt, eller lim inn og kontroller teksten manuelt.'),
  OCR_UNAVAILABLE:t('OCR er ikke installert i den lokale hjelpeprosessen. Bruk kontrollert tekst eller lokal OCR med riktig oppsett.'),
  PASSWORD_REQUIRED:t('PDF-en er passordbeskyttet. Åpne en tilgjengelig kopi lokalt, eller lim inn kontrollert tekst.'),
  PDF_ENCRYPTED:t('PDF-en er passordbeskyttet. Åpne en tilgjengelig kopi lokalt, eller lim inn kontrollert tekst.'),
  EXTRACTOR_UNAVAILABLE:t('Lokal PDF-/bildeuttrekking er ikke tilgjengelig. Start den lokale forhåndsvisningen, eller bruk tekstfil / manuell tekst.'),
  IMPORT_CANCELLED:t('Filuttrekket ble avbrutt fordi du byttet eller slettet saken. Ingen dokumenter er lagt inn i den nye saken.'),
  IMPORT_UNSAVED_EDITS:t('Uttrekket ble ikke lagt inn fordi du har ulagrede endringer i arbeidsrommet. Lagre endringene og velg filen på nytt.')
};
const warningLabels = {
  OCR_LANGUAGE_UNAVAILABLE:t('Norsk OCR-språk mangler i den lokale installasjonen. Kontroller særlig navn, æ/ø/å, datoer og paragrafnumre.'),
  OCR_LOW_CONFIDENCE:t('Lav OCR-kvalitet. Sammenlign teksten med originalen.'),
  OCR_EMPTY:t('Ingen lesbar tekst ble funnet på siden.'),
  EMPTY_PAGE:t('Ingen lesbar tekst ble funnet på siden.'),
  MANUAL_TEXT_NOT_ORIGINAL:t('Denne teksten er registrert manuelt. Kontrollavtrykket gjelder tekstregistreringen, ikke den opprinnelige PDF-en eller bildefilen.'),
  EXTRACTION_REVIEW_REQUIRED:t('Uttrekket må kontrolleres mot originalen før det brukes som belegg.'),
  DOCUMENT_COMPLETENESS_NOT_VERIFIED:t('Programmet kan ikke bekrefte at dokumentet er komplett. Kontroller sidetall og vedlegg.'),
  LOW_OCR_CONFIDENCE:t('OCR-kvaliteten er lav. Les korrektur mot originalbildet.'),
  TEXT_UNREADABLE:t('Siden ga ikke lesbar tekst. Bruk et bedre bilde eller en kontrollert manuell avskrift.'),
  OCR_NORWEGIAN_MODEL_MISSING:t('Norsk OCR-språk mangler i den lokale installasjonen. Kontroller uttrekket særskilt.'),
  PAGE_TEXT_TRUNCATED:t('Sideuttrekket er avkortet. Hele siden må registreres og kontrolleres før videre bruk.'),
  EXTRACTION_INCOMPLETE:t('Uttrekket er ikke komplett. Kontroller hvilke sider eller avsnitt som mangler.'),
  POSSIBLE_MISSING_PAGE_CONTENT:t('En del av sidens innhold kan mangle i tekstuttrekket. Sammenlign med originalen.'),
  PDF_TEXT_LAYER_NOT_VISUALLY_VERIFIED:t('Tekstlaget er hentet fra PDF-en, men er ikke visuelt kontrollert mot sidene.'),
  USER_SUPPLIED_PAGINATION:t('Sideinndelingen er oppgitt av brukeren og må kontrolleres.'),
  LOCAL_EXTRACTION_ONLY:t('Uttrekket er gjort lokalt på denne maskinen. Det er ikke en juridisk analyse.')
};

function node(tag, text, className) { const el=document.createElement(tag); if(text!==undefined)el.textContent=String(text); if(className)el.className=className; return el; }
function status(message, error=false) { $('maite-status').textContent=message; $('maite-status').classList.toggle('error',error);if(workbench){workbench.status.textContent=message;workbench.status.classList.toggle('error',error)} }
function describeError(error) { return errors[error?.message] || errors[error?.code] || t('Handlingen kunne ikke fullføres. Kontroller filformat, sidetall og feltene. Ingen opplysninger er sendt til en ekstern tjeneste.'); }
function guard(action) { return async event => { event?.preventDefault(); try { await action(event); } catch(error) { status(describeError(error),true); } }; }
function snapshot() { if(!active)throw new Error('CASE_ACCESS_DENIED'); return workspace.readCase(active); }
function currentDoc() { return snapshot().documents.find(d=>d.id===selectedDocument) || null; }
function currentPage() { return currentDoc()?.pages.find(p=>p.number===selectedPage) || null; }
function opts(select,values,value) { select.replaceChildren(...values.map(([id,label])=>{const o=node('option',label);o.value=id;return o;})); if(values.some(v=>v[0]===value))select.value=value; }
function evidenceLabel(ref, data=snapshot()) { const d=data.documents.find(v=>v.id===ref.documentId); return t`${d?.name || ref.documentId} · side ${ref.page} · revisjon ${ref.revision}`; }
function appendEvidence(parent,refs,data) { for(const ref of refs||[]) { parent.append(node('blockquote',ref.quote),node('p',evidenceLabel(ref,data),'source')); } }
function friendlyWarning(w) { const code=String(w).split(':')[0]; return warningLabels[code] || (String(w).startsWith('ocr_language')?t('Norsk OCR-språk er ikke tilgjengelig. Uttrekket må kontrolleres særskilt.'):String(w)); }
function download(content,name,type='text/plain;charset=utf-8') { let url;try{const blob=new Blob([content],{type}),a=document.createElement('a');url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}catch{if(url)URL.revokeObjectURL(url);throw new Error('DOWNLOAD_FAILED')} }
function invalidateAsync() { generation++; importAbort?.abort(); importAbort=null; $('import-document').disabled=false; }

function resetWorkspaceForms() {
  for(const id of ['document-import-form','manual-document-form','page-review-form','page-count-form','metadata-form','event-form','issue-form','contradiction-form','escalation-form','draft-form'])$(id).reset();
  $('page-original').textContent='';$('page-text').value='';$('analysis-results').replaceChildren();$('draft-output').value='';$('draft-editor').hidden=true;
  for(const id of ['document-register','document-hash','page-quality','metadata-document','draft-state'])$(id).replaceChildren();
  for(const id of ['document-select','page-select','draft-select','conflict-left-doc','conflict-left-page','conflict-right-doc','conflict-right-page','issue-counter-doc','issue-counter-page'])$(id).replaceChildren();
  $('document-editor').hidden=true;$('draft-risk-court').checked=false;$('draft-risk-child').checked=false;
  clearChecks(); selectedDocument=null;selectedPage=1;selectedDraft=null;
}
function clearChecks(){for(const id of ['checked-sources','checked-dates','checked-recipient'])$(id).checked=false;$('draft-reviewer').value='';}
function pageDirty(){const p=active?currentPage():null;return p && ($('page-text').value!==p.currentText || $('page-reviewed').checked!==p.reviewed);}
function metadataDirty(){const d=active?currentDoc():null;return d && Object.entries(dateFields).some(([key,id])=>$(id).value!==String(d.metadata[key]||''));}
function draftDirty(){const d=active?snapshot().drafts.find(x=>x.id===selectedDraft):null;return d && $('draft-output').value!==d.text;}
function navigationAllowed(){if(pageDirty()||draftDirty()||metadataDirty()){status(t('Lagre sideendringer, oppgitte datoer og utkast før du bytter sak eller dokument. Slett sak kan brukes hvis du vil forkaste hele saken.'),true);return false;}return true;}
function selectCase(caseId) {
  rememberView();invalidateAsync();active=handles.get(caseId)||null;resetWorkspaceForms();
  const view=active?viewMemory[active.caseId]:null;if(view&&typeof view==='object'){selectedDocument=typeof view.document==='string'?view.document:null;selectedPage=Number.isInteger(view.page)&&view.page>0?view.page:1;selectedDraft=typeof view.draft==='string'?view.draft:null;textScale=[.8,1,1.25,1.5,2].includes(view.scale)?view.scale:1;if(workbench)workbench.setPane(view.pane==='draft'?'draft':'document')}else{textScale=1}
  renderAll();applyScale();
}
function renderCases() {
  const values=[...handles.values()].map(h=>{const c=workspace.readCase(h);return[h.caseId,c.title];});
  opts($('case-select'),values.length?values:[['',t('Ingen sak opprettet')]],active?.caseId||'');
  $('delete-case').disabled=!active;$('case-workspace').hidden=!active;if(workbench)workbench.open.disabled=!active||!snapshot().documents.length;
  $('case-summary').textContent=active?t`${snapshot().title} · ${labels[snapshot().authority]} · Bare i denne fanen. Eksporter før du lukker siden.`:t('Ingen saker er åpne. Et saksbytte skal aldri blande dokumenter eller utkast fra to saker.');
}
function renderDocuments() {
  const data=snapshot(),target=$('document-register');target.replaceChildren();
  const sameDocument=$('document-select').value===selectedDocument;
  const pendingPage=sameDocument && Number($('page-select').value)===selectedPage && pageDirty()?{text:$('page-text').value,reviewed:$('page-reviewed').checked,reason:$('page-review-reason').value}:null;
  const pendingMetadata=sameDocument && metadataDirty()?Object.fromEntries(Object.values(dateFields).map(id=>[id,$(id).value])):null;
  if(!data.documents.length){target.append(node('p',t('Ingen dokumenter er registrert i saken.')));$('document-editor').hidden=true;selectedDocument=null;for(const input of $('metadata-form').elements)input.disabled=true;return;}
  if(!data.documents.some(d=>d.id===selectedDocument))selectedDocument=data.documents[0].id;
  const table=node('table'),head=node('thead'),hr=node('tr');for(const h of [t('Dokument'),t('Sider'),t('Gjennomgått'),t('Datoer')])hr.append(node('th',h));head.append(hr);table.append(head);const tbody=node('tbody');
  for(const d of data.documents){const tr=node('tr');tr.append(node('td',d.name,'document-name'),node('td',t`${d.pages.length} lest · forventet ${d.expectedPageCountKnown?d.expectedPageCount:t('ukjent')}`),node('td',t`${d.pages.filter(p=>p.reviewed).length} av ${d.pages.length}`),node('td',t`Vedtak: ${d.metadata.decisionDate||t('ukjent')} · mottak: ${d.metadata.receivedDate||t('ukjent')}`));tbody.append(tr);}table.append(tbody);target.append(table);
  opts($('document-select'),data.documents.map(d=>[d.id,d.name]),selectedDocument);$('document-editor').hidden=false;
  for(const input of $('metadata-form').elements)input.disabled=false;
  const doc=currentDoc();if(!doc.pages.some(p=>p.number===selectedPage))selectedPage=doc.pages[0].number;
  opts($('page-select'),doc.pages.map(p=>[String(p.number),t`Side ${p.number}${p.reviewed?t(' · gjennomgått'):t(' · ikke gjennomgått')}`]),String(selectedPage));
  for(const side of ['left','right']){const selected=$(`conflict-${side}-doc`).value;opts($(`conflict-${side}-doc`),data.documents.map(d=>[d.id,d.name]),selected||selectedDocument);renderConflictPages(side);}
  opts($('issue-counter-doc'),data.documents.map(d=>[d.id,d.name]),$('issue-counter-doc').value||selectedDocument);renderCounterPages();
  renderPage();renderMetadata();
  if(pendingPage){$('page-text').value=pendingPage.text;$('page-reviewed').checked=pendingPage.reviewed;$('page-review-reason').value=pendingPage.reason;}
  if(pendingMetadata)for(const[id,value]of Object.entries(pendingMetadata))$(id).value=value;
}
function renderPage() {
  const d=currentDoc(),p=currentPage();if(!p)return;
  $('document-expected-pages').value=d.expectedPageCountKnown?String(d.expectedPageCount):'';
  $('page-original').textContent=p.extractedText;$('page-text').value=p.currentText;$('page-reviewed').checked=p.reviewed;$('page-review-reason').value='';
  const warnings=p.warnings.map(friendlyWarning);$('page-quality').textContent=[t`${d.name} · side ${p.number} · ${methodLabels[p.method]||p.method} · revisjon ${p.revision}.`,p.confidence!==null?t`OCR-signalet er ${Math.round(p.confidence)} av 100; dette sier ikke noe om juridisk riktighet.`:'',p.reviewed?t('Registrert som kontrollert mot originalen.'):t('Teksten er ikke kontrollert mot originalen.'),...warnings].filter(Boolean).join(' ');
  $('document-hash').textContent=`SHA-256: ${d.sha256}. ${p.method==='manual'?t('Gjelder den manuelt registrerte teksten.'):d.hashVerifiedAgainstBytes?t('Kontrollert mot filbytes i arbeidsrommet.'):t('Ikke kontrollert mot originalfil i arbeidsrommet.')}`;
  $('download-original').disabled=!d.hashVerifiedAgainstBytes;applyScale();rememberView();if(workbench)workbench.open.disabled=false;
}
function renderMetadata(){const d=currentDoc();$('metadata-document').textContent=d?t`Opplysningene gjelder: ${d.name}`:t('Velg et dokument i steg 2.');for(const [key,id] of Object.entries(dateFields))$(id).value=d?.metadata[key]||'';}
function renderConflictPages(side){const data=snapshot(),d=data.documents.find(v=>v.id===$(`conflict-${side}-doc`).value);const selected=$(`conflict-${side}-page`).value;opts($(`conflict-${side}-page`),d?d.pages.map(p=>[String(p.number),t`Side ${p.number}`]):[],selected);}
function renderCounterPages(){const d=snapshot().documents.find(v=>v.id===$('issue-counter-doc').value);opts($('issue-counter-page'),d?d.pages.map(p=>[String(p.number),t`Side ${p.number}`]):[],$('issue-counter-page').value);}
function renderDrafts(){const data=snapshot();const pending=$('draft-select').value===selectedDraft && draftDirty()?$('draft-output').value:null;if(!data.drafts.length){$('draft-editor').hidden=true;selectedDraft=null;return;}$('draft-editor').hidden=false;if(!data.drafts.some(d=>d.id===selectedDraft))selectedDraft=data.drafts.at(-1).id;opts($('draft-select'),data.drafts.map((d,i)=>[d.id,`${i+1}. ${draftLabels[d.type]} · ${d.status==='reviewed'?t('gjennomgang registrert'):t('utkast')}`]),selectedDraft);const d=data.drafts.find(v=>v.id===selectedDraft);$('draft-output').value=pending??d.text;rememberView();$('draft-state').textContent=pending!==null?t('Tekstendringer er ikke lagret. Lagre før nedlasting eller sluttkontroll.'):d.status==='reviewed'?t`Egen gjennomgang registrert av ${d.review.reviewer}. Dette er ikke en juridisk godkjenning eller en innlevering.`:t('Ikke sluttkontrollert. Ingenting er sendt.');clearChecks();}
function syncRiskFlags(){const data=snapshot();for(const input of $('escalation-form').querySelectorAll('input[type=checkbox]'))input.checked=Boolean(data.escalationFlags[input.name]);$('draft-risk-court').checked=data.escalationFlags.courtDeadline;$('draft-risk-child').checked=data.escalationFlags.childCoercion;}
function renderAll(){renderCases();if(!active)return;renderDocuments();renderDrafts();syncRiskFlags();}

function reportSection(title){const s=node('section',undefined,'report-section');s.append(node('h3',title));return s;}
function renderAnalysis(){const target=$('analysis-results');target.replaceChildren();if(pageDirty()||metadataDirty()){target.append(node('p',t('Lagre sideendringer og oppgitte datoer før gjennomgangen oppdateres. Ulagrede felt er bevart.'),'notice'));return null;}const data=snapshot(),report=workspace.analyze(active,{today:today()});
  const missing=reportSection(t('Det som må avklares først'));if(!report.missing.length)missing.append(node('p',t('Ingen tekniske mangler er registrert. Det er ikke en bekreftelse på at saken er rettslig komplett.'),'note'));else{const list=node('ul',undefined,'report-list');for(const item of report.missing){const d=data.documents.find(v=>v.id===item.documentId);list.append(node('li',`${item.code==='extraction_warning'?friendlyWarning(item.message):item.message}${d?' — '+d.name:''}${item.page?t(', side ')+item.page:''}`));}missing.append(list);}target.append(missing);
  const deadlines=reportSection(t('Oppgitte frister – ikke automatisk beregnet'));for(const item of report.deadlines){const d=data.documents.find(v=>v.id===item.documentId),card=node('div',undefined,'report-card');card.append(node('h4',d?.name||t('Dokument')),node('p',`${dateLabels[item.status]||t('Må kontrolleres')}: ${item.date||t('ukjent dato')}${item.time?t(' kl. ')+item.time:''}.`),node('p',t`Vedtak: ${item.decisionDate||t('ukjent')}. Faktisk mottak: ${item.receivedDate||t('ukjent')}${item.receivedTime?t(' kl. ')+item.receivedTime:''}. Forkynning: ${item.servedDate||t('ikke oppgitt')}.`),node('p',t`Grunnlag: ${item.basis||t('Ikke oppgitt – må kontrolleres.')}`),node('p',t`Mottaker: ${item.recipient||t('Ikke avklart.')}`),node('p',item.warning,'note'));deadlines.append(card);}target.append(deadlines);
  const timeline=reportSection(t('Kronologi'));if(!report.chronology.length)timeline.append(node('p',t('Legg inn datoer eller hendelser for å bygge kronologien.'),'note'));for(const item of report.chronology){const card=node('div',undefined,'report-card');card.append(node('h4',`${item.date||t('Ukjent dato')} · ${kindLabels[item.kind]||item.kind}`),node('p',item.description));if(item.evidenceValid===false)card.append(node('p',t('Kildeutdraget er foreldet etter en tekstretting. Kontroller på nytt.'),'quality-note'));appendEvidence(card,item.evidence,data);timeline.append(card);}target.append(timeline);
  const candidates=reportSection(t('Kontrollpunkter med tekstbelegg'));candidates.append(node('p',t('Dette er ordtreff som kan hjelpe gjennomgangen. Ingen verifisert rettskilde er knyttet til disse treffene, og ingen automatisk lovbruddskonklusjon trekkes.'),'note'));for(const item of report.candidates){const card=node('details',undefined,'report-card');card.append(node('summary',t`${item.title} · uavklart`),node('p',item.question),node('p',item.reason,'note'));appendEvidence(card,item.support,data);if(!item.sourceReviewed)card.append(node('p',t('Kildesiden er ennå ikke kontrollert mot originalen.'),'quality-note'));candidates.append(card);}if(!report.candidates.length)candidates.append(node('p',t('Ingen ordtreff ble funnet. Det betyr ikke at dokumentet er feilfritt.'),'note'));target.append(candidates);
  if(report.issues.length){const issues=reportSection(t('Spørsmål du har registrert'));for(const item of report.issues){const card=node('div',undefined,'report-card');card.append(node('h4',item.title),node('p',item.reason),node('p',item.status==='unresolved'?t('Status: Uavklart. Rettskilde og fullstendig grunnlag må kontrolleres.'):t('Kandidat til menneskelig juridisk gjennomgang. Ingen automatisk konklusjon.'),'quality-note'),node('p',t('Belegg:'),'note'));appendEvidence(card,item.support,data);card.append(node('p',t('Motbelegg:'),'note'));appendEvidence(card,item.counterevidence,data);if(!item.counterevidence.length)card.append(node('p',t('Ingen motbelegg er registrert. Det betyr ikke at ingen finnes.'),'note'));if(item.missingInformation.length)card.append(node('p',t('Mangler: ')+item.missingInformation.join(' · ')));issues.append(card);}target.append(issues);}
  if(report.contradictions.length){const conflicts=reportSection(t('Motstridsspørsmål'));for(const item of report.contradictions){const card=node('div',undefined,'report-card');card.append(node('h4',item.description),node('p',t('Første kilde:'),'note'));appendEvidence(card,item.left,data);card.append(node('p',t('Andre kilde:'),'note'));appendEvidence(card,item.right,data);if(item.evidenceValid===false)card.append(node('p',t('Ett eller flere utdrag er foreldet. Kontroller mot den nye sideteksten.'),'quality-note'));conflicts.append(card);}target.append(conflicts);}
  const escalations=reportSection(t('Fristavklaring og kvalifisert bistand'));const list=node('ul',undefined,'report-list');for(const item of report.escalation)list.append(node('li',item.message,'urgent'));if(!report.escalation.length)list.append(node('li',t('Ingen særskilte forhold er registrert av verktøyet. Vurder selv behovet for kvalifisert bistand.')));escalations.append(list);target.append(escalations);
  return report;
}
function quoteRef(quote,docId=selectedDocument,pageNumber=selectedPage){if(!quote.trim())return null;const d=snapshot().documents.find(v=>v.id===docId),p=d?.pages.find(v=>v.number===Number(pageNumber));if(!p)throw new Error('PAGE_NOT_FOUND');const start=p.currentText.indexOf(quote);if(start<0)throw new Error('FALSE_QUOTE');if(p.currentText.indexOf(quote,start+1)>=0){status(t('Utdraget forekommer flere ganger på siden. Ta med mer tekst slik at stedet blir entydig.'),true);throw new Error('INVALID_EVIDENCE_SPAN');}return workspace.makeEvidence(active,{documentId:docId,page:Number(pageNumber),start,end:start+quote.length,quote});}
function mutateDone(message){renderDocuments();renderDrafts();renderAnalysis();status(message);}

$('maite-create-case').addEventListener('submit',guard(()=>{if(!navigationAllowed())return;const h=workspace.createCase({title:$('case-title').value,authority:$('case-authority').value});handles.set(h.caseId,h);selectCase(h.caseId);$('case-title').value='';status(t('Saken er opprettet lokalt i denne fanen.'));}));
$('case-select').addEventListener('change',()=>{if(!navigationAllowed()){$('case-select').value=active?.caseId||'';return;}selectCase($('case-select').value);status(t('Valgt sak er åpnet. Ingen data fra andre saker vises.'));});
$('delete-case').addEventListener('click',guard(()=>{if(!active)return;invalidateAsync();const id=active.caseId;workspace.deleteCase(active);handles.delete(id);active=null;selectCase([...handles.keys()][0]||'');status(t('Saken og originalfilene er fjernet fra arbeidsrommets referanser. Dine kildefiler og eventuelle nedlastinger må slettes separat. Dette er ikke en garanti for fysisk sletting av minnet.'));}));
$('document-select').addEventListener('change',()=>{if(!navigationAllowed()){$('document-select').value=selectedDocument;return;}rememberView();selectedDocument=$('document-select').value;selectedPage=viewMemory[active.caseId]?.pages?.[selectedDocument]||1;renderDocuments();});
$('page-select').addEventListener('change',()=>{if(pageDirty()){$('page-select').value=String(selectedPage);status(t('Lagre sidegjennomgangen før du bytter side.'),true);return;}selectedPage=Number($('page-select').value);renderPage();});
$('page-review-form').addEventListener('submit',guard(()=>{workspace.reviewPage(active,selectedDocument,selectedPage,{text:$('page-text').value,reviewed:$('page-reviewed').checked,reason:$('page-review-reason').value});mutateDone(t('Sidegjennomgangen er lagret. Tidligere utkast må vurderes mot det oppdaterte grunnlaget.'));}));
$('page-count-form').addEventListener('submit',guard(()=>{if(pageDirty()){status(t('Lagre sidegjennomgangen før du endrer sidetallet.'),true);return;}workspace.setExpectedPageCount(active,selectedDocument,Number($('document-expected-pages').value));mutateDone(t('Forventet sidetall er oppdatert. Kontroller at hele dokumentet faktisk foreligger.'));}));
$('metadata-form').addEventListener('submit',guard(()=>{const patch=Object.fromEntries(Object.entries(dateFields).map(([key,id])=>[key,$(id).value]));workspace.setDocumentDates(active,selectedDocument,patch);mutateDone(t('De oppgitte datoene er lagret hver for seg. Ingen juridisk frist er beregnet eller bekreftet.'));}));
for(const id of Object.values(dateFields))$(id).addEventListener('input',()=>{if(active && metadataDirty()){status(say('Datoer eller mottaker er endret, men ikke lagret. Ingenting er sendt.','Dates or recipient have changed but are not saved. Nothing has been sent.'));$('analysis-results').replaceChildren(node('p',t('Oppgitte datoer eller mottaker er endret, men ikke lagret. Lagre dem før du bruker gjennomgangen eller eksporterer.'),'notice'));if(selectedDraft)$('draft-state').textContent=t('Sakens datoer eller mottaker har ulagrede endringer. Tidligere kontrollstatus må vurderes mot oppdaterte opplysninger.');}});
for(const id of ['page-text','page-reviewed'])$(id).addEventListener('input',()=>{if(active && pageDirty()){status(say('Dokumentsiden har ulagrede endringer. Lagre sidegjennomgangen; ingenting er sendt.','The document page has unsaved changes. Save the page review; nothing has been sent.'));$('analysis-results').replaceChildren(node('p',t('Sidens tekst eller kontrollstatus har ulagrede endringer. Lagre sidegjennomgangen før du bruker resultatene videre.'),'notice'));if(selectedDraft)$('draft-state').textContent=t('Kildesiden har ulagrede endringer. Lagre dem og gjennomgå utkastets grunnlag på nytt.');}});
$('analyze-case').addEventListener('click',guard(()=>{if(pageDirty()||metadataDirty()){status(t('Lagre sidegjennomgangen og de oppgitte datoene før du oppdaterer analysen.'),true);return;}renderAnalysis();status(t('Gjennomgangen er oppdatert med kilder, mangler og uavklarte kontrollpunkter.'));}));
$('event-form').addEventListener('submit',guard(()=>{const ref=quoteRef($('event-quote').value);workspace.addEvent(active,{date:$('event-date').value||null,kind:$('event-kind').value,description:$('event-description').value,evidence:ref?[ref]:[]});$('event-form').reset();mutateDone(t('Hendelsen er lagt til med tydelig opplysningstype.'));}));
$('issue-form').addEventListener('submit',guard(()=>{const support=quoteRef($('issue-support').value),counter=quoteRef($('issue-counter').value,$('issue-counter-doc').value,Number($('issue-counter-page').value));workspace.addIssue(active,{category:$('issue-category').value,title:$('issue-title').value,reason:$('issue-reason').value,support:support?[support]:[],counterevidence:counter?[counter]:[],lawId:null,missingInformation:$('issue-missing').value.split('\n').map(x=>x.trim()).filter(Boolean)});$('issue-form').reset();mutateDone(t('Spørsmålet er registrert som uavklart. Tekstbelegg er ikke det samme som en juridisk konklusjon.'));}));
$('issue-counter-doc').addEventListener('change',renderCounterPages);
for(const side of ['left','right'])$(`conflict-${side}-doc`).addEventListener('change',()=>renderConflictPages(side));
$('contradiction-form').addEventListener('submit',guard(()=>{const refs=['left','right'].map(side=>quoteRef($(`conflict-${side}-quote`).value,$(`conflict-${side}-doc`).value,Number($(`conflict-${side}-page`).value)));workspace.addContradiction(active,{description:$('conflict-description').value,left:refs[0]?[refs[0]]:[],right:refs[1]?[refs[1]]:[]});for(const id of ['conflict-description','conflict-left-quote','conflict-right-quote'])$(id).value='';mutateDone(t('De to kildeutdragene er knyttet til et spørsmål som må undersøkes.'));}));
$('escalation-form').addEventListener('submit',guard(()=>{const flags=Object.fromEntries([...$('escalation-form').querySelectorAll('input')].map(i=>[i.name,i.checked]));workspace.setEscalation(active,flags);syncRiskFlags();renderDrafts();renderAnalysis();status(t('Spørsmålene til kvalifisert bistand er oppdatert. Ingen rådgiver er kontaktet.'));}));
for(const [id,key] of [['draft-risk-court','courtDeadline'],['draft-risk-child','childCoercion']])$(id).addEventListener('change',guard(()=>{workspace.setEscalation(active,{[key]:$(id).checked});syncRiskFlags();renderDrafts();renderAnalysis();status(t('Sakstypen er registrert av deg. Vanlige klageutkast er sperret når særskilt bistand er nødvendig.'));}));
$('draft-form').addEventListener('submit',guard(()=>{if(pageDirty()||metadataDirty()||draftDirty()){status(t('Lagre sidegjennomgang, datoer og eventuelle utkastendringer før du lager et nytt utkast.'),true);return;}selectedDraft=workspace.generateDraft(active,$('draft-type').value,{documentId:selectedDocument,recipient:currentDoc()?.metadata.recipient||'',caseRef:$('draft-case-ref').value,requestedChange:$('draft-requested-change').value,explanation:$('draft-explanation').value,missingDocuments:$('draft-missing-documents').value,sender:$('draft-sender').value,date:today()});renderDrafts();status(t('Et privat utkast er laget. Les og rediger teksten før du tar den i bruk.'));}));
$('draft-select').addEventListener('change',()=>{if(draftDirty()){$('draft-select').value=selectedDraft;status(t('Lagre endringene før du bytter utkast.'),true);return;}selectedDraft=$('draft-select').value;rememberView();renderDrafts();});
$('save-draft').addEventListener('click',guard(()=>{workspace.editDraft(active,selectedDraft,$('draft-output').value);renderDrafts();status(t('Teksten er lagret som utkast. Eventuell tidligere gjennomgang må registreres på nytt.'));}));
$('draft-output').addEventListener('input',()=>{status(say('Utkastet har ulagrede tekstendringer. Ingenting er sendt.','The draft has unsaved text changes. Nothing has been sent.'));$('draft-state').textContent=t('Tekstendringer er ikke lagret. Lagre før nedlasting eller sluttkontroll.');clearChecks();});
$('approve-draft').addEventListener('click',guard(()=>{if(draftDirty()||pageDirty()||metadataDirty()){status(t('Lagre tekstendringer og oppgitte datoer før du registrerer gjennomgangen.'),true);return;}workspace.approveDraft(active,selectedDraft,{reviewer:$('draft-reviewer').value,checkedSources:$('checked-sources').checked,checkedDates:$('checked-dates').checked,checkedRecipient:$('checked-recipient').checked});renderDrafts();status(t('Din gjennomgang er registrert. Dette er ingen innlevering eller garanti for at fristen er avbrutt.'));}));
$('download-draft').addEventListener('click',guard(()=>{if(!navigationAllowed())return;const d=snapshot().drafts.find(v=>v.id===selectedDraft);download(d.text,'privat-maite-utkast.txt');status(say('Nedlasting av utkastet er startet. Kontroller filen i nettleserens nedlastinger. Ingenting er sendt.','Draft download started. Check the file in browser downloads. Nothing was sent.'));}));
$('export-work').addEventListener('click',guard(()=>{if(!navigationAllowed())return;download(workspace.exportWorkBundle(active),language==='en'?'private-maite-work.json':'privat-maite-arbeidskopi.json','application/json;charset=utf-8');status(say('Nedlasting av ukryptert arbeidskopi er startet. Kontroller filen og oppbevar den privat.','Unencrypted work-copy download started. Check the file and keep it private.'));}));
$('export-work-encrypted').addEventListener('click',guard(async()=>{
  if(encryptedExportPending||restorePending||!navigationAllowed())return;
  const target=active,epoch=generation,before=JSON.stringify(snapshot());let password=null;
  encryptedExportPending=true;$('export-work-encrypted').disabled=true;
  try{password=await requestBackupPassword({language,mode:'encrypt'});if(password===null)return;
    if(generation!==epoch||active!==target||JSON.stringify(snapshot())!==before||!navigationAllowed())throw new Error('RESTORE_WORK_CHANGED');
    status(say('Krypterer arbeidskopien lokalt …','Encrypting the work copy locally …'));
    const encrypted=await encryptWorkText(workspace.exportWorkBundle(target),password,'maite');
    if(generation!==epoch||active!==target||JSON.stringify(snapshot())!==before||!navigationAllowed())throw new Error('RESTORE_WORK_CHANGED');
    download(encrypted,language==='en'?'private-maite-work.sfi':'privat-maite-arbeidskopi.sfi','application/octet-stream');
    status(say('Nedlasting av passordbeskyttet arbeidskopi er startet. Kontroller filen. Passordet er ikke sendt eller lagret og kan ikke gjenopprettes.','Password-protected work-copy download started. Check the file. The password has not been sent or stored and cannot be recovered.'));
  }finally{password=null;encryptedExportPending=false;$('export-work-encrypted').disabled=false;}
}));
$('resume-form').addEventListener('submit',guard(async()=>{
  if(restorePending||encryptedExportPending||!navigationAllowed())return;
  const file=$('resume-file').files[0];if(!file){status(t('Velg en fil først.'),true);return;}
  const replaceHandle=$('resume-replace').checked?active:null;
  if($('resume-replace').checked&&!active)throw new Error('CASE_ACCESS_DENIED');
  const epoch=generation,target=active,before=active?JSON.stringify(snapshot()):null,abort=new AbortController();let password=null;importAbort?.abort();importAbort=abort;
  restorePending=true;$('restore-work').disabled=true;status(say('Kontrollerer arbeidskopi, siderevisjoner og originalfiler lokalt …','Checking work file, page revisions and original files locally …'));
  try{
    const info=await inspectWorkFile(file,'maite',{signal:abort.signal});
    if(info.encrypted){password=await requestBackupPassword({language,mode:'decrypt'});if(password===null)return;}
    const {text}=await readWorkFile(file,password,'maite',{signal:abort.signal});
    if(generation!==epoch||abort.signal.aborted)throw new Error('IMPORT_CANCELLED');
    if(active!==target||(active&&JSON.stringify(snapshot())!==before))throw new Error('RESTORE_WORK_CHANGED');
    if(!navigationAllowed())return;
    const handle=await workspace.importWorkBundle(text,{replaceHandle,signal:abort.signal});
    handles.set(handle.caseId,handle);selectCase(handle.caseId);renderAnalysis();$('resume-form').reset();
    status(say('Arbeidskopien er gjenåpnet. Dokumenter, sitater, datoer og utkast er bevart. Registrert egenkontroll er en importert opplysning, ikke en uavhengig godkjenning.','The work file has been reopened. Documents, quotations, dates and drafts are preserved. Recorded personal review is an imported statement, not independent approval.'));
  }finally{password=null;restorePending=false;$('restore-work').disabled=false;if(importAbort===abort)importAbort=null;}
}));
$('export-json').addEventListener('click',guard(()=>{if(!navigationAllowed())return;download(workspace.exportCase(active,{format:'json'}),'privat-maite-sak.json','application/json;charset=utf-8');status(say('Nedlasting av strukturert sakskopi er startet. Kontroller filen; originalfilene må bevares separat.','Structured report download started. Check the file; preserve original files separately.'));}));
$('export-text').addEventListener('click',guard(()=>{if(!navigationAllowed())return;download(workspace.exportCase(active,{format:'text'}),'privat-maite-saksoversikt.txt');status(say('Nedlasting av saksoversikten er startet. Kontroller filen; den er ikke anonymisert og er ikke sendt.','Case report download started. Check the file; it is not anonymized and has not been sent.'));}));
$('download-original').addEventListener('click',guard(()=>{const d=currentDoc(),bytes=workspace.getOriginal(active,d.id);if(!bytes)throw new Error('ORIGINAL_HASH_REQUIRED');download(bytes,d.name,d.mediaType);status(say('Nedlasting av uendret originalfil er startet. Kontroller filen i nettleserens nedlastinger.','Original-file download started. Check the file in browser downloads.'));}));

async function addImported(target,epoch,{name,mime,bytes,pages,sha256=null,pageCount,warnings=[]},expected){
  if(!active || active.caseId!==target.caseId || generation!==epoch)throw new Error('IMPORT_CANCELLED');
  if(pageDirty()||metadataDirty()||draftDirty())throw new Error('IMPORT_UNSAVED_EDITS');
  const allPages=pages.map(p=>({number:p.pageNumber??p.number,text:p.text,method:p.method==='pdf-text'?'native':p.method==='plain-text'?'text':p.method,confidence:p.confidence??null,warnings:[...(p.warnings||[]),...(warnings||[])]}));
  const id=await workspace.addDocument(target,{name,mediaType:mime,bytes,sha256,pages:allPages,expectedPageCount:expected??undefined});
  if(!active || active.caseId!==target.caseId || generation!==epoch)throw new Error('IMPORT_CANCELLED');
  if(pageDirty()||metadataDirty()||draftDirty()){renderDocuments();renderDrafts();renderAnalysis();status(t('Dokumentet er lagt til i registeret. Dine ulagrede endringer er beholdt; lagre dem før du velger det nye dokumentet.'));return;}
  selectedDocument=id;selectedPage=allPages[0].number;renderDocuments();renderDrafts();renderAnalysis();
  status(t('Dokumentet er registrert i den valgte saken. Kontroller sidene og mottaksdatoen før du bruker uttrekket.'));
}
$('document-import-form').addEventListener('submit',guard(async()=>{
  const file=$('doc-file').files[0];if(!file){status(t('Velg en fil først.'),true);return;}if(!active)throw new Error('CASE_ACCESS_DENIED');if(!navigationAllowed())return;
  if(file.size===0)throw new Error('EMPTY_FILE');if(file.size>10485760)throw new Error('FILE_TOO_LARGE');
  const target=active,epoch=generation,expected=$('expected-pages').value?Number($('expected-pages').value):null;
  const abort=new AbortController();importAbort=abort;$('import-document').disabled=true;status(t('Leser filen lokalt. Du kan avbryte ved å bytte eller slette saken.'));
  try{
    const bytes=new Uint8Array(await file.arrayBuffer());if(generation!==epoch)throw new Error('IMPORT_CANCELLED');
    if(/\.txt$/i.test(file.name)||file.type==='text/plain'){
      let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{throw new Error('TEXT_ENCODING');}if(text.length>160000)throw new Error('INVALID_TEXT');
      const texts=text.split(/\f|\n--- SIDE ---\r?\n/);await addImported(target,epoch,{name:file.name,mime:'text/plain',bytes,pages:texts.map((text,i)=>({pageNumber:i+1,text,method:'text',confidence:null,warnings:[]})),pageCount:texts.length},expected);
    }else{
      if(!extractor)throw new Error('EXTRACTOR_UNAVAILABLE');
      const response=await fetch('/api/local-extract',{method:'POST',headers:{'Content-Type':file.type||'application/octet-stream','X-Maite-Filename':encodeURIComponent(file.name),'X-Maite-Token':extractor.token},body:file,signal:abort.signal,cache:'no-store',credentials:'omit',redirect:'error'});
      const result=await response.json();if(!response.ok){const e=new Error(result?.error?.code||'EXTRACTOR_UNAVAILABLE');throw e;}
      await addImported(target,epoch,{...result,bytes},expected);
    }
    if(active?.caseId===target.caseId && generation===epoch){$('doc-file').value='';$('expected-pages').value='';}
  }catch(error){if(error.name==='AbortError')throw new Error('IMPORT_CANCELLED');throw error;}
  finally{if(importAbort===abort){importAbort=null;$('import-document').disabled=false;}}
}));
$('manual-document-form').addEventListener('submit',guard(async()=>{
  if(!navigationAllowed())return;const target=active,epoch=generation,text=$('manual-text').value,name=$('manual-name').value,parts=text.split(/\n--- SIDE ---\r?\n/);if(!text.trim())throw new Error('EMPTY_FILE');
  await addImported(target,epoch,{name:/\.txt$/i.test(name)?name:name+'.txt',mime:'text/plain',bytes:new TextEncoder().encode(text),pages:parts.map((t,i)=>({pageNumber:i+1,text:t,method:'manual',confidence:null,warnings:['MANUAL_TEXT_NOT_ORIGINAL']})),pageCount:parts.length},$('expected-pages').value?Number($('expected-pages').value):undefined);
  if(active?.caseId===target.caseId && generation===epoch)$('manual-document-form').reset();
}));

$('load-demo').addEventListener('click',guard(async()=>{
  if(!navigationAllowed())return;
  const target=workspace.createCase({title:t('Fiktiv prøvesak – ukjent mottaksdato'),authority:'kriminalomsorg'});handles.set(target.caseId,target);selectCase(target.caseId);const epoch=generation;
  const text=t('FIKTIV PRØVESAK – ikke et virkelig vedtak\nVedtak 20.10.2026\nSøknad om aktivitet avslås. Vi viser til sikkerhetshensyn.\nVurderingen bygger på rapporten som er omtalt i vedlegg 1.\nDet kan klages på avgjørelsen. Se klageveiledning på side 2.\nDette er side 1 av 2. Side 2 og vedlegget mangler i prøven.');
  await addImported(target,epoch,{name:'FIKTIVT-vedtak.txt',mime:'text/plain',bytes:new TextEncoder().encode(text),pages:[{pageNumber:1,text,method:'text',confidence:null,warnings:[]}],pageCount:1},2);
  if(active?.caseId!==target.caseId || generation!==epoch)return;
  workspace.setDocumentDates(target,selectedDocument,{decisionDate:'2026-10-20'});renderMetadata();renderDocuments();renderAnalysis();status(t('Den fiktive saken er åpnet. Den viser ukjent mottaksdato, manglende side og uavklart frist. Ingen virkelige personer eller saker er brukt.'));
}));

async function detectExtractor(){
  if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)){$('extractor-status').textContent=t('PDF- og bildeuttrekking krever den lokale forhåndsvisningen på din egen maskin. Tekstfiler og manuell registrering virker uten en slik hjelpeprosess.');return;}
  try{const response=await fetch('/api/local-session',{cache:'no-store',credentials:'omit',redirect:'error'});if(!response.ok)throw new Error('unavailable');const result=await response.json();if(result.localOnly!==true || typeof result.token!=='string' || result.token.length<20)throw new Error('unavailable');extractor=result;const langs=result.ocr?.languages||[];$('extractor-status').textContent=t`Lokal hjelpeprosess er tilgjengelig. PDF-/bildefilen sendes bare til denne maskinen for uttrekk, og beholdes ikke av serveren etter behandlingen. Maks ${Math.round(result.maxBytes/1048576)} MB og ${result.maxPages} sider.${result.ocr?.available?(langs.includes('nor')?t(' Norsk OCR er tilgjengelig.'):t(' Norsk OCR mangler; teksten må kontrolleres særskilt.')):t(' OCR er ikke tilgjengelig.')}`;}
  catch{extractor=null;$('extractor-status').textContent=t('Ingen lokal PDF-/bildehjelpeprosess er tilgjengelig. Start START-PREVIEW.py med nødvendige lokale avhengigheter, eller bruk tekstfil / manuell registrering. Ingen ekstern tjeneste brukes som reserve.');}
}
document.addEventListener('input',event=>{if(restorePending&&!event.target.closest('.private-backup-dialog'))importAbort?.abort();});
window.addEventListener('beforeunload',event=>{if(handles.size){event.preventDefault();event.returnValue='';}});
setupWorkbench();renderCases();detectExtractor();
addEventListener('pagehide',rememberView);


/* The optional split workspace reuses existing forms and IDs; no cloned draft state. */
function setupWorkbench(){
 const documentEditor=$('document-editor'),draftSection=$('step-draft');if(!documentEditor||!draftSection||typeof HTMLDialogElement==='undefined')return;
 const toolbar=node('div',undefined,'maite-workbench-entry'),open=node('button',say('Dokument og utkast sammen','Document and draft together'));open.type='button';open.disabled=true;open.setAttribute('aria-haspopup','dialog');open.setAttribute('aria-controls','maite-workbench');toolbar.append(open,node('p',say('Bare i fanens minne · ikke sendt eller lagret på server. Last ned en arbeidskopi før du lukker siden.','Tab memory only · not sent or saved on a server. Download a work copy before closing this page.'),'note'));$('case-workspace').prepend(toolbar);
 const zoomLabel=node('label',say('Tekststørrelse i dokumentet','Document text size'),'maite-zoom-label'),zoom=node('select');zoom.id='maite-text-scale';zoomLabel.htmlFor=zoom.id;for(const value of [.8,1,1.25,1.5,2]){const option=node('option',`${Math.round(value*100)}%`);option.value=String(value);zoom.append(option)}zoom.value='1';zoomLabel.append(zoom);documentEditor.prepend(zoomLabel);zoom.addEventListener('change',()=>{textScale=Number(zoom.value);applyScale();rememberView()});
 const dialog=node('dialog',undefined,'maite-workbench');dialog.id='maite-workbench';dialog.setAttribute('aria-labelledby','maite-workbench-title');
 const head=node('div',undefined,'maite-workbench-head'),title=node('h2',say('Dokument og utkast','Document and draft'));title.id='maite-workbench-title';const close=node('button',say('Tilbake til stegene','Back to the steps'));close.type='button';head.append(title,close);const controls=node('div',undefined,'maite-workbench-controls');controls.append(head,node('p',say('Tekstuttrekk og ditt usendte utkast. Sidegjennomgang lagres bare i fanens arbeidsminne; nedlasting lager en fil på enheten.','Extracted text and your unsent draft. Page review is kept only in tab memory; downloading creates a file on your device.'),'maite-workbench-local'));
 const switcher=node('div',undefined,'maite-pane-switch'),buttons={},panels={document:node('section',undefined,'maite-workbench-document'),draft:node('section',undefined,'maite-workbench-draft')};
 for(const [key,label]of [['document',say('Dokument','Document')],['draft',say('Utkast','Draft')]]){const button=node('button',label);button.type='button';button.setAttribute('aria-controls','maite-pane-'+key);buttons[key]=button;panels[key].id='maite-pane-'+key;panels[key].setAttribute('aria-label',label);switcher.append(button)}
 const grid=node('div',undefined,'maite-workbench-grid');grid.append(panels.document,panels.draft);const mirror=node('p',undefined,'maite-workbench-status');mirror.setAttribute('role','status');mirror.setAttribute('aria-live','polite');controls.append(switcher,mirror);dialog.append(controls,grid);$('main').append(dialog);
 const small=matchMedia('(max-width:800px)');let moved=[];
 function setPane(pane){workbench.pane=pane;for(const key of ['document','draft']){buttons[key].setAttribute('aria-pressed',String(key===pane));panels[key].hidden=small.matches&&key!==pane}rememberView()}
 workbench={open,status:mirror,pane:'document',setPane};for(const key of ['document','draft'])buttons[key].addEventListener('click',()=>setPane(key));small.addEventListener('change',()=>setPane(workbench.pane));
 open.addEventListener('click',()=>{if(!active||!currentDoc())return;moved=[];for(const [element,panel]of [[documentEditor,panels.document],[draftSection,panels.draft]]){const marker=document.createComment('maite-workbench-return');element.before(marker);moved.push({element,marker});panel.append(element)}setPane(viewMemory[active.caseId]?.pane==='draft'?'draft':'document');mirror.textContent=$('maite-status').textContent;dialog.showModal();});
 close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{rememberView();for(const {element,marker}of moved){marker.replaceWith(element)}moved=[];open.focus({preventScroll:true})});
}
