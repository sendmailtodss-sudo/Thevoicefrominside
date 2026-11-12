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
function dispose(){disposed=true;cancelAnimationFrame(frame);removeEventListener('scroll',request);removeEventListener('resize',request);motion.removeEventListener('change',request)}
addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});motion.addEventListener('change',request);
addEventListener('pagehide',dispose);addEventListener('pageshow',event=>{if(event.persisted){disposed=false;addEventListener('scroll',request,{passive:true});addEventListener('resize',request,{passive:true});motion.addEventListener('change',request);request()} });
paint();
})();
