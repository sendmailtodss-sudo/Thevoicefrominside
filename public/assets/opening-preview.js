(() => {
 const section=document.getElementById('opening-journey'), video=document.querySelector('[data-opening-video]'), sound=document.querySelector('[data-opening-sound]'), status=document.querySelector('[data-opening-status]');
 if(!section||!video||!sound)return;
 const language=document.querySelector('.site-tools .language-control');
 document.querySelector('.sfi-quick')?.append(language);
 const audio=document.querySelector('[data-opening-audio]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 // Only this verified private preview asset exists; later scenes require their own media.
 const scenes=[{id:'galaxy',start:0,end:1}];
 let scheduled=false;
 const update=()=>{scheduled=false;if(reduced.matches||!Number.isFinite(video.duration)||video.duration<=0)return;
  const rect=section.getBoundingClientRect(),distance=Math.max(1,section.offsetHeight-innerHeight);
  const progress=Math.max(0,Math.min(1,-rect.top/distance));
  const target=Math.min(video.duration-.04,progress*video.duration);
  if(Math.abs(video.currentTime-target)>.08&&!video.seeking)video.currentTime=target;
 };
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}};
 video.pause();video.muted=true;
 video.addEventListener('loadedmetadata',schedule);
 video.addEventListener('seeked',schedule);
 video.addEventListener('error',()=>{status.textContent='Privat prøvefilm er ikke tilgjengelig her. Fortsett til innholdet.';sound.disabled=true});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduced.addEventListener('change',schedule);
 sound.addEventListener('click',async()=>{if(!audio)return; if(!audio.paused){audio.pause();sound.setAttribute('aria-pressed','false');sound.textContent='Lyd av';return} try {await audio.play();sound.setAttribute('aria-pressed','true');sound.textContent='Lyd på'} catch {status.textContent='Lyd er ikke tilgjengelig i denne forhåndsvisningen.'}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){audio?.pause();video.muted=true;sound.setAttribute('aria-pressed','false');sound.textContent='Lyd av'}});
 section.dataset.scenes=scenes.map(s=>s.id).join(',');
})();
