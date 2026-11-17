/* One requested paint per native scroll/layout change; no autonomous animation. */
(()=>{
'use strict';
const body=document.body;
if(!body||!['story','art'].includes(body.dataset.siteDirection)||body.dataset.directionAtmosphere==='ready')return;
body.dataset.directionAtmosphere='ready';
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let frame=0,disposed=false;
function paint(){
 frame=0;if(disposed)return;
 const progress=motion.matches?0:Math.min(1,Math.max(0,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)));
 body.style.setProperty('--direction-y',`${(-64*progress).toFixed(3)}px`);
 body.style.setProperty('--direction-x',`${(24*progress).toFixed(3)}px`);
}
function request(){if(!disposed&&!frame)frame=requestAnimationFrame(paint)}
function dispose(){disposed=true;cancelAnimationFrame(frame);frame=0;removeEventListener('scroll',request);removeEventListener('resize',request);motion.removeEventListener('change',request)}
addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});motion.addEventListener('change',request);
addEventListener('pagehide',dispose);addEventListener('pageshow',event=>{if(event.persisted){disposed=false;addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});motion.addEventListener('change',request);request()} });
paint();
})();

/* Intentional up/down navigation; no layout shift and no hidden focused menu. */
(()=>{
 'use strict';
 const header=document.querySelector('[data-site-navigation]');
 if(!header||!['story','art'].includes(document.body.dataset.siteDirection))return;
 const small=matchMedia('(max-width:780px)');
 let previous=Math.max(0,scrollY),distance=0,sign=0,frame=0;
 const pinned=()=>header.contains(document.activeElement)||!!header.querySelector('details[open]')||(small.matches&&header.dataset.collapsed==='false');
 const reveal=()=>{header.removeAttribute('data-scroll-hidden');distance=0};
 function update(){
  frame=0;const y=Math.max(0,scrollY),delta=y-previous;previous=y;
  if(pinned()||y<96){reveal();return}
  const next=Math.sign(delta);if(!next)return;
  if(next!==sign){distance=0;sign=next}distance+=Math.abs(delta);
  if(next<0&&distance>=22)reveal();
  else if(next>0&&distance>=64)header.dataset.scrollHidden='true';
 }
 function request(){if(!frame)frame=requestAnimationFrame(update)}
 addEventListener('scroll',request,{passive:true});
 header.addEventListener('focusin',reveal);
 header.addEventListener('sfi-menu-change',()=>{if(pinned())reveal()});
 small.addEventListener('change',()=>{previous=Math.max(0,scrollY);sign=0;reveal()});
 header.addEventListener('toggle',()=>{if(pinned())reveal()},true);
 addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0});
 addEventListener('pageshow',()=>{previous=Math.max(0,scrollY);sign=0;reveal()});
})();
