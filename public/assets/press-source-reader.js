/* In-page reading of the existing public redacted originals. No service or upload. */
(()=>{'use strict';
if(!document.body.hasAttribute('data-press-source-page'))return;
// The shared decorative identity may arrive later; the case title and ingress lead it.
const reading=document.querySelector('main .reading');
function placeIdentity(){const visual=reading?.querySelector('[data-story-motion="press"]'),intro=reading?.querySelector('h1')?.nextElementSibling;if(visual&&intro?.tagName==='P'&&intro.nextElementSibling!==visual)intro.after(visual)}
if(reading){placeIdentity();const placement=new MutationObserver(placeIdentity);placement.observe(reading,{childList:true});addEventListener('pagehide',()=>placement.disconnect(),{once:true})}
if(typeof HTMLDialogElement==='undefined'||typeof HTMLDialogElement.prototype.showModal!=='function')return;
const en=location.pathname.startsWith('/en/'),zh=new URL(location.href).searchParams.get('lang')==='zh-Hans';
const words=zh?{title:'原始文件阅读器',close:'关闭并返回原位置',previous:'上一页',next:'下一页',page:'页面',zoom:'缩放',fit:'适合页面',original:'打开原始图像（新窗口）',pdf:'下载此文件的 PDF',resume:'继续上次阅读的页面',error:'图像无法加载。请打开原始文件。',note:'挪威语原件 · 身份信息已遮盖'}:en?{title:'Original document reader',close:'Close and return to your place',previous:'Previous page',next:'Next page',page:'Page',zoom:'Zoom',fit:'Fit page',original:'Open original image (new window)',pdf:'Download this document as PDF',resume:'Continue from the last page read',error:'The image could not load. Open the original file.',note:'Norwegian originals · identity details redacted'}:{title:'Les originaldokumentet',close:'Lukk og gå tilbake til samme sted',previous:'Forrige side',next:'Neste side',page:'Side',zoom:'Zoom',fit:'Tilpass side',original:'Åpne originalbildet (nytt vindu)',pdf:'Last ned dokumentet som PDF',resume:'Fortsett fra sist leste side',error:'Bildet kunne ikke lastes. Åpne originalfilen.',note:'Norske originaler · identiteten er sladdet'};
const pages=[...document.querySelectorAll('.press-document-page')].map(figure=>{const anchor=figure.querySelector('a[href]'),image=figure.querySelector('img'),section=figure.closest('section');return {figure,anchor,src:anchor?.getAttribute('href'),label:image?.alt,pdf:section?.querySelector('.press-document-downloads a[href$=".pdf"]')?.getAttribute('href')}}).filter(p=>p.src&&p.label&&p.pdf);
if(!pages.length)return;
const create=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
const button=(text,fn)=>{const n=create('button',text);n.type='button';n.addEventListener('click',fn);return n};
const dialog=create('dialog',null,'press-reader');dialog.setAttribute('aria-labelledby','press-reader-title');
const heading=create('h2',words.title);heading.id='press-reader-title';
const top=create('div',null,'press-reader__top'),close=button(words.close,()=>dialog.close());top.append(heading,close);
const toolbar=create('div',null,'press-reader__toolbar');
const selectLabel=create('label',words.page),select=create('select');select.setAttribute('aria-label',words.page);
pages.forEach((page,i)=>{const option=create('option',page.label);option.value=String(i);select.append(option)});selectLabel.append(select);
const previous=button(words.previous,()=>show(index-1)),next=button(words.next,()=>show(index+1));
const zoomLabel=create('label',words.zoom),zoom=create('input'),output=create('output','100%');zoom.type='range';zoom.min='50';zoom.max='300';zoom.step='25';zoom.value='100';zoom.setAttribute('aria-label',words.zoom);zoomLabel.append(zoom,output);
const fit=button(words.fit,()=>{zoom.value='100';paintSize();scroller.scrollLeft=0;scroller.scrollTop=0;save()});
const original=create('a',words.original),pdf=create('a',words.pdf);original.target='_blank';original.rel='noopener noreferrer';pdf.setAttribute('download','');
toolbar.append(previous,selectLabel,next,zoomLabel,fit,original,pdf);
const note=create('p',words.note,'press-reader__note'),status=create('p',null,'press-reader__status');status.setAttribute('role','status');
const scroller=create('div',null,'press-reader__scroll');scroller.tabIndex=0;scroller.setAttribute('aria-label',words.title);
const image=create('img');image.alt='';scroller.append(image);dialog.append(top,toolbar,note,status,scroller);document.body.append(dialog);
let index=0,opener=null,returnY=0,oldOverflow='',generation=0,moving=false;const memory=new Map(),key='sfi-press-reader-v1';let saved=null;
try{const raw=JSON.parse(sessionStorage.getItem(key)||'null');if(raw&&pages.some(p=>p.src===raw.src)&&Number.isFinite(raw.zoom)&&raw.zoom>=50&&raw.zoom<=300)saved=raw}catch{}
function paintSize(){const ratio=Number(image.getAttribute('width'))/Number(image.getAttribute('height'));const width=Math.max(1,scroller.clientWidth-32),height=Math.max(1,scroller.clientHeight-32);const fitWidth=Math.min(width,height*(Number.isFinite(ratio)&&ratio>0?ratio:1),image.naturalWidth||width);image.style.width=Math.round(fitWidth*Number(zoom.value)/100)+'px';output.value=zoom.value+'%';output.textContent=output.value}
function save(){if(!dialog.open||moving)return;const data={src:pages[index].src,zoom:Number(zoom.value),x:scroller.scrollLeft,y:scroller.scrollTop};memory.set(data.src,data);saved=data;try{sessionStorage.setItem(key,JSON.stringify(data))}catch{}renderResume()}
function renderResume(){const host=document.querySelector('[data-press-reader-resume]');if(!host||!saved||host.querySelector('button'))return;host.append(button(words.resume,event=>open(pages.findIndex(p=>p.src===saved.src),event.currentTarget,saved)))}
async function show(nextIndex,restore){if(nextIndex<0||nextIndex>=pages.length)return;const old=restore||memory.get(pages[nextIndex].src);save();moving=true;toolbar.inert=true;dialog.dataset.readerReady='false';dialog.setAttribute('aria-busy','true');index=nextIndex;const page=pages[index],token=++generation;zoom.value=String(old?.zoom||100);select.value=String(index);previous.disabled=index===0;next.disabled=index===pages.length-1;heading.textContent=page.label;original.href=page.src;pdf.href=page.pdf;status.textContent='';image.alt=page.label;const sourceImage=page.figure.querySelector('img');image.setAttribute('width',sourceImage.getAttribute('width'));image.setAttribute('height',sourceImage.getAttribute('height'));image.src=page.src;try{await image.decode()}catch{if(token===generation)status.textContent=words.error}if(token!==generation||!dialog.open)return;paintSize();await new Promise(resolve=>requestAnimationFrame(resolve));if(token!==generation||!dialog.open)return;scroller.scrollLeft=Number.isFinite(old?.x)?old.x:0;scroller.scrollTop=Number.isFinite(old?.y)?old.y:0;moving=false;toolbar.inert=false;dialog.dataset.readerReady='true';dialog.setAttribute('aria-busy','false');save()}
function open(i,from,restore){if(i<0)return;opener=from;returnY=scrollY;oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();show(i,restore);close.focus()}
pages.forEach((page,i)=>page.anchor.addEventListener('click',event=>{if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();open(i,page.anchor)}));
select.addEventListener('change',()=>show(Number(select.value)));
zoom.addEventListener('input',()=>{paintSize();save()});scroller.addEventListener('scroll',save,{passive:true});
dialog.addEventListener('close',()=>{generation++;moving=false;toolbar.inert=false;dialog.dataset.readerReady='false';dialog.setAttribute('aria-busy','false');document.body.style.overflow=oldOverflow;opener?.focus({preventScroll:true});window.scrollTo(0,returnY)});
window.addEventListener('resize',()=>{if(dialog.open)paintSize()});
window.addEventListener('pagehide',save);renderResume();
})();
