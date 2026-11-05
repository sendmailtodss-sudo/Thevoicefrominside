/* Separate moderated text community. No workshop document or draft is read here. */
(() => { if(document.getElementById('community-root')){const script=document.createElement('script');script.src='/creative-studio.js';script.defer=true;document.head.append(script);} })();
(() => {
  'use strict';
  const root = document.getElementById('community-root');
  if (!root) return;
  const en = document.documentElement.lang === 'en';
  const lang = en ? 'en' : 'no';
  const workshopPath = en ? '/en/verksted/' : '/verksted/';
  const returnPath = en ? '/en/verksted/community/' : '/verksted/fellesskap/';
  const strings = {
    no: {
      loading:'Henter status …', unavailable:'Vi får ikke kontakt med fellesrommet akkurat nå. Utkast du har skrevet her, er ikke sendt.', closed:'Fellesrommet er ikke åpnet ennå', closedText:'Du kan fortsette med forslag og samtaleutkast i det lokale verkstedet. Innsending og støtte blir tilgjengelig når fellesrommet åpnes.', openWorkshop:'Gå til det lokale verkstedet', retry:'Prøv igjen', refresh:'Oppdater listen', signIn:'Logg inn', signOut:'Logg ut', anonymous:'Du leser uten å være innlogget.', signedIn:'Du er innlogget.', moderator:'Du har tilgang til redaksjonell vurdering.', profileTitle:'Navnet du vil bruke', profileHelp:'Velg et alias eller navnet ditt. Dette vises sammen med innleggene. Endring gjelder nye eller redigerte innlegg.', alias:'Visningsnavn', saveProfile:'Lagre visningsnavn', profileSaved:'Visningsnavnet er lagret.', profileRequired:'Lagre et visningsnavn før du sender inn.', signInHelp:'Logg inn for å sende forslag, støtte et forslag eller melde fra om et innlegg.', composeTitle:'Skriv et innlegg', editTitle:'Rediger innlegget', kind:'Type innlegg', proposal:'Forslag', discussion:'Samtale', title:'Tittel', body:'Innlegget ditt', bodyHelp:'Beskriv en konkret idé eller et spørsmål. Skriv bare opplysninger du ønsker offentliggjort. Ikke ta med saksdokumenter eller andre personers private opplysninger.', consent:'Jeg ber om at denne teksten og visningsnavnet mitt kan vises offentlig etter redaksjonell vurdering.', submit:'Send til vurdering', saveEdit:'Send endringen til ny vurdering', cancelEdit:'Avbryt redigering', reloadEdit:'Hent siste versjon av innlegget', editHelp:'En endring går tilbake til vurdering. Tidligere støtte til innlegget nullstilles.', sent:'Innlegget er sendt til vurdering. Det er ikke offentlig ennå.', edited:'Endringen er sendt til ny vurdering. Tidligere støtte er nullstilt.', view:'Visning', public:'Offentlige innlegg', mine:'Mine innlegg', moderation:'Til vurdering', allKinds:'Alle typer', postsHeading:'Innlegg i fellesrommet', empty:'Det finnes ingen innlegg i denne visningen.', emptyPublic:'Ingen innlegg er publisert ennå.', page:'Side', previous:'Forrige', next:'Neste', by:'Av', published:'Publisert', pending:'Venter på vurdering', rejected:'Ikke godkjent', version:'Versjon', edit:'Rediger', remove:'Slett', support:'Støtt forslaget', withdraw:'Trekk støtten tilbake', supportCount:'kontoer støtter forslaget', supportOne:'konto støtter forslaget', supportMeaning:'Støtte telles per innlogget konto. Dette er ikke en bindende avstemning eller en telling av bekreftede personer.', report:'Meld fra', publish:'Godkjenn', reject:'Avslå', appeal:'Be om ny vurdering', reason:'Begrunnelse', moderationReason:'Redaksjonens begrunnelse', appealHeading:'Anmodning om ny vurdering', appealPending:'Venter på svar', appealResolved:'Behandlet', reports:'Meldinger til redaksjonen', noReason:'Ingen tilleggsbegrunnelse.', cancel:'Avbryt', confirm:'Bekreft', deleteTitle:'Slette dette innlegget?', deleteHelp:'Teksten fjernes fra fellesrommet. Dette kan ikke angres her. Allerede lagrede kopier hos andre blir ikke slettet.', publishTitle:'Godkjenne innlegget?', publishHelp:'Den viste versjonen blir offentlig. Kontroller innhold og eventuelle meldinger før du godkjenner.', rejectTitle:'Avslå innlegget', rejectHelp:'Skriv en konkret begrunnelse til den som sendte inn. Innlegget blir ikke offentlig.', reportTitle:'Meld fra til redaksjonen', reportHelp:'Forklar hva redaksjonen bør undersøke. Meldingen vises bare til redaksjonen.', appealTitle:'Be om en ny vurdering', appealHelp:'Forklar hvorfor du ønsker ny vurdering. Dette publiserer ikke innlegget.', optionalReason:'Begrunnelse (valgfritt)', deleted:'Innlegget er slettet fra fellesrommet.', approved:'Innlegget er godkjent og publisert.', declined:'Innlegget er avslått med begrunnelse.', reported:'Meldingen er sendt til redaksjonen.', appealed:'Anmodningen om ny vurdering er sendt.', supported:'Støtten din er registrert.', withdrawn:'Støtten din er trukket tilbake.', saving:'Behandler …', discard:'Du har et usendt utkast. Vil du erstatte det?', conflict:'Innlegget er endret siden du åpnet det. Utkastet ditt er beholdt. Hent og les siste versjon før du forsøker igjen.', notFound:'Innlegget finnes ikke lenger eller er ikke tilgjengelig for deg.', forbidden:'Du har ikke tilgang til denne handlingen.', authRequired:'Du må logge inn før du kan gjøre dette. Utkastet ditt er beholdt.', quota:'Grensen for innsendinger eller endringer er nådd. Prøv igjen en annen dag. Utkastet er beholdt.', invalid:'Kontroller feltene og prøv igjen. Teksten din er beholdt.', tooLarge:'Teksten er for stor. Kort den ned før du prøver igjen.', alreadyReported:'Du har allerede sendt en melding om denne versjonen.', appealExists:'En anmodning om ny vurdering er allerede sendt.', idempotency:'En tidligere innsending med denne referansen har et annet innhold. Oppdater listen og kontroller Mine innlegg før du sender noe på nytt.', disabled:'Fellesrommet er ikke åpent for innsending. Utkastet ditt er beholdt.', network:'Innsendingen kunne ikke bekreftes. Utkastet og innsendingsreferansen er beholdt. Kontroller Mine innlegg eller prøv samme innsending igjen.', privacyTitle:'Hva skjer med innlegget?', privacyText:'Tekst og visningsnavn sendes til fellesrommet når du velger «Send til vurdering». Redaksjonen kan lese innlegget. Godkjente innlegg blir offentlige. Du kan redigere eller slette egne innlegg. Meldinger til redaksjonen og begrunnelser for avslag er ikke offentlige. Støtte kan trekkes tilbake.', profileMissing:'Velg visningsnavn', draftConflictHelp:'Den lagrede versjonen er endret. «Hent siste versjon» erstatter feltene dine etter bekreftelse.', updatedList:'Listen er oppdatert.', statusUnavailable:'Tjenesten svarer ikke som forventet. Prøv igjen senere.'
    },
    en: {
      loading:'Checking availability …', unavailable:'We cannot reach the community room right now. Drafts you have written here have not been sent.', closed:'The community room is not open yet', closedText:'You can keep developing proposals and discussion drafts in the local workshop. Submission and support will be available when the community room opens.', openWorkshop:'Go to the local workshop', retry:'Try again', refresh:'Refresh list', signIn:'Sign in', signOut:'Sign out', anonymous:'You are reading without signing in.', signedIn:'You are signed in.', moderator:'You have access to editorial review.', profileTitle:'The name you want to use', profileHelp:'Choose an alias or your name. It appears beside your posts. Changes apply to new or edited posts.', alias:'Display name', saveProfile:'Save display name', profileSaved:'Your display name has been saved.', profileRequired:'Save a display name before submitting.', signInHelp:'Sign in to submit a proposal, support a proposal or report a post.', composeTitle:'Write a post', editTitle:'Edit your post', kind:'Post type', proposal:'Proposal', discussion:'Discussion', title:'Title', body:'Your post', bodyHelp:'Describe a concrete idea or question. Include only information you want made public. Do not include case files or other people’s private information.', consent:'I request that this text and my display name may be shown publicly after editorial review.', submit:'Submit for review', saveEdit:'Submit changes for a new review', cancelEdit:'Cancel editing', reloadEdit:'Load the latest version of this post', editHelp:'An edit goes back for review. Previous support for the post is cleared.', sent:'Your post has been submitted for review. It is not public yet.', edited:'Your changes have been submitted for a new review. Previous support has been cleared.', view:'View', public:'Public posts', mine:'My posts', moderation:'Editorial review', allKinds:'All types', postsHeading:'Community posts', empty:'There are no posts in this view.', emptyPublic:'No posts have been published yet.', page:'Page', previous:'Previous', next:'Next', by:'By', published:'Published', pending:'Awaiting review', rejected:'Not approved', version:'Version', edit:'Edit', remove:'Delete', support:'Support proposal', withdraw:'Withdraw support', supportCount:'accounts support this proposal', supportOne:'account supports this proposal', supportMeaning:'Support is counted per signed-in account. This is not a binding vote or a count of verified people.', report:'Report', publish:'Approve', reject:'Reject', appeal:'Request another review', reason:'Reason', moderationReason:'Editorial reason', appealHeading:'Request for another review', appealPending:'Awaiting a response', appealResolved:'Reviewed', reports:'Reports to the editors', noReason:'No additional reason.', cancel:'Cancel', confirm:'Confirm', deleteTitle:'Delete this post?', deleteHelp:'The text will be removed from the community room. This cannot be undone here. Copies already saved by others are not deleted.', publishTitle:'Approve this post?', publishHelp:'The displayed version will become public. Check its content and any reports before approving.', rejectTitle:'Reject this post', rejectHelp:'Give the author a specific reason. The post will not be public.', reportTitle:'Report to the editors', reportHelp:'Explain what the editors should look into. Only editors can see this report.', appealTitle:'Request another review', appealHelp:'Explain why you want another review. This does not publish the post.', optionalReason:'Reason (optional)', deleted:'The post has been removed from the community room.', approved:'The post has been approved and published.', declined:'The post has been rejected with a reason.', reported:'Your report has been sent to the editors.', appealed:'Your request for another review has been sent.', supported:'Your support has been recorded.', withdrawn:'Your support has been withdrawn.', saving:'Processing …', discard:'You have an unsent draft. Replace it?', conflict:'This post has changed since you opened it. Your draft has been kept. Load and read the latest version before trying again.', notFound:'This post no longer exists or is not available to you.', forbidden:'You do not have access to this action.', authRequired:'Sign in before continuing. Your draft has been kept.', quota:'The limit for submissions or changes has been reached. Try again another day. Your draft has been kept.', invalid:'Check the fields and try again. Your text has been kept.', tooLarge:'The text is too large. Shorten it before trying again.', alreadyReported:'You have already reported this version.', appealExists:'A request for another review has already been sent.', idempotency:'An earlier submission with this reference has different content. Refresh the list and check My posts before submitting anything again.', disabled:'The community room is not open for submissions. Your draft has been kept.', network:'The submission could not be confirmed. Your draft and submission reference have been kept. Check My posts or retry the same submission.', privacyTitle:'What happens to my post?', privacyText:'Your text and display name are sent to the community room when you choose “Submit for review”. Editors can read the post. Approved posts become public. You can edit or delete your own posts. Reports and reasons for rejection are not public. Support can be withdrawn.', profileMissing:'Choose a display name', draftConflictHelp:'The saved version has changed. “Load the latest version” replaces your fields after confirmation.', updatedList:'The list has been refreshed.', statusUnavailable:'The service did not respond as expected. Please try again later.'
    }
  };
  Object.assign(strings.no, {sent:'Innlegget er registrert. Se status under Mine innlegg.',moderation:'Redaksjon',profileHelp:'Velg et alias eller navnet ditt. Dette vises sammen med innleggene. Endring gjelder nye eller redigerte innlegg. Et alias skjuler ikke kontoen din for tjenesten.',refreshFailed:'Handlingen er lagret, men listen kunne ikke oppdateres. Bruk «Oppdater listen» for å hente siste status.',clearDraft:'Tøm utkastet',clearDraftConfirm:'Vil du tømme utkastet? Hvis en tidligere innsending ikke ble bekreftet, kontroller Mine innlegg før du lager en ny innsending.',dialogConflict:'Denne versjonen er endret. Begrunnelsen din er beholdt her. Avbryt og oppdater listen for å lese siste versjon før du gjør en ny handling.'});
  Object.assign(strings.en, {sent:'Your post has been registered. Check its status under My posts.',profileHelp:'Choose an alias or your name. It appears beside your posts. Changes apply to new or edited posts. An alias does not hide your account from the service.',refreshFailed:'The action has been saved, but the list could not be refreshed. Use “Refresh list” to retrieve the latest status.',clearDraft:'Clear draft',clearDraftConfirm:'Clear this draft? If an earlier submission was not confirmed, check My posts before creating a new submission.',dialogConflict:'This version has changed. Your reason has been kept here. Cancel and refresh the list to read the latest version before taking another action.'});
  const t = key => strings[lang][key] || key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let me = null, posts = [], page = 1, hasMore = false, editing = null, requestKey = null, submittedPayload = null, busy = false, loadToken = 0, action = null, lastActionButton = null, focusRestore = null;
  const date = value => {const d = new Date(value);return Number.isFinite(d.getTime()) ? new Intl.DateTimeFormat(en ? 'en-GB' : 'nb-NO',{dateStyle:'medium'}).format(d) : '';};
  const uuid = () => crypto.randomUUID();

  root.innerHTML = `<div id="community-status" class="wc-status" role="status" aria-live="polite">${t('loading')}</div><section id="community-closed" class="wc-box" hidden><h2>${t('closed')}</h2><p>${t('closedText')}</p><a class="wc-button" href="${workshopPath}">${t('openWorkshop')}</a></section><section id="community-unavailable" class="wc-box" hidden><p>${t('unavailable')}</p><button type="button" id="community-retry">${t('retry')}</button> <a href="${workshopPath}">${t('openWorkshop')}</a></section><div id="community-enabled" hidden><section id="community-auth" class="wc-auth" aria-label="${t('signIn')}"></section><div class="wc-grid" id="community-compose-area" hidden><section class="wc-box"><h2>${t('profileTitle')}</h2><p class="wc-small">${t('profileHelp')}</p><form id="profile-form"><label class="wc-field">${t('alias')}<input name="displayName" minlength="2" maxlength="60" required autocomplete="nickname"></label><button type="submit">${t('saveProfile')}</button></form><details class="wc-privacy"><summary>${t('privacyTitle')}</summary><p class="wc-small">${t('privacyText')}</p></details></section><section class="wc-box"><h2 id="compose-heading">${t('composeTitle')}</h2><p class="wc-small" id="edit-help" hidden>${t('editHelp')}</p><form id="post-form"><label class="wc-field">${t('kind')}<select name="kind"><option value="proposal">${t('proposal')}</option><option value="discussion">${t('discussion')}</option></select></label><label class="wc-field">${t('title')}<input name="title" minlength="3" maxlength="160" required></label><label class="wc-field">${t('body')}<textarea name="body" minlength="10" maxlength="6000" required aria-describedby="post-help"></textarea></label><p id="post-help" class="wc-small">${t('bodyHelp')}</p><label class="wc-check"><input type="checkbox" name="publicationAccepted" required><span>${t('consent')}</span></label><div class="wc-actions"><button id="post-submit" type="submit">${t('submit')}</button><button id="cancel-edit" type="button" class="secondary" hidden>${t('cancelEdit')}</button><button id="reload-edit" type="button" class="secondary" hidden>${t('reloadEdit')}</button></div></form></section></div><section aria-labelledby="posts-heading"><h2 id="posts-heading" style="margin-top:28px">${t('postsHeading')}</h2><p class="wc-small">${t('supportMeaning')}</p><div class="wc-filters"><label class="wc-field">${t('view')}<select id="community-view" name="view"><option value="public">${t('public')}</option></select></label><label class="wc-field">${t('kind')}<select id="community-kind" name="kind"><option value="">${t('allKinds')}</option><option value="proposal">${t('proposal')}</option><option value="discussion">${t('discussion')}</option></select></label><button id="community-refresh" type="button" class="secondary">${t('refresh')}</button></div><div id="community-posts" class="wc-posts"></div><nav class="wc-pagination" aria-label="${t('page')}"><button id="page-prev" type="button" class="secondary">${t('previous')}</button><span id="page-label"></span><button id="page-next" type="button" class="secondary">${t('next')}</button></nav></section></div><dialog id="action-dialog" class="wc-dialog" aria-labelledby="action-heading"><form id="action-form"><h2 id="action-heading"></h2><p id="action-summary" class="wc-dialog-summary"></p><p id="action-help"></p><label class="wc-field" id="action-reason-label"><span id="reason-label-text"></span><textarea name="reason" minlength="3" maxlength="1500"></textarea></label><div class="wc-actions"><button type="submit">${t('confirm')}</button><button id="action-cancel" type="button" class="secondary">${t('cancel')}</button></div></form></dialog>`;
  const $ = id => document.getElementById(id);
  const form = $('post-form');
  const fields = form.elements;
  const actionForm = $('action-form');
  const dialog = $('action-dialog');
  const clearDraft = document.createElement('button');
  clearDraft.type = 'button'; clearDraft.id = 'clear-draft'; clearDraft.className = 'secondary'; clearDraft.textContent = t('clearDraft');
  form.querySelector('.wc-actions').append(clearDraft);
  const actionStatus = document.createElement('p');
  actionStatus.id = 'action-status'; actionStatus.className = 'wc-status'; actionStatus.setAttribute('role','alert');
  actionForm.querySelector('.wc-actions').before(actionStatus);

  function status(message, error = false) { $('community-status').textContent = message; $('community-status').dataset.tone = error ? 'error' : 'info'; }
  function safeAuthLink(value, signOut = false) {
    const base = signOut ? '/signout-with-chatgpt' : '/signin-with-chatgpt';
    const fallback = `${base}?returnTo=${encodeURIComponent(returnPath)}`;
    if (typeof value !== 'string') return fallback;
    try {const u = new URL(value, location.origin); return u.origin === location.origin && u.pathname === base && u.searchParams.get('returnTo') === returnPath ? u.pathname + u.search : fallback;} catch {return fallback;}
  }
  function setBusy(value) {
    busy = value;
    root.querySelectorAll('button').forEach(button => {button.disabled = value;});
    for(const localForm of [form,$('profile-form'),actionForm])localForm.querySelectorAll('input,select,textarea').forEach(input=>{input.disabled=value;});
    $('community-view').disabled = value;
    $('community-kind').disabled = value;
    fields.kind.disabled = value || !!editing;
    if (!value) { $('page-prev').disabled = page <= 1; $('page-next').disabled = !hasMore; restoreFocus(); }
    root.setAttribute('aria-busy', String(value));
  }
  function restoreFocus() {
    if(busy || !focusRestore || dialog.open)return;
    const spec=focusRestore;focusRestore=null;
    const button=[...$('community-posts').querySelectorAll('button[data-action]')].find(candidate=>candidate.dataset.id===spec.id && candidate.dataset.action===spec.action);
    if(button){button.focus({preventScroll:true});return;}
    $('posts-heading').tabIndex=-1;$('posts-heading').focus({preventScroll:true});
  }
  async function api(path, method = 'GET', body) {
    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(),20000);
    try {
      let response;
      try {response = await fetch('/api/workshop' + path, {method,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:body === undefined ? {} : {'Content-Type':'application/json'},body:body === undefined ? undefined : JSON.stringify(body)});}
      catch {throw Object.assign(new Error('network'),{code:'network'});}
      let data;
      try {data = await response.json();} catch {const code=controller.signal.aborted?'network':'invalid_response';throw Object.assign(new Error(code),{code});}
      if (!response.ok) throw Object.assign(new Error('request_failed'),{code:data?.error?.code || 'unknown',status:response.status});
      return data;
    } finally {clearTimeout(timeout);}
  }
  function errorText(error) {
    const keys = {version_conflict:'conflict',not_found:'notFound',forbidden:'forbidden',origin_rejected:'forbidden',authentication_required:'authRequired',profile_required:'profileRequired',quota_exceeded:'quota',rate_limited:'quota',too_large:'tooLarge',report_exists:'alreadyReported',appeal_exists:'appealExists',idempotency_conflict:'idempotency',disabled:'disabled',storage_unavailable:'unavailable',network:'network',invalid_response:'statusUnavailable'};
    return t(keys[error.code] || (error.status === 400 ? 'invalid' : 'unavailable'));
  }
  function showError(error) { status(errorText(error), true); if(dialog.open){actionStatus.textContent=error.code==='version_conflict'?t('dialogConflict'):errorText(error);actionStatus.dataset.tone='error';} if(error.code === 'version_conflict' && editing) $('reload-edit').hidden = false; }
  function hasDraft() {return !!(fields.title.value.trim() || fields.body.value.trim() || fields.publicationAccepted.checked);}
  function configureIdentity() {
    const signed = me.authenticated;
    $('community-auth').innerHTML = `<p>${signed ? t('signedIn') : t('anonymous')}${me.moderator ? ` <strong>${t('moderator')}</strong>` : ''}</p><a class="wc-button" target="_top" href="${esc(safeAuthLink(signed ? me.signOutUrl : me.signInUrl, signed))}">${signed ? t('signOut') : t('signIn')}</a>${signed ? '' : `<p class="wc-small">${t('signInHelp')}</p>`}`;
    $('community-compose-area').hidden = !signed;
    $('profile-form').elements.displayName.value = me.profile?.displayName || '';
    const previous = $('community-view').value;
    $('community-view').innerHTML = `<option value="public">${t('public')}</option>${signed ? `<option value="mine">${t('mine')}</option>` : ''}${me.moderator ? `<option value="moderation">${t('moderation')}</option>` : ''}`;
    if ([...$('community-view').options].some(option => option.value === previous)) $('community-view').value = previous;
  }
  async function start() {
    if(busy) return;
    setBusy(true); status(t('loading'));
    $('community-unavailable').hidden = true;
    try {
      me = await api('/me?lang=' + lang);
      if (typeof me.enabled !== 'boolean') throw Object.assign(new Error(),{code:'invalid_response'});
      $('community-closed').hidden = me.enabled;
      $('community-enabled').hidden = !me.enabled;
      if (!me.enabled) {status('');return;}
      configureIdentity();
      await loadPosts();
      status('');
    } catch(error) { $('community-unavailable').hidden = false; $('community-enabled').hidden = true; showError(error); }
    finally { setBusy(false); }
  }
  function validPost(item) {return item && typeof item.id === 'string' && /^[0-9a-f-]{36}$/i.test(item.id) && ['proposal','discussion'].includes(item.kind) && ['pending','published','rejected'].includes(item.status) && Number.isSafeInteger(item.version) && item.version > 0 && typeof item.title === 'string' && typeof item.body === 'string';}
  async function loadPosts() {
    const token = ++loadToken;
    const query = new URLSearchParams({view:$('community-view').value,page:String(page)});
    if ($('community-kind').value) query.set('kind',$('community-kind').value);
    const data = await api('/posts?' + query);
    if(token !== loadToken) return;
    if(!Array.isArray(data.items) || data.items.length > 20 || !data.items.every(validPost)) throw Object.assign(new Error(),{code:'invalid_response'});
    posts = data.items; hasMore = data.hasMore === true;
    renderPosts();
  }
  function actionButton(name, item, label, cls = '') {return `<button type="button" data-action="${name}" data-id="${esc(item.id)}" class="${cls}"${name==='support'?` aria-pressed="${item.supported?'true':'false'}"`:''}>${label}</button>`;}
  function renderPosts() {
    const focused=document.activeElement;
    if(focused?.matches?.('#community-posts button[data-action]'))focusRestore={id:focused.dataset.id,action:focused.dataset.action};
    $('community-posts').innerHTML = posts.length ? posts.map(item => {
      const controls = [];
      if(item.owned) controls.push(actionButton('edit',item,t('edit'),'secondary'),actionButton('delete',item,t('remove'),'danger'));
      if(me.authenticated && item.status === 'published') {
        if(item.kind === 'proposal') controls.push(actionButton('support',item,t(item.supported ? 'withdraw' : 'support')));
        controls.push(actionButton('report',item,t('report'),'secondary'));
      }
      if(me.moderator) {
        if(item.status !== 'published') controls.push(actionButton('publish',item,t('publish')));
        if(item.status !== 'rejected' || item.appeal?.status === 'pending') controls.push(actionButton('reject',item,t('reject'),'secondary'));
      }
      if(item.owned && item.status === 'rejected' && item.appeal?.status !== 'pending') controls.push(actionButton('appeal',item,t('appeal'),'secondary'));
      const supports = Math.max(0,Number.isSafeInteger(item.supportCount) ? item.supportCount : 0);
      const reason = typeof item.moderationReason === 'string' && item.moderationReason ? `<div class="wc-reason"><strong>${t('moderationReason')}</strong><p>${esc(item.moderationReason)}</p></div>` : '';
      const appeal = item.appeal && typeof item.appeal.reason === 'string' ? `<div class="wc-reason"><strong>${t('appealHeading')} · ${t(item.appeal.status === 'pending' ? 'appealPending' : 'appealResolved')}</strong><p>${esc(item.appeal.reason)}</p></div>` : '';
      const reports = me.moderator && Array.isArray(item.reports) && item.reports.length ? `<details><summary>${t('reports')} (${esc(item.reportCount ?? item.reports.length)})</summary><ul class="wc-report-list">${item.reports.map(report=>`<li>${esc(report.reason)} <small class="wc-small">${t('version')} ${esc(report.version)} · ${esc(date(report.createdAt))}</small></li>`).join('')}</ul></details>` : '';
      return `<article class="wc-post" data-post-id="${esc(item.id)}"><span class="wc-badge">${t(item.kind)}</span><span class="wc-badge">${t(item.status)}</span><h3>${esc(item.title)}</h3><p class="wc-meta">${t('by')} ${esc(item.creator?.displayName || '')} · ${esc(date(item.createdAt))} · ${t('version')} ${item.version}</p><p class="wc-post-body">${esc(item.body)}</p>${reason}${appeal}${reports}${item.kind === 'proposal' && item.status === 'published' ? `<p class="wc-support">${supports} ${t(supports === 1 ? 'supportOne' : 'supportCount')}</p>` : ''}${controls.length ? `<div class="wc-actions">${controls.join('')}</div>` : ''}</article>`;
    }).join('') : `<p class="wc-empty">${t($('community-view').value === 'public' ? 'emptyPublic' : 'empty')}</p>`;
    $('page-label').textContent = t('page') + ' ' + page;
    $('page-prev').disabled = busy || page <= 1;
    $('page-next').disabled = busy || !hasMore;
    restoreFocus();
  }
  function resetComposer() {
    editing = null; requestKey = null; submittedPayload = null;
    form.reset(); fields.kind.disabled = false;
    $('compose-heading').textContent = t('composeTitle'); $('post-submit').textContent = t('submit');
    $('cancel-edit').hidden = true; $('reload-edit').hidden = true; $('edit-help').hidden = true;
  }
  function editPost(item, confirmDiscard = true) {
    if(confirmDiscard && hasDraft() && !window.confirm(t('discard'))) return;
    editing = {id:item.id,version:item.version}; requestKey = null; submittedPayload = null;
    fields.kind.value = item.kind; fields.kind.disabled = true; fields.title.value = item.title; fields.body.value = item.body; fields.publicationAccepted.checked = false;
    $('compose-heading').textContent = t('editTitle'); $('post-submit').textContent = t('saveEdit');
    $('cancel-edit').hidden = false; $('reload-edit').hidden = true; $('edit-help').hidden = false;
    fields.title.focus(); $('compose-heading').scrollIntoView({block:'start'});
  }
  async function refresh(message = '') {
    if(busy || !me?.enabled) return;
    setBusy(true);
    try {await loadPosts(); if(message) status(message);} catch(error) {showError(error);} finally {setBusy(false);}
  }
  async function mutate(run, success, after, onError) {
    if(busy) return;
    setBusy(true); status(t('saving'));
    try {
      const result = await run();
      if(after) after(result);
      status(success);
      try {await loadPosts();} catch {status(success + ' ' + t('refreshFailed'),true);}
    } catch(error) {if(onError)onError(error);showError(error);} finally {setBusy(false);}
  }
  $('profile-form').addEventListener('submit', event => {
    event.preventDefault(); if(busy || !me?.authenticated) return;
    const displayName = event.currentTarget.elements.displayName.value.trim();
    mutate(()=>api('/profile','POST',{displayName}),t('profileSaved'),data=>{me.profile = data.profile;});
  });
  form.addEventListener('submit', event => {
    event.preventDefault(); if(busy || !me?.authenticated) return;
    if(!me.profile?.displayName) {status(t('profileRequired'),true);$('profile-form').elements.displayName.focus();return;}
    const content = {title:fields.title.value.trim(),body:fields.body.value.trim(),publicationAccepted:fields.publicationAccepted.checked};
    if(editing) {
      const current = {...editing};
      mutate(()=>api('/posts/'+encodeURIComponent(current.id),'PATCH',{version:current.version,...content}),t('edited'),()=>{resetComposer();$('community-view').value = 'mine';page = 1;});
    } else {
      const newPayload = JSON.stringify({kind:fields.kind.value,...content});
      // A retry of the same payload retains its idempotency key after network failure.
      // Changing an uncertain submission must be explicit, to avoid silently duplicating it.
      if(submittedPayload && submittedPayload !== newPayload) {status(t('idempotency'),true);return;}
      if(!requestKey) requestKey = uuid();
      submittedPayload = newPayload;
      mutate(()=>api('/posts','POST',{idempotencyKey:requestKey,kind:fields.kind.value,...content}),t('sent'),()=>{resetComposer();$('community-view').value = 'mine';page = 1;},error=>{
        // A definite pre-insertion rejection may be corrected. Uncertain failures keep the exact retry key.
        if([400,401,403,413,415,429].includes(error.status)){requestKey=null;submittedPayload=null;}
      });
    }
  });
  $('cancel-edit').addEventListener('click',()=>{if(!busy && (!hasDraft() || window.confirm(t('discard'))))resetComposer();});
  clearDraft.addEventListener('click',()=>{if(!busy && (!hasDraft() || window.confirm(t('clearDraftConfirm'))))resetComposer();});
  $('reload-edit').addEventListener('click',async()=>{
    if(busy || !editing || (hasDraft() && !window.confirm(t('discard'))))return;
    setBusy(true);
    try {const data = await api('/posts/'+encodeURIComponent(editing.id));if(!validPost(data.item))throw Object.assign(new Error(),{code:'invalid_response'});editPost(data.item,false);status('');}catch(error){showError(error);}finally{setBusy(false);}
  });
  function closeAction() {if(lastActionButton)focusRestore={id:lastActionButton.dataset.id,action:lastActionButton.dataset.action};dialog.close();action = null; actionForm.reset();actionStatus.textContent='';lastActionButton = null;restoreFocus();}
  function openAction(name,item,button) {
    const settings = {delete:['deleteTitle','deleteHelp'],publish:['publishTitle','publishHelp'],reject:['rejectTitle','rejectHelp'],report:['reportTitle','reportHelp'],appeal:['appealTitle','appealHelp']}[name];
    if(!settings)return;
    action = {name,item:{...item}};lastActionButton = button;
    actionForm.reset(); actionStatus.textContent=''; $('action-heading').textContent = t(settings[0]); $('action-summary').textContent = item.title + ' · ' + t('version') + ' ' + item.version; $('action-help').textContent = t(settings[1]);
    $('action-reason-label').hidden = name === 'delete';
    $('reason-label-text').textContent = t(name === 'publish' ? 'optionalReason' : 'reason');
    actionForm.elements.reason.required = !['delete','publish'].includes(name);
    actionForm.elements.reason.disabled = name === 'delete';
    actionForm.elements.reason.minLength = 3;
    dialog.showModal(); if(name !== 'delete')actionForm.elements.reason.focus();
  }
  $('community-posts').addEventListener('click',event=>{
    const button = event.target.closest('button[data-action]');
    if(!button || busy)return;
    const item = posts.find(candidate=>candidate.id === button.dataset.id);
    if(!item)return;
    const name = button.dataset.action;
    if(name === 'edit')return editPost(item);
    if(name === 'support')return mutate(()=>api('/posts/'+encodeURIComponent(item.id)+'/support','POST',{version:item.version,supported:!item.supported}),t(item.supported ? 'withdrawn' : 'supported'));
    openAction(name,item,button);
  });
  actionForm.addEventListener('submit',event=>{
    event.preventDefault(); if(busy || !action)return;
    const current = action, path = '/posts/'+encodeURIComponent(current.item.id), version = current.item.version, reason = actionForm.elements.reason.value.trim();
    const config = {
      delete:[path,'DELETE',{version},'deleted'],
      publish:[path+'/moderate','POST',{version,status:'published',reason},'approved'],
      reject:[path+'/moderate','POST',{version,status:'rejected',reason},'declined'],
      report:[path+'/report','POST',{version,reason},'reported'],
      appeal:[path+'/appeal','POST',{version,reason},'appealed']
    }[current.name];
    mutate(()=>api(config[0],config[1],config[2]),t(config[3]),()=>{closeAction();if(current.name==='delete' && editing?.id===current.item.id)resetComposer();});
  });
  $('action-cancel').addEventListener('click',()=>{if(!busy)closeAction();});
  dialog.addEventListener('cancel',event=>{event.preventDefault();if(!busy)closeAction();});
  $('community-retry').addEventListener('click',start);
  $('community-refresh').addEventListener('click',()=>refresh(t('updatedList')));
  $('community-view').addEventListener('change',()=>{page=1;refresh();});
  $('community-kind').addEventListener('change',()=>{page=1;refresh();});
  $('page-prev').addEventListener('click',()=>{if(page>1){page--;refresh();}});
  $('page-next').addEventListener('click',()=>{if(hasMore){page++;refresh();}});
  window.addEventListener('beforeunload',event=>{const aliasChanged=me?.authenticated && $('profile-form').elements.displayName.value.trim() !== (me.profile?.displayName || '');if(hasDraft() || aliasChanged || (dialog.open && actionForm.elements.reason.value.trim())){event.preventDefault();event.returnValue='';}});
  start();
})();
