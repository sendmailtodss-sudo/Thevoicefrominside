/* Navigation enhancement only: no network, tracking, storage or forced scrolling. */
(()=>{'use strict';
 const header=document.querySelector('[data-site-navigation]');if(!header)return;
 const button=header.querySelector('[data-menu-toggle]'),nav=header.querySelector('nav');
 const small=matchMedia('(max-width:780px)');
 function setOpen(open){header.dataset.collapsed=String(!open);button?.setAttribute('aria-expanded',String(open));}
 setOpen(!small.matches);
 button?.addEventListener('click',()=>setOpen(button.getAttribute('aria-expanded')!=='true'));
 header.addEventListener('keydown',e=>{if(e.key==='Escape'&&small.matches&&button.getAttribute('aria-expanded')==='true'){setOpen(false);button.focus();}});
 small.addEventListener('change',()=>setOpen(!small.matches));
 nav?.addEventListener('click',e=>{if(small.matches&&e.target.closest('a'))setOpen(false)});
 // Artwork and topic query state follows the native-language route switch.
 header.querySelectorAll('[data-language-link]').forEach(link=>{
  const url=new URL(link.href);for(const key of ['art','artist','topic']){const value=new URL(location.href).searchParams.get(key);if(value)url.searchParams.set(key,value)}
  link.href=url.href;
 });
})();
