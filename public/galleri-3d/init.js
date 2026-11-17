(()=>{'use strict';async function init(){
 const initialUrl=new URL(location.href);let catalog=null;
 try{const response=await fetch('/galleri-3d/catalog.json',{credentials:'same-origin'});if(response.ok){const data=await response.json();if(Array.isArray(data.items)){catalog=data.items.filter(x=>x&&typeof x.id==='string'&&x.name?.no&&x.name?.en&&typeof x.image==='string'&&x.image.startsWith('/')&&typeof x.thumbnail==='string'&&x.thumbnail.startsWith('/'));const books=Array.isArray(window.BookArt)?window.BookArt:[];if(catalog.length)window.GalleryArt=catalog.map(x=>{const book=books.find(b=>Number.isInteger(x.page)&&b.page===x.page);return book?{...book,id:x.id,src:x.thumbnail,full:x.image}:{id:x.id,src:x.thumbnail,full:x.image,no:x.name.no,en:x.name.en,tagNo:'Redaksjonell illustrasjon',tagEn:'Editorial illustration',editorial:true,previewAuthorized:x.previewAuthorized===true,artistName:x.artistName||'Innsatt 2601-46'};});}}}catch{}if(!catalog?.length){catalog=null;window.GalleryArt=Array.isArray(window.BookArt)?window.BookArt.filter(x=>x&&x.src&&x.full&&Number.isInteger(x.page)):[];}window.PremiumGallery.init(document);history.replaceState(null,'',initialUrl);
 const host=document.querySelector('#immersive-gallery');if(!host)return;
 const ui=value=>window.SFITranslate?.(value)||value;
 const en=location.pathname.startsWith('/en/'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let room=null;
 const lang=new URL(location.href).searchParams.get('lang')==='zh-Hans'?'zh':en?'en':'no';
 const text=(no,en,zh)=>lang==='zh'?zh:lang==='en'?en:no;
 const style=document.createElement('link');style.rel='stylesheet';style.href='/gallery-wall.css';document.head.append(style);
 const wall=document.createElement('section');wall.className='gallery-wall';wall.setAttribute('aria-label',text('Gallerivegg','Gallery wall','画廊展墙'));
 const rail=document.createElement('nav');rail.className='gallery-wall-rail';rail.setAttribute('aria-label',text('Galleri','Gallery','画廊'));
 const pictures=document.createElement('div');pictures.className='gallery-wall-pictures';
 const all=document.createElement('button');all.type='button';all.textContent=text('Alle verk','All works','全部作品');
 const artist=document.createElement('select');artist.setAttribute('aria-label',text('Velg kunstnernummer','Select artist number','选择艺术家编号'));artist.add(new Option(text('Alle kunstnere','All artists','全部艺术家'),''));
 for(const [id,name] of new Map((catalog||[]).map(x=>[x.artistId,x.artistName])))if(id)artist.add(new Option(name,id));
 const about=document.createElement('button');about.type='button';about.textContent=text('Om kunstneren','About the artist','关于艺术家');
 const overview=document.createElement('button');overview.type='button';overview.textContent=text('Bildeoversikt og søk','Image overview and search','图片概览与搜索');
 const dialog=document.createElement('dialog');dialog.className='gallery-wall-about';const paragraph=document.createElement('p');paragraph.textContent=text('Kunstnerens egen presentasjonstekst er ennå ikke levert. Verkene er kreditert Innsatt 2601-46.','The artist’s own statement has not yet been supplied. The works are credited to Innsatt 2601-46.','艺术家尚未提供个人介绍。这些作品署名为 Innsatt 2601-46。');const close=document.createElement('button');close.type='button';close.textContent=text('Lukk','Close','关闭');close.addEventListener('click',()=>dialog.close());dialog.append(paragraph,close);document.body.append(dialog);about.addEventListener('click',()=>dialog.showModal());
 function openWallArtwork(item, trigger) {
  const overviewWasHidden = host.hidden;
  const previousUrl = location.href;
  host.hidden = false;
  if (!host.openGalleryArtwork?.(item.id, trigger)) {
   host.hidden = overviewWasHidden;
   return;
  }
  document.querySelector('.ig-dialog[open]')?.addEventListener('close', () => {
   host.hidden = overviewWasHidden;
   history.replaceState(history.state, '', previousUrl);
   trigger.focus({preventScroll: true});
  }, {once: true});
 }
 const paint=()=>{pictures.replaceChildren();for(const item of catalog||[]){if(artist.value&&item.artistId!==artist.value)continue;const figure=document.createElement('figure'),open=document.createElement('button'),image=document.createElement('img'),caption=document.createElement('figcaption');open.type='button';open.setAttribute('aria-label',text('Åpne ','Open ','打开 ')+(en?item.name.en:item.name.no));image.src=item.thumbnail;image.alt=en?item.name.en:item.name.no;image.loading='lazy';open.append(image);caption.textContent=(en?item.name.en:item.name.no)+' · '+item.artistName;open.addEventListener('click',()=>openWallArtwork(item,open));figure.append(open,caption);pictures.append(figure)}};
 artist.addEventListener('change',paint);all.addEventListener('click',()=>{artist.value='';paint();host.hidden=true;wall.hidden=false});overview.addEventListener('click',()=>{host.hidden=!host.hidden;if(!host.hidden)host.scrollIntoView({block:'start',behavior:'instant'})});
 rail.append(all,artist,about,overview);wall.append(rail,pictures);host.before(wall);host.hidden=true;paint();
 const button=document.createElement('button');button.type='button';button.className='gw-enter';button.textContent=text('Vis i VR / gallerirom','View in VR / gallery room','VR / 画廊空间');rail.append(button);
 for (const [path, label] of [
  [en ? '/en/collaborate/' : '/collaborate/', text('Kontakt og samarbeid','Contact and collaboration','联系与合作')],
  [en ? '/en/creative-community/#rettigheter' : '/kunstfellesskap/#rettigheter', text('Om galleriet','About the gallery','关于画廊')]
 ]) {
  const link = document.createElement('a');
  const destination = new URL(path, location.origin);
  if (lang === 'zh') destination.searchParams.set('lang','zh-Hans');
  link.href = destination.href;
  link.textContent = label;
  rail.append(link);
 }
 const note=document.createElement('p');note.className='gw-note';note.setAttribute('role','status');wall.append(note);
 const unavailable=text('Gallerirommet kunne ikke lastes. Bruk bildeoversikten og søket nedenfor.','The gallery room could not load. Use the image overview and search below.','画廊空间暂时无法加载。请使用下方的图片概览与搜索。');
 const update=()=>{if(reduced.matches&&room){room.destroy();room=null}button.hidden=!catalog;button.disabled=reduced.matches;all.disabled=artist.disabled=about.disabled=!catalog;note.textContent=!catalog?unavailable:reduced.matches?text('Redusert bevegelse er valgt. Galleriveggen er statisk.','Reduced motion is enabled. The gallery wall is static.','已启用减少动态效果。展墙保持静止。'):'';if(!catalog){wall.hidden=false;host.hidden=false}};update();reduced.addEventListener('change',update);
 const enter=async()=>{if(reduced.matches||!catalog||button.disabled)return;button.disabled=true;try{
  const {createRoom}=await import('/gallery-webgl.mjs');if(reduced.matches){update();return}if(!catalog)throw Error('catalog unavailable');
  const items=catalog.filter(item=>!artist.value||item.artistId===artist.value).map(x=>({id:x.id,no:x.name.no,en:x.name.en,src:x.thumbnail,full:x.image,page:x.page,artistName:x.artistName}));
  const priority=['fri-presse','gjenbruk','book-page-256','book-page-22','book-page-34','lar-bak-murene']; const rank=x=>{const i=priority.indexOf(x.id);return i<0?priority.length:i};
  items.sort((a,b)=>rank(a)-rank(b)||(a.page??Infinity)-(b.page??Infinity));if(!items.length)throw Error('empty catalog');
  const requested=new URLSearchParams(location.search).get('art');const initialIndex=Math.max(0,items.findIndex(x=>x.id===requested));
  const exit=()=>{room=null;host.hidden=true;wall.hidden=false;button.hidden=false;button.disabled=false;const url=new URL(location.href);url.searchParams.set('view','2d');history.replaceState(null,'',url);const other=document.querySelector('[data-gallery-language]');if(other)other.href=(en?'/galleri-3d/':'/en/galleri-3d/')+url.search;button.focus()};
  room=createRoom(host,items,{en,initialIndex,onExit:exit,onOpen:item=>{
   room.destroy();room=null;host.hidden=false;wall.hidden=false;button.disabled=false;host.openGalleryArtwork?.(item.id);
  }});host.hidden=true;wall.hidden=true;button.hidden=false;note.textContent='';const exitButton=host.previousElementSibling?.querySelector('.gw-exit');if(exitButton)exitButton.textContent=ui(en?'Image overview':'Bildeoversikt');const url=new URL(location.href);url.searchParams.set('view','3d');history.replaceState(null,'',url);const other=document.querySelector('[data-gallery-language]');if(other)other.href=(en?'/galleri-3d/':'/en/galleri-3d/')+url.search;
 }catch{button.disabled=reduced.matches;wall.hidden=false;host.hidden=false;note.textContent=unavailable}};button.addEventListener('click',enter);if(initialUrl.searchParams.get('view')==='3d'&&!reduced.matches)enter();else if(initialUrl.searchParams.has('art')){host.hidden=false;if(!host.openGalleryArtwork?.(initialUrl.searchParams.get('art')))note.textContent=text('Verket i lenken ble ikke funnet i det tilgjengelige galleriet. Du kan fortsatt utforske de andre verkene.','The linked artwork was not found in the available gallery. You can still explore the other works.','当前画廊中未找到链接所指的作品。您仍可浏览其他作品。');}
 }if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();
