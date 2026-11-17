/* Progressive enhancement; existing server tools remain unchanged. */
(()=>{'use strict';function init(){document.documentElement.dataset.premiumRoute=location.pathname;window.PremiumGallery?.init(document);window.PremiumTools?.init(document);window.UnifiedExperience?.init(document);window.PremiumReader?.init(document);window.PremiumExperience?.init(document);window.ImmersiveGuide?.init(document);window.CinemaExperience?.init(document);window.FamilyPath?.init(document);window.AudioLetters?.init(document);window.ExperienceCollections?.init(document)}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();

/* One audible source per page. This helper only pauses; it never starts media. */
(()=>{'use strict';
 if(document.documentElement.dataset.sfiAudioFocus==='ready')return;
 document.documentElement.dataset.sfiAudioFocus='ready';
 const filmSelector='[data-sj-sound],[data-opening-sound]';
 let owner=null,filmRequested=false,stoppingFilm=false;
 const audible=media=>!media.paused&&!media.muted&&media.volume>0;
 function pauseOthers(keep){
  if(owner&&owner!==keep)owner.pause();
  for(const media of document.querySelectorAll('audio,video')){
   if(media!==keep&&(media.tagName==='AUDIO'||audible(media)))media.pause();
  }
 }
 function silenceFilm(){
  const button=[...document.querySelectorAll(filmSelector)].find(node=>node.getAttribute('aria-pressed')==='true');
  if(!button||stoppingFilm)return;
  // The existing button's ON state is the only bridge to its private WebAudio
  // controller. An OFF click is stopping, never synthetic activation.
  stoppingFilm=true;try{button.click()}finally{stoppingFilm=false}
 }
 function pauseAll(){filmRequested=false;pauseOthers(null);owner=null;silenceFilm()}
 function claimMedia(event){
  const media=event.target;
  if(!(media instanceof HTMLMediaElement)||!audible(media))return;
  filmRequested=false;pauseOthers(media);owner=media;silenceFilm();
 }
 document.addEventListener('play',claimMedia,true);
 document.addEventListener('volumechange',claimMedia,true);
 document.addEventListener('click',event=>{
  if(stoppingFilm)return;
  const button=event.target.closest?.(filmSelector);
  if(button){
   if(button.getAttribute('aria-pressed')==='true'){filmRequested=false;return}
   // Keep the component's original user-gesture/resume path. Only competitors
   // are paused here; this helper does not call play() or AudioContext.resume().
   filmRequested=true;pauseOthers(null);owner=null;return;
  }
  if(event.target.closest?.('[data-site-navigation] a,[data-home-direction],.sj-entrances a,.sj-skip,.clean-main-actions a'))pauseAll();
 },true);
 // AudioContext.resume() may resolve after another source was selected. Observe
 // the existing state so that late completion cannot create a second source.
 new MutationObserver(records=>{
  if(owner&&!owner.isConnected){owner.pause();owner=null}
  if(!records.some(record=>record.target.matches?.(filmSelector)&&record.target.getAttribute('aria-pressed')==='true'))return;
  if(!filmRequested||(owner&&audible(owner)))silenceFilm();
 }).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-pressed']});
 addEventListener('sfi-before-language-change',pauseAll);
 addEventListener('pagehide',pauseAll);
 addEventListener('pageshow',pauseAll);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll()});
})();
