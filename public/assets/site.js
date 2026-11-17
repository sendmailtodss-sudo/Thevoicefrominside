(() => {
  'use strict';
  const origin = location.origin;
  const en = document.documentElement.lang === 'en';
  const text = (no, english) => en ? english : no;
  const canonical = document.querySelector('link[rel="canonical"]')?.href || origin + location.pathname;
  const page = new URL(canonical).pathname;
  const parameters = new URLSearchParams(location.search);
  const translationView = location.hostname.endsWith('.translate.goog') || location.hostname === 'translate.google.com';
  const translationCode = parameters.get('_x_tr_tl') || parameters.get('tl');
  const translatedLanguage = translationView && /^(?:no|en|pl|ar|uk|ru|lt|ro|de|fr|es|tr|so|sv|da)$/.test(translationCode || '') ? translationCode : null;
  const title = document.querySelector('[data-public-share-title]')?.dataset.publicShareTitle || document.querySelector('meta[property="og:title"]')?.content || document.title;
  const description = document.querySelector('meta[name="description"]')?.content || '';
  const channels = {facebook:'Facebook',x:'X',linkedin:'LinkedIn',bluesky:'Bluesky',threads:'Threads',whatsapp:'WhatsApp',telegram:'Telegram',email:text('E-post','Email'),copy:text('Kopiert lenke','Copied link'),native:text('Enhetens delingsmeny','Device share menu'),direct:text('Direkte / ukjent','Direct / unknown'),other:text('Andre nettsteder','Other websites')};
  const source = (() => {
    const via = new URLSearchParams(location.search).get('via');
    if (Object.hasOwn(channels, via)) return via;
    try { const host = new URL(document.referrer).hostname; if(host === location.hostname) return 'direct';
      for(const [key, domains] of Object.entries({facebook:['facebook.com','fb.com'],x:['x.com','twitter.com','t.co'],linkedin:['linkedin.com'],bluesky:['bsky.app'],threads:['threads.net','threads.com'],whatsapp:['whatsapp.com'],telegram:['t.me','telegram.org']})) if(domains.some(d=>host===d||host.endsWith('.'+d))) return key;
      return 'other';
    } catch { return 'direct'; }
  })();
  function eventId() {
    try { return globalThis.crypto?.randomUUID?.() || null; } catch { return null; }
  }
  async function event(type, channel='direct', id=eventId()) {
    if (!id || translationView) return false;
    try {
      const data = JSON.stringify({id,type,path:page,channel,source});
      const response = await fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:data,keepalive:true,credentials:'same-origin'});
      return response.ok;
    } catch { return false; }
  }
  if (!page.includes('/statistikk/') && !translationView) {
    event('pageview');
    try {
      if(!sessionStorage.getItem('sfi-visit')) {
        const id=sessionStorage.getItem('sfi-visit-pending') || eventId();
        if(id) {
          sessionStorage.setItem('sfi-visit-pending',id);
          event('visit','direct',id).then(ok=>{
            if(ok) {try {sessionStorage.setItem('sfi-visit','1');sessionStorage.removeItem('sfi-visit-pending');}catch{}}
          });
        }
      }
    } catch { /* No session count if session storage is unavailable. */ }
  }
  const selector = document.getElementById('language-select');
  if(selector && translatedLanguage) selector.value=translatedLanguage;
  selector?.addEventListener('change', () => {
    const lang = selector.value;
    const localPath = value => typeof value === 'string' && /^\/(?:[a-z0-9-]+\/)*$/.test(value) ? value : null;
    const original = localPath(selector.dataset.noPath) || page.replace(/^\/en\//, '/');
    const english = localPath(selector.dataset.enPath) || '/en' + original;
    if(lang === 'no') location.assign((translationView?origin:'') + original);
    else if(lang === 'en') location.assign((translationView?origin:'') + english);
    else location.assign('https://translate.google.com/translate?sl=no&tl='+encodeURIComponent(lang)+'&u='+encodeURIComponent(origin+original));
  });
  const shareText = (no,english,zh) => parameters.get('lang')==='zh-Hans' ? zh : text(no,english);
  const sharedURL = channel => {
    // Rebuild from the published canonical path, never the current query/hash or reader storage.
    const shareParams=new URLSearchParams(location.search);const u = new URL(page,origin);u.searchParams.set('via',channel);const localLanguage=shareParams.get('lang');if(['zh-Hans','yue-Hant'].includes(localLanguage))u.searchParams.set('lang',localLanguage);
    if(/^\/(?:en\/)?galleri-3d\/$/.test(page)){
      const art=shareParams.get('art'),known=(window.BookArt||[]).some(item=>'book-page-'+item.page===art)||[...document.querySelectorAll('[data-art-id]')].some(node=>node.dataset.artId===art);
      if(art&&known)u.searchParams.set('art',art);
      const view=shareParams.get('view');if(['2d','3d'].includes(view))u.searchParams.set('view',view);
    }
    if(translatedLanguage) return 'https://translate.google.com/translate?sl='+ (page.startsWith('/en/')?'en':'no') +'&tl='+encodeURIComponent(translatedLanguage)+'&u='+encodeURIComponent(u.href);
    return u.href;
  };
  const status = document.getElementById('share-status');
  const say = message => {if(status) status.textContent=message;};
  let manual,shareAction=0;
  const hideManual=()=>{if(manual)manual.hidden=true;};
  function manualCopy(url,button){
    if(!manual){manual=document.createElement('label');manual.className='sfi-share-manual';manual.style.cssText='display:block;max-width:100%;margin:1rem 0;color:inherit';
      const name=document.createElement('span');name.textContent=shareText('Kopier lenken manuelt','Copy the link manually','手动复制链接');
      const input=document.createElement('input');input.type='url';input.readOnly=true;input.setAttribute('aria-label',name.textContent);input.style.cssText='display:block;box-sizing:border-box;width:100%;min-height:44px;padding:.75rem;margin-top:.5rem;background:#f5f6f7;color:#171a1f;border:1px solid #737d89;border-radius:0;font:inherit';manual.append(name,input);
      (button.closest('section')||button.parentElement).append(manual);
    }
    button.insertAdjacentElement('afterend',manual);manual.hidden=false;const input=manual.querySelector('input');input.value=url;input.focus();input.select();
    say(shareText('Automatisk kopiering er ikke tilgjengelig. Kopier lenken fra feltet.','Automatic copying is unavailable. Copy the link from the field.','无法自动复制。请从输入框中复制链接。'));
  }
  const mainTitle=document.querySelector('main h1');
  if(mainTitle&&document.querySelector('[data-share]')&&!document.querySelector('[data-share-title-control]')){
    const quick=document.createElement('button');quick.type='button';quick.dataset.share='native';quick.dataset.shareTitleControl='';quick.textContent=shareText('Del','Share','分享');quick.style.cssText='display:inline-block;min-height:44px;padding:.65rem 1rem;margin:.5rem 0 1rem;border:1px solid currentColor;border-radius:0;font:600 .95rem system-ui;cursor:pointer';
    const warm=document.body.dataset.siteDirection==='art';quick.style.background=warm?'#774c3c':'#d5d9de';quick.style.color=warm?'#fffaf2':'#171a1f';mainTitle.insertAdjacentElement('afterend',quick);
  }
  document.querySelectorAll('[data-share]').forEach(button => button.addEventListener('click', async () => {
    const channel=button.dataset.share,action=++shareAction;
    const u=sharedURL(channel), enc=encodeURIComponent;hideManual();say('');
    if(channel==='copy') {
      try {if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(u);event('share','copy');if(action===shareAction)say(shareText('Lenke kopiert. Den åpner samme språk som denne siden.','Link copied. It opens in the same language as this page.','链接已复制，将使用当前页面语言打开。'));}
      catch {if(action===shareAction)manualCopy(u,button);}return;
    }
    if(channel==='native') {
      if(typeof navigator.share!=='function'){manualCopy(u,button);return;}
      try {await navigator.share({title,text:description,url:u});event('share','native');if(action===shareAction)say(shareText('Enhetens delingsmeny er lukket.','The device sharing menu is closed.','设备分享菜单已关闭。'));}
      catch(e){if(action!==shareAction)return;if(e.name==='AbortError')say(shareText('Deling avbrutt.','Sharing cancelled.','已取消分享。'));else manualCopy(u,button);}return;
    }
    const targets={facebook:'https://www.facebook.com/sharer/sharer.php?u='+enc(u),x:'https://twitter.com/intent/tweet?text='+enc(title)+'&url='+enc(u),linkedin:'https://www.linkedin.com/sharing/share-offsite/?url='+enc(u),bluesky:'https://bsky.app/intent/compose?text='+enc(title+' '+u),threads:'https://www.threads.net/intent/post?text='+enc(title+' '+u),whatsapp:'https://api.whatsapp.com/send?text='+enc(title+' '+u),telegram:'https://t.me/share/url?url='+enc(u)+'&text='+enc(title),email:'mailto:?subject='+enc(title)+'&body='+enc(description+'\n'+u)};
    if(!targets[channel])return;
    if(channel==='email')location.href=targets[channel];else window.open(targets[channel],'_blank','noopener,noreferrer');
    event('share',channel);say(text('Delingsvinduet er åpnet. Du fullfører delingen der.','The sharing window is open. Complete your post there.'));
  }));
  const statsRoot=document.getElementById('statistics');
  if(statsRoot) {
    const statusEl=document.getElementById('stats-status');
    const checkedEl=document.getElementById('stats-checked');
    const refresh=document.getElementById('refresh-stats');
    const number=new Intl.NumberFormat(en?'en-GB':'nb-NO');
    let lastGood=null, request=0;
    const clear=()=>{
      for(const name of ['pageviews','visits','shares'])document.getElementById('total-'+name).textContent='—';
      const copies=document.getElementById('total-copies');if(copies)copies.textContent='—';
      document.getElementById('channel-rows').replaceChildren();
      document.getElementById('stats-history')?.replaceChildren();
      const coverage=document.getElementById('stats-coverage');if(coverage)coverage.textContent='';
    };
    function renderHistory(data){
      const host=document.getElementById('stats-history'),coverage=document.getElementById('stats-coverage');if(!host||!coverage)return;
      coverage.textContent=text('Kildedager: ','Source days: ')+data.since+' – '+data.lastRecordedDay+'. '+text('Historikken hentet: ','History retrieved: ')+data.snapshotRetrievedAt+'. '+text('Dagsgrenser er UTC. Datoer uten datarader: ','Daily buckets use UTC. Dates without data rows: ')+(data.missingDays.length?data.missingDays.join(', '):text('ingen i det hentede utvalget','none in the retrieved selection'))+'.';
      host.replaceChildren();
      const table=(title,labels,rows)=>{
        const heading=document.createElement('h2');heading.textContent=title;host.append(heading);
        const wrap=document.createElement('div');wrap.className='stats-table-wrap';const table=document.createElement('table');table.className='stats-table';
        const caption=document.createElement('caption');caption.textContent=title;table.append(caption);
        const head=document.createElement('thead'),hr=document.createElement('tr');for(const label of labels){const th=document.createElement('th');th.scope='col';th.textContent=label;hr.append(th)}head.append(hr);table.append(head);
        const body=document.createElement('tbody');for(const values of rows){const row=document.createElement('tr');values.forEach((v,i)=>{const cell=document.createElement(i===0?'th':'td');if(i===0)cell.scope='row';cell.textContent=String(v);row.append(cell)});body.append(row)}table.append(body);wrap.append(table);host.append(wrap);
      };
      if(data.daily.length>1&&document.createElementNS){
        const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 640 160');svg.setAttribute('role','img');svg.setAttribute('aria-labelledby','stats-chart-title stats-chart-desc');svg.classList.add('stats-timeline');
        const title=document.createElementNS(ns,'title');title.id='stats-chart-title';title.textContent=text('Registrerte sidevisninger per kildedag','Recorded page views per source day');
        const description=document.createElementNS(ns,'desc');description.id='stats-chart-desc';description.textContent=text('Grafen har brudd ved manglende dager. Nøyaktige tall står i tabellen nedenfor.','The graph breaks at missing days. Exact figures appear in the table below.');svg.append(title,description);
        const sorted=[...data.daily].sort((a,b)=>a.day.localeCompare(b.day)),first=Date.parse(sorted[0].day),last=Date.parse(sorted[sorted.length-1].day),max=Math.max(1,...sorted.map(r=>r.pageviews));
        const point=r=>(30+580*(Date.parse(r.day)-first)/Math.max(86400000,last-first)).toFixed(2)+','+(130-110*r.pageviews/max).toFixed(2);
        let segment=[],previous=null;
        const draw=()=>{if(!segment.length)return;const line=document.createElementNS(ns,'polyline');line.setAttribute('points',segment.join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','currentColor');line.setAttribute('stroke-width','2');svg.append(line);segment=[]};
        for(const row of sorted){const day=Date.parse(row.day);if(previous!==null&&day-previous>86400000)draw();segment.push(point(row));previous=day}draw();
        for(const [x,y,label] of [[30,151,sorted[0].day],[510,151,sorted[sorted.length-1].day],[2,18,String(max)],[10,134,'0']]){const mark=document.createElementNS(ns,'text');mark.setAttribute('x',x);mark.setAttribute('y',y);mark.setAttribute('fill','currentColor');mark.setAttribute('font-size','11');mark.textContent=label;svg.append(mark)}host.append(svg);
      }
      const columns=[text('Dag','Day'),text('Sidevisninger','Page views'),text('Besøk','Visits'),text('Delingshandlinger','Share actions')];
      table(text('Registrert aktivitet over tid','Recorded activity over time'),columns,data.daily.map(r=>[r.day,...['pageviews','visits','shares'].map(k=>number.format(r[k]))]));
      const directions={story:text('Stemmen','The Voice'),art:text('Fra innsiden','From Inside'),shared:text('Felles / ikke klassifisert','Shared / unclassified')};
      table(text('Fordeling på retning','By direction'),[text('Retning','Direction'),...columns.slice(1)],Object.entries(data.directions).map(([k,r])=>[directions[k]||k,...['pageviews','visits','shares'].map(k=>number.format(r[k]))]));
      const rooms={diary:text('Dagbok','Diary'),book:text('Bok','Book'),legal:text('Juridiske verktøy','Legal tools'),press:text('Presse','Press'),art:text('Kunst og bidrag','Art and contributions'),music:text('Musikk','Music'),other:text('Felles / annet','Shared / other')};
      table(text('Fordeling på rom','By room'),[text('Rom','Room'),...columns.slice(1)],Object.entries(data.rooms).map(([k,r])=>[rooms[k]||k,...['pageviews','visits','shares'].map(k=>number.format(r[k]))]));
    }
    async function update() {
      const current=++request;
      refresh.disabled=true;statsRoot.setAttribute('aria-busy','true');
      statusEl.textContent=text('Henter måledata …','Fetching measurement data …');
      try {
        const period=document.getElementById('stats-period')?.value||'all';
        const response=await fetch('/api/stats?days='+encodeURIComponent(period),{cache:'no-store',signal:AbortSignal.timeout(12000)});
        const data=await response.json();
        if(current!==request)return;
        if(data.status==='disabled') {
          clear();lastGood=null;statsRoot.dataset.measurement='disabled';
          statusEl.textContent=text('Målingen er ikke aktiv i denne versjonen. Historiske tall er ikke hentet; dette betyr ikke null besøk.','Measurement is not active in this version. Historical figures have not been retrieved; this does not mean zero visits.');
          return;
        }
        if(!response.ok)throw new Error('unavailable');
        if(data.status==='historical_snapshot'&&data.hasRows===false){
          clear();lastGood=data;statsRoot.dataset.measurement='historical';
          renderHistory(data);
          statusEl.textContent=text('Ingen historikkrader i valgt periode. Ny måling er deaktivert; dette er ikke bekreftet null aktivitet.','No historical rows in the selected period. New measurement is disabled; this is not verified zero activity.');
          return;
        }
        const validCount=v=>Number.isSafeInteger(v)&&v>=0;
        if(!data.totals||!['pageviews','visits','shares'].every(k=>validCount(data.totals[k])))throw new Error('invalid');
        if(!data.since||!Number.isFinite(Date.parse(data.since)))throw new Error('missing-period');
        if(!data.channels||!data.sources)throw new Error('missing-breakdown');
        if(![...Object.values(data.channels),...Object.values(data.sources)].every(validCount))throw new Error('invalid');
        for(const name of ['pageviews','visits','shares'])document.getElementById('total-'+name).textContent=number.format(data.totals[name]);
        const tbody=document.getElementById('channel-rows');tbody.replaceChildren();
        for(const [channel,label] of Object.entries(channels)) {
          const row=document.createElement('tr');
          for(const value of [label,validCount(data.channels[channel])?number.format(data.channels[channel]):'—',validCount(data.sources[channel])?number.format(data.sources[channel]):'—']) {
            const cell=document.createElement('td');cell.textContent=value;row.append(cell);
          }
          tbody.append(row);
        }
        const since=new Intl.DateTimeFormat(en?'en-GB':'nb-NO',{dateStyle:'medium',timeZone:'Europe/Oslo'}).format(new Date(data.since));
        lastGood=data;statsRoot.dataset.measurement=data.status==='historical_snapshot'?'historical':'available';
        if(data.status==='historical_snapshot'){
          renderHistory(data);
          const copies=document.getElementById('total-copies');if(copies)copies.textContent=number.format(data.shareMetrics.copiedLinks);
          statusEl.textContent=text('Bevarte historiske tall. Ny måling på dette domenet er deaktivert. Delingshandlinger er ikke bekreftede publiseringer.','Preserved historical figures. New measurement on this domain is disabled. Share actions are not confirmed publications.');
          return;
        }
        statusEl.textContent=text('Dokumentert måleperiode fra ','Documented measurement period from ')+since+'. '+text('Delingshandlinger er ikke bekreftede publiseringer.','Share actions are not confirmed publications.');
      } catch {
        if(current!==request)return;
        if(!lastGood)clear();
        statsRoot.dataset.measurement=lastGood?'stale':'unavailable';
        statusEl.textContent=lastGood
          ?text('Oppdateringen feilet. Sist hentede tall beholdes og er ikke ferske.','Refresh failed. Previously retrieved figures are retained and are not current.')
          :text('Statistikken kunne ikke hentes. Ingen tall er bekreftet; dette betyr ikke null aktivitet.','Statistics could not be retrieved. No figures are verified; this does not mean zero activity.');
      } finally {
        if(current===request){
          checkedEl.textContent=text('Siste henteforsøk: ','Last retrieval attempt: ')+new Intl.DateTimeFormat(en?'en-GB':'nb-NO',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Oslo'}).format(new Date())+' (Europe/Oslo).';
          refresh.disabled=false;statsRoot.setAttribute('aria-busy','false');
        }
      }
    }
    refresh?.addEventListener('click',update);document.getElementById('stats-period')?.addEventListener('change',update);update();
  }
})();
