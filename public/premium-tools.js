/* Progressive guide for the existing resources. No network calls or draft storage. */
(function () {
  'use strict';
  let active = [];
  const content = {
    no: { kicker:'Utforsk verktøyene · steg for steg', heading:'Fra spørsmål til neste steg', intro:'Velg det du trenger. Se hva du bør gjøre klart før du åpner verktøyet.', choose:'Velg verktøy', previous:'Forrige', next:'Neste steg', step:'Steg',
      modes:[
        {title:'Krev innsyn',tag:'Fire maler',href:'/innsyn/',action:'Se malene',steps:[['Velg hva du vil be om','Velg mellom egne opplysninger, Infoflyt, offentlige dokumenter eller oppfølging.'],['Tilpass malen','Oppgi relevante enheter og tidsrom. Fyll ut feltene i hakeparenteser.'],['Last ned og send','Last ned PDF, Word eller tekst. Bruk sikker innsending for sensitive opplysninger, og behold kopi.']]},
        {title:'Klagehjelp',tag:'Utkast i nettleseren',href:'/klagehjelp/',action:'Åpne klagehjelpen',steps:[['Finn vedtaket','Ha vedtaksteksten og klageveiledningen klar. Du kan lime inn tekst eller åpne en .txt-fil lokalt.'],['Beskriv klagen','Fyll inn hva du ønsker endret og hvorfor. Kontroller selv oppgitt eller avklart klagefrist.'],['Les og lagre','Lag et kort eller fullstendig utkast, rediger teksten og last ned eller skriv ut før du sender selv.']]},
        {title:'Bidra med kunst',tag:'Leserbidrag',href:'/bidrag/#community-create',action:'Se bidragssiden',steps:[['Velg uttrykk','Lag et bilde eller et musikkbidrag inspirert av historien.'],['Gjør klart bidraget','Ha fil, tittel, kreditering og informasjon om hvordan bidraget ble laget klar.'],['Se innsendingsløpet','På bidragssiden kan du logge inn og sende til redaksjonell vurdering. Godkjente bidrag kan vises offentlig.']]}
      ]},
    en: { kicker:'Explore the tools · step by step', heading:'From a question to your next step', intro:'Choose what you need. See what to prepare before opening the tool.', choose:'Choose a tool', previous:'Previous', next:'Next step', step:'Step',
      modes:[
        {title:'Request access',tag:'Four templates',href:'/en/innsyn/',action:'View the templates',steps:[['Choose your request','Choose personal records, Infoflyt, public documents or follow-up.'],['Adapt the template','Specify relevant units and dates. Fill in the bracketed fields.'],['Download and send','Download PDF, Word or text. Use secure submission for sensitive details and keep a copy.']]},
        {title:'Complaint help',tag:'Draft in your browser',href:'/en/klagehjelp/',action:'Open complaint help',steps:[['Find the decision','Have the decision and appeal guidance ready. Paste text or open a local .txt file.'],['Describe your appeal','State the change you seek and your reasons. Check the stated or confirmed deadline yourself.'],['Review and save','Create a short or full draft, edit it, then download or print before sending it yourself.']]},
        {title:'Contribute art',tag:'Reader contributions',href:'/en/bidrag/#community-create',action:'See contribution page',steps:[['Choose a format','Create an image or music piece inspired by the story.'],['Prepare your work','Have the file, title, credit and information about how it was made ready.'],['See how submission works','On the contribution page you can sign in and submit for editorial review. Approved work may be shown publicly.']]}
      ]}
  };
  function make(html) { const node = document.createElement('div'); node.innerHTML = html.trim(); return node.firstElementChild; }
  function mount(host, node, before) { host.insertBefore(node, before || null); active.push(node); }
  function guide(lang) {
    const c = content[lang], modes = c.modes;
    const node = make(`<section class="pt-guide" aria-labelledby="pt-title"><div class="pt-guide-copy"><p class="pt-kicker">${c.kicker}</p><h2 id="pt-title">${c.heading}</h2><p>${c.intro}</p><div class="pt-choices" role="group" aria-label="${c.choose}"></div></div><div class="pt-stage"><div class="pt-visual" aria-hidden="true"><span class="pt-sheet pt-sheet-back"></span><span class="pt-sheet pt-sheet-middle"></span><span class="pt-sheet pt-sheet-front"><i></i><i></i><i></i><b></b></span></div><div class="pt-stage-copy"><p class="pt-step" aria-live="polite"></p><h3 class="pt-mode-title"></h3><p class="pt-mode-description"></p><ol class="pt-steps"></ol><div class="pt-controls"><button type="button" class="pt-prev">${c.previous}</button><button type="button" class="pt-next">${c.next}</button><a class="pt-open" href="${modes[0].href}">${modes[0].action} <span aria-hidden="true">↗</span></a></div></div></div></section>`);
    const choices = node.querySelector('.pt-choices');
    modes.forEach((m, i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pt-choice'; b.innerHTML = `<span>${m.title}</span><small>${m.tag}</small>`; b.addEventListener('click', () => { selected = i; step = 0; render(); }); choices.append(b); });
    let selected = 0, step = 0;
    const render = () => {
      const m = modes[selected];
      node.dataset.mode = String(selected); node.dataset.step = String(step);
      node.querySelectorAll('.pt-choice').forEach((b,i) => { b.setAttribute('aria-pressed', String(i === selected)); });
      node.querySelector('.pt-step').textContent = lang === 'en' ? `${c.step} ${step + 1} of 3` : `${c.step} ${step + 1} av 3`;
      node.querySelector('.pt-mode-title').textContent = m.steps[step][0];
      node.querySelector('.pt-mode-description').textContent = m.steps[step][1];
      node.querySelector('.pt-steps').innerHTML = m.steps.map((s,i) => `<li class="${i === step ? 'current' : ''}">${s[0]}</li>`).join('');
      node.querySelector('.pt-prev').disabled = step === 0;
      node.querySelector('.pt-next').disabled = step === 2;
      const a = node.querySelector('.pt-open'); a.href = m.href; a.firstChild.textContent = `${m.action} `;
    };
    node.querySelector('.pt-prev').addEventListener('click', () => { step = Math.max(0, step - 1); render(); });
    node.querySelector('.pt-next').addEventListener('click', () => { step = Math.min(2, step + 1); render(); });
    node.addEventListener('keydown', e => { if (!node.contains(document.activeElement) || !['ArrowLeft','ArrowRight'].includes(e.key)) return; if (document.activeElement.closest('.pt-choices')) { selected = (selected + (e.key === 'ArrowRight' ? 1 : 2)) % 3; step = 0; render(); node.querySelectorAll('.pt-choice')[selected].focus(); e.preventDefault(); } else if (document.activeElement.closest('.pt-controls')) { step = Math.max(0, Math.min(2, step + (e.key === 'ArrowRight' ? 1 : -1))); render(); e.preventDefault(); } });
    render(); return node;
  }
  function insight(lang, scope) {
    const en = lang === 'en';
    const node = make(en ? `<section class="pt-helper" aria-labelledby="pt-insight-title"><div><p class="pt-kicker">Template guide</p><h2 id="pt-insight-title">Which template fits?</h2><p>Choose a starting point. Download PDF, Word or text in the original section below.</p></div><div class="pt-helper-grid"><label for="pt-insight-select">I want to …</label><select id="pt-insight-select"><option value="0">Request my own records and case documents</option><option value="1">Request information in Infoflyt</option><option value="2">Request public documents</option><option value="3">Follow up a request or refusal</option></select><div class="pt-helper-result" aria-live="polite"></div><ul class="pt-checks"><li>Specify relevant units and time periods.</li><li>Fill in bracketed fields in the template.</li><li>Use secure submission for sensitive details.</li><li>Keep a copy and receipt.</li></ul><a class="pt-helper-action" href="#">Go to selected template ↓</a></div></section>` : `<section class="pt-helper" aria-labelledby="pt-insight-title"><div><p class="pt-kicker">Veiviser til malene</p><h2 id="pt-insight-title">Hvilken mal passer?</h2><p>Velg et utgangspunkt. Du kan laste ned PDF, Word eller tekst i originaldelen nedenfor.</p></div><div class="pt-helper-grid"><label for="pt-insight-select">Jeg vil …</label><select id="pt-insight-select"><option value="0">Be om egne opplysninger og saksdokumenter</option><option value="1">Be om opplysninger i Infoflyt</option><option value="2">Be om offentlige dokumenter</option><option value="3">Følge opp et krav eller et avslag</option></select><div class="pt-helper-result" aria-live="polite"></div><ul class="pt-checks"><li>Oppgi relevante enheter og tidsrom.</li><li>Fyll ut feltene i hakeparenteser i malen.</li><li>Bruk sikker innsending for sensitive opplysninger.</li><li>Behold kopi og kvittering.</li></ul><a class="pt-helper-action" href="#">Gå til valgt mal ↓</a></div></section>`);
    const select = node.querySelector('select');
    const result = node.querySelector('.pt-helper-result');
    const cards = Array.from(scope.querySelectorAll('.resource-page h2')).filter(h => /^\d\./.test(h.textContent.trim())).slice(0,4);
    const names = en ? ['All records about me','Infoflyt','Public documents','Follow-up and appeal'] : ['Alt om meg','Infoflyt','Offentlige dokumenter','Oppfølging og klage'];
    const descriptions = en ? ['A broad request for your own case documents and personal data.','A separate request for information recorded about you in Infoflyt.','Narrow public documents by topic, unit and period.','For missing material, an unanswered request or a refusal.'] : ['Et bredt krav om egne saksdokumenter og personopplysninger.', 'Et eget krav om opplysninger registrert om deg i Infoflyt.', 'Avgrens offentlige dokumenter etter tema, enhet og periode.', 'For manglende materiale, et ubesvart krav eller et avslag.'];
    function render() { const i = Number(select.value); result.innerHTML = `<strong>${content[lang].modes[0].title}: ${names[i]}</strong><p>${descriptions[i]}</p>`; const card = cards[i]; const a = node.querySelector('.pt-helper-action'); if (card) { if (!card.id) card.id = `pt-template-${i+1}`; a.href = `#${card.id}`; a.hidden = false; } else { a.href = content[lang].modes[0].href; a.textContent = en ? 'Open templates →' : 'Åpne malene →'; } }
    select.addEventListener('change', render); render(); return node;
  }
  function complaint(lang) {
    const en = lang === 'en';
    const node = make(en ? `<section class="pt-helper" aria-labelledby="pt-complaint-title"><div><p class="pt-kicker">Before creating a draft</p><h2 id="pt-complaint-title">Three things to check</h2><p>This is a checklist. The tool below lets you review decision text and write a draft in your browser.</p></div><div class="pt-helper-grid"><label class="pt-check"><input type="checkbox"> <span>I have the decision and any appeal guidance available.</span></label><label class="pt-check"><input type="checkbox"> <span>I will check the stated or confirmed deadline in the decision.</span></label><label class="pt-check"><input type="checkbox"> <span>I can describe the change I want and my reasons in my own words.</span></label><p class="pt-helper-result" role="status" aria-live="polite">0 of 3 items checked.</p><a class="pt-helper-action" href="#complaint-form">Go to complaint help ↓</a><p class="pt-fineprint">The tool does not decide whether the decision is lawful or calculate the deadline. Read and edit the draft before saving and sending it yourself.</p></div></section>` : `<section class="pt-helper" aria-labelledby="pt-complaint-title"><div><p class="pt-kicker">Før du lager utkast</p><h2 id="pt-complaint-title">Tre ting å kontrollere</h2><p>Dette er en huskeliste. Klagehjelpen under lar deg gå gjennom vedtaksteksten og skrive et utkast i nettleseren.</p></div><div class="pt-helper-grid"><label class="pt-check"><input type="checkbox"> <span>Jeg har vedtaket og eventuell klageveiledning tilgjengelig.</span></label><label class="pt-check"><input type="checkbox"> <span>Jeg vil kontrollere oppgitt eller avklart klagefrist i vedtaket.</span></label><label class="pt-check"><input type="checkbox"> <span>Jeg kan beskrive endringen jeg ønsker og begrunnelsen med egne ord.</span></label><p class="pt-helper-result" role="status" aria-live="polite">0 av 3 punkter krysset av.</p><a class="pt-helper-action" href="#complaint-form">Gå til klagehjelpen ↓</a><p class="pt-fineprint">Verktøyet avgjør ikke om vedtaket er lovlig og beregner ikke klagefristen. Les og rediger utkastet før du lagrer og sender det selv.</p></div></section>`);
    const checks = node.querySelectorAll('input'); const status = node.querySelector('[role=status]');
    checks.forEach(c => c.addEventListener('change', () => { const count = Array.from(checks).filter(x => x.checked).length; status.textContent = en ? `${count} of 3 items checked.` : `${count} av 3 punkter krysset av.`; }));
    return node;
  }
  function stats(lang) {
    return make(lang === 'en' ? `<aside class="pt-stats-note" aria-label="How to read the figures"><strong>How to read the figures</strong><p>Page views are registered openings. Visits are browser sessions in a tab. Sharing actions show use of sharing features, not confirmed publications. Read the full explanation under “What these numbers show”.</p><a href="#pt-stat-method">Read the method ↓</a></aside>` : `<aside class="pt-stats-note" aria-label="Slik leser du tallene"><strong>Slik leser du tallene</strong><p>Sidevisninger er registrerte åpninger. Besøk gjelder nettleserøkter i en fane. Delingshandlinger viser bruk av delingsfunksjonene, ikke bekreftede publiseringer. Les hele forklaringen under «Hva tallene viser».</p><a href="#pt-stat-method">Les metoden ↓</a></aside>`);
  }
  function init(root = document) {
    destroy();
    const scope = root.querySelector ? root : document;
    const main = scope.querySelector('main'); if (!main) return;
    const title = (scope.querySelector('.hero h1') || {}).textContent || '';
    const lang = (scope.documentElement || scope.closest?.('html') || document.documentElement).lang.toLowerCase().startsWith('en') ? 'en' : 'no';
    if (/Krev innsyn|Request access to records/i.test(title)) { const article = main.querySelector('article'); if (article) mount(main, insight(lang, scope), article); }
    else if (/Klagehjelp|Complaint help/i.test(title)) { const article = main.querySelector('article'); if (article) mount(main, complaint(lang), article); }
    else if (/Besøk og deling|Visits and sharing/i.test(title)) { const article = main.querySelector('article'); if (article) { const method = Array.from(article.querySelectorAll('h2')).find(h => /Hva tallene viser|What these numbers show/i.test(h.textContent)); const note = stats(lang); mount(main, note, article); if (method) { if (!method.id) method.id = 'pt-stat-method'; note.querySelector('a').href = `#${method.id}`; } else note.querySelector('a').remove(); } }
    else if (/Fanger til gjenbruk|Prisoners for Reuse/i.test(title)) { const article = main.querySelector('article'); if (article) mount(main, guide(lang), article); }
  }
  function destroy() { active.forEach(n => n.remove()); active = []; }
  window.PremiumTools = { init, destroy };
})();
