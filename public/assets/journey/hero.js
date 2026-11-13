// Landing hero for the origin scene. Builds the neural-universe backdrop, the three
// language flags, the spinning symbol with its gold title, and the granite tablet.
// No 3D library and no video: one still image plus compositor-friendly motion.
(()=>{'use strict';
  const root=document.querySelector('[data-journey]');if(!root||root.dataset.hero)return;
  const stage=root.querySelector('.sj-stage'),media=root.querySelector('.sj-media');if(!stage||!media)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),hover=matchMedia('(hover: hover) and (pointer: fine)');
  const SPARKS={"l":{"p":[[72.7,80.8],[19.5,22.0],[99.7,44.4],[57.6,14.5],[83.1,35.0],[31.0,73.4],[89.8,58.4],[41.9,0.5],[68.5,45.3],[91.4,14.5],[38.3,32.2],[16.4,50.9],[11.2,85.5],[46.6,83.6],[27.9,36.0],[79.4,62.1],[75.8,22.9],[0.3,60.3],[56.5,65.9],[68.0,65.0],[7.6,9.8],[39.3,59.3],[23.7,65.0],[20.1,79.0],[96.1,89.3],[2.9,33.2]],"k":[[0,19],[1,14],[2,6],[3,16],[4,16],[5,22],[6,15],[7,3],[8,4],[9,16],[10,14],[11,22],[12,23],[13,5]]},"p":{"p":[[52.3,25.6],[31.0,70.2],[14.4,44.3],[29.2,16.3],[83.8,53.1],[86.6,76.4],[81.9,30.8],[6.9,46.9],[96.8,18.4],[87.5,10.6],[3.2,76.9],[99.5,36.5],[94.0,44.3],[0.5,19.9],[83.8,26.2],[63.4,65.0],[18.1,34.5],[88.4,65.5],[19.0,65.0],[12.5,58.8],[17.1,69.7],[58.8,70.2]],"k":[[0,3],[1,18],[2,7],[3,16],[4,17],[5,17],[6,14],[8,9],[10,20],[11,12],[13,16],[15,21]]}};
  const T={
    no:{left:'Stemmen',right:'fra innsiden',leftHref:'/dagbok/',rightHref:'/kunstfellesskap/',symbol:'Åpne steintavlen: hva Stemmen fra innsiden er',tip:'Hold over symbolet · bla ned for reisen',tipTouch:'Trykk på symbolet · bla ned for reisen',close:'Lukk steintavlen',flags:'Velg språk',h:'Skrevet i stein',
      p:[
        'Denne visjonen er todelt – foreløpig. Mulighetene er uendelige, og vi er på jakt etter samarbeidspartnere og idéskapere.',
        'Flere av dem vi ønsker dialog med, er avhengige av samarbeid med dem aktivismen retter seg mot. Da er det avgjørende at kortene ikke blandes, slik at mulighetene for de tusenvis av livene et samarbeid kan forbedre, ikke stoppes av at skillet er uklart. Vi forstår at de kortene ikke kan blandes.',
        '<a data-go="l" href="#">Stemmen →</a> tar deg til siden for aktivisme, samfunnskritikk, kamp for systemreform og ansvarliggjøring.',
        '<a data-go="r" href="#">Fra innsiden →</a> tar deg til siden for forebyggende arbeid og ettervern, og til et VR-galleri for billedkunst, skulptur, litteratur, video og musikk. Alle som sitter i fengsel, skal kunne sende inn dokumentasjon på verkene sine, stille dem ut og dele dem i sosiale medier. De som liker et verk, skal kunne gi bud på originalen eller bestille det som høyoppløselig trykk på et plagg eller som tapet.',
        'Fellesskapet: Innsatte som bor i utkantstrøk, og ikke nødvendigvis i byen, skal ha tilgang til alle organisasjonene og kunne henvende seg for hjelp og råd etter soning. Innsatte som vil hjelpe andre, kan få en moderatorrolle og eventuelt en fadderrolle. Vi håper på samarbeid med organisasjonene som driver ettervern, slik at de også kan være moderatorer: et forum for innsatte med ettervern i fokus.',
        'Et eget forum er for pårørende. Der håper vi å samarbeide med organisasjoner som hjelper dem, slik at de kan møte andre i samme situasjon og finne forståelse, råd og tips.',
        'Blar du nedover, starter en reise som viser hva som er mulig for deg som sitter med kreative evner. Mange er fulle av dem, men oppvekst og omgivelser har delt ut feil kort, og til nå er evnene kanalisert i en retning som verken tjener deg eller samfunnet. <small>Levekårsundersøkelsen blant innsatte (Friestad og Skog Hansen, Fafo 2004) fant at tre av ti hadde vært i kontakt med barnevernet før de fylte 16. En metaanalyse (Young mfl., Psychological Medicine 2015) fant ADHD hos om lag én av fire voksne innsatte.</small>',
        'Dette er en ny sjanse til å skape muligheter, til å bruke ADHD til det konstruktive, det kreative, levende og inspirerende – til å forandre retningen i livet. Til å forandre alt.'],
      sig:'– Innsatt 2601-46'},
    en:{left:'The Voice',right:'From Inside',leftHref:'/en/dagbok/',rightHref:'/en/art-community/',symbol:'Open the stone tablet: what The Voice from Inside is',tip:'Hover the symbol · scroll down for the journey',tipTouch:'Tap the symbol · scroll down for the journey',close:'Close the stone tablet',flags:'Choose language',h:'Written in stone',
      p:[
        'This vision has two sides – for now. The possibilities are endless, and we are looking for partners and people with ideas.',
        'Several of those we want to talk with depend on cooperation with the very institutions the activism addresses. That is why the cards must never be mixed, so that the chance to improve thousands of lives through cooperation is not stopped by an unclear line. We understand that those cards cannot be mixed.',
        '<a data-go="l" href="#">The Voice →</a> takes you to the side for activism, social criticism, the fight for system reform and accountability.',
        '<a data-go="r" href="#">From Inside →</a> takes you to the side for prevention and aftercare, and to a VR gallery for visual art, sculpture, writing, video and music. Everyone in prison should be able to submit documentation of their work, exhibit it and share it on social media. Those who like a piece should be able to bid on the original or order it as a high-resolution print on a garment or as wallpaper.',
        'The community: people in prison from outlying districts, not necessarily the city, should have access to all the organisations and be able to ask for help and advice after release. Prisoners who want to help others can take a moderator role and possibly a mentor role. We hope to work with the organisations that provide aftercare so that they can moderate too: a forum for prisoners with aftercare in focus.',
        'A separate forum is for relatives. There we hope to work with organisations that support them, so they can meet others in the same situation and find understanding, advice and tips.',
        'Scroll down and a journey begins that shows what is possible for you who carry creative abilities. Many are full of them, but upbringing and surroundings dealt the wrong cards, and until now those abilities have been channelled in a direction that serves neither you nor society. <small>The Norwegian living-conditions survey of prisoners (Friestad and Skog Hansen, Fafo 2004) found that three in ten had been in contact with child welfare before age 16. A meta-analysis (Young et al., Psychological Medicine 2015) found ADHD in about one in four adult prisoners.</small>',
        'This is a new chance to create opportunities, to use ADHD for what is constructive, creative, alive and inspiring – to change the direction of a life. To change everything.'],
      sig:'– Inmate 2601-46'},
    zh:{left:'声音',right:'来自内部',leftHref:'/dagbok/',rightHref:'/kunstfellesskap/',symbol:'打开石碑：了解“来自内部的声音”',tip:'将鼠标移到标志上 · 向下滚动开始旅程',tipTouch:'点按标志 · 向下滚动开始旅程',close:'关闭石碑',flags:'选择语言',h:'刻在石上',
      p:[
        '这个愿景目前分为两部分。可能性无穷无尽，我们正在寻找合作伙伴和有想法的人。',
        '我们希望对话的许多伙伴，依赖于与行动主义所针对的机构合作。因此两者绝不能混在一起，这样合作可能改善的成千上万人的生活，才不会因为界限不清而受阻。我们明白，这两副牌不能混在一起。',
        '<a data-go="l" href="#">声音 →</a> 带你进入行动主义、社会批评、争取制度改革与问责的一侧。',
        '<a data-go="r" href="#">来自内部 →</a> 带你进入预防与出狱后支持的一侧，以及展示绘画、雕塑、文学、视频和音乐的VR画廊。每一位在押者都应能提交作品资料、展出并在社交媒体分享。喜欢作品的人将可以对原作出价，或订购印在服装或墙纸上的高清复制品。',
        '社区：住在偏远地区、不一定在城市的在押者，应当能够接触所有组织，并在服刑结束后寻求帮助和建议。愿意帮助他人的在押者可以担任版主，也可以成为同伴导师。我们希望与提供出狱后支持的组织合作，让他们也担任版主：一个以出狱后支持为重点的在押者论坛。',
        '另一个论坛面向家属。我们希望与帮助家属的组织合作，让他们遇见处境相同的人，获得理解、建议和经验。',
        '向下滚动，一段旅程将展示拥有创造力的你可以做到什么。许多人充满创造力，但成长环境发错了牌，这些能力一直被引向既不利于你也不利于社会的方向。<small>挪威在押者生活状况调查（Friestad与Skog Hansen，Fafo 2004）发现，十分之三的人在16岁前接触过儿童福利机构。一项荟萃分析（Young等，Psychological Medicine 2015）发现约四分之一的成年在押者患有ADHD。</small>',
        '这是一次新的机会：创造可能，把ADHD用于建设性的、有创造力的、鲜活而鼓舞人心的事情，改变人生的方向。改变一切。'],
      sig:'– 在押者 2601-46'}};
  const currentLang=()=>location.pathname.startsWith('/en')?'en':(new URLSearchParams(location.search).get('lang')||document.documentElement.lang||'').toLowerCase().startsWith('zh')?'zh':'no';
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
  let orient='';
  function layout(){
    const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
    const next=h>w*1.05?'p':'l';
    if(next!==orient){orient=next;img.src=next==='p'?'/assets/journey/hero/universe-portrait-1080.webp':(w*(window.devicePixelRatio||1)>2100?'/assets/journey/hero/universe-3840.webp':'/assets/journey/hero/universe-1920.webp');buildSparks()}
    const ar=orient==='p'?1080/1935:3840/2143,cover=Math.max(w*1.14,h*1.14*ar);
    plate.style.width=cover+'px';plate.style.height=cover/ar+'px';
    const set=SPARKS[orient];plate.querySelectorAll('.sj-hero-signal').forEach((node,i)=>{const [a,b]=set.k[i%set.k.length],p=set.p;node.style.setProperty('--dx',((p[b][0]-p[a][0])/100*cover).toFixed(1)+'px');node.style.setProperty('--dy',((p[b][1]-p[a][1])/100*cover/ar).toFixed(1)+'px')});
  }
  function buildSparks(){
    plate.querySelectorAll('.sj-hero-spark,.sj-hero-signal').forEach(node=>node.remove());if(reduce.matches)return;
    const set=SPARKS[orient];
    set.p.forEach(([x,y],i)=>{const node=el('i','sj-hero-spark');node.style.cssText=`left:${x}%;top:${y}%;--d:${orient==='p'?'clamp(16px,6vw,34px)':'clamp(18px,2.6vw,52px)'};--t:${(5.5+(i*37%50)/10).toFixed(1)}s;--dl:-${(i*1.37%9).toFixed(2)}s`;plate.append(node)});
    set.k.forEach(([a],i)=>{const node=el('i','sj-hero-signal');node.style.cssText=`left:${set.p[a][0]}%;top:${set.p[a][1]}%;--t:${(3.6+(i*29%40)/10).toFixed(1)}s;--dl:-${(i*.83%6).toFixed(2)}s`;plate.append(node)});
  }

  const hero=el('div','sj-hero');hero.dataset.state='idle';
  const flags=el('div','sj-hero-flags');flags.setAttribute('role','group');
  FLAGS.forEach(([code,name,svg],i)=>{const button=el('button','sj-hero-flag',svg);button.type='button';button.dataset.lang=code;button.style.setProperty('--i',i);button.setAttribute('aria-label',name);button.title=name;flags.append(button)});
  const zone=el('div','sj-hero-zone'),core=el('div','sj-hero-core');
  const symbol=el('button','sj-hero-symbol','<span class="sj-hero-disc"></span><canvas class="sj-hero-matrix" width="160" height="160"></canvas><span class="sj-hero-ring"></span><svg class="sj-hero-star" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="sjHeroGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c8"/><stop offset=".3" stop-color="#f8d76a"/><stop offset=".55" stop-color="#c9952a"/><stop offset=".75" stop-color="#fbe7a1"/><stop offset="1" stop-color="#9c6a14"/></linearGradient></defs><path d="M50 0C54 34 66 46 100 50C66 54 54 66 50 100C46 66 34 54 0 50C34 46 46 34 50 0Z" fill="url(#sjHeroGold)" stroke="#fff3c0" stroke-width=".8"/></svg>');
  symbol.type='button';symbol.setAttribute('aria-expanded','false');symbol.setAttribute('aria-controls','sj-hero-tablet');
  const title=el('p','sj-hero-title'),left=el('a','l'),right=el('a','r');title.append(left,right);const halo=el('span','sj-hero-halo');halo.setAttribute('aria-hidden','true');core.append(halo,symbol,title);
  const tablet=el('div','sj-hero-tablet');tablet.id='sj-hero-tablet';tablet.setAttribute('role','region');tablet.tabIndex=-1;
  const tip=el('p','sj-hero-tip');
  hero.append(flags,zone,core,tip,tablet);stage.append(hero);root.dataset.hero='true';

  function paint(){
    lang=currentLang();const t=T[lang];
    left.textContent=t.left;right.textContent=t.right;left.href=t.leftHref;right.href=t.rightHref;
    symbol.setAttribute('aria-label',t.symbol);flags.setAttribute('aria-label',t.flags);tip.textContent=hover.matches?t.tip:t.tipTouch;tablet.setAttribute('aria-label',t.h);
    tablet.innerHTML=`<button type="button" class="sj-hero-close" aria-label="${t.close}">×</button><h2>${t.h}</h2><div class="sj-hero-cols">${t.p.map(text=>`<p>${text}</p>`).join('')}<p class="sig">${t.sig}</p></div>`;
    tablet.querySelectorAll('a[data-go]').forEach(link=>{link.href=link.dataset.go==='l'?t.leftHref:t.rightHref});
    tablet.lang=title.lang=lang==='zh'?'zh-Hans':lang==='en'?'en':'nb';
    flags.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.lang===lang)));
  }
  paint();
  new MutationObserver(()=>{if(currentLang()!==lang)paint()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

  // State: hover (fine pointers), focus, or tap-to-pin.
  let pinned=false,leaveTimer=0,angle=0,last=0,spinning=false,visible=true;
  function setActive(on){
    clearTimeout(leaveTimer);const state=on?'active':'idle';if(hero.dataset.state===state)return;
    hero.dataset.state=state;symbol.setAttribute('aria-expanded',String(on));
    if(on){const set=SPARKS[orient||'l'],[x,y]=set.p[3];hero.style.setProperty('--ox',(x-50)*.9+'vw');hero.style.setProperty('--oy',-(92-y*.6)*.5+'vh')}
    startSpin();
  }
  const leaveSoon=()=>{if(pinned)return;clearTimeout(leaveTimer);leaveTimer=setTimeout(()=>{if(!pinned&&!hero.querySelector(':hover'))setActive(false)},420)};
  for(const node of [flags,zone,core,tablet]){node.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&hover.matches)setActive(true)});node.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')leaveSoon()})}
  symbol.addEventListener('click',()=>{pinned=!pinned;hero.dataset.pinned=String(pinned);setActive(pinned||(hover.matches&&!!hero.querySelector(':hover')));if(pinned)tablet.focus({preventScroll:true})});
  tablet.addEventListener('click',event=>{if(event.target.closest('.sj-hero-close')){pinned=false;hero.dataset.pinned='false';setActive(false);symbol.focus({preventScroll:true})}});
  hero.addEventListener('keydown',event=>{if(event.key==='Escape'&&hero.dataset.state==='active'){pinned=false;hero.dataset.pinned='false';setActive(false);symbol.focus({preventScroll:true});event.stopPropagation()}});
  flags.addEventListener('click',event=>{const button=event.target.closest('button[data-lang]');if(!button)return;if(button.dataset.lang===lang){pinned=true;hero.dataset.pinned='true';setActive(true);return}try{sessionStorage.setItem('sjHeroOpen','1')}catch{}const code=button.dataset.lang,locale=code==='zh'?'zh-Hans':code;
    if(window.SFISelectLanguage){window.SFISelectLanguage(locale);return}
    const url=new URL(location.href);url.pathname=code==='en'?'/en/':'/';if(code==='zh')url.searchParams.set('lang','zh-Hans');else url.searchParams.delete('lang');location.assign(url.href)});

  // Spin: symbol and title turn together; when active they ease to face the visitor and rest.
  function startSpin(){if(spinning||!visible||reduce.matches||root.dataset.quiet==='true')return;spinning=true;last=0;requestAnimationFrame(spin)}
  function spin(time){
    if(!spinning)return;if(!visible||document.hidden){spinning=false;return}
    const dt=last?Math.min(64,time-last):16;last=time;
    if(hero.dataset.state==='active'){const goal=Math.round(angle/360)*360;angle+=(goal-angle)*Math.min(1,dt/130);if(Math.abs(goal-angle)<.08){angle=0;core.style.setProperty('--a','0deg');spinning=false;return}}
    else angle=(angle+dt*360/18000)%360;
    core.style.setProperty('--a',angle.toFixed(2)+'deg');requestAnimationFrame(spin);
  }

  // Matrix rain inside the diamond ring: a tiny canvas at ~11 fps.
  const canvas=symbol.querySelector('canvas'),ctx=canvas.getContext('2d'),glyphs='ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789',cols=11,cell=canvas.width/cols,drops=Array.from({length:cols},(_,i)=>(i*7)%cols);
  let rainTimer=0;
  function rain(){
    if(!ctx)return;ctx.globalCompositeOperation='destination-out';ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalCompositeOperation='source-over';ctx.font=`700 ${Math.round(cell*.95)}px monospace`;ctx.textAlign='center';
    for(let i=0;i<cols;i++){const y=drops[i]*cell;ctx.fillStyle='#d9ffe8';ctx.fillText(glyphs[(Math.random()*glyphs.length)|0],i*cell+cell/2,y);ctx.fillStyle='#3dff8a';ctx.fillText(glyphs[(Math.random()*glyphs.length)|0],i*cell+cell/2,y-cell);drops[i]=y>canvas.height&&Math.random()>.82?0:drops[i]+1}
  }
  function rainOn(on){clearInterval(rainTimer);rainTimer=0;if(on&&!reduce.matches&&root.dataset.quiet!=='true')rainTimer=setInterval(rain,90)}
  if(ctx){for(let i=0;i<26;i++)rain()}

  // Scroll: the hero fades as the visitor leaves the top; everything rests when it is not shown.
  let ticking=false;
  function measure(){
    ticking=false;const rect=root.getBoundingClientRect(),isOrigin=root.dataset.origin==='true';
    const progress=Math.min(1,Math.max(0,-rect.top/(innerHeight*.24)));
    root.style.setProperty('--hero-o',(1-progress).toFixed(3));
    const shown=isOrigin&&progress<1&&rect.bottom>0;
    document.body.dataset.heroFront=String(shown);if(shown!==visible){visible=shown;root.dataset.heroHidden=String(!shown);if(!shown&&!pinned)setActive(false);rainOn(shown);if(shown)startSpin()}
  }
  const queue=()=>{if(!ticking){ticking=true;requestAnimationFrame(measure)}};
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',()=>{layout();queue()});
  new MutationObserver(()=>{queue();rainOn(visible);if(visible)startSpin()}).observe(root,{attributes:true,attributeFilter:['data-origin','data-quiet']});
  document.addEventListener('visibilitychange',()=>{rainOn(visible&&!document.hidden);if(!document.hidden&&visible)startSpin()});
  layout();measure();rainOn(true);startSpin();
  try{if(sessionStorage.getItem('sjHeroOpen')){sessionStorage.removeItem('sjHeroOpen');pinned=true;hero.dataset.pinned='true';setActive(true)}}catch{}
})();
