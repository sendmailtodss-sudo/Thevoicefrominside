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
    const host = root.querySelector('.site-tools') || root.querySelector('.mast');
    if (!host) return;
    const button = mount(el('button', 'pe-search-toggle', text('Søk på siden', 'Search the site')), host);
    button.type = 'button'; button.setAttribute('aria-haspopup', 'dialog');
    const dialog = mount(el('dialog', 'pe-search-dialog'), document.body);
    dialog.setAttribute('aria-label', text('Søk i fortellinger og verktøy', 'Search stories and tools'));
    const top = el('div', 'pe-search-top');
    const title = el('h2', '', text('Hva leter du etter?', 'What are you looking for?'));
    const close = el('button', 'pe-search-close', '×'); close.type = 'button'; close.setAttribute('aria-label', text('Lukk søk', 'Close search'));
    top.append(title, close);
    const label = el('label', 'pe-search-label', text('Søk i sidens publiserte tekster', 'Search the site’s published texts'));
    const input = el('input', 'pe-search-input'); input.type = 'search'; input.placeholder = text('For eksempel: familie, innsyn eller klage', 'For example: family, records or complaint'); label.append(input);
    const status = el('p', 'pe-search-status'); status.setAttribute('role', 'status');
    const list = el('div', 'pe-search-results');
    const privacy = el('p', 'pe-search-privacy', text('Søket skjer i nettleseren. Søkeordene dine sendes ikke inn.', 'Search runs in your browser. Your search terms are not submitted.'));
    dialog.append(top, label, status, list, privacy);
    let opener, timer;
    function render() {
      const terms = normalize(input.value.trim()).split(/\s+/).filter(Boolean).slice(0, 8);
      const pages = (window.StemmenSearch || []).filter(p => p.lang === (en ? 'en' : 'no'));
      const found = pages.map(p => ({...p, score: terms.reduce((score, term) => score + (normalize(p.title).includes(term) ? 5 : 0) + (normalize(p.body).includes(term) ? 1 : 0), 0)}))
        .filter(p => !terms.length || terms.every(t => normalize(p.title + ' ' + p.body).includes(t))).sort((a,b) => b.score - a.score).slice(0, 12);
      list.replaceChildren(); status.textContent = terms.length ? text(`${found.length} sider funnet`, `${found.length} pages found`) : text('Velg et utgangspunkt, eller skriv et søkeord.', 'Choose a starting point, or enter a search term.');
      for (const p of found) {
        const a = el('a', 'pe-search-result'); a.href = p.path;
        a.append(el('strong', '', p.title));
        const pos = terms.length ? Math.max(0, normalize(p.body).indexOf(terms[0]) - 65) : 0;
        a.append(el('span', '', (pos ? '… ' : '') + p.body.slice(pos, pos + 190) + '…'));
        a.addEventListener('click', () => dialog.close()); list.append(a);
      }
      if (!found.length) list.append(el('p', '', text('Prøv et kortere ord. Du kan også bruke menyen til fortellingen, boken og verktøyene.', 'Try a shorter word, or use the navigation to find the story, book and tools.')));
    }
    function open() { opener = document.activeElement; render(); dialog.showModal(); input.focus(); }
    on(button, 'click', open); on(close, 'click', () => dialog.close());
    on(dialog, 'keydown', e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); dialog.close(); } });
    on(dialog, 'cancel', e => { e.preventDefault(); dialog.close(); });
    on(dialog, 'close', () => { input.value = ''; opener?.focus(); });
    on(input, 'input', () => { clearTimeout(timer); timer = setTimeout(render, 100); });
    on(document, 'keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k' && !dialog.open) { e.preventDefault(); open(); } });
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
