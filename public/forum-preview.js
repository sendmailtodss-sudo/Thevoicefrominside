/* Private synthetic forum trial. No accounts, storage or network requests. */
(() => {
  'use strict';
  const root = document.querySelector('[data-forum-preview]');
  if (!root) return;
  const en = document.documentElement.lang === 'en';
  const copy = en ? {
    rooms: ['The way forward', 'For those close to someone inside'],
    topics: ['How did you find a new creative community?', 'Small steps in the first days home', 'How do we talk about missing someone?', 'Finding support in daily life'],
    posts: [
      ['I would like to try a drawing group when I get home. Does anyone have an example of a gentle first step?', 'In this fictional example, I asked a local library about an open workshop. I could look around before deciding to join.'],
      ['My first-week plan has room for rest as well as appointments. What small routines helped you?', 'A short walk and a written plan helped the fictional person in this example. Everyone’s needs will be different.'],
      ['How can we make room for missing someone without every conversation becoming about prison?', 'In this fictional conversation, we set aside time to talk and also kept one ordinary activity together.'],
      ['I am looking for somewhere to talk about my own experience as a relative.', 'This example suggests asking an independent support organisation what it offers, without sharing private case details here.']
    ],
    writer: 'Example participant', label: 'Fictional conversation', reply: 'A reply in the example',
    saved: 'Draft kept in this tab only. Nothing was sent. Reloading or closing the page removes it.',
    cleared: 'This draft has been cleared.', empty: 'Write an example draft first.',
    hint: 'Use invented examples only. This is not a confidential channel or an open support service.'
  } : {
    rooms: ['Veien videre', 'For deg som står nær'],
    topics: ['Hvordan fant dere et nytt kreativt miljø?', 'Små steg den første tiden hjemme', 'Hvordan snakker vi om savnet?', 'Å finne støtte i hverdagen'],
    posts: [
      ['Jeg vil gjerne prøve en tegnegruppe når jeg kommer hjem. Har noen et eksempel på et forsiktig første steg?', 'I dette oppdiktede eksemplet spurte jeg biblioteket om et åpent verksted. Jeg kunne se meg rundt før jeg bestemte meg.'],
      ['Planen min for den første uken har plass til hvile og avtaler. Hvilke små rutiner hjalp dere?', 'En kort tur og en skriftlig plan hjalp den oppdiktede personen i dette eksemplet. Behovene vil være ulike.'],
      ['Hvordan gir vi plass til savnet uten at alle samtaler handler om fengsel?', 'I denne oppdiktede samtalen satte vi av tid til å snakke, og beholdt også en vanlig aktivitet sammen.'],
      ['Jeg leter etter et sted å snakke om mine egne erfaringer som pårørende.', 'Dette eksemplet foreslår å spørre en uavhengig støtteorganisasjon hva de tilbyr, uten å dele private saksopplysninger her.']
    ],
    writer: 'Eksempeldeltaker', label: 'Oppdiktet samtale', reply: 'Et svar i eksemplet',
    saved: 'Kladden beholdes bare i denne fanen. Ingenting er sendt. Den slettes når du laster siden på nytt eller lukker den.',
    cleared: 'Denne kladden er tømt.', empty: 'Skriv en eksempelkladd først.',
    hint: 'Bruk bare oppdiktede eksempler. Dette er ikke en fortrolig kanal eller en åpen støttetjeneste.'
  };
  const $ = selector => root.querySelector(selector);
  const panel = $('[data-forum-panel]');
  const heading = $('[data-forum-heading]');
  const threadNav = $('[data-forum-threads]');
  const posts = $('[data-forum-posts]');
  const draft = $('[data-forum-draft]');
  const status = $('[data-forum-status]');
  const roomButtons = [...root.querySelectorAll('[data-forum-room]')];
  const drafts = new Map();
  let current = 0;
  let opener = null;
  function keepCurrent() { drafts.set(current, draft.value); }
  function open(index, source) {
    if (!panel.hidden) keepCurrent();
    current = index;
    if (source) opener = source;
    const room = Math.floor(index / 2);
    panel.hidden = false;
    $('[data-forum-room-title]').textContent = copy.rooms[room];
    heading.textContent = copy.topics[index];
    roomButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.forumRoom) === room)));
    threadNav.replaceChildren();
    for (let i = room * 2; i < room * 2 + 2; i++) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = copy.topics[i];
      button.setAttribute('aria-pressed', String(i === index));
      button.addEventListener('click', () => open(i));
      threadNav.append(button);
    }
    posts.replaceChildren();
    copy.posts[index].forEach((text, i) => {
      const article = document.createElement('article');
      const author = document.createElement('h4');
      author.textContent = i ? copy.reply : copy.writer;
      const meta = document.createElement('p'); meta.className = 'meta'; meta.textContent = copy.label;
      const body = document.createElement('p'); body.textContent = text;
      article.append(author, meta, body); posts.append(article);
    });
    draft.value = drafts.get(index) || '';
    status.textContent = copy.hint;
    heading.focus();
    root.querySelectorAll('[data-forum-open]').forEach(button => button.setAttribute('aria-expanded', String(Number(button.dataset.forumOpen) === index)));
  }
  root.querySelectorAll('[data-forum-open]').forEach(button => button.addEventListener('click', () => open(Number(button.dataset.forumOpen), button)));
  roomButtons.forEach(button => button.addEventListener('click', () => open(Number(button.dataset.forumRoom) * 2)));
  $('[data-forum-close]').addEventListener('click', () => {
    keepCurrent(); panel.hidden = true;
    root.querySelectorAll('[data-forum-open]').forEach(button => button.setAttribute('aria-expanded', 'false'));
    opener?.focus();
  });
  $('[data-forum-form]').addEventListener('submit', event => {
    event.preventDefault();
    if (!draft.value.trim()) { status.textContent = copy.empty; draft.focus(); return; }
    keepCurrent(); status.textContent = copy.saved;
  });
  $('[data-forum-clear]').addEventListener('click', () => {
    drafts.delete(current); draft.value = ''; status.textContent = copy.cleared; draft.focus();
  });
  root.querySelectorAll('[data-forum-open]').forEach(button => { button.disabled = false; });
  draft.value = '';
  root.dataset.ready = 'true';
})();
