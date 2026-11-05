/* A small, optional Canvas layer. Links and artwork remain ordinary HTML. */
(() => {
  'use strict';
  let release = () => {};
  function mount(scope = document) {
    release();
    const host = scope.querySelector('.minds-landing');
    if (!host) return;
    const hero = host.querySelector('.minds-hero');
    const canvas = host.querySelector('.minds-canvas');
    const button = host.querySelector('.minds-motion');
    const gallery = host.querySelector('.minds-gallery');
    const convergence = host.querySelector('.minds-convergence');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listeners = [];
    const on = (target, name, handler, options) => {
      target.addEventListener(name, handler, options);
      listeners.push(() => target.removeEventListener(name, handler, options));
    };
    let ctx;
    try { ctx = canvas.getContext('2d', { alpha: true }); } catch (_) {}
    // The CSS star field and all content remain usable if Canvas is unavailable.
    if (!ctx) { host.dataset.visual = 'static'; return; }
    host.dataset.visual = 'canvas';
    // A purely decorative, locally rendered bridge: no generated images or external services.
    const bridge = document.createElement('div');
    bridge.className = 'minds-visual-bridge';
    bridge.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Creators and their artwork' : 'Skapere og kunstverk');
    const bridgeCanvas = document.createElement('canvas');
    bridgeCanvas.className = 'minds-visual-bridge-canvas';
    bridgeCanvas.setAttribute('aria-hidden','true');
    const stageWrap = document.createElement('div'); stageWrap.className='minds-scene-stage';
    stageWrap.append(bridgeCanvas); bridge.append(stageWrap);
    const en=document.documentElement.lang==='en';
    const sceneLinks=document.createElement('nav');sceneLinks.className='minds-scene-links';
    sceneLinks.setAttribute('aria-label',en?'Choose an artwork for your T-shirt':'Velg et kunstverk til T-skjorten');
    const artImages=[];
    const sceneModels=['creator-hiphop-male','creator-punk-female','creator-kpop-male','creator-workwear-female','creator-business-male','creator-red-female','creator-orange-male','creator-hiphop-female'];
    const arts=(window.SFIFeaturedArt?.length ? window.SFIFeaturedArt : (window.BookArt||[])).slice(0,8);
    arts.forEach((art,i)=>{
      const id=art.id || (art.page===354?'gjenbruk':'book-page-'+String(art.page));
      const link=document.createElement('a');link.href=(en?'/en/shop/':'/butikk/')+'?art='+id+'&model='+sceneModels[i]+'&placement=back';
      link.textContent=en?art.en:art.no;link.dataset.artId=id;sceneLinks.append(link);
      const im=new Image();im.onload=()=>{if(alive)drawBridge()};artImages.push(im);
    });
    const scenePrompt=document.createElement('div'); scenePrompt.className='minds-scene-prompt';
    const sceneLabel=document.createElement('p'); sceneLabel.className='minds-scene-label'; sceneLabel.setAttribute('aria-hidden','true'); stageWrap.prepend(sceneLabel);
    const prompt=document.createElement('span'); prompt.textContent=en?'What is your idea?':'Hva er din idé?';
    const music=document.createElement('a'); music.href=en?'/en/music/':'/musikk/';
    music.textContent=en?'▶ Explore music':'▶ Utforsk musikk';
    scenePrompt.append(prompt,music); stageWrap.append(scenePrompt,sceneLinks);
    const creatorAtlas=new Image();creatorAtlas.onload=()=>{bridge.dataset.models='loaded';if(alive)drawBridge()};

    // Keep the visual sequence directly after the galaxy rather than interrupting it with text.
    hero.after(bridge);
    let bridgeContext;
    try { bridgeContext = bridgeCanvas.getContext('2d', { alpha: true }); } catch (_) {}
    if (!bridgeContext) bridge.hidden = true;
    let bridgeWidth = 0, bridgeHeight = 0, bridgeProgress = 0;
    let cinematic = null, cinematicCanvas = null, cinematicObserver = null, cinematicLoading = false;
    let width = 0, height = 0, frame = 0, last = 0, phase = 0;
    let paused = motionQuery.matches, visible = true, heroVisible = true, bridgeVisible = false, alive = true;
    let progress = 0, starCount = 0;
    let points = [], clusters = [];
    // Seeded positions avoid noisy layout changes on resize.
    let seed = 260146;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const colors = ['#ffe3a3', '#abcfd8', '#b8ead4', '#bdb5e5', '#f1c4b9'];
    for (let i = 0; i < 720; i++) points.push({
      r: Math.pow(random(), .58), arm: i % 4, offset: (random() - .5) * .55,
      size: .25 + random() * 1.3, alpha: .2 + random() * .65,
      color: colors[i % colors.length], twinkle: random() * Math.PI * 2,
    });
    for (let i = 0; i < 12; i++) clusters.push({
      angle: i / 12 * Math.PI * 2 + .3, r: .38 + random() * .55,
      color: colors[i % colors.length], size: 8 + random() * 12,
    });
    function scenePoint(r, angle, cx, cy, radius) {
      const x = Math.cos(angle) * r * radius;
      const y = Math.sin(angle) * r * radius * .42;
      const tilt = -.24;
      return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)];
    }
    function draw() {
      if (!width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const mobile = width < 700;
      const cx = width * (mobile ? .65 : .74);
      const cy = height * (mobile ? .68 : .46);
      const radius = Math.min(mobile ? width * .8 : width * .37, 580);
      const drift = phase;
      const collapse = 1 - progress * .18;
      ctx.globalCompositeOperation = 'screen';
      const haze = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * .7);
      haze.addColorStop(0, '#b8dec32b'); haze.addColorStop(.12, '#bfd3e218');
      haze.addColorStop(.5, '#4e6e9911'); haze.addColorStop(1, '#153c4200');
      ctx.fillStyle = haze; ctx.fillRect(0, 0, width, height);
      for (let i = 0; i < starCount; i++) {
        const p = points[i];
        const angle = p.arm * Math.PI / 2 + p.r * 4.8 + p.offset + drift * (.035 + (1 - p.r) * .025);
        const [x, y] = scenePoint(p.r * collapse, angle, cx, cy, radius);
        ctx.globalAlpha = p.alpha * (paused ? .9 : .82 + Math.sin(phase * .3 + p.twinkle) * .12);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(x, y, p.size * (mobile ? .82 : 1), 0, Math.PI * 2); ctx.fill();
      }
      const locations = clusters.map(c => scenePoint(c.r * collapse, c.angle + drift * .017, cx, cy, radius));
      ctx.lineWidth = .6;
      for (let i = 0; i < locations.length; i++) {
        const a = locations[i], b = locations[(i + 4) % locations.length];
        ctx.globalAlpha = .12; ctx.strokeStyle = clusters[i].color;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(cx, cy, b[0], b[1]); ctx.stroke();
        if (!paused) {
          const t = ((phase * .045 + i / 12) % 1);
          const x = (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * cx + t * t * b[0];
          const y = (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * cy + t * t * b[1];
          ctx.globalAlpha = .65; ctx.fillStyle = clusters[i].color;
          ctx.beginPath(); ctx.arc(x, y, 1.3, 0, Math.PI * 2); ctx.fill();
        }
      }
      clusters.forEach((c, i) => {
        const [x, y] = locations[i];
        const size = c.size * (mobile ? .55 : 1);
        ctx.strokeStyle = c.color; ctx.fillStyle = c.color;
        ctx.globalAlpha = .34; ctx.lineWidth = .7;
        // An abstract branching idea cluster, not a medical brain model.
        ctx.beginPath();
        for (let j = 0; j <= 24; j++) {
          const a = j / 24 * Math.PI * 2;
          const ripple = size * (.7 + .13 * Math.sin(a * 5 + i));
          const px = x + Math.cos(a) * ripple, py = y + Math.sin(a) * ripple * .75;
          if (j === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.stroke();
        for (let j = 0; j < 5; j++) {
          const a = j / 5 * Math.PI * 2 + i;
          const px = x + Math.cos(a) * size * .55, py = y + Math.sin(a) * size * .4;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(px, py); ctx.stroke();
          ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(px, py, 1.15, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = .34;
        }
        ctx.globalAlpha = .9; ctx.beginPath(); ctx.arc(x, y, 1.7, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    // One scroll clock controls the cohort; no independent per-person timers.
    const clamp = value => Math.max(0, Math.min(1, value));
    const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
    function drawBridge() {
      if (!bridgeContext || !bridgeWidth || !bridgeHeight) return;
      const c = bridgeContext, w = bridgeWidth, h = bridgeHeight;
      const p = motionQuery.matches ? .64 : bridgeProgress;
      const stage = p < .12 ? 'converge' : p < .28 ? 'dna' : p < .55 ? 'create' : p < .76 ? 'unity' : 'light';
      const labels = en ? {converge:'Many voices. One movement.',dna:'Ideas become possibility.',create:'Every person has something to create.',unity:'Together, we are stronger.',light:'Art finds its place.'} : {converge:'Mange stemmer. Én bevegelse.',dna:'Ideer blir til muligheter.',create:'Alle har noe å skape.',unity:'Sammen er vi sterkere.',light:'Kunsten finner sin plass.'};
      bridge.dataset.scene = stage; sceneLabel.textContent=labels[stage];
      if (cinematic) { cinematic.render(p, phase); return; }
      const emerge = smooth((p - .22) / .18);
      const dnaIn = smooth((p - .055) / .12);
      const gathering = 1 - smooth((p - .04) / .12);
      const turn = smooth((p - .55) / .12);
      const dissolve = smooth((p - .76) / .22);
      c.clearRect(0, 0, w, h);
      const galleryReveal = smooth((p - .68) / .28);
      c.save(); c.globalAlpha = galleryReveal * .95; c.fillStyle = '#ede7d8'; c.fillRect(0,0,w,h); c.restore();
      c.save(); c.translate(w / 2, h / 2); c.scale(Math.min(w / 800, h / 460), Math.min(w / 800, h / 460));
      c.lineCap = 'round';
      // Ideas converge and bloom before giving way to the helix.
      if (gathering > 0) {
        c.globalCompositeOperation='screen';
        for (let i=0;i<72;i++) {
          const angle=i*2.399+phase*.12, radius=(35+(i%12)*24)*(1-smooth(p/.13)) + 5;
          c.globalAlpha=gathering*(.35+(i%4)*.12); c.fillStyle=colors[i%colors.length];
          c.beginPath(); c.arc(Math.cos(angle)*radius,Math.sin(angle)*radius*.55,1.5+(i%3)*.5,0,Math.PI*2); c.fill();
        }
        const glow=c.createRadialGradient(0,0,0,0,0,110);
        glow.addColorStop(0,'#fff8dc');glow.addColorStop(.15,'#ffe0a4aa');glow.addColorStop(1,'#f0b96b00');
        c.globalAlpha=Math.sin(smooth(p/.17)*Math.PI)*.8;c.fillStyle=glow;c.fillRect(-110,-110,220,220);
        c.globalCompositeOperation='source-over';
      }
      // The helix relinquishes the frame as the creators appear.
      c.globalAlpha = dnaIn * (1 - emerge);
      for (let i = 0; i < 46; i++) {
        const y = -170 + i * 7;
        const x = Math.sin(i * .31 + phase * .35) * 55;
        c.strokeStyle = '#86b9be'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x,y); c.lineTo(-x,y); c.stroke();
        c.fillStyle = '#e3d5a0';
        for (const dx of [x,-x]) { c.beginPath(); c.arc(dx,y,2.4,0,Math.PI*2); c.fill(); }
      }
      const N=8, spread=96;
      // Individual paths carry the shared idea toward each creator.
      c.globalAlpha=Math.sin(emerge*Math.PI)*.35;
      c.strokeStyle='#b8e6da';c.lineWidth=1;
      for(let i=0;i<N;i++) {c.beginPath();c.moveTo(0,0);c.quadraticCurveTo((i-3.5)*24,-45,(i-3.5)*spread,25);c.stroke();}
      for(let i=0;i<N;i++) {
        const x=(i-(N-1)/2)*spread, y=-135+(i%2)*10;
        c.globalAlpha=emerge*(.35+.65*dissolve);c.fillStyle='#ddc68c';c.fillRect(x-34,y-42,68,84);
        c.fillStyle='#f7f3e8';c.fillRect(x-31,y-39,62,78);
        const art=artImages[i];
        if(art?.complete&&art.naturalWidth) {
          const factor=Math.min(58/art.naturalWidth,74/art.naturalHeight), iw=art.naturalWidth*factor, ih=art.naturalHeight*factor;
          c.drawImage(art,x-iw/2,y-ih/2,iw,ih);
        }
        if(dissolve>0) {
          c.globalAlpha=Math.sin(dissolve*Math.PI);c.strokeStyle='#ffe2a1';c.lineWidth=1.4;
          c.beginPath();c.moveTo(x,25);c.quadraticCurveTo(x+25,-50,x,y);c.stroke();
          for(let j=0;j<12;j++) {const t=clamp(dissolve*1.3-j*.025);c.fillStyle=j%2?'#a8e0dd':'#ffe2a1';c.beginPath();c.arc(x+Math.sin(j*2.4)*12*(1-t),25+(y-25)*t,1.8,0,Math.PI*2);c.fill();}
        }
      }
      if(creatorAtlas.complete&&creatorAtlas.naturalWidth) {
        const sourceH=creatorAtlas.naturalHeight/2;
        const targetW=800, targetH=targetW*sourceH/creatorAtlas.naturalWidth;
        const targetY=-25;
        c.globalAlpha=emerge*(1-dissolve)*(1-turn);
        c.drawImage(creatorAtlas,0,0,creatorAtlas.naturalWidth,sourceH,-targetW/2,targetY,targetW,targetH);
        c.globalAlpha=emerge*(1-dissolve)*turn;
        c.drawImage(creatorAtlas,0,sourceH,creatorAtlas.naturalWidth,sourceH,-targetW/2,targetY,targetW,targetH);
        // Exact original art is composited, never regenerated as part of the shirt.
        for(let i=0;i<N;i++) {
          const art=artImages[i];if(!art?.complete||!art.naturalWidth)continue;
          c.globalAlpha=emerge*(1-dissolve)*turn;
          const placement=window.SFICreatorPrintPlacement(i), scale=targetW/N/222;
          const x=-targetW/2+i*targetW/N+placement.center*scale;
          const fit=Math.min(placement.width*scale/art.naturalWidth,placement.height*scale/art.naturalHeight);
          const aw=art.naturalWidth*fit, ah=art.naturalHeight*fit;
          c.drawImage(art,x-aw/2,targetY+placement.top*scale+(placement.height*scale-ah)/2,aw,ah);
          const artist=arts[i].artistName || 'Innsatt 2601-46';
          c.fillStyle='#111';c.textAlign='center';c.font=`bold ${Math.min(7,100/Math.max(1,artist.length))*scale}px Arial`;
          c.fillText(artist==='Innsatt 2601-46'?'Innsatt 260146':artist,x,targetY+(placement.top+placement.height+10)*scale);
        }
      }
      c.restore();
    }
    function cancel() { if (frame) cancelAnimationFrame(frame); frame = 0; }
    function tick(time) {
      frame = 0;
      if (!alive || paused || !visible || document.hidden) return;
      if (time - last >= 1000 / 30) {
        phase += Math.min((time - last) / 1000, .05); last = time;
        if (heroVisible) draw();
        if (bridgeVisible) drawBridge();
      }
      frame = requestAnimationFrame(tick);
    }
    function schedule() {
      cancel();
      if (alive && !paused && visible && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(tick); }
    }
    function updateLabel() {
      button.setAttribute('aria-pressed', String(paused));
      button.textContent = paused ? button.dataset.startLabel : button.dataset.pauseLabel;
      host.dataset.motion = paused ? 'paused' : 'playing';
    }
    function resize() {
      const rect = hero.getBoundingClientRect();
      width = Math.round(rect.width); height = Math.round(rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starCount = width < 700 ? 260 : 680;
      const bridgeRect = (cinematicCanvas || bridgeCanvas).getBoundingClientRect();
      bridgeWidth = Math.round(bridgeRect.width); bridgeHeight = Math.round(bridgeRect.height);
      if (bridgeContext) {
        bridgeCanvas.width = Math.round(bridgeWidth * dpr); bridgeCanvas.height = Math.round(bridgeHeight * dpr);
        bridgeContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      if (cinematic) cinematic.resize(bridgeWidth, bridgeHeight);
      draw(); drawBridge();
    }
    async function loadCinematic() {
      if (cinematicLoading || cinematic || !alive) return;
      cinematicLoading = true; cinematicObserver?.disconnect();
      // The fallback and WebGL share the browser image cache, but neither requests
      // the scene images until the bridge is approaching the viewport.
      artImages.forEach((image, i) => { image.src = arts[i].src; });
      creatorAtlas.src='/design-assets/creators-atlas-20261105.png';
      try {
        const module = await import('/assets/minds-cinematic-webgl.mjs');
        if (!alive) return;
        const candidate = document.createElement('canvas');
        candidate.className = 'minds-cinematic-webgl';
        Object.assign(candidate.style, {display:'block', width:'100%', flex:'1', minHeight:'0', height:'100%', pointerEvents:'auto', touchAction:'pan-y'});
        candidate.setAttribute('aria-hidden', 'true');
        const fallback = () => {
          if (!alive || cinematicCanvas !== candidate) return;
          cinematic?.dispose(); cinematic = null; candidate.remove(); cinematicCanvas = null;
          bridgeCanvas.style.display = ''; host.dataset.visual = 'canvas'; resize();
        };
        const instance = module.createCinematic({canvas: candidate, arts, links: sceneLinks.querySelectorAll('a'), requestRender: () => { if (alive) drawBridge(); }, onAssetError: fallback});
        if (!alive) { instance.dispose(); return; }
        cinematicCanvas = candidate; cinematic = instance;
        const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = '/assets/minds-cinematic-webgl.css';
        if (!document.querySelector('link[href="/assets/minds-cinematic-webgl.css"]')) document.head.append(css);
        stageWrap.insertBefore(candidate, bridgeCanvas); bridgeCanvas.style.display = 'none';
        host.dataset.visual = 'webgl';
        candidate.addEventListener('webglcontextlost', event => {
          event.preventDefault();
          if (!alive) return;
          fallback();
        }, {once:true});
        resize();
      } catch (_) { host.dataset.visual = 'canvas'; }
    }
    if ('IntersectionObserver' in window) {
      cinematicObserver = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) loadCinematic(); }, {rootMargin:'600px'});
      cinematicObserver.observe(bridge);
    } else loadCinematic();
    button.hidden = false;
    on(button, 'click', () => { paused = !paused; updateLabel(); draw(); drawBridge(); schedule(); });
    on(motionQuery, 'change', () => { if (motionQuery.matches) paused = true; updateLabel(); draw(); drawBridge(); schedule(); });
    on(document, 'visibilitychange', schedule);
    on(window, 'scroll', () => {
      if (paused) return;
      const rect = hero.getBoundingClientRect();
      progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height)));
      hero.style.setProperty('--minds-drift', String(progress * 12));
      const bridgeRect = bridge.getBoundingClientRect();
      bridgeProgress = clamp(-bridgeRect.top / Math.max(1, bridgeRect.height - stageWrap.clientHeight));
      if (bridgeVisible) drawBridge();
    }, { passive: true });
    const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
    if (resizeObserver) { resizeObserver.observe(hero); resizeObserver.observe(bridge); } else on(window, 'resize', resize);
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        else if (entry.target === bridge) bridgeVisible = entry.isIntersecting;
        else if (entry.target === gallery && entry.isIntersecting) gallery.dataset.revealed = 'true';
      }
      visible = heroVisible || bridgeVisible; schedule();
    }, { threshold: .01 }) : null;
    observer?.observe(hero); observer?.observe(bridge); observer?.observe(gallery);
    if (!observer) bridgeVisible = true;
    // Give the skip link an explicit keyboard destination without forcing smooth scrolling.
    on(host.querySelector('.minds-skip'), 'click', event => {
      event.preventDefault();
      gallery.scrollIntoView({ behavior: 'instant', block: 'start' });
      gallery.focus({ preventScroll: true });
    });
    updateLabel(); resize(); schedule();
    release = () => {
      alive = false; cancel(); listeners.forEach(fn => fn());
      observer?.disconnect(); resizeObserver?.disconnect(); cinematicObserver?.disconnect();
      cinematic?.dispose(); cinematicCanvas?.remove();
      button.hidden = true; bridge.remove();
    };
  }
  window.MindsLanding = { mount, destroy: () => release() };
})();
