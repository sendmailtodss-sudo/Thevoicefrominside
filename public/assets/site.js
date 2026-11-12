(() => {
  'use strict';
  const origin = 'https://stemmen-fra-innsiden.sendmailtodss.chatgpt.site';
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
  const sharedURL = channel => {
    const u = new URL(page,origin);u.searchParams.set('via',channel);const localLanguage=new URLSearchParams(location.search).get('lang');if(['zh-Hans','yue-Hant'].includes(localLanguage))u.searchParams.set('lang',localLanguage);
    if(translatedLanguage) return 'https://translate.google.com/translate?sl='+ (page.startsWith('/en/')?'en':'no') +'&tl='+encodeURIComponent(translatedLanguage)+'&u='+encodeURIComponent(u.href);
    return u.href;
  };
  const status = document.getElementById('share-status');
  const say = message => {if(status) status.textContent=message;};
  document.querySelectorAll('[data-share]').forEach(button => button.addEventListener('click', async () => {
    const channel=button.dataset.share;
    const u=sharedURL(channel), enc=encodeURIComponent;
    if(channel==='copy') {
      try {await navigator.clipboard.writeText(u);event('share','copy');say(text('Lenke kopiert. Den åpner samme språk som denne siden.','Link copied. It opens in the same language as this page.'));}
      catch {say(text('Kopier denne lenken: ','Copy this link: ')+u);}return;
    }
    if(channel==='native') {
      if(!navigator.share){say(text('Velg en kanal eller bruk «Kopier lenke».','Choose a channel or use “Copy link”.'));return;}
      try {await navigator.share({title,text:description,url:u});event('share','native');say(text('Lenken ble sendt til enhetens delingsfunksjon.','The link was passed to your device’s sharing function.'));}
      catch(e){if(e.name!=='AbortError')say(text('Delingen kunne ikke åpnes. Velg en annen knapp.','Sharing could not be opened. Choose another button.'));}return;
    }
    const targets={facebook:'https://www.facebook.com/sharer/sharer.php?u='+enc(u),x:'https://twitter.com/intent/tweet?text='+enc(title)+'&url='+enc(u),linkedin:'https://www.linkedin.com/sharing/share-offsite/?url='+enc(u),bluesky:'https://bsky.app/intent/compose?text='+enc(title+' '+u),threads:'https://www.threads.net/intent/post?text='+enc(title+' '+u),whatsapp:'https://api.whatsapp.com/send?text='+enc(title+' '+u),telegram:'https://t.me/share/url?url='+enc(u)+'&text='+enc(title),email:'mailto:?subject='+enc(title)+'&body='+enc(description+'\n'+u)};
    if(!targets[channel])return;
    if(channel==='email')location.href=targets[channel];else window.open(targets[channel],'_blank','noopener,noreferrer');
    event('share',channel);say(text('Delingsvinduet er åpnet. Du fullfører delingen der.','The sharing window is open. Complete your post there.'));
  }));
  const statsRoot=document.getElementById('statistics');
  if(statsRoot) {
    const statusEl=document.getElementById('stats-status');
    const number=new Intl.NumberFormat(en?'en-GB':'nb-NO');
    async function update() {
      try {
        const response=await fetch('/api/stats',{cache:'no-store'});
        if(!response.ok)throw new Error('Unavailable');
        const data=await response.json();
        for(const name of ['pageviews','visits','shares'])document.getElementById('total-'+name).textContent=number.format(data.totals[name]||0);
        const tbody=document.getElementById('channel-rows');tbody.replaceChildren();
        for(const [channel,label] of Object.entries(channels)) {
          const row=document.createElement('tr');
          const values=[label,number.format(data.channels[channel]||0),number.format(data.sources[channel]||0)];
          for(const value of values){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}tbody.append(row);
        }
        statusEl.textContent=(data.since ? text('Måling startet ','Measurement started ')+new Intl.DateTimeFormat(en?'en-GB':'nb-NO',{dateStyle:'medium',timeZone:'Europe/Oslo'}).format(new Date(data.since))+'. ' : text('Ingen besøk er registrert ennå. ','No visits have been recorded yet. '));
      } catch {
        for(const name of ['pageviews','visits','shares'])document.getElementById('total-'+name).textContent='—';
        document.getElementById('channel-rows').replaceChildren();
        statusEl.textContent=text('Statistikken er midlertidig utilgjengelig. Tallene nedenfor er ikke lastet inn.','Statistics are temporarily unavailable. The figures below have not loaded.');
      }
    }
    document.getElementById('refresh-stats')?.addEventListener('click',update);update();
  }
})();
