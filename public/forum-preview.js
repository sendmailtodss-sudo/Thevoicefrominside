/* Private synthetic forum trial. No accounts, storage or network requests. */
(() => {
  'use strict';
  const root = document.querySelector('[data-forum-preview]');
  if (!root) return;
  const en = document.documentElement.lang === 'en';
  const copy = en ? {
    rooms: ['The way forward', 'For those close to someone inside'],
    topics: ['How did you find a new creative community?', 'Small steps in the first days home', 'How do we talk about missing someone?', 'Finding support in daily life'],
    posts: [
      ['I would like to try a drawing group when I get home. Does anyone have an example of a gentle first step?', 'In this fictional example, I asked a local library about an open workshop. I could look around before deciding to join.'],
      ['My first-week plan has room for rest as well as appointments. What small routines helped you?', 'A short walk and a written plan helped the fictional person in this example. Everyone’s needs will be different.'],
      ['How can we make room for missing someone without every conversation becoming about prison?', 'In this fictional conversation, we set aside time to talk and also kept one ordinary activity together.'],
      ['I am looking for somewhere to talk about my own experience as a relative.', 'This example suggests asking an independent support organisation what it offers, without sharing private case details here.']
    ],
    writer: 'Example participant', label: 'Fictional conversation', reply: 'A reply in the example',
    saved: 'Draft kept in this tab only. Nothing was sent. Reloading or closing the page removes it.',
    cleared: 'This draft has been cleared.', empty: 'Write an example draft first.',
    hint: 'Use invented examples only. This is not a confidential channel or an open support service.'
  } : {
    rooms: ['Veien videre', 'For deg som står nær'],
    topics: ['Hvordan fant dere et nytt kreativt miljø?', 'Små steg den første tiden hjemme', 'Hvordan snakker vi om savnet?', 'Å finne støtte i hverdagen'],
    posts: [
      ['Jeg vil gjerne prøve en tegnegruppe når jeg kommer hjem. Har noen et eksempel på et forsiktig første steg?', 'I dette oppdiktede eksemplet spurte jeg biblioteket om et åpent verksted. Jeg kunne se meg rundt før jeg bestemte meg.'],
      ['Planen min for den første uken har plass til hvile og avtaler. Hvilke små rutiner hjalp dere?', 'En kort tur og en skriftlig plan hjalp den oppdiktede personen i dette eksemplet. Behovene vil være ulike.'],
      ['Hvordan gir vi plass til savnet uten at alle samtaler handler om fengsel?', 'I denne oppdiktede samtalen satte vi av tid til å snakke, og beholdt også en vanlig aktivitet sammen.'],
      ['Jeg leter etter et sted å snakke om mine egne erfaringer som pårørende.', 'Dette eksemplet foreslår å spørre en uavhengig støtteorganisasjon hva de tilbyr, uten å dele private saksopplysninger her.']
    ],
    writer: 'Eksempeldeltaker', label: 'Oppdiktet samtale', reply: 'Et svar i eksemplet',
    saved: 'Kladden beholdes bare i denne fanen. Ingenting er sendt. Den slettes når du laster siden på nytt eller lukker den.',
    cleared: 'Denne kladden er tømt.', empty: 'Skriv en eksempelkladd først.',
    hint: 'Bruk bare oppdiktede eksempler. Dette er ikke en fortrolig kanal eller en åpen støttetjeneste.'
  };
  Object.assign(copy, en ? {
    draft:'Draft application', submitted:'Waiting for identity review', review:'Identity review completed in trial; awaiting moderator', approved:'Access approved in this trial', suspended:'Trial access suspended', rejected:'Example application declined',
    roleNames:{inmate:'Person in prison',former:'Former prisoner',relative:'Relative',professional:'Professional'},
    denied:'Access is closed. Complete the example review and moderator decision first.', wrongRoom:'This example membership does not have access to that room.',
    complete:'Complete fictional evidence', incomplete:'Fictional evidence is incomplete', identity:'Identity and role review', member:'Participant', role:'Role', state:'State', evidence:'Evidence', pending:'Not completed', checked:'Completed in trial',
    queued:'Example application added to the local review queue. No application was sent.', missingAck:'Confirm that this is a fictional trial before continuing.', duplicate:'This case is already being processed. Edit and apply again to change it.',
    missingEvidence:'Complete fictional evidence is required before the review can be marked complete.', cannotApprove:'Identity review and a room scope must be complete before approval.', needReason:'Choose a reason before making this decision.',
    posted:'Example reply added locally in this tab. Nothing was sent to a service.', local:'Local trial reply', liveGate:'Trial access is open for:', reset:'The trial has been reset. All local drafts and example replies were removed.'
  } : {
    draft:'Søknadsutkast', submitted:'Venter på ID- og rollekontroll', review:'Kontrollen er fullført i prøven; venter på moderator', approved:'Tilgang godkjent i denne prøven', suspended:'Prøvetilgangen er stanset', rejected:'Eksempelsøknaden er avslått',
    roleNames:{inmate:'Innsatt',former:'Tidligere innsatt',relative:'Pårørende',professional:'Fagperson'},
    denied:'Tilgangen er stengt. Fullfør eksempelkontrollen og moderatorbeslutningen først.', wrongRoom:'Dette eksempelmedlemskapet har ikke tilgang til det rommet.',
    complete:'Komplett oppdiktet grunnlag', incomplete:'Det oppdiktede grunnlaget er ufullstendig', identity:'ID- og rollekontroll', member:'Deltaker', role:'Rolle', state:'Status', evidence:'Grunnlag', pending:'Ikke fullført', checked:'Fullført i prøven',
    queued:'Eksempelsøknaden er lagt i den lokale vurderingskøen. Ingen søknad er sendt.', missingAck:'Bekreft at dette er en oppdiktet prøve før du fortsetter.', duplicate:'Saken er allerede til behandling. Rediger og søk på nytt hvis noe skal endres.',
    missingEvidence:'Et komplett oppdiktet grunnlag må foreligge før kontrollen kan markeres fullført.', cannotApprove:'ID-kontroll og romtilgang må være avklart før godkjenning.', needReason:'Velg en grunn før du tar denne beslutningen.',
    posted:'Eksempelsvaret er lagt til lokalt i denne fanen. Ingenting er sendt til en tjeneste.', local:'Lokalt prøvesvar', liveGate:'Prøvetilgangen er åpen for:', reset:'Prøven er nullstilt. Alle lokale kladder og eksempelsvar er fjernet.'
  });
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const panel=$('[data-forum-panel]'),heading=$('[data-forum-heading]'),threadNav=$('[data-forum-threads]'),posts=$('[data-forum-posts]'),draft=$('[data-forum-draft]'),status=$('[data-forum-status]');
  const persona=$('[data-member-persona]'),moderator=$('[data-moderator-case]'),role=$('[data-member-role]'),evidence=$('[data-member-evidence]'),ack=$('[data-member-ack]');
  const drafts=new Map(),messages=new Map(),events=[];
  const fresh=()=>[
    {id:'0',role:'former',state:'draft',evidence:false,verified:false,rooms:[],requestedRooms:[]},
    {id:'1',role:'relative',state:'submitted',evidence:false,verified:false,rooms:[],requestedRooms:[]},
    {id:'2',role:'professional',state:'review',evidence:true,verified:true,rooms:[],requestedRooms:[]},
    {id:'3',role:'former',state:'suspended',evidence:true,verified:true,rooms:[0],requestedRooms:[]}
  ];
  let records=fresh(),current=0,opener=null,activePersona='0';
  const member=()=>records[Number(activePersona)];
  const reviewed=()=>records[Number(moderator.value)];
  const label=r=>(en?'Example ':'Eksempel ')+String.fromCharCode(65+Number(r.id));
  const canRead=(r,room)=>r.state==='approved'&&r.verified&&r.rooms.includes(room);
  const draftKey=()=>member().id+':'+current;
  function announce(text){$('[data-member-feedback]').textContent=text;}
  function addEvent(r,action){events.unshift(label(r)+' · '+action);events.length=Math.min(20,events.length);const list=$('[data-member-events]');list.replaceChildren();for(const text of events){const li=document.createElement('li');li.textContent=text;list.append(li);}}
  function keepCurrent(){if(!panel.hidden&&canRead(member(),Math.floor(current/2)))drafts.set(draftKey(),draft.value);}
  function close(returnFocus=true){keepCurrent();panel.hidden=true;$$('[data-forum-open]').forEach(b=>b.setAttribute('aria-expanded','false'));if(returnFocus)opener?.focus();}
  function renderReview(){
    const r=reviewed(),summary=$('[data-moderator-summary]');summary.replaceChildren();
    for(const [term,value] of [[copy.member,label(r)],[copy.role,copy.roleNames[r.role]],[copy.state,copy[r.state]],[copy.evidence,r.evidence?copy.complete:copy.incomplete],[copy.identity,r.verified?copy.checked:copy.pending]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=term;dd.textContent=value;summary.append(dt,dd);}
    $('[data-moderator-verify]').disabled=r.state!=='submitted'||!r.evidence;
    const grants=$('[data-moderator-grants]');grants.hidden=r.role!=='professional';grants.disabled=r.state!=='review';
    $$('[data-moderator-room]').forEach(b=>{b.checked=r.requestedRooms.includes(Number(b.value));});
    $('[data-moderator-approve]').disabled=!(r.state==='review'&&r.verified&&r.evidence&&(r.role!=='professional'||r.requestedRooms.length));
    $('[data-moderator-reject]').disabled=!['submitted','review'].includes(r.state);
    $('[data-moderator-suspend]').disabled=r.state!=='approved';
    $('[data-moderator-reopen]').disabled=!['suspended','rejected'].includes(r.state);
  }
  function render(){
    const r=member();root.dataset.memberState=r.state;root.dataset.activeRole=r.role;
    role.value=r.role;evidence.checked=r.evidence;$('[data-member-fields]').disabled=r.state!=='draft';
    $('[data-member-state]').textContent=copy[r.state];$('[data-member-detail]').textContent=(r.evidence?copy.complete:copy.incomplete)+' · '+copy.identity+': '+(r.verified?copy.checked:copy.pending);
    $('[data-member-edit]').disabled=r.state==='draft';
    for(const select of [persona,moderator])for(const option of select.options){const record=records[Number(option.value)];option.textContent=label(record)+' — '+copy[record.state];}
    const step={draft:0,submitted:1,review:2,approved:3,suspended:2,rejected:2}[r.state];
    $$('[data-member-step]').forEach(el=>{if(Number(el.dataset.memberStep)===step)el.setAttribute('aria-current','step');else el.removeAttribute('aria-current');});
    $$('[data-forum-open]').forEach(b=>{b.disabled=!canRead(r,Math.floor(Number(b.dataset.forumOpen)/2));});
    $$('[data-forum-room]').forEach(b=>{b.disabled=!canRead(r,Number(b.dataset.forumRoom));});
    $('[data-forum-gate]').textContent=r.state==='approved'?copy.liveGate+' '+r.rooms.map(i=>copy.rooms[i]).join(', '):copy.denied;
    if(!panel.hidden&&!canRead(r,Math.floor(current/2)))close(false);
    renderReview();
  }
  function renderPosts(){
    posts.replaceChildren();
    const examples=copy.posts[current].map((text,i)=>({text,author:i?copy.reply:copy.writer,meta:copy.label}));
    for(const item of [...examples,...(messages.get(current)||[])]){const article=document.createElement('article'),author=document.createElement('h4'),meta=document.createElement('p'),body=document.createElement('p');author.textContent=item.author;meta.className='meta';meta.textContent=item.meta;body.textContent=item.text;article.append(author,meta,body);if(item.local)article.classList.add('forum-own-reply');posts.append(article);}
  }
  function open(index,source){
    const room=Math.floor(index/2);if(!Number.isInteger(index)||index<0||index>=copy.topics.length||!canRead(member(),room)){announce(member().state==='approved'?copy.wrongRoom:copy.denied);return;}
    keepCurrent();current=index;if(source)opener=source;panel.hidden=false;
    $('[data-forum-room-title]').textContent=copy.rooms[room];heading.textContent=copy.topics[index];
    $$('[data-forum-room]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.forumRoom)===room)));
    threadNav.replaceChildren();for(let i=room*2;i<room*2+2;i++){const b=document.createElement('button');b.type='button';b.textContent=copy.topics[i];b.setAttribute('aria-pressed',String(i===index));b.addEventListener('click',()=>open(i));threadNav.append(b);}
    renderPosts();draft.value=drafts.get(draftKey())||'';status.textContent=copy.hint;heading.focus();
    $$('[data-forum-open]').forEach(b=>b.setAttribute('aria-expanded',String(Number(b.dataset.forumOpen)===index)));
  }
  $('[data-member-form]').addEventListener('submit',event=>{
    event.preventDefault();const r=member();if(r.state!=='draft'){announce(copy.duplicate);return;}if(!ack.checked){announce(copy.missingAck);return;}
    if(!Object.hasOwn(copy.roleNames,role.value))return;
    r.role=role.value;r.evidence=evidence.checked;r.state='submitted';r.verified=false;r.rooms=[];r.requestedRooms=[];ack.checked=false;moderator.value=r.id;addEvent(r,copy.submitted);announce(copy.queued);render();
  });
  role.addEventListener('change',()=>{if(member().state==='draft')member().role=role.value;});
  evidence.addEventListener('change',()=>{if(member().state==='draft')member().evidence=evidence.checked;});
  persona.addEventListener('change',()=>{close(false);activePersona=persona.value;ack.checked=false;announce('');$('[data-moderator-feedback]').textContent='';render();});
  moderator.addEventListener('change',()=>{$('[data-moderator-reason]').value='';$('[data-moderator-feedback]').textContent='';renderReview();});
  $('[data-member-edit]').addEventListener('click',()=>{const r=member();close(false);r.state='draft';r.verified=false;r.rooms=[];r.requestedRooms=[];ack.checked=false;addEvent(r,copy.draft);render();role.focus();});
  $$('[data-moderator-room]').forEach(b=>b.addEventListener('change',()=>{const r=reviewed();if(r.state!=='review'||r.role!=='professional')return;r.requestedRooms=$$('[data-moderator-room]').filter(b=>b.checked).map(b=>Number(b.value));renderReview();}));
  $('[data-moderator-verify]').addEventListener('click',()=>{const r=reviewed();if(r.state!=='submitted'||!r.evidence){$('[data-moderator-feedback]').textContent=copy.missingEvidence;return;}r.verified=true;r.state='review';addEvent(r,copy.review);$('[data-moderator-feedback]').textContent=copy.review;render();});
  $('[data-moderator-approve]').addEventListener('click',()=>{
    const r=reviewed();const rooms=r.role==='professional'?r.requestedRooms.filter(i=>i===0||i===1):[r.role==='relative'?1:0];
    if(r.state!=='review'||!r.verified||!r.evidence||!rooms.length){$('[data-moderator-feedback]').textContent=copy.cannotApprove;return;}
    r.state='approved';r.rooms=[...new Set(rooms)];addEvent(r,copy.approved);$('[data-moderator-feedback]').textContent=copy.approved;render();
  });
  function decision(type){const r=reviewed(),reason=$('[data-moderator-reason]');if(!reason.value){$('[data-moderator-feedback]').textContent=copy.needReason;return;}if(type==='rejected'&&!['submitted','review'].includes(r.state)||type==='suspended'&&r.state!=='approved')return;r.state=type;r.reason=reason.selectedOptions[0].textContent;if(type==='rejected'){r.verified=false;r.rooms=[];}addEvent(r,copy[type]+' · '+r.reason);$('[data-moderator-feedback]').textContent=copy[type];render();}
  $('[data-moderator-reject]').addEventListener('click',()=>decision('rejected'));$('[data-moderator-suspend]').addEventListener('click',()=>decision('suspended'));
  $('[data-moderator-reopen]').addEventListener('click',()=>{const r=reviewed();if(!['suspended','rejected'].includes(r.state))return;r.state='submitted';r.verified=false;r.rooms=[];r.reason='';addEvent(r,copy.submitted);render();});
  $$('[data-forum-open]').forEach(b=>b.addEventListener('click',()=>open(Number(b.dataset.forumOpen),b)));$$('[data-forum-room]').forEach(b=>b.addEventListener('click',()=>open(Number(b.dataset.forumRoom)*2)));
  $('[data-forum-close]').addEventListener('click',()=>close());
  $('[data-forum-form]').addEventListener('submit',event=>{event.preventDefault();if(panel.hidden||!canRead(member(),Math.floor(current/2))){status.textContent=copy.denied;return;}if(!draft.value.trim()){status.textContent=copy.empty;draft.focus();return;}const list=messages.get(current)||[];if(list.length>=30)return;list.push({text:draft.value.trim().slice(0,1500),author:label(member()),meta:copy.local,local:true});messages.set(current,list);drafts.delete(draftKey());draft.value='';renderPosts();status.textContent=copy.posted;draft.focus();});
  $('[data-forum-save]').addEventListener('click',()=>{if(!canRead(member(),Math.floor(current/2))){status.textContent=copy.denied;return;}keepCurrent();status.textContent=copy.saved;});
  $('[data-forum-clear]').addEventListener('click',()=>{if(!canRead(member(),Math.floor(current/2)))return;drafts.delete(draftKey());draft.value='';status.textContent=copy.cleared;draft.focus();});
  $('[data-member-reset]').addEventListener('click',()=>{close(false);records=fresh();drafts.clear();messages.clear();events.length=0;$('[data-member-events]').replaceChildren();persona.value='0';activePersona='0';moderator.value='0';ack.checked=false;$('[data-moderator-feedback]').textContent='';$('[data-moderator-reason]').value='';draft.value='';announce(copy.reset);render();persona.focus();});
  draft.value='';$('[data-member-reset]').disabled=false;render();root.dataset.ready='true';
})();
