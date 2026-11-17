/* Diary register only. Public filters/row/scroll live in this tab; no notes or article text. */
(()=>{'use strict';
 const root=document.querySelector('body[data-diary-index] [data-diary-directory]');if(!root)return;
 const rows=[...root.querySelectorAll('[data-diary-entry-row]')],controls=root.querySelector('[data-diary-filters]'),author=root.querySelector('[data-diary-author-filter]'),theme=root.querySelector('[data-diary-theme]'),count=root.querySelector('[data-diary-count]'),empty=root.querySelector('[data-diary-empty]');
 if(!controls||!author||!theme)return;
 const zh=new URL(location.href).searchParams.get('lang')==='zh-Hans',en=location.pathname.startsWith('/en/');
 const key='sfi-diary-index-v1:'+location.pathname+(zh?':zh-Hans':'');let selected='',timer;
 const normalize=text=>text.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
 const corpus=new Map(rows.map(row=>[row,normalize(row.querySelector('.diary-entry-title').textContent+' '+row.querySelector('.diary-excerpt').textContent)]));
 function save(){const state={author:author.value,theme:theme.value.slice(0,100),row:selected,y:Math.max(0,Math.round(scrollY))};try{sessionStorage.setItem(key,JSON.stringify(state))}catch{};return state}
 function apply(){const words=normalize(theme.value).split(' ').filter(Boolean);let visible=0;for(const row of rows){row.hidden=Boolean(author.value&&row.dataset.diaryAuthor!==author.value)||!words.every(word=>corpus.get(row).includes(word));if(!row.hidden)visible++}empty.hidden=visible!==0;count.textContent=zh?`显示 ${visible} / ${rows.length} 篇；标题和摘要保留原文。`:en?`${visible} of ${rows.length} entries`:`${visible} av ${rows.length} tekster`}
 function restore(returned){let state;try{state=JSON.parse(sessionStorage.getItem(key)||'null')}catch{}if(!state||typeof state!=='object')return;
  author.value=[...author.options].some(option=>option.value===state.author)?state.author:'';theme.value=typeof state.theme==='string'?state.theme.slice(0,100):'';selected=typeof state.row==='string'&&rows.some(row=>row.id===state.row)?state.row:'';apply();
  for(const row of rows)row.toggleAttribute('data-diary-returned',row.id===selected);
  if(returned&&Number.isFinite(state.y)&&state.y>=0){requestAnimationFrame(()=>requestAnimationFrame(()=>{const row=rows.find(row=>row.id===selected&&!row.hidden);row?.focus({preventScroll:true});window.scrollTo({top:state.y,behavior:'instant'})}))}
 }
 if(zh){
  const labels=root.querySelectorAll('label');labels[0].textContent='作者';labels[1].textContent='主题／标题或摘要中的词语';author.options[0].textContent='所有作者';root.querySelector('[data-diary-reset]').textContent='显示全部';root.querySelector('#diary-theme-note').textContent='在现有标题和摘要中搜索。尚未登记编辑主题标签。作者编号保留原文写法。';empty.textContent='没有符合筛选条件的文章。请更改词语或选择“显示全部”。';
  const note=document.createElement('p');note.className='diary-filter-note';note.lang='zh-Hans';note.textContent=en?'下列文章标题和摘要保留英语原文，日期说明保留英语；未提供中文译文。':'下列文章标题和摘要保留挪威语原文，日期说明保留挪威语；未提供中文译文。';root.insertBefore(note,controls);
 }
 controls.hidden=false;apply();restore(false);
 function clearSelection(){selected='';rows.forEach(row=>row.removeAttribute('data-diary-returned'))}
 author.addEventListener('change',()=>{clearSelection();apply();save()});theme.addEventListener('input',()=>{clearSelection();apply();save()});
 root.querySelector('[data-diary-reset]').addEventListener('click',()=>{author.value='';theme.value='';selected='';rows.forEach(row=>row.removeAttribute('data-diary-returned'));apply();save()});
 root.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(!link)return;const row=link.closest('[data-diary-entry-row]')||rows.find(row=>new URL(row.href).pathname===new URL(link.href).pathname);if(!row)return;selected=row.id;save()});
 addEventListener('scroll',()=>{clearTimeout(timer);timer=setTimeout(save,120)},{passive:true});addEventListener('pagehide',()=>{clearTimeout(timer);save()});
 addEventListener('pageshow',event=>{const back=performance.getEntriesByType('navigation')[0]?.type==='back_forward';restore(event.persisted||back||Boolean(selected))});
})();
