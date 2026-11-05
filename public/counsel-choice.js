(() => {
  'use strict';
  const en=document.documentElement.lang==='en',path=en?'/en/counsel-choice/':'/advokatvalg/';
  const t=en?{
    loading:'Loading the candidate list …',unconfigured:'No candidate list has been opened yet.',disabled:'This advisory choice is not open for changes.',closed:'This advisory choice has closed.',unavailable:'The service is unavailable. Counts are unknown.',open:'The advisory choice is open.',unknown:'Not available',accounts:'accounts with a current choice',votes:'account choices',proposed:'Proposed — no invitation or willingness confirmed',invited:'Invited — no assignment agreed',available:'Has expressed interest — no assignment agreed',source:'Official professional page',select:'Choose',selected:'Your current choice',none:'You have no current choice.',anonymous:'Sign in to choose, change or withdraw one preference.',signed:'You are signed in. Only your current choice is shown to you.',save:'Save my choice',withdraw:'Withdraw my choice',saving:'Saving …',saved:'Your choice has been saved.',withdrawn:'Your choice has been withdrawn.',updated:'Candidate list refreshed.',close:'Closes',version:'List version',error:'The action could not be confirmed. Refresh to check your current choice before trying again.',auth:'Sign in to continue.',stale:'The candidate list changed. Review the refreshed list before choosing.',inactive:'That candidate is no longer on the list. Review the refreshed list.',quota:'Too many changes in a short time. Try again in ten minutes.',invalid:'Choose a candidate from the current list.',sign:'Sign in with ChatGPT',signOut:'Sign out',refresh:'Refresh list'
  }:{
    loading:'Henter kandidatlisten …',unconfigured:'Ingen kandidatliste er åpnet ennå.',disabled:'Advokatvalget er ikke åpnet for endringer.',closed:'Advokatvalget er avsluttet.',unavailable:'Tjenesten er utilgjengelig. Tallene er ukjente.',open:'Det rådgivende advokatvalget er åpent.',unknown:'Ikke tilgjengelig',accounts:'kontoer med et gjeldende valg',votes:'kontovalg',proposed:'Foreslått — invitasjon eller interesse er ikke bekreftet',invited:'Invitert — ingen oppdragsavtale inngått',available:'Har uttrykt interesse — ingen oppdragsavtale inngått',source:'Offisiell yrkesprofil',select:'Velg',selected:'Ditt gjeldende valg',none:'Du har ikke et gjeldende valg.',anonymous:'Logg inn for å velge, endre eller trekke tilbake én preferanse.',signed:'Du er innlogget. Bare du får se ditt eget valg her.',save:'Lagre mitt valg',withdraw:'Trekk tilbake mitt valg',saving:'Lagrer …',saved:'Valget ditt er lagret.',withdrawn:'Valget ditt er trukket tilbake.',updated:'Kandidatlisten er oppdatert.',close:'Avsluttes',version:'Listeversjon',error:'Handlingen kunne ikke bekreftes. Oppdater listen for å kontrollere ditt gjeldende valg før du prøver igjen.',auth:'Logg inn for å fortsette.',stale:'Kandidatlisten er endret. Les den oppdaterte listen før du velger.',inactive:'Kandidaten er ikke lenger på listen. Les den oppdaterte listen.',quota:'For mange endringer på kort tid. Prøv igjen om ti minutter.',invalid:'Velg en kandidat fra den gjeldende listen.',sign:'Logg inn med ChatGPT',signOut:'Logg ut',refresh:'Oppdater listen'
  };
  const $=id=>document.getElementById(id),list=$('counsel-candidates'),form=$('counsel-form');
  let summary=null,mine=null,authenticated=false,busy=false;
  $('counsel-sign-in').href='/signin-with-chatgpt?returnTo='+encodeURIComponent(path);
  $('counsel-sign-out').href='/signout-with-chatgpt?returnTo='+encodeURIComponent(path);
  $('counsel-sign-in').textContent=t.sign;$('counsel-sign-out').textContent=t.signOut;
  $('counsel-save').textContent=t.save;$('counsel-withdraw').textContent=t.withdraw;$('counsel-refresh').textContent=t.refresh;
  async function api(route,method='GET',body){
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
    try{
      const response=await fetch('/api/counsel-ballot'+route,{method,credentials:'same-origin',cache:'no-store',signal:controller.signal,headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});
      const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error||'network'),{code:data.error,status:response.status});return data;
    }finally{clearTimeout(timer);}
  }
  function validate(s){
    if(!s||s.advisoryOnly!==true||s.countUnit!=='site_accounts'||!['unconfigured','disabled','closed','open','unavailable'].includes(s.mode)||s.open!==(s.mode==='open')||!Array.isArray(s.candidates)||s.candidates.length>50||!s.totals)throw Error('response');
    const validCount=n=>n===null||(Number.isSafeInteger(n)&&n>=0);if(!validCount(s.totals.participatingAccounts))throw Error('response');
    for(const c of s.candidates){const url=new URL(c.officialUrl);if(typeof c.id!=='string'||typeof c.name!=='string'||typeof c.firm!=='string'||!['proposed','invited','available'].includes(c.status)||url.protocol!=='https:'||url.username||url.password||!validCount(c.votes))throw Error('response');}
    return s;
  }
  function node(tag,content,cls){const n=document.createElement(tag);if(content!==undefined)n.textContent=content;if(cls)n.className=cls;return n;}
  function message(value){$('counsel-message').textContent=value;}
  function render(){
    const s=summary;$('counsel-status').textContent=t[s.mode];$('counsel-heading').textContent=s.title||(en?'Candidate list':'Kandidatliste');
    $('counsel-total').textContent=s.totals.participatingAccounts===null?t.unknown:new Intl.NumberFormat(en?'en-GB':'nb-NO').format(s.totals.participatingAccounts);
    $('counsel-total-label').textContent=t.accounts;
    $('counsel-deadline').textContent=s.closesAt?t.close+': '+new Intl.DateTimeFormat(en?'en-GB':'nb-NO',{dateStyle:'long',timeStyle:'short'}).format(new Date(s.closesAt)):'';
    $('counsel-version').textContent=s.version?t.version+': '+s.version:'';
    list.replaceChildren();
    for(const candidate of s.candidates){
      const article=node('article',undefined,'candidate'),title=node('h3',candidate.name),firm=node('p',candidate.firm),status=node('p',t[candidate.status],'candidate-status'),count=node('p',(candidate.votes===null?t.unknown:String(candidate.votes))+' '+t.votes,'candidate-count');
      const official=node('a',t.source);official.href=candidate.officialUrl;official.target='_blank';official.rel='noopener noreferrer';
      article.append(title,firm,status,count,official);
      if(authenticated&&s.open){const label=node('label',undefined,'candidate-choice'),radio=document.createElement('input');radio.type='radio';radio.name='candidateId';radio.value=candidate.id;radio.checked=mine?.candidateId===candidate.id;radio.required=true;radio.disabled=busy;label.append(radio,node('span',t.select+' '+candidate.name));article.append(label);}
      if(mine?.candidateId===candidate.id)article.append(node('p',t.selected,'candidate-selected'));
      list.append(article);
    }
    const canChoose=authenticated&&s.open;
    $('counsel-save').hidden=!canChoose;$('counsel-save').disabled=busy;
    $('counsel-withdraw').hidden=!canChoose||!mine?.candidateId;$('counsel-withdraw').disabled=busy;
    $('counsel-sign-in').hidden=authenticated||!s.version||s.mode==='unavailable';$('counsel-sign-out').hidden=!authenticated;
    $('counsel-auth').textContent=!s.version?'':authenticated?t.signed:t.anonymous;
    $('counsel-own').textContent=authenticated&&!mine?.candidateId?t.none:'';
    $('counsel-refresh').disabled=busy;
  }
  async function load(feedback=''){
    $('counsel-status').textContent=t.loading;
    try{
      summary=validate(await api(''));mine=null;authenticated=false;
      if(summary.version&&summary.mode!=='unavailable'){
        try{mine=await api('/me');if(mine.version!==summary.version||!(mine.candidateId===null||summary.candidates.some(c=>c.id===mine.candidateId)))throw Error('response');authenticated=true;}
        catch(error){if(error.status!==401)throw error;}
      }
      render();message(feedback);
    }catch{
      summary=null;mine=null;authenticated=false;list.replaceChildren();$('counsel-status').textContent=t.unavailable;$('counsel-total').textContent=t.unknown;
      for(const id of ['counsel-save','counsel-withdraw','counsel-sign-in','counsel-sign-out'])$(id).hidden=true;
      for(const id of ['counsel-deadline','counsel-version','counsel-auth','counsel-own'])$(id).textContent='';message(t.error);$('counsel-refresh').disabled=false;
    }
  }
  async function mutate(route,candidateId){
    if(busy||!summary?.open||!authenticated)return;
    busy=true;const version=summary.version;render();message(t.saving);
    try{await api(route,'POST',{version,...(candidateId?{candidateId}:{})});busy=false;await load(route==='/vote'?t.saved:t.withdrawn);}
    catch(error){busy=false;const messages={authentication_required:t.auth,version_conflict:t.stale,inactive_candidate:t.inactive,closed:t.closed,disabled:t.disabled,rate_limited:t.quota,invalid_input:t.invalid};
      await load(messages[error.code]||t.error);
    }
  }
  form.addEventListener('submit',event=>{event.preventDefault();const value=new FormData(form).get('candidateId');if(value)mutate('/vote',value);else message(t.invalid);});
  $('counsel-withdraw').addEventListener('click',()=>mutate('/withdraw'));
  $('counsel-refresh').addEventListener('click',()=>{if(!busy)load(t.updated);});
  load();
})();
