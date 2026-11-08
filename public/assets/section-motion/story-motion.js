/* Decorative section identities. Original text, media and services are untouched. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg'; let mounted=null, meter=null, cleanup=()=>{};
const el=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);return n};
function classify(path){const p=path.replace(/^\/en(?=\/)/,'');if(/^\/(dagbok|boken|kapitler|kapittel-9|kapittel-10|kapittel-11)(\/|$)/.test(p))return 'diary';if(/^\/presse(\/|$)/.test(p))return 'press';if(/^\/juridisk-motvekt(\/|$)/.test(p))return 'justice';return null}
function path(svg,d,cls){svg.append(el('path',{d,class:cls}))}
function rect(svg,x,y,w,h,cls){svg.append(el('rect',{x,y,width:w,height:h,rx:'2',class:cls}))}
function diary(svg){
 path(svg,'M112 226 L112 60 L239 46 L239 239','ss-door');path(svg,'M121 220 L121 68 L229 56 L229 225','ss-door-inner');path(svg,'M127 224 L125 70 L216 60 L216 227 Z','ss-light-door');
 path(svg,'M199 229 L445 283 L675 283 L220 210 Z','ss-beam');
 path(svg,'M325 82 L488 75 L509 228 L344 238 Z','ss-paper');
 for(let i=0;i<7;i++){let y=112+i*15;path(svg,`M${351+i} ${y} C${372+i} ${y-5} ${382+i} ${y+4} ${397+i} ${y-1} S${425+i} ${y+4} ${i%2?473:455} ${y-3}`,'ss-ink ss-ink-'+i)}
 for(let i=0;i<12;i++){const c=el('circle',{cx:260+i*22,cy:55+(i*37)%175,r:i%3===0?1.5:1,class:'ss-dust ss-dust-'+i%4});svg.append(c)}
}
function evidence(svg,justice){
 path(svg,'M0 242 L720 51 L720 187 L0 300 Z','ss-reveal');
 path(svg,'M177 154 C255 149 263 102 350 103 S461 158 545 150','ss-link ss-link-a');path(svg,'M174 168 C260 196 293 209 360 183 S473 120 548 164','ss-link ss-link-b');
 const pages=[[112,80],[315,49],[520,95]];for(const [j,[x,y]] of pages.entries()){
  rect(svg,x,y,100,126,'ss-document ss-document-'+j);for(let i=0;i<5;i++)path(svg,`M${x+17} ${y+29+i*14} h${i===4?42:(i%2?55:65)}`,'ss-source-line');
  const c=el('circle',{cx:x+50,cy:y+144,r:'3',class:'ss-node'});svg.append(c);
 }
 if(justice){path(svg,'M350 8 v38 M325 16 h50 M335 16 l-11 24 h22 Z M365 16 l-11 24 h22 Z','ss-balance')}
}
function init(){
 const type=classify(location.pathname), main=document.querySelector('main');
 if(!type||!main){cleanup();mounted?.remove();meter?.remove();mounted=null;meter=null;return}
 if(mounted?.isConnected&&mounted.dataset.storyMotion===type)return;
 cleanup();mounted?.remove();meter?.remove();meter=null; const wrap=document.createElement('div');wrap.className='ss-cinematic';wrap.dataset.storyMotion=type;
 const svg=el('svg',{viewBox:'0 0 720 300',preserveAspectRatio:'xMidYMid slice',focusable:'false','aria-hidden':'true'});
 if(type==='diary')diary(svg);else evidence(svg,type==='justice');wrap.append(svg);
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),button=document.createElement('button');button.type='button';button.className='ss-motion-toggle';const locale=new URL(location.href).searchParams.get('lang')==='zh-Hans'?'zh':document.documentElement.lang.startsWith('en')?'en':'no';
 const labels={no:['Pause animasjon','Start animasjon','Bevegelse av'],en:['Pause animation','Start animation','Motion off'],zh:['暂停动画','启动动画','动画已关闭']}[locale];let stopped=false;try{stopped=sessionStorage.getItem('sfi-page-motion')==='off'}catch{}
 const sync=()=>{const off=motion.matches||stopped;wrap.dataset.storyPaused=String(off);if(meter)meter.dataset.quiet=String(off);button.textContent=motion.matches?labels[2]:labels[off?1:0];button.disabled=motion.matches;button.setAttribute('aria-pressed',String(off))};
 const toggle=()=>{stopped=!stopped;try{sessionStorage.setItem('sfi-page-motion',stopped?'off':'on')}catch{}sync()};button.addEventListener('click',toggle);motion.addEventListener('change',sync);wrap.append(button);sync();cleanup=()=>{button.removeEventListener('click',toggle);motion.removeEventListener('change',sync)};
 const heading=main.querySelector('h1');const book=/^\/(boken|kapitler|kapittel-9|kapittel-10|kapittel-11)(\/|$)/.test(location.pathname.replace(/^\/en(?=\/)/,''));
 if(book&&heading){if(!heading.id)heading.id='ss-reading-start';const skip=document.createElement('a');skip.className='ss-reading-skip';skip.href='#'+heading.id;skip.textContent=locale==='en'?'Go straight to the text ↓':locale==='zh'?'直接阅读正文 ↓':'Gå rett til teksten ↓';wrap.append(skip);
 meter=document.createElement('div');meter.className='ss-reading-meter';meter.setAttribute('aria-hidden','true');const bar=document.createElement('span');meter.append(bar);document.body.append(meter);let frame=0;
 const render=()=>{frame=0;const span=Math.max(1,document.documentElement.scrollHeight-innerHeight),value=Math.max(0,Math.min(1,scrollY/span));meter.style.setProperty('--ss-reading-progress',String(value));meter.dataset.quiet=String(motion.matches||stopped)};
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(render)};addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);schedule();const previous=cleanup;cleanup=()=>{previous();removeEventListener('scroll',schedule);removeEventListener('resize',schedule);cancelAnimationFrame(frame)};
 }
 if(heading?.parentElement)heading.parentElement.insertBefore(wrap,heading);else main.prepend(wrap);
 mounted=wrap;
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
for(const name of ['routechange','premium:routechange'])window.addEventListener(name,init);
window.StemmenStoryMotion={init,destroy(){cleanup();mounted?.remove();meter?.remove();mounted=null;meter=null}};
})();
