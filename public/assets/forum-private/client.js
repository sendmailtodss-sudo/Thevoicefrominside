/* Private synthetic forum. No browser-stored credentials or local conversation fallback. */
(() => {
  'use strict';
  const root = document.querySelector('[data-private-forum-page]');
  if (!root) return;
  const url = new URL(location.href);
  const locale = ['zh-Hans', 'zh'].includes(url.searchParams.get('lang')) ? 'zh-Hans' : location.pathname.startsWith('/en/') ? 'en' : 'no';
  const messages = window.SFIForumMessages?.[locale];
  if (!messages) return;
  const t = key => messages[key] || key;
  document.documentElement.lang = locale === 'no' ? 'nb' : locale;
  document.title = root.dataset.privateForumPage === 'portal' ? t('portalTitle') : t('pageTitle');
  const en = locale === 'en';
  const base = en ? '/en' : '';
  const route = type => `${base}/${type === 'portal' ? 'preview/portal' : 'for-oss-alle-preview'}/` + (locale === 'zh-Hans' ? '?lang=zh-Hans' : '');
  const e = (tag, attrs = {}, text) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'checked') node.checked = Boolean(value);
      else if (key === 'value') node.value = value;
      else if (key === 'disabled') node.disabled = Boolean(value);
      else node.setAttribute(key, String(value));
    }
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const append = (node, ...children) => { for (const child of children.flat()) if (child) node.append(child); return node; };
  const p = (text, cls) => e('p', cls ? {class: cls} : {}, text);
  const button = (text, action, attrs = {}) => {
    const b = e('button', {type: 'button', ...attrs}, text);
    if (action) b.addEventListener('click', action);
    return b;
  };
  const field = (form, label, input) => { const l = e('label', {for: input.id}, label); append(form, l, input); return input; };
  const roleName = key => t({inmate: 'roleInside', former: 'roleFormer', relative: 'roleRelative', professional: 'roleProfessional'}[key] || 'declaredRole');
  const roomName = id => t(id === 'relatives' ? 'relativesRoom' : 'insideRoom');
  const ROOM_IDS = ['inside', 'relatives'];
  const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const date = value => {
    const d = new Date(value);
    if (Number.isNaN(d.valueOf())) return '';
    return new Intl.DateTimeFormat(locale === 'no' ? 'nb-NO' : locale, {dateStyle: 'medium', timeStyle: 'short'}).format(d);
  };
  const chrome = () => {
    const header = e('header', {class: 'top'}), lang = e('nav', {class: 'lang', 'aria-label': t('language')});
    const isPortal = root.dataset.privateForumPage === 'portal';
    append(header, e('a', {class: 'brand', href: isPortal ? `${base}/` : route('portal')}, isPortal ? 'The Voice from Inside' : t('backPortal')), lang);
    for (const [code, label, prefix] of [['no','Norsk',''],['en','English','/en'],['zh-Hans','简体中文','']]) {
      const dest = new URL(`${prefix}/${isPortal ? 'preview/portal' : 'for-oss-alle-preview'}/`, location.origin);
      if (code === 'zh-Hans') dest.searchParams.set('lang', code);
      const room = new URL(location.href).searchParams.get('room'), thread = new URL(location.href).searchParams.get('thread');
      if (ROOM_IDS.includes(room)) dest.searchParams.set('room', room);
      if (uuid(thread)) dest.searchParams.set('thread', thread);
      lang.append(e('a', {href: dest.pathname + dest.search, lang: code === 'no' ? 'nb' : code, 'aria-current': code === locale ? 'page' : null}, label));
    }
    const skip = e('a', {class: 'skip', href: '#main'}, t('skip'));
    const notice = e('div', {class: 'notice'}, `${t('privateBanner')}. ${t('noPersonalData')}`);
    const footer = e('footer', {class: 'footer'});
    append(footer, e('a', {href: `${base}/`}, t('backSite')), document.createTextNode(' · '), e('span', {}, t('projectIdentity')));
    document.body.replaceChildren(skip, header, notice, root, footer);
    root.id = 'main'; root.tabIndex = -1;
  };
  chrome();
  if (root.dataset.privateForumPage === 'portal') {
    const intro = e('section', {class: 'intro'});
    append(intro, p('THE VOICE FROM INSIDE', 'eyebrow'), e('h1', {}, t('portalTitle')), p(t('portalIntro')));
    const doors = e('div', {class: 'doors'}), creative = e('section', {class: 'door creative'}), voice = e('section', {class: 'door diary'});
    append(creative, e('span', {class: 'number'}, '01'), e('h2', {}, t('portalCreative')), p(t('portalCreativeBody')), e('a', {class: 'button', href: route('forum')}, t('portalForum')), e('a', {class: 'door-links', href: en ? '/en/creative-community/' : '/kunstfellesskap/'}, t('portalArt')));
    append(voice, e('span', {class: 'number'}, '02'), e('h2', {}, t('portalVoice')), p(t('portalVoiceBody')), e('a', {class: 'button', href: `${base}/dagbok/`}, t('portalDiary')));
    append(doors, creative, voice);
    const why = e('section', {class: 'about'}), whyBody = e('div');
    append(whyBody, p(t('separateRooms')), p(t('portalWhyBody')), p(t('noIdentityCheck')));
    append(why, e('h2', {}, t('portalWhy')), whyBody);
    root.replaceChildren(intro, doors, why); return;
  }

  class ApiError extends Error {
    constructor(status, code) { super(code); this.status = status; this.code = code; }
  }
  const state = {ready: false, me: null, room: ROOM_IDS.includes(url.searchParams.get('room')) ? url.searchParams.get('room') : null,
    thread: uuid(url.searchParams.get('thread')) ? url.searchParams.get('thread') : null, rooms: [], threads: [], messages: [], threadInfo: null, messageMore: false, messageCursor: null, acknowledged: new Map(),
    applications: [], reviewed: null, reviewOpen: false, busy: false, checking: true, generation: 0, authEpoch: 0, authDirty: false, accessChanged: false, drafts: new Map(), newThreads: new Map(), editDrafts: new Map(), logoutUnconfirmed: false};
  let viewRequest = null, dialog = null, authChannel = null;
  const status = (message, error = false) => {
    const node = document.getElementById('forum-status');
    if (node) { node.textContent = message; node.dataset.error = String(error); }
    const modalStatus=dialog?.querySelector('[data-dialog-status]');if(modalStatus){modalStatus.textContent=message;modalStatus.dataset.error=String(error);}
  };
  function errorText(error) {
    if (error?.name === 'AbortError') return t('aborted');
    if (error?.code === 'uncertain_submission') return t('uncertainSubmission');
    if (error?.status === 413) return t('bodyTooLarge');
    if (error?.status === 409) return t('versionConflict');
    if (error?.status === 429) return t('quotaExceeded');
    if (error?.status === 401) return t('notAuthenticated');
    if (error?.status === 403) return t('forbidden');
    if ([404,503].includes(error?.status)) return t('serviceClosed');
    if ([400,415].includes(error?.status)) return t('invalidInput');
    return t('networkError');
  }
  async function api(path, payload, options = {}) {
    const controller = new AbortController();let timedOut=false;const timer = setTimeout(() => {timedOut=true;controller.abort();}, 15000);
    const signal = options.signal;
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, {once: true});
    try {
      const init = {method: payload === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal, headers: {Accept: 'application/json'}};
      if (payload !== undefined) {
        init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(payload);
        if (new TextEncoder().encode(init.body).length > 16384) throw new ApiError(413, 'body_too_large');
      }
      const res = await fetch('/api/forum' + path, init);
      let data;
      try { data = await res.json(); } catch { throw new ApiError(res.ok ? 502 : res.status, 'invalid_response'); }
      if (!res.ok || data?.ok !== true) throw new ApiError(res.status || 502, data?.error?.code || 'request_failed');
      return data.data;
    } catch(error) {if(error.name==='AbortError'&&timedOut)throw new ApiError(0,'request_timeout');throw error;} finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  function clearSession() {
    state.authEpoch++;state.generation++; viewRequest?.abort();dialog?.close();dialog?.remove();dialog=null;state.me = null; state.rooms = [];clearRoomContent();
    state.applications = []; state.reviewed = null;state.reviewOpen=false; state.drafts.clear(); state.newThreads.clear();state.editDrafts.clear();
  }
  function clearRoomContent() { state.threads = []; state.messages = []; state.threadInfo = null;state.messageMore=false;state.messageCursor=null;state.acknowledged.clear(); }
  function setUrl() {
    const next = new URL(location.href); next.searchParams.delete('room'); next.searchParams.delete('thread');
    if (state.room) next.searchParams.set('room', state.room);
    if (state.thread) next.searchParams.set('thread', state.thread);
    history.replaceState(null, '', next.pathname + next.search);
  }
  const activeGrant = room => state.me?.grants?.some(g => g.room_id === room && g.state === 'active');
  const canUseRoom = room => Boolean(state.me?.member?.status === 'approved' && state.me.member.identity_state === 'synthetic_verified' && activeGrant(room));
  const isReviewer = () => state.me?.permissions?.reviewMembership === true;
  const isModerator = room => state.me?.permissions?.moderateRooms?.includes(room);
  async function handleError(error) {
    if(error.code==='stale_session')return;
    if (error.status === 401) { clearSession(); render(); }
    else if ([403,404].includes(error.status)) {
      dialog?.close();dialog?.remove();dialog=null;clearRoomContent();
      try { await loadMe(); } catch(nextError) { if(nextError.code==='stale_session')return;clearSession(); }
      render();
    }
    status(errorText(error), true);
  }
  function busy(value) {
    state.busy = value; root.setAttribute('aria-busy', String(value));
    [...root.querySelectorAll('button,input,textarea,select'), ...(dialog?.querySelectorAll('button,input,textarea,select') || [])].forEach(node => {
      if (value) { if(node.dataset.wasDisabled===undefined)node.dataset.wasDisabled = String(node.disabled); node.disabled = true; }
      else if (node.dataset.wasDisabled !== undefined) { node.disabled = node.dataset.wasDisabled === 'true'; delete node.dataset.wasDisabled; }
    });
  }
  function finishBusy(){busy(false);if(state.authDirty){state.authDirty=false;queueMicrotask(()=>start());}}
  async function action(fn, success) {
    if (state.busy) return;
    busy(true);
    try { await fn(); if (success) status(success); }
    catch (error) { await handleError(error); }
    finally { finishBusy(); }
  }
  async function loadMe() {
    const epoch=state.authEpoch;const ensureCurrent=()=>{if(epoch!==state.authEpoch)throw new ApiError(0,'stale_session');};
    const data = await api('/me');ensureCurrent();
    if (!data?.member || data.member.synthetic_test !== true || !Array.isArray(data.grants) || data?.pilot?.syntheticOnly !== true || data.pilot.kyc !== false) throw new ApiError(503, 'not_private_synthetic_mode');
    const scope=me=>JSON.stringify({user:me?.member?.user_id,status:me?.member?.status,identity:me?.member?.identity_state,
      grants:(me?.grants||[]).map(g=>({room:g.room_id,role:g.access_role,state:g.state,version:g.version})).sort((a,b)=>a.room.localeCompare(b.room)),
      permissions:{review:me?.permissions?.reviewMembership===true,moderate:[...(me?.permissions?.moderateRooms||[])].sort()}});
    if(state.me&&scope(state.me)!==scope(data)){
      state.generation++;viewRequest?.abort();dialog?.close();dialog?.remove();dialog=null;
      state.drafts.clear();state.newThreads.clear();state.editDrafts.clear();clearRoomContent();state.thread=null;state.accessChanged=true;
      state.me=data;state.rooms=[];state.applications=[];state.reviewed=null;render();status(t('accessChanged'));
    }
    const result = data.member.status==='approved'&&data.member.identity_state==='synthetic_verified' ? await api('/rooms') : {rooms:[]};ensureCurrent();
    if(!Array.isArray(result?.rooms))throw new ApiError(502,'invalid_response');
    let applications=[];
    if(data.permissions?.reviewMembership===true){const queue=await api('/applications');ensureCurrent();if(!Array.isArray(queue?.applications))throw new ApiError(502,'invalid_response');applications=queue.applications;}
    ensureCurrent();state.me=data;state.rooms=result.rooms;state.applications=applications;state.logoutUnconfirmed=false;
    if (!canUseRoom(state.room)) state.room = ROOM_IDS.find(canUseRoom) || null;
    if (!state.room) { state.thread = null; clearRoomContent(); }
  }
  async function loadRoom(room, thread = null, focus = false, ensureMessage = null) {
    if (!canUseRoom(room)) { status(t('roomAccessDenied'), true); return; }
    const generation = ++state.generation;
    viewRequest?.abort(); viewRequest = new AbortController();
    state.room = room; state.thread = null; clearRoomContent(); render(); status(t('loading'));
    try {
      const result = await api('/threads?room=' + encodeURIComponent(room), undefined, {signal: viewRequest.signal});
      if (generation !== state.generation) return;
      state.threads = Array.isArray(result?.threads) ? result.threads : [];
      if (thread && state.threads.some(item => item.id === thread)) {
        const data = await api('/messages?thread_id=' + encodeURIComponent(thread), undefined, {signal: viewRequest.signal});
        if (generation !== state.generation) return;
        state.thread = thread; state.threadInfo = data.thread; state.messages = Array.isArray(data.messages) ? data.messages : [];
        setMessageCursor(state.messages);
        for(let count=0;ensureMessage&&!state.messages.some(m=>m.id===ensureMessage.id)&&state.messageMore&&count<5;count++){await nextMessages(viewRequest.signal);if(generation!==state.generation)return;}
        if(ensureMessage&&!state.messages.some(m=>m.id===ensureMessage.id)&&typeof ensureMessage.body==='string'&&ensureMessage.thread_id===thread)state.acknowledged.set(ensureMessage.id,ensureMessage);
      }
      setUrl(); render(); status('');
      if (focus) document.getElementById(state.thread ? 'conversation-heading' : 'room-heading')?.focus();
    } catch (error) { if (generation === state.generation && error.name !== 'AbortError') await handleError(error); }
  }
  function setMessageCursor(batch){
    state.messageMore=batch.length===100;
    const last=batch.at(-1);if(last&&typeof last.created_at==='string'&&uuid(last.id))state.messageCursor={at:last.created_at,id:last.id};
  }
  async function nextMessages(signal){
    const query=new URLSearchParams({thread_id:state.thread,limit:'100'});
    if(state.messageCursor){query.set('after_created_at',state.messageCursor.at);query.set('after_id',state.messageCursor.id);}
    const current=state.generation,thread=state.thread;
    const data=await api('/messages?'+query,undefined,{signal});
    if(current!==state.generation||thread!==state.thread)throw new ApiError(0,'stale_session');
    const batch=Array.isArray(data.messages)?data.messages:[];
    const seen=new Set(state.messages.map(item=>item.id));state.messages.push(...batch.filter(item=>!seen.has(item.id)));
    state.threadInfo=data.thread;setMessageCursor(batch);for(const message of batch)state.acknowledged.delete(message.id);
    return batch;
  }
  async function refreshAfterReply(message){
    for(let count=0;count<5;count++){
      await nextMessages();
      if(state.messages.some(item=>item.id===message?.id)||!state.messageMore)break;
    }
    if(message&&!state.messages.some(item=>item.id===message.id)&&typeof message.body==='string'&&message.thread_id===state.thread)state.acknowledged.set(message.id,message);
    render();document.getElementById('reply-body')?.focus();
  }
  async function refreshSession(message) {
    const selectedRoom = state.room, selectedThread = state.thread;
    await loadMe(); render();
    if (state.room) await loadRoom(state.room === selectedRoom ? selectedRoom : state.room, state.room === selectedRoom ? selectedThread : null);
    if (message) status(message);else if(state.accessChanged){status(t('accessChanged'));state.accessChanged=false;}
  }
  function newForm(id) { return e('form', {id, autocomplete: 'off'}); }
  function input(form, key, id, attrs = {}) { return field(form, t(key), e('input', {id, name: id, ...attrs})); }
  function textarea(form, key, id, value = '', attrs = {}) {
    const node = field(form, t(key), e('textarea', {id, name: id, maxlength: 6000, rows: 5, required: true, ...attrs})); node.value = value; return node;
  }
  function submit(form, text) { const node = e('button', {type:'submit', class:'primary'}, text); form.append(node); return node; }
  function addAccount(container) {
    const card = e('section', {class:'pf-card', 'aria-labelledby':'account-heading'});
    append(card, e('h2',{id:'account-heading',tabindex:'-1'},t('account')));
    const member = state.me.member;
    const dl = e('dl', {class:'pf-summary'});
    const identity = {pending:'identityPending',synthetic_verified:'identityVerified',revoked:'identityRevoked'}[member.identity_state] || 'identityPending';
    for (const [label,value] of [[t('alias'),member.alias],[t('declaredRole'),roleName(member.declared_role)],[t('statusLabel'),t(member.status)],[t('identityLabel'),t(identity)]]) append(dl, e('dt',{},label),e('dd',{},value));
    append(card, dl, p(t('noticeIdentity'),'pf-small'), button(t('refreshMembership'),()=>action(()=>refreshSession()),{'data-action':'refresh-session'}), button(t('signOut'),()=>logout(),{'data-action':'logout'}));
    if (isReviewer()) card.append(p(t('canReview'),'pf-small'));
    container.append(card);
  }
  function addApplication(container) {
    const member = state.me.member;
    if (member.status === 'deleted') return;
    const details = e('details',{class:'pf-card', open: member.status !== 'approved' ? '' : null});
    details.append(e('summary',{},t('applicationTitle')));
    append(details, p(t('applicationIntro')), p(t('updateApplicationHelp'),'pf-small'));
    if(member.status!=='pending'){details.append(p(t('applicationReadOnly'),'pf-small'));container.append(details);return;}
    const form = newForm('application-form');
    const alias = input(form,'alias','application-alias',{required:true,minlength:2,maxlength:60,value:member.alias || ''});
    const role = field(form,t('declaredRole'),e('select',{id:'application-role',required:true}));
    for (const value of ['inmate','former','relative','professional']) role.append(e('option',{value},roleName(value)));
    role.value = member.declared_role || 'former';
    const ack = e('input',{id:'application-ack',type:'checkbox',required:true}), ackLabel = e('label',{class:'pf-check',for:'application-ack'});
    append(ackLabel,ack,e('span',{},t('applicationAck'))); form.append(ackLabel); submit(form,t('apply'));
    form.addEventListener('submit',event=>{event.preventDefault(); if (!form.reportValidity()) return; action(async()=>{
      await api('/application',{alias:alias.value,declared_role:role.value,version:member.version,ack:ack.checked}); await refreshSession(t('applicationSubmitted'));
    });});
    append(details, form); container.append(details);
  }
  function addReviewer(container) {
    if (!isReviewer()) return;
    const details = e('details',{class:'pf-card pf-reviewer',open:state.reviewOpen?'':null}); details.append(e('summary',{},t('reviewTitle')));
    append(details,p(t('noIdentityCheck'),'pf-small'));
    if (!state.applications.length) { details.append(p(t('noApplications'))); container.append(details); return; }
    const selection = field(details,t('chooseApplication'),e('select',{id:'review-person'}));
    state.applications.forEach(member => selection.append(e('option',{value:member.user_id},`${member.alias} · ${t(member.status)}`)));
    if (!state.applications.some(x=>x.user_id===state.reviewed)) state.reviewed=state.applications[0].user_id;
    selection.value=state.reviewed;
    const casePanel=e('div',{'data-review-case':''}); details.append(casePanel);
    function paintCase() {
      casePanel.replaceChildren(); const person=state.applications.find(x=>x.user_id===selection.value); if(!person)return;
      state.reviewed=person.user_id;
      append(casePanel,p(`${roleName(person.declared_role)} · ${t(person.status)} · ${t('version')} ${person.version}`));
      const self=person.user_id===state.me.member.user_id;
      if(self)casePanel.append(p(t('selfReviewDenied'),'pf-small'));if(!person.login_verified_at)casePanel.append(p(t('needsTestLogin'),'pf-small'));
      const form=newForm('review-form'), grants=e('fieldset'), legend=e('legend',{},t('roomGrants'));
      grants.append(legend); const boxes=[];
      for(const room of ROOM_IDS){const box=e('input',{type:'checkbox',id:'grant-'+room,value:room});
        if(person.declared_role==='inmate'||person.declared_role==='former'){box.checked=room==='inside';box.disabled=true;}
        if(person.declared_role==='relative'){box.checked=room==='relatives';box.disabled=true;}
        const label=e('label',{class:'pf-check',for:box.id});append(label,box,e('span',{},roomName(room)));grants.append(label);boxes.push(box);}
      const reason=textarea(form,'reason','review-reason','',{minlength:3,maxlength:1500,rows:3});form.prepend(grants);
      const actions=e('div',{class:'pf-actions'});
      for(const [decision,label] of [['verify_test','verifyTest'],['approve','approve'],['reject','reject'],['suspend','suspend'],['reopen','reopen']]) {
        const permitted=!self && (decision==='verify_test'?person.status==='pending'&&person.identity_state==='pending':decision==='approve'?person.status==='pending'&&person.identity_state==='synthetic_verified'&&Boolean(person.login_verified_at):decision==='suspend'?person.status==='approved':decision==='reopen'?['rejected','suspended'].includes(person.status):['pending'].includes(person.status));
        actions.append(button(t(label),()=>{if(!form.reportValidity())return;action(async()=>{
          const rooms=boxes.filter(b=>b.checked).map(b=>b.value);
          await api('/members/review',{subject_id:person.user_id,version:person.version,decision,rooms:decision==='approve'?rooms:[],reason:reason.value}); await refreshSession(t('reviewSaved'));
        });},{disabled:!permitted,'data-review-decision':decision}));
      }
      form.append(actions); form.addEventListener('submit',ev=>ev.preventDefault()); casePanel.append(form);
    }
    selection.addEventListener('change',paintCase);paintCase();container.append(details);
  }
  function addPrivacy(container) {
    const details=e('details',{class:'pf-card'});details.append(e('summary',{},t('privacyTitle')));details.append(p(t('privacyScope'),'pf-small'));
    const exportButton=button(t('exportData'),()=>action(async()=>{
      const data=await api('/privacy/export',{}); const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),href=URL.createObjectURL(blob),link=e('a',{href,download:'forum-testdata-'+new Date().toISOString().slice(0,10)+'.json'});
      document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);status(t('saved'));
    }),{'data-action':'export'});
    const erase=button(t('eraseData'),()=>{if(!confirm(t('confirmErase')))return;action(async()=>{
      await api('/privacy/erase',{});authChannel?.postMessage('changed');clearSession();render();status(`${t('deletionRequested')} ${t('providerDeletionPending')}`);
    });},{'data-action':'erase',class:'danger'});
    append(details,exportButton,erase);container.append(details);
  }
  function addRooms(container) {
    const section=e('section',{class:'pf-rooms','aria-labelledby':'rooms-heading'});append(section,e('h2',{id:'rooms-heading'},t('roomsTitle')));
    for(const room of ROOM_IDS) {
      const card=e('article',{class:'pf-room-choice'}), allowed=canUseRoom(room);
      append(card, e('h3',{},roomName(room)),p(t(room==='inside'?'insideDescription':'relativesDescription'),'pf-small'),button(roomName(room),()=>loadRoom(room,null,true),{disabled:!allowed,'aria-pressed':String(state.room===room),'data-room':room}));
      if(!allowed)card.append(p(t('roomAccessDenied'),'pf-small'));section.append(card);
    }
    container.append(section);
  }
  function addThreadList(container) {
    if(!state.room||!canUseRoom(state.room)){container.append(p(t('noAccessRooms')));return;}
    const list=e('section',{class:'pf-thread-list','aria-labelledby':'room-heading'});
    append(list,e('h2',{id:'room-heading',tabindex:'-1'},roomName(state.room)),button(t('refresh'),()=>loadRoom(state.room,state.thread),{'data-action':'refresh-room'}));
    if(!state.threads.length)list.append(p(t('noThreads')));
    const ul=e('ul');
    state.threads.forEach(thread=>{const li=e('li');append(li,button(thread.title,()=>loadRoom(state.room,thread.id,true),{'aria-current':thread.id===state.thread?'page':null,'data-thread':thread.id}),p(date(thread.created_at),'pf-small'));ul.append(li);});list.append(ul);
    container.append(list);
  }
  async function idempotent(path,payload,draft) {
    const signature=JSON.stringify(payload);
    if(draft.pending&&draft.pending.signature!==signature)throw new ApiError(409,'uncertain_submission');
    if(!draft.pending)draft.pending={signature,payload:{...payload,idempotency_key:crypto.randomUUID()}};
    try {const data=await api(path,draft.pending.payload);draft.pending=null;return data;}
    catch(error){if(error.status>=400&&error.status<500)draft.pending=null;throw error;}
  }
  function freezeUncertain(form,draft) {
    if(!draft.pending)return;
    form.querySelectorAll('textarea,input:not([type=submit])').forEach(node=>{node.readOnly=true;});
    const send=form.querySelector('button[type=submit]');if(send)send.textContent=t('retryExact');
    const msg=form.querySelector('[data-uncertain]')||e('p',{'data-uncertain':'',class:'pf-small'});msg.textContent=t('uncertainSubmission');if(!msg.parentElement)form.append(msg);
  }
  function addNewThread(container) {
    if(!state.room||!canUseRoom(state.room))return;
    const details=e('details',{class:'pf-card pf-compose'});details.append(e('summary',{},t('newThread')));
    const form=newForm('new-thread-form'), draft=state.newThreads.get(state.room)||{title:'',body:'',pending:null};state.newThreads.set(state.room,draft);
    const title=input(form,'threadTitle','thread-title',{required:true,minlength:3,maxlength:160,value:draft.title});
    const body=textarea(form,'firstMessage','thread-body',draft.body);
    append(form,p(t('bodyLimit'),'pf-small'));submit(form,draft.pending?t('retryExact'):t('createThread'));
    title.addEventListener('input',()=>{draft.title=title.value;});body.addEventListener('input',()=>{draft.body=body.value;});
    form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;action(async()=>{
      try {const data=await idempotent('/threads',{room:state.room,title:title.value,body:body.value},draft);state.newThreads.delete(state.room);await loadRoom(state.room,data.thread.id,true);status(t('saved'));}
      catch(error){freezeUncertain(form,draft);throw error;}
    });});freezeUncertain(form,draft);details.append(form);container.append(details);
  }
  function openDialog(title,build,opener) {
    const previous=dialog;previous?.close();previous?.remove();
    const current=e('dialog',{class:'pf-dialog','aria-labelledby':'forum-dialog-heading'});dialog=current;
    const close=button(t('close'),()=>current.close(),{class:'pf-dialog-close'});
    append(current,e('h2',{id:'forum-dialog-heading'},title),close);build(current);current.append(e('p',{'data-dialog-status':'',role:'status','aria-live':'polite',class:'pf-small'}));document.body.append(current);
    current.addEventListener('close',()=>{current.remove();if(dialog===current)dialog=null;opener?.isConnected&&opener.focus();},{once:true});current.showModal();current.querySelector('textarea,input,button')?.focus();
  }
  function messageActions(article,message) {
    const actions=e('div',{class:'pf-message-actions'}),own=message.author_id===state.me.member.user_id;
    if(own&&message.state==='active') {
      const edit=button(t('edit'),()=>openDialog(t('editing'),panel=>{
        const form=newForm('edit-message-form'),body=textarea(form,'reply','edit-body',state.editDrafts.get(message.id)??message.body);body.addEventListener('input',()=>state.editDrafts.set(message.id,body.value));append(form,p(t('bodyLimit'),'pf-small'));submit(form,t('saveEdit'));
        form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;action(async()=>{const data=await api('/messages/edit',{message_id:message.id,body:body.value,version:message.version});state.editDrafts.delete(message.id);dialog?.close();await loadRoom(state.room,state.thread,true,data.message);status(t('saved'));});});panel.append(form);
      },edit),{'data-message-action':'edit'});actions.append(edit);
      actions.append(button(t('delete'),()=>{if(!confirm(t('confirmDelete')))return;action(async()=>{const data=await api('/messages/delete',{message_id:message.id,version:message.version});await loadRoom(state.room,state.thread,true,data.message);status(t('saved'));});},{'data-message-action':'delete'}));
    }
    if(message.state!=='deleted') {
      const report=button(t('report'),()=>openDialog(t('report'),panel=>{
        const form=newForm('report-form'),reason=textarea(form,'reason','report-reason','',{minlength:3,maxlength:1500,rows:3});submit(form,t('submitReport'));
        form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;action(async()=>{await api('/messages/report',{message_id:message.id,version:message.version,reason:reason.value});dialog?.close();status(t('reportSaved'));});});panel.append(form);
      },report),{'data-message-action':'report'});actions.append(report);
      if(isModerator(state.room)) {
        const target=message.state==='hidden'?'active':'hidden', key=target==='active'?'restore':'hide';
        const moderate=button(t(key),()=>openDialog(t('moderationTitle'),panel=>{
          const form=newForm('moderate-form'),reason=textarea(form,'reason','moderate-reason','',{minlength:3,maxlength:1500,rows:3});submit(form,t(key));
          form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;action(async()=>{const data=await api('/messages/moderate',{message_id:message.id,version:message.version,state:target,reason:reason.value});dialog?.close();await loadRoom(state.room,state.thread,true,data.message);status(t('saved'));});});panel.append(form);
        },moderate),{'data-message-action':key});actions.append(moderate);
      }
    }
    article.append(actions);
  }
  function addConversation(container) {
    if(!state.threadInfo||!state.thread)return;
    const section=e('section',{class:'pf-conversation','aria-labelledby':'conversation-heading'});
    append(section,e('h2',{id:'conversation-heading',tabindex:'-1'},state.threadInfo.title),p(t('originalContent'),'pf-small'));
    const posts=e('div',{class:'pf-posts'});
    const shown=[...state.messages,...[...state.acknowledged.values()].filter(item=>!state.messages.some(m=>m.id===item.id))];
    shown.forEach(message=>{
      const own=message.author_id===state.me.member.user_id,article=e('article',{class:'pf-post'+(own?' pf-own':''),'data-message':message.id});
      const alias=message.author_alias||(own?state.me.member.alias:t('authorFallback'));
      append(article,e('h3',{},alias),p(date(message.created_at),'pf-small'));
      if(message.state==='deleted')article.append(p(t('deletedMessage'),'pf-tombstone'));
      else if(message.state==='hidden'&&!isModerator(state.room))article.append(p(t('hiddenMessage'),'pf-tombstone'));
      else {if(message.state==='hidden')article.append(p(t('hiddenMessage'),'pf-small'));article.append(p(message.body,'pf-message-body'));}
      messageActions(article,message);posts.append(article);
    });if(!state.messages.length)posts.append(p(t('empty')));section.append(posts);
    if(state.messageMore){section.append(p(t('moreMessages'),'pf-small'));section.append(button(t('loadMoreMessages'),()=>action(async()=>{await nextMessages();render();document.getElementById('conversation-heading')?.focus();}),{'data-action':'more-messages'}));}
    if(state.threadInfo.state==='locked')section.append(p(t('lockedThread')));
    else if(state.threadInfo.state==='active'&&canUseRoom(state.room)) {
      const draft=state.drafts.get(state.thread)||{body:'',pending:null};state.drafts.set(state.thread,draft);
      const form=newForm('reply-form'),body=textarea(form,'reply','reply-body',draft.body);
      append(form,p(t('bodyLimit'),'pf-small'));submit(form,draft.pending?t('retryExact'):t('sendReply'));
      body.addEventListener('input',()=>{draft.body=body.value;});
      form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;action(async()=>{
        try{const data=await idempotent('/messages',{thread_id:state.thread,body:body.value},draft);state.drafts.delete(state.thread);await refreshAfterReply(data.message);status(t('saved'));}
        catch(error){freezeUncertain(form,draft);throw error;}
      });});freezeUncertain(form,draft);section.append(form);
    }
    container.append(section);
  }
  async function logout() {
    if(state.busy)return;busy(true);
    authChannel?.postMessage('signed-out');clearSession();state.authDirty=false;state.logoutUnconfirmed=true;render();status(t('waiting'));
    try{await api('/logout',{});state.logoutUnconfirmed=false;render();status(t('signedOut'));}
    catch(error){state.logoutUnconfirmed=true;render();status(t('logoutUnconfirmed'),true);}
    finally{finishBusy();}
  }
  function render() {
    const oldReview=root.querySelector('.pf-reviewer');if(oldReview)state.reviewOpen=oldReview.open;
    const intro=e('section',{class:'pf-intro'});append(intro,p('THE VOICE FROM INSIDE','eyebrow'),e('h1',{},t('title')),p(t('intro')),p(t('separateRooms'),'pf-room-explanation'));
    const service=e('p',{id:'forum-status',role:'status','aria-live':'polite','aria-atomic':'true',class:'pf-status'},state.ready?t('serviceReady'):t('checkingService'));
    const content=e('div',{class:'pf-content'});root.replaceChildren(intro,service,content);
    if(!state.ready) {append(content,p(t(state.checking?'checkingService':'serviceClosed')),p(t('noBackendLocal'),'pf-small'),button(t('refresh'),()=>start(),{disabled:state.checking}));return;}
    if(!state.me) {
      const card=e('section',{class:'pf-card pf-login','aria-labelledby':'login-heading'});append(card,e('h2',{id:'login-heading'},t('signInTitle')),p(t('syntheticOnly')),p(t('noIdentityCheck'),'pf-small'));
      const form=newForm('login-form');form.autocomplete='on';
      const email=input(form,'email','login-email',{type:'email',required:true,autocomplete:'username',autocapitalize:'none',spellcheck:'false',maxlength:254});
      const password=input(form,'password','login-password',{type:'password',required:true,autocomplete:'current-password',maxlength:256});submit(form,t('signIn'));
      form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;action(async()=>{
        try {await api('/login',{email:email.value,password:password.value});password.value='';authChannel?.postMessage('changed');await loadMe();render();if(state.room)await loadRoom(state.room,state.thread,true);else document.getElementById('account-heading')?.focus();}
        catch(error){password.value='';if(error.status===401){status(t('invalidCredentials'),true);return;}throw error;}
      });});card.append(form);if(state.logoutUnconfirmed)card.append(button(t('signOut'),()=>logout()));content.append(card);if(state.busy)busy(true);return;
    }
    const sidebar=e('aside',{class:'pf-sidebar'}),main=e('div',{class:'pf-main'});append(content,sidebar,main);
    addAccount(sidebar);addApplication(sidebar);addReviewer(sidebar);addPrivacy(sidebar);addRooms(main);addThreadList(main);addNewThread(main);addConversation(main);
    if(state.busy)busy(true);
  }
  async function start() {
    if(state.busy)return;state.ready=false;state.checking=true;render();busy(true);
    try {
      const h=await api('/health');
      if(h?.mode!=='synthetic'||h.publicRegistration!==false||h.realKyc!==false)throw new ApiError(503,'not_private_synthetic_mode');
      state.ready=true;state.checking=false;
      try {await loadMe();}catch(error){if(error.status!==401)throw error;clearSession();}
      render();if(state.room&&state.me)await loadRoom(state.room,state.thread);
    } catch(error) {if(error.code!=='stale_session'){state.ready=false;state.checking=false;clearSession();render();status(errorText(error),true);}}
    finally{finishBusy();}
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&state.me&&!state.busy)action(()=>refreshSession());});
  try {authChannel=new BroadcastChannel('sfi-private-forum-auth');authChannel.addEventListener('message',event=>{clearSession();render();if(event.data==='signed-out'){state.authDirty=false;status(t('signedOut'));return;}if(state.busy)state.authDirty=true;else start();});}catch{}
  window.addEventListener('pagehide',()=>{viewRequest?.abort();dialog?.close();});
  start();
})();
