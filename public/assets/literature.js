/* Public literature index: filtering and position stay in this tab. No network calls. */
(()=>{'use strict';
const form=document.querySelector('[data-lit-filters]');if(!form)return;
const key='sfi-literature-index-v1',base=document.body.dataset.litLanguage==='en'?'en':'no';
const zh=new URL(location.href).searchParams.get('lang')==='zh-Hans';
const language=zh?'zh':base;let restore=null;
try{restore=JSON.parse(sessionStorage.getItem(key)||'null')}catch{}
const items=[...document.querySelectorAll('[data-lit-item]')];
const count=document.querySelector('[data-lit-count]'),empty=document.querySelector('[data-lit-empty]');
if(zh){document.documentElement.lang='zh-Hans';document.querySelectorAll('[data-lit-zh]').forEach(e=>{e.textContent=e.dataset.litZh});document.querySelectorAll('[data-zh-original]').forEach(e=>{e.hidden=false})}
function apply(){const kind=form.elements.kind.value,writer=form.elements.writer.value;let n=0;for(const item of items){item.hidden=!((kind==='all'||item.dataset.kind===kind)&&(writer==='all'||item.dataset.writer===writer));if(!item.hidden)n++}count.textContent=language==='zh'?`${n} 篇文本`:`${n} ${language==='en'?'texts':'tekster'}`;empty.hidden=n>0}
function persist(focusId){try{sessionStorage.setItem(key,JSON.stringify({kind:form.elements.kind.value,writer:form.elements.writer.value,scroll:Math.max(0,scrollY),focusId:focusId||null}))}catch{}}
if(restore&&typeof restore==='object'){if(['all','book','diary'].includes(restore.kind))form.elements.kind.value=restore.kind;if(['all','2601-46','250418'].includes(restore.writer))form.elements.writer.value=restore.writer}
form.addEventListener('change',()=>{apply();persist()});form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('reset',e=>{e.preventDefault();form.elements.kind.value='all';form.elements.writer.value='all';apply();persist()});
for(const a of document.querySelectorAll('[data-read-link]'))a.addEventListener('click',()=>persist(a.closest('[data-lit-item]').id));
function restorePosition(){if(!restore||!Number.isFinite(restore.scroll))return;const nav=performance.getEntriesByType('navigation')[0];if(nav?.type==='back_forward'){requestAnimationFrame(()=>{if(typeof restore.focusId==='string'){const row=document.getElementById(restore.focusId);if(row&&!row.hidden)row.querySelector('a')?.focus({preventScroll:true})}scrollTo(0,Math.max(0,restore.scroll))})}}
apply();restorePosition();
addEventListener('pagehide',()=>persist(document.activeElement?.closest('[data-lit-item]')?.id));
addEventListener('pageshow',e=>{if(e.persisted){apply();restorePosition()}});
})();

/* Transfer a reading anchor only after an explicit language choice in this index. */
(()=>{'use strict';
const form=document.querySelector('[data-lit-filters]'),main=document.querySelector('.lit-main'),header=document.querySelector('[data-site-navigation]');
if(!form||!main||!header)return;
const KEY='sfi-literature-language-transfer-v1',paths=['/litteratur/','/en/literature/'];
if(!paths.includes(location.pathname))return;
let reading=null,restore=null,interacted=false;
const locale=()=>new URL(location.href).searchParams.get('lang')==='zh-Hans'?'zh-Hans':location.pathname.startsWith('/en/')?'en':'no';
function snapshot(){
 const active=document.activeElement?.closest('[data-lit-item]');
 const rows=[...document.querySelectorAll('[data-lit-item]')].filter(e=>!e.hidden);
 const top=Math.max(0,header.getBoundingClientRect().bottom);
 const row=active&&!active.hidden?active:rows.find(e=>{const r=e.getBoundingClientRect();return r.bottom>top&&r.top<innerHeight})||rows[0];
 if(!row)return null;
 return{kind:form.elements.kind.value,writer:form.elements.writer.value,rowId:row.id,offset:row.getBoundingClientRect().top,focusRow:!!active};
}
function remember(){if(!header.contains(document.activeElement))reading=snapshot()}
// Focus leaves the reading row before native focus scrolling moves the viewport.
main.addEventListener('focusout',event=>{reading=snapshot();const row=event.target.closest('[data-lit-item]');if(reading&&row&&!row.hidden){reading.rowId=row.id;reading.offset=row.getBoundingClientRect().top;reading.focusRow=true}});
header.addEventListener('pointerdown',remember,{capture:true});
addEventListener('keydown',event=>{if(event.key==='Tab'&&!header.contains(document.activeElement))reading=snapshot()},true);
addEventListener('scroll',remember,{passive:true});
main.addEventListener('focusin',remember);main.addEventListener('change',()=>queueMicrotask(remember));
addEventListener('sfi-before-language-change',event=>{
 const target=event.detail?.locale;if(!['no','en','zh-Hans'].includes(target))return;
 const anchor=header.contains(document.activeElement)?reading:snapshot();
 if(!anchor)return;
 try{sessionStorage.setItem(KEY,JSON.stringify({...anchor,target,from:location.pathname,at:Date.now()}))}catch{/* Without tab storage, language navigation remains usable and starts normally. */}
});
try{restore=JSON.parse(sessionStorage.getItem(KEY)||'null');sessionStorage.removeItem(KEY)}catch{}
const valid=restore&&paths.includes(restore.from)&&restore.target===locale()&&Number.isFinite(restore.at)&&Date.now()-restore.at>=0&&Date.now()-restore.at<120000&&['all','book','diary'].includes(restore.kind)&&['all','250418','2601-46'].includes(restore.writer)&&typeof restore.rowId==='string'&&/^lit-(chapter-9|chapter-10|chapter-11|alarmen|reuse)$/.test(restore.rowId)&&Number.isFinite(restore.offset)&&Math.abs(restore.offset)<100000&&typeof restore.focusRow==='boolean';
const guard=()=>{interacted=true};for(const type of ['pointerdown','keydown','wheel','touchstart'])addEventListener(type,guard,{once:true,capture:true,passive:true});
if(valid){
 // Only this explicit transfer restores; a fresh visit has no pending language anchor.
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
  if(interacted)return;
  form.elements.kind.value=restore.kind;form.elements.writer.value=restore.writer;
  form.dispatchEvent(new Event('change',{bubbles:true}));
  const row=document.getElementById(restore.rowId);if(!row||row.hidden)return;
  const offset=Math.min(innerHeight-44,Math.max(-row.getBoundingClientRect().height+44,restore.offset));
  scrollBy(0,row.getBoundingClientRect().top-offset);
  if(restore.focusRow&&!interacted)row.querySelector('[data-read-link]')?.focus({preventScroll:true});
  reading=snapshot();
 }));
}else requestAnimationFrame(remember);
})();
