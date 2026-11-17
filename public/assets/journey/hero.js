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

  // Backdrop inside the media layer so the journey chrome stays above it.
  const bg=el('div','sj-hero-bg'),drift=el('div','sj-hero-drift'),plate=el('div','sj-hero-plate');bg.setAttribute('aria-hidden','true');
  const img=new Image();img.alt='';img.decoding='async';plate.append(img);drift.append(plate);bg.append(drift);media.append(bg);
  // A pinned starfield for the opening: black space only, no Earth, brains,
  // nebula plate or remote asset. Equal viewport orientation yields equal stars.
  let orient='';
  function starfield(portrait){
    const w=portrait?1080:3840,h=portrait?1935:2143;
    let seed=260146;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const stars=Array.from({length:portrait?220:380},()=>{
      const x=(random()*w).toFixed(2),y=(random()*h).toFixed(2),r=(.8+random()*(portrait?2.4:3.2)).toFixed(2),o=(.25+random()*.65).toFixed(2);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#eef4ff" opacity="${o}"/>`;
    }).join('');
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><path fill="#000" d="M0 0h${w}v${h}H0z"/>${stars}</svg>`);
  }
  function layout(){
    const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
    const next=h>w*1.05?'p':'l';
    if(next!==orient){orient=next;img.src=starfield(next==='p')}
    const ar=orient==='p'?1080/1935:3840/2143,cover=Math.max(w*1.14,h*1.14*ar);
    plate.style.width=cover+'px';plate.style.height=cover/ar+'px';
  }

  const hero=el('div','sj-hero');hero.dataset.state='idle';
  const flags=el('div','sj-hero-flags');flags.setAttribute('role','group');
  FLAGS.forEach(([code,name,svg],i)=>{const button=el('button','sj-hero-flag',svg);button.type='button';button.dataset.lang=code;button.style.setProperty('--i',i);button.setAttribute('aria-label',name);button.title=name;flags.append(button)});
  const zone=el('div','sj-hero-zone'),core=el('div','sj-hero-core');
  const symbol=el('button','sj-hero-symbol',`<svg class="sj-hero-fallback" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="sjGemGold" x2=".7" y2="1"><stop stop-color="#fff4c4"/><stop offset=".4" stop-color="#d9a845"/><stop offset=".65" stop-color="#ffdf81"/><stop offset="1" stop-color="#946315"/></linearGradient></defs><circle cx="50" cy="50" r="45" fill="rgba(220,245,255,.025)" stroke="rgba(232,248,255,.65)" stroke-width=".7"/><path d="M18 18L50 6L82 18L94 50L82 82L50 94L18 82L6 50Z" fill="none" stroke="rgba(234,248,255,.25)" stroke-width=".6"/><path d="M50 17C53 39 61 47 83 50C61 53 53 61 50 83C47 61 39 53 17 50C39 47 47 39 50 17Z" fill="url(#sjGemGold)"/></svg><canvas class="sj-hero-gem" aria-hidden="true"></canvas>`);
  symbol.type='button';symbol.setAttribute('aria-expanded','false');symbol.setAttribute('aria-controls','sj-hero-tablet');
  const title=el('p','sj-hero-title'),left=el('a','l'),right=el('a','r');title.append(left,right);const halo=el('span','sj-hero-halo');halo.setAttribute('aria-hidden','true');core.append(halo,symbol,title);
  const tablet=el('div','sj-hero-tablet');tablet.id='sj-hero-tablet';tablet.setAttribute('role','region');tablet.tabIndex=-1;
  const tip=el('p','sj-hero-tip');
  const access=el('nav','sj-hero-access');
  const readVision=el('button','sj-hero-read');readVision.type='button';readVision.dataset.openVision='';
  const skipFilm=el('a','sj-hero-skip');skipFilm.href='#home-directions';access.append(readVision,skipFilm);
  hero.append(flags,zone,core,tip,tablet,access);stage.append(hero);root.dataset.hero='true';

  function paint(){
    lang=currentLang();const t=T[lang];
    left.textContent=t.left;right.textContent=t.right;left.href=t.leftHref;right.href=t.rightHref;
    symbol.setAttribute('aria-label',t.symbol);flags.setAttribute('aria-label',t.flags);tablet.setAttribute('aria-label',t.h);
    tablet.innerHTML=`<button type="button" class="sj-hero-close" aria-label="${t.close}">×</button><h2>${t.h}</h2><div class="sj-hero-cols">${t.p.map(text=>`<p>${text}</p>`).join('')}<p class="sig">${t.sig}</p></div><nav class="sj-hero-tools">${t.tools}</nav><p class="sj-hero-invite">${t.invite} ↓</p>`;
    tablet.querySelectorAll('a[data-go]').forEach(link=>{link.href=link.dataset.go==='l'?t.leftHref:t.rightHref});
    tablet.lang=title.lang=lang==='zh'?'zh-Hans':lang==='en'?'en':'nb';
    const entryLabels={no:{read:'Les visjonen',skip:'Gå rett til innholdet',group:'Velg din vei'},en:{read:'Read the vision',skip:'Go straight to the content',group:'Choose your way'},zh:{read:'阅读愿景',skip:'直接进入内容',group:'选择你的方向'}}[lang];
    readVision.textContent=entryLabels.read;skipFilm.textContent=entryLabels.skip+' ↓';access.setAttribute('aria-label',entryLabels.group);
    const closing=document.querySelector('[data-home-vision]');
    if(closing){
      closing.lang=tablet.lang;
      closing.innerHTML=`<h2 id="home-vision-title">${t.h}</h2><div class="home-vision-text">${t.p.map(text=>`<p>${text}</p>`).join('')}<p class="sig">${t.sig}</p></div>`;
      closing.querySelectorAll('a[data-go]').forEach(link=>{const u=new URL(link.dataset.go==='l'?t.leftHref:t.rightHref,location.origin);if(lang==='zh')u.searchParams.set('lang','zh-Hans');link.href=u.pathname+u.search});
    }
    // The same approved vision is available before and after the optional film.
    const directions=document.querySelector('#home-directions');
    if(lang==='zh'&&directions){
      directions.lang='zh-Hans';directions.querySelector('h2').textContent='两条前行之路';
      const story=directions.querySelector('[data-home-direction="story"]'),art=directions.querySelector('[data-home-direction="art"]');
      story.firstChild.textContent='声音';art.firstChild.textContent='来自内部';
      const wings=directions.querySelectorAll('.home-direction-wing');wings[0].querySelector('nav').setAttribute('aria-label','声音');wings[1].querySelector('nav').setAttribute('aria-label','来自内部');wings[0].querySelector('p').textContent='日记、书籍、新闻自由与法律权利工具。';wings[1].querySelector('p').textContent='艺术、音乐与社区，共同迈向积极的未来。';
      const labels=['日记','书籍','法律工具','视觉艺术','音乐','社区'];directions.querySelectorAll('nav a').forEach((a,i)=>a.textContent=labels[i]);
      directions.querySelectorAll('a[href]').forEach(a=>{const u=new URL(a.href);u.searchParams.set('lang','zh-Hans');a.href=u.pathname+u.search+u.hash});
    }
    flags.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lang===lang)));
  }
  paint();
  new MutationObserver(()=>{if(currentLang()!==lang)paint()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

  // State: hover (fine pointers), focus, or tap-to-pin.
  let pinned=false,leaveTimer=0,angle=0,last=0,spinning=false,visible=true,travelProgress=0,coreMoving=false;
  let tabletOpenY=0,tabletOpener=symbol;
  function setActive(on){
    if(on&&travelProgress>0)return;clearTimeout(leaveTimer);const state=on?'active':'idle';if(hero.dataset.state===state)return;
    hero.dataset.state=state;symbol.setAttribute('aria-expanded',String(on));
    if(on){tabletOpenY=window.scrollY;hero.style.setProperty('--ox','0px');hero.style.setProperty('--oy','-34vh')}
    startSpin();
  }
  // The empty starfield stays still until the visitor reaches the medallion.
  // Allow travel from the raised symbol to the tablet without closing it.
  const hoverTargets = [symbol, left, right, tablet];
  function leaveSoon() {
    clearTimeout(leaveTimer);
    leaveTimer = setTimeout(() => {
      const reading = tablet.contains(document.activeElement);
      if (!pinned && !reading && !hoverTargets.some(node => node.matches(':hover'))) {
        setActive(false);
      }
    }, 420);
  }
  for (const node of hoverTargets) {
    node.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' && hover.matches) setActive(true);
    });
    node.addEventListener('pointerleave', event => {
      if (event.pointerType === 'mouse') leaveSoon();
    });
  }
  tablet.addEventListener('focusout', leaveSoon);
  readVision.addEventListener('click',()=>{tabletOpener=readVision;pinned=true;hero.dataset.pinned='true';setActive(true);tablet.focus({preventScroll:true})});
  skipFilm.addEventListener('click',()=>{pinned=false;hero.dataset.pinned='false';setActive(false);requestAnimationFrame(()=>document.querySelector('#home-directions')?.focus({preventScroll:true}))});
  symbol.addEventListener('click', () => {
    tabletOpener=symbol;
    pinned = !pinned;
    hero.dataset.pinned = String(pinned);
    setActive(pinned);
    if (pinned) tablet.focus({preventScroll:true});
  });
  tablet.addEventListener('click',event=>{if(event.target.closest('.sj-hero-close')){pinned=false;hero.dataset.pinned='false';setActive(false);tabletOpener.focus({preventScroll:true})}});
  hero.addEventListener('keydown',event=>{if(event.key==='Escape'&&hero.dataset.state==='active'){pinned=false;hero.dataset.pinned='false';setActive(false);tabletOpener.focus({preventScroll:true});event.stopPropagation()}});
  flags.addEventListener('click',event=>{const button=event.target.closest('button[data-lang]');if(!button)return;if(button.dataset.lang===lang){pinned=true;hero.dataset.pinned='true';setActive(true);return}try{sessionStorage.setItem('sjHeroOpen','1')}catch{}const code=button.dataset.lang,locale=code==='zh'?'zh-Hans':code;
    if(window.SFISelectLanguage){window.SFISelectLanguage(locale);return}
    const url=new URL(location.href);url.pathname=code==='en'?'/en/':'/';if(code==='zh')url.searchParams.set('lang','zh-Hans');else url.searchParams.delete('lang');location.assign(url.href)});

  // Spin: symbol and title turn together; when active they ease to face the visitor and rest.
  function startSpin(){if(spinning||!visible||travelProgress>0||reduce.matches||root.dataset.quiet==='true')return;spinning=true;last=0;requestAnimationFrame(spin)}
  function spin(time){
    if(!spinning)return;if(!visible||travelProgress>0||document.hidden||reduce.matches||root.dataset.quiet==='true'){spinning=false;angle=0;core.style.setProperty('--a','0deg');return}
    const dt=last?Math.min(64,time-last):16;last=time;
    if(hero.dataset.state==='active'){const goal=Math.round(angle/360)*360;angle+=(goal-angle)*Math.min(1,dt/130);if(Math.abs(goal-angle)<.08){angle=0;core.style.setProperty('--a','0deg');drawGem();if(!coreMoving){spinning=false;return}}}
    else angle=(angle+dt*360/18000)%360;
    core.style.setProperty('--a',angle.toFixed(2)+'deg');drawGem();requestAnimationFrame(spin);
  }

  // The existing hero clock owns the 3D scene: no renderer timer or RAF.
  const gemCanvas=symbol.querySelector('.sj-hero-gem');
  let gem=null,gemFactory=null,gemSize=0,gemFailed=false,gemDisposed=false;
  root.dataset.medallion='loading';
  function gemFallback(){
    const old=gem;gem=null;gemSize=0;root.dataset.medallion='fallback';
    if(old){try{old.dispose()}catch{}}
  }
  function drawGem(){
    if(gemDisposed||document.hidden||!visible||root.dataset.origin!=='true')return;
    if(!gem&&gemFactory&&!gemFailed){
      try{gem=gemFactory(gemCanvas)}catch{gemFailed=true;gemFallback();return}
    }
    if(!gem)return;
    if(!img.complete||!img.naturalWidth)return;
    try{
      const size=Math.round(symbol.clientWidth),dpr=Math.min(devicePixelRatio||1,2);
      const identity=size+':'+dpr;
      if(gemSize!==identity){gem.resize(size,dpr);gemSize=identity}
      const background=img.getBoundingClientRect(),view=gemCanvas.getBoundingClientRect();
      if(background.width<=0||background.height<=0||view.width<=0||view.height<=0)return;
      gem.setBackdrop?.(img,{u0:(view.left-background.left)/background.width,v0:(view.top-background.top)/background.height,u1:(view.right-background.left)/background.width,v1:(view.bottom-background.top)/background.height});
      gem.render(angle*Math.PI/180,travelProgress);
      root.dataset.medallion='three';
    }catch{gemFailed=true;gemFallback()}
  }
  // Import completion may initialise the opening, but never repaint a stopped
  // mid-scroll presentation. The next native input admits the pending renderer.
  import('/assets/journey/hero-medallion.mjs').then(module=>{
    gemFactory=module.createMedallion;
    if(travelProgress===0)drawGem();
  }).catch(()=>{gemFailed=true;root.dataset.medallion='fallback'});
  gemCanvas.addEventListener('webglcontextlost',event=>{event.preventDefault();gemFailed=true;gemFallback()});
  gemCanvas.addEventListener('webglcontextrestored',()=>{gemFailed=false;queue()});
  addEventListener('pagehide',event=>{if(!event.persisted){gemDisposed=true;gemFallback()}});
  // Initial image readiness is admitted only at the opening. After scroll,
  // asset completion waits for the next real input instead of idle catch-up.
  img.addEventListener('load',()=>{if(travelProgress===0)drawGem()});
  core.addEventListener('transitionrun',event=>{if(event.target===core&&event.propertyName==='transform'&&travelProgress===0){coreMoving=true;startSpin()}});
  for(const type of ['transitionend','transitioncancel'])core.addEventListener(type,event=>{if(event.target===core&&event.propertyName==='transform'){coreMoving=false;if(travelProgress===0)drawGem()}});
  function rainOn(on){if(on)drawGem()}

  // The first scene's authored 0.3 weight shares the journey's absolute native
  // scroll geometry. No elapsed-time input or asynchronous collapse is used.
  const rays=Array.from({length:48},(_,i)=>{const angle=i*2.39996323,near=8+(i*13%17),far=near+12+(i*7%31),x=Math.cos(angle),y=Math.sin(angle);return `<path d="M${(x*near).toFixed(3)} ${(y*near).toFixed(3)}L${(x*far).toFixed(3)} ${(y*far).toFixed(3)}" stroke="#ffdfac" stroke-width="${(.16+(i%4)*.08).toFixed(2)}" opacity="${(.3+(i%7)*.09).toFixed(2)}"/>`}).join('');
  const burst=el('div','sj-hero-burst',`<svg class="sj-hero-shock" viewBox="-100 -100 200 200" aria-hidden="true">${rays}</svg><span class="sj-hero-point"></span>`);
  burst.setAttribute('aria-hidden','true');stage.append(burst);
  const clamp=n=>Math.min(1,Math.max(0,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n)};
  function fixedMatrix(p){drawGem()}
  let ticking=false;
  function measure(){
    ticking=false;const rect=root.getBoundingClientRect(),isOrigin=root.dataset.origin==='true';
    const staticView=reduce.matches||root.dataset.quiet==='true';
    const style=getComputedStyle(root),total=parseFloat(style.getPropertyValue('--sj-scenes'));
    const nav=Math.max(0,parseFloat(style.getPropertyValue('--sj-nav-height'))||0);
    const distance=Math.max(1,root.offsetHeight-(innerHeight-nav));
    const span=Number.isFinite(total)&&total>0?distance*.3/total:innerHeight*.3;
    const progress=staticView?0:clamp((nav-rect.top)/Math.max(1,span));
    travelProgress=progress;
    // Pull back under tension, then accelerate into one centre. The final
    // modest gold ejection expands before the existing big-bang point handoff.
    const tension=Math.sin(Math.PI*clamp(progress/.5));
    const collapse=Math.pow(clamp((progress-.3)/.48),3);
    const scale=Math.max(.001,1-collapse);
    const burstPhase=clamp((progress-.78)/.22);
    const opacity=1-smooth((progress-.78)/.22);
    root.dataset.heroTravel=String(progress>0&&!staticView);
    hero.dataset.dragsug=progress>0&&!staticView?'true':'false';
    root.style.setProperty('--hero-travel',progress.toFixed(6));
    root.style.setProperty('--hero-o',opacity.toFixed(6));
    root.style.setProperty('--hero-sx',(scale*(1+tension*.32)).toFixed(6));
    root.style.setProperty('--hero-sy',(scale*(1-tension*.35)).toFixed(6));
    root.style.setProperty('--hero-burst-scale',(.015+smooth(burstPhase)*1.7).toFixed(6));
    root.style.setProperty('--hero-burst-opacity',(Math.sin(Math.PI*burstPhase)*.46).toFixed(6));
    root.style.setProperty('--hero-point-opacity',smooth((progress-.68)/.16).toFixed(6));
    if(progress>0){rainOn(false);spinning=false;angle=0;core.style.setProperty('--a','0deg');if(isOrigin)fixedMatrix(progress)}
    const leftStaticTablet=staticView&&Math.abs(window.scrollY-tabletOpenY)>10;
    if((progress>0||leftStaticTablet||!isOrigin)&&(pinned||hero.dataset.state==='active')){pinned=false;hero.dataset.pinned='false';setActive(false);if(tablet.contains(document.activeElement))document.activeElement.blur()}
    const shown=isOrigin&&progress<1&&rect.bottom>0;
    document.body.dataset.heroFront=String(shown);
    if(shown!==visible){visible=shown;root.dataset.heroHidden=String(!shown);if(!shown&&!pinned)setActive(false);if(shown)drawGem()}
    if(progress===0&&shown){rainOn(true);startSpin()}
  }
  reduce.addEventListener('change',()=>{queue();rainOn(visible);if(!reduce.matches)startSpin()});
  const queue=()=>{if(!ticking){ticking=true;requestAnimationFrame(measure)}};
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',()=>{layout();queue()});
  new MutationObserver(()=>{queue();rainOn(visible);if(visible)startSpin()}).observe(root,{attributes:true,attributeFilter:['data-origin','data-quiet']});
  document.addEventListener('visibilitychange',()=>{rainOn(visible&&!document.hidden);if(!document.hidden&&visible)startSpin()});
  layout();measure();rainOn(true);startSpin();
  try{if(sessionStorage.getItem('sjHeroOpen')){sessionStorage.removeItem('sjHeroOpen');pinned=true;hero.dataset.pinned='true';setActive(true)}}catch{}
})();
