/* Pure search over public catalog records; no remote requests. */
(()=>{'use strict';
 const norm=v=>String(v||'').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 const valid=p=>p&&typeof p.path==='string'&&/^\/(?:[a-z0-9-]+\/)*$/.test(p.path)&&typeof p.title==='string'&&typeof p.body==='string';
 function query(pages,options={}){
  const terms=norm(options.query).trim().split(/\s+/).filter(Boolean).slice(0,8);
  const scope=['story','art','both'].includes(options.scope)?options.scope:'both';
  const rows=pages.filter(valid).filter(p=>p.lang===options.lang&&(scope==='both'||p.direction===scope)&&(!options.type||p.type===options.type)&&(!options.contributor||p.contributor===options.contributor)&&(!options.from||(p.publishedDate&&p.publishedDate>=options.from)));
  const results=rows.filter(p=>terms.every(t=>norm(p.title+' '+p.body).includes(t))).map(p=>{
   const score=terms.reduce((n,t)=>n+(norm(p.title).includes(t)?5:0)+(norm(p.body).includes(t)?1:0),0);
   const start=terms.length?Math.max(0,norm(p.body).indexOf(terms[0])-65):0;
   return {...p,score,snippet:(start?'… ':'')+p.body.slice(start,start+190)+(p.body.length>start+190?'…':'')};
  }).sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path));
  return {results,total:results.length};
 }
 window.SFIContentSearch={query};
})();
/* Editorial navigation and a local search of existing public pages. */
(() => {
  'use strict';
  let cleanup = [], root, en;
  const text = (no, yes) => en ? yes : no;
  const el = (tag, cls, value) => { const n = document.createElement(tag); n.className = cls || ''; if (value) n.textContent = value; return n; };
  const on = (n, event, fn) => { n.addEventListener(event, fn); cleanup.push(() => n.removeEventListener(event, fn)); };
  const mount = (n, parent) => { parent.append(n); cleanup.push(() => n.remove()); return n; };
  const normalize = value => value.toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const route = p => (en ? '/en' : '') + p;
  function search() {
    const host = root.querySelector('.site-tools') || root.querySelector('.mast') || root.querySelector('.sfi-top');
    if (!host) return;
    const zh=new URLSearchParams(location.search).get('lang')==='zh-Hans'||document.documentElement.lang.startsWith('zh');
    const t=(no,english,chinese)=>zh?chinese:en?english:no;
    const direction=document.body.dataset.siteDirection;
    const initial=['story','art'].includes(direction)?direction:'both';
    const labels={story:t('Stemmen','The Voice','声音'),art:t('Fra innsiden','From Inside','来自内部'),both:t('Begge retninger','Both directions','两个方向')};
    const button = mount(el('button', 'pe-search-toggle', t('Søk','Search','搜索')), host);
    button.type = 'button'; button.setAttribute('aria-haspopup', 'dialog');
    const dialog = mount(el('dialog', 'pe-search-dialog'), document.body);
    dialog.setAttribute('aria-label', t('Søk i publisert innhold','Search published content','搜索已发布内容'));
    const top = el('div', 'pe-search-top');
    const title = el('h2', '', t('Hva leter du etter?', 'What are you looking for?','您在寻找什么？'));
    const close = el('button', 'pe-search-close', '×'); close.type = 'button'; close.setAttribute('aria-label', t('Lukk søk','Close search','关闭搜索'));
    top.append(title, close);
    const label = el('label', 'pe-search-label', t('Søk i publiserte tekster','Search published texts','搜索原文'));
    const input = el('input', 'pe-search-input'); input.type = 'search'; input.maxLength=300;input.placeholder = t('For eksempel: familie, innsyn eller kunst','For example: family, records or art','例如：family、innsyn、kunst'); label.append(input);
    const filters=el('div','pe-search-filters');
    function select(labelText,items){const wrap=el('label','',labelText),s=el('select');for(const [value,name] of items){const o=el('option','',name);o.value=value;s.append(o)}wrap.append(s);filters.append(wrap);return s}
    const scope=select(t('Søkeområde','Search area','搜索范围'),Object.entries(labels));
    try{const saved=sessionStorage.getItem('sfi:search-scope:'+initial);scope.value=Object.hasOwn(labels,saved)?saved:initial}catch{scope.value=initial}
    const types={page:t('Side','Page','页面'),diary:t('Dagbok','Diary','日记'),book:t('Bok','Book','书籍'),press:t('Presse','Press','新闻'),tool:t('Verktøy','Tool','工具'),art:t('Kunst','Art','艺术'),music:t('Musikk','Music','音乐'),product:t('Produkt','Product','产品')};
    const type=select(t('Innholdstype','Content type','内容类型'),[['',t('Alle typer','All types','所有类型')],...Object.entries(types)]);
    const pages=window.StemmenSearch||[];
    const contributor=select(t('Bidragsyter i sidens metadata','Contributor in page metadata','页面署名'),[['',t('Alle bidragsytere','All contributors','所有贡献者')],...[...new Set(pages.map(p=>p.contributor).filter(Boolean))].sort().map(x=>[x,x])]);
    const dateLabel=el('label','',t('Publiseringsdato fra','Published from','发布日期起')),date=el('input');date.type='date';dateLabel.append(date);filters.append(dateLabel);
    date.disabled=!pages.some(p=>p.publishedDate);
    const filterKey='sfi:search-filters:'+initial;
    const validOption=(control,value)=>[...control.options].some(o=>o.value===value);
    try{const saved=JSON.parse(sessionStorage.getItem(filterKey)||'null');if(saved&&typeof saved==='object'){
      for(const [control,key]of [[scope,'scope'],[type,'type'],[contributor,'contributor']])if(validOption(control,saved[key]))control.value=saved[key];
      if(typeof saved.from==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(saved.from))date.value=saved.from;
    }}catch{}
    const saveFilters=()=>{try{sessionStorage.setItem(filterKey,JSON.stringify({scope:scope.value,type:type.value,contributor:contributor.value,from:date.value}));sessionStorage.setItem('sfi:search-scope:'+initial,scope.value)}catch{}};

    const dateNote=el('p','pe-search-privacy',t('Dato er bare søkbar når en kildeført publiseringsdato finnes. Udokumenterte datoer utledes ikke fra filnavn.','Dates are searchable only where a sourced publication date exists. Dates are not inferred from filenames.','仅筛选有来源的发布日期，不从文件名推断日期。'));
    const status = el('p', 'pe-search-status'); status.setAttribute('role', 'status');status.setAttribute('aria-live','polite');
    const list = el('div', 'pe-search-results');
    const expand=el('button','pe-search-expand',t('Utvid til begge retninger','Search both directions','搜索两个方向'));expand.type='button';
    const reset=el('button','pe-search-expand',t('Nullstill filtre','Reset filters','重置筛选'));reset.type='button';
    const privacy = el('p', 'pe-search-privacy', t('Søket skjer i nettleseren. Søkeordene dine sendes ikke inn. Område og filtervalg huskes i denne fanen.','Search runs in your browser. Search terms are not submitted. Area and filter choices are remembered in this tab.','搜索在浏览器本地运行，不发送搜索词。此标签页记住范围和筛选选择。'));
    dialog.append(top, label, filters,dateNote,status, list,expand,reset,privacy);
    let opener, timer;
    function render() {
      const result=window.SFIContentSearch.query(pages,{query:input.value,lang:en?'en':'no',scope:scope.value,type:type.value,contributor:contributor.value,from:date.value});
      const found=result.results.slice(0,20);
      list.replaceChildren();
      status.textContent=labels[scope.value]+' · '+t(`${result.total} treff${result.total>20?' · viser de første 20':''}`,`${result.total} results${result.total>20?' · showing the first 20':''}`,`${result.total} 个结果${result.total>20?' · 显示前20个':''}`)+(zh?' · '+t('','','搜索挪威语原文'): '');
      expand.hidden=scope.value==='both';
      for (const p of found) {
        const a = el('a', 'pe-search-result');const url=new URL(p.path,location.origin);if(zh)url.searchParams.set('lang','zh-Hans');a.href=url.href;
        a.append(el('strong', '', p.title));
        a.append(el('small','',labels[p.direction]||t('Felles','Shared','共用'))+' · '+(types[p.type]||types.page)+(p.contributor?' · '+p.contributor:'')+(p.publishedDate?' · '+p.publishedDate:''));
        a.append(el('span', '',p.snippet));
        a.addEventListener('click', () => dialog.close()); list.append(a);
      }
      if (!found.length) list.append(el('p', '',t('Ingen treff innen valgt område og filtre. Prøv færre ord, nullstill et filter eller utvid til begge retninger.','No results within this area and filters. Try fewer words, reset a filter or search both directions.','当前范围和筛选下没有结果。请减少关键词、重置筛选或搜索两个方向。')));
    }
    function open() { opener = document.activeElement; render(); dialog.showModal(); input.focus(); }
    on(button, 'click', open); on(close, 'click', () => dialog.close());
    on(dialog, 'keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dialog.close(); } });
    on(dialog, 'cancel', e => { e.preventDefault(); dialog.close(); });
    on(dialog, 'close', () => { opener?.focus(); });
    on(input, 'input', () => { clearTimeout(timer); timer = setTimeout(render, 100); });
    on(scope,'change',()=>{saveFilters();render()});
    for(const filter of [type,contributor,date])on(filter,'change',()=>{saveFilters();render()});
    on(expand,'click',()=>{scope.value='both';saveFilters();render()});
    on(reset,'click',()=>{scope.value=initial;type.value='';contributor.value='';date.value='';saveFilters();render()});
    on(document, 'keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !dialog.open && !e.target?.closest?.('input,textarea,[contenteditable="true"]')) { e.preventDefault(); open(); } });
    cleanup.push(() => clearTimeout(timer));
  }
  function journeys() {
    const invitation = root.querySelector('.ux-invitation'); if (!invitation) return;
    const paths = el('nav', 'pe-paths'); paths.setAttribute('aria-label', text('Velg din vei inn', 'Choose your way in'));
    const items = en ? [
      ['01 / THE STORY', 'Start with the person.', 'Read the account, at your own pace.', '#ux-story'],
      ['02 / THE ART', 'Let the images speak.', 'Explore 22 illustrations from the book.', '/en/bidrag/#ux-3d-gallery'],
      ['03 / YOUR NEXT STEP', 'Find the words you need.', 'Choose between requesting records and drafting a complaint.', '#pt-title']
    ] : [
      ['01 / FORTELLINGEN', 'Begynn med mennesket.', 'Les fortellingen i ditt eget tempo.', '#ux-story'],
      ['02 / KUNSTEN', 'La bildene tale.', 'Utforsk 22 illustrasjoner fra boken.', '/bidrag/#ux-3d-gallery'],
      ['03 / DITT NESTE STEG', 'Finn ordene du trenger.', 'Velg mellom innsyn og et utkast til klage.', '#pt-title']
    ];
    for (const [k,t,d,url] of items) { const a = el('a', 'pe-path'); a.href = url; a.append(el('small', '', k), el('h3', '', t), el('p', '', d), el('span', 'pe-path-arrow', '↗')); paths.append(a); }
    invitation.insertAdjacentElement('afterend', paths); cleanup.push(() => paths.remove());
  }
  function gallery() {
    const room = root.querySelector('.ux-gallery-room'); if (!room) return;
    const selector = room.querySelector('select'), source = room.querySelector('.ux-art-source');
    const controls = el('div', 'pe-curation');
    const label = el('label', '', text('Følg et tema', 'Follow a theme'));
    const filter = el('select', 'pe-theme'); const all = el('option', '', text('Hele samlingen', 'The full collection')); all.value = ''; filter.append(all);
    for (const tag of new Set((window.BookArt || []).map(a => en ? a.tagEn : a.tagNo))) { const o = el('option', '', tag); o.value = tag; filter.append(o); }
    label.append(filter);
    const full = el('button', 'pe-fullscreen', text('Åpne rommet i fullskjerm', 'Open the room full screen')); full.type = 'button';
    controls.append(label, full); room.querySelector('header').insertAdjacentElement('afterend', controls); cleanup.push(() => controls.remove());
    function caption() { const art = window.BookArt[Number(selector.value)]; if (art && source) source.textContent = `${en ? art.en : art.no} · ${window.BookArtSourceLabel?.(art,en) || (en ? 'R8 · PDF page ' : 'R8 · PDF-side ') + art.page} · KI-assistert · Innsatt 2601-46`; }
    on(filter, 'change', () => { const ids = window.BookArt.map((a,i) => ({a,i})).filter(({a}) => !filter.value || (en ? a.tagEn : a.tagNo) === filter.value); [...selector.options].forEach(o => { o.hidden = !ids.some(x => x.i === Number(o.value)); }); selector.value = String(ids[0].i); selector.dispatchEvent(new Event('change')); const chip = [...root.querySelectorAll('.pg-chip')].find(c => c.textContent === (filter.value || text('Alle','All'))); if (chip?.getAttribute('aria-pressed') !== 'true') chip?.click(); });
    for (const chip of root.querySelectorAll('.pg-chip')) on(chip, 'click', () => { const value = chip.textContent === text('Alle','All') ? '' : chip.textContent; if (filter.value !== value) { filter.value = value; filter.dispatchEvent(new Event('change')); } });
    for (const direction of ['prev', 'next']) {
      const original = room.querySelector(`[data-${direction}]`);
      const handle = e => { if (!filter.value) return; e.stopImmediatePropagation(); const shown = [...selector.options].filter(o => !o.hidden), index = shown.findIndex(o => o.value === selector.value); selector.value = shown[(index + (direction === 'prev' ? -1 : 1) + shown.length) % shown.length].value; selector.dispatchEvent(new Event('change')); };
      original.addEventListener('click', handle, true); cleanup.push(() => original.removeEventListener('click', handle, true));
    }
    on(room, 'change', caption); on(room, 'click', caption);
    on(full, 'click', async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else if (room.requestFullscreen) await room.requestFullscreen(); else throw Error('unavailable'); } catch { source.textContent = text('Fullskjerm støttes ikke her. Rommet kan fortsatt brukes nedenfor.', 'Full screen is unavailable here. You can still explore the room below.'); } });
    on(document, 'fullscreenchange', () => full.textContent = document.fullscreenElement ? text('Lukk fullskjerm', 'Exit full screen') : text('Åpne rommet i fullskjerm', 'Open the room full screen'));
    caption();
  }
  function method() {
    const footer = root.querySelector('.footer'); if (!footer) return;
    const note = el('details', 'pe-method'); note.append(el('summary', '', text('Om fortellingen, bildene og verktøyene', 'About the account, artwork and tools')));
    const grid = el('div', 'pe-method-grid');
    const rows = en ? [['The account','The texts describe the author’s experiences and assessments. A personal account and a verified finding are different kinds of sources.'],['The images','The illustrations are artistic interpretations made with AI assistance. They are not photographs documenting the events.'],['The tools','The record-request and complaint tools help structure your own draft. Check facts, recipients and deadlines before sending. The workshop uses fictional examples.']] : [['Fortellingen','Tekstene beskriver forfatterens egne opplevelser og vurderinger. En personlig fortelling og en etterprøvd konklusjon er ulike typer kilder.'],['Bildene','Illustrasjonene er kunstneriske tolkninger laget med KI-assistanse. De er ikke fotografier som dokumenterer hendelsene.'],['Verktøyene','Innsyns- og klageverktøyene hjelper deg å strukturere et eget utkast. Kontroller fakta, mottaker og frist før du sender. Verkstedet bruker oppdiktede eksempler.']];
    for (const [title,body] of rows) { const item=el('section'); item.append(el('h3','',title),el('p','',body)); grid.append(item); }
    note.append(grid); footer.insertAdjacentElement('beforebegin',note); cleanup.push(()=>note.remove());
  }
  function destroy() { cleanup.splice(0).reverse().forEach(fn => fn()); }
  function init(scope = document) { destroy(); root = scope; const path = scope.dataset?.premiumRoute || window.__existingPreview?.route || location.pathname; en = path.startsWith('/en/'); search(); journeys(); gallery(); method(); }
  window.PremiumExperience = {init, destroy};
})();
