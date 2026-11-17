/* Public, local-only Roomguide pilot. No model or network calls. */
(()=>{
"use strict";
const ROUTES={"/juridisk-motvekt/":"legal","/boken/":"reader","/advokatvalg/":"legal","/innsyn/":"legal","/presse/":"press","/rettsspeil/":"legal","/originalverk/":"art","/kunstfellesskap/":"art","/den-trojanske-hesten/":"reader","/kunstsamfunnet/":"art","/kapittel-9/":"reader","/nytt/":"reader","/kunstner/":"art","/maite/":"legal","/dagbok/":"reader","/innsyn-i-makt/":"legal","/klagehjelp/":"legal","/butikk/":"art","/collaborate/":"community","/fengslene-vest-for-loven/":"reader","/musikk/":"art","/kapittel-11/":"reader","/samtaleregler/":"community","/kapittel-10/":"reader","/inmaite/":"legal","/analyse/":"legal","/stemmer/":"reader","/kapitler/":"reader","/fight-for-whats-right/":"legal","/forebygging-og-forum/":"community","/galleri-3d/":"art","/bidrag/":"community","/verksted/":"community","/boken/normalitetsprinsippet/":"reader","/en/juridisk-motvekt/":"legal","/en/boken/":"reader","/en/innsyn/":"legal","/en/artist/":"art","/en/presse/":"press","/en/rettsspeil/":"legal","/en/discussion-rules/":"community","/en/den-trojanske-hesten/":"reader","/en/creative-community/":"art","/en/kapittel-9/":"reader","/en/art-community/":"art","/en/nytt/":"reader","/en/maite/":"legal","/en/counsel-choice/":"legal","/en/dagbok/":"reader","/en/innsyn-i-makt/":"legal","/en/klagehjelp/":"legal","/en/shop/":"art","/en/collaborate/":"community","/en/fengslene-vest-for-loven/":"reader","/en/kapittel-11/":"reader","/en/kapittel-10/":"reader","/en/inmaite/":"legal","/en/original-art/":"art","/en/analysis/":"legal","/en/music/":"art","/en/stemmer/":"reader","/en/kapitler/":"reader","/en/fight-for-whats-right/":"legal","/en/forebygging-og-forum/":"community","/en/galleri-3d/":"art","/en/bidrag/":"community","/en/verksted/":"community","/en/boken/normalitetsprinsippet/":"reader","/en/creative-community/art/book-page-348/":"art","/en/creative-community/art/book-page-352/":"art","/en/creative-community/art/book-page-184/":"art","/en/creative-community/art/book-page-224/":"art","/en/creative-community/art/gjenbruk/":"art","/en/creative-community/art/book-page-344/":"art","/en/creative-community/art/book-page-34/":"art","/en/creative-community/art/book-page-14/":"art","/en/creative-community/art/kampsport-diary/":"art","/en/creative-community/art/fri-presse/":"art","/en/creative-community/art/lar-bak-murene/":"art","/en/creative-community/art/fem-minutter-i-skolegangen/":"art","/en/creative-community/art/book-page-358/":"art","/en/creative-community/art/book-page-42/":"art","/en/creative-community/art/skoleplassen-diary/":"art","/en/creative-community/art/book-page-340/":"art","/en/creative-community/art/book-page-122/":"art","/en/creative-community/art/book-page-256/":"art","/en/creative-community/art/book-page-18/":"art","/en/creative-community/art/book-page-218/":"art","/en/creative-community/art/book-page-384/":"art","/en/creative-community/art/book-page-38/":"art","/en/creative-community/art/book-page-22/":"art","/en/creative-community/art/book-page-12/":"art","/en/creative-community/art/book-page-336/":"art","/en/creative-community/art/book-page-324/":"art","/en/creative-community/art/book-page-366/":"art","/en/art-community/art/book-page-348/":"art","/en/art-community/art/book-page-352/":"art","/en/art-community/art/book-page-184/":"art","/en/art-community/art/book-page-224/":"art","/en/art-community/art/gjenbruk/":"art","/en/art-community/art/book-page-344/":"art","/en/art-community/art/book-page-34/":"art","/en/art-community/art/book-page-14/":"art","/en/art-community/art/kampsport-diary/":"art","/en/art-community/art/fri-presse/":"art","/en/art-community/art/lar-bak-murene/":"art","/en/art-community/art/fem-minutter-i-skolegangen/":"art","/en/art-community/art/book-page-358/":"art","/en/art-community/art/book-page-42/":"art","/en/art-community/art/skoleplassen-diary/":"art","/en/art-community/art/book-page-340/":"art","/en/art-community/art/book-page-122/":"art","/en/art-community/art/book-page-256/":"art","/en/art-community/art/book-page-18/":"art","/en/art-community/art/book-page-218/":"art","/en/art-community/art/book-page-384/":"art","/en/art-community/art/book-page-38/":"art","/en/art-community/art/book-page-22/":"art","/en/art-community/art/book-page-12/":"art","/en/art-community/art/book-page-336/":"art","/en/art-community/art/book-page-324/":"art","/en/art-community/art/book-page-366/":"art","/en/dagbok/2026-11-09-vi-krever-svar/":"reader","/en/dagbok/2026-11-07-gi-joe/":"reader","/en/dagbok/treningsbeltet/":"reader","/en/dagbok/fanger-til-gjenbruk/":"reader","/en/dagbok/skoleplassen/":"reader","/en/dagbok/lar-bak-murene/":"reader","/en/dagbok/fem-minutter-i-skolegangen/":"reader","/en/dagbok/nar-dorene-til-kunnskapen-stenges/":"reader","/en/dagbok/alarmen/":"reader","/en/dagbok/2026-11-12-svar-til-regionen/":"reader","/en/dagbok/2026-11-11-o-dog/":"reader","/en/dagbok/trening/":"reader","/en/dagbok/musikkrommet/":"reader","/en/verksted/community/":"community","/kunstfellesskap/verk/book-page-348/":"art","/kunstfellesskap/verk/book-page-352/":"art","/kunstfellesskap/verk/book-page-184/":"art","/kunstfellesskap/verk/book-page-224/":"art","/kunstfellesskap/verk/gjenbruk/":"art","/kunstfellesskap/verk/book-page-344/":"art","/kunstfellesskap/verk/book-page-34/":"art","/kunstfellesskap/verk/book-page-14/":"art","/kunstfellesskap/verk/kampsport-diary/":"art","/kunstfellesskap/verk/fri-presse/":"art","/kunstfellesskap/verk/lar-bak-murene/":"art","/kunstfellesskap/verk/fem-minutter-i-skolegangen/":"art","/kunstfellesskap/verk/book-page-358/":"art","/kunstfellesskap/verk/book-page-42/":"art","/kunstfellesskap/verk/skoleplassen-diary/":"art","/kunstfellesskap/verk/book-page-340/":"art","/kunstfellesskap/verk/book-page-122/":"art","/kunstfellesskap/verk/book-page-256/":"art","/kunstfellesskap/verk/book-page-18/":"art","/kunstfellesskap/verk/book-page-218/":"art","/kunstfellesskap/verk/book-page-384/":"art","/kunstfellesskap/verk/book-page-38/":"art","/kunstfellesskap/verk/book-page-22/":"art","/kunstfellesskap/verk/book-page-12/":"art","/kunstfellesskap/verk/book-page-336/":"art","/kunstfellesskap/verk/book-page-324/":"art","/kunstfellesskap/verk/book-page-366/":"art","/kunstsamfunnet/verk/book-page-348/":"art","/kunstsamfunnet/verk/book-page-352/":"art","/kunstsamfunnet/verk/book-page-184/":"art","/kunstsamfunnet/verk/book-page-224/":"art","/kunstsamfunnet/verk/gjenbruk/":"art","/kunstsamfunnet/verk/book-page-344/":"art","/kunstsamfunnet/verk/book-page-34/":"art","/kunstsamfunnet/verk/book-page-14/":"art","/kunstsamfunnet/verk/kampsport-diary/":"art","/kunstsamfunnet/verk/fri-presse/":"art","/kunstsamfunnet/verk/lar-bak-murene/":"art","/kunstsamfunnet/verk/fem-minutter-i-skolegangen/":"art","/kunstsamfunnet/verk/book-page-358/":"art","/kunstsamfunnet/verk/book-page-42/":"art","/kunstsamfunnet/verk/skoleplassen-diary/":"art","/kunstsamfunnet/verk/book-page-340/":"art","/kunstsamfunnet/verk/book-page-122/":"art","/kunstsamfunnet/verk/book-page-256/":"art","/kunstsamfunnet/verk/book-page-18/":"art","/kunstsamfunnet/verk/book-page-218/":"art","/kunstsamfunnet/verk/book-page-384/":"art","/kunstsamfunnet/verk/book-page-38/":"art","/kunstsamfunnet/verk/book-page-22/":"art","/kunstsamfunnet/verk/book-page-12/":"art","/kunstsamfunnet/verk/book-page-336/":"art","/kunstsamfunnet/verk/book-page-324/":"art","/kunstsamfunnet/verk/book-page-366/":"art","/dagbok/2026-11-09-vi-krever-svar/":"reader","/dagbok/2026-11-07-gi-joe/":"reader","/dagbok/treningsbeltet/":"reader","/dagbok/fanger-til-gjenbruk/":"reader","/dagbok/skoleplassen/":"reader","/dagbok/lar-bak-murene/":"reader","/dagbok/fem-minutter-i-skolegangen/":"reader","/dagbok/nar-dorene-til-kunnskapen-stenges/":"reader","/dagbok/alarmen/":"reader","/dagbok/2026-11-12-svar-til-regionen/":"reader","/dagbok/2026-11-11-o-dog/":"reader","/dagbok/trening/":"reader","/dagbok/musikkrommet/":"reader","/verksted/fellesskap/":"community"};
const COPY={
 no:{open:'Spør Romguiden',title:'Romguiden',roles:{reader:'Lesefølget',press:'Kildeguiden',legal:'Arbeidshjelperen',art:'Kunstverten',community:'Fellesskapsguiden'},off:'KI-svar er ikke aktivert',intro:'Finn offentlige sider med lokalt søk. Dette er ikke en samtale med KI.',privacy:'Spørsmål og utkast blir i denne fanen og sendes ikke. De bevares ved rombytte med faneøktlagring. Unngå sensitive opplysninger og saksdokumenter. Ingen langtidsminne.',unavailable:'Faneøktlagring er utilgjengelig. Teksten bevares bare mens denne siden er åpen.',question:'Hva vil du finne?',find:'Finn offentlige kilder',draft:'Ditt utkast · sendes ikke',scope:'Søk i',story:'Stemmen',art:'Fra innsiden',both:'Begge retninger',close:'Lukk',clear:'Slett spørsmål og utkast',confirm:'Slette spørsmål og utkast i denne fanen?',sources:'Offentlige kilder',excerpt:'Kildeutdrag',suggestion:'Verktøyforslag · ikke et KI-svar',hint:'Bruk korte stikkord for å finne en side. Åpne kilden og kontroller sammenhengen. Utkastet er ditt eget; ingen tekst genereres eller sendes her.',empty:'Ingen treff i dette utvalget. Prøv færre stikkord eller velg begge retninger.',missing:'Den offentlige søkeindeksen er ikke lastet på denne siden. Ingen kilder er hentet.',original:'Originalspråk',count:'Treff',cleared:'Spørsmål og utkast er slettet.'},
 en:{open:'Ask the Room Guide',title:'Room Guide',roles:{reader:'Reading companion',press:'Source guide',legal:'Work assistant',art:'Art host',community:'Community guide'},off:'AI answers are not enabled',intro:'Find public pages with local search. This is not an AI conversation.',privacy:'Questions and drafts stay in this tab and are not sent. They are preserved across rooms using tab session storage. Avoid sensitive information and case documents. No long-term memory.',unavailable:'Tab session storage is unavailable. Text is preserved only while this page remains open.',question:'What would you like to find?',find:'Find public sources',draft:'Your draft · not sent',scope:'Search in',story:'The Voice',art:'From Inside',both:'Both directions',close:'Close',clear:'Delete question and draft',confirm:'Delete the question and draft in this tab?',sources:'Public sources',excerpt:'Source excerpt',suggestion:'Tool suggestion · not an AI answer',hint:'Use short keywords to find a page. Open the source and check its context. The draft is yours; no text is generated or sent here.',empty:'No matches in this selection. Try fewer keywords or choose both directions.',missing:'The public search index is not loaded on this page. No sources have been retrieved.',original:'Original language',count:'Matches',cleared:'Question and draft deleted.'},
 zh:{open:'询问房间向导',title:'房间向导',roles:{reader:'阅读伙伴',press:'来源向导',legal:'工作助手',art:'艺术主人',community:'社区向导'},off:'尚未启用人工智能回答',intro:'通过本地搜索查找公开页面。这不是人工智能对话。',privacy:'问题和草稿仅保留在此标签页中，不会发送。通过标签页会话存储，在切换房间时保留。请勿输入敏感信息或案件文件。不使用长期记忆。',unavailable:'标签页会话存储不可用。文字仅在此页面保持打开时保留。',question:'您想查找什么？',find:'查找公开来源',draft:'您的草稿 · 不会发送',scope:'搜索范围',story:'声音',art:'来自内部',both:'两个方向',close:'关闭',clear:'删除问题和草稿',confirm:'删除此标签页中的问题和草稿？',sources:'公开来源',excerpt:'来源摘录',suggestion:'工具建议 · 非人工智能回答',hint:'使用简短关键词查找页面。打开来源并核实上下文。草稿由您撰写；这里不会生成或发送文字。',empty:'此范围内没有匹配结果。请减少关键词或选择两个方向。',missing:'此页面未加载公开搜索索引。尚未检索来源。',original:'原文语言',count:'匹配结果',cleared:'问题和草稿已删除。'}
};
const KEY='sfi-roomguide-tab-v1';
let state=null;
const norm=v=>v.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const path=()=>location.pathname.replace(/index\.html$/,'');
function safeRecord(r){
 if(!r||typeof r.path!=='string'||!Object.prototype.hasOwnProperty.call(ROUTES,r.path)||typeof r.title!=='string'||typeof r.body!=='string')return false;
 if(!['no','en','zh-Hans'].includes(r.lang)||!['story','art'].includes(r.direction))return false;
 const role=ROUTES[r.path];
 const expected=['art','community'].includes(role)?'art':'story';
 // Rules pages are shared public context, but never admit private/account routes.
 if(r.direction!==expected)return false;
 const u=new URL(r.path,location.origin);
 return u.origin===location.origin&&u.pathname===r.path&&!u.search&&!u.hash;
}
function init(){
 if(state)return true;
 const direction=document.body?.dataset.siteDirection;
 const role=ROUTES[path()];
 if(!['story','art'].includes(direction)||!role||typeof HTMLDialogElement==='undefined')return false;
 const language=new URLSearchParams(location.search).get('lang')==='zh-Hans'?'zh':location.pathname.startsWith('/en/')?'en':'no';
 const c=COPY[language];
 const root=document.createElement('div');root.className='sfi-rg';root.dataset.direction=direction;root.lang=language==='zh'?'zh-Hans':language==='no'?'nb':'en';
 const el=(tag,cls,txt,parent=root)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt)n.textContent=txt;parent.append(n);return n;};
 const button=(txt,parent,cls='sfi-rg__button')=>{const n=el('button',cls,txt,parent);n.type='button';return n;};
 const launch=button('',root,'sfi-rg__launch');launch.setAttribute('aria-label',c.open);launch.title=c.open;
 const launchIcon=el('span','sfi-rg__launch-icon','?',launch);launchIcon.setAttribute('aria-hidden','true');
 el('span','sfi-rg__launch-text',c.open,launch);launch.setAttribute('aria-haspopup','dialog');launch.setAttribute('aria-expanded','false');
 const dialog=el('dialog','sfi-rg__dialog');dialog.setAttribute('aria-labelledby','sfi-rg-title');launch.setAttribute('aria-controls','sfi-rg-dialog');dialog.id='sfi-rg-dialog';
 const header=el('header','sfi-rg__header',null,dialog);
 const heading=el('h2','sfi-rg__title',c.title+' · '+c.roles[role],header);heading.id='sfi-rg-title';
 const close=button(c.close,header);
 el('p','sfi-rg__status',c.off,dialog);el('p','',c.intro,dialog);
 const privacy=el('p','sfi-rg__notice',c.privacy,dialog);privacy.id='sfi-rg-privacy';
 const storageNotice=el('p','sfi-rg__notice','',dialog);storageNotice.hidden=true;
 const form=el('form','sfi-rg__form',null,dialog);
 const label=(text,id)=>{const n=el('label','sfi-rg__label',text,form);n.htmlFor=id;};
 label(c.question,'sfi-rg-question');const question=el('textarea','sfi-rg__input',null,form);question.id='sfi-rg-question';question.rows=2;question.maxLength=2000;question.setAttribute('aria-describedby',privacy.id);
 label(c.scope,'sfi-rg-scope');const scope=el('select','sfi-rg__input',null,form);scope.id='sfi-rg-scope';
 for(const v of ['story','art','both']){const opt=el('option','',c[v],scope);opt.value=v;}scope.value=direction;
 const find=button(c.find,form);find.type='submit';
 label(c.draft,'sfi-rg-draft');const draft=el('textarea','sfi-rg__input',null,form);draft.id='sfi-rg-draft';draft.rows=4;draft.maxLength=20000;
 const clear=button(c.clear,dialog);
 const message=el('p','sfi-rg__notice','',dialog);message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 el('h3','',c.suggestion,dialog);el('p','',c.hint,dialog);
 el('h3','',c.sources,dialog);const results=el('div','sfi-rg__results',null,dialog);
 document.body.append(root);
 let storage=true;
 function noStorage(){storage=false;storageNotice.textContent=c.unavailable;storageNotice.hidden=false;}
 try{const saved=JSON.parse(sessionStorage.getItem(KEY)||'null');if(saved&&typeof saved==='object'){if(typeof saved.question==='string')question.value=saved.question.slice(0,2000);if(typeof saved.draft==='string')draft.value=saved.draft.slice(0,20000);if(['story','art','both'].includes(saved.scope))scope.value=saved.scope;}}catch{noStorage();}
 const persist=()=>{if(!storage)return;try{sessionStorage.setItem(KEY,JSON.stringify({question:question.value,draft:draft.value,scope:scope.value}));}catch{noStorage();}};
 function search(){
  results.replaceChildren();
  if(!Array.isArray(window.StemmenSearch)){message.textContent=c.missing;return;}
  const rows=window.StemmenSearch.filter(safeRecord).filter(r=>scope.value==='both'||r.direction===scope.value);
  // Chinese may use a marked original when this public catalog has no Chinese translation.
  let pool=rows.filter(r=>r.lang===(language==='zh'?'zh-Hans':language));
  const fallback=language==='zh'&&!pool.length;if(fallback)pool=rows.filter(r=>r.lang==='no');
  const terms=norm(question.value.trim()).split(/\s+/).filter(Boolean).slice(0,8);
  let matches;
  try{if(typeof window.SFIContentSearch?.query==='function'){
   const found=window.SFIContentSearch.query(pool,{query:question.value,lang:fallback?'no':language==='zh'?'zh-Hans':language,scope:scope.value});
   // Use original validated catalog records, never result bodies or URLs supplied by another tool.
   matches=(found?.results||[]).map(r=>pool.find(p=>p.path===r.path&&p.lang===r.lang)).filter(Boolean);
  }}catch{/* Fall back to the same local public index. */}
  if(!Array.isArray(matches))matches=pool.filter(r=>terms.every(t=>norm(r.title+' '+r.body).includes(t))).sort((a,b)=>terms.reduce((n,t)=>n+Number(norm(b.title).includes(t))-Number(norm(a.title).includes(t)),0));
  matches=[...new Map(matches.map(r=>[r.path,r])).values()];
  message.textContent=matches.length?c.count+': '+matches.length:c.empty;
  for(const r of matches.slice(0,6)){
   const item=el('article','sfi-rg__source',null,results);
   const a=el('a','sfi-rg__source-link',r.title,item);
   const u=new URL(r.path,location.origin);if(language==='zh')u.searchParams.set('lang','zh-Hans');a.href=u.pathname+u.search;
   el('p','sfi-rg__meta',c.excerpt+(fallback?' · '+c.original+': '+r.lang:''),item);
   const first=terms.length?Math.max(0,norm(r.body).indexOf(terms[0])-45):0;
   el('p','sfi-rg__excerpt',(first?'… ':'')+r.body.slice(first,first+220)+(r.body.length>first+220?' …':''),item);
  }
 }
 launch.addEventListener('click',()=>{dialog.showModal();launch.setAttribute('aria-expanded','true');search();});
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{persist();launch.setAttribute('aria-expanded','false');launch.focus({preventScroll:true});});
 form.addEventListener('submit',e=>{e.preventDefault();e.stopPropagation();persist();search();});
 for(const n of [question,draft])n.addEventListener('input',persist);
 scope.addEventListener('change',()=>{persist();search();});
 clear.addEventListener('click',()=>{if(!window.confirm(c.confirm))return;question.value='';draft.value='';scope.value=direction;try{sessionStorage.removeItem(KEY);}catch{noStorage();}search();message.textContent=c.cleared;question.focus();});
 state={root,dialog,persist};return true;
}
function destroy(){if(!state)return;state.persist();if(state.dialog.open)state.dialog.close();state.root.remove();state=null;}
window.SFIRoomGuide={init,destroy};
// Explicit integration only: loading these assets does not inject controls on any page.
})();
