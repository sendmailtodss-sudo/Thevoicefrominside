/* Artwork remains untouched; this adds a local, non-interactive light field. */
(() => {
  'use strict';
  const hero = document.querySelector('.ac-hero, .ig-hero, .ac-detail-grid');
  if (!hero || hero.dataset.sfiArtMotion) return;
  hero.dataset.sfiArtMotion='true';hero.classList.add('sfi-motion-hero');
  const locale = new URL(location.href).searchParams.get('lang') === 'zh-Hans' ? 'zh' : document.documentElement.lang.startsWith('en') ? 'en' : 'no';
  const labels = {no:['Pause bevegelse','Start bevegelse'],en:['Pause motion','Start motion'],zh:['暂停动态效果','开启动画']};
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  let stopped=false;try {stopped=sessionStorage.getItem('sfi-page-motion')==='off'}catch(_){}
  const canvas=document.createElement('canvas');canvas.className='sfi-art-motion';canvas.setAttribute('aria-hidden','true');hero.prepend(canvas);
  let context;try{context=canvas.getContext('2d')}catch(_){}if(!context){canvas.remove();return}
  const button=document.createElement('button');button.type='button';button.className='sfi-art-motion-switch';
  (hero.querySelector('.ac-hero-copy, .ig-hero-aside, .ac-detail-copy')||hero).append(button);
  let width=0,height=0,raf=0,start=0,last=0,visible=true;
  function size(){const r=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5);width=r.width;height=r.height;canvas.width=Math.max(1,Math.round(width*ratio));canvas.height=Math.max(1,Math.round(height*ratio));context.setTransform(ratio,0,0,ratio,0,0);draw(0)}
  function yAt(x,t,k){return height*(.52+k*.10)+Math.sin(x/width*6.28+t*.20+k)*Math.min(height*.075,80)}
  function draw(ms){
    context.clearRect(0,0,width,height);if(!width||!height)return;const t=ms/1000;
    const glow=context.createRadialGradient(width*.74,height*.45,0,width*.74,height*.45,width*.5);glow.addColorStop(0,'rgba(181,139,72,.18)');glow.addColorStop(1,'rgba(181,139,72,0)');context.fillStyle=glow;context.fillRect(0,0,width,height);
    const colours=['rgba(192,155,100,.34)','rgba(215,182,128,.25)','rgba(125,179,180,.20)','rgba(198,151,82,.25)'];
    for(let k=0;k<4;k++){context.beginPath();for(let i=0;i<=80;i++){const x=i/80*width,y=yAt(x,t,k-1.5);if(!i)context.moveTo(x,y);else context.lineTo(x,y)}context.strokeStyle=colours[k];context.lineWidth=1;context.stroke()}
    for(let i=0;i<14;i++){const k=(i%4)-1.5,x=width*((i*.173+t*.013+.03)%1),y=yAt(x,t,k);context.beginPath();context.arc(x,y,1.2+(i%3)*.5,0,Math.PI*2);context.fillStyle='rgba(230,191,125,.70)';context.shadowColor='#e0b76f';context.shadowBlur=7;context.fill();context.shadowBlur=0}
  }
  function frame(now){raf=0;if(stopped||mq.matches||document.hidden||!visible)return;if(!start)start=now;if(now-last>48){draw(now-start);last=now}raf=requestAnimationFrame(frame)}
  function update(){button.hidden=mq.matches;button.textContent=labels[locale][stopped?1:0];button.setAttribute('aria-pressed',String(stopped));if(stopped||mq.matches||document.hidden||!visible){cancelAnimationFrame(raf);raf=0;draw(0)}else if(!raf)raf=requestAnimationFrame(frame)}
  button.addEventListener('click',()=>{stopped=!stopped;try{sessionStorage.setItem('sfi-page-motion',stopped?'off':'on')}catch(_){}update()});
  document.addEventListener('visibilitychange',update);mq.addEventListener('change',update);window.addEventListener('resize',size,{passive:true});
  const observer='IntersectionObserver' in window?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update()},{threshold:0}):null;observer?.observe(hero);
  window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;observer?.disconnect()});
  window.addEventListener('pageshow',event=>{if(event.persisted){observer?.observe(hero);size();update()}});
  size();update();
})();
