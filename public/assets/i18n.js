/* Local UI translations only. Never transmit or translate form values or user documents. */
(()=>{'use strict';
 const languages={'zh-Hans':{name:'简体中文',label:'语言',notice:'部分界面已有中文翻译；未翻译的内容仍以挪威语或英语显示。PDF、Word、图片内文字和音频不会自动翻译。切换语言前请保存草稿。'},'yue-Hant':{name:'廣東話（繁體）',label:'語言',notice:'部分介面已有廣東話翻譯；未翻譯嘅內容會繼續以挪威文或英文顯示。PDF、Word、圖片入面嘅文字同音訊唔會自動翻譯。轉語言之前請儲存草稿。'}};
 const locale=new URL(location.href).searchParams.get('lang');const selected=Object.hasOwn(languages,locale)?locale:null;
 const aliases={'/kunstsamfunnet/':'/en/art-community/','/advokatkonto/':'/en/lawyer-account/','/advokatkonto/rapport/':'/en/lawyer-account/report/','/advokatvalg/':'/en/counsel-choice/','/analyse/':'/en/analysis/','/butikk/':'/en/shop/','/gjennomgang/':'/en/review/','/kunstfellesskap/':'/en/creative-community/','/kunstner/':'/en/artist/','/musikk/':'/en/music/','/originalverk/':'/en/original-art/','/samtaleregler/':'/en/discussion-rules/','/verksted/fellesskap/':'/en/verksted/community/'};
 const reverse=Object.fromEntries(Object.entries(aliases).map(([a,b])=>[b,a]));
 const current=location.pathname.endsWith('/')?location.pathname:location.pathname+'/';
 const newDetailNo=current.startsWith('/en/creative-community/art/')?current.replace('/en/creative-community/art/','/kunstfellesskap/verk/'):null;
 const detailNo=newDetailNo||(current.startsWith('/en/art-community/art/')?current.replace('/en/art-community/art/','/kunstsamfunnet/verk/'):null);
 const original=detailNo||reverse[current]||current.replace(/^\/en(?=\/)/,'')||'/';
 // Sensitive workspaces can render arbitrary document and user text. Restrict
 // translation there to navigation and explicitly safe page controls.
 const sensitive=/^\/(?:en\/)?(?:maite|inmaite|analyseverksted|analyse|analysis|klagehjelp|verksted|stemmer|gjennomgang|rettsspeil|advokatkonto|lawyer-account|review|bidrag|kunstner|artist|originalverk|original-art|musikk|music|counsel-choice|advokatvalg|art-community|kunstsamfunnet|creative-community|kunstfellesskap|innsyn-i-makt|butikk|shop)(?:\/|$)/.test(current);
 const newDetailEnglish=original.startsWith('/kunstfellesskap/verk/')?original.replace('/kunstfellesskap/verk/','/en/creative-community/art/'):null;
 const english=newDetailEnglish||(original.startsWith('/kunstsamfunnet/verk/')?original.replace('/kunstsamfunnet/verk/','/en/art-community/art/'):null)||aliases[original]||('/en'+(original==='/'?'/':original));
 const norm=value=>value.trim().replace(/\s+/g,' ');
 window.SFITranslate=value=>{if(!selected||typeof value!=='string')return value;return window.SFI_TRANSLATIONS?.[selected]?.[norm(value)]||value};
 let selector=document.getElementById('language-select');
 if(!selector){
  const bar=document.createElement('div');bar.className='sfi-language-bar';
  const label=document.createElement('label');label.htmlFor='sfi-language-select';label.textContent=document.documentElement.lang==='en'?'Language':'Språk';
  selector=document.createElement('select');selector.id='sfi-language-select';selector.setAttribute('aria-label',label.textContent);
  for(const [value,name] of [['no','Norsk'],['en','English']]){const option=document.createElement('option');option.value=value;option.textContent=name;selector.append(option)}
  selector.value=document.documentElement.lang==='en'?'en':'no';bar.append(label,selector);const navigation=document.querySelector('[data-site-navigation]');const skip=document.body.querySelector('a[href="#main"],a[href="#content"]');if(navigation)navigation.insertAdjacentElement('afterend',bar);else if(skip)skip.insertAdjacentElement('afterend',bar);else document.body.insertBefore(bar,document.body.firstChild);
 }
 for(const [value,info] of Object.entries(languages)){if(!selector.querySelector(`option[value="${value}"]`)){const option=document.createElement('option');option.value=value;option.textContent=info.name;selector.append(option)}}
 if(selected)selector.value=selected;
 let previous=selector.value,dirty=false;
 const noteEdit=event=>{const target=event.target;if(!sensitive||!event.isTrusted||target===selector||!target?.matches?.('textarea,input,[contenteditable],form select'))return;dirty=true};
 document.addEventListener('input',noteEdit,true);document.addEventListener('change',noteEdit,true);
 document.addEventListener('change',event=>{
  if(event.target!==selector)return;
  const value=selector.value;
  if(sensitive&&dirty){const message=value==='zh-Hans'?'切换语言会重新载入页面，未保存的内容可能丢失。请先保存草稿。是否继续？':value==='yue-Hant'?'轉語言會重新載入頁面，未儲存嘅內容可能會遺失。請先儲存草稿。要繼續嗎？':value==='en'?'Changing language reloads the page and unsaved work may be lost. Save your draft first. Continue?':'Språkbytte laster siden på nytt, og ulagret arbeid kan gå tapt. Lagre utkastet først. Vil du fortsette?';if(!window.confirm(message)){event.stopImmediatePropagation();selector.value=previous;return}}
  previous=value;
  if(Object.hasOwn(languages,value)){
   event.stopImmediatePropagation();const url=new URL(location.href);url.searchParams.set('lang',value);location.assign(url.href);
  }else if(selector.id==='sfi-language-select'){
   event.stopImmediatePropagation();const url=new URL(location.href);url.pathname=value==='en'?english:original;url.searchParams.delete('lang');location.assign(url.href);
  }
 },true);
 if(!selected)return;
 const notice=document.createElement('p');notice.className='sfi-language-notice';notice.lang=selected;notice.textContent=languages[selected].notice;
 if(/^\/(?:en\/)?dagbok\/treningsbeltet\/$/.test(current))notice.textContent+=selected==='zh-Hans'?' 本文翻译尚未经独立语言审核。':' 呢篇翻譯尚未經獨立語言審校。';
 selector.closest('.ppt-language,.language-control,.sfi-language-bar,.ac-language')?.insertAdjacentElement('afterend',notice);
 document.addEventListener('click',event=>{
  const link=event.target.closest?.('a[href]');if(!link||link.hasAttribute('download'))return;
  const raw=link.getAttribute('href');if(!raw||raw[0]==='#')return;
  let url;try{url=new URL(raw,location.href)}catch{return}
  if(url.origin!==location.origin||!/^https?:$/.test(url.protocol)||url.pathname.startsWith('/api/')||/\.(?:pdf|docx?|txt|jpe?g|png|webp|mp3|mp4|vtt|zip)$/i.test(url.pathname))return;
  // Explicit Norwegian/English navigation exits the partial CJK translation.
  // Other internal links retain it, together with their selected-artwork state.
  if(link.matches('[data-language-link]')){url.searchParams.delete('lang');link.href=url.href;return}
  url.searchParams.set('lang',selected);link.href=url.href;
 },true);
 // Only fixed, non-editable interface text is eligible; never touch form values,
 // editable areas, quotations, artist names/titles, or user-generated content.
 const excluded='script,style,noscript,pre,code,blockquote,textarea,select,option,[contenteditable],.sfi-language-notice,.ig-card h2,.ig-card-credit,.ig-detail h2,.ig-provenance,[data-user-content],[data-work-id],.community-work,.creative-work,.community-card,[data-contribution-id],[data-post-id],[data-creative-id],[data-offer-id],#community-posts,#community-detail,#community-gallery-items,#community-moderation-items,#creative-items,#creative-offer-list,.wl-card,#creative-offer-title,#action-summary,.ig-card-open img';
 // Only text nodes already present in explicitly marked editorial sections may
 // be translated on sensitive routes. Newly inserted content is never eligible.
 const editorialText=new WeakMap();for(const section of document.querySelectorAll('[data-i18n-static]')){const walker=document.createTreeWalker(section,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))editorialText.set(node,node.nodeValue)}
 const translated=new WeakMap();
 function safe(element,node){return !sensitive||!!element.closest('header,nav,footer,.ppt-tools,.site-tools,.sfi-language-bar')||!!(node&&editorialText.get(node)===node.nodeValue)}
 function apply(root){
  if(root.nodeType===Node.TEXT_NODE){const parent=root.parentElement;if(!parent||!safe(parent,root)||parent.closest(excluded))return;const raw=root.nodeValue;if(translated.get(root)===raw)return;const translatedValue=window.SFITranslate(raw);if(translatedValue!==raw&&translatedValue!==norm(raw)){const before=raw.match(/^\s*/)[0],after=raw.match(/\s*$/)[0],output=before+translatedValue+after;translated.set(root,output);root.nodeValue=output;if(parent.childNodes.length===1)parent.lang=selected}return}
  if(root.nodeType!==Node.ELEMENT_NODE&&root.nodeType!==Node.DOCUMENT_NODE)return;
  if(root.nodeType===Node.ELEMENT_NODE&&root.matches(excluded))return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode()))apply(node);
  if(root.nodeType===Node.ELEMENT_NODE){for(const element of [root,...root.querySelectorAll('[placeholder],[aria-label],[title],[alt]')]){if(!safe(element)||element.closest(excluded)||element.matches('input[type="file"]'))continue;for(const attr of ['placeholder','aria-label','title','alt']){const value=element.getAttribute(attr);if(!value)continue;const result=window.SFITranslate(value);if(result!==value)element.setAttribute(attr,result)}}}
 }
 const script=document.createElement('script');script.src='/i18n/'+selected+'.js';script.onload=()=>{
  const startTranslation=()=>{
  apply(document.body);document.title=window.SFITranslate(document.title);
  const observer=new MutationObserver(records=>{for(const record of records){if(record.type==='characterData')apply(record.target);else for(const node of record.addedNodes)apply(node)}});
  observer.observe(document.body,{childList:true,subtree:true,characterData:true});window.dispatchEvent(new Event('sfi-language-ready'));
  };
  if(selected==='zh-Hans'){
   const supplement=document.createElement('script');supplement.src='/i18n/zh-Hans-navigation.js';const loadJourney=()=>{const journey=document.createElement('script');journey.src='/i18n/zh-Hans-journey.js';journey.onload=startTranslation;journey.onerror=startTranslation;document.head.append(journey)};supplement.onload=loadJourney;supplement.onerror=loadJourney;document.head.append(supplement);
  }else startTranslation();
 };script.onerror=()=>{notice.textContent=selected==='zh-Hans'?'暂时无法载入翻译；内容仍以原语言显示。PDF、Word、图片文字和音频不会自动翻译。':'暫時載入唔到翻譯；內容會繼續以原文顯示。PDF、Word、圖片文字同音訊唔會自動翻譯。'};document.head.append(script);
})();
