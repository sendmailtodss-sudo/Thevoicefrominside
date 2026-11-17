/* Local gallery controls. No submissions, payments or automatic external requests. */
(()=>{'use strict';
const en=document.body.dataset.artLanguage==='en',t=(no,english)=>en?english:no;
const allowedLang=new Set(['zh-Hans','yue-Hant']);
const redirect=document.body.dataset.artRedirect;
if(redirect){const next=new URL(redirect,location.origin);next.search=location.search;next.hash=location.hash;location.replace(next.href);return;}
const language=document.getElementById('language-select');
language?.addEventListener('change',()=>{if(!['no','en'].includes(language.value))return;const path=language.value==='en'?language.dataset.enPath:language.dataset.noPath;if(!path)return;const next=new URL(path,location.origin);next.search=location.search;next.searchParams.delete('lang');next.hash=location.hash;location.assign(next.href);});
const params=new URL(location.href).searchParams,requested=params.get('art');
const cards=[...document.querySelectorAll('[data-art-id]')];
if(requested&&cards.length){const match=cards.find(card=>card.dataset.artId===requested);if(match){const next=new URL(match.querySelector('a').href);const lang=params.get('lang');if(allowedLang.has(lang))next.searchParams.set('lang',lang);location.replace(next.href);return;}}
const search=document.getElementById('art-search'),filters=[...document.querySelectorAll('[data-art-filter]')];
/* Preserve this tab's gallery context; search text never enters share URLs. */
const galleryPath=en?'/en/creative-community/':'/kunstfellesskap/';
const galleryKey=galleryPath+'|'+(params.get('lang')||'');
const galleryStorageKey='sfi-gallery-return-v1:'+galleryKey;
const galleryLanguageKey='sfi-gallery-language-v1';
// Canonical category IDs connect the existing NO/EN labels; queries stay original.
const galleryCategoryLabels={all:['all'],art:['Kunst','Art'],dream:['Drømmebilder','Dream images'],system:['System'],family:['Familie','Family'],records:['Innsyn','Records'],person:['Mennesket','The person'],future:['Veien videre','A way forward']};
const categoryId=label=>Object.keys(galleryCategoryLabels).find(id=>galleryCategoryLabels[id].includes(label))||null;
function languageGalleryState(){try{const value=JSON.parse(sessionStorage.getItem(galleryLanguageKey));sessionStorage.removeItem(galleryLanguageKey);return value&&Number.isFinite(value.expiresAt)&&value.expiresAt>=Date.now()&&value.expiresAt<=Date.now()+60000?validGalleryState(value.state):null}catch{return null}}

function validGalleryState(value){
 return value&&value.version===1&&value.key===galleryKey&&typeof value.query==='string'&&value.query.length<=160&&typeof value.category==='string'&&value.category.length<=80&&(value.artTop==null||Number.isFinite(value.artTop)&&Math.abs(value.artTop)<=1e7)&&Number.isFinite(value.scrollY)&&value.scrollY>=0&&value.scrollY<=1e7&&(value.artId===null||typeof value.artId==='string'&&/^[a-z0-9][a-z0-9-]{0,100}$/i.test(value.artId))?value:null;
}
function storedGalleryState(){try{return validGalleryState(JSON.parse(sessionStorage.getItem(galleryStorageKey)))}catch{return null}}
function historyGalleryState(){try{return validGalleryState(history.state?.sfiGallery)}catch{return null}}
// Only explicit links back from a work request the tab's last gallery view.
if(document.querySelector('[data-selected-art]')&&storedGalleryState()){
 document.querySelectorAll('.ac-breadcrumb a').forEach(link=>{
  const url=new URL(link.href,location.href);
  if(url.origin===location.origin&&url.pathname===galleryPath&&url.hash==='#galleri'){
   url.searchParams.set('gallery-return','1');
   const lang=params.get('lang');if(allowedLang.has(lang))url.searchParams.set('lang',lang);
   link.href=url.href;
  }
 });
}
if(cards.length&&search){
 document.querySelector('[data-art-tools]').hidden=false;
 const categories=new Set(filters.map(button=>button.dataset.artFilter));
 const localCategory=id=>[...categories].find(label=>categoryId(label)===id);
 let category='all',selectedArt=null,restoring=false,pendingRestore=null,lastVisibleGallery=null,languageDeparture=null,headerGalleryView=null,userGalleryView=null,readingUntil=0;
 // Keep an in-memory viewport anchor while the visitor reads art. Opening a
 // sticky header may move the page before the language action is dispatched.
 const rememberViewport=()=>{if(restoring)return;const card=cards.find(card=>{const box=card.getBoundingClientRect();return !card.hidden&&box.bottom>110&&box.top<innerHeight});if(card){lastVisibleGallery={artId:card.dataset.artId,artTop:card.getBoundingClientRect().top,scrollY};if(performance.now()<readingUntil)userGalleryView=lastVisibleGallery}};
 addEventListener('scroll',rememberViewport,{passive:true});
 const header=document.querySelector('[data-site-navigation]');
 const rememberHeaderEntry=event=>{if(header?.contains(event.target)){readingUntil=0;if(!headerGalleryView)headerGalleryView=lastVisibleGallery}else headerGalleryView=null};
 document.addEventListener('pointerdown',rememberHeaderEntry,true);
 document.addEventListener('focusin',rememberHeaderEntry,true);
 const rememberReadingGesture=()=>{if(!header?.querySelector('details[open]'))readingUntil=performance.now()+500};
 addEventListener('wheel',rememberReadingGesture,{passive:true});
 addEventListener('touchmove',rememberReadingGesture,{passive:true});
 header?.addEventListener('toggle',()=>{if(!header.querySelector('details[open]'))headerGalleryView=null},true);
 const cancelPending=()=>{pendingRestore=null;restoring=false};
 for(const type of ['pointerdown','keydown','wheel','touchstart'])addEventListener(type,cancelPending,{passive:true});
 addEventListener('sfi-language-ready',()=>{if(pendingRestore)restore(pendingRestore)},{once:true});
 document.fonts?.ready.then(()=>{if(pendingRestore)restore(pendingRestore)});
 const normalize=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase(en?'en':'nb');
 function update(){const query=normalize(search.value.trim());let count=0;for(const card of cards){const show=(category==='all'||card.dataset.artTag===category)&&normalize(card.dataset.artSearch).includes(query);card.hidden=!show;if(show)count++;}document.querySelector('[data-art-count]').textContent=t(`${count} av ${cards.length} verk`,`${count} of ${cards.length} works`);document.querySelector('[data-art-empty]').hidden=count!==0;}
 function save(){
  if(restoring)return;
  const selected=cards.find(card=>card.dataset.artId===selectedArt&&!card.hidden);
  const state={version:1,key:galleryKey,query:search.value.slice(0,160),category,categoryId:categoryId(category),artId:languageDeparture?.artId??selectedArt,artTop:languageDeparture?.artTop??selected?.getBoundingClientRect().top??null,scrollY:Math.max(0,Math.min(1e7,languageDeparture?.scrollY??scrollY))};
  try{sessionStorage.setItem(galleryStorageKey,JSON.stringify(state))}catch{}
  try{const previous=history.state;history.replaceState({...(previous&&typeof previous==='object'&&!Array.isArray(previous)?previous:{}),sfiGallery:state},'')}catch{}
 }
 function restore(state){
  if(!state)return false;
  const resolved=localCategory(state.categoryId)||state.category;if(!categories.has(resolved))return false;
  pendingRestore=state;category=resolved;selectedArt=state.artId;search.value=state.query;
  filters.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.artFilter===category)));update();
  restoring=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   if(pendingRestore!==state)return;
   const card=cards.find(card=>card.dataset.artId===selectedArt&&!card.hidden),link=card?.querySelector('a');
   link?.focus({preventScroll:true});
   const y=card&&Number.isFinite(state.artTop)?scrollY+card.getBoundingClientRect().top-state.artTop:state.scrollY;
   window.scrollTo(0,y);restoring=false;save();
  }));
  return true;
 }
 search.addEventListener('input',()=>{cancelPending();lastVisibleGallery=null;languageDeparture=null;userGalleryView=null;selectedArt=null;update();save()});
 for(const button of filters)button.addEventListener('click',()=>{cancelPending();lastVisibleGallery=null;languageDeparture=null;userGalleryView=null;category=button.dataset.artFilter;selectedArt=null;filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));update();save()});
 document.querySelector('[data-art-reset]')?.addEventListener('click',()=>{cancelPending();lastVisibleGallery=null;languageDeparture=null;userGalleryView=null;search.value='';category='all';selectedArt=null;filters.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.artFilter==='all')));update();search.focus();save()});
 for(const card of cards)card.querySelector('a')?.addEventListener('click',()=>{selectedArt=card.dataset.artId;save()});
 addEventListener('sfi-before-language-change',event=>{
  const locale=event.detail?.locale;if(!['no','en','zh-Hans','yue-Hant'].includes(locale))return;
  cancelPending();rememberViewport();languageDeparture=userGalleryView||headerGalleryView||lastVisibleGallery;
  if(languageDeparture)selectedArt=languageDeparture.artId;
  if(!selectedArt){const visible=cards.find(card=>{const box=card.getBoundingClientRect();return !card.hidden&&box.bottom>110&&box.top<innerHeight});selectedArt=visible?.dataset.artId||cards.find(card=>!card.hidden)?.dataset.artId||null}
  save();const state=historyGalleryState()||storedGalleryState();if(!state)return;
  const path=locale==='en'?'/en/creative-community/':locale==='no'?'/kunstfellesskap/':galleryPath;
  const key=path+'|'+(allowedLang.has(locale)?locale:'');
  try{sessionStorage.setItem(galleryLanguageKey,JSON.stringify({expiresAt:Date.now()+60000,state:{...state,key}}))}catch{}
 });
 addEventListener('pagehide',save);
 addEventListener('pageshow',event=>{if(event.persisted){languageDeparture=null;headerGalleryView=null;userGalleryView=null;restore(historyGalleryState())}});
 const returning=params.get('gallery-return')==='1';
 const state=languageGalleryState()||historyGalleryState()||(returning?storedGalleryState():null);
 if(returning){const url=new URL(location.href);url.searchParams.delete('gallery-return');try{history.replaceState(history.state,'',url.pathname+url.search+url.hash)}catch{}}
 if(!restore(state)){update();save()}
}
function shareUrl(){const canonical=document.querySelector('link[rel=canonical]')?.href||location.href;const url=new URL(canonical);const lang=params.get('lang');if(allowedLang.has(lang))url.searchParams.set('lang',lang);return url.href;}
const status=document.querySelector('[data-share-status]'),manual=document.querySelector('.ac-manual-copy');
const shareText=(no,english,zh)=>params.get('lang')==='zh-Hans'?zh:t(no,english);let shareAction=0;
function fallback(){if(!manual)return;manual.hidden=false;manual.querySelector('input').value=shareUrl();manual.querySelector('input').focus();manual.querySelector('input').select();if(status)status.textContent=shareText('Kopier lenken fra feltet nedenfor.','Copy the link from the field below.','请复制下方输入框中的链接。');}
async function copy(){const action=++shareAction;if(status)status.textContent='';if(manual)manual.hidden=true;try{if(!navigator.clipboard?.writeText)throw Error('unavailable');await navigator.clipboard.writeText(shareUrl());if(action!==shareAction)return;if(status)status.textContent=shareText('Lenken til dette verket er kopiert.','The link to this artwork is copied.','已复制此作品的链接。');if(manual)manual.hidden=true;}catch{if(action===shareAction)fallback();}}
document.querySelector('[data-art-copy]')?.addEventListener('click',copy);
document.querySelector('[data-art-share]')?.addEventListener('click',async()=>{if(typeof navigator.share!=='function'){await copy();return;}const action=++shareAction;if(status)status.textContent='';if(manual)manual.hidden=true;try{await navigator.share({title:document.querySelector('h1')?.textContent||document.title,url:shareUrl()});if(action===shareAction&&status)status.textContent=shareText('Delingsdialogen er lukket.','The sharing dialog is closed.','分享菜单已关闭。');}catch(error){if(action!==shareAction)return;if(error.name==='AbortError'){if(status)status.textContent=shareText('Deling avbrutt.','Sharing cancelled.','已取消分享。');}else fallback();}});
const enlarge=document.querySelector('[data-art-enlarge]');
if(enlarge&&typeof HTMLDialogElement!=='undefined'&&HTMLDialogElement.prototype.showModal){let dialog,opener;enlarge.addEventListener('click',event=>{event.preventDefault();opener=document.activeElement;if(!dialog){dialog=document.createElement('dialog');dialog.className='ac-art-dialog';dialog.setAttribute('aria-labelledby','ac-large-title');const toolbar=document.createElement('div');toolbar.className='ac-art-dialog-toolbar';const title=document.createElement('h2');title.id='ac-large-title';title.textContent=document.querySelector('.ac-detail-copy h1').textContent;const buttons=document.createElement('div'),zoom=document.createElement('button'),close=document.createElement('button');zoom.type=close.type='button';zoom.textContent=t('Forstørr','Zoom in');zoom.setAttribute('aria-pressed','false');close.textContent=t('Lukk','Close')+' ×';close.setAttribute('aria-label',t('Lukk stort bilde','Close large image'));buttons.append(zoom,close);toolbar.append(title,buttons);const pane=document.createElement('div');pane.className='ac-art-zoom';pane.tabIndex=0;pane.setAttribute('aria-label',t('Stort kunstbilde. Ved forstørring kan du rulle for å se detaljene.','Large artwork image. When zoomed, scroll to see the details.'));const image=document.createElement('img');image.src=enlarge.href;image.alt=enlarge.querySelector('img').alt;pane.append(image);dialog.append(toolbar,pane);document.body.append(dialog);const shut=()=>{dialog.close();opener?.focus();};close.addEventListener('click',shut);dialog.addEventListener('cancel',event=>{event.preventDefault();shut();});dialog.addEventListener('click',event=>{if(event.target===dialog)shut();});zoom.addEventListener('click',()=>{const active=pane.classList.toggle('is-zoomed');zoom.setAttribute('aria-pressed',String(active));zoom.textContent=active?t('Tilpass bildet','Fit image'):t('Forstørr','Zoom in');pane.scrollTo(0,0);});}dialog.showModal();dialog.querySelector('button:last-child').focus();});}
})();
