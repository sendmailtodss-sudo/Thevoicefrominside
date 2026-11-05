/* Local workshop. Drafts stay in memory; only an explicit download exports them. */
(() => {
  'use strict';
  const C = window.WorkshopCore;
  if (!C) return;
  const tabs = [
    ['sources', 'Saksmappe', 'Case files'], ['policy', 'Forslag', 'Proposals'],
    ['forum', 'Samtaler', 'Conversations'], ['studio', 'Studio', 'Studio'],
    ['art', 'Kunstøkonomi', 'Art & income'], ['ai', 'KI-verktøy', 'AI tools'],
    ['log', 'Bevislogg', 'Evidence log'], ['roadmap', 'Veien videre', 'Next steps']
  ];
  let state = C.createState(), tab = 'sources', lang = 'no', dialog = null, returnFocus = null;
  let drafts = {}, editing = {}, notice = '', noticeError = false, media = null, importSequence = 0, touched = false;
  let backupMode = null, backupBusy = false, backupSequence = 0;
  const t = (no, en) => lang === 'en' ? en : no;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const route = path => (lang === 'en' ? '/en' : '') + path;
  const money = ore => (ore / 100).toLocaleString(lang === 'en' ? 'en-GB' : 'nb-NO', { style: 'currency', currency: 'NOK' });
  const empty = () => `<p class="uw-empty">${t('Ingen kort ennå. Bruk skjemaet for å begynne.', 'No cards yet. Use the form to begin.')}</p>`;
  const button = (action, label, extra = '') => `<button type="button" data-action="${action}" ${extra}>${label}</button>`;
  const card = (title, body, extra = '') => `<section class="uw-card" ${extra}><h3>${esc(title)}</h3>${body}</section>`;
  const paragraph = s => `<p class="uw-preserve">${esc(s || t('Ikke fylt ut', 'Not entered'))}</p>`;
  const options = (rows, value) => rows.map(([v, no, en]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(t(no, en))}</option>`).join('');
  function field(form, name, label, value = '', type = 'text', max = 4000, required = false, attrs = '') {
    const id = `uw-${form}-${name}`;
    const common = `id="${id}" name="${name}"${required ? ' required' : ''} ${attrs}`;
    return `<label for="${id}">${label}${required ? ' <span aria-hidden="true">*</span>' : ''}</label>` +
      (type === 'textarea' ? `<textarea ${common} maxlength="${max}">${esc(value)}</textarea>` : `<input ${common} type="${type}"${['number','date','datetime-local'].includes(type) ? '' : ` maxlength="${max}"`} value="${esc(value)}">`);
  }
  function select(form, name, label, rows, value) {
    return `<label for="uw-${form}-${name}">${label}</label><select id="uw-${form}-${name}" name="${name}">${options(rows, value)}</select>`;
  }
  function formData(form) {
    const data = Object.fromEntries(new FormData(form));
    for (const checkbox of form.querySelectorAll('input[type="checkbox"]')) data[checkbox.name] = checkbox.checked;
    return data;
  }
  function capture() {
    if (!dialog) return;
    for (const form of dialog.querySelectorAll('form[data-form]')) drafts[form.dataset.form] = formData(form);
  }
  function onInput(event) { if(event?.target?.type==='password')return; ++importSequence; touched = true; capture(); }
  function draft(type, defaults = {}) { return { ...defaults, ...(drafts[type] || {}) }; }
  function hasPendingFields() {
    const initial = {cases:{status:'draft'},proposals:{},messages:{room:'open'},questions:{status:'queued'},logs:{}};
    return Object.entries(drafts).some(([type,data]) => {
      let baseline;
      if (['art','prompt','event'].includes(type)) baseline=state[type];
      else if (Object.hasOwn(initial,type)) baseline=state[type].find(r=>r.id===editing[type])||initial[type];
      else if(type.startsWith('moderation-')) {const r=state.messages.find(r=>r.id===type.slice(11));if(!r)return false;baseline={reason:r.reason,appeal:r.appeal};}
      else return false;
      return Object.entries(data).some(([key,value]) => typeof value==='boolean' ? value!==Boolean(baseline[key]) : String(value??'')!==String(baseline[key]??''));
    });
  }
  function confirmExport(){return !hasPendingFields()||window.confirm(t('Du har felter som ikke er lagt til eller lagret. De blir ikke med i nedlastingen. Avbryt for å lagre dem først, eller fortsett med de lagrede kortene.','Some fields have not been added or saved. They will not be included in the download. Cancel to save them first, or continue with saved cards.'));}
  function pauseMedia(){dialog?.querySelectorAll('audio').forEach(audio=>audio.pause());}
  function communityLink(){return `<aside class="uw-community-link"><a href="${lang==='en'?'/en/verksted/community/':'/verksted/fellesskap/'}" target="_blank" rel="noopener noreferrer">${t('Åpne det separate fellesrommet →','Open the separate community space →')}</a><p>${t('Forslag og samtaler i verkstedet er lokale utkast. De blir ikke sendt til fellesrommet automatisk.','Workshop proposals and conversations are local drafts. They are not sent to the community space automatically.')}</p></aside>`;}
  function resetBackup(){++backupSequence;backupBusy=false;backupMode=null;dialog?.querySelectorAll('input[type="password"]').forEach(input=>{input.value='';});}
  function backupContent(){
    const exporting=backupMode.kind==='encrypt';
    return `<section class="uw-backup-card" aria-busy="${backupBusy}"><p class="uw-eyebrow">${t('ARBEIDSKOPI · BARE PÅ DIN ENHET','WORKING COPY · ON YOUR DEVICE ONLY')}</p><h3>${exporting?t('Beskytt kopien med et passord','Protect the copy with a password'):t('Åpne passordbeskyttet kopi','Open a password-protected copy')}</h3><p>${exporting?t('Velg et langt, unikt passord på minst 12 tegn. Krypteringen skjer i nettleseren før filen lastes ned. Vi kan ikke gjenopprette et glemt passord. Oppbevar passordet separat fra filen.','Choose a long, unique password of at least 12 characters. Encryption happens in your browser before the file is downloaded. We cannot recover a forgotten password. Keep the password separate from the file.'):t('Skriv passordet til arbeidskopien. Filen dekrypteres og kontrolleres lokalt. Du får bekrefte før eksisterende arbeid erstattes.','Enter the working copy’s password. The file is decrypted and checked locally. You will confirm before existing work is replaced.')}</p>${!exporting?`<p class="uw-hint">${t('Valgt fil','Selected file')}: ${esc(backupMode.name)}</p>`:''}<form data-backup-form autocomplete="off"><label for="uw-backup-password">${t('Passord · minst 12 tegn','Password · at least 12 characters')}</label><input id="uw-backup-password" name="password" type="password" minlength="12" maxlength="2048" required autocomplete="${exporting?'new-password':'current-password'}" spellcheck="false" autocapitalize="none" ${backupBusy?'disabled':''}>${exporting?`<label for="uw-backup-confirm">${t('Gjenta passordet','Repeat password')}</label><input id="uw-backup-confirm" name="confirm" type="password" minlength="12" maxlength="2048" required autocomplete="new-password" spellcheck="false" autocapitalize="none" ${backupBusy?'disabled':''}>`:''}<div class="uw-actions"><button type="submit" ${backupBusy?'disabled':''}>${backupBusy?t('Arbeider lokalt …','Working locally …'):exporting?t('Krypter og last ned','Encrypt and download'):t('Dekrypter og kontroller','Decrypt and check')}</button>${button('cancel-backup',backupBusy?t('Avbryt ventingen','Cancel waiting'):t('Avbryt','Cancel'),'class="uw-subtle"')}</div></form><p class="uw-hint">${t('Passordet lagres ikke av verkstedet. Feltene tømmes etter hvert forsøk og når du avbryter. Mediefiler og skjemafelt som ikke er lagret, følger ikke med kopien.','The workshop does not store the password. Fields are cleared after each attempt and when you cancel. Media files and unsaved form fields are not included in the copy.')}</p></section>`;
  }
  async function submitBackup(form){
    if(!backupMode||backupBusy)return;
    const B=window.WorkshopBackup;
    if(!B){setNotice('Passordbeskyttet kopi er ikke tilgjengelig i denne nettleseren eller utgaven. Ingen fil er endret.','Password-protected copies are unavailable in this browser or version. No file was changed.',true);form.reset();render();return;}
    let passphrase=form.querySelector('[name="password"]').value;
    const exporting=backupMode.kind==='encrypt',length=Array.from(passphrase).length;
    if(length<12||length>1024||(exporting&&passphrase!==form.querySelector('[name="confirm"]').value)){
      passphrase='';form.reset();setNotice(exporting?'Bruk 12–1024 tegn og gjenta nøyaktig samme passord.':'Passordet må ha 12–1024 tegn.',exporting?'Use 12–1024 characters and repeat exactly the same password.':'The password must contain 12–1024 characters.',true);render();dialog?.querySelector('#uw-backup-password')?.focus();return;
    }
    const mode=backupMode,openedDialog=dialog,sequence=++backupSequence;
    form.reset();backupBusy=true;setNotice('Arbeider med kopien lokalt. Ingen fil eller passord sendes.','Processing the copy locally. No file or password is sent.');render();
    try{
      if(exporting){
        const encrypted=await B.encrypt(C.serialize(state),passphrase);passphrase='';
        if(sequence!==backupSequence||dialog!==openedDialog)return;
        download(encrypted,'stemmen-verksted-kryptert.sfi-workshop.json','application/json');backupMode=null;backupBusy=false;
        setNotice('Den passordbeskyttede arbeidskopien er lastet ned. Oppbevar passordet separat; det kan ikke gjenopprettes.','Password-protected working copy downloaded. Keep the password separately; it cannot be recovered.');render();
      }else{
        const plaintext=await B.decrypt(mode.text,passphrase);passphrase='';
        if(sequence!==backupSequence||dialog!==openedDialog)return;
        const next=C.parse(plaintext);
        backupBusy=false;
        if(!askReplace()){resetBackup();setNotice('Importen er avbrutt. Ditt eksisterende arbeid er beholdt.','Import cancelled. Your existing work has been preserved.');render();return;}
        wipe();state=next;setNotice('Den passordbeskyttede kopien er åpnet lokalt. Mediefiler må velges på nytt.','Password-protected copy opened locally. Select media files again.');render();
      }
    }catch(error){
      passphrase='';if(sequence!==backupSequence||dialog!==openedDialog)return;backupBusy=false;
      if(error?.code==='CRYPTO_UNAVAILABLE')setNotice('Nettleseren støtter ikke kryptering her. Bruk en oppdatert nettleser på en sikker HTTPS-side eller lokal forhåndsvisning. Arbeidet er beholdt.','Encryption is unavailable here. Use an up-to-date browser on a secure HTTPS page or local preview. Your work has been preserved.',true);
      else setNotice(exporting?'Kunne ikke kryptere kopien. Kontroller passordet og prøv igjen. Arbeidet er beholdt.':'Kunne ikke åpne kopien. Passordet kan være feil, eller filen kan være skadet eller ha et format som ikke støttes. Arbeidet er beholdt.',exporting?'Could not encrypt the copy. Check the password and try again. Your work has been preserved.':'Could not open the copy. The password may be wrong, or the file may be damaged or unsupported. Your work has been preserved.',true);
      render();dialog?.querySelector('#uw-backup-password')?.focus();
    }finally{passphrase='';}
  }
  function actions(type, record) {
    return `<div class="uw-actions">${button('edit', t('Endre', 'Edit'), `data-type="${type}" data-id="${esc(record.id)}"`)}${button('delete', t('Slett', 'Delete'), `data-type="${type}" data-id="${esc(record.id)}" class="uw-subtle"`)}</div>`;
  }
  function saveButton(type) {
    return `<div class="uw-actions"><button type="submit">${editing[type] ? t('Lagre endringer', 'Save changes') : t('Legg til kort', 'Add card')}</button>${editing[type] ? button('cancel-edit', t('Avbryt endring', 'Cancel edit'), `data-type="${type}"`) : ''}</div>`;
  }
  function countHeading(title, number) { return `<h3 class="uw-list-heading">${title} <span>${number}/50</span></h3>`; }
  function layout(form, list) { return `<div class="uw-workgrid"><section class="uw-editor">${form}</section><section class="uw-records">${list}</section></div>`; }
  function caseContent() {
    const d = draft('cases', {status:'draft'});
    const form = `<h3>${t('Bygg et sakskort', 'Build a case card')}</h3><p>${t('Skill opplevelsen fra det kilden faktisk viser. Kortet er et arbeidsutkast, ikke en juridisk konklusjon.', 'Separate your account from what the source actually shows. This card is a working draft, not a legal conclusion.')}</p><form data-form="cases">` +
      field('cases','title',t('Kort tittel','Short title'),d.title,'text',200,true) +
      field('cases','date',t('Dato på dokumentet eller notatet','Document or note date'),d.date,'date') +
      field('cases','experience',t('Egen opplevelse eller påstand','Your account or claim'),d.experience,'textarea') +
      field('cases','source',t('Kilde og sidereferanse','Source and page reference'),d.source,'textarea') +
      field('cases','excerpt',t('Nøyaktig sitat fra kilden','Exact source quotation'),d.excerpt,'textarea') +
      field('cases','missing',t('Hva mangler eller taler imot?','What is missing or points the other way?'),d.missing,'textarea') +
      field('cases','response',t('Spørsmål og eventuelt tilsvar','Questions and any response'),d.response,'textarea') +
      select('cases','status',t('Din arbeidsstatus','Your work status'),[['draft','Under arbeid','In progress'],['prepared','Klargjort av meg','Prepared by me']],d.status) +
      `<p class="uw-hint">${t('«Klargjort» er din egen merking, ikke en godkjenning fra advokat.', '“Prepared” is your own label, not approval by a lawyer.')}</p>` + saveButton('cases') + '</form>';
    const list = countHeading(t('Mine sakskort','My case cards'),state.cases.length) + (state.cases.length ? state.cases.slice().reverse().map(r => card(r.title, `<p class="uw-tag">${esc(r.date)} · ${r.status==='prepared'?t('Klargjort av meg','Prepared by me'):t('Under arbeid','In progress')}</p><dl class="uw-dl"><dt>${t('Opplevelse','Account')}</dt><dd>${paragraph(r.experience)}</dd><dt>${t('Kilde','Source')}</dt><dd>${paragraph(r.source)}</dd><dt>${t('Sitat','Quotation')}</dt><dd>${paragraph(r.excerpt)}</dd><dt>${t('Mangler / motbelegg','Missing / counterevidence')}</dt><dd>${paragraph(r.missing)}</dd><dt>${t('Tilsvar','Response')}</dt><dd>${paragraph(r.response)}</dd></dl>${actions('cases',r)}`)).join('') : empty());
    return layout(form,list);
  }
  function policyContent() {
    const d = draft('proposals');
    const form = `<h3>${t('Et forslag som kan undersøkes','A proposal that can be examined')}</h3><p>${t('Beskriv problemet, endringen du ønsker og hva som bør prøves. Lokale valg er ikke en offentlig avstemning.', 'Describe the problem, the change you want and what should be tested. Local choices are not a public vote.')}</p><form data-form="proposals">` +
      field('proposals','title',t('Forslagets tittel','Proposal title'),d.title,'text',200,true) +
      field('proposals','problem',t('Hvilket problem skal løses?','What problem should be solved?'),d.problem,'textarea') +
      field('proposals','change',t('Foreslått endring','Proposed change'),d.change,'textarea',4000,true) +
      field('proposals','rationale',t('Begrunnelse, motargumenter og kilder','Reasons, counterarguments and sources'),d.rationale,'textarea') + saveButton('proposals') + '</form>';
    const list = countHeading(t('Mine forslag','My proposals'),state.proposals.length) + (state.proposals.length ? state.proposals.slice().reverse().map(r => card(r.title, `${paragraph(r.problem)}<h4>${t('Endringen','The change')}</h4>${paragraph(r.change)}<h4>${t('Grunnlaget','The basis')}</h4>${paragraph(r.rationale)}<div class="uw-actions">${button('vote',t('Støtt utredning','Support review'),`data-id="${esc(r.id)}" data-choice="support" aria-pressed="${r.vote==='support'}"`)}${button('vote',t('Uenig','Disagree'),`data-id="${esc(r.id)}" data-choice="against" aria-pressed="${r.vote==='against'}"`)}${button('vote',t('Trekk tilbake','Withdraw'),`data-id="${esc(r.id)}" data-choice="withdraw"${r.vote===null?' disabled':''}`)}</div><p class="uw-hint">${t('Ditt lokale valg','Your local choice')}: ${r.vote==='support'?t('støtte','support'):r.vote==='against'?t('uenighet','disagreement'):t('ingen','none')}. ${t('Ingen stemmer er sendt eller personer verifisert.','No votes have been sent and no people have been verified.')}</p>${actions('proposals',r)}`)).join('') : empty());
    return layout(form,list);
  }
  function forumContent() {
    const d=draft('messages',{room:'open'});
    const form=`<h3>${t('Prøv et samtaleinnlegg','Draft a conversation post')}</h3><p>${t('Velg et rom og prøv redaksjonsflyten med ufølsom eksempeltekst. Begge rommene er bare lokale modeller, uten andre medlemmer.', 'Choose a room and try the review process with non-sensitive example text. Both rooms are local models, with no other members.')}</p><form data-form="messages">`+
      field('messages','alias',t('Visningsnavn / artistnavn','Display name / artist name'),d.alias,'text',120,true)+
      select('messages','room',t('Rom','Room'),[['open','Åpen samtale – modell','Open conversation — model'],['support','Støtterom – modell','Support room — model']],d.room)+
      field('messages','body',t('Innlegg','Post'),d.body,'textarea',4000,true)+saveButton('messages')+'</form>';
    const list=countHeading(t('Lokal redaksjonskø','Local review queue'),state.messages.length)+(state.messages.length?state.messages.slice().reverse().map(r=>{
      const status=r.status==='approved'?t('Godkjent lokalt','Approved locally'):r.status==='rejected'?t('Avvist lokalt','Rejected locally'):t('Til lokal vurdering','Awaiting local review');
      const m=draft('moderation-'+r.id,{reason:r.reason||'',appeal:r.appeal||''});
      return card(r.alias,`<p class="uw-tag">${r.room==='support'?t('Støtterom – modell','Support room — model'):t('Åpen samtale – modell','Open conversation — model')} · ${status}</p>${paragraph(r.body)}<details><summary>${t('Vurdering og ny gjennomgang','Review and reconsideration')}</summary><form data-form="moderation-${esc(r.id)}" data-id="${esc(r.id)}">${field('moderation-'+r.id,'reason',t('Begrunnelse (påkrevd ved avslag)','Reason (required for rejection)'),m.reason,'textarea',2000)}<div class="uw-actions">${button('moderate',t('Godkjenn lokalt','Approve locally'),`data-id="${esc(r.id)}" data-status="approved"`)}${button('moderate',t('Avvis med grunn','Reject with reason'),`data-id="${esc(r.id)}" data-status="rejected"`)}${button('moderate',t('Tilbake til kø','Return to queue'),`data-id="${esc(r.id)}" data-status="pending"`)}</div>${field('moderation-'+r.id,'appeal',t('Hvorfor bør innlegget vurderes på nytt?','Why should this post be reconsidered?'),m.appeal,'textarea',2000)}${button('appeal',t('Be om ny lokal vurdering','Request local reconsideration'),`data-id="${esc(r.id)}"`)}</form></details>${r.reason?`<p><strong>${t('Begrunnelse','Reason')}:</strong> ${esc(r.reason)}</p>`:''}${r.appeal?`<p><strong>${t('Anmodning om ny vurdering','Reconsideration request')}:</strong> ${esc(r.appeal)}</p>`:''}${actions('messages',r)}`);
    }).join(''):empty());
    return layout(form,list);
  }
  function studioContent() {
    const e=draft('event',state.event),d=draft('questions',{status:'queued'});
    const event=`<details class="uw-event"><summary>${t('Intervjuplan og samtykkesjekk','Interview plan and consent check')}</summary><form data-form="event">${field('event','title',t('Tema eller arbeidstittel','Topic or working title'),e.title,'text',200)}${field('event','guest',t('Foreslått gjest (artistnavn kan brukes)','Proposed guest (an artist name is fine)'),e.guest,'text',120)}${field('event','date',t('Foreslått dato','Proposed date'),e.date,'date')}${select('event','format',t('Planlagt format','Planned format'),[['recorded','Redigert opptak – plan','Edited recording — plan'],['live-planned','Mulig direktesamtale – plan','Possible live discussion — plan']],e.format)}<label class="uw-check"><input type="checkbox" name="consent" ${e.consent?'checked':''}>${t('Jeg har notert at samtykke må avklares før opptak eller publisering.','I have noted that consent must be addressed before recording or publishing.')}</label><button type="submit">${t('Lagre planen','Save plan')}</button></form><p class="uw-hint">${t('Dette er en plan. Ingen gjest inviteres, og kamera, opptak eller direktesending startes ikke.','This is a plan. No guest is invited and no camera, recording or live stream starts.')}</p></details>`;
    const form=`<h3>${t('Forbered en god samtale','Prepare a good conversation')}</h3>${event}<form data-form="questions">${field('questions','guest',t('Spørsmålet er til','Question for'),d.guest,'text',120)}${field('questions','question',t('Spørsmål','Question'),d.question,'textarea',4000,true)}${field('questions','answer',t('Svar eller samtalenotat','Answer or discussion note'),d.answer,'textarea')}${select('questions','status',t('Status','Status'),[['queued','I spørsmålslisten','In question list'],['answered','Svar notert','Answer recorded']],d.status)}${saveButton('questions')}</form>`;
    const list=countHeading(t('Spørsmålslisten','Question list'),state.questions.length)+(state.questions.length?state.questions.map(r=>card(r.guest||t('Åpent spørsmål','Open question'),`<p class="uw-tag">${r.status==='answered'?t('Svar notert','Answer recorded'):t('Venter på svar','Awaiting answer')}</p>${paragraph(r.question)}${r.answer?`<h4>${t('Svar / notat','Answer / note')}</h4>${paragraph(r.answer)}`:''}${actions('questions',r)}`)).join(''):empty());
    return layout(form,list);
  }
  function artContent() {
    const a=draft('art',state.art);let calc;
    try {calc=C.calculateArt(state.art);}catch {calc=null;}
    const fields=field('art','title',t('Verkets tittel','Artwork title'),a.title,'text',200)+field('art','artist',t('Kunstner / artistnavn','Artist / display name'),a.artist,'text',120)+field('art','license',t('Opphav, tillatelse og ønsket bruk','Authorship, permission and intended use'),a.license,'textarea',2000)+
      `<div class="uw-fieldgrid">${field('art','quantity',t('Antall i regneeksemplet','Units in the estimate'),a.quantity,'number',0,true,'min="1" max="10000" step="1"')}${field('art','price',t('Pris per enhet · kr','Price per unit · NOK'),a.price,'number',0,true,'min="0" max="1000000" step="0.01"')}${field('art','production',t('Produksjon per enhet · kr','Production per unit · NOK'),a.production,'number',0,true,'min="0" max="1000000" step="0.01"')}${field('art','taxReserve',t('Avsatt beløp per enhet · kr','Reserved amount per unit · NOK'),a.taxReserve,'number',0,true,'min="0" max="1000000" step="0.01"')}${field('art','platformPercent',t('Plattformandel av resten · %','Platform share of remainder · %'),a.platformPercent,'number',0,true,'min="0" max="100" step="0.01"')}</div>`;
    const result=calc?`<h3>${t('Fordeling i det lagrede regneeksemplet','Split in the saved estimate')}</h3><p>${t('Beløpene gjelder','Amounts cover')} ${state.art.quantity} ${t('enhet(er).','unit(s).')}</p><dl class="uw-dl"><dt>${t('Omsetning','Gross sales')}</dt><dd>${money(calc.priceOre*state.art.quantity)}</dd><dt>${t('Produksjon','Production')}</dt><dd>${money(calc.productionOre*state.art.quantity)}</dd><dt>${t('Avsatt','Reserved')}</dt><dd>${money(calc.taxReserveOre*state.art.quantity)}</dd><dt>${t('Til fordeling','Available to split')}</dt><dd>${money(calc.netOre*state.art.quantity)}</dd><dt>${t('Kunstneren','Artist')}</dt><dd>${money(calc.artistOre*state.art.quantity)}</dd><dt>${t('Plattformen','Platform')}</dt><dd>${money(calc.platformOre*state.art.quantity)}</dd></dl>${!calc.viable?`<p class="uw-error">${t('Kostnader og avsetning overstiger prisen. Ingen andel er fordelt; juster forutsetningene.','Costs and reserve exceed the price. No share is allocated; adjust the assumptions.')}</p>`:''}`:'';
    const preview=media?`<p>${esc(media.name)}</p>${media.type.startsWith('image/')?`<img class="uw-media-image" src="${esc(media.url)}" alt="${t('Lokal forhåndsvisning av valgt kunstfil','Local preview of selected artwork')}">`:`<audio controls preload="metadata" src="${esc(media.url)}"></audio>`}${button('remove-media',t('Fjern forhåndsvisning','Remove preview'))}`:`<p>${t('Velg et bilde eller et musikkstykke for å prøve uttrykket sammen med opphavskortet.','Choose an image or a music track to preview it alongside the attribution card.')}</p>`;
    return `<div class="uw-workgrid"><section class="uw-editor"><h3>${t('Fra verk til et åpent regnestykke','From artwork to a clear estimate')}</h3><form data-form="art">${fields}<p class="uw-hint">${t('Du fyller selv inn avsetning til avgifter, gebyrer eller andre kostnader. Dette er ikke en automatisk skatteberegning eller avtalt salg. Kunstneren beholder rettighetene.','Enter any reserve for taxes, fees or other costs yourself. This is not an automatic tax calculation or an agreed sale. The artist retains their rights.')}</p><button type="submit">${t('Lagre og beregn','Save and calculate')}</button></form></section><section class="uw-records">${card(t('Etter kostnader','After costs'),result)}${card(t('Se og lytt lokalt','Preview locally'),`<label for="uw-media">${t('Velg mediefil','Choose media file')}</label><input type="file" id="uw-media" accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/x-m4a"><p class="uw-hint">${t('JPG, PNG, WebP opptil 8 MB; MP3, WAV, OGG eller M4A opptil 25 MB. Filen lastes ikke opp og følger ikke med JSON-kopien. Velg den igjen når du fortsetter senere.','JPG, PNG, WebP up to 8 MB; MP3, WAV, OGG or M4A up to 25 MB. The file is not uploaded or included in the JSON copy. Select it again when resuming later.')}</p><div id="uw-media-preview">${preview}</div>`)}<a class="uw-link-card" href="${route('/bidrag/')}#community-create" target="_blank" rel="noopener noreferrer">${t('Gjør klart kunst- eller musikkbidrag →','Prepare an art or music contribution →')}</a><p class="uw-hint">${t('Bidragssiden har et eget innsendingsløp med innlogging og redaksjonell vurdering. Verkstedet sender ikke inn for deg.','The contribution page has its own sign-in and editorial submission process. The workshop does not submit for you.')}</p></section></div>`;
  }
  function aiContent() {
    const p=draft('prompt',state.prompt),out=C.buildPrompt(state.prompt,lang);
    return layout(`<h3>${t('Gi verktøyet en tydelig oppgave','Give the tool a clear task')}</h3><p>${t('Lag en arbeidsbeskjed du kan kontrollere og bruke i et verktøy du selv velger. Her kjøres ingen KI-modell.','Build instructions you can review and use in a tool of your choice. No AI model runs here.')}</p><form data-form="prompt">${select('prompt','task',t('Oppgave','Task'),[['ocr','Rett OCR-feil','Correct OCR errors'],['sources','Skill påstand fra kilde','Separate claim from source'],['write','Utvikle kapittelutkast','Develop a chapter draft']],p.task)}${field('prompt','goal',t('Hva vil du oppnå?','What do you want to achieve?'),p.goal,'textarea',2000)}${field('prompt','sources',t('Kildereferanser og forbehold','Source references and limitations'),p.sources,'textarea',6000)}${field('prompt','body',t('Ufølsom tekst eller oppgave','Non-sensitive text or task'),p.body,'textarea',12000)}<button type="submit">${t('Lag arbeidsbeskjed','Build instructions')}</button></form><details><summary>${t('Velge et KI-verktøy','Choosing an AI tool')}</summary><p>${t('LM Studio og Ollama er eksempler for datamaskin; PocketPal AI og Maid for telefon. Kontroller offisiell dokumentasjon, maskinkrav og modellkilde. Lokal behandling må faktisk være aktivert. Ikke kopier sensitive opplysninger til en ekstern tjeneste uten å kjenne vilkårene.','LM Studio and Ollama are examples for computers; PocketPal AI and Maid for phones. Check official documentation, device requirements and model sources. Local processing must actually be enabled. Do not copy sensitive information to an external service without understanding its terms.')}</p></details>`,card(t('Arbeidsbeskjeden','Your instructions'),`<pre class="uw-output" id="uw-prompt-output">${esc(out)}</pre><div class="uw-actions">${button('copy-prompt',t('Kopier','Copy'))}${button('download-prompt',t('Last ned tekst','Download text'))}</div><p class="uw-hint">${t('Kontroller svar mot originalkildene. En arbeidsbeskjed er ikke et utført analyseoppdrag.','Check answers against original sources. Generated instructions are not a completed analysis.')}</p>`));
  }
  function logContent() {
    const d=draft('logs');
    const form=`<h3>${t('Bevar det som faktisk skjedde','Record what actually happened')}</h3><p>${t('Registrer hver hendelse og kontrollforsøk separat. Loggen fastslår ikke hvem som er ansvarlig eller hvorfor en nettfeil oppstår.','Record each event and check separately. The log does not establish responsibility or the cause of a network error.')}</p><form data-form="logs">${field('logs','datetime',t('Dato og tidspunkt','Date and time'),d.datetime,'datetime-local')}${field('logs','url',t('URL eller tjeneste (vises som tekst)','URL or service (displayed as text)'),d.url,'text',500)}${field('logs','device',t('Enhet og nettverk','Device and network'),d.device,'text',300)}${field('logs','error',t('Observasjon / nøyaktig feilmelding','Observation / exact error message'),d.error,'textarea',4000,true)}${field('logs','checks',t('Hva ble prøvd, og hvilke andre forklaringer finnes?','What was checked, and what other explanations are possible?'),d.checks,'textarea')}${field('logs','response',t('Oppfølging, saksreferanse og mottatt svar','Follow-up, reference and response received'),d.response,'textarea')}${saveButton('logs')}</form>`;
    const list=countHeading(t('Mine loggnotater','My log entries'),state.logs.length)+(state.logs.length?state.logs.slice().sort((a,b)=>a.datetime.localeCompare(b.datetime)).map(r=>card(r.datetime||t('Tidspunkt ikke oppgitt','Time not entered'),`<p class="uw-tag">${esc(r.url)} · ${esc(r.device)}</p>${paragraph(r.error)}<h4>${t('Kontrollforsøk / alternative forklaringer','Checks / alternative explanations')}</h4>${paragraph(r.checks)}<h4>${t('Oppfølging','Follow-up')}</h4>${paragraph(r.response)}${actions('logs',r)}`)).join(''):empty());
    return layout(form,list);
  }
  function roadmapContent() {
    const s=C.summarize(state);
    const stats=[[s.cases,t('sakskort','case cards')],[s.proposals,t('forslag','proposals')],[s.pendingMessages,t('innlegg i lokal kø','posts in local queue')],[s.answeredQuestions,t('svar notert','answers recorded')],[s.logs,t('loggnotater','log entries')]];
    return `<h3>${t('Arbeidet ditt, samlet','Your work, together')}</h3><p>${t('Tallene viser bare kortene i denne lokale arbeidsbenken. De er ikke offentlige deltakertall, stemmetall eller funn av lovbrudd.','These counts cover only cards in this local workspace. They are not public participation totals, vote counts or findings of legal violations.')}</p><div class="uw-metrics">${stats.map(([n,l])=>`<div><strong>${n}</strong><span>${l}</span></div>`).join('')}</div><div class="uw-grid">${card(t('1. Samle og kontrollere','1. Collect and check'),`<p>${t('Sakskort med kildehenvisning, sitat, motbelegg og spørsmål.','Case cards with source references, quotations, counterevidence and questions.')}</p><p>${s.preparedCases} / ${s.cases} ${t('merket klargjort av deg.','marked prepared by you.')}</p>`)}${card(t('2. Formulere og lytte','2. Propose and listen'),`<p>${s.proposals} ${t('forslag og','proposals and')} ${s.questions} ${t('intervjuspørsmål. Endre eller trekk tilbake lokale valg under Forslag.','interview questions. Change or withdraw local choices under Proposals.')}</p>`)}${card(t('3. Gjøre klart for ansvarlig gjennomgang','3. Prepare for responsible review'),`<p>${t('Last ned arbeidskopien. Avklar hvem som skal lese den, hvilke opplysninger som kan deles, og hvilket tilsvar som må innhentes.','Download a working copy. Decide who should read it, which details can be shared and what responses should be sought.')}</p>`)}${card(t('4. Åpne tjenester krever egne avtaler','4. Public services need separate arrangements'),`<p>${t('Verifiserte avstemninger, bemannede støtterom, arrangementer og salg er ikke aktivert. Ingen organisasjon, gjest eller advokat er tilkoblet av verkstedet.','Verified voting, staffed support rooms, events and sales are not enabled. No organisation, guest or lawyer has been connected by the workshop.')}</p>`)}</div><h3 class="uw-section-title">${t('Fortsett med dokumentene','Continue working with documents')}</h3><div class="uw-grid"><a class="uw-link-card" href="/maite/" target="_blank" rel="noopener noreferrer">MAITE · ${t('arbeid med egen sak','work on your own case (Norwegian)')} →<span>${t('Dokumentregister, kronologi og sidehenvisninger. Eget lokalt arbeidsrom på norsk.','Document register, timeline and page references. Separate local workspace in Norwegian.')}</span></a><a class="uw-link-card" href="/rettsspeil/" target="_blank" rel="noopener noreferrer">Rettsspeil · ${t('se hvordan gjennomgang kan følges','explore review progress (Norwegian)')} →<span>${t('Samlet oversikt med tydelig merkede testdata. Verkstedskort sendes ikke dit.','An overview with clearly labelled test data. Workshop cards are not sent there.')}</span></a></div>`;
  }
  function content() { if(backupMode)return backupContent();return (['policy','forum','roadmap'].includes(tab)?communityLink():'')+({sources:caseContent,policy:policyContent,forum:forumContent,studio:studioContent,art:artContent,ai:aiContent,log:logContent,roadmap:roadmapContent}[tab] || caseContent)(); }
  function shell() {
    const s=C.summarize(state);
    return `<div class="uw-shell"><header class="uw-head"><div><span class="uw-eyebrow">STEMMEN FRA INNSIDEN · INNSATT 2601-46</span><h2>${t('Verkstedet','The workshop')}</h2><p>${t('Fra en tanke til et utkast du kan arbeide videre med.','From a thought to a draft you can develop.')}</p></div><div class="uw-head-actions">${button('language',lang==='en'?'🇳🇴 Norsk':'🇬🇧 English','class="uw-language"')}${button('close','×',`class="uw-close" aria-label="${t('Lukk verkstedet','Close the workshop')}"`)}</div></header><div class="uw-toolbar" aria-label="${t('Arbeidskopi','Working copy')}">${button('export-encrypted',t('Passordbeskyttet kopi · anbefalt','Password-protected copy · recommended'),'class="uw-recommended"')}${button('export-json',t('JSON · ukryptert','JSON · unencrypted'))}${button('import',t('Åpne arbeidskopi','Open working copy'))}${button('export-text',t('Tekst · ukryptert','Text · unencrypted'))}${button('clear',t('Tøm verkstedet','Clear workspace'),'class="uw-subtle"')}<input type="file" id="uw-import" accept="application/json,.json" hidden><p>${t('Arbeidet finnes bare i minnet på denne siden. Legg til eller lagre kort før nedlasting. Velg passordbeskyttet kopi for kryptering; vanlig JSON og tekst er ukryptert.','Work stays only in this page’s memory. Add or save cards before downloading. Choose a password-protected copy for encryption; plain JSON and text are unencrypted.')}</p></div><nav class="uw-tabs" role="tablist" aria-label="${t('Verkstedets deler','Workshop sections')}">${tabs.map(([id,no,en])=>`<button id="uw-tab-${id}" role="tab" type="button" data-action="tab" data-tab="${id}" aria-selected="${tab===id}" aria-controls="uw-panel" tabindex="${tab===id?'0':'-1'}">${t(no,en)}</button>`).join('')}</nav><div class="uw-feedback ${noticeError?'uw-error':''}" id="uw-feedback" tabindex="-1" role="status" aria-live="polite">${esc(notice)}</div><div class="uw-panel" id="uw-panel" role="tabpanel" aria-labelledby="uw-tab-${tab}" tabindex="0">${content()}</div><footer><strong>${s.totalRecords} ${t('lagrede lokale kort','saved local cards')}</strong><span>${t('Lokal arbeidsbenk · Ingen innsending, offentlig avstemning, BankID eller betaling.','Local workspace · No submissions, public voting, BankID or payments.')}</span></footer></div>`;
  }
  function render(focusId) {
    if(!dialog)return;
    const oldScroll=dialog.querySelector('.uw-panel')?.scrollTop||0;
    const previousFocus=focusId||(dialog.contains(document.activeElement)?document.activeElement.id:'');
    pauseMedia();
    dialog.setAttribute('lang',lang==='en'?'en':'nb');
    dialog.setAttribute('aria-label',t('Verkstedet · lokal arbeidsbenk','The workshop · local workspace'));
    dialog.innerHTML=shell();
    if(backupMode)dialog.querySelectorAll('.uw-toolbar button,.uw-tabs button,#uw-import,[data-action="language"]').forEach(b=>{b.disabled=true;});
    const focusTarget=previousFocus?dialog.querySelector('#'+CSS.escape(previousFocus)):null;
    if(focusTarget)focusTarget.focus();else if(notice)dialog.querySelector('#uw-feedback').focus();else dialog.querySelector('#uw-tab-'+tab)?.focus();
    dialog.querySelector('.uw-panel').scrollTop=oldScroll;
  }
  function setNotice(no,en,error=false) {notice=t(no,en);noticeError=error;}
  function reportError(error) {
    const code=error?.code||'';
    if(/limit|large|size|capacity/i.test(code))setNotice('Grensen er nådd. Kontroller filstørrelse, tekstlengde og maks 50 kort per område.','A limit was reached. Check file size, text length and the maximum of 50 cards per section.',true);
    else setNotice('Kunne ikke lagre eller åpne dette. Kontroller påkrevde felt, datoer, tall og filformat. Arbeidet som var lagret fra før er beholdt.','Could not save or open this. Check required fields, dates, numbers and file format. Previously saved work has been preserved.',true);
    render();dialog?.querySelector('#uw-feedback')?.scrollIntoView({block:'nearest'});
  }
  function download(text,name,type='text/plain;charset=utf-8') {
    const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function readable() {
    const lines=[t('VERKSTEDET · LOKAL ARBEIDSKOPI','WORKSHOP · LOCAL WORKING COPY'),t('Ingen del av denne kopien er sendt eller publisert. Status er egen arbeidsmerking.','Nothing in this copy has been sent or published. Status labels are personal work labels.'),''];
    const headings={cases:t('SAKSKORT','CASE CARDS'),proposals:t('FORSLAG','PROPOSALS'),messages:t('LOKALE SAMTALEUTKAST','LOCAL CONVERSATION DRAFTS'),questions:t('INTERVJUSPØRSMÅL','INTERVIEW QUESTIONS'),logs:t('BEVISLOGG','EVIDENCE LOG')};
    const labels={title:t('Tittel','Title'),experience:t('Opplevelse','Account'),source:t('Kilde','Source'),excerpt:t('Sitat','Quotation'),missing:t('Mangler / motbelegg','Missing / counterevidence'),response:t('Tilsvar / oppfølging','Response / follow-up'),date:t('Dato','Date'),status:t('Arbeidsstatus','Work status'),problem:t('Problem','Problem'),change:t('Foreslått endring','Proposed change'),rationale:t('Begrunnelse','Rationale'),vote:t('Lokalt valg','Local choice'),alias:t('Visningsnavn','Display name'),room:t('Rommodell','Room model'),body:t('Tekst','Text'),reason:t('Begrunnelse','Reason'),appeal:t('Ny vurdering','Reconsideration'),guest:t('Gjest','Guest'),question:t('Spørsmål','Question'),answer:t('Svar','Answer'),datetime:t('Tidspunkt','Time'),url:'URL',device:t('Enhet','Device'),error:t('Observasjon','Observation'),checks:t('Kontrollforsøk','Checks')};
    const values={draft:t('Under arbeid','In progress'),prepared:t('Klargjort av meg','Prepared by me'),pending:t('Til lokal vurdering','Awaiting local review'),approved:t('Godkjent lokalt','Approved locally'),rejected:t('Avvist lokalt','Rejected locally'),queued:t('I spørsmålslisten','In question list'),answered:t('Svar notert','Answer recorded'),support:t('Støtte','Support'),against:t('Uenighet','Disagreement'),open:t('Åpen samtale – modell','Open conversation — model')};
    for(const [type,heading]of Object.entries(headings)){lines.push(heading);for(const [i,r]of state[type].entries()){lines.push(`— ${i+1} —`);for(const[k,v]of Object.entries(r))if(k!=='id'&&v!==''&&v!==null){const value=k==='room'&&v==='support'?t('Støtterom – modell','Support room — model'):['status','vote','room'].includes(k)?values[v]||v:v;lines.push(`${labels[k]||k}: ${value}`);}}lines.push('');}
    const e=state.event,a=state.art,c=C.calculateArt(a);
    lines.push(t('INTERVJUPLAN','INTERVIEW PLAN'),`${labels.title}: ${e.title}`,`${labels.guest}: ${e.guest}`,`${labels.date}: ${e.date}`,`${t('Format','Format')}: ${e.format==='recorded'?t('Redigert opptak – plan','Edited recording — plan'):t('Mulig direktesamtale – plan','Possible live discussion — plan')}`,`${t('Behov for samtykkesjekk notert','Need for consent check noted')}: ${e.consent?t('Ja','Yes'):t('Nei','No')}`,'',t('KUNST OG REGNEEKSEMPEL','ART AND ESTIMATE'),`${labels.title}: ${a.title}`,`${t('Kunstner','Artist')}: ${a.artist}`,`${t('Opphav og ønsket bruk','Authorship and intended use')}: ${a.license}`,`${t('Antall','Units')}: ${a.quantity}`,`${t('Plattformandel av resten','Platform share of remainder')}: ${a.platformPercent}%`);
    for(const [name,key]of [[t('Pris','Price'),'priceOre'],[t('Produksjon','Production'),'productionOre'],[t('Avsatt beløp','Reserved amount'),'taxReserveOre'],[t('Til fordeling','Available to split'),'netOre'],[t('Kunstneren','Artist'),'artistOre'],[t('Plattformen','Platform'),'platformOre']])lines.push(`${name}: ${money(c[key])} ${t('per enhet','per unit')} · ${money(c[key]*a.quantity)} ${t('samlet','total')}`);
    if(!c.viable)lines.push(t('Kostnader og avsetning overstiger prisen. Ingen andel er fordelt.','Costs and reserve exceed the price. No share is allocated.'));
    lines.push(t('Ingen betaling eller avtalt salg. Dette er ikke en skatteberegning.','No payment or agreed sale. This is not a tax calculation.'),'',t('ARBEIDSBESKJED','INSTRUCTIONS'),C.buildPrompt(state.prompt,lang));
    return lines.join('\n');
  }
  function removeMedia(){if(media){URL.revokeObjectURL(media.url);media=null;}}
  function wipe(){++importSequence;resetBackup();state=C.createState();drafts={};editing={};touched=false;removeMedia();}
  function askReplace(){return window.confirm(t('Erstatt alt arbeid i verkstedet? Last ned det du vil beholde først. Dette gjelder også felter du ikke har lagret.','Replace all work in the workshop? Download anything you want to keep first. This includes fields you have not saved.'));}
  async function onClick(event) {
    const b=event.target.closest('button[data-action]');if(!b||!dialog?.contains(b))return;
    const action=b.dataset.action;++importSequence;capture();
    try{
      if(action==='close'){destroy();return;}
      if(action==='cancel-backup'){resetBackup();setNotice('Arbeidet med kopien er avbrutt. Eksisterende innhold er beholdt.','Copy operation cancelled. Existing content has been preserved.');render();return;}
      if(backupMode)return;
      if(action==='export-encrypted'){if(!confirmExport())return;backupMode={kind:'encrypt'};notice='';render('uw-backup-password');return;}
      if(action==='tab'){tab=b.dataset.tab;notice='';render('uw-tab-'+tab);dialog.querySelector('.uw-panel').scrollTop=0;return;}
      if(action==='language'){lang=lang==='en'?'no':'en';notice='';render();dialog.querySelector('[data-action="language"]').focus();return;}
      if(action==='export-json'){if(!confirmExport())return;download(C.serialize(state),'stemmen-verksted-arbeidskopi.json','application/json');setNotice('Arbeidskopien er lastet ned. Kort som ikke er lagt til eller lagret, er ikke med.','Working copy downloaded. Cards not added or saved are not included.');render();return;}
      if(action==='export-text'){if(!confirmExport())return;download(readable(),'stemmen-verksted-lesekopi.txt');setNotice('Lesekopien er lastet ned. Bruk JSON-arbeidskopien for å fortsette i verkstedet senere.','Readable copy downloaded. Use the JSON working copy to resume in the workshop later.');render();return;}
      if(action==='import'){dialog.querySelector('#uw-import').click();return;}
      if(action==='clear'){if(!askReplace())return;wipe();setNotice('Verkstedet er tømt. Nedlastede filer på enheten er ikke slettet.','Workspace cleared. Files already downloaded to your device have not been deleted.');render();return;}
      if(action==='edit'){const r=state[b.dataset.type].find(x=>x.id===b.dataset.id);if(!r)return;editing[b.dataset.type]=r.id;drafts[b.dataset.type]={...r};notice='';render();dialog.querySelector(`form[data-form="${b.dataset.type}"] input,form[data-form="${b.dataset.type}"] textarea`)?.focus();return;}
      if(action==='cancel-edit'){delete editing[b.dataset.type];delete drafts[b.dataset.type];render();return;}
      if(action==='delete'){if(!window.confirm(t('Slette dette kortet fra arbeidskopien?','Delete this card from the working copy?')))return;state=C.deleteRecord(state,b.dataset.type,b.dataset.id);if(editing[b.dataset.type]===b.dataset.id){delete editing[b.dataset.type];delete drafts[b.dataset.type];}delete drafts['moderation-'+b.dataset.id];setNotice('Kortet er slettet lokalt.','Card deleted locally.');render();return;}
      if(action==='vote'){state=C.vote(state,b.dataset.id,b.dataset.choice==='withdraw'?null:b.dataset.choice);setNotice('Det lokale valget er oppdatert. Ingen stemme er sendt.','Local choice updated. No vote was submitted.');render();return;}
      if(action==='moderate'){const r=drafts['moderation-'+b.dataset.id]||{};if(b.dataset.status==='rejected'&&!String(r.reason||'').trim()){setNotice('Skriv en begrunnelse før du avviser innlegget.','Enter a reason before rejecting the post.',true);render();return;}state=C.moderate(state,b.dataset.id,b.dataset.status,r.reason||'');delete drafts['moderation-'+b.dataset.id];setNotice('Den lokale vurderingen er oppdatert.','Local review updated.');render();return;}
      if(action==='appeal'){const r=state.messages.find(x=>x.id===b.dataset.id),d=drafts['moderation-'+b.dataset.id]||{};if(!String(d.appeal||'').trim()){setNotice('Skriv hvorfor innlegget bør vurderes på nytt.','Explain why the post should be reconsidered.',true);render();return;}state=C.upsertRecord(state,'messages',{...r,appeal:d.appeal});state=C.moderate(state,b.dataset.id,'pending',r.reason);delete drafts['moderation-'+b.dataset.id];setNotice('Anmodningen er lagt til, og innlegget er tilbake i den lokale køen.','Request added; the post is back in the local queue.');render();return;}
      if(action==='copy-prompt'){const value=C.buildPrompt(state.prompt,lang);try{await navigator.clipboard.writeText(value);setNotice('Arbeidsbeskjeden er kopiert.','Instructions copied.');}catch{setNotice('Kopiering er ikke tilgjengelig. Marker teksten eller last ned tekstfilen.','Copying is unavailable. Select the text or download the text file.');}render();return;}
      if(action==='download-prompt'){download(C.buildPrompt(state.prompt,lang),'stemmen-arbeidsbeskjed.txt');return;}
      if(action==='remove-media'){removeMedia();render();return;}
    }catch(error){reportError(error);}
  }
  function onSubmit(event) {
    if(event.target.matches('form[data-backup-form]')){event.preventDefault();submitBackup(event.target);return;}
    if(backupMode){event.preventDefault();return;}
    const form=event.target.closest('form[data-form]');if(!form||!dialog?.contains(form))return;event.preventDefault();++importSequence;capture();
    const type=form.dataset.form,data={...drafts[type]};
    try{
      if(['art','prompt','event'].includes(type)){
        if(type==='art')for(const k of ['quantity','price','production','taxReserve','platformPercent'])data[k]=Number(data[k]);
        state=C.updateSettings(state,type,data);delete drafts[type];
      }else if(['cases','proposals','messages','questions','logs'].includes(type)){
        const id=editing[type];const existing=id?state[type].find(x=>x.id===id):null;
        const allowed={cases:['title','experience','source','excerpt','missing','response','date','status'],proposals:['title','problem','change','rationale'],messages:['alias','room','body'],questions:['guest','question','answer','status'],logs:['datetime','url','device','error','checks','response']}[type];
        const record={...(existing||{})};for(const name of allowed)record[name]=data[name]||'';if(id)record.id=id;
        state=C.upsertRecord(state,type,record);delete drafts[type];delete editing[type];if(type==='messages'&&id)delete drafts['moderation-'+id];
      }else return;
      setNotice('Lagret i denne sidens minne. Last ned arbeidskopien før du forlater siden.','Saved in this page’s memory. Download the working copy before leaving.');render();
    }catch(error){reportError(error);}
  }
  async function onChange(event) {
    if(backupMode)return;
    if(event.target.id==='uw-import'){
      const file=event.target.files?.[0];event.target.value='';if(!file)return;const sequence=++importSequence;
      try{
        const B=window.WorkshopBackup,maxBytes=B?.MAX_FILE_BYTES||3*1024*1024;
        if(file.size>maxBytes)throw Object.assign(new Error('Too large'),{code:'size'});
        const text=await file.text();if(sequence!==importSequence||!dialog)return;
        if(B?.isEncryptedEnvelope(text)){capture();backupMode={kind:'decrypt',text,name:file.name};notice='';render('uw-backup-password');return;}
        const next=C.parse(text);if(!askReplace())return;wipe();state=next;setNotice('Arbeidskopien er åpnet. Mediefiler må velges på nytt.','Working copy opened. Select media files again.');render();
      }catch(error){if(sequence===importSequence)reportError(error);}return;
    }
    ++importSequence;
    if(event.target.id==='uw-media'){
      const file=event.target.files?.[0];if(!file)return;capture();
      const images=['image/jpeg','image/png','image/webp'],audio=['audio/mpeg','audio/mp3','audio/wav','audio/x-wav','audio/ogg','audio/mp4','audio/x-m4a'];const image=images.includes(file.type),sound=audio.includes(file.type);
      if((!image&&!sound)||file.size>(image?8:25)*1024*1024||file.size===0){setNotice('Velg et støttet bilde opptil 8 MB eller lydfil opptil 25 MB. Forrige forhåndsvisning er beholdt.','Choose a supported image up to 8 MB or audio file up to 25 MB. The previous preview is preserved.',true);render();return;}
      removeMedia();touched=true;media={url:URL.createObjectURL(file),name:file.name,type:file.type};notice='';render();return;
    }
    touched=true;capture();
  }
  function onKey(event){
    if(!dialog)return;
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();destroy();return;}
    if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key)&&document.activeElement?.matches('.uw-tabs [role="tab"]')){
      event.preventDefault();++importSequence;capture();let index=tabs.findIndex(x=>x[0]===tab);index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tab=tabs[index][0];notice='';render('uw-tab-'+tab);return;
    }
    if(event.key==='Tab'){
      const nodes=[...dialog.querySelectorAll('button:not([disabled]):not([tabindex="-1"]), input:not([hidden]):not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], summary, [tabindex="0"]')].filter(x=>x.getClientRects().length&&!x.closest('[hidden]'));
      const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  }
  function detectLanguage(){const preview=window.__existingPreview?.route;const active=document.querySelector('[data-premium-route]')?.dataset.premiumRoute;const path=preview||active||location.pathname;return path.startsWith('/en/')||(!preview&&!active&&document.documentElement.lang==='en')?'en':'no';}
  function destroy(){if(!dialog)return;++importSequence;capture();resetBackup();pauseMedia();dialog.removeEventListener('click',onClick);dialog.removeEventListener('submit',onSubmit);dialog.removeEventListener('input',onInput);dialog.removeEventListener('change',onChange);dialog.removeEventListener('keydown',onKey);dialog.close();dialog.remove();dialog=null;if(returnFocus?.isConnected)returnFocus.focus();}
  function open(requestedTab){
    if(dialog){++importSequence;capture();resetBackup();lang=detectLanguage();if(tabs.some(x=>x[0]===requestedTab))tab=requestedTab;render('uw-tab-'+tab);return;}
    returnFocus=document.activeElement;lang=detectLanguage();if(tabs.some(x=>x[0]===requestedTab))tab=requestedTab;
    dialog=document.createElement('dialog');dialog.className='unified-workshop';document.body.append(dialog);render();
    dialog.addEventListener('click',onClick);dialog.addEventListener('submit',onSubmit);dialog.addEventListener('input',onInput);dialog.addEventListener('change',onChange);dialog.addEventListener('keydown',onKey);dialog.addEventListener('cancel',event=>{event.preventDefault();destroy();});dialog.showModal();dialog.querySelector('[data-action="close"]').focus();
  }
  window.addEventListener('beforeunload',event=>{capture();if(hasPendingFields()||media||C.serialize(state)!==C.serialize(C.createState())){event.preventDefault();event.returnValue='';}});
  window.UnifiedWorkshop={open,destroy,getState:()=>({tab,lang,workspace:JSON.parse(C.serialize(state)),drafts:JSON.parse(JSON.stringify(drafts)),hasMedia:!!media})};
})();
