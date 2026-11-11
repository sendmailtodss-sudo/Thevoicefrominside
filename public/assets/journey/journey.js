/* Stemmen's cinematic opening. No remote services, tracking or automatic audio. */
(() => {
  'use strict';
  const KEY='stemmen-journey-v1';
  const TEXT={
    no:{eyebrow:'KUNST · FORTELLINGER · FORANDRING',title:'Mange tanker.\nÉn bevegelse.',deck:'En reise fra det vi bærer alene, til det vi kan skape sammen.',skip:'Gå rett til innholdet ↗',hint:'Bla videre. Finn din egen vei.',language:'Språk i reisen',prev:'Forrige scene',next:'Neste scene',pause:'Pause',resume:'Bevegelse på',off:'Lyd av',on:'Lyd på',quiet:'Velg en scene med pilene, eller gå rett til innholdet.',unavailable:'Filmen kunne ikke lastes. Du kan fortsette med bildene og lenkene.',artTitle:'Gi uttrykket\net sted å leve.',artDeck:'Kunsten er her. Velg et verk, se nærmere, eller finn din egen måte å bidra på.',contribute:'Hva er ditt uttrykk? ↗',justice:'Rettspeil',lar:'LAR',diary:'Dagbok',art:'Kunstfellesskapet'},
    en:{eyebrow:'ART · STORIES · CHANGE',title:'Many minds.\nOne movement.',deck:'A journey from what we carry alone to what we can create together.',skip:'Go straight to the content ↗',hint:'Scroll onwards. Find your own way.',language:'Journey language',prev:'Previous scene',next:'Next scene',pause:'Pause',resume:'Motion on',off:'Sound off',on:'Sound on',quiet:'Choose a scene with the arrows, or go straight to the content.',unavailable:'The film could not load. You can continue with the images and links.',artTitle:'Give expression\na place to live.',artDeck:'The art is here. Choose a work, look closer, or find your own way to contribute.',contribute:'What is your expression? ↗',justice:'Justice Mirror',lar:'LAR',diary:'Diary',art:'Creative community'},
    zh:{eyebrow:'艺术 · 故事 · 改变',title:'万千思想。\n汇成一股力量。',deck:'从独自承受的经历，走向共同创造的可能。',skip:'直接浏览内容 ↗',hint:'继续向下滚动，寻找自己的方向。',language:'旅程语言',prev:'上一幕',next:'下一幕',pause:'暂停',resume:'开启动画',off:'声音关闭',on:'声音开启',quiet:'使用箭头选择场景，或直接浏览内容。',unavailable:'视频暂时无法加载。您仍可查看图片并使用链接。',artTitle:'让表达\n拥有一席之地。',artDeck:'作品就在这里。选择一幅作品，细细观看，或寻找自己的参与方式。',contribute:'你想如何表达？↗',justice:'司法之镜',lar:'LAR',diary:'狱中日记',art:'艺术社区'}
  };
  const TITLES={galaxy:['Melkeveien','The Milky Way','银河'],brains:['Et univers av tanker','A universe of minds','思想的宇宙'],impulses:['Når tanker møtes','When minds meet','当思想相遇'],vortex:['En idé finner en annen','One idea finds another','一个想法遇见另一个'],supernova:['Noe nytt blir til','Something new begins','新的可能诞生'],dna:['En tråd gjennom oss alle','A thread through us all','贯穿我们的丝线'],painter:['Maleren','The painter','画家'],poet:['Poeten','The poet','诗人'],rapper:['Rapperen','The rapper','说唱歌手'],metal:['Skrapmetallkunstneren','The metal sculptor','金属雕塑家'],ai:['AI-kunstneren','The AI artist','人工智能艺术创作者'],streetart:['Gatekunstnerne','The street artists','街头艺术家'],filmmaker:['Filmskaperen','The filmmaker','电影创作者'],gallery:['Kunsten møtes','The art comes together','艺术在此相聚'],bergen:['Bergen','Bergen','卑尔根'],paris:['Paris','Paris','巴黎'],'new-york':['New York','New York','纽约'],interior:['Kunsten i rommet','Art in the room','生活中的艺术'],stencil:['Sjablongen','The stencil','模板艺术'],'red-riding-hood':['Rødhette','Little Red Riding Hood','小红帽']};
  const ROUTES={no:{justice:'/rettsspeil/',lar:'/dagbok/lar-bak-murene/',diary:'/dagbok/',art:'/kunstfellesskap/',contribute:'/collaborate/'},en:{justice:'/en/rettsspeil/',lar:'/en/dagbok/lar-bak-murene/',diary:'/en/dagbok/',art:'/en/creative-community/',contribute:'/en/collaborate/'}};
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  let dispose=()=>{};
  function init(){
    dispose();
    const root=document.querySelector('[data-journey]');if(!root)return;
    const q=s=>root.querySelector(s), video=q('.sj-video'), poster=q('.sj-poster'), controls=q('.sj-controls');
    if(!video||!poster||!controls)return;
    const backdrop=document.createElement('img');backdrop.className='sj-mobile-backdrop';backdrop.alt='';backdrop.setAttribute('aria-hidden','true');q('.sj-media').prepend(backdrop);
    const hold=document.createElement('canvas');hold.className='sj-frame-hold';hold.setAttribute('aria-hidden','true');q('.sj-media').append(hold);
    const thoughts=document.createElement('div');thoughts.className='sj-thoughts';thoughts.setAttribute('aria-hidden','true');['0101 · 0010','purpose','hidden talent','showcase your mind'].forEach(text=>{const word=document.createElement('span');word.textContent=text;thoughts.append(word)});for(let i=0;i<3;i++){const flow=document.createElement('b');flow.className='sj-binary-flow';flow.style.setProperty('--flow',i);const code=document.createElement('em');code.textContent='0101  0010  1101  0110  1010  0011';flow.append(code);thoughts.append(flow)}for(let i=0;i<10;i++){const dot=document.createElement('i');dot.style.setProperty('--i',i);thoughts.append(dot)}q('.sj-media').append(thoughts);
    const portal=document.createElement('div');portal.className='sj-transition-portal';portal.setAttribute('aria-hidden','true');q('.sj-media').append(portal);
    // Retain a decoded frame before changing src. Raising this layer must be
    // immediate; fading it in after unloading the video creates a visible blink.
    let retainedFrame=false,transitionTimer=0,preloadTimer=0,warmSrc='';
    const warmVideo=document.createElement('video');warmVideo.muted=true;warmVideo.playsInline=true;warmVideo.setAttribute('aria-hidden','true');
    function clearTransition(){clearTimeout(transitionTimer);delete root.dataset.transitioning;delete root.dataset.transitionPhase}
    function holdFrame(){
      clearTransition();
      if(video.readyState>=2&&video.videoWidth)try{hold.width=video.videoWidth;hold.height=video.videoHeight;hold.getContext('2d').drawImage(video,0,0);retainedFrame=true}catch{}
      if(!retainedFrame)return;
      hold.style.transition='none';hold.style.opacity='1';void hold.offsetWidth;
      if(!quiet){root.dataset.transitioning='true';root.dataset.transitionPhase='loading'}
    }
    function releaseFrame(){
      if(quiet){clearTransition();hold.style.transition='none';hold.style.opacity='0';return}
      const serial=mediaSerial;
      requestAnimationFrame(()=>{if(disposed||serial!==mediaSerial)return;hold.style.transition='';hold.style.opacity='0';if(root.dataset.transitioning==='true'){root.dataset.transitionPhase='reveal';clearTimeout(transitionTimer);transitionTimer=setTimeout(()=>{if(serial===mediaSerial)clearTransition()},820)}})
    }
    function clearWarmVideo(){clearTimeout(preloadTimer);warmSrc='';warmVideo.pause();warmVideo.removeAttribute('src');warmVideo.load()}
    function warmAdjacent(){
      clearTimeout(preloadTimer);
      if(quiet||document.hidden||navigator.connection?.saveData){clearWarmVideo();return}
      const next=scenes[index+1];
      if(!next?.video){clearWarmVideo();return}
      if(warmSrc===next.video)return;
      // One silent adjacent resource only. On phones metadata avoids eagerly
      // downloading or decoding several large scenes at the same time.
      const serial=mediaSerial;
      preloadTimer=setTimeout(()=>{if(disposed||quiet||document.hidden||serial!==mediaSerial)return;warmSrc=next.video;warmVideo.preload=innerWidth<=700?'metadata':'auto';warmVideo.src=warmSrc;warmVideo.load()},240)
    }
    const motionQuery=matchMedia('(prefers-reduced-motion: reduce)'), clean=[], controller=new AbortController();
    // The contributor-only notice is part of the sticky header so the journey
    // can account for its height on small screens without hiding the notice.
    const previewNotice=document.getElementById('dev-preview-notice');
    const siteHeader=document.querySelector('.sfi-header');
    if(previewNotice&&siteHeader&&!siteHeader.contains(previewNotice))siteHeader.prepend(previewNotice);
    let navHeight=0;
    function measureHeader(){const header=document.querySelector('.sfi-header');const position=header?getComputedStyle(header).position:'';navHeight=header&&['sticky','fixed'].includes(position)?Math.max(0,header.getBoundingClientRect().height):0;root.style.setProperty('--sj-nav-height',navHeight+'px')}
    measureHeader();
    let scenes=[],index=-1,fraction=0,raf=0,idle=0,lang=location.pathname.startsWith('/en')?'en':document.documentElement.lang.startsWith('zh')?'zh':'no',quiet=motionQuery.matches,manualQuiet=false,soundOn=false,ctx=null,gain=null,oscillators=[],disposed=false,mediaSerial=0,lastScroll=-1,artGrid=null,artDialog=null,artOpener=null,oldOverflow='';
    const on=(el,event,fn,opts)=>{el.addEventListener(event,fn,opts);clean.push(()=>el.removeEventListener(event,fn,opts))};
    const t=k=>TEXT[lang][k]||TEXT.no[k]||k;
    const save=pending=>{try{sessionStorage.setItem(KEY,JSON.stringify({scene:scenes[index]?.id,fraction,lang,pending,at:Date.now()}))}catch{}};
    let saved=null;try{saved=JSON.parse(sessionStorage.getItem(KEY));if(saved&&Date.now()-saved.at<3600000&&TEXT[saved.lang])lang=saved.lang}catch{}
    const requestedLang=new URLSearchParams(location.search).get('lang');if(requestedLang==='zh-Hans'||requestedLang==='zh')lang='zh';else if(requestedLang==='en'||requestedLang==='no')lang=requestedLang;else lang=location.pathname.startsWith('/en')?'en':'no';
    const title=s=>s.title?.[lang]||TITLES[s.id]?.[{no:0,en:1,zh:2}[lang]]||s.id;
    function artworkDetails(art){
      const fallback=(lang==='en'?'/en/creative-community/art/':'/kunstfellesskap/verk/')+art.id+'/';
      const candidate=art.details?.[lang==='en'?'en':'no'];
      if(typeof candidate!=='string'||!candidate.startsWith('/')||candidate.startsWith('//'))return fallback;
      try{const url=new URL(candidate,location.origin);return url.origin===location.origin?url.pathname+url.search+url.hash:fallback}catch{return fallback}
    }
    function setText(el,value){if(!el)return;el.replaceChildren();String(value).split('\n').forEach((line,i)=>{if(i)el.append(document.createElement('br'));el.append(document.createTextNode(line))})}
    function paintText(){
      root.lang=lang==='zh'?'zh-Hans':lang;
      for(const el of root.querySelectorAll('[data-sj-text]'))setText(el,t(el.dataset.sjText));
      for(const a of root.querySelectorAll('[data-sj-route]')){const key=a.dataset.sjRoute;a.href=(ROUTES[lang]||ROUTES.no)[key];a.textContent=t(key)}
      q('[data-sj-language]').value=lang;q('[data-sj-language]').setAttribute('aria-label',t('language'));
      q('[data-sj-prev]').setAttribute('aria-label',t('prev'));q('[data-sj-next]').setAttribute('aria-label',t('next'));
      q('[data-sj-motion]').disabled=motionQuery.matches;q('[data-sj-motion]').textContent=quiet?t('resume'):t('pause');q('[data-sj-motion]').setAttribute('aria-pressed',String(quiet));
      q('[data-sj-sound]').textContent=t(soundOn?'on':'off');q('[data-sj-sound]').setAttribute('aria-pressed',String(soundOn));
      if(quiet)q('.sj-hint').textContent=t('quiet');
      const scene=scenes[index];if(scene){q('.sj-scene-title').textContent=title(scene);if(scene.type==='art'){setText(q('h1'),t('artTitle'));setText(q('.sj-deck'),t('artDeck'))}else if(index>0){setText(q('h1'),title(scene));setText(q('.sj-deck'),scene.description?.[lang]||t('deck'))}}
      if(artGrid)for(const a of artGrid.querySelectorAll('a')){const art=a._art;a.href=artworkDetails(art);a.querySelector('strong').textContent=lang==='en'?art.en:art.no}
    }
    function silence(){soundOn=false;video.muted=true;if(gain&&ctx)gain.gain.setTargetAtTime(0,ctx.currentTime,.16);paintText()}
    async function toggleSound(){
      if(soundOn){silence();return}const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      try{if(!ctx){ctx=new Audio();gain=ctx.createGain();gain.gain.value=0;gain.connect(ctx.destination);[130.8128,196,261.6256].forEach((hz,i)=>{const osc=ctx.createOscillator(),voice=ctx.createGain();osc.type='sine';osc.frequency.value=hz;voice.gain.value=[.4,.18,.11][i];osc.connect(voice);voice.connect(gain);osc.start();oscillators.push(osc)})}await ctx.resume();if(disposed||document.hidden)return;soundOn=true;video.muted=false;video.volume=.45;gain.gain.setTargetAtTime(scenes[index]?.mode==='play'?.018:.045,ctx.currentTime,1.1);ambient();paintText()}catch{silence()}
    }
    function ambient(){if(!ctx||!soundOn)return;const notes=[130.8128,146.8324,164.8138,146.8324,196,174.6141];const note=notes[Math.max(0,index)%notes.length];gain.gain.setTargetAtTime(scenes[index]?.mode==='play'?.018:.045,ctx.currentTime,.6);oscillators.forEach((osc,i)=>osc.frequency.setTargetAtTime(note*[1,1.5,2][i],ctx.currentTime,1.8));if(['brains','impulses','vortex','dna'].includes(scenes[index]?.id)){[0.5,2.1,4.3].forEach((delay,i)=>{const pulse=ctx.createOscillator(),envelope=ctx.createGain(),at=ctx.currentTime+delay;pulse.type='sine';pulse.frequency.value=note*[4,3,6][i];envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(.08,at+.13);envelope.gain.exponentialRampToValueAtTime(.0001,at+1.6);pulse.connect(envelope);envelope.connect(gain);pulse.start(at);pulse.stop(at+1.7)})}}
    function settleEntrances(){
      const active=!quiet&&['impulses','vortex'].includes(scenes[index]?.id);root.style.setProperty('--sj-phase',fraction);
      root.dataset.dissolving=String(active&&scenes[index]?.id==='vortex'&&fraction>.78);
      [...root.querySelectorAll('.sj-entrances a')].forEach((a,i)=>{
        const reveal=active?clamp((fraction-(.04+i*.13))/.08,0,1):1;
        const dissolve=active&&scenes[index]?.id==='vortex'?clamp((fraction-.78)/.2,0,1):0;
        const opacity=reveal*(1-dissolve),available=opacity>.96;
        a.style.opacity=String(opacity);a.style.transform=active?'translate3d('+(dissolve*(i-1.5)*45)+'px,'+((1-reveal)*15-dissolve*25)+'px,0) scale('+(1-dissolve*.08)+')':'';
        a.style.pointerEvents=available?'':'none';a.tabIndex=available?0:-1;
        if(available)a.removeAttribute('aria-hidden');else a.setAttribute('aria-hidden','true');
      });
    }
    function seek(){if(quiet||disposed||scenes[index]?.mode!=='scrub'||!Number.isFinite(video.duration)||video.duration<=0)return;const wanted=clamp(fraction*video.duration,0,video.duration-.05);if(!video.seeking&&Math.abs(video.currentTime-wanted)>.08)try{video.currentTime=wanted}catch{}}
    function canPlay(){const rect=root.getBoundingClientRect();return !disposed&&!quiet&&!document.hidden&&!artDialog?.open&&scenes[index]?.type!=='art'&&!!scenes[index]?.video&&rect.bottom>navHeight&&rect.top<innerHeight}
    function playRemainder(){if(canPlay())video.play().catch(()=>{})}
    function openArt(art,opener){
      if(typeof HTMLDialogElement==='undefined')return false;
      clearTimeout(idle);silence();video.pause();artOpener=opener;
      artDialog?.remove();artDialog=document.createElement('dialog');artDialog.className='sj-art-dialog';artDialog.setAttribute('aria-labelledby','sj-art-dialog-title');
      const head=document.createElement('header'),name=document.createElement('h2'),close=document.createElement('button');name.id='sj-art-dialog-title';name.textContent=lang==='en'?art.en:art.no;close.type='button';close.textContent='×';close.setAttribute('aria-label',lang==='en'?'Close':lang==='zh'?'关闭':'Lukk');head.append(name,close);
      const viewport=document.createElement('div');viewport.className='sj-art-viewport';const img=document.createElement('img');img.src=art.src;img.alt=lang==='en'?art.en:art.no;viewport.append(img);
      const foot=document.createElement('footer'),by=document.createElement('span'),zoom=document.createElement('button'),share=document.createElement('button'),clothing=document.createElement('a'),status=document.createElement('p');by.textContent=art.artistName||'Innsatt 2601-46';zoom.type=share.type='button';zoom.textContent=lang==='zh'?'缩放':'Zoom';zoom.setAttribute('aria-pressed','false');share.textContent=lang==='en'?'Share artwork':lang==='zh'?'分享作品':'Del verket';clothing.textContent=lang==='en'?'See clothing preview ↗':lang==='zh'?'查看服装预览 ↗':'Se klesforhåndsvisning ↗';clothing.href=(lang==='en'?'/en/shop/':'/butikk/')+'?art='+encodeURIComponent(art.id);status.setAttribute('role','status');
      const info=document.createElement('a');info.textContent=lang==='en'?'About the artwork ↗':lang==='zh'?'作品详情 ↗':'Om verket ↗';info.href=artworkDetails(art);foot.append(by,zoom,share,info,clothing);artDialog.append(head,viewport,foot,status);document.body.append(artDialog);
      const restore=()=>{document.body.style.overflow=oldOverflow;artOpener?.focus({preventScroll:true});artDialog?.remove();artDialog=null};
      close.addEventListener('click',()=>artDialog?.close());artDialog.addEventListener('close',restore,{once:true});artDialog.addEventListener('click',e=>{if(e.target===artDialog){const r=artDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)artDialog.close()}});
      zoom.addEventListener('click',()=>{const active=viewport.classList.toggle('is-zoomed');zoom.setAttribute('aria-pressed',String(active))});
      share.addEventListener('click',async()=>{const url=new URL(artworkDetails(art),location.origin).href;try{if(navigator.share)await navigator.share({title:name.textContent,url});else if(navigator.clipboard){await navigator.clipboard.writeText(url);status.textContent=lang==='en'?'Link copied':lang==='zh'?'链接已复制':'Lenken er kopiert'}else status.textContent=url}catch(error){if(error.name!=='AbortError')status.textContent=url}});
      oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';artDialog.showModal();close.focus();return true;
    }
    function showArt(scene){
      artGrid?.remove();artGrid=null;
      if(scene.type!=='art'&&!scene.artworks?.length)return;
      const works=scene.artworks||window.SFIFeaturedArt?.slice(0,3)||[];
      artGrid=document.createElement('div');artGrid.className='sj-art-grid';artGrid.setAttribute('aria-label',lang==='en'?'Selected artworks':'Utvalgte kunstverk');
      for(const art of works){const a=document.createElement('a');a._art=art;const frame=document.createElement('span');frame.className='sj-art-frame';const img=document.createElement('img');img.src=art.src;img.alt=art.no;img.loading='lazy';img.width=600;img.height=800;const name=document.createElement('strong'),by=document.createElement('small');by.textContent=art.artistName||'Innsatt 2601-46';frame.append(img);a.append(frame,name,by);artGrid.append(a)}
      q('.sj-copy').append(artGrid);
    }
    function show(next){
      if(!scenes[next])return;holdFrame();clearTimeout(preloadTimer);index=next;const scene=scenes[index];mediaSerial++;root.dataset.scene=scene.id;root.dataset.sceneType=scene.type||'video';root.dataset.scrub=String(scene.mode==='scrub');root.dataset.framing=scene.type==='art'?'contain':'cover';root.style.setProperty('--sj-focus-x',(Number.isFinite(scene.focusX)?clamp(scene.focusX,0,100):50)+'%');root.style.setProperty('--sj-focus-y',(Number.isFinite(scene.focusY)?clamp(scene.focusY,0,100):50)+'%');root.dataset.video='loading';video.pause();video.removeAttribute('src');video.load();
      poster.src=scene.poster||'/assets/journey/galaxy.webp';backdrop.src=poster.src;q('.sj-count').textContent=String(index+1).padStart(2,'0')+' / '+String(scenes.length).padStart(2,'0');q('[data-sj-prev]').disabled=index===0;q('[data-sj-next]').disabled=index===scenes.length-1;
      showArt(scene);settleEntrances();if(scene.type==='art'||quiet)releaseFrame();paintText();ambient();q('[data-sj-status]').textContent=title(scene);
      if(!quiet&&scene.type!=='art'&&scene.video){video.src=scene.video;video.muted=!soundOn;video.volume=.45;video.load()}
      clearTimeout(idle);idle=setTimeout(playRemainder,450);save(false);
    }
    function render(){
      raf=0;if(disposed||!scenes.length)return;
      if(quiet){root.style.setProperty('--sj-progress',(index+1)/scenes.length);settleEntrances();return}
      const rect=root.getBoundingClientRect(),distance=Math.max(1,root.offsetHeight-(innerHeight-navHeight)),progress=clamp((navHeight-rect.top)/distance,0,.999999)*scenes.length;
      const next=Math.floor(progress);fraction=progress-next;root.style.setProperty('--sj-progress',progress/scenes.length);
      if(next!==index)show(next);else if(lastScroll!==scrollY){if(scenes[index]?.mode==='scrub'){video.pause();seek()}else playRemainder();clearTimeout(idle);idle=setTimeout(playRemainder,140)}
      settleEntrances();lastScroll=scrollY;
      if(rect.bottom<0||rect.top>innerHeight){video.pause();if(soundOn)silence()}
    }
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(render)};
    function go(next){next=clamp(next,0,scenes.length-1);fraction=0;if(quiet){show(next);schedule();return}const y=root.getBoundingClientRect().top+scrollY-navHeight+next/scenes.length*Math.max(1,root.offsetHeight-(innerHeight-navHeight))+2;scrollTo({top:y,behavior:'instant'});schedule()}
    function setQuiet(){const was=quiet;const anchor=root.getBoundingClientRect().top+scrollY-navHeight;quiet=manualQuiet||motionQuery.matches;root.dataset.quiet=String(quiet);video.pause();clearWarmVideo();clearTransition();if(quiet){video.removeAttribute('src');video.load();root.dataset.video='loading';scrollTo({top:anchor,behavior:'instant'})}else if(was&&index>=0){const savedFraction=fraction;show(index);scrollTo({top:anchor+(index+savedFraction)/scenes.length*Math.max(1,root.offsetHeight-(innerHeight-navHeight)),behavior:'instant'})}paintText();schedule()}
    on(window,'scroll',schedule,{passive:true});on(window,'resize',()=>{measureHeader();schedule()});on(video,'loadedmetadata',()=>{seek();if(quiet)video.pause()});on(video,'loadeddata',()=>{if(!quiet&&video.readyState>=2){seek();if(!video.seeking){root.dataset.video='ready';releaseFrame();warmAdjacent();playRemainder()}}});on(video,'seeked',()=>{if(!quiet&&video.readyState>=2){if(scenes[index]?.mode==='scrub')seek();if(!video.seeking){root.dataset.video='ready';releaseFrame();warmAdjacent();playRemainder()}}});
    on(video,'error',()=>{root.dataset.video='loading';releaseFrame();clearWarmVideo();q('[data-sj-status]').textContent=t('unavailable')});
    on(video,'ended',()=>{const scene=scenes[index];if(canPlay()&&Number.isFinite(scene.loopStart)&&scene.loopStart<video.duration){video.currentTime=Math.max(0,scene.loopStart);video.play().catch(()=>{})}});
    on(q('[data-sj-prev]'),'click',()=>go(index-1));on(q('[data-sj-next]'),'click',()=>go(index+1));on(q('[data-sj-motion]'),'click',()=>{manualQuiet=!quiet;setQuiet()});on(motionQuery,'change',setQuiet);on(q('[data-sj-sound]'),'click',toggleSound);on(q('[data-sj-language]'),'change',e=>{lang=e.target.value;paintText();save(true);silence();const destination=lang==='en'?'/en/':lang==='zh'?'/?lang=zh-Hans':'/';location.assign(destination)});
    on(root,'keydown',e=>{if(e.target.closest('input,select,textarea'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(index+(e.key==='ArrowRight'?1:-1))}});
    on(root,'click',e=>{const artwork=e.target.closest('a');if(artwork?._art&&openArt(artwork._art,artwork)){e.preventDefault();return}if(e.target.closest('a')){save(true);silence()}});on(window,'pagehide',()=>{save(true);silence()});on(window,'pageshow',()=>{silence();schedule()});on(document,'visibilitychange',()=>{if(document.hidden){video.pause();clearWarmVideo();silence()}});
    dispose=()=>{disposed=true;controller.abort();clean.forEach(f=>f());cancelAnimationFrame(raf);clearTimeout(idle);clearWarmVideo();clearTransition();video.pause();video.removeAttribute('src');video.load();oscillators.forEach(o=>{try{o.stop()}catch{}});ctx?.close().catch(()=>{});artGrid?.remove();if(artDialog){artDialog.close();artDialog?.remove();document.body.style.overflow=oldOverflow}hold.remove();portal.remove();backdrop.remove();thoughts.remove();root.querySelectorAll('.sj-entrances a').forEach(a=>{a.style.opacity='';a.style.transform='';a.style.pointerEvents='';a.tabIndex=0;a.removeAttribute('aria-hidden')});root.removeAttribute('data-enhanced');root.removeAttribute('data-video');root.removeAttribute('data-quiet');root.removeAttribute('data-scrub');controls.hidden=true};
    paintText();
    fetch(root.dataset.manifest||'/assets/journey/manifest.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('manifest');return r.json()}).then(data=>{
      if(disposed)return;scenes=(data.scenes||[]).filter(s=>s.enabled===true&&typeof s.id==='string'&&(s.type==='art'||(typeof s.video==='string'&&s.video.startsWith('/assets/journey/'))));if(!scenes.length)return;
      root.style.setProperty('--sj-scenes',scenes.length);root.dataset.enhanced='true';root.dataset.quiet=String(quiet);controls.hidden=false;
      let start=saved?.pending?scenes.findIndex(s=>s.id===saved.scene):0;start=Math.max(0,start);fraction=saved?.pending?clamp(Number(saved.fraction)||0,0,.99):0;show(start);
      if(saved?.pending&&!location.hash&&!quiet){const f=fraction;requestAnimationFrame(()=>{if(disposed)return;scrollTo({top:root.getBoundingClientRect().top+scrollY-navHeight+(start+f)/scenes.length*Math.max(1,root.offsetHeight-(innerHeight-navHeight)),behavior:'instant'});schedule()})}else schedule();
    }).catch(()=>{if(!disposed)q('[data-sj-status]').textContent=t('unavailable')});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  for(const event of ['routechange','premium:routechange'])window.addEventListener(event,init);
  window.StemmenJourney={init,destroy:()=>dispose()};
})();
