(()=>{'use strict';async function init(){
 let catalog=null;
 try{const response=await fetch('/galleri-3d/catalog.json',{credentials:'same-origin'});if(response.ok){const data=await response.json();if(Array.isArray(data.items)){catalog=data.items.filter(x=>x&&typeof x.id==='string'&&x.name?.no&&x.name?.en&&typeof x.image==='string'&&x.image.startsWith('/')&&typeof x.thumbnail==='string'&&x.thumbnail.startsWith('/'));const books=Array.isArray(window.BookArt)?window.BookArt:[];window.GalleryArt=catalog.map(x=>{const book=books.find(b=>Number.isInteger(x.page)&&b.page===x.page);return book?{...book,id:x.id}:{id:x.id,src:x.thumbnail,full:x.image,no:x.name.no,en:x.name.en,tagNo:'Redaksjonell illustrasjon',tagEn:'Editorial illustration',editorial:true,previewAuthorized:x.previewAuthorized===true,artistName:x.artistName||'Innsatt 2601-46'};});}}}catch{}window.PremiumGallery.init(document);
 const host=document.querySelector('#immersive-gallery');if(!host)return;
 const en=location.pathname.startsWith('/en/'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let room=null;
 const button=document.createElement('button');button.type='button';button.className='gw-enter';button.textContent=en?'Enter the 3D room →':'Gå inn i 3D-rommet →';
 const note=document.createElement('p');note.className='gw-note';note.setAttribute('role','status');host.before(button,note);
 const update=()=>{if(reduced.matches&&room){room.destroy();room=null}button.hidden=reduced.matches;note.textContent=reduced.matches?(en?'The accessible gallery is shown because reduced motion is enabled.':'Den tilgjengelige bildeoversikten vises fordi redusert bevegelse er valgt.'):''};update();reduced.addEventListener('change',update);
 button.addEventListener('click',async()=>{button.disabled=true;try{
  const {createRoom}=await import('/gallery-webgl.mjs');if(!catalog)throw Error('catalog unavailable');
  const items=catalog.map(x=>({id:x.id,no:x.name.no,en:x.name.en,src:x.thumbnail,full:x.image,page:x.page,artistName:x.artistName}));
  const priority=['lar-bak-murene','fri-presse','gjenbruk']; const rank=x=>{const i=priority.indexOf(x.id);return i<0?priority.length:i};
  items.sort((a,b)=>rank(a)-rank(b)||(a.page??Infinity)-(b.page??Infinity));if(!items.length)throw Error('empty catalog');
  const requested=new URLSearchParams(location.search).get('art');const initialIndex=Math.max(0,items.findIndex(x=>x.id===requested));
  const exit=()=>{room=null;host.hidden=false;button.hidden=reduced.matches;button.disabled=false;button.focus()};
  room=createRoom(host,items,{en,initialIndex,onExit:exit,onOpen:item=>{
   room.destroy();host.openGalleryArtwork?.(item.id);
  }});host.hidden=true;button.hidden=true;note.textContent='';
 }catch{button.disabled=false;note.textContent=en?'The 3D room is unavailable. The gallery below is ready to explore.':'3D-rommet er ikke tilgjengelig. Du kan utforske galleriet nedenfor.'}})
 }if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();
