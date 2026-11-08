(() => {
 const section=document.getElementById('opening-journey'), video=document.querySelector('[data-opening-video]'), sound=document.querySelector('[data-opening-sound]'), status=document.querySelector('[data-opening-status]');
 if(!section||!video||!sound||!status)return;
 const language=document.querySelector('.site-tools .language-control');
 if(language)document.querySelector('.sfi-quick')?.append(language);
 const audio=document.querySelector('[data-opening-audio]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const scenes=[
  ['galaxy','Melkeveien'],['brains','Hjernene'],['impulses','Kollektiv bevissthet'],['vortex','Idéer og virvel'],['supernova','Supernova'],['dna','DNA-reisen'],
  ['painter','Maleren'],['poet','Poeten'],['rapper','Rapperen'],['metal','Skrapmetallkunstneren'],['ai','AI-kunstneren'],['streetart','Gatekunstnerne'],['filmmaker','Filmskaper og performer'],
  ['gallery','Fra uttrykk til galleri'],['bergen','Bergen'],['paris','Paris'],['new-york','New York'],['interior','Kunsten i interiøret'],['stencil','Sjablongen'],['red-riding-hood','Rødhette']
 ];
 section.style.setProperty('--scene-count',scenes.length);
 const heading=document.querySelector('[data-opening-scene]'),label=document.querySelector('[data-opening-label]');
 let current=-1,desired=0,scheduled=false,token=0,audioOn=false;
 const mute=()=>{audioOn=false;audio?.pause();sound.setAttribute('aria-pressed','false');sound.textContent='Lyd av'};
 const showScene=async index=>{
  current=index; const [id,title]=scenes[index], serial=++token;
  heading.textContent=title;label.textContent=`PRIVAT ARBEIDSUTKAST · ${index+1} / ${scenes.length}`;
  section.dataset.scene=id;section.dataset.available='pending';video.pause();video.removeAttribute('src');video.load();
  if(audio){audio.pause();audio.removeAttribute('src');audio.load()}
  status.textContent='Laster prøve …';
  const src=`/__private-preview/scenes/${id}.mp4`;
  try {const response=await fetch(src,{method:'HEAD'});if(serial!==token)return;
   if(!response.ok)throw Error('missing');
   section.dataset.available='yes';video.src=src;video.load();
   if(audio){audio.src=src;if(audioOn)audio.play().catch(mute)}
   status.textContent=({painter:'Eldre prøve · Celle og valgt verk mangler.',gallery:'Privat prøve · Riktige verk og medieflater mangler.',bergen:'Midlertidig byprøve · Riktig ryggtrykk mangler.',paris:'Midlertidig byprøve · Riktig ryggtrykk mangler.'})[id] || 'Privat prøve · Skroll videre eller bakover.';
  } catch {if(serial!==token)return;section.dataset.available='no';status.textContent='Midlertidig plassholder · Denne scenen er ikke levert ennå.'}
 };
 const update=()=>{scheduled=false;const rect=section.getBoundingClientRect(),distance=Math.max(1,section.offsetHeight-innerHeight);
  let progress=Math.max(0,Math.min(.999999,-rect.top/distance))*scenes.length;
  const index=Math.floor(progress);desired=progress-index;
  if(index!==current){showScene(index);return}
  if(reduced.matches||!Number.isFinite(video.duration)||video.duration<=0)return;
  const target=Math.min(video.duration-.05,Math.max(0,desired*video.duration));
  if(!video.seeking&&Math.abs(video.currentTime-target)>.08)video.currentTime=target;
 };
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update)}};
 video.muted=true;video.pause();video.addEventListener('loadedmetadata',schedule);video.addEventListener('seeked',schedule);
 video.addEventListener('error',()=>{if(section.dataset.available==='yes'){section.dataset.available='no';status.textContent='Prøven kunne ikke åpnes · midlertidig plassholder.'}});
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduced.addEventListener('change',schedule);
 sound.addEventListener('click',async()=>{if(audioOn){mute();return}audioOn=true;sound.setAttribute('aria-pressed','true');sound.textContent='Lyd på';if(audio?.src)try{await audio.play()}catch{mute();status.textContent='Lyd er ikke tilgjengelig for denne prøven.'}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)mute()});
 section.dataset.scenes=scenes.map(s=>s[0]).join(',');schedule();
})();
