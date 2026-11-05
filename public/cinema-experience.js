/* User-led film, clear text alternative, and a quiet reading mode. */
(() => {
  'use strict';
  let root, en, dispose = [], modal = null, modalDispose = [], reading = false, readingScroll = 0, readingOpener;
  const t = (no, yes) => en ? yes : no;
  const node = (tag, cls, text) => { const n = document.createElement(tag); n.className = cls || ''; if (text) n.textContent = text; return n; };
  const asset = p => window.__premiumResolveAsset?.(p) || p;
  const local = p => (en ? '/en' : '') + p;
  const listen = (n,e,fn,list=dispose) => {n.addEventListener(e,fn);list.push(()=>n.removeEventListener(e,fn));};
  const button = (text, cls, fn, list=dispose) => {const n=node('button',cls,text);n.type='button';listen(n,'click',fn,list);return n;};
  function pauseRibbon(){for (const p of root.querySelectorAll('[data-play],.pg-play')) if(p.textContent.trim()==='Pause')p.click();}
  function closeFilm(){if(!modal)return;const {dialog,video,opener}=modal;video.pause();video.removeAttribute('src');video.load();modalDispose.splice(0).reverse().forEach(fn=>fn());dialog.close();dialog.remove();modal=null;opener?.focus?.({preventScroll:true});}
  function openFilm(){
    closeFilm();pauseRibbon();const dialog=node('dialog','ic-dialog');dialog.setAttribute('aria-label',t('Illustrert introduksjonsfilm','Illustrated introduction film'));
    const head=node('header','ic-film-head');head.append(node('span','ic-kicker',t('50 SEKUNDER · EN ILLUSTRERT INTRODUKSJON','50 SECONDS · AN ILLUSTRATED INTRODUCTION')),button('×','ic-close',closeFilm,modalDispose));head.querySelector('button').setAttribute('aria-label',t('Lukk filmen','Close the film'));
    const video=node('video','ic-video');video.controls=true;video.playsInline=true;video.preload='metadata';video.poster=asset('/immersive-media/stemmen-intro-poster.jpg');video.setAttribute('aria-label',t('Stemmen fra innsiden. Film uten lyd, med tekst på bildet.','Stemmen fra innsiden. Silent film with text on screen.'));video.src=asset('/immersive-media/stemmen-intro.mp4');
    const track=node('track');track.kind='subtitles';track.srclang=en?'en':'nb';track.label=en?'English':'Norsk';track.src=asset(en?'/immersive-media/stemmen-intro.en.vtt':'/immersive-media/stemmen-intro.vtt');track.default=en;video.append(track);
    const status=node('p','ic-film-status',t('Film uten lyd. Illustrasjonene er kunstneriske tolkninger, ikke dokumentaropptak.','Silent film. The illustrations are artistic interpretations, not documentary footage.'));status.setAttribute('role','status');
    const chapters=node('nav','ic-chapters');chapters.setAttribute('aria-label',t('Velg del av filmen','Choose a part of the film'));
    const names=en?['The person','The family','The questions','The next step','The voice']:['Mennesket','Familien','Spørsmålene','Neste steg','Stemmen'];
    function markChapter(i){[...chapters.children].forEach((n,k)=>n.setAttribute('aria-current',i===k?'step':'false'));}
    function seek(i){video.currentTime=i*10;markChapter(i);video.play().catch(error=>{if(error.name==='AbortError')return;status.textContent=t('Trykk på avspillingsknappen i filmen.','Press the play button in the film.');});}
    names.forEach((name,i)=>{const b=button(`0${i+1} / ${name}`,'ic-chapter',()=>{if(video.readyState>0)seek(i);else video.addEventListener('loadedmetadata',()=>seek(i),{once:true});},modalDispose);chapters.append(b);});
    const foot=node('div','ic-film-foot');foot.append(node('p','',t('KI-assistert · Innsatt 2601-46 · Illustrasjoner med utgangspunkt i R8','AI-assisted · Innsatt 2601-46 · Illustrations based on R8')));
    foot.append(button(t('Vis meg hvordan verktøyene virker →','Show me how the tools work →'),'ic-text-button',()=>{closeFilm();window.ImmersiveGuide?.open('family');},modalDispose));
    dialog.append(head,video,status,chapters,foot);const opener=document.activeElement;document.body.append(dialog);modal={dialog,video,opener};
    listen(dialog,'cancel',e=>{e.preventDefault();closeFilm();},modalDispose);
    listen(dialog,'keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeFilm();}},modalDispose);
    listen(video,'error',()=>{status.textContent=t('Filmen kunne ikke lastes. Lukk vinduet og bruk tekstversjonen under filmkortet.','The film could not load. Close this window and use the text version below the film card.');},modalDispose);
    listen(video,'timeupdate',()=>{markChapter(Math.min(4,Math.floor(video.currentTime/10)));},modalDispose);
    listen(document,'visibilitychange',()=>{if(document.hidden)video.pause();},modalDispose);
    markChapter(0);dialog.showModal();head.querySelector('button').focus();video.play().catch(error=>{if(error.name==='AbortError')return;status.textContent=t('Trykk på avspillingsknappen. Filmen er uten lyd.','Press play. The film is silent.');});
  }
  function storySection(){
    const hero=root.querySelector('.ux-hero-copy');if(!hero)return;
    const launches=node('div','ic-hero-launches');launches.append(button(t('▷ Se introduksjonen · 50 sek','▷ Watch the introduction · 50 sec'),'ic-hero-film',openFilm));
    hero.append(launches);dispose.push(()=>launches.remove());
    const section=node('section','ic-cinema');section.id='ic-introduction';
    const cover=button('','ic-poster',openFilm);const img=node('img');img.src=asset('/design-assets/approved-illustrations/book-page-366-aa4a00416864d4de6e1160f80e4a3e336e62673613cef6adbcbd7ee4dc7fcd0d.webp');img.alt=t('Bokillustrasjon av en far og et barn i en fjellside.','Book illustration of a father and child on a mountainside.');img.loading='lazy';img.decoding='async';cover.append(img,node('span','ic-play','▷'),node('span','ic-poster-label',t('SE FILMEN · 00:50','WATCH THE FILM · 00:50')));cover.setAttribute('aria-label',t('Spill den 50 sekunder lange introduksjonen','Play the 50-second introduction'));
    const copy=node('div','ic-cinema-copy');copy.append(node('p','ic-kicker',t('EN LITEN FILM. ET STØRRE SPØRSMÅL.','A SHORT FILM. A BIGGER QUESTION.')),node('h2','',t('Før du leser,\nse mennesket.','Before you read,\nsee the person.')),node('p','ic-deck',t('Fem rolige øyeblikk fra bokkunsten. Om tilhørighet, spørsmål og muligheten til å finne egne ord. Du bestemmer tempoet videre.','Five quiet moments from the book’s art. About belonging, questions and finding your own words. You choose the pace from here.')));
    copy.append(button(t('Se filmen →','Watch the film →'),'ic-primary',openFilm));
    const details=node('details','ic-transcript');details.append(node('summary','',t('Les introduksjonen som tekst','Read the introduction as text')));
    const lines=en?['A person. A story.','See the person behind the case number.','Questions that deserve answers.','Find the words. Take the next step.','Stemmen fra innsiden. Innsatt 2601-46.']:['Et menneske. En fortelling.','Se mennesket bak saksnummeret.','Spørsmål som fortjener svar.','Finn ordene. Ta neste steg.','Stemmen fra innsiden. Innsatt 2601-46.'];const ol=node('ol');for(const line of lines)ol.append(node('li','',line));details.append(ol);copy.append(details,node('p','ic-caption',t('Illustrert film uten lyd · KI-assistert · Innsatt 2601-46','Silent illustrated film · AI-assisted · Innsatt 2601-46')));section.append(cover,copy);
    const paths=root.querySelector('.pe-paths');if(paths)paths.insertAdjacentElement('afterend',section);else hero.closest('section').insertAdjacentElement('afterend',section);dispose.push(()=>section.remove());
    const oldGuide=root.querySelector('.pt-guide');if(oldGuide&&root.querySelector('#ig-intro')){const hidden=oldGuide.hidden;oldGuide.hidden=true;dispose.push(()=>oldGuide.hidden=hidden);const a=root.querySelector('.pe-path:last-child');if(a){const href=a.getAttribute('href');a.href='#ig-intro';dispose.push(()=>a.setAttribute('href',href));}}
  }
  function quietReading(){
    const article=root.querySelector('article.page'),panel=root.querySelector('.premium-reader__actions');if(!article||!panel)return;
    const title=node('h1','ic-reading-title',root.querySelector('.hero h1')?.textContent||document.title.split('|')[0].trim());article.prepend(title);dispose.push(()=>title.remove());
    const trigger=button(t('Les i ro','Read quietly'),'ic-read-button',()=>enter());panel.append(trigger);dispose.push(()=>trigger.remove());
    const exit=button(t('← Tilbake til hele siden','← Back to the full page'),'ic-exit-reading',()=>leave());exit.hidden=true;document.body.append(exit);dispose.push(()=>exit.remove());
    const surface=root===document?document.body:root;
    function enter(){pauseRibbon();readingScroll=window.scrollY;readingOpener=document.activeElement;reading=true;surface.classList.add('ic-reading');exit.hidden=false;article.scrollIntoView({behavior:'instant'});exit.focus({preventScroll:true});}
    function leave(restore=true){if(!reading)return;reading=false;surface.classList.remove('ic-reading');exit.hidden=true;if(restore){window.scrollTo({top:readingScroll,behavior:'instant'});readingOpener?.focus?.({preventScroll:true});}}
    listen(document,'keydown',e=>{if(reading&&e.key==='Escape'&&!document.querySelector('dialog[open]')){e.preventDefault();leave();}});dispose.push(()=>leave(false));
  }
  function destroy(){closeFilm();dispose.splice(0).reverse().forEach(fn=>fn());}
  function init(scope=document){destroy();root=scope;en=(scope.dataset?.premiumRoute||window.__existingPreview?.route||location.pathname).startsWith('/en/');storySection();quietReading();}
  window.CinemaExperience={init,destroy,openFilm};
})();
