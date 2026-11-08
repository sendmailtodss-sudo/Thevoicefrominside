/* Separate, opt-in filmmaker presentation. The wall image remains a still. */
(() => {
  'use strict';
  if (window.SJFilmPlayer) return;
  const labels = {
    no: { open:'Se filmskaperen ▶', title:'Filmskaperen', close:'Lukk', help:'Filmen starter når du velger å se den.' },
    en: { open:'Watch the filmmaker ▶', title:'The filmmaker', close:'Close', help:'The film starts when you choose to watch it.' },
    zh: { open:'观看电影创作者 ▶', title:'电影创作者', close:'关闭', help:'您选择观看后影片才会播放。' }
  };
  const url='/assets/journey/filmmaker.mp4';
  let root=null, observer=null, dialog=null, opener=null, previousOverflow='';
  function locale(){const l=root?.lang||document.documentElement.lang;return l?.startsWith('zh')?'zh':l?.startsWith('en')?'en':'no'}
  function close(){
    if(!dialog)return;
    const d=dialog, v=d.querySelector('video');dialog=null;v.pause();v.removeAttribute('src');v.load();
    if(d.open)d.close();d.remove();document.body.style.overflow=previousOverflow;
    if(opener?.isConnected)opener.focus();opener=null;
  }
  function open(event){
    if(!window.HTMLDialogElement?.prototype?.showModal)return;
    event.preventDefault();if(dialog)return;
    const text=labels[locale()],sound=root.querySelector('[data-sj-sound]');
    if(sound?.getAttribute('aria-pressed')==='true')sound.click();
    const background=root.querySelector('.sj-video');if(background){background.pause();background.muted=true}
    opener=event.currentTarget;previousOverflow=document.body.style.overflow;
    const d=document.createElement('dialog');d.className='sj-film-dialog';d.setAttribute('aria-labelledby','sj-film-title');
    const head=document.createElement('header'),title=document.createElement('h2'),button=document.createElement('button');title.id='sj-film-title';title.textContent=text.title;button.type='button';button.className='sj-film-close';button.setAttribute('aria-label',text.close);button.textContent='×';head.append(title,button);
    const video=document.createElement('video');video.className='sj-film-video';video.controls=true;video.playsInline=true;video.preload='metadata';video.src=url;
    const p=document.createElement('p');p.textContent=text.help;d.append(head,video,p);document.body.append(d);dialog=d;
    button.addEventListener('click',close);d.addEventListener('cancel',e=>{e.preventDefault();close()});
    d.showModal();document.body.style.overflow='hidden';button.focus();
    // The opening click is an explicit request to play; if browser policy declines,
    // the native controls remain available and no automatic retry occurs.
    video.play().catch(()=>{});
  }
  function update(){
    if(!root?.isConnected)return;
    const target=root.querySelector('.sj-copy');if(!target)return;
    let link=target.querySelector('.sj-film-launch');
    if(root.dataset.scene!=='gallery') {link?.remove();return}
    if(!link){link=document.createElement('a');link.className='sj-film-launch';link.href=url;link.addEventListener('click',open);target.append(link)}
    link.textContent=labels[locale()].open;link.lang=locale()==='zh'?'zh-Hans':locale();
  }
  function destroy(){close();observer?.disconnect();observer=null;root?.querySelector('.sj-film-launch')?.remove();root=null}
  function init(){
    const next=document.querySelector('[data-journey]');if(next===root&&observer){update();return}
    destroy();root=next;if(!root)return;
    observer=new MutationObserver(update);observer.observe(root,{attributes:true,attributeFilter:['data-scene','lang']});update();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  window.addEventListener('routechange',init);window.addEventListener('premium:routechange',init);
  window.addEventListener('pagehide',close);document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog)dialog.querySelector('video').pause()});
  window.SJFilmPlayer={init,destroy};
})();
