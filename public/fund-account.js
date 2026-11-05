/* Dated aggregate account reporting. No bank, donor or payment API. */
(() => {
  'use strict';
  const root=document.getElementById('fund-root');
  if(!root)return;
  const en=document.documentElement.lang==='en',lang=en?'en':'no',reporting=document.body.dataset.fundMode==='report';
  const publicPath=en?'/en/lawyer-account/':'/advokatkonto/';
  const reportPath=en?'/en/lawyer-account/report/':'/advokatkonto/rapport/';
  const words={
    no:{loading:'Henter siste kontorapport …',none:'Ingen bekreftet kontorapport ennå',noneText:'Her vises beløp først når en datert kontorapport er registrert. Manglende rapport betyr ikke at saldoen er null.',unavailable:'Kontorapporten kunne ikke hentes. Ingen beløp blir beregnet eller antatt.',refresh:'Hent siste rapport',received:'Bekreftet innbetalt',receivedNote:'Bekreftet av kontorapportøren. Samlet innbetalt frem til rapportdatoen.',available:'Disponibelt',disbursed:'Brukt',refunded:'Refundert',availableHelp:'Innbetalt minus brukt og refundert.',goal:'Finansieringsmål',towardGoal:'Disponibelt mot finansieringsmål',of:'av',asOf:'Sist bekreftet per',recorded:'Registrert',version:'Rapportversjon',dated:'Dette er en datert kontorapport, ikke en direktesaldo fra banken. Senere inn- og utbetalinger kan ha endret beløpene.',stale:'Rapportdatoen er mer enn 30 dager gammel. Les beløpene sammen med datoen.',paused:'Rapporteringen er satt på pause. Den siste daterte rapporten er fortsatt synlig.',goalNote:'Målet er et innsamlingsmål. Det sier ikke noe om juridisk sannsynlighet og utløser ingen automatisk bruk av penger.',signIn:'Logg inn',signOut:'Logg ut',notSigned:'Logg inn for å kontrollere om du har tilgang som kontorapportør.',forbidden:'Kontoen din har ikke tilgang som kontorapportør. Redaksjonstilgang gir ikke denne rollen.',role:'Du har tilgang til å registrere kontorapporter.',disabled:'Registrering av kontorapporter er ikke åpnet.',pausedWrite:'Nye rapporter kan ikke registreres mens rapporteringen er satt på pause.',viewPublic:'Se offentlig kontovisning',formHeading:'Samlede kontobeløp',formHelp:'Oppgi totale beløp frem til rapportdatoen, ikke bare endringen siden forrige rapport. Bruk kroner og øre, uten tusenskille.',first:'Dette blir den første registrerte kontorapporten.',baseline:'Grunnlaget ditt er rapportversjon',newDate:'Velg dato og klokkeslett for når beløpene er avstemt.',totalReceived:'Samlet innbetalt (NOK)',totalDisbursed:'Samlet brukt (NOK)',totalRefunded:'Samlet refundert (NOK)',goalField:'Finansieringsmål (NOK)',dateField:'Avstemt per dato og klokkeslett',timezone:'Klokkeslettet angis i tidssonen',reconciled:'Jeg bekrefter at samletallene er avstemt mot kontoens regnskap/bankopplysninger for den oppgitte datoen.',correction:'Dette er en uttrykkelig korrigering av tidligere rapporterte samletall.',correctionReason:'Forklaring til korrigeringen (privat)',correctionHelp:'10–1000 tegn. Beskriv bare regnskapskorrigeringen. Ikke skriv givernavn, kontonummer eller andre private bankopplysninger. Forklaringen publiseres ikke.',preview:'Forhåndsvis samletallene',previewHeading:'Forhåndsvisning – ikke registrert',previewNote:'Dette er opplysningene som blir synlige. Den private korrigeringsforklaringen vises ikke her. Kontroller beløp, dato og mål før du registrerer.',confirm:'Bekreft og registrer rapporten',edit:'Tilbake til feltene',saved:'Rapporten er registrert.',savedRefreshFailed:'Rapporten er registrert, men siste rapport kunne ikke hentes. Hent den før du registrerer noe mer.',saving:'Registrerer kontorapport …',refreshed:'Siste rapport er hentet.',reload:'Hent siste rapport som nytt grunnlag',reloadConfirm:'Vil du erstatte feltene med den siste rapporten? Usendte endringer slettes. Hvis en tidligere registrering ikke ble bekreftet, kontroller siste rapport før du registrerer på nytt.',previewInvalidated:'Feltene er endret. Forhåndsvis rapporten på nytt før registrering.',moneyInvalid:'Bruk et ikke-negativt kronebeløp med høyst to desimaler, uten tusenskille.',goalInvalid:'Innsamlingsmålet må være større enn null.',balanceInvalid:'Brukt og refundert kan ikke samlet være større enn innbetalt.',dateInvalid:'Velg en gyldig dato og et klokkeslett som ikke er i fremtiden.',dateEarlier:'Rapportdatoen kan ikke være tidligere enn den siste rapporten.',reconcileRequired:'Bekreft at tallene er avstemt før du forhåndsviser.',decrease:'Et samlet beløp er lavere enn før. Velg uttrykkelig korrigering og forklar endringen hvis dette er riktig.',correctionFirst:'Den første rapporten kan ikke være en korrigering av en tidligere rapport.',reasonInvalid:'En korrigering krever en privat forklaring på 10–1000 tegn.',conflict:'En nyere rapport er registrert. Feltene dine er beholdt. Hent og gjennomgå siste rapport som nytt grunnlag før du prøver igjen.',uncertain:'Registreringen kunne ikke bekreftes. Feltene og innsendingsreferansen er beholdt. Du kan prøve den samme registreringen igjen eller hente siste rapport og kontrollere status.',changedUncertain:'En tidligere registrering er ikke avklart. Prøv samme forhåndsvisning igjen, eller hent siste rapport som nytt grunnlag før du endrer innsendingen.',authRequired:'Du må logge inn som den utpekte kontorapportøren. Feltene er beholdt.',invalid:'Kontroller beløp, dato og avkryssinger. Feltene er beholdt.',privateRole:'Tilgangsrollen gjelder rapportering og er ikke i seg selv en bekreftelse på advokatstatus eller bankfullmakt.',publicHeading:'Siste registrerte rapport',noLegalGate:'Rapportering av innsamlede beløp krever ingen forhåndsvurdering av en rettssak.',previewBalance:'Beregnet disponibelt',publicOnly:'Bare samletall og rapportdato blir synlige for leserne.'},
    en:{loading:'Loading the latest account report …',none:'No confirmed account report yet',noneText:'Amounts appear here only after a dated account report has been recorded. A missing report does not mean that the balance is zero.',unavailable:'The account report could not be retrieved. No amounts are calculated or assumed.',refresh:'Retrieve latest report',received:'Confirmed received',receivedNote:'Confirmed by the account reporter. Total received up to the reporting date.',available:'Available',disbursed:'Disbursed',refunded:'Refunded',availableHelp:'Received minus disbursed and refunded.',goal:'Funding goal',towardGoal:'Available toward the funding goal',of:'of',asOf:'Last confirmed as of',recorded:'Recorded',version:'Report version',dated:'This is a dated account report, not a live bank balance. Later receipts and payments may have changed the amounts.',stale:'The reporting date is more than 30 days old. Read the amounts together with the date.',paused:'Reporting is paused. The last dated report remains visible.',goalNote:'This is a fundraising goal. It does not indicate legal likelihood or trigger any automatic use of money.',signIn:'Sign in',signOut:'Sign out',notSigned:'Sign in to check whether you have account reporting access.',forbidden:'Your account does not have account reporting access. Editorial access does not grant this role.',role:'You have permission to record account reports.',disabled:'Account reporting has not been opened.',pausedWrite:'New reports cannot be recorded while reporting is paused.',viewPublic:'View public account summary',formHeading:'Cumulative account amounts',formHelp:'Enter total amounts up to the reporting date, not just the change since the previous report. Use NOK and øre, without grouping separators.',first:'This will be the first recorded account report.',baseline:'Your starting point is report version',newDate:'Choose the date and time when the amounts were reconciled.',totalReceived:'Total received (NOK)',totalDisbursed:'Total disbursed (NOK)',totalRefunded:'Total refunded (NOK)',goalField:'Funding goal (NOK)',dateField:'Reconciled as of date and time',timezone:'Enter the time in this time zone',reconciled:'I confirm that these aggregate figures have been reconciled with the account records/bank information for the stated date.',correction:'This is an explicit correction of previously reported aggregate amounts.',correctionReason:'Explanation of correction (private)',correctionHelp:'10–1000 characters. Describe only the accounting correction. Do not enter donor names, account numbers or other private banking information. This explanation is not published.',preview:'Preview aggregate figures',previewHeading:'Preview — not recorded',previewNote:'These are the details readers will see. The private correction explanation is not displayed here. Check amounts, date and goal before recording.',confirm:'Confirm and record report',edit:'Return to fields',saved:'The report has been recorded.',savedRefreshFailed:'The report has been recorded, but the latest report could not be retrieved. Retrieve it before recording anything else.',saving:'Recording account report …',refreshed:'The latest report has been retrieved.',reload:'Use latest report as a new starting point',reloadConfirm:'Replace the fields with the latest report? Unsubmitted changes will be cleared. If an earlier submission was not confirmed, check the latest report before recording another.',previewInvalidated:'The fields have changed. Preview the report again before recording.',moneyInvalid:'Use a non-negative NOK amount with up to two decimal places, without grouping separators.',goalInvalid:'The funding goal must be greater than zero.',balanceInvalid:'Disbursements and refunds together cannot exceed receipts.',dateInvalid:'Choose a valid date and time that is not in the future.',dateEarlier:'The reporting date cannot precede the latest report.',reconcileRequired:'Confirm reconciliation before previewing.',decrease:'A cumulative amount is lower than before. Select an explicit correction and explain the change if this is intended.',correctionFirst:'The first report cannot correct an earlier report.',reasonInvalid:'A correction requires a private explanation of 10–1000 characters.',conflict:'A newer report has been recorded. Your fields have been kept. Retrieve and review the latest report as a new starting point before retrying.',uncertain:'The submission could not be confirmed. Your fields and submission reference have been kept. Retry the same report or retrieve the latest report to check its status.',changedUncertain:'An earlier submission is unresolved. Retry the same preview, or retrieve the latest report as a new starting point before changing the submission.',authRequired:'Sign in as the designated account reporter. Your fields have been kept.',invalid:'Check the amounts, date and confirmations. Your fields have been kept.',privateRole:'This access role concerns reporting. It is not itself proof of legal qualifications or bank authority.',publicHeading:'Latest recorded report',noLegalGate:'Reporting money raised does not require a prior assessment of a lawsuit.',previewBalance:'Calculated available amount',publicOnly:'Only aggregate figures and the reporting date will be visible to readers.'}
  };
  const t=key=>words[lang][key]||key;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  const timezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
  let current=null,me=null,busy=false,ready=false,dirty=false,preview=null,attempt=null;
  function fail(code){throw Object.assign(new Error(code),{code});}
  function parseMoney(value){
    if(typeof value!=='string'||! /^(?:0|[1-9]\d{0,13})(?:[.,]\d{1,2})?$/.test(value.trim()))fail('moneyInvalid');
    const [whole,fraction='']=value.trim().replace(',','.').split('.');
    const minor=BigInt(whole)*100n+BigInt(fraction.padEnd(2,'0'));
    if(minor>BigInt(Number.MAX_SAFE_INTEGER))fail('moneyInvalid');
    return Number(minor);
  }
  function amount(value){const n=BigInt(value);const integer=new Intl.NumberFormat(en?'en-GB':'nb-NO',{maximumFractionDigits:0}).format(n/100n);return integer+(en?'.':',')+String(n%100n).padStart(2,'0')+(en?' NOK':' kr');}
  function inputAmount(value){return String(Math.floor(value/100))+(en?'.':',')+String(value%100).padStart(2,'0');}
  function formattedDate(value){const date=new Date(value);return new Intl.DateTimeFormat(en?'en-GB':'nb-NO',{dateStyle:'long',timeStyle:'short'}).format(date)+' ('+timezone+')';}
  function canonicalDate(value){return typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;}
  function validReport(value){
    if(!value||value.source!=='lawyer-confirmed-account-report'||!Number.isSafeInteger(value.version)||value.version<1||!canonicalDate(value.asOf)||!canonicalDate(value.reportedAt))return false;
    for(const key of ['totalReceivedMinor','totalDisbursedMinor','totalRefundedMinor','availableMinor','goalMinor'])if(!Number.isSafeInteger(value[key])||value[key]<0)return false;
    return value.goalMinor>0&&BigInt(value.totalReceivedMinor)-BigInt(value.totalDisbursedMinor)-BigInt(value.totalRefundedMinor)===BigInt(value.availableMinor);
  }
  async function api(path,method='GET',body){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
    try{
      let response;try{response=await fetch('/api/legal-fund'+path,{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});}catch{fail('network');}
      let data;try{data=await response.json();}catch{fail('network');}
      if(!response.ok)throw Object.assign(new Error('request'),{code:data?.error?.code||'network',status:response.status});
      return data;
    }finally{clearTimeout(timer);}
  }
  function status(message,error=false){$('fund-status').textContent=message;$('fund-status').dataset.tone=error?'error':'info';}
  function errorText(error){const map={version_conflict:'conflict',idempotency_conflict:'changedUncertain',authentication_required:'authRequired',forbidden:'forbidden',origin_rejected:'forbidden',disabled:'disabled',paused:'pausedWrite',storage_unavailable:reporting?'uncertain':'unavailable',network:reporting?'uncertain':'unavailable',invalid_input:'invalid',too_large:'invalid'};const key=map[error.code]||(Object.hasOwn(words[lang],error.code)?error.code:'invalid');return t(key);}
  function publicMarkup(report,isPreview=false){
    const received=amount(report.totalReceivedMinor),available=amount(report.availableMinor),goal=amount(report.goalMinor),bar=Number((BigInt(report.availableMinor)*10000n/BigInt(report.goalMinor))>10000n?10000n:BigInt(report.availableMinor)*10000n/BigInt(report.goalMinor))/100;
    const old=!isPreview&&Date.now()-Date.parse(report.asOf)>30*86400000;
    return `<section class="fund-summary" aria-label="${t(isPreview?'previewHeading':'publicHeading')}"><span class="fund-label">${t('received')}</span><strong class="fund-big" data-amount="received">${esc(received)}</strong><p class="fund-small">${t('receivedNote')}</p><p class="fund-date"><strong>${t('asOf')}</strong> <time datetime="${esc(report.asOf)}">${esc(formattedDate(report.asOf))}</time></p><div class="fund-progress" role="progressbar" aria-label="${t('towardGoal')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${bar}" aria-valuetext="${esc(available+' '+t('of')+' '+goal)}"><span style="width:${bar}%"></span></div><p class="fund-small">${t('towardGoal')}: <strong>${esc(available)} ${t('of')} ${esc(goal)}</strong></p><p class="fund-small">${t('goalNote')}</p><div class="fund-metrics"><div class="fund-metric"><span>${t('available')}</span><strong data-amount="available">${esc(amount(report.availableMinor))}</strong></div><div class="fund-metric"><span>${t('disbursed')}</span><strong data-amount="disbursed">${esc(amount(report.totalDisbursedMinor))}</strong></div><div class="fund-metric"><span>${t('refunded')}</span><strong data-amount="refunded">${esc(amount(report.totalRefundedMinor))}</strong></div></div><p class="fund-small" style="margin-top:15px">${t('availableHelp')}</p>${isPreview?'':`<p class="fund-date">${t('recorded')}: ${esc(formattedDate(report.reportedAt))} · ${t('version')} ${report.version}</p>`}</section>${isPreview?'':`<p class="fund-note">${t('dated')}${old?' '+t('stale'):''}</p>`}`;
  }
  root.innerHTML=`<div id="fund-status" class="fund-status" role="status" aria-live="polite">${t('loading')}</div><div id="fund-auth" class="fund-auth" hidden></div><p id="fund-access-note" class="fund-note" hidden></p><div id="fund-reporting" hidden><section class="fund-panel"><h2>${t('formHeading')}</h2><p>${t('formHelp')}</p><p class="fund-small">${t('noLegalGate')}</p><p id="fund-baseline" class="fund-baseline"></p><form id="fund-report-form"><div class="fund-form-grid">${[['totalReceived','totalReceived'],['totalDisbursed','totalDisbursed'],['totalRefunded','totalRefunded'],['goal','goalField']].map(([name,label])=>`<label class="fund-field">${t(label)}<input name="${name}" inputmode="decimal" maxlength="18" autocomplete="off" required></label>`).join('')}<label class="fund-field">${t('dateField')}<input name="asOf" type="datetime-local" step="1" required aria-describedby="fund-timezone"></label></div><p class="fund-small" id="fund-timezone">${t('timezone')}: ${esc(timezone)}. ${t('newDate')}</p><label class="fund-check"><input name="bankReconciled" type="checkbox" required><span>${t('reconciled')}</span></label><label class="fund-check"><input name="correction" type="checkbox"><span>${t('correction')}</span></label><label class="fund-field" id="fund-correction-field" hidden>${t('correctionReason')}<textarea name="correctionReason" minlength="10" maxlength="1000" aria-describedby="fund-correction-help"></textarea></label><p class="fund-small" id="fund-correction-help" hidden>${t('correctionHelp')}</p><div class="fund-actions"><button type="submit" id="fund-preview-button">${t('preview')}</button><button type="button" id="fund-reload" class="secondary">${t('reload')}</button></div></form><section id="fund-preview" class="fund-preview" hidden aria-labelledby="fund-preview-heading"><h2 id="fund-preview-heading">${t('previewHeading')}</h2><p>${t('previewNote')}</p><div id="fund-preview-content"></div><div class="fund-actions"><button type="button" id="fund-confirm">${t('confirm')}</button><button type="button" id="fund-edit" class="secondary">${t('edit')}</button></div></section></section></div><section id="fund-public" aria-label="${t('publicHeading')}"></section><div class="fund-actions"><button type="button" id="fund-refresh" class="secondary">${t('refresh')}</button>${reporting?`<a href="${publicPath}">${t('viewPublic')}</a>`:''}</div>`;
  const form=$('fund-report-form'),fields=form.elements;
  function setBusy(value){busy=value;root.setAttribute('aria-busy',String(value));root.querySelectorAll('button').forEach(button=>{button.disabled=value;});for(const element of form.querySelectorAll('input,textarea'))element.disabled=value||!ready;fields.correctionReason.disabled=value||!ready||!fields.correction.checked;$('fund-preview-button').disabled=value||!ready;$('fund-confirm').disabled=value||!ready||!preview;}
  function syncCorrection(){const checked=fields.correction.checked;$('fund-correction-field').hidden=!checked;$('fund-correction-help').hidden=!checked;fields.correctionReason.required=checked;fields.correctionReason.disabled=busy||!ready||!checked;}
  function drawPublic(data){
    if(!data||typeof data.enabled!=='boolean'||typeof data.paused!=='boolean'||!['not_available','available','paused'].includes(data.status)||(data.report!==null&&!validReport(data.report)))fail('network');
    if(data.report===null){$('fund-public').innerHTML=`<section class="fund-empty"><h2>${t('none')}</h2><p>${t('noneText')}</p></section>`;return;}
    $('fund-public').innerHTML=(data.paused?`<p class="fund-note" data-tone="warning">${t('paused')}</p>`:'')+publicMarkup(data.report);
  }
  const providerText=en?{
    heading:'Spleis with the lawyer as recipient',pending:'Selected solution — administrative confirmations are still required.',
    fallback:'Direct lawyer-account reporting remains available as an alternative.',
    unavailable:'Spleis details could not be verified. No contribution link or amount is shown.',
    ready:'The registered administrative confirmations are in place.',paused:'The campaign is paused.',closed:'The campaign is closed.',awaiting_launch:'Confirmed arrangement; the campaign has not opened.',
    lawyerAccepted:'The lawyer has accepted the administrative account role',recipientVerified:'Spleis has verified the intended recipient and account',dispositionAgreement:'Account authority and use-of-funds agreement confirmed',collectorFallbackResolved:'Payout to the collector instead of the lawyer has been resolved',refundTermsAgreed:'Deadline, costs and refund terms agreed and disclosed',platformAccepted:'Spleis has accepted this purpose and recipient arrangement',
    confirmed:'Confirmed',waiting:'Awaiting confirmation',declined:'Not accepted',recipient:'Intended recipient',agreement:'Agreement version',
    raised:'Reported gross total on Spleis',date:'Verified as of',recorded:'Recorded',source:'Source: manually checked public Spleis total',
    difference:'This is the gross amount reported on Spleis. Fees, refunds and payouts can change what reaches the lawyer. It is not added to the account balance below.',
    noTotal:'No dated Spleis total has been confirmed. This does not mean zero has been raised.',
    rules:'Spleis normally pays out even when the funding goal is not reached. Refunds and any payment hold require a separate arrangement. This website offers no escrow or automatic refunds.',
    roles:'This is an administrative receiving and account-control agreement. Preliminary analysis and fundraising can proceed before a case lawyer assesses the material. AI does not authorize spending.',
    contribute:'Open the verified Spleis campaign',view:'View the Spleis campaign',terms:'Spleis terms',prices:'Spleis prices'
  }:{
    heading:'Spleis med advokaten som mottaker',pending:'Valgt løsning — administrative avklaringer gjenstår før bidrag åpnes.',
    fallback:'Direkte rapportering fra advokatkonto beholdes som et alternativ.',
    unavailable:'Spleis-opplysningene kunne ikke kontrolleres. Ingen bidragslenke eller beløp vises.',
    ready:'De registrerte administrative bekreftelsene er på plass.',paused:'Innsamlingen er satt på pause.',closed:'Innsamlingen er avsluttet.',awaiting_launch:'Avtalen er bekreftet; innsamlingen er ikke åpnet.',
    lawyerAccepted:'Advokaten har påtatt seg den administrative kontorollen',recipientVerified:'Spleis har kontrollert riktig mottaker og konto',dispositionAgreement:'Avtale om disponering og bruk av midlene er bekreftet',collectorFallbackResolved:'Mulig utbetaling til innsamler i stedet for advokaten er avklart',refundTermsAgreed:'Frist, kostnader og refusjonsvilkår er avtalt og synliggjort',platformAccepted:'Spleis har akseptert formålet og mottakeroppsettet',
    confirmed:'Bekreftet',waiting:'Venter på bekreftelse',declined:'Ikke akseptert',recipient:'Avtalt mottaker',agreement:'Avtaleversjon',
    raised:'Rapportert brutto innsamlet på Spleis',date:'Kontrollert per',recorded:'Registrert',source:'Kilde: manuelt kontrollert offentlig Spleis-beløp',
    difference:'Dette er brutto beløp rapportert hos Spleis. Gebyrer, refusjoner og utbetalinger kan endre hva som kommer frem til advokaten. Beløpet legges ikke til kontosaldoen nedenfor.',
    noTotal:'Ingen datert Spleis-total er bekreftet. Det betyr ikke at innsamlet beløp er null.',
    rules:'Spleis utbetaler normalt også når innsamlingsmålet ikke er nådd. Refusjoner og eventuell utbetalingspause krever egen avklaring. Nettsiden tilbyr ikke escrow eller automatisk refusjon.',
    roles:'Dette er en administrativ avtale om mottak og kontodisponering. Foreløpig analyse og innsamling kan foregå før en saksadvokat vurderer materialet. KI godkjenner ikke pengebruk.',
    contribute:'Åpne den bekreftede Spleis-innsamlingen',view:'Se Spleis-innsamlingen',terms:'Spleis-vilkår',prices:'Spleis-priser'
  };
  function drawProvider(data){
    const box=$('fund-provider'),keys=['lawyerAccepted','recipientVerified','dispositionAgreement','collectorFallbackResolved','refundTermsAgreed','platformAccepted'];
    const goodLink=value=>typeof value==='string'&&/^https:\/\/www\.spleis\.no\/(?:project\/)?[1-9]\d{0,11}$/.test(value);
    if(!data||!['spleis','lawyer-account'].includes(data.provider)||typeof data.canContribute!=='boolean'||!['awaiting_confirmation','configuration_invalid','lawyer_account','ready','paused','closed','awaiting_launch'].includes(data.status))throw Error('provider');
    if(data.status==='configuration_invalid')throw Error('provider');
    if(data.provider==='lawyer-account'){box.innerHTML=`<p class="fund-note">${providerText.fallback}</p>`;return;}
    const approved=keys.every(key=>data.confirmations?.[key]?.status==='confirmed'&&canonicalDate(data.confirmations[key].confirmedAt));
    if(data.campaignUrl!==null&&(!goodLink(data.campaignUrl)||!approved))throw Error('provider');
    if(data.canContribute&&(!approved||!data.campaignUrl||data.status!=='ready'||data.campaignStatus!=='open'))throw Error('provider');
    const o=data.observation;
    if(o!==null&&(!o||!Number.isSafeInteger(o.grossRaisedMinor)||o.grossRaisedMinor<0||!canonicalDate(o.asOf)||!canonicalDate(o.recordedAt)||o.asOf>o.recordedAt||o.source!=='manually-confirmed-spleis-public-total'||o.sourceUrl!==data.campaignUrl||!goodLink(o.sourceUrl)))throw Error('provider');
    const statuses=keys.map(key=>{const c=data.confirmations?.[key];if(!c||!['pending','confirmed','declined'].includes(c.status))throw Error('provider');return `<li><span>${esc(providerText[key])}</span><strong>${esc(c.status==='confirmed'?providerText.confirmed:c.status==='declined'?providerText.declined:providerText.waiting)}</strong>${c.status==='confirmed'?`<time datetime="${esc(c.confirmedAt)}">${esc(formattedDate(c.confirmedAt))}</time>`:''}</li>`;}).join('');
    box.innerHTML=`<section class="fund-panel fund-provider-panel"><p class="fund-eyebrow">Spleis</p><h2>${providerText.heading}</h2><p>${providerText[data.status]||providerText.pending}</p><ul class="fund-checklist">${statuses}</ul>${data.recipient?`<p>${providerText.recipient}: <strong>${esc(data.recipient.displayName)}</strong><br>${providerText.agreement}: ${esc(data.agreementVersion)}</p>`:''}${o?`<span class="fund-label">${providerText.raised}</span><strong class="fund-big" data-amount="spleis-gross">${esc(amount(o.grossRaisedMinor))}</strong><p class="fund-date">${providerText.date}: <time datetime="${esc(o.asOf)}">${esc(formattedDate(o.asOf))}</time><br>${providerText.recorded}: ${esc(formattedDate(o.recordedAt))}</p><p class="fund-small"><a href="${esc(o.sourceUrl)}" target="_blank" rel="noopener noreferrer">${providerText.source}</a></p>${o.stale?`<p class="fund-note" data-tone="warning">${t('stale')}</p>`:''}`:`<p class="fund-note">${providerText.noTotal}</p>`}<p class="fund-small">${providerText.difference}</p><p>${providerText.roles}</p><p class="fund-small">${providerText.rules}</p><div class="fund-actions">${data.campaignUrl&&data.campaignStatus!=='not_started'?`<a class="fund-button" href="${esc(data.campaignUrl)}" target="_blank" rel="noopener noreferrer">${data.canContribute?providerText.contribute:providerText.view}</a>`:''}<a href="https://www.spleis.no/vilkar" target="_blank" rel="noopener noreferrer">${providerText.terms}</a><a href="https://www.spleis.no/pris" target="_blank" rel="noopener noreferrer">${providerText.prices}</a></div></section>`;
  }
  async function loadProvider(){try{drawProvider(await api('/provider'));}catch{$('fund-provider').innerHTML=`<p class="fund-note">${providerText.unavailable}</p>`;}}
  const providerBox=document.createElement('div');providerBox.id='fund-provider';$('fund-public').before(providerBox);
  function safeAuthLink(value,signOut=false){const base=signOut?'/signout-with-chatgpt':'/signin-with-chatgpt',fallback=base+'?returnTo='+encodeURIComponent(reportPath);try{const u=new URL(value,location.origin);return u.origin===location.origin&&u.pathname===base&&u.searchParams.get('returnTo')===reportPath?u.pathname+u.search:fallback;}catch{return fallback;}}
  function configureAccess(){
    if(!reporting)return;
    $('fund-auth').hidden=false;
    const message=!me.enabled?t('disabled'):me.paused?t('pausedWrite'):!me.authenticated?t('notSigned'):!me.canReport?t('forbidden'):t('role');
    $('fund-auth').innerHTML=`<p>${message}</p>${me.enabled?`<a class="fund-button" href="${esc(safeAuthLink(me.authenticated?me.signOutUrl:me.signInUrl,me.authenticated))}" target="_top">${t(me.authenticated?'signOut':'signIn')}</a>`:''}`;
    $('fund-access-note').hidden=!me.canReport;
    $('fund-access-note').textContent=t('privateRole');
    $('fund-reporting').hidden=!(me.enabled&&!me.paused&&me.canReport);
  }
  function populateBaseline(report){
    current=report;form.reset();preview=null;attempt=null;dirty=false;
    $('fund-preview').hidden=true;$('fund-preview-content').textContent='';
    for(const [name,key]of [['totalReceived','totalReceivedMinor'],['totalDisbursed','totalDisbursedMinor'],['totalRefunded','totalRefundedMinor'],['goal','goalMinor']])fields[name].value=report?inputAmount(report[key]):'';
    fields.asOf.value='';
    $('fund-baseline').textContent=report?t('baseline')+' '+report.version+' · '+formattedDate(report.asOf):t('first');
    syncCorrection();
  }
  async function initialize(force=false){
    if(busy)return;
    if(reporting&&force&&(dirty||attempt)&&!window.confirm(t('reloadConfirm')))return;
    setBusy(true);status(t('loading'));
    // Independent reads: a provider outage must not hide the lawyer ledger.
    const providerRead=loadProvider();
    try{
      if(reporting){const results=await Promise.all([api('/me?lang='+lang),api('/report')]);me=results[0];const data=results[1];if(!me||['enabled','paused','authenticated','canReport'].some(key=>typeof me[key]!=='boolean'))fail('network');drawPublic(data);configureAccess();ready=me.enabled&&!me.paused&&me.canReport&&data.enabled&&!data.paused;populateBaseline(data.report);}
      else{const data=await api('/report');drawPublic(data);current=data.report;}
      status(force?t('refreshed'):'');
    }catch(error){ready=false;status(reporting?errorText(error):t('unavailable'),true);}
    finally{await providerRead;setBusy(false);}
  }
  function readPayload(){
    const amounts={totalReceivedMinor:parseMoney(fields.totalReceived.value),totalDisbursedMinor:parseMoney(fields.totalDisbursed.value),totalRefundedMinor:parseMoney(fields.totalRefunded.value),goalMinor:parseMoney(fields.goal.value)};
    if(amounts.goalMinor<=0)fail('goalInvalid');
    if(BigInt(amounts.totalDisbursedMinor)+BigInt(amounts.totalRefundedMinor)>BigInt(amounts.totalReceivedMinor))fail('balanceInvalid');
    const rawDate=fields.asOf.value,date=new Date(rawDate);
    if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(rawDate)||!Number.isFinite(date.getTime())||date.getTime()>Date.now())fail('dateInvalid');
    const asOf=date.toISOString();
    if(current&&asOf<current.asOf)fail('dateEarlier');
    if(!fields.bankReconciled.checked)fail('reconcileRequired');
    const correction=fields.correction.checked,correctionReason=correction?fields.correctionReason.value.trim():'';
    if(correction&&!current)fail('correctionFirst');
    if(correction&&(correctionReason.length<10||correctionReason.length>1000))fail('reasonInvalid');
    if(current&&!correction&&['totalReceivedMinor','totalDisbursedMinor','totalRefundedMinor'].some(key=>amounts[key]<current[key]))fail('decrease');
    return {expectedVersion:current?.version||0,...amounts,asOf,bankReconciled:true,correction,correctionReason};
  }
  function invalidatePreview(){dirty=true;if(preview){preview=null;$('fund-preview').hidden=true;$('fund-preview-content').textContent='';status(t('previewInvalidated'));}$('fund-confirm').disabled=true;syncCorrection();}
  form.addEventListener('input',invalidatePreview);
  form.addEventListener('change',invalidatePreview);
  form.addEventListener('submit',event=>{
    event.preventDefault();if(busy||!ready)return;
    try{
      const payload=readPayload(),signature=JSON.stringify(payload);
      if(attempt&&attempt.signature!==signature)fail('changedUncertain');
      preview={payload,signature};
      const report={...payload,availableMinor:Number(BigInt(payload.totalReceivedMinor)-BigInt(payload.totalDisbursedMinor)-BigInt(payload.totalRefundedMinor))};
      $('fund-preview-content').innerHTML=publicMarkup(report,true);$('fund-preview').hidden=false;$('fund-confirm').disabled=false;status('');
      $('fund-preview-heading').tabIndex=-1;$('fund-preview-heading').focus();$('fund-preview').scrollIntoView({block:'start'});
    }catch(error){status(errorText(error),true);}
  });
  $('fund-confirm').addEventListener('click',async()=>{
    if(busy||!ready||!preview)return;
    const chosen=preview;
    if(attempt&&attempt.signature!==chosen.signature){status(t('changedUncertain'),true);return;}
    if(!attempt)attempt={signature:chosen.signature,key:crypto.randomUUID()};
    const body={...chosen.payload,idempotencyKey:attempt.key};
    setBusy(true);status(t('saving'));
    try{
      const data=await api('/report','POST',body);if(!validReport(data?.report))fail('network');
      preview=null;attempt=null;dirty=false;ready=false;$('fund-preview').hidden=true;$('fund-preview-content').textContent='';
      // A retry may return an older report. Always retrieve the latest aggregate report.
      try{const latest=await api('/report');drawPublic(latest);populateBaseline(latest.report);ready=!!(me?.enabled&&!me?.paused&&me?.canReport&&latest.enabled&&!latest.paused);status(t('saved'));}
      catch{status(t('savedRefreshFailed'),true);}
    }catch(error){if([400,401,403,413,415].includes(error.status))attempt=null;status(errorText(error),true);}
    finally{setBusy(false);}
  });
  $('fund-edit').addEventListener('click',()=>{if(busy)return;preview=null;$('fund-preview').hidden=true;$('fund-preview-content').textContent='';$('fund-preview-button').focus();});
  $('fund-refresh').addEventListener('click',()=>initialize(true));
  $('fund-reload').addEventListener('click',()=>initialize(true));
  window.addEventListener('beforeunload',event=>{if(reporting&&(dirty||attempt)){event.preventDefault();event.returnValue='';}});
  initialize();
})();
