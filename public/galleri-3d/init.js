(()=>{'use strict';async function init(){
 const initialUrl=new URL(location.href);let catalog=null;
 try{const response=await fetch('/galleri-3d/catalog.json',{credentials:'same-origin'});if(response.ok){const data=await response.json();if(Array.isArray(data.items)){catalog=data.items.filter(x=>x&&typeof x.id==='string'&&x.name?.no&&x.name?.en&&typeof x.image==='string'&&x.image.startsWith('/')&&typeof x.thumbnail==='string'&&x.thumbnail.startsWith('/'));const books=Array.isArray(window.BookArt)?window.BookArt:[];window.GalleryArt=catalog.map(x=>{const book=books.find(b=>Number.isInteger(x.page)&&b.page===x.page);return book?{...book,id:x.id,src:x.thumbnail,full:x.image}:{id:x.id,src:x.thumbnail,full:x.image,no:x.name.no,en:x.name.en,tagNo:'Redaksjonell illustrasjon',tagEn:'Editorial illustration',editorial:true,previewAuthorized:x.previewAuthorized===true,artistName:x.artistName||'Innsatt 2601-46'};});}}}catch{}window.PremiumGallery.init(document);history.replaceState(null,'',initialUrl);
 const host=document.querySelector('#immersive-gallery');if(!host)return;
 const en=location.pathname.startsWith('/en/'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let room=null;
 const button=document.createElement('button');button.type='button';button.className='gw-enter';button.textContent=en?'Gallery room':'Gallerirom';
 const note=document.createElement('p');note.className='gw-note';note.setAttribute('role','status');host.before(button,note);
 const update=()=>{if(reduced.matches&&room){room.destroy();room=null}button.hidden=reduced.matches;note.textContent=reduced.matches?(en?'The accessible gallery is shown because reduced motion is enabled.':'Den tilgjengelige bildeoversikten vises fordi redusert bevegelse er valgt.'):''};update();reduced.addEventListener('change',update);
 const enter=async()=>{button.disabled=true;try{
  const {createRoom}=await import('/gallery-webgl.mjs');if(!catalog)throw Error('catalog unavailable');
  const items=catalog.map(x=>({id:x.id,no:x.name.no,en:x.name.en,src:x.thumbnail,full:x.image,page:x.page,artistName:x.artistName}));
  const priority=['fri-presse','gjenbruk','book-page-256','book-page-22','book-page-34','lar-bak-murene']; const rank=x=>{const i=priority.indexOf(x.id);return i<0?priority.length:i};
  items.sort((a,b)=>rank(a)-rank(b)||(a.page??Infinity)-(b.page??Infinity));if(!items.length)throw Error('empty catalog');
  const requested=new URLSearchParams(location.search).get('art');const initialIndex=Math.max(0,items.findIndex(x=>x.id===requested));
  const exit=()=>{room=null;host.hidden=false;button.hidden=reduced.matches;button.disabled=false;const url=new URL(location.href);url.searchParams.set('view','2d');history.replaceState(null,'',url);const other=document.querySelector('[data-gallery-language]');if(other)other.href=(en?'/galleri-3d/':'/en/galleri-3d/')+url.search;button.focus()};
  room=createRoom(host,items,{en,initialIndex,onExit:exit,onOpen:item=>{
   room.destroy();host.openGalleryArtwork?.(item.id);
  }});host.hidden=true;button.hidden=true;note.textContent='';const exitButton=host.previousElementSibling?.querySelector('.gw-exit');if(exitButton)exitButton.textContent=en?'Image overview':'Bildeoversikt';const url=new URL(location.href);url.searchParams.set('view','3d');history.replaceState(null,'',url);const other=document.querySelector('[data-gallery-language]');if(other)other.href=(en?'/galleri-3d/':'/en/galleri-3d/')+url.search;
 }catch{button.disabled=false;note.textContent=en?'The gallery room is unavailable. Explore the image overview below.':'Gallerirommet er ikke tilgjengelig. Du kan utforske bildeoversikten nedenfor.'}};button.addEventListener('click',enter);if(!reduced.matches&&initialUrl.searchParams.get('view')!=='2d')enter();
 }if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();
