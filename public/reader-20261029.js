/* Optional reading aids. Does not alter article content or site data. */
(() => {
  'use strict';
  const article = document.querySelector('main .page');
  const english = document.documentElement.lang === 'en';
  if (!article) return;
  const bar = document.createElement('div');
  bar.className = 'reader-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  const tools = document.createElement('div');
  tools.className = 'reader-tools';
  tools.setAttribute('aria-label', english ? 'Reading tools' : 'Leseverktøy');
  const smaller = document.createElement('button');
  smaller.type = 'button';
  smaller.textContent = 'A−';
  smaller.setAttribute('aria-label', english ? 'Smaller text' : 'Mindre tekst');
  const larger = document.createElement('button');
  larger.type = 'button';
  larger.textContent = 'A+';
  larger.setAttribute('aria-label', english ? 'Larger text' : 'Større tekst');
  const top = document.createElement('button');
  top.type = 'button';
  top.textContent = '↑';
  top.setAttribute('aria-label', english ? 'Back to top' : 'Til toppen');
  tools.append(smaller, larger, top);
  document.body.appendChild(tools);

  let size = parseFloat(getComputedStyle(article).fontSize) || 18;
  const setSize = (next) => {
    size = Math.max(16, Math.min(23, next));
    article.style.setProperty('--reader-size', `${size}px`);
  };
  smaller.addEventListener('click', () => setSize(size - 1));
  larger.addEventListener('click', () => setSize(size + 1));
  top.addEventListener('click', () => window.scrollTo({top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'}));

  const languageNote = document.querySelector('.language-note');
  if (languageNote) {
    languageNote.hidden = true;
    languageNote.id = languageNote.id || 'language-explanation';
    const languageInfo = document.createElement('button');
    languageInfo.className = 'language-info';
    languageInfo.type = 'button';
    languageInfo.textContent = english ? 'Language information' : 'Språkinformasjon';
    languageInfo.setAttribute('aria-expanded','false');
    languageInfo.setAttribute('aria-controls',languageNote.id);
    languageInfo.addEventListener('click',()=>{languageNote.hidden=!languageNote.hidden;languageInfo.setAttribute('aria-expanded',String(!languageNote.hidden));});
    document.querySelector('.language-control')?.appendChild(languageInfo);
  }
  const hero = document.querySelector('.hero');
  if (hero) {
    const start = document.createElement('button');
    start.type = 'button';start.className='reader-start';start.textContent=english?'Begin reading ↓':'Begynn å lese ↓';
    start.addEventListener('click',()=>article.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));
    hero.appendChild(start);
    const credit=document.createElement('p');credit.className='visual-credit';credit.textContent=english?'AI-created allegory. Not a documentary photograph.':'KI-skapt allegori. Ikke dokumentarfoto.';hero.appendChild(credit);
  }
  let queued = false;
  const updateProgress = () => {
    queued = false;
    const rect = article.getBoundingClientRect();
    const reading = !document.querySelector('#community-root') && rect.top < window.innerHeight * .7 && rect.bottom > 100;
    tools.hidden = !reading;
    bar.hidden = !reading;
    const start = rect.top + window.scrollY;
    const end = start + article.offsetHeight - window.innerHeight;
    const progress = end <= start ? 100 : Math.max(0, Math.min(100, (window.scrollY - start) / (end - start) * 100));
    bar.style.width = `${progress}%`;
  };
  const queueUpdate = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(updateProgress);
    }
  };
  window.addEventListener('scroll', queueUpdate, {passive: true});
  window.addEventListener('resize', queueUpdate);
  queueUpdate();
})();
