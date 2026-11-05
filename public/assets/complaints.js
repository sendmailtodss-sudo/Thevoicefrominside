/* Decision-text review and complaint drafts. All case content stays in this browser tab. */
(function(root) {
  'use strict';
  const limit = 160000;
  const clean = value => String(value || '').replace(/\r\n?/g,'\n').trim();
  const unique = list => [...new Set(list)];
  const sectorProfiles = Object.freeze({
    general: {label:['Annet / usikker','Other / unsure'], hint:['Kontroller om brevet er et vedtak, en uttalelse eller et varsel, og følg klageveiledningen. Ikke alle brev kan påklages.','Check whether the letter is a decision, an opinion or a notice, and follow its appeal instructions. Not every letter can be appealed.']},
    corrections: {label:['Kriminalomsorgen','Correctional Service'], hint:['Følg klageveiledningen for vedtaket fra fengsel, region eller KDI. Frist og klageinstans kan variere; enkelte frister er svært korte.','Follow the appeal instructions for the decision from the prison, region or KDI. The deadline and appeal body vary; some deadlines are very short.']},
    child_welfare: {label:['Barnevernet','Child welfare'], hint:['Skill mellom vedtak fra barnevernstjenesten og avgjørelser fra Barneverns- og helsenemnda eller domstolen. Disse kan ha forskjellige prøvingsveier. Denne malen er ikke en begjæring om rettslig overprøving av et nemndsvedtak.','Distinguish decisions by the child welfare service from decisions by the Child Welfare and Health Board or a court. Review routes may differ. This template is not an application for judicial review of a board decision.']},
    nav: {label:['NAV','NAV'], hint:['Kontroller hvilken ordning vedtaket gjelder. Klageveien for kommunale sosiale tjenester kan være en annen enn for folketrygdytelser; ikke velg NAV Klageinstans eller Statsforvalteren automatisk.','Check which scheme the decision concerns. Municipal social services may have a different appeal route from National Insurance benefits; do not automatically choose NAV Appeals or the County Governor.']},
    county_governor: {label:['Statsforvalteren','County Governor'], hint:['Kontroller om Statsforvalteren traff første vedtak, avgjorde en klage eller ga en tilsynsuttalelse. Et klagevedtak har ikke nødvendigvis en ny ordinær klagerett. Velg Sivilombudet nedenfor hvis du vil be om ombudskontroll.','Check whether the County Governor made the first decision, decided an appeal or issued a supervisory opinion. An appeal decision does not necessarily carry another ordinary appeal right. Choose the Parliamentary Ombud option below if seeking ombudsman review.']},
    supervisory_council: {label:['Tilsynsrådet for kriminalomsorgen','Supervisory Council for the Correctional Service'], oversight:true, recipient:['Tilsynsrådet for kriminalomsorgen','Supervisory Council for the Correctional Service'], hint:['Dette er en henvendelse om tilsyn med forhold i Kriminalomsorgen. Tilsynsrådet er ikke den ordinære klageinstansen for vedtaket. Send en eventuell ordinær klage separat og innen riktig frist.','This is a request for oversight of conditions in the Correctional Service. The Supervisory Council is not the ordinary appeal body for the decision. Submit any ordinary appeal separately and within its deadline.']},
    ombudsman: {label:['Sivilombudet','Parliamentary Ombud (Sivilombudet)'], oversight:true, recipient:['Sivilombudet','Parliamentary Ombud (Sivilombudet)'], hint:['Dette er en klage til et kontrollorgan. Bruk normalt de ordinære klagemulighetene først, beskriv hva som er gjort, og kontroller Sivilombudets egne vilkår og frist. Ombudsklagen erstatter ikke en ordinær klage eller domstolsprøving.','This is a complaint to an oversight body. Normally exhaust ordinary administrative appeals first, describe the steps taken, and check the Ombud’s own conditions and deadline. This does not replace an ordinary appeal or judicial review.']}
  });
  function getSectorRoute(sector, en=false) {
    const key=Object.hasOwn(sectorProfiles,sector)?sector:'general',p=sectorProfiles[key],i=en?1:0;
    return {key,label:p.label[i],hint:p.hint[i],oversight:!!p.oversight,recipient:p.recipient?.[i]||''};
  }
  function analyzeDecision(input) {
    const text=clean(input).slice(0,limit);
    const sentences=text.split(/\n+|(?<=[.!?])\s+(?=[A-ZÆØÅ])/).map(s=>s.trim()).filter(Boolean);
    const select=pattern=>sentences.filter(s=>pattern.test(s)).slice(0,8).map(s=>s.slice(0,900));
    return {
      length:text.length,
      sections:unique(text.match(/§{1,2}\s*\d+[a-zæøå]?(?:\s*(?:–|-|og|and)\s*\d+[a-zæøå]?)?(?:\s+(?:første|annet|andre|tredje|fjerde|femte|sjette)\s+ledd)?/gi)||[]).slice(0,40),
      dates:unique(text.match(/\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[./]\d{1,2}[./]\d{4}\b|\b\d{1,2}\.?\s+(?:januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember|january|february|march|may|june|july|october|december)\s+\d{4}\b/gi)||[]).slice(0,40),
      appeal:select(/klagefrist|klageinstans|påklages|rett til å klage|appeal|deadline/i),
      reasons:select(/begrunn|vurder|legger.*vekt|risiko|hensyn|reason|assessment|consideration/i),
      evidence:select(/rapport|vedlegg|dokument|vitne|uttal|forklaring|evidence|witness|attachment/i),
      caseReferences:unique(text.match(/(?:saksnummer|saksnr\.?|saksreferanse|case\s+(?:number|reference))\s*:?\s*[\wæøåÆØÅ./-]+/gi)||[]).slice(0,8)
    };
  }
  function dateStatus(value, now=new Date()) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) return 'missing';
    const [y,m,d]=value.split('-').map(Number),check=new Date(Date.UTC(y,m-1,d));
    if(check.getUTCFullYear()!==y||check.getUTCMonth()!==m-1||check.getUTCDate()!==d)return 'invalid';
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Oslo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    const get=t=>parts.find(p=>p.type===t).value;
    const today=`${get('year')}-${get('month')}-${get('day')}`;
    return value<today?'past':value===today?'today':'future';
  }
  function buildComplaint(data, mode='full', en=false) {
    const v=k=>clean(data[k]);
    const fallback=(key,no,eng)=>v(key)||(en?eng:no);
    const route=getSectorRoute(v('sector'),en);
    const recipient=route.oversight?route.recipient:fallback('authority','[riktig mottaker etter klageveiledningen]','[correct recipient under the appeal instructions]');
    const date=v('decisionDate')||(en?'[decision date]':'[vedtaksdato]');
    const ref=fallback('caseRef','[saksnummer / beskrivelse av vedtaket]','[case number / description of the decision]');
    const outcome=fallback('outcome','[Beskriv endringen du ønsker.]','[Describe the change you seek.]');
    const lines=en?[
      'DRAFT — NOT SENT', '',`To: ${recipient}`,
      `From: ${fallback('name','[navn / fullmektig]','[name / representative]')}`,
      `Date: ${fallback('letterDate','[dato]','[date]')}`, '',
      `${route.oversight?(mode==='short'?'SHORT REQUEST FOR OVERSIGHT':'REQUEST FOR OVERSIGHT'):(mode==='short'?'INITIAL APPEAL — FURTHER GROUNDS TO FOLLOW':'APPEAL')} — ${ref}`,'',
      route.oversight?`I request review of the handling of ${ref}. Authority concerned: ${fallback('authority','[organet saken gjelder]','[authority concerned]')}. Decision or relevant letter dated ${date}.`:`I hereby appeal the decision dated ${date}, concerning ${ref}.`,
      v('receivedDate')?`I was notified of / received the decision on ${v('receivedDate')}${v('receivedTime')?' at '+v('receivedTime'):''}.`:'[State when you or your representative received notice of the decision.]','',
      'Change requested:',outcome,'',
    ]:[
      'UTKAST — IKKE SENDT', '',`Til: ${recipient}`,
      `Fra: ${fallback('name','[navn / fullmektig]','[name / representative]')}`,
      `Dato: ${fallback('letterDate','[dato]','[date]')}`, '',
      `${route.oversight?(mode==='short'?'KORT HENVENDELSE OM KONTROLL / TILSYN':'HENVENDELSE OM KONTROLL / TILSYN'):(mode==='short'?'FORELØPIG KLAGE — UTFYLLENDE BEGRUNNELSE ETTERSENDES':'KLAGE')} — ${ref}`,'',
      route.oversight?`Jeg ber om en vurdering av behandlingen av ${ref}. Organet saken gjelder: ${fallback('authority','[organet saken gjelder]','[authority concerned]')}. Vedtak eller relevant brev datert ${date}.`:`Jeg klager på vedtaket datert ${date}, som gjelder ${ref}.`,
      v('receivedDate')?`Jeg ble underrettet om / mottok vedtaket ${v('receivedDate')}${v('receivedTime')?' kl. '+v('receivedTime'):''}.`:'[Oppgi når du eller fullmektigen din ble underrettet om vedtaket.]','',
      'Endringen jeg ønsker:',outcome,'',
    ];
    if(mode==='short') {
      lines.push(route.oversight?(en?'I ask whether the matter falls within your remit and what further information you need. I do not assume that this request preserves or extends any ordinary appeal or judicial deadline.':'Jeg ber om avklaring av om saken faller innenfor deres mandat og hvilke supplerende opplysninger dere trenger. Jeg legger ikke til grunn at henvendelsen avbryter eller forlenger en ordinær klagefrist eller søksmålsfrist.'):(en?'I am submitting the appeal now. I request an opportunity to supplement the grounds and documents, and written confirmation of the deadline for doing so. This request does not assume that the appeal deadline has been extended.':'Klagen fremsettes nå. Jeg ber om anledning til å ettersende utfyllende begrunnelse og dokumentasjon, og om skriftlig bekreftelse på fristen for dette. Anmodningen innebærer ikke at jeg legger til grunn at klagefristen er forlenget.'),'');
      if(v('reasons'))lines.push(en?'Preliminary grounds:':'Foreløpig begrunnelse:',v('reasons'),'');
    } else {
      lines.push(en?'Grounds for the appeal:':'Begrunnelse for klagen:',fallback('reasons','[Beskriv hva du mener er feil, og hvorfor det kan påvirke resultatet.]','[Explain what you believe is wrong and why it could affect the outcome.]'),'');
      if(v('facts'))lines.push(en?'Facts and corrections:':'Faktum og korrigeringer:',v('facts'),'');
      if(v('procedure'))lines.push(en?'Questions about the procedure:':'Spørsmål om saksbehandlingen:',v('procedure'),'');
    }
    if(v('priorSteps')||route.oversight)lines.push(en?'Prior complaints and responses:':'Tidligere klager og svar:',fallback('priorSteps','[Beskriv klager, mottakere, datoer og svar. Forklar hvis ordinær klage ikke er brukt eller er ubesvart.]','[Describe complaints, recipients, dates and responses. Explain if ordinary appeal routes were not used or remain unanswered.]'),'');
    if(v('evidence'))lines.push(en?'Documents and evidence:':'Dokumentasjon og bevis:',v('evidence'),'');
    if(data.stay&&!route.oversight) lines.push(en?'Request for deferred implementation:':'Anmodning om utsatt iverksetting:',en?'If the decision can be deferred, I request a separate assessment of deferred implementation under forvaltningsloven § 42 or the applicable special provision. The practical harm I seek to avoid is:':'Dersom vedtaket kan utsettes, ber jeg om en særskilt vurdering av utsatt iverksetting etter forvaltningsloven § 42 eller aktuell særregel. Den praktiske skaden jeg ber om å unngå, er:',fallback('harm','[Beskriv den konkrete skaden og hvorfor saken haster.]','[Describe the specific harm and why the matter is urgent.]'),en?'Please decide this request promptly and give reasons if it is refused.':'Jeg ber om at anmodningen avgjøres snarest mulig, og at et eventuelt avslag begrunnes.','');
    if(route.oversight&&v('harm'))lines.push(en?'Why the matter is urgent:':'Hvorfor saken haster:',v('harm'),'');
    const closing=route.oversight?(en?'I ask you to consider whether the matter should be examined within your oversight remit. Please confirm receipt and identify any missing information. I understand that this complaint does not itself suspend the decision or preserve or extend any appeal or judicial deadline. Any request for deferred implementation must be directed separately to the competent authority.':'Jeg ber om at dere vurderer om saken bør undersøkes innenfor deres kontroll- eller tilsynsmandat. Bekreft mottak og opplys om eventuelle mangler. Jeg er kjent med at denne henvendelsen ikke i seg selv stanser vedtaket eller avbryter eller forlenger klage- eller søksmålsfrister. En eventuell anmodning om utsatt iverksetting må rettes separat til riktig myndighet.'):(en?'I ask the authority to reconsider the decision. If it is not changed as requested and an ordinary appeal route is available, please forward the appeal and the relevant documents to the competent appeal body. Please confirm receipt and tell me about any missing information.':'Jeg ber om at vedtaket vurderes på nytt. Dersom det ikke endres i tråd med klagen og saken har ordinær klagerett, ber jeg om at klagen og relevante dokumenter oversendes rett klageinstans. Bekreft mottak og gi beskjed om eventuelle mangler.');
    lines.push(closing,'',en?'Signature / approved electronic authentication:':'Underskrift / godkjent elektronisk autentisering:',fallback('name','[navn]','[name]'));
    return lines.join('\n');
  }
  root.SFIComplaints=Object.freeze({analyzeDecision,dateStatus,buildComplaint,getSectorRoute});
  if(typeof document==='undefined')return;
  const form=document.getElementById('complaint-form');if(!form)return;
  const en=document.documentElement.lang==='en',t=(no,english)=>en?english:no;
  const $=id=>document.getElementById(id);
  const result=$('complaint-review'),output=$('complaint-output'),status=$('complaint-status');
  const setStatus=message=>{status.textContent=message;};
  const restore=$('complaint-restore');
  let fileReadVersion=0,lastGenerated='',previousDraft='';
  let complaintDirty=false;
  form.addEventListener('input',()=>{complaintDirty=true;});
  form.addEventListener('change',()=>{complaintDirty=true;});
  window.addEventListener('beforeunload',event=>{if(complaintDirty){event.preventDefault();event.returnValue='';}});
  function updateRestore(){if(restore){restore.hidden=!previousDraft;restore.disabled=!previousDraft;}}
  const fields=['sector','priorSteps','authority','name','letterDate','decisionDate','receivedDate','receivedTime','deadlineDate','deadlineTime','caseRef','outcome','reasons','facts','procedure','evidence','harm'];
  function values(){return Object.fromEntries([...fields.map(k=>[k,$('complaint-'+k)?.value||'']),['stay',$('complaint-stay').checked]]);}
  function showSector(){
    const route=getSectorRoute($('complaint-sector')?.value,en),hint=$('complaint-sector-help');
    if(hint)hint.textContent=route.hint+' '+t('Et utkast er ikke sendt. Verktøyet garanterer ikke fristavbrytelse.','A draft has not been submitted. This tool does not guarantee that any deadline is preserved.');
    $('complaint-short').textContent=route.oversight?t('Lag kort henvendelse om kontroll / tilsyn','Draft a short oversight request'):t('Lag kort klage før fristen','Draft a short appeal before the deadline');
    $('complaint-full').textContent=route.oversight?t('Lag fullstendig henvendelse om kontroll / tilsyn','Draft a detailed oversight request'):t('Lag fullstendig klageutkast','Draft a detailed appeal');
    $('complaint-stay').disabled=route.oversight;
    const label=document.querySelector?.('label[for="complaint-authority"]');
    if(label)label.textContent=route.oversight?t('Organet henvendelsen gjelder (mottaker blir valgt kontrollorgan)','Authority concerned (recipient will be the selected oversight body)'):t('Riktig mottaker etter klageveiledningen','Correct recipient under the appeal instructions');
  }
  function listSection(title,items,empty) {
    const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent=title;section.append(heading);
    if(items.length){const ul=document.createElement('ul');items.forEach(item=>{const li=document.createElement('li');li.textContent=item;ul.append(li);});section.append(ul);}
    else {const p=document.createElement('p');p.textContent=empty;section.append(p);}result.append(section);
  }
  function review() {
    const source=$('complaint-decision').value;
    result.replaceChildren();
    if(!source.trim()){setStatus(t('Lim inn vedtakstekst eller åpne en tekstfil først.','Paste the decision text or open a text file first.'));return;}
    const a=analyzeDecision(source);result.hidden=false;
    const route=getSectorRoute($('complaint-sector')?.value,en);
    listSection(t('Klagevei som må kontrolleres','Review route to check'),[route.label+': '+route.hint],'');
    listSection(t('Henvisninger funnet i teksten','References found in the text'),a.sections,t('Ingen paragrafhenvisning gjenkjent. Det betyr ikke at hjemmel mangler.','No section reference recognised. This does not establish that a legal basis is missing.'));
    listSection(t('Datoer som må avklares','Dates to check'),a.dates,t('Ingen dato gjenkjent. Legg inn mottaksdato og oppgitt klagefrist selv.','No date recognised. Enter your receipt date and stated appeal deadline yourself.'));
    listSection(t('Utdrag om klage og frist','Excerpts about appeal and deadline'),a.appeal,t('Ingen klageveiledning gjenkjent i teksten du la inn. Kontroller hele vedtaket og vedleggene.','No appeal instructions recognised in the text you supplied. Check the complete decision and its attachments.'));
    listSection(t('Utdrag som kan gjelde begrunnelsen','Excerpts that may concern the reasons'),a.reasons,t('Ingen relevant formulering gjenkjent. Dette er ikke en vurdering av om vedtaket er begrunnet.','No matching wording recognised. This is not a finding that the decision lacks reasons.'));
    listSection(t('Utdrag om dokumentasjon','Excerpts about evidence'),a.evidence,t('Ingen relevante nøkkelord gjenkjent. Vurder selv hvilke dokumenter som belyser saken.','No relevant keywords recognised. Consider which documents may clarify the case.'));
    listSection(t('Spørsmål å arbeide videre med','Questions for your review'),en?[
      'What facts does the decision rely on? List specific errors and the evidence for your correction.',
      'Does the reasoning connect the facts, legal basis and result? Identify the exact passage you dispute.',
      'Were you able to comment on material allegations? Explain what you would have said and why it matters.',
      'Do documents or witnesses give conflicting accounts? State both accounts and what could resolve the difference.',
      'Which attachments support each point? Separate your own observations from what others told you.'
    ]:[
      'Hvilke fakta bygger vedtaket på? List konkrete feil og dokumentasjonen som støtter korrigeringen.',
      'Knytter begrunnelsen sammen faktum, hjemmel og resultat? Pek på den konkrete formuleringen du bestrider.',
      'Fikk du uttale deg om vesentlige påstander? Forklar hva du ville ha sagt og hvorfor det har betydning.',
      'Gir dokumenter eller vitner ulike forklaringer? Beskriv begge versjoner og hva som kan avklare forskjellen.',
      'Hvilket vedlegg støtter hvert punkt? Skill egne observasjoner fra det andre har fortalt.'
    ],'');
    setStatus(t('Tekstgjennomgangen er klar. Utdrag er hentet med faste søkeregler og kan være ufullstendige.','Text review ready. Excerpts were found using fixed search rules and may be incomplete.'));
  }
  function showDeadline() {
    const value=$('complaint-deadlineDate').value;
    const state=dateStatus(value);
    const messages={missing:t('Ingen frist er lagt inn. Les klageveiledningen; verktøyet beregner ikke fristen for deg.','No deadline entered. Read the appeal instructions; this tool does not calculate the deadline.'),invalid:t('Kontroller datoen.','Check the date.'),past:t('Datoen du har oppgitt, er passert. Avklar straks om klagen likevel kan behandles og forklar eventuell forsinkelse. Verktøyet avgjør ikke om fristen er utløpt.','The date you entered has passed. Promptly clarify whether an appeal can still be considered and explain any delay. This tool does not decide whether the legal deadline has expired.'),today:t('Du har oppgitt dagens dato som frist. Kontroller også klokkeslett og send gjennom godkjent kanal i tide.','You entered today as the deadline. Check the time as well and submit through an accepted channel in time.'),future:t('Datoen du har oppgitt, er registrert som din egen opplysning. Kontroller riktig frist og klokkeslett i vedtaket.','Your entered date is recorded as information supplied by you. Check the correct date and time in the decision.')};
    $('complaint-deadline-status').textContent=messages[state];
  }
  function generate(mode){
    if(output.value && output.value!==lastGenerated)previousDraft=output.value;
    lastGenerated=buildComplaint(values(),mode,en);output.value=lastGenerated;
    $('complaint-draft').hidden=false;$('complaint-download').disabled=false;$('complaint-print').disabled=false;
    updateRestore();
    setStatus(t('Utkast laget, ikke sendt. Les og rediger teksten før du signerer og sender den.','Draft created, not sent. Read and edit it before signing and submitting it.')+(previousDraft?t(' Det tidligere redigerte utkastet kan gjenopprettes med knappen nedenfor.',' You can restore the previously edited draft using the button below.'):''));
  }
  $('complaint-analyze').addEventListener('click',review);
  $('complaint-short').addEventListener('click',()=>generate('short'));
  $('complaint-full').addEventListener('click',()=>generate('full'));
  $('complaint-deadlineDate').addEventListener('change',showDeadline);
  $('complaint-sector')?.addEventListener('change',showSector);
  $('complaint-decision').addEventListener('input',()=>{fileReadVersion++;});
  $('complaint-file').addEventListener('change',async e=>{
    const version=++fileReadVersion,file=e.target.files[0];if(!file)return;
    if(!/\.txt$/i.test(file.name)||file.size>1024*1024){setStatus(t('Velg en .txt-fil under 1 MB. PDF må kopieres til tekst først.','Choose a .txt file under 1 MB. Copy text from a PDF first.'));e.target.value='';return;}
    try{
      const content=await file.text();if(version!==fileReadVersion)return;
      if(content.length>limit){setStatus(t('Teksten er for lang. Del vedtaket opp i deler på under 160 000 tegn.','The text is too long. Split it into parts under 160,000 characters.'));return;}
      $('complaint-decision').value=content;setStatus(t('Tekstfilen er lest lokalt. Den er ikke lastet opp.','Text file read locally. It was not uploaded.'));
    }catch{if(version===fileReadVersion)setStatus(t('Filen kunne ikke leses.','The file could not be read.'));}
  });
  restore?.addEventListener('click',()=>{
    if(!previousDraft)return;
    const current=output.value;output.value=previousDraft;previousDraft=current;lastGenerated='';updateRestore();
    setStatus(t('Forrige utkast er gjenopprettet. Versjonen du byttet fra, kan hentes tilbake med samme knapp.','Previous draft restored. You can bring back the version you switched from using the same button.'));
  });
  $('complaint-download').addEventListener('click',()=>{if(!output.value)return;const url=URL.createObjectURL(new Blob(['\ufeff'+output.value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=en?'appeal-draft.txt':'klageutkast.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus(t('Utkastet er lastet ned. Det er fortsatt ikke sendt til myndigheten.','Draft downloaded. It has still not been sent to the authority.'));});
  $('complaint-print').addEventListener('click',()=>{const p=$('complaint-print-text');p.textContent=output.value;document.body.classList.add('printing-complaint');window.print();});
  window.addEventListener('afterprint',()=>document.body.classList.remove('printing-complaint'));
  $('complaint-clear').addEventListener('click',()=>{fileReadVersion++;previousDraft='';lastGenerated='';complaintDirty=false;updateRestore();form.reset();result.replaceChildren();result.hidden=true;output.value='';$('complaint-print-text').textContent='';$('complaint-draft').hidden=true;$('complaint-download').disabled=true;$('complaint-print').disabled=true;showDeadline();showSector();setStatus(t('Alle saksopplysninger og utkast er fjernet fra skjemaet.','All case information and drafts have been cleared from the form.'));});
  form.addEventListener('submit',e=>e.preventDefault());
  showDeadline();
  showSector();
})(globalThis);
