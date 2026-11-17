// Landing hero for the origin scene. Builds the black-starfield backdrop, the three
// language flags, the spinning symbol with its gold title, and the granite tablet.
// Uses the locally vendored Three renderer for the transparent medallion only.
(()=>{'use strict';
  const root=document.querySelector('[data-journey]');if(!root||root.dataset.hero)return;
  const stage=root.querySelector('.sj-stage'),media=root.querySelector('.sj-media');if(!stage||!media)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),hover=matchMedia('(hover: hover) and (pointer: fine)');
  const T={
    no:{left:'Stemmen',right:'fra innsiden',leftHref:'/fengslene-vest-for-loven/',rightHref:'/forebygging-og-forum/',symbol:'Åpne steintavlen: hva Stemmen fra innsiden er',tip:'Hold over symbolet',tipTouch:'Trykk på symbolet',close:'Lukk steintavlen',flags:'Velg språk',h:'Skrevet i stein',
      p:[
        'Denne visjonen er todelt – foreløpig. Mulighetene er uendelige, og vi er på jakt etter samarbeidspartnere og idéskapere.',
        'Flere av dem vi ønsker dialog med, er avhengige av samarbeid med dem aktivismen retter seg mot. Da er det avgjørende at kortene ikke blandes, slik at mulighetene for de tusenvis av livene et samarbeid kan forbedre, ikke stoppes av at skillet er uklart. Vi forstår at de kortene ikke kan blandes.',
        '<a data-go="l" href="#">Stemmen →</a> tar deg til siden for aktivisme, samfunnskritikk, kamp for systemreform og ansvarliggjøring.',
        '<a data-go="r" href="#">Fra innsiden →</a> tar deg til siden for forebyggende arbeid og ettervern, og til et VR-galleri for billedkunst, skulptur, litteratur, video og musikk. Alle som sitter i fengsel, skal kunne sende inn dokumentasjon på verkene sine, stille dem ut og dele dem i sosiale medier. De som liker et verk, skal kunne gi bud på originalen eller bestille det som høyoppløselig trykk på et plagg eller som tapet.',
        'Fellesskapet: Innsatte som bor i utkantstrøk, og ikke nødvendigvis i byen, skal ha tilgang til alle organisasjonene og kunne henvende seg for hjelp og råd etter soning. Innsatte som vil hjelpe andre, kan få en moderatorrolle og eventuelt en fadderrolle. Vi håper på samarbeid med organisasjonene som driver ettervern, slik at de også kan være moderatorer: et forum for innsatte med ettervern i fokus.',
        'Et eget forum er for pårørende. Der håper vi å samarbeide med organisasjoner som hjelper dem, slik at de kan møte andre i samme situasjon og finne forståelse, råd og tips.',
        'Blar du nedover, starter en reise som viser hva som er mulig for deg som sitter med kreative evner. Mange er fulle av dem, men oppvekst og omgivelser har delt ut feil kort, og til nå er evnene kanalisert i en retning som verken tjener deg eller samfunnet. <small>Levekårsundersøkelsen blant innsatte (Friestad og Skog Hansen, Fafo 2004) fant at tre av ti hadde vært i kontakt med barnevernet før de fylte 16. En metaanalyse (Young mfl., Psychological Medicine 2015) fant ADHD hos om lag én av fire voksne innsatte.</small>',
        'Juridisk motvekt samler tre verktøy: Rettspeil lar deg undersøke et vedtak og gjennomgangsmetoden. inmAIte gir et arbeidsrom for dokumenter og klageutkast, mens Innsyn gir maler for å be om dokumenter. Verktøyene sender ikke klager eller innsynskrav. Eksternt saksmottak og betaling er ikke åpnet; frister og juridiske spørsmål krever menneskelig vurdering.',
        'Dette er en ny sjanse til å skape muligheter, til å bruke ADHD til det konstruktive, det kreative, levende og inspirerende – til å forandre retningen i livet. Til å forandre alt.'],
      sig:'– Innsatt 2601-46',
      tools:'<a href="/boken/">Boken</a><a href="/presse/">Fri presse</a><a href="/juridisk-motvekt/">Juridisk motvekt</a>',
      invite:'Scroll nedover og se hva som er mulig for deg.'},
    en:{left:'The Voice',right:'From Inside',leftHref:'/en/fengslene-vest-for-loven/',rightHref:'/en/forebygging-og-forum/',symbol:'Open the stone tablet: what The Voice from Inside is',tip:'Hover the symbol',tipTouch:'Tap the symbol',close:'Close the stone tablet',flags:'Choose language',h:'Written in stone',
      p:[
        'This vision has two sides – for now. The possibilities are endless, and we are looking for partners and people with ideas.',
        'Several of those we want to talk with depend on cooperation with the very institutions the activism addresses. That is why the cards must never be mixed, so that the chance to improve thousands of lives through cooperation is not stopped by an unclear line. We understand that those cards cannot be mixed.',
        '<a data-go="l" href="#">The Voice →</a> takes you to the side for activism, social criticism, the fight for system reform and accountability.',
        '<a data-go="r" href="#">From Inside →</a> takes you to the side for prevention and aftercare, and to a VR gallery for visual art, sculpture, writing, video and music. Everyone in prison should be able to submit documentation of their work, exhibit it and share it on social media. Those who like a piece should be able to bid on the original or order it as a high-resolution print on a garment or as wallpaper.',
        'The community: people in prison from outlying districts, not necessarily the city, should have access to all the organisations and be able to ask for help and advice after release. Prisoners who want to help others can take a moderator role and possibly a mentor role. We hope to work with the organisations that provide aftercare so that they can moderate too: a forum for prisoners with aftercare in focus.',
        'A separate forum is for relatives. There we hope to work with organisations that support them, so they can meet others in the same situation and find understanding, advice and tips.',
        'Scroll down and a journey begins that shows what is possible for you who carry creative abilities. Many are full of them, but upbringing and surroundings dealt the wrong cards, and until now those abilities have been channelled in a direction that serves neither you nor society. <small>The Norwegian living-conditions survey of prisoners (Friestad and Skog Hansen, Fafo 2004) found that three in ten had been in contact with child welfare before age 16. A meta-analysis (Young et al., Psychological Medicine 2015) found ADHD in about one in four adult prisoners.</small>',
        'Legal Counterweight brings together three tools: Rettspeil lets you examine a decision and the review method. inmAIte provides a workspace for documents and complaint drafts, while Innsyn provides templates for requesting documents. The tools do not send complaints or access requests. External case intake and payments are not open; deadlines and legal questions require human review.',
        'This is a new chance to create opportunities, to use ADHD for what is constructive, creative, alive and inspiring – to change the direction of a life. To change everything.'],
      sig:'– Inmate 2601-46',
      tools:'<a href="/en/boken/">The Book</a><a href="/en/presse/">Free Press</a><a href="/en/juridisk-motvekt/">Legal Counterweight</a>',
      invite:'Scroll down and see what is possible for you.'},
    zh:{left:'声音',right:'来自内部',leftHref:'/fengslene-vest-for-loven/',rightHref:'/forebygging-og-forum/',symbol:'打开石碑：了解“来自内部的声音”',tip:'将鼠标移到标志上',tipTouch:'点按标志',close:'关闭石碑',flags:'选择语言',h:'刻在石上',
      p:[
        '这个愿景目前分为两部分。可能性无穷无尽，我们正在寻找合作伙伴和有想法的人。',
        '我们想与一些伙伴对话，而他们的工作离不开与我们所批评的机构合作。合作有机会改善成千上万人的生活，因此，必须让大家看清哪些工作属于合作，哪些属于倡议和监督。我们理解为什么双方都需要这条界线。',
        '<a data-go="l" href="#">声音 →</a> 带你了解我们的倡议行动和社会批评，以及我们如何推动制度改革、追究责任。',
        '<a data-go="r" href="#">来自内部 →</a> 带你了解预防工作和出狱后的支持服务，也能带你走进展示视觉艺术、雕塑、文学、视频和音乐的虚拟现实（VR）画廊。每一位在押者都应能提交作品资料、展出并在社交媒体分享。喜欢作品的人将可以对原作出价，或订购印在服装或墙纸上的高清复制品。',
        '社区：住在偏远地区、不一定在城市的在押者，应当能够接触所有组织，并在服刑结束后寻求帮助和建议。愿意帮助他人的在押者可以担任版主，也可以成为同伴导师。我们希望与提供出狱后支持的组织合作，让他们也担任版主：一个以出狱后支持为重点的在押者论坛。',
        '我们还为家属单独设立了一个论坛。我们希望与支持家属的机构合作，让家属能遇到处境相似的人，彼此理解、交换建议和经验。',
        '向下滚动，一段旅程将展示拥有创造力的你可以做到什么。许多人充满创造力，但成长环境发错了牌，这些能力一直被引向既不利于你也不利于社会的方向。<small>挪威在押者生活状况调查（Friestad与Skog Hansen，Fafo 2004）发现，十分之三的人在16岁前接触过儿童福利机构。一项荟萃分析（Young等，Psychological Medicine 2015）发现约四分之一的成年在押者患有ADHD。</small>',
        '法律抗衡汇集三个工具：Rettspeil帮助你审查决定并了解审查方法；inmAIte提供处理文件和起草申诉的工作空间；Innsyn提供申请获取文件的模板。这些工具不会发送申诉或信息公开申请。外部案件受理和支付尚未开放；期限和法律问题需要由人进行审查。',
        '这是一次新的机会：创造可能，把ADHD用于建设性的、有创造力的、鲜活而鼓舞人心的事情，改变人生的方向。改变一切。'],
      sig:'– 在押者 2601-46',
      tools:'<a href="/boken/">书</a><a href="/presse/">自由新闻</a><a href="/juridisk-motvekt/">法律抗衡</a>',
      invite:'向下滚动，看看你能创造怎样的可能。'}};
  const currentLang=()=>{const locale=new URLSearchParams(location.search).get('lang')||document.documentElement.lang||'';return locale.toLowerCase().startsWith('zh')?'zh':location.pathname.startsWith('/en')?'en':'no'};
  let lang=currentLang();
  const el=(tag,cls,html)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(html!=null)node.innerHTML=html;return node};
  const star=(cx,cy,r,rot)=>{let d='';for(let i=0;i<10;i++){const a=rot+i*Math.PI/5,q=i%2?r*.382:r;d+=(i?'L':'M')+(cx+q*Math.sin(a)).toFixed(2)+' '+(cy-q*Math.cos(a)).toFixed(2)}return `<path d="${d}Z" fill="#FFDE00"/>`};
  const FLAGS=[
    ['no','Norsk','<svg viewBox="0 0 22 16" role="img" aria-hidden="true"><rect width="22" height="16" fill="#BA0C2F"/><path d="M6 0h4v16H6zM0 6h22v4H0z" fill="#fff"/><path d="M7 0h2v16H7zM0 7h22v2H0z" fill="#00205B"/></svg>'],
    ['zh','简体中文','<svg viewBox="0 0 30 20" role="img" aria-hidden="true"><rect width="30" height="20" fill="#DE2910"/>'+star(5,5,3,0)+star(10,2,1,.9)+star(12,4,1,.4)+star(12,7,1,0)+star(10,9,1,.9)+'</svg>'],
    ['en','English','<svg viewBox="0 0 60 30" role="img" aria-hidden="true"><clipPath id="sjHeroUk"><path d="M30,15h30v15zv15h-30zh-30v-15zv-15h30z"/></clipPath><path d="M0,0v30h60v-30z" fill="#012169"/><path d="M0,0L60,30M60,0L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0L60,30M60,0L0,30" clip-path="url(#sjHeroUk)" stroke="#C8102E" stroke-width="4"/><path d="M30,0v30M0,15h60" stroke="#fff" stroke-width="10"/><path d="M30,0v30M0,15h60" stroke="#C8102E" stroke-width="6"/></svg>']];

  const bg=el('div','sj-hero-bg'),drift=el('div','sj-hero-drift'),plate=el('div','sj-hero-plate');
  bg.setAttribute('aria-hidden','true');
  const img=new Image();img.alt='';img.decoding='async';plate.append(img);drift.append(plate);bg.append(drift);media.append(bg);
  let orientation='';
  function layout(){
    const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
    const next=h>w?'p':'l';
    if(next!==orientation){
      orientation=next;let seed=260146;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
      const stars=Array.from({length:260},()=>`<circle cx="${random()*1600}" cy="${random()*1200}" r="${.6+random()*1.5}" fill="#e3e9ed" opacity="${.2+random()*.5}"/>`).join('');
      img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1200"><path fill="#050607" d="M0 0h1600v1200H0z"/>${stars}</svg>`);
    }
    const width=Math.max(w,h*4/3);plate.style.width=width+'px';plate.style.height=width*3/4+'px';
  }
  const C={
    no:{brand:'Stemmen fra innsiden',home:'Til forsiden',purpose:'To veier. Én ny retning.',storyLabel:'Dokumentasjon · rettssikkerhet',artLabel:'Skapelse · fellesskap',story:'Aktivisme, samfunnskritikk og kampen for systemreform.',art:'Kunst, forebyggende arbeid og livet etter soning.',enter:'Gå inn',read:'Les hele visjonen',film:'Se filmreisen',optional:'Velg en inngang, eller bli med på reisen.',storyLinks:['Dagbok','Boken','Fri presse','Juridiske verktøy'],artLinks:['Galleri','Musikk','Litteratur','Fellesskap']},
    en:{brand:'The Voice from Inside',home:'Back to the entrance',purpose:'Two paths. A new direction.',storyLabel:'Documentation · legal rights',artLabel:'Creativity · community',story:'Activism, social criticism and the fight for system reform.',art:'Art, prevention and life after release.',enter:'Enter',read:'Read the full vision',film:'Explore the film',optional:'Choose an entrance, or join the journey.',storyLinks:['Diary','The Book','Free Press','Legal tools'],artLinks:['Gallery','Music','Literature','Community']},
    zh:{brand:'来自内部的声音',home:'返回首页',purpose:'两条道路。新的方向。',storyLabel:'记录 · 法律权利',artLabel:'创作 · 社区',story:'倡议、社会批评与制度改革。',art:'艺术、预防工作与出狱后的生活。',enter:'进入',read:'阅读完整愿景',film:'探索影片',optional:'选择入口，或踏上这段旅程。',storyLinks:['日记','书籍','自由新闻','法律工具'],artLinks:['画廊','音乐','文学','社区']}
  };
  const hero=el('div','sj-hero');hero.dataset.gateway='true';hero.dataset.state='idle';
  const shell=el('div','sj-gateway-shell'),header=el('header','sj-gateway-header'),brand=el('h1','sj-gateway-brand');
  const flags=el('div','sj-hero-flags');flags.setAttribute('role','group');
  FLAGS.forEach(([code,name,svg],i)=>{const button=el('button','sj-hero-flag',svg+`<span>${name}</span>`);button.type='button';button.dataset.lang=code;button.style.setProperty('--i',i);button.setAttribute('aria-label',name);flags.append(button)});
  const core=el('div','sj-hero-core');
  const symbol=el('a','sj-hero-symbol',`<svg class="sj-hero-fallback" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="sjGemGold" x2=".7" y2="1"><stop stop-color="#fff4c4"/><stop offset=".4" stop-color="#d9a845"/><stop offset=".65" stop-color="#ffdf81"/><stop offset="1" stop-color="#946315"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="#111519" stroke="#89939b" stroke-width=".7"/><path d="M18 18L50 6L82 18L94 50L82 82L50 94L18 82L6 50Z" fill="none" stroke="#b5bfc8" stroke-width=".6"/><path d="M50 17C53 39 61 47 83 50C61 53 53 61 50 83C47 61 39 53 17 50C39 47 47 39 50 17Z" fill="url(#sjGemGold)"/></svg><canvas class="sj-hero-gem" aria-hidden="true"></canvas>`);
  core.append(symbol);header.append(brand,core,flags);
  const portals=el('div','sj-gateway-portals'),story=el('section','sj-gateway-portal sj-gateway-story'),art=el('section','sj-gateway-portal sj-gateway-art');
  portals.append(story,art);
  const footer=el('footer','sj-gateway-footer'),purpose=el('p','sj-gateway-purpose'),access=el('nav','sj-hero-access');
  const readVision=el('a','sj-hero-read');readVision.href='#home-vision';
  const enterFilm=el('button','sj-gateway-film');enterFilm.type='button';
  access.append(readVision,enterFilm);footer.append(purpose,access);shell.append(header,portals,footer);hero.append(shell);stage.append(hero);root.dataset.hero='true';
  const paths={story:['/dagbok/','/boken/','/presse/','/juridisk-motvekt/'],art:['/galleri-3d/','/musikk/','/litteratur/','/forebygging-og-forum/#forum']};
  function localized(path){const en={'/musikk/':'/en/music/','/litteratur/':'/en/literature/'};const u=new URL(lang==='en'?(en[path]||'/en'+path):path,location.origin);if(lang==='zh')u.searchParams.set('lang','zh-Hans');return u.pathname+u.search+u.hash}
  function paintPortal(node,side){
    const t=T[lang],c=C[lang],label=side==='story'?c.storyLabel:c.artLabel,name=side==='story'?t.left:t.right,href=side==='story'?t.leftHref:t.rightHref;
    node.replaceChildren();
    const frame=el('div','sj-gateway-recess');frame.setAttribute('aria-hidden','true');
    const number=el('p','sj-gateway-number');number.textContent=side==='story'?'01':'02';
    const eyebrow=el('p','sj-gateway-eyebrow');eyebrow.textContent=label;
    const heading=el('h2','sj-gateway-title');heading.textContent=name;
    const description=el('p','sj-gateway-description');description.textContent=c[side];
    const entrance=el('a','sj-gateway-enter');entrance.textContent=c.enter;const arrow=el('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');entrance.append(arrow);
    const u=new URL(href,location.origin);if(lang==='zh')u.searchParams.set('lang','zh-Hans');entrance.href=u.pathname+u.search;entrance.setAttribute('aria-label',c.enter+' · '+name);
    const nav=el('nav','sj-gateway-links');nav.setAttribute('aria-label',name);paths[side].forEach((path,i)=>{const a=el('a');a.href=localized(path);a.textContent=c[side+'Links'][i];nav.append(a)});
    node.append(frame,number,eyebrow,heading,description,entrance,nav);
  }
  function paint(){
    lang=currentLang();const t=T[lang],c=C[lang];hero.lang=lang==='zh'?'zh-Hans':lang==='no'?'nb':'en';
    brand.textContent=c.brand;symbol.href=lang==='en'?'/en/#top':lang==='zh'?'/?lang=zh-Hans#top':'/#top';symbol.setAttribute('aria-label',c.home);
    flags.setAttribute('aria-label',t.flags);flags.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
    paintPortal(story,'story');paintPortal(art,'art');purpose.textContent=t.invite;readVision.textContent=c.read;enterFilm.textContent=c.film+' ↓';access.setAttribute('aria-label',c.optional);
    const closing=document.querySelector('[data-home-vision]');
    if(closing){closing.lang=hero.lang;closing.innerHTML=`<h2 id="home-vision-title" tabindex="-1">${t.h}</h2><div class="home-vision-text">${t.p.map(text=>`<p>${text}</p>`).join('')}<p class="sig">${t.sig}</p></div>`;closing.querySelectorAll('a[data-go]').forEach(link=>{const u=new URL(link.dataset.go==='l'?t.leftHref:t.rightHref,location.origin);if(lang==='zh')u.searchParams.set('lang','zh-Hans');link.href=u.pathname+u.search})}
    const directions=document.querySelector('#home-directions');
    if(lang==='zh'&&directions){directions.lang='zh-Hans';directions.querySelector('h2').textContent='两条前行之路';const wings=directions.querySelectorAll('.home-direction-wing');wings.forEach((wing,i)=>{wing.querySelector('h3 a').firstChild.textContent=i?t.right:t.left;wing.querySelector('p').textContent=i?c.art:c.story;wing.querySelector('nav').setAttribute('aria-label',i?t.right:t.left);wing.querySelectorAll('nav a').forEach((a,j)=>a.textContent=(i?['视觉艺术','音乐','社区']:['日记','书籍','法律工具'])[j])});directions.querySelectorAll('a[href]').forEach(a=>{const u=new URL(a.href);u.searchParams.set('lang','zh-Hans');a.href=u.pathname+u.search+u.hash})}
  }
  paint();new MutationObserver(()=>{if(currentLang()!==lang)paint()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  flags.addEventListener('click',event=>{const b=event.target.closest('button[data-lang]');if(!b||b.dataset.lang===lang)return;const code=b.dataset.lang,locale=code==='zh'?'zh-Hans':code;if(window.SFISelectLanguage){window.SFISelectLanguage(locale);return}const u=new URL(location.href);u.pathname=code==='en'?'/en/':'/';if(code==='zh')u.searchParams.set('lang','zh-Hans');else u.searchParams.delete('lang');location.assign(u.href)});
  enterFilm.addEventListener('click',()=>root.querySelector('[data-sj-next]')?.click());
  readVision.addEventListener('click',()=>requestAnimationFrame(()=>document.querySelector('#home-vision-title')?.focus({preventScroll:true})));
  try{sessionStorage.removeItem('sjHeroOpen')}catch{}
  let gem=null,gemFactory=null,gemSize='',gemFailed=false,disposed=false,travelProgress=0,ticking=false;
  const canvas=symbol.querySelector('canvas');root.dataset.medallion='fallback';
  function drawGem(){
    if(disposed||document.hidden||root.dataset.origin!=='true'||!img.complete||!img.naturalWidth)return;
    try{if(!gem&&gemFactory&&!gemFailed)gem=gemFactory(canvas);if(!gem)return;const size=symbol.clientWidth,dpr=Math.min(devicePixelRatio||1,2),key=size+':'+dpr;if(gemSize!==key){gem.resize(size,dpr);gemSize=key}const b=img.getBoundingClientRect(),v=canvas.getBoundingClientRect();if(b.width&&v.width)gem.setBackdrop?.(img,{u0:(v.left-b.left)/b.width,v0:(v.top-b.top)/b.height,u1:(v.right-b.left)/b.width,v1:(v.bottom-b.top)/b.height});gem.render(0,travelProgress);root.dataset.medallion='three'}catch{gemFailed=true;gem?.dispose();gem=null;root.dataset.medallion='fallback'}
  }
  import('/assets/journey/hero-medallion.mjs').then(m=>{gemFactory=m.createMedallion;if(travelProgress===0)drawGem()}).catch(()=>{gemFailed=true});
  img.addEventListener('load',()=>{if(travelProgress===0)drawGem()});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();gemFailed=true;gem?.dispose();gem=null;root.dataset.medallion='fallback'});
  canvas.addEventListener('webglcontextrestored',()=>{gemFailed=false;queue()});
  const clamp=n=>Math.min(1,Math.max(0,n)),smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
  function measure(){
    ticking=false;const rect=root.getBoundingClientRect(),style=getComputedStyle(root),quiet=reduce.matches||root.dataset.quiet==='true',nav=Math.max(0,parseFloat(style.getPropertyValue('--sj-nav-height'))||0),total=parseFloat(style.getPropertyValue('--sj-scenes')),distance=Math.max(1,root.offsetHeight-(innerHeight-nav)),span=total>0?distance*.3/total:innerHeight*.3;
    const p=quiet?0:clamp((nav-rect.top)/Math.max(1,span));travelProgress=p;const tension=Math.sin(Math.PI*clamp(p/.5)),scale=Math.max(.001,1-Math.pow(clamp((p-.3)/.48),3));
    root.dataset.heroTravel=String(p>0&&!quiet);hero.dataset.dragsug=String(p>0&&!quiet);root.style.setProperty('--hero-o',(1-smooth((p-.78)/.22)).toFixed(6));root.style.setProperty('--hero-sx',(scale*(1+tension*.32)).toFixed(6));root.style.setProperty('--hero-sy',(scale*(1-tension*.35)).toFixed(6));
    const shown=root.dataset.origin==='true'&&p<1&&rect.bottom>0;document.body.dataset.heroFront=String(shown);root.dataset.heroHidden=String(!shown);if(shown)drawGem();
  }
  function queue(){if(!ticking){ticking=true;requestAnimationFrame(measure)}}
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',()=>{layout();queue()});reduce.addEventListener('change',queue);new MutationObserver(queue).observe(root,{attributes:true,attributeFilter:['data-origin','data-quiet']});document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue()});addEventListener('pagehide',e=>{if(!e.persisted){disposed=true;gem?.dispose();gem=null}});addEventListener('pageshow',()=>{layout();queue()});layout();measure();
})();
