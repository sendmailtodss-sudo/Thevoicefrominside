/* Stemmen's cinematic opening. No remote services, tracking or automatic audio. */
(() => {
  'use strict';
  const KEY='stemmen-journey-v1';
  const TEXT={
    no:{eyebrow:'KUNST · FORTELLINGER · FORANDRING',title:'Mange tanker.\nÉn bevegelse.',deck:'En reise fra det vi bærer alene, til det vi kan skape sammen.',skip:'Gå rett til innholdet ↗',hint:'Skroll nedover for å gå fremover og oppover for å gå tilbake.',language:'Språk i reisen',prev:'Forrige scene',next:'Neste scene',pause:'Pause',resume:'Bevegelse på',off:'Lyd av',on:'Lyd på',quiet:'Velg en scene med pilene, eller gå rett til innholdet.',loading:'Laster scenen …',unavailable:'Filmen kunne ikke lastes. Du kan fortsette med bildene og lenkene.',artTitle:'Gi uttrykket\net sted å leve.',artDeck:'Kunsten er her. Velg et verk, se nærmere, eller finn din egen måte å bidra på.',gallery:'Gå inn i kunstrommet / VR ↗',contribute:'Hva er ditt uttrykk? ↗',justice:'Rettspeil',lar:'LAR',diary:'Dagbok',art:'Kunstfellesskapet'},
    en:{eyebrow:'ART · STORIES · CHANGE',title:'Many minds.\nOne movement.',deck:'A journey from what we carry alone to what we can create together.',skip:'Go straight to the content ↗',hint:'Scroll down to move forward and up to go back.',language:'Journey language',prev:'Previous scene',next:'Next scene',pause:'Pause',resume:'Motion on',off:'Sound off',on:'Sound on',quiet:'Choose a scene with the arrows, or go straight to the content.',loading:'Loading the scene …',unavailable:'The film could not load. You can continue with the images and links.',artTitle:'Give expression\na place to live.',artDeck:'The art is here. Choose a work, look closer, or find your own way to contribute.',gallery:'Enter the art room / VR ↗',contribute:'What is your expression? ↗',justice:'Justice Mirror',lar:'LAR',diary:'Diary',art:'Creative community'},
    zh:{eyebrow:'艺术 · 故事 · 改变',title:'万千思想。\n汇成一股力量。',deck:'从独自承受的经历，走向共同创造的可能。',skip:'直接浏览内容 ↗',hint:'向下滚动前进，向上滚动返回。',language:'旅程语言',prev:'上一幕',next:'下一幕',pause:'暂停',resume:'开启动画',off:'声音关闭',on:'声音开启',quiet:'使用箭头选择场景，或直接浏览内容。',loading:'正在加载场景…',unavailable:'视频暂时无法加载。您仍可查看图片并使用链接。',artTitle:'让表达\n拥有一席之地。',artDeck:'作品就在这里。选择一幅作品，细细观看，或寻找自己的参与方式。',gallery:'进入艺术展厅 / VR ↗',contribute:'你想如何表达？↗',justice:'司法之镜',lar:'LAR',diary:'狱中日记',art:'艺术社区'}
  };
  const INTRO_TEXT={"no": "Skroll og se hvordan kreativitet kan åpne nye veier.", "en": "Scroll to see how creativity can open new paths.", "zh": "向下滚动，看看创造力能带来哪些新的可能。"};
  const EXPRESSION_TEXT={"no": ["Skjult talent", "Skaperkraft", "En ny retning", "Fra tanke til uttrykk", "Gi talentet en stemme", "Mestring", "Tilhørighet", "Muligheter innenfor murene", "En fremtid utenfor", "Sammen skaper vi muligheter", "Bryt mønstre. Skap nye spor."], "en": ["Hidden talent", "Creative energy", "A new direction", "From thought to expression", "Give talent a voice", "A sense of achievement", "Belonging", "Possibilities within the walls", "A future beyond the walls", "Together, we create possibilities", "Break patterns. Create new paths."], "zh": ["潜藏的才华", "创造力", "新的方向", "从想法到表达", "让才华发声", "成就感", "归属感", "高墙内的可能", "高墙之外的未来", "携手创造可能", "打破旧模式，开辟新道路。"]};
  const TITLES={galaxy:['Melkeveien','The Milky Way','银河'],brains:['Et univers av tanker','A universe of minds','思想的宇宙'],impulses:['Når tanker møtes','When minds meet','当思想相遇'],vortex:['En idé finner en annen','One idea finds another','一个想法遇见另一个'],supernova:['Noe nytt blir til','Something new begins','新的可能诞生'],dna:['En tråd gjennom oss alle','A thread through us all','贯穿我们的丝线'],painter:['Maleren','The painter','画家'],poet:['Poeten','The poet','诗人'],rapper:['Rapperen','The rapper','说唱歌手'],metal:['Skrapmetallkunstneren','The metal sculptor','金属雕塑家'],ai:['AI-kunstneren','The AI artist','人工智能艺术创作者'],streetart:['Gatekunstnerne','The street artists','街头艺术家'],filmmaker:['Filmskaperen','The filmmaker','电影创作者'],gallery:['Kunsten møtes','The art comes together','艺术在此相聚'],bergen:['Bergen','Bergen','卑尔根'],paris:['Paris','Paris','巴黎'],'new-york':['New York','New York','纽约'],interior:['Kunsten i rommet','Art in the room','生活中的艺术'],stencil:['Sjablongen','The stencil','模板艺术'],'red-riding-hood':['Rødhette','Little Red Riding Hood','小红帽']};
  const ROUTES={no:{justice:'/rettsspeil/',lar:'/dagbok/lar-bak-murene/',diary:'/dagbok/',art:'/kunstfellesskap/',contribute:'/collaborate/'},en:{justice:'/en/rettsspeil/',lar:'/en/dagbok/lar-bak-murene/',diary:'/en/dagbok/',art:'/en/creative-community/',contribute:'/en/collaborate/'}};
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  let dispose=()=>{};
  let initSerial=0;
  async function init(){
    dispose();
    const serial=++initSerial;
    let timeline,frames;try{[timeline,frames]=await Promise.all([import('/assets/journey/timeline.mjs'),import('/assets/journey/frame-runtime.mjs')])}catch{return}
    if(serial!==initSerial)return;
    const root=document.querySelector('[data-journey]');if(!root)return;
    const q=s=>root.querySelector(s), video=q('.sj-video'), poster=q('.sj-poster'), controls=q('.sj-controls');
    if(!video||!poster||!controls)return;
    // Duplicate journey entry links belong to a bottom dock, never over the
    // middle of the presentation. Preserve their DOM homes for clean re-init.
    const dock=document.createElement('div');dock.className='sj-dock';
    const moved=[...root.querySelectorAll('.sj-brand,.sj-skip,.sj-entrances,.sj-invitation')].map(node=>({node,parent:node.parentNode,next:node.nextSibling}));
    moved.forEach(({node})=>dock.append(node));q('.sj-bottom').append(dock);
    // The independent, opt-in film player injects its launch link later.
    // Adopt that same bound node; do not create a duplicate player or listener.
    const filmDock=document.createElement('div');filmDock.className='sj-film-dock';dock.append(filmDock);
    const dockObserver=new MutationObserver(()=>{
      if(root.dataset.scene!=='gallery'){filmDock.replaceChildren();return}
      const fresh=q('.sj-copy .sj-film-launch'),existing=filmDock.querySelector('.sj-film-launch');
      if(fresh&&existing){existing.textContent=fresh.textContent;existing.lang=fresh.lang;fresh.remove()}
      else if(fresh)filmDock.append(fresh);
    });
    dockObserver.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['data-scene','lang']});
    const bottomObserver=typeof ResizeObserver==='function'?new ResizeObserver(()=>root.style.setProperty('--sj-bottom-height',q('.sj-bottom').getBoundingClientRect().height+'px')):null;
    bottomObserver?.observe(q('.sj-bottom'));
    const backdrop=document.createElement('img');backdrop.className='sj-mobile-backdrop';backdrop.alt='';backdrop.setAttribute('aria-hidden','true');q('.sj-media').prepend(backdrop);
    const scratch=document.createElement('canvas');
    const hold=document.createElement('canvas');hold.className='sj-frame-hold';hold.setAttribute('aria-hidden','true');q('.sj-media').append(hold);
    const thoughts=document.createElement('div');thoughts.className='sj-thoughts';thoughts.setAttribute('aria-hidden','true');EXPRESSION_TEXT.no.forEach((text,i)=>{const word=document.createElement('span');word.dataset.expression=String(i);word.textContent=text;thoughts.append(word)});for(let i=0;i<3;i++){const flow=document.createElement('b');flow.className='sj-binary-flow';flow.style.setProperty('--flow',i);const code=document.createElement('em');code.textContent='0101  0010  1101  0110  1010  0011';flow.append(code);thoughts.append(flow)}for(let i=0;i<10;i++){const dot=document.createElement('i');dot.style.setProperty('--i',i);thoughts.append(dot)}q('.sj-media').append(thoughts);
    const origin=document.createElement('div');origin.className='sj-origin';origin.setAttribute('aria-hidden','true');q('.sj-media').append(origin);
    const invitation=document.createElement('p');invitation.className='sj-start-invitation';q('.sj-stage').append(invitation);
    const portal=document.createElement('div');portal.className='sj-transition-portal';portal.setAttribute('aria-hidden','true');q('.sj-media').append(portal);
    // Two paused decoders supply immutable samples. Source callbacks may
    // publish the latest requested complete composition once; never playback.
    const peer=document.createElement('video');peer.className='sj-video-peer';peer.muted=true;peer.playsInline=true;peer.setAttribute('aria-hidden','true');q('.sj-media').append(peer);
    const cache=new frames.FrameCache(),presentation=new frames.PresentationGate();
    const originalVideoDisplay=video.style.display;video.style.display=peer.style.display='block';
    const buffers=[video,peer].map(element=>({element,sceneIndex:-1,source:'',fraction:0,needed:false,failed:false,version:0,listeners:[],poster:new Image(),posterReady:false,decode:null,frameCallback:null,seekSerial:0}));
    let retainedFrame=false,view=null,presentedProgress=0,direction=1,requestEpoch=0,requestKey='';
    function clearTransition(){delete root.dataset.transitioning;delete root.dataset.transitionPhase;delete root.dataset.looping}
    function pauseMedia(){for(const slot of buffers)slot.element.pause()}
    function cancelFrame(slot){if(slot.frameCallback!==null)slot.element.cancelVideoFrameCallback?.(slot.frameCallback);slot.frameCallback=null}
    function clearBuffer(slot){
      slot.version++;slot.seekSerial++;cancelFrame(slot);slot.element.pause();slot.listeners.forEach(([name,fn])=>slot.element.removeEventListener(name,fn));slot.listeners=[];
      slot.poster.onload=slot.poster.onerror=null;slot.poster.removeAttribute('src');slot.posterReady=false;
      slot.element.removeAttribute('src');slot.element.load();slot.element.removeAttribute('data-sj-scene');slot.element.removeAttribute('data-sj-needed');slot.element.removeAttribute('data-sj-frame-target');slot.element.removeAttribute('data-sj-decode-target');
      slot.source='';slot.sceneIndex=-1;slot.needed=false;slot.failed=false;slot.decode=null;
    }
    function clearMedia(){buffers.forEach(clearBuffer)}
    function holdFrame(){pauseMedia();hold.style.opacity=retainedFrame?'1':'0'}
    function releaseFrame(){if(quiet||scenes[index]?.type==='point'||scenes[index]?.type==='art'){hold.style.opacity='0';root.dataset.compositor='false';root.dataset.pending='false';retainedFrame=false;view=null;presentedProgress=globalProgress}commitScene()}
    function requestedFrame(slot){const scene=scenes[slot.sceneIndex];return frames.frameRequest(slot.fraction,scene?.duration||slot.element.duration,scene)}
    function sampleFor(slot){const request=requestedFrame(slot);return request?cache.get(frames.frameKey(slot.source,request)):null}
    function drawComposite(input=false){
      if(!view||!canSeek()||!presentation.canPresent(requestEpoch,requestKey,input))return;
      const network=timeline.networkProgress(view.index,view.fraction,scenes),spatialState=spatial?.debug().state;
      if(network!==null&&root.dataset.spatialThoughts!=='fallback'&&!['ready','fallback','context-lost'].includes(spatialState)){root.dataset.pending='true';return}
      const layers=[view.left,view.right].filter(layer=>layer&&layer.opacity>1e-8);
      const inputs=layers.map(layer=>{
        const slot=buffers.find(item=>item.needed&&item.sceneIndex===layer.index);if(!slot)return null;
        const sample=sampleFor(slot),source=sample?.source||(slot.failed&&slot.posterReady?slot.poster:null);
        return source?{layer,slot,source,sample}:null;
      });
      if(inputs.some(input=>!input)||!inputs.length){root.dataset.pending='true';return}
      const rect=q('.sj-media').getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(2073600/Math.max(1,rect.width*rect.height)));
      const width=Math.max(1,Math.round(rect.width*ratio)),height=Math.max(1,Math.round(rect.height*ratio));
      const context=scratch.getContext('2d',{alpha:false});if(!context)return;
      if(scratch.width!==width||scratch.height!==height){scratch.width=width;scratch.height=height}
      const sourceCrops=[];
      const draw=input=>{
        const {slot,source}=input,scene=scenes[slot.sceneIndex],sw=source.width||source.naturalWidth,sh=source.height||source.naturalHeight;
        const focus=timeline.focusFor(scene,width,height);
        const crop=timeline.coverRect(sw,sh,width,height,focus.x,focus.y);if(!crop)throw Error('undecoded source');
        sourceCrops.push({...crop,sourceWidth:sw,sourceHeight:sh});
        context.drawImage(source,crop.x,crop.y,crop.width,crop.height,0,0,width,height);
      };
      try{
        context.globalAlpha=1;draw(inputs[0]);
        if(inputs[1]){
          context.save();
          if(view.treatment==='aperture'){
            // A depth opening replaces pixels under an expanding aperture;
            // the outgoing plate always covers the rest of the viewport.
            const x=width*(view.centerX??.5),y=height*(view.centerY??.46),radius=Math.hypot(Math.max(x,width-x),Math.max(y,height-y))*view.mix;
            context.beginPath();context.arc(x,y,radius,0,Math.PI*2);context.clip();draw(inputs[1]);
          }else{context.globalAlpha=view.mix;draw(inputs[1])}
          context.restore();
        }
        context.globalAlpha=1;
        if(!presentation.accepts(requestEpoch,requestKey))return;
        // Resize and publish only after every input drew successfully.
        if(hold.width!==width||hold.height!==height){hold.width=width;hold.height=height}
        hold.getContext('2d',{alpha:false}).drawImage(scratch,0,0);retainedFrame=true;presentedProgress=view.progress;hold.style.opacity='1';root.dataset.compositor='true';root.dataset.video=inputs.some(input=>input.slot.failed)?'unavailable':'ready';root.dataset.pending='false';
        root.dataset.blend=String(view.mix);root.dataset.frameScenes=layers.map(layer=>scenes[layer.index].id).join(' ');
        root.dataset.frameFractions=layers.map(layer=>layer.fraction.toFixed(6)).join(' ');
        root.dataset.frameIndices=inputs.map(input=>input.sample?(input.sample.request.index??'unindexed'):'poster').join(' ');root.dataset.frameEvidence=inputs.map(input=>input.sample?.evidence??'poster').join(' ');root.dataset.frameMediaTimes=inputs.map(input=>input.sample?.mediaTime??'unverified').join(' ');
        root.dataset.frameSourceCrops=JSON.stringify(sourceCrops);
        root.dataset.presentedProgress=String(presentedProgress);root.dataset.presentedEpoch=String(requestEpoch);
        root.dataset.transitioning=String(Boolean(view.right));presentation.presented(requestEpoch);commitScene();settleEntrances();paintPhase();
        if(inputs.some(input=>input.slot.failed))q('[data-sj-status]').textContent=t('unavailable');
      }catch{context.globalAlpha=1}
    }
    function capture(slot,decode,mediaTime,evidence){
      const el=slot.element;
      if(disposed||!decode||slot.decode!==decode||slot.version!==decode.version||slot.seekSerial!==decode.serial||el.readyState<2||!el.videoWidth||el.currentSrc!==new URL(slot.source,location.href).href)return false;
      if(mediaTime!==null&&!frames.matchesFrame(decode.request,mediaTime))return false;
      const sample=document.createElement('canvas'),scale=Math.min(1,1280/el.videoWidth,1280/el.videoHeight);
      sample.width=Math.max(1,Math.round(el.videoWidth*scale));sample.height=Math.max(1,Math.round(el.videoHeight*scale));
      try{sample.getContext('2d',{alpha:false}).drawImage(el,0,0,sample.width,sample.height)}catch{return false}
      cache.set(frames.frameKey(slot.source,decode.request),{source:sample,width:sample.width,height:sample.height,request:decode.request,mediaTime,evidence});
      slot.decode=null;slot.element.dataset.sjDecodeTarget='';root.dataset.frameCachePixels=String(cache.pixels);root.dataset.frameCacheEntries=String(cache.entries.size);drawComposite();pump(slot);return true;
    }
    function awaitFrame(slot,decode){
      if(typeof slot.element.requestVideoFrameCallback!=='function')return;
      cancelFrame(slot);
      slot.frameCallback=slot.element.requestVideoFrameCallback((now,metadata)=>{
        slot.frameCallback=null;
        if(disposed||slot.decode!==decode||slot.version!==decode.version||slot.seekSerial!==decode.serial)return;
        if(frames.matchesFrame(decode.request,metadata.mediaTime))decode.reportedTime=metadata.mediaTime;
        if(!capture(slot,decode,metadata.mediaTime,'video-frame-callback'))awaitFrame(slot,decode);
      });
    }
    function pump(slot){
      const el=slot.element;el.pause();
      if(!slot.source||slot.failed||disposed||quiet||document.hidden||el.readyState<1||!Number.isFinite(el.duration)||el.duration<=0)return;
      const request=requestedFrame(slot);if(!request)return;el.dataset.sjFrameTarget=String(request.index??request.time);el.dataset.sjDecodeTarget=slot.decode?String(slot.decode.request.index??slot.decode.request.time):'';
      if(cache.get(frames.frameKey(slot.source,request))){if(slot.needed)drawComposite();return}
      // Coalesce a seek in flight. Its immutable sample can be cached, but only
      // the latest requested composition can ever consume it.
      if(slot.decode||el.seeking)return;
      const decode={request,version:slot.version,serial:++slot.seekSerial};slot.decode=decode;awaitFrame(slot,decode);
      try{
        if(el.readyState>=2&&Math.abs(el.currentTime-request.seekTime)<1e-7){
          // A same-time assignment may not produce a new frame callback.
          // This branch has a real decoded picture but no PTS oracle.
          cancelFrame(slot);capture(slot,decode,null,'decoded-current-frame');
        }else el.currentTime=request.seekTime;
      }catch{slot.decode=null;cancelFrame(slot)}
    }
    function configure(slot,sceneIndex,f,needed){
      const scene=scenes[sceneIndex],source=scene?.video;if(!source)return;
      slot.fraction=f;slot.needed=needed;slot.element.dataset.sjNeeded=String(needed);
      if(slot.sceneIndex===sceneIndex&&slot.source===source){slot.element.preload=needed?'auto':'metadata';pump(slot);return}
      clearBuffer(slot);slot.sceneIndex=sceneIndex;slot.source=source;slot.fraction=f;slot.needed=needed;slot.element.dataset.sjScene=scene.id;slot.element.dataset.sjNeeded=String(needed);
      const version=slot.version,relevant=()=>!disposed&&slot.version===version&&slot.source===source;
      const ready=event=>{
        if(!relevant())return;
        if(event.type==='seeked'&&slot.decode&&!slot.element.seeking){
          const decode=slot.decode;
          if(Number.isFinite(decode.reportedTime)){cancelFrame(slot);capture(slot,decode,decode.reportedTime,'video-frame-callback+seeked')}
          else if(typeof slot.element.requestVideoFrameCallback!=='function'&&Math.abs(slot.element.currentTime-decode.request.seekTime)<.0011)capture(slot,decode,null,'seeked-fallback');
        }
        pump(slot);
      };
      const failed=()=>{if(!relevant()||!slot.element.error)return;slot.failed=true;slot.decode=null;cancelFrame(slot);slot.element.pause();if(slot.needed){drawComposite();q('[data-sj-status]').textContent=t('unavailable')}};
      for(const [name,fn] of [['loadedmetadata',ready],['loadeddata',ready],['seeked',ready],['error',failed],['ended',()=>slot.element.pause()]]){slot.element.addEventListener(name,fn);slot.listeners.push([name,fn])}
      slot.poster.onload=()=>{if(relevant()&&slot.poster.currentSrc===new URL(scene.poster||'/assets/journey/galaxy.webp',location.href).href&&slot.poster.naturalWidth){slot.posterReady=true;if(slot.failed)drawComposite()}};slot.poster.onerror=()=>{if(relevant())slot.posterReady=false};
      slot.poster.src=scene.poster||'/assets/journey/galaxy.webp';slot.element.preload=needed?'auto':'metadata';slot.element.muted=!soundOn;slot.element.volume=.45;slot.element.src=source;slot.element.load();
    }
    function warmAdjacent(){
      if(quiet||document.hidden||navigator.connection?.saveData)return;
      const next=index+1;if(!scenes[next]?.video)return;
      const slot=buffers.find(item=>!item.needed);if(slot)configure(slot,next,0,false);
    }
    function updateMedia(){
      if(!canSeek())return;
      view=timeline.transition(globalProgress,scenes);
      const rect=q('.sj-media').getBoundingClientRect();
      const key=[view.progress,lang,rect.width,rect.height,...[view.left,view.right].filter(Boolean).map(layer=>scenes[layer.index].video)].join('|');
      if(key!==requestKey){requestKey=key;requestEpoch=presentation.request(key,{readiness:true});root.dataset.requestedEpoch=String(requestEpoch);root.dataset.requestedProgress=String(globalProgress);root.dataset.pending='true'}
      const wanted=[view.left,view.right].filter(layer=>layer&&layer.opacity>1e-8),used=new Set(),assigned=[];
      for(const layer of wanted){const slot=buffers.find(item=>!used.has(item)&&item.sceneIndex===layer.index&&item.source===scenes[layer.index]?.video);if(slot){used.add(slot);assigned.push([slot,layer])}}
      for(const layer of wanted){if(assigned.some(([,item])=>item===layer))continue;const slot=buffers.find(item=>!used.has(item));used.add(slot);assigned.push([slot,layer])}
      buffers.forEach(slot=>slot.needed=false);
      for(const [slot,layer] of assigned)configure(slot,layer.index,layer.fraction,true);
      const free=buffers.find(slot=>!used.has(slot));
      if(free){const next=index+direction;if(!navigator.connection?.saveData&&scenes[next]?.video)configure(free,next,direction<0?1:0,false);else if(free.source)clearBuffer(free)}
      drawComposite(true);
    }
    const motionQuery=matchMedia('(prefers-reduced-motion: reduce)'), clean=[], controller=new AbortController();
    // The contributor-only notice is part of the sticky header so the journey
    // can account for its height on small screens without hiding the notice.
    const previewNotice=document.getElementById('dev-preview-notice');
    const siteHeader=document.querySelector('.sfi-header');
    if(siteHeader){siteHeader.dataset.journeyHeader='true';siteHeader.dataset.collapsed='true';siteHeader.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded','false')}
    document.body.dataset.journeyActive=String(root.getBoundingClientRect().bottom>0&&root.getBoundingClientRect().top<innerHeight);
    if(previewNotice&&siteHeader&&!siteHeader.contains(previewNotice))siteHeader.prepend(previewNotice);
    let navHeight=0;
    function measureHeader(){const header=document.querySelector('.sfi-header');const position=header?getComputedStyle(header).position:'';navHeight=header&&['sticky','fixed'].includes(position)&&!(position==='fixed'&&header.dataset.journeyHeader==='true')?Math.max(0,header.getBoundingClientRect().height):0;root.style.setProperty('--sj-nav-height',navHeight+'px')}
    measureHeader();
    let scenes=[],index=-1,visibleIndex=-1,inspectionPaused=false,fraction=0,globalProgress=0,raf=0,lang=location.pathname.startsWith('/en')?'en':document.documentElement.lang.startsWith('zh')?'zh':'no',quiet=motionQuery.matches,manualQuiet=false,soundOn=false,ctx=null,gain=null,oscillators=[],disposed=false,lastScroll=-1,lastVisible=false,artGrid=null,galleryEntry=null,artDialog=null,artOpener=null,oldOverflow='';
    const on=(el,event,fn,opts)=>{el.addEventListener(event,fn,opts);clean.push(()=>el.removeEventListener(event,fn,opts))};
    const t=k=>TEXT[lang][k]||TEXT.no[k]||k;
    const thoughtSemantics=document.createElement('p');thoughtSemantics.className='sj-sr';thoughtSemantics.textContent=EXPRESSION_TEXT[lang].join(' · ');q('.sj-stage').append(thoughtSemantics);
    let spatial=null,spatialWordsLang=lang,spatialLoading=false;
    function initSpatial(){
      if(quiet||spatial||spatialLoading||disposed)return;spatialLoading=true;
      import('/assets/journey/spatial-thoughts.mjs').then(module=>{if(disposed||quiet){spatialLoading=false;return}spatialWordsLang=lang;spatial=module.createSpatialThoughts({parent:q('.sj-media'),words:EXPRESSION_TEXT[lang],onReady:()=>{if(disposed)return;root.dataset.spatialThoughts=spatial?.debug().state||'ready';thoughts.hidden=true;drawComposite();paintPhase()}});paintPhase()}).catch(()=>{spatialLoading=false;if(!disposed){root.dataset.spatialThoughts='fallback';drawComposite();paintPhase()}});
    }
    // The 3D word layer is only needed once the visitor leaves the landing hero; loading it then keeps the first view light without changing any scene.
    const spatialSoon=()=>{if(scrollY>40)initSpatial()};on(window,'scroll',spatialSoon,{passive:true});spatialSoon();
    let navigationReason='navigation',restoreHash=location.hash;
    const save=(pending,reason)=>{if(reason)navigationReason=reason;try{sessionStorage.setItem(KEY,JSON.stringify({scene:scenes[index]?.id,fraction,lang,pending,restoreMode:navigationReason,restoreHash,at:Date.now()}))}catch{}};
    let saved=null;try{saved=JSON.parse(sessionStorage.getItem(KEY));if(saved&&Date.now()-saved.at<3600000&&TEXT[saved.lang]){lang=saved.lang;if(saved.restoreMode==='language')restoreHash=saved.restoreHash||''}}catch{}
    const requestedLang=new URLSearchParams(location.search).get('lang');if(requestedLang==='zh-Hans'||requestedLang==='zh')lang='zh';else if(requestedLang==='en'||requestedLang==='no')lang=requestedLang;else lang=location.pathname.startsWith('/en')?'en':'no';
    const title=s=>{const label=s.title?.[lang]||TITLES[s.id]?.[{no:0,en:1,zh:2}[lang]]||s.id;return (s.reviewStatus==='draft'?{no:'Utkast · ',en:'Draft · ',zh:'草稿 · '}[lang]:'')+label};
    function artworkDetails(art){
      const fallback=(lang==='en'?'/en/creative-community/art/':'/kunstfellesskap/verk/')+art.id+'/';
      const candidate=art.details?.[lang==='en'?'en':'no'];
      if(typeof candidate!=='string'||!candidate.startsWith('/')||candidate.startsWith('//'))return fallback;
      try{const url=new URL(candidate,location.origin);return url.origin===location.origin?url.pathname+url.search+url.hash:fallback}catch{return fallback}
    }
    function isGalleryArtwork(art){return Boolean(art&&((window.SFIFeaturedArt||[]).some(item=>item.id===art.id)||scenes.find(scene=>scene.id==='gallery')?.artworks?.some(item=>item.id===art.id)))}
    function galleryRoomUrl(art){
      const url=new URL(lang==='en'?'/en/galleri-3d/':'/galleri-3d/',location.origin);url.searchParams.set('view','3d');
      if(isGalleryArtwork(art))url.searchParams.set('art',art.id);
      return url.pathname+url.search;
    }
    function setText(el,value){if(!el)return;el.replaceChildren();String(value).split('\n').forEach((line,i)=>{if(i)el.append(document.createElement('br'));el.append(document.createTextNode(line))})}
    function paintText(){
      root.lang=lang==='zh'?'zh-Hans':lang;document.documentElement.lang=lang==='zh'?'zh-Hans':lang==='no'?'nb':'en';
      invitation.textContent=INTRO_TEXT[lang];
      thoughtSemantics.textContent=EXPRESSION_TEXT[lang].join(' · ');if(spatial&&spatialWordsLang!==lang){spatial.setWords(EXPRESSION_TEXT[lang]);spatialWordsLang=lang}
      thoughts.querySelectorAll('[data-expression]').forEach((el,i)=>{el.textContent=EXPRESSION_TEXT[lang][i]});
      for(const selector of document.querySelectorAll('[data-primary-language]')){selector.value=lang==='zh'?'zh-Hans':lang;selector.setAttribute('aria-label',t('language'))}
      for(const el of root.querySelectorAll('[data-sj-text]'))setText(el,t(el.dataset.sjText));
      for(const a of root.querySelectorAll('[data-sj-route]')){const key=a.dataset.sjRoute;a.href=(ROUTES[lang]||ROUTES.no)[key];a.textContent=t(key)}
      q('[data-sj-language]').value=lang==='zh'?'zh-Hans':lang;q('[data-sj-language]').setAttribute('aria-label',t('language'));
      q('[data-sj-prev]').setAttribute('aria-label',t('prev'));q('[data-sj-next]').setAttribute('aria-label',t('next'));
      q('[data-sj-motion]').disabled=motionQuery.matches;q('[data-sj-motion]').textContent=quiet?t('resume'):t('pause');q('[data-sj-motion]').setAttribute('aria-pressed',String(quiet));
      q('[data-sj-sound]').textContent=t(soundOn?'on':'off');q('[data-sj-sound]').setAttribute('aria-pressed',String(soundOn));const headerSound=document.querySelector('[data-site-navigation] [data-opening-sound]');if(headerSound){headerSound.textContent=t(soundOn?'on':'off');headerSound.setAttribute('aria-pressed',String(soundOn))}
      if(quiet)q('.sj-hint').textContent=t('quiet');
      const scene=scenes[visibleIndex];if(scene){q('.sj-scene-title').textContent=title(scene);if(scene.type==='art'){setText(q('h1'),t('artTitle'));setText(q('.sj-deck'),t('artDeck'))}else if(visibleIndex>0){setText(q('h1'),title(scene));setText(q('.sj-deck'),scene.description?.[lang]||t('deck'))}}
      if(galleryEntry){galleryEntry.href=galleryRoomUrl();galleryEntry.textContent=t('gallery')}
      if(artGrid)for(const a of artGrid.querySelectorAll('a')){const art=a._art;a.href=artworkDetails(art);a.querySelector('strong').textContent=art.no||art.en;a.querySelector('img').alt=artLabel(art)}
    }
    function silence(){soundOn=false;for(const slot of buffers)slot.element.muted=true;if(gain&&ctx)gain.gain.setTargetAtTime(0,ctx.currentTime,.16);paintText()}
    async function toggleSound(){
      if(soundOn){silence();return}const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;
      try{if(!ctx){ctx=new Audio();gain=ctx.createGain();gain.gain.value=0;gain.connect(ctx.destination);[130.8128,196,261.6256].forEach((hz,i)=>{const osc=ctx.createOscillator(),voice=ctx.createGain();osc.type='sine';osc.frequency.value=hz;voice.gain.value=[.4,.18,.11][i];osc.connect(voice);voice.connect(gain);osc.start();oscillators.push(osc)})}await ctx.resume();if(disposed||document.hidden)return;soundOn=true;for(const slot of buffers){slot.element.muted=false;slot.element.volume=.45}gain.gain.setTargetAtTime(scenes[index]?.mode==='play'?.018:.045,ctx.currentTime,1.1);ambient();paintText()}catch{silence()}
    }
    function ambient(){if(!ctx||!soundOn)return;const notes=[130.8128,146.8324,164.8138,146.8324,196,174.6141];const note=notes[Math.max(0,index)%notes.length];gain.gain.setTargetAtTime(scenes[index]?.mode==='play'?.018:.045,ctx.currentTime,.6);oscillators.forEach((osc,i)=>osc.frequency.setTargetAtTime(note*[1,1.5,2][i],ctx.currentTime,1.8));if(['brains','impulses','vortex','dna'].includes(scenes[index]?.id)){[0.5,2.1,4.3].forEach((delay,i)=>{const pulse=ctx.createOscillator(),envelope=ctx.createGain(),at=ctx.currentTime+delay;pulse.type='sine';pulse.frequency.value=note*[4,3,6][i];envelope.gain.setValueAtTime(0,at);envelope.gain.linearRampToValueAtTime(.08,at+.13);envelope.gain.exponentialRampToValueAtTime(.0001,at+1.6);pulse.connect(envelope);envelope.connect(gain);pulse.start(at);pulse.stop(at+1.7)})}}
    function presentedState(){return timeline.position(presentedProgress,scenes)}
    function settleEntrances(){
      const shown=presentedState(),scene=scenes[shown.index],phase=shown.fraction;
      const active=!quiet&&['impulses','vortex'].includes(scene?.id);root.style.setProperty('--sj-phase',phase);
      root.dataset.dissolving=String(active&&scene?.id==='vortex'&&phase>.78);
      [...root.querySelectorAll('.sj-entrances a')].forEach((a,i)=>{
        const reveal=active?clamp((phase-(.04+i*.13))/.08,0,1):1;
        const dissolve=active&&scene?.id==='vortex'?clamp((phase-.78)/.2,0,1):0;
        const opacity=reveal*(1-dissolve),available=opacity>.96;
        a.style.opacity=String(opacity);a.style.transform=active?'translate3d('+(dissolve*(i-1.5)*45)+'px,'+((1-reveal)*15-dissolve*25)+'px,0) scale('+(1-dissolve*.08)+')':'';
        a.style.pointerEvents=available?'':'none';a.tabIndex=available?0:-1;
        if(available)a.removeAttribute('aria-hidden');else a.setAttribute('aria-hidden','true');
      });
    }
    // Decoder completion may finish the requested input position, never play.
    function canSeek(){const rect=root.getBoundingClientRect();return !disposed&&!quiet&&!inspectionPaused&&!document.hidden&&!artDialog?.open&&scenes[index]?.type!=='art'&&!!scenes[index]?.video&&rect.bottom>navHeight&&rect.top<innerHeight}
    function artLabel(art){return lang==='zh'?'作品：'+(art.no||art.en)+'。艺术家：'+(art.artistName||'Innsatt 2601-46'):lang==='en'?'Artwork: '+(art.no||art.en)+' · '+(art.artistName||'Innsatt 2601-46'):(art.no||art.en)+' · '+(art.artistName||'Innsatt 2601-46')}
    function openArt(art,opener){
      if(typeof HTMLDialogElement==='undefined')return false;
      inspectionPaused=true;silence();pauseMedia();artOpener=opener;
      artDialog?.remove();artDialog=document.createElement('dialog');artDialog.className='sj-art-dialog';artDialog.setAttribute('aria-labelledby','sj-art-dialog-title');
      const head=document.createElement('header'),name=document.createElement('h2'),close=document.createElement('button');name.id='sj-art-dialog-title';name.textContent=art.no||art.en;close.type='button';close.textContent='×';close.setAttribute('aria-label',lang==='en'?'Close':lang==='zh'?'关闭':'Lukk');head.append(name,close);
      const viewport=document.createElement('div');viewport.className='sj-art-viewport';const img=document.createElement('img');img.src=art.src;img.alt=artLabel(art);viewport.append(img);
      const foot=document.createElement('footer'),by=document.createElement('span'),zoom=document.createElement('button'),share=document.createElement('button'),clothing=document.createElement('a'),status=document.createElement('p');by.textContent=art.artistName||'Innsatt 2601-46';zoom.type=share.type='button';zoom.textContent=lang==='zh'?'缩放':'Zoom';zoom.setAttribute('aria-pressed','false');share.textContent=lang==='en'?'Share artwork':lang==='zh'?'分享作品':'Del verket';clothing.textContent=lang==='en'?'See clothing preview ↗':lang==='zh'?'查看服装预览 ↗':'Se klesforhåndsvisning ↗';clothing.href=(lang==='en'?'/en/shop/':'/butikk/')+'?art='+encodeURIComponent(art.id);status.setAttribute('role','status');
      const info=document.createElement('a');info.textContent=lang==='en'?'About the artwork ↗':lang==='zh'?'作品详情 ↗':'Om verket ↗';info.href=artworkDetails(art);foot.append(by,zoom,share,info,clothing);if(isGalleryArtwork(art)){const room=document.createElement('a');room.className='sj-gallery-entry';room.textContent=t('gallery');room.href=galleryRoomUrl(art);foot.append(room)}artDialog.append(head,viewport,foot,status);document.body.append(artDialog);
      const restore=()=>{document.body.style.overflow=oldOverflow;artOpener?.focus({preventScroll:true});artDialog?.remove();artDialog=null};
      close.addEventListener('click',()=>artDialog?.close());artDialog.addEventListener('close',restore,{once:true});artDialog.addEventListener('click',e=>{if(e.target===artDialog){const r=artDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)artDialog.close()}});
      zoom.addEventListener('click',()=>{const active=viewport.classList.toggle('is-zoomed');zoom.setAttribute('aria-pressed',String(active))});
      share.addEventListener('click',async()=>{const url=new URL(artworkDetails(art),location.origin).href;try{if(navigator.share)await navigator.share({title:name.textContent,url});else if(navigator.clipboard){await navigator.clipboard.writeText(url);status.textContent=lang==='en'?'Link copied':lang==='zh'?'链接已复制':'Lenken er kopiert'}else status.textContent=url}catch(error){if(error.name!=='AbortError')status.textContent=url}});
      oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';artDialog.showModal();close.focus();return true;
    }
    function showArt(scene){
      artGrid?.remove();artGrid=null;galleryEntry?.remove();galleryEntry=null;
      if(scene.type!=='art'&&!scene.artworks?.length)return;
      const works=scene.artworks||window.SFIFeaturedArt?.slice(0,3)||[];
      artGrid=document.createElement('div');artGrid.className='sj-art-grid';artGrid.setAttribute('aria-label',lang==='zh'?'精选作品':lang==='en'?'Selected artworks':'Utvalgte kunstverk');
      for(const art of works){const a=document.createElement('a');a._art=art;const frame=document.createElement('span');frame.className='sj-art-frame';const img=document.createElement('img');img.src=art.src;img.alt=artLabel(art);img.loading='lazy';img.width=600;img.height=800;const name=document.createElement('strong'),by=document.createElement('small');by.textContent=art.artistName||'Innsatt 2601-46';frame.append(img);a.append(frame,name,by);artGrid.append(a)}
      q('.sj-copy').append(artGrid);
      if((scene.sceneRole||scene.id)==='gallery'){galleryEntry=document.createElement('a');galleryEntry.className='sj-gallery-entry';galleryEntry.href=galleryRoomUrl();galleryEntry.textContent=t('gallery');dock.append(galleryEntry)}
    }
    function commitScene(){
      if(index<0)return;
      const scene=scenes[index];
      root.dataset.scene=scene.sceneRole||scene.id;root.dataset.sceneType=scene.type||'video';root.dataset.scrub=String(!!scene.video);root.dataset.origin=String(scene.type==='point');root.dataset.framing=scene.type==='art'?'contain':'cover';
      const rect=q('.sj-media').getBoundingClientRect(),focus=timeline.focusFor(scene,rect.width,rect.height);
      root.style.setProperty('--sj-focus-x',focus.x+'%');root.style.setProperty('--sj-focus-y',focus.y+'%');
      if(visibleIndex===index)return;
      visibleIndex=index;root.dataset.visibleScene=scene.id;
      q('.sj-count').textContent=String(index+1).padStart(2,'0')+' / '+String(scenes.length).padStart(2,'0');
      showArt(scene);paintText();q('[data-sj-status]').textContent=title(scene);
    }
    function show(next){
      if(!scenes[next])return;holdFrame();index=next;globalProgress=timeline.progressAt(index,fraction,scenes);const scene=scenes[index];root.dataset.requestedScene=scene.id;
      if(scene.video){root.dataset.pending='true';q('[data-sj-status]').textContent=t('loading')}
      // Posters remain hidden underneath the retained composition. Scene CSS,
      // words and transforms change only when that composition is committed.
      poster.src=scene.poster||'/assets/journey/galaxy.webp';backdrop.src=poster.src;q('[data-sj-prev]').disabled=index===0;q('[data-sj-next]').disabled=index===scenes.length-1;
      if(scene.type==='art'||scene.type==='point'||quiet){clearMedia();releaseFrame();if(scene.type==='point')warmAdjacent()}else updateMedia();
      settleEntrances();paintPhase();paintText();ambient();save(false);
    }
    function paintPhase(){
      const shown=presentedState(),phase=shown.fraction,scene=scenes[shown.index];
      root.style.setProperty('--sj-phase',phase);root.style.setProperty('--sj-global',shown.progress);
      const d=timeline.decoration(shown.progress,phase);root.style.setProperty('--sj-stars-opacity',d.stars);root.style.setProperty('--sj-binary-x',d.binary+'%');
      root.style.setProperty('--sj-portal-opacity',scene?.type==='point'?'0':d.portal);root.style.setProperty('--sj-portal-scale',d.portalScale);
      root.style.setProperty('--sj-origin-size',(3+phase*12)+'px');
      invitation.style.opacity=String(1-clamp(phase/.2,0,1));invitation.hidden=quiet||shown.index!==0||phase>=.2;
      const network=retainedFrame&&view?timeline.networkProgress(shown.index,phase,scenes):null;root.dataset.thoughts=String(network!==null&&!quiet);
      const rect=q('.sj-media').getBoundingClientRect(),states=timeline.thoughtStates(network,EXPRESSION_TEXT.no.length,{width:rect.width,height:rect.height});
      // Analyse exactly the committed composite, including both plate identities
      // during a transition. Scroll epochs must not invalidate unchanged pixels.
      const plateKey=[root.dataset.frameScenes,root.dataset.frameIndices,root.dataset.frameMediaTimes,root.dataset.frameSourceCrops,root.dataset.blend,hold.width,hold.height].join('|');
      const plateIndex=(root.dataset.frameScenes||'').split(' ').indexOf(scene?.id);
      const sceneTime=plateIndex<0?NaN:Number((root.dataset.frameMediaTimes||'').split(' ')[plateIndex]);
      const sourceCrop=plateIndex<0?undefined:JSON.parse(root.dataset.frameSourceCrops||'[]')[plateIndex];
      spatial?.render({progress:quiet?null:network,width:rect.width,height:rect.height,scene:scene?.id,sceneId:scene?.id,sceneFraction:phase,sceneTime:Number.isFinite(sceneTime)?sceneTime:undefined,sourceCrop,plate:hold,plateKey});
      const presence=network===null?0:Math.min(clamp(network/.035,0,1),clamp((1-network)/.04,0,1));
      for(const word of thoughts.querySelectorAll('[data-expression]')){
        const state=states[Number(word.dataset.expression)];word.style.opacity=state?String(state.opacity*presence):'0';
        if(state){word.dataset.slot=String(state.slot);word.dataset.entry=state.entry;word.style.left=(state.x*100)+'%';word.style.top=(state.y*100)+'%';word.style.transform='translate(-50%,-50%) translateZ('+state.z+'px) scale('+state.scale+')';word.style.filter='blur('+state.blur+'px)'}
      }
    }
    function render(){
      raf=0;if(disposed||!scenes.length)return;pauseMedia();
      const visibility=root.getBoundingClientRect();document.body.dataset.journeyActive=String(!quiet&&visibility.bottom>0&&visibility.top<innerHeight);measureHeader();
      if(quiet){commitScene();root.style.setProperty('--sj-progress',timeline.progressAt(index,fraction,scenes));settleEntrances();paintPhase();return}
      const rect=root.getBoundingClientRect(),distance=Math.max(1,root.offsetHeight-(innerHeight-navHeight));lastVisible=rect.bottom>navHeight&&rect.top<innerHeight;
      const state=timeline.position((navHeight-rect.top)/distance,scenes),previousFraction=fraction;direction=state.progress<globalProgress?-1:state.progress>globalProgress?1:direction;globalProgress=state.progress;fraction=state.fraction;
      root.style.setProperty('--sj-progress',globalProgress);
      if(state.index!==index){if(!artDialog?.open)inspectionPaused=false;show(state.index)}
      else{if((lastScroll!==scrollY||Math.abs(previousFraction-fraction)>.00001)&&!artDialog?.open)inspectionPaused=false;updateMedia()}
      if(quiet||['point','art'].includes(scenes[index]?.type))presentedProgress=globalProgress;
      settleEntrances();paintPhase();lastScroll=scrollY;
      if(rect.bottom<0||rect.top>innerHeight){pauseMedia();if(soundOn)silence()}
    }
    const schedule=()=>{if(!raf)raf=requestAnimationFrame(render)};
    function go(next){next=clamp(next,0,scenes.length-1);fraction=0;if(quiet){show(next);schedule();return}show(next);const y=root.getBoundingClientRect().top+scrollY-navHeight+timeline.progressAt(next,0,scenes)*Math.max(1,root.offsetHeight-(innerHeight-navHeight))+1;scrollTo({top:y,behavior:'instant'});schedule()}
    function setQuiet(){const was=quiet;const anchor=root.getBoundingClientRect().top+scrollY-navHeight;quiet=manualQuiet||motionQuery.matches;root.dataset.quiet=String(quiet);if(!quiet)initSpatial();pauseMedia();clearMedia();clearTransition();if(quiet){releaseFrame();root.dataset.video='loading';scrollTo({top:anchor,behavior:'instant'})}else if(was&&index>=0){const savedFraction=fraction;show(index);scrollTo({top:anchor+timeline.progressAt(index,savedFraction,scenes)*Math.max(1,root.offsetHeight-(innerHeight-navHeight)),behavior:'instant'})}paintText();schedule()}
    on(window,'scroll',schedule,{passive:true});on(window,'resize',()=>{const progress=globalProgress;measureHeader();if(lastVisible&&!quiet&&scenes.length){const top=root.getBoundingClientRect().top+scrollY-navHeight;scrollTo({top:top+progress*Math.max(1,root.offsetHeight-(innerHeight-navHeight)),behavior:'instant'})}schedule()});
    on(q('[data-sj-prev]'),'click',()=>go(index-1));on(q('[data-sj-next]'),'click',()=>go(index+1));on(q('[data-sj-motion]'),'click',()=>{manualQuiet=!quiet;setQuiet()});on(motionQuery,'change',setQuiet);on(q('[data-sj-sound]'),'click',toggleSound);const headerSoundButton=document.querySelector('[data-site-navigation] [data-opening-sound]');if(headerSoundButton)on(headerSoundButton,'click',toggleSound);on(q('[data-sj-language]'),'change',e=>changeLanguage(e.target.value));
    function changeLanguage(value){if(window.SFISelectLanguage){window.SFISelectLanguage(value);return}lang=value==='zh-Hans'||value==='zh'?'zh':value==='en'?'en':'no';paintText();save(true,'language');silence();const destination=new URL(location.href);destination.pathname=lang==='en'?'/en/':'/';if(lang==='zh')destination.searchParams.set('lang','zh-Hans');else destination.searchParams.delete('lang');location.assign(destination.href)}
    on(window,'sfi-before-language-change',e=>{lang=e.detail.locale==='zh-Hans'?'zh':e.detail.locale;const rect=root.getBoundingClientRect(),visible=rect.bottom>navHeight&&rect.top<innerHeight;e.detail.restoreJourney=visible;restoreHash=location.hash;save(visible,visible?'language':'navigation');silence()});
    on(root,'keydown',e=>{if(e.target.closest('input,select,textarea'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();go(index+(e.key==='ArrowRight'?1:-1))}});
    on(root,'click',e=>{const artwork=e.target.closest('a');if(artwork?._art&&openArt(artwork._art,artwork)){e.preventDefault();return}if(e.target.closest('a')){save(true,'navigation');silence()}});on(window,'pagehide',()=>{save(true);silence()});on(window,'pageshow',()=>{silence();schedule()});on(document,'visibilitychange',()=>{if(document.hidden){pauseMedia();clearMedia();silence()}else schedule()});
    dispose=()=>{disposed=true;spatial?.dispose();thoughtSemantics.remove();delete root.dataset.spatialThoughts;delete document.body.dataset.journeyActive;if(siteHeader)delete siteHeader.dataset.journeyHeader;presentation.dispose();cache.clear();dockObserver.disconnect();bottomObserver?.disconnect();controller.abort();clean.forEach(f=>f());cancelAnimationFrame(raf);clearMedia();clearTransition();oscillators.forEach(o=>{try{o.stop()}catch{}});ctx?.close().catch(()=>{});artGrid?.remove();galleryEntry?.remove();if(artDialog){artDialog.close();artDialog?.remove();document.body.style.overflow=oldOverflow}hold.width=hold.height=scratch.width=scratch.height=1;hold.remove();video.style.display=originalVideoDisplay;peer.remove();portal.remove();origin.remove();invitation.remove();backdrop.remove();thoughts.remove();moved.reverse().forEach(({node,parent,next})=>parent.insertBefore(node,next?.parentNode===parent?next:null));dock.remove();root.querySelectorAll('.sj-entrances a').forEach(a=>{a.style.opacity='';a.style.transform='';a.style.pointerEvents='';a.tabIndex=0;a.removeAttribute('aria-hidden')});root.removeAttribute('data-compositor');root.removeAttribute('data-blend');root.removeAttribute('data-frame-scenes');root.removeAttribute('data-frame-fractions');for(const key of ['frameSourceCrops','frameIndices','frameEvidence','frameMediaTimes','frameCachePixels','frameCacheEntries','pending','requestedScene','requestedEpoch','requestedProgress','presentedEpoch','presentedProgress'])delete root.dataset[key];root.removeAttribute('data-enhanced');root.removeAttribute('data-video');root.removeAttribute('data-quiet');root.removeAttribute('data-scrub');root.removeAttribute('data-visible-scene');controls.hidden=true};
    paintText();
    fetch(root.dataset.manifest||'/assets/journey/manifest.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('manifest');return r.json()}).then(data=>{
      if(disposed)return;scenes=(data.scenes||[]).filter(s=>s.enabled===true&&typeof s.id==='string'&&(s.type==='art'||s.type==='point'||(typeof s.video==='string'&&s.video.startsWith('/assets/journey/'))));if(!scenes.length)return;
      root.style.setProperty('--sj-scenes',scenes.reduce((sum,scene)=>sum+timeline.weight(scene),0));root.dataset.enhanced='true';root.dataset.quiet=String(quiet);controls.hidden=false;
      let start=saved?.pending?scenes.findIndex(s=>s.id===saved.scene):0;start=Math.max(0,start);fraction=saved?.pending?clamp(Number(saved.fraction)||0,0,.99):0;show(start);
      const restoreFragment=()=>{if(saved?.restoreMode==='language'&&saved.restoreHash&&!location.hash){const url=new URL(location.href);url.hash=saved.restoreHash;history.replaceState(null,'',url.href)}};
      const settled=()=>{if(saved?.pending&&(!location.hash||saved.restoreMode==='language')&&!quiet){const f=fraction;requestAnimationFrame(()=>{if(disposed)return;measureHeader();scrollTo({top:root.getBoundingClientRect().top+scrollY-navHeight+timeline.progressAt(start,f,scenes)*Math.max(1,root.offsetHeight-(innerHeight-navHeight)),behavior:'instant'});schedule();restoreFragment()})}else{schedule();restoreFragment()}};
      if(saved?.restoreMode==='language'&&document.readyState!=='complete')on(window,'load',settled,{once:true});else settled();
    }).catch(()=>{if(!disposed)q('[data-sj-status]').textContent=t('unavailable')});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  for(const event of ['routechange','premium:routechange'])window.addEventListener(event,init);
  window.StemmenJourney={init,destroy:()=>dispose()};
})();
