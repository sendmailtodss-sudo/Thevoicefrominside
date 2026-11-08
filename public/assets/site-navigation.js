/* Navigation enhancement only: no network, tracking, storage or forced scrolling. */
(()=>{'use strict';
 const header=document.querySelector('[data-site-navigation]');if(!header)return;
 const button=header.querySelector('[data-menu-toggle]'),nav=header.querySelector('nav');
 const small=matchMedia('(max-width:780px)');
 function setOpen(open){header.dataset.collapsed=String(!open);button?.setAttribute('aria-expanded',String(open));}
 setOpen(!small.matches);
 button?.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));
 const disclosures=[...header.querySelectorAll('.sfi-section details')];
 function closeDisclosures(except){for(const detail of disclosures)if(detail!==except)detail.open=false;}
 header.addEventListener('click',e=>{
  const summary=e.target.closest('summary');
  if(summary)closeDisclosures(summary.parentElement);
 });
 document.addEventListener('click',e=>{if(!header.contains(e.target))closeDisclosures();});
 header.addEventListener('keydown',e=>{
  if(e.key!=='Escape')return;
  const open=disclosures.find(detail=>detail.open);
  if(open){e.stopImmediatePropagation();open.open=false;open.querySelector('summary')?.focus();}
 });
 header.addEventListener('keydown',e=>{if(e.key==='Escape'&&small.matches&&button.getAttribute('aria-expanded')==='true'){setOpen(false);button.focus();}});
 small.addEventListener('change',()=>setOpen(!small.matches));
 nav?.addEventListener('click',e=>{if(small.matches&&e.target.closest('a'))setOpen(false)});
 // Artwork and topic query state follows the native-language route switch.
 header.querySelectorAll('[data-language-link]').forEach(link=>{
  const url=new URL(link.href);for(const key of ['art','artist','topic']){const value=new URL(location.href).searchParams.get(key);if(value)url.searchParams.set(key,value)}
  link.href=url.href;
 });
})();

/* Optional, local section visuals; original content stays available without scripts. */
(()=>{function load(){
 const path=location.pathname.replace(/^\/en(?=\/)/,'');
 const add=(css,js)=>{if(!document.querySelector('link[href="'+css+'"]')){const l=document.createElement('link');l.rel='stylesheet';l.href=css;document.head.append(l)}const s=document.createElement('script');s.src=js;s.defer=true;document.head.append(s)};
 if(document.querySelector('.ac-hero, .ig-hero, .ac-detail-grid'))add('/assets/subpage-art.css','/assets/subpage-art.js');
 if(/^\/(dagbok|boken|kapitler|kapittel-9|kapittel-10|kapittel-11|presse|juridisk-motvekt)(\/|$)/.test(path))add('/assets/section-motion/story-motion.css','/assets/section-motion/story-motion.js');
 }if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load()})();
