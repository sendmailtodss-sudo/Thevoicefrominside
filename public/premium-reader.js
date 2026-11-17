/* Optional editorial reading aid. No network requests or automatic storage. */
(() => {
  'use strict';
  const LEGACY_KEY = 'stemmen:reader-bookmark:v1';
  const KEY = 'stemmen:reader-local:v2';
  const empty=()=>({format:'sfi-reader-local',version:2,entries:[]});
  const core=()=>window.SFIReaderLocal;
  const readLocal=()=>{const raw=localStorage.getItem(KEY);if(raw)return core().validate(JSON.parse(raw));const data=empty();try{const old=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null');if(old&&core().validPath(old.path)&&Number.isFinite(old.percent)&&old.percent>=0&&old.percent<=100)data.entries.push({path:old.path,percent:old.percent,note:''})}catch{}return data};
  const writeLocal=data=>localStorage.setItem(KEY,JSON.stringify(core().validate(data)));
  const setRecord=(path,change)=>{const data=readLocal(),old=data.entries.find(r=>r.path===path)||{path,percent:null,note:''};const merged=core().merge(data,{format:'sfi-reader-local',version:2,entries:[{...old,...change}]});merged.entries=merged.entries.filter(r=>r.percent!==null||r.note);writeLocal(merged)};
  let state = null;
  const copy = {
    zh: { label:'阅读指南',time:'分钟阅读',contents:'目录',save:'保存阅读位置',resume:'继续阅读',clear:'删除书签',saved:'书签已保存在此浏览器中。',removed:'书签已删除。',unavailable:'此浏览器无法使用存储。' },
    no: { label: 'Leseguide', time: 'min lesetid', contents: 'Innhold', save: 'Husk hvor jeg er', resume: 'Gjenoppta lesingen', clear: 'Slett bokmerke', saved: 'Bokmerke lagret i denne nettleseren.', removed: 'Bokmerke slettet.', unavailable: 'Lagring er ikke tilgjengelig i denne nettleseren.' },
    en: { label: 'Reading guide', time: 'min read', contents: 'Contents', save: 'Save my place', resume: 'Resume reading', clear: 'Delete bookmark', saved: 'Bookmark saved in this browser.', removed: 'Bookmark deleted.', unavailable: 'Storage is unavailable in this browser.' }
  };
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const getBookmark = route => {
    try {
      const item = readLocal().entries.find(r=>r.path===route);
      return item && item.path === route && Number.isFinite(item.percent) && item.percent >= 0 && item.percent <= 100 ? item : null;
    } catch (_) { return null; }
  };
  const articleTop = article => article.getBoundingClientRect().top + window.scrollY;
  const scrollPercent = article => {
    const height = Math.max(1, article.getBoundingClientRect().height);
    return Math.round(Math.min(100, Math.max(0, (window.scrollY - articleTop(article)) / height * 100)));
  };
  function destroy() {
    if (!state) return;
    state.panel.remove();
    state.cleanupReading?.();
    state.restoreAppearance?.();
    state.generatedIds.forEach(node => node.removeAttribute('id'));
    state.focusCleanups.forEach(cleanup => cleanup());
    state = null;
  }
  function init(root = document) {
    destroy();
    if (!root || typeof root.querySelector !== 'function') return;
    if(!core())return;
    const overview=/^\/(?:en\/)?boken\/?$/.test(root.dataset?.premiumRoute||window.__existingPreview?.route||location.pathname);
    const article = root.matches?.('article.page') ? root : root.querySelector('article.page')||(overview?root.querySelector('main > .reading'):null);
    if (!article) return;
    const route = root.dataset?.premiumRoute || root.closest?.('[data-premium-route]')?.dataset.premiumRoute || window.__existingPreview?.route || location.pathname;
    const lang = route ? (route.startsWith('/en/') || route === '/en' ? 'en' : 'no') : ((document.documentElement.lang || '').startsWith('en') ? 'en' : 'no');
    const readerZh=new URLSearchParams(location.search).get('lang')==='zh-Hans';
    const t = copy[readerZh?'zh':lang];
    const headings = Array.from(article.querySelectorAll('h2,h3')).filter(h => h.textContent.trim());
    const text = article.innerText || article.textContent || '';
    const words = (text.match(/\S+/g) || []).length;
    if (words < 80 && headings.length < 2) return;
    const panel = element('aside', 'premium-reader');
    panel.setAttribute('aria-label', t.label);
    const top = element('div', 'premium-reader__top');
    const eyebrow = element('span', 'premium-reader__eyebrow', t.label);
    const time = element('span', 'premium-reader__time', `${Math.max(1, Math.ceil(words / 220))} ${t.time}`);
    top.append(eyebrow, time);
    panel.append(top);
    if(readerZh){const originalNotice=element('p','premium-reader__locale-note',lang==='en'?'部分辅助阅读和笔记控件仍显示英语原文。':'部分辅助阅读和笔记控件仍显示挪威语原文。');originalNotice.lang='zh-Hans';panel.append(originalNotice)}
    const generatedIds = [];
    const focusCleanups = [];
    if (headings.length) {
      const details = element('details', 'premium-reader__contents');
      const summary = element('summary', '', `${t.contents} · ${headings.length}`);
      const nav = element('nav', 'premium-reader__nav');
      nav.setAttribute('aria-label', t.contents);
      const list = element('ol', 'premium-reader__list');
      headings.forEach((heading, index) => {
        if (!heading.id) {
          let id = `premium-reader-${index + 1}`;
          let suffix = 2;
          while (document.getElementById(id)) id = `premium-reader-${index + 1}-${suffix++}`;
          heading.id = id;
          generatedIds.push(heading);
        }
        const item = element('li', heading.tagName === 'H3' ? 'premium-reader__sub' : '');
        const link = element('a', '', heading.textContent.trim());
        link.href = `#${encodeURIComponent(heading.id)}`;
        link.addEventListener('click', () => {
          const hadTabindex = heading.hasAttribute('tabindex');
          const previous = heading.getAttribute('tabindex');
          if (!hadTabindex) heading.setAttribute('tabindex', '-1');
          requestAnimationFrame(() => heading.focus({ preventScroll: true }));
          const restore = () => {
            if (!hadTabindex) heading.removeAttribute('tabindex');
            else heading.setAttribute('tabindex', previous);
            heading.removeEventListener('blur', restore);
          };
          heading.addEventListener('blur', restore, { once: true });
          focusCleanups.push(restore);
        });
        item.append(link);
        list.append(item);
      });
      nav.append(list);
      details.append(summary, nav);
      panel.append(details);
    }
    /* Reader choices affect only this reading surface, never original media. */
    const appearanceKey='sfi-reader-appearance-v1';
    let appearance={theme:'dark',size:Math.min(26,Math.max(16,Math.round(parseFloat(getComputedStyle(article).fontSize)||19)))};
    try{const previous=JSON.parse(sessionStorage.getItem(appearanceKey));if(previous&&['dark','light'].includes(previous.theme)&&Number.isFinite(previous.size)&&previous.size>=16&&previous.size<=26)appearance={theme:previous.theme,size:previous.size}}catch{}
    const originalTheme=article.getAttribute('data-reader-theme'),originalSize=article.style.getPropertyValue('--reader-font-size'),originalPriority=article.style.getPropertyPriority('--reader-font-size');
    const restoreAppearance=()=>{if(originalTheme===null)article.removeAttribute('data-reader-theme');else article.setAttribute('data-reader-theme',originalTheme);if(originalSize)article.style.setProperty('--reader-font-size',originalSize,originalPriority);else article.style.removeProperty('--reader-font-size')};
    const zh=new URLSearchParams(location.search).get('lang')==='zh-Hans';
    const appearanceWords=zh?{label:'阅读外观',dark:'深色',light:'浅色',smaller:'缩小文字',larger:'放大文字'}:lang==='en'?{label:'Reading appearance',dark:'Dark',light:'Light',smaller:'Smaller text',larger:'Larger text'}:{label:'Leseflate',dark:'Mørk',light:'Lys',smaller:'Mindre tekst',larger:'Større tekst'};
    const appearanceControls=element('div','premium-reader__appearance');appearanceControls.setAttribute('role','group');appearanceControls.setAttribute('aria-label',appearanceWords.label);
    const appearanceTitle=element('span','premium-reader__appearance-label',appearanceWords.label);appearanceControls.append(appearanceTitle);
    const readingNodes=Array.from(article.querySelectorAll(article.querySelector('.original-text')?'.original-text p,.original-text h2,.original-text h3,blockquote':':scope > p,:scope > h2,:scope > h3,blockquote')).filter(node=>!panel.contains(node)&&!node.classList.contains('byline'));
    const focusReadingNode=node=>{if(!node)return;const had=node.hasAttribute('tabindex'),previous=node.getAttribute('tabindex');if(!had)node.setAttribute('tabindex','-1');node.focus({preventScroll:true});const restore=()=>{if(!had)node.removeAttribute('tabindex');else node.setAttribute('tabindex',previous);node.removeEventListener('blur',restore)};node.addEventListener('blur',restore,{once:true});focusCleanups.push(restore)};
    const readingAnchor=()=>{const line=120,node=readingNodes.find(node=>node.getBoundingClientRect().bottom>line)||article,box=node.getBoundingClientRect();return{node,top:box.top,height:box.height,fraction:box.top<line?Math.min(1,(line-box.top)/Math.max(1,box.height)):0}};
    const appearanceButtons=[];
    const applyAppearance=persist=>{const anchor=persist?readingAnchor():null;article.dataset.readerTheme=appearance.theme;article.style.setProperty('--reader-font-size',appearance.size+'px');appearanceButtons.forEach(button=>{if(button.dataset.readerThemeChoice)button.setAttribute('aria-pressed',String(button.dataset.readerThemeChoice===appearance.theme));else button.disabled=button.dataset.readerSize==='down'?appearance.size<=16:appearance.size>=26});if(persist){try{sessionStorage.setItem(appearanceKey,JSON.stringify(appearance))}catch{}}if(anchor)requestAnimationFrame(()=>{const box=anchor.node.getBoundingClientRect();window.scrollBy(0,box.top+box.height*anchor.fraction-anchor.top-anchor.height*anchor.fraction)})};
    const choice=(text,label,action)=>{const button=element('button','',text);button.type='button';button.setAttribute('aria-label',label);button.addEventListener('click',()=>{action();applyAppearance(true)});appearanceButtons.push(button);appearanceControls.append(button);return button};
    for(const theme of ['dark','light']){const button=choice(appearanceWords[theme],appearanceWords[theme],()=>{appearance.theme=theme});button.dataset.readerThemeChoice=theme}
    const smaller=choice('A−',appearanceWords.smaller,()=>{appearance.size=Math.max(16,appearance.size-2)});smaller.dataset.readerSize='down';
    const larger=choice('A+',appearanceWords.larger,()=>{appearance.size=Math.min(26,appearance.size+2)});larger.dataset.readerSize='up';
    panel.append(appearanceControls);
    let lastReadingPercent=null;
    const rememberReading=()=>{if(readingNodes.some(node=>{const box=node.getBoundingClientRect();return box.top<=140&&box.bottom>140}))lastReadingPercent=scrollPercent(article)};
    addEventListener('scroll',rememberReading,{passive:true});
    // Existing floating A-/A+ tools share this appearance state instead of
    // maintaining a second independent font size. Their top action stays native.
    const legacyZoom=event=>{const button=event.target.closest?.('.reader-tools button');if(!button)return;const index=Array.from(button.parentElement.children).indexOf(button);if(index!==0&&index!==1)return;event.preventDefault();event.stopImmediatePropagation();(index===0?smaller:larger).click()};
    document.addEventListener('click',legacyZoom,true);
    const cleanupReading=()=>{removeEventListener('scroll',rememberReading);document.removeEventListener('click',legacyZoom,true)};
    applyAppearance(false);
    const actions = element('div', 'premium-reader__actions');
    const save = element('button', '', t.save);
    save.type = 'button';
    const resume = element('button', '', t.resume);
    resume.type = 'button';
    const clear = element('button', 'premium-reader__quiet', t.clear);
    clear.type = 'button';
    const status = element('span', 'premium-reader__status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const update = () => {
      const exists = !!getBookmark(route);
      resume.hidden = !exists;
      clear.hidden = !exists;
    };
    save.addEventListener('click', () => {
      try {
        setRecord(route,{percent:lastReadingPercent??scrollPercent(article)});
        status.textContent = t.saved;
      } catch (_) { status.textContent = t.unavailable; }
      update();
    });
    resume.addEventListener('click', () => {
      const item = getBookmark(route);
      if (!item) return update();
      const top = articleTop(article) + article.getBoundingClientRect().height * item.percent / 100;
      window.scrollTo({ top: Math.min(top, Math.max(0, document.documentElement.scrollHeight - window.innerHeight)), behavior: 'instant' });
      requestAnimationFrame(()=>focusReadingNode(readingNodes.find(node=>node.getBoundingClientRect().bottom>120)||article));
    });
    clear.addEventListener('click', () => {
      if(!confirm(readerZh?'删除此页的书签？':lang==='en'?'Delete the bookmark for this page?':'Slette bokmerket for denne siden?'))return;
      try { setRecord(route,{percent:null});const old=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null');if(old?.path===route)localStorage.removeItem(LEGACY_KEY);status.textContent = t.removed; }
      catch (_) { status.textContent = t.unavailable; }
      update();
    });
    actions.append(save, resume, clear, status);
    panel.append(actions);
    const local=element('details','premium-reader__local');if(new URLSearchParams(location.search).get('lang')==='zh-Hans'){local.lang=lang==='en'?'en':'nb';local.append(element('p','',lang==='en'?'以下私人笔记工具目前显示英语原文。笔记不会发送或随分享链接公开。':'以下私人笔记工具目前显示挪威语原文。笔记不会发送或随分享链接公开。'))}const summary=element('summary','',lang==='en'?'Private notes and backup':'Private notater og sikkerhetskopi');local.append(summary);
    local.append(element('p','',lang==='en'?'Notes stay in this browser when you save them. They are not sent or included in share links. Export a private copy before changing devices.':'Notater blir i denne nettleseren når du lagrer dem. De sendes ikke og følger ikke delingslenker. Eksporter en privat kopi før du bytter enhet.'));
    const noteLabel=element('label','',lang==='en'?'Note for this page':'Notat til denne siden'),note=element('textarea');note.rows=4;note.maxLength=20000;noteLabel.append(note);local.append(noteLabel);
    try{note.value=readLocal().entries.find(r=>r.path===route)?.note||''}catch{status.textContent=t.unavailable}
    const localActions=element('div','premium-reader__actions');
    const button=(label,action)=>{const b=element('button','',label);b.type='button';b.addEventListener('click',action);localActions.append(b);return b};
    button(lang==='en'?'Save note':'Lagre notat',()=>{try{setRecord(route,{note:note.value});status.textContent=lang==='en'?'Note saved locally.':'Notatet er lagret lokalt.'}catch{status.textContent=t.unavailable}});
    button(lang==='en'?'Delete note':'Slett notat',()=>{if(!confirm(lang==='en'?'Delete this saved note?':'Slette dette lagrede notatet?'))return;try{setRecord(route,{note:''});note.value='';status.textContent=lang==='en'?'Note deleted.':'Notatet er slettet.'}catch{status.textContent=t.unavailable}});
    button(lang==='en'?'Export bookmarks and notes':'Eksporter bokmerker og notater',()=>{try{const data={...readLocal(),exportedAt:new Date().toISOString()},url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='stemmen-private-lesedata.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);status.textContent=lang==='en'?'Private backup prepared for download.':'Privat sikkerhetskopi klargjort for nedlasting.'}catch{status.textContent=t.unavailable}});
    const file=element('input');file.type='file';file.accept='.json,application/json';file.hidden=true;
    button(lang==='en'?'Import backup':'Importer sikkerhetskopi',()=>file.click());
    file.addEventListener('change',async()=>{const selected=file.files?.[0];if(!selected)return;try{
      if(selected.size>3*1024*1024)throw Error('file_size');
      const paths=new Set((window.StemmenSearch||[]).map(r=>r.path));if(!paths.size)throw Error('catalog_unavailable');
      const incoming=core().validate(JSON.parse(await selected.text()),paths),current=readLocal();
      const overlaps=incoming.entries.filter(r=>current.entries.some(x=>x.path===r.path)).length;
      if(overlaps&&!confirm(lang==='en'?`Replace ${overlaps} matching local page records? Other records are kept.`:`Erstatte ${overlaps} lokale sideoppføringer med samme lenke? Andre oppføringer beholdes.`))return;
      const merged=core().merge(current,incoming);writeLocal(merged);note.value=merged.entries.find(r=>r.path===route)?.note||'';update();status.textContent=lang==='en'?'Backup imported locally.':'Sikkerhetskopien er importert lokalt.';
    }catch{status.textContent=lang==='en'?'Import failed. Existing records are unchanged. Use a valid backup for currently published pages, up to 3 MB.':'Importen feilet. Eksisterende oppføringer er uendret. Bruk en gyldig kopi for nåværende offentlige sider, inntil 3 MB.'}finally{file.value=''}});
    local.append(localActions,file);panel.append(local);
    const overviewTitle=overview?article.querySelector(':scope > h1'):null;
    if(overviewTitle)overviewTitle.insertAdjacentElement('afterend',panel);else article.prepend(panel);
    state = { panel, generatedIds, focusCleanups, restoreAppearance, cleanupReading };
    update();
  }
  window.PremiumReader = { init, destroy };
})();
