import {LIMITS,emptyProject,normalizeMeta,validateProject,mixAudio,encodeWav,demoBeat,makeBackup,readBackup,problem} from './core.mjs';
import {loadProject,saveProject,deleteProject} from './storage.mjs';
import {translate,dictionaries} from './i18n.mjs';

const $=id=>document.getElementById(id);
let project=emptyProject(),decoded={beat:null,voice:null},context,busy=true,session=null,source=null,playback='stopped',position=0,startedAt=0,mix=null,mixKey=0,mixedKey=-1,revision=0,saveTimer,saveTail=Promise.resolve(),statusKey='loading',statusValues={},saveKey='loading',offlineKey='offlineWait',installEvent,loadBlocked=false,settingsInvalid=false;
const controls=['project-title','notes','language','beat-file','voice-file','demo','beat-rights','beat-gain','voice-gain','voice-offset','save','backup','restore-file','reset'];
const t=(key,values)=>translate(project.meta.language,key,values);
const clock=value=>{value=Math.max(0,Math.floor(value||0));return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`;};
function status(key,values={},error=false){statusKey=key;statusValues=values;$('status').textContent=t(key,values);$('status').dataset.code=key;$('status').dataset.error=String(error);}
function storageStatus(key){saveKey=key;$('save-status').textContent=t(key);$('save-status').dataset.code=key;$('save-status').dataset.error=String(['storageFull','storageUnavailable','saveFailed'].includes(key));}
function errorKey(error,fallback='genericError'){return typeof error?.code==='string'&&Object.hasOwn(dictionaries.no,error.code)?error.code:fallback;}
function failure(error){status(errorKey(error),{},true);}
function snapshot(){return validateProject(project);}
function invalidate(){mixKey++;mix=null;stopPlayback();}
function updateButtons(){
  const locked=busy||!!session,hasAudio=!!decoded.beat||!!decoded.voice,rights=!decoded.beat||project.meta.beatRights;
  for(const id of controls)$(id).disabled=locked;
  $('save').disabled=locked||loadBlocked||settingsInvalid;
  $('record').disabled=locked||settingsInvalid||!decoded.beat||!rights;
  $('finish-record').disabled=!session||session.recorder.state!=='recording';
  $('play').disabled=locked||settingsInvalid||!hasAudio||!rights||playback==='playing';$('pause').disabled=locked||playback!=='playing';$('stop').disabled=locked||(playback==='stopped'&&position===0);$('export').disabled=locked||settingsInvalid||!hasAudio||!rights;
  document.documentElement.dataset.recording=String(!!session);$('app').dataset.playback=playback;
}
function renderLanguage(){
  document.documentElement.lang=project.meta.language;document.title=`Rapstudio · ${t('tag')}`;
  for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=t(el.dataset.i18n);
  for(const el of document.querySelectorAll('[data-placeholder]'))el.placeholder=t(el.dataset.placeholder);
  for(const el of document.querySelectorAll('[data-label]'))el.setAttribute('aria-label',t(el.dataset.label));
  $('language').value=project.meta.language;status(statusKey,statusValues,$('status').dataset.error==='true');storageStatus(saveKey);$('offline-status').textContent=t(offlineKey);renderTracks();
}
function waveform(kind){const canvas=$(kind+'-wave'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.strokeStyle=kind==='beat'?'#bcff89':'#bdacf9';ctx.lineWidth=1;const data=decoded[kind]?.channels[0];if(!data){ctx.beginPath();ctx.moveTo(0,32);ctx.lineTo(canvas.width,32);ctx.stroke();return;}
  for(let x=0;x<canvas.width;x++){const start=Math.floor(x/canvas.width*data.length),end=Math.floor((x+1)/canvas.width*data.length),stride=Math.max(1,Math.floor((end-start)/50));let peak=0;for(let i=start;i<end;i+=stride)peak=Math.max(peak,Math.abs(data[i]));ctx.beginPath();ctx.moveTo(x,32-peak*29);ctx.lineTo(x,32+peak*29);ctx.stroke();}}
function renderTracks(){for(const kind of ['beat','voice']){const track=project.tracks[kind],audio=decoded[kind];$(kind+'-info').textContent=track?`${track.name} · ${audio?t('duration',{seconds:(audio.channels[0].length/audio.sampleRate).toFixed(1)}):t('decodeFailed')}`:t('noTrack');waveform(kind);}renderClock();}
function fillFields(){settingsInvalid=false;$('voice-offset').removeAttribute('aria-invalid');const meta=project.meta;$('project-title').value=meta.title;$('notes').value=meta.notes;$('beat-gain').value=Math.round(meta.beatGain*100);$('voice-gain').value=Math.round(meta.voiceGain*100);$('voice-offset').value=meta.voiceOffset;$('beat-rights').checked=meta.beatRights;renderLevels();renderLanguage();updateButtons();}
function renderLevels(){for(const kind of ['beat','voice'])$(kind+'-gain-value').textContent=`${Math.round(project.meta[kind+'Gain']*100)}%`;}
async function persist(){
  clearTimeout(saveTimer);if(loadBlocked){storageStatus('saveFailed');return false;}const value=snapshot(),version=revision;storageStatus('saving');const operation=saveTail.then(()=>saveProject(value));saveTail=operation.catch(()=>{});
  try{await operation;if(version===revision)storageStatus('saved');return true;}catch(error){if(version===revision)storageStatus(errorKey(error,'saveFailed'));return false;}
}
function changed(){revision++;storageStatus('unsaved');clearTimeout(saveTimer);saveTimer=setTimeout(()=>void persist(),650);}
function fieldsChanged(){
  try{const next=normalizeMeta({...project.meta,title:$('project-title').value,notes:$('notes').value,beatGain:Number($('beat-gain').value)/100,voiceGain:Number($('voice-gain').value)/100,voiceOffset:$('voice-offset').value.trim()===''?NaN:Number($('voice-offset').value),beatRights:$('beat-rights').checked});settingsInvalid=false;$('voice-offset').removeAttribute('aria-invalid');const audioChange=['beatGain','voiceGain','voiceOffset','beatRights'].some(key=>next[key]!==project.meta[key]);project.meta=next;if(audioChange)invalidate();renderLevels();changed();updateButtons();}catch(error){settingsInvalid=true;$('voice-offset').setAttribute('aria-invalid','true');failure(error);updateButtons();}
}
async function audioContext(){if(!context){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw problem('decodeFailed');try{context=new Audio({sampleRate:LIMITS.sampleRate});}catch{context=new Audio();}}return context;}
async function decode(blob){
  if(!blob.size||blob.size>LIMITS.trackBytes)throw problem('fileSize');const ctx=await audioContext();let buffer;
  try{buffer=await ctx.decodeAudioData(await blob.arrayBuffer());}catch{throw problem('decodeFailed');}
  if(buffer.duration>LIMITS.seconds)throw problem('tooLong');if(buffer.numberOfChannels<1||buffer.numberOfChannels>2||buffer.length===0)throw problem('decodeFailed');
  return {buffer,sampleRate:buffer.sampleRate,channels:Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i))};
}
async function decodeProject(value){const result={beat:null,voice:null};for(const kind of ['beat','voice'])if(value.tracks[kind])result[kind]=await decode(value.tracks[kind].blob);return result;}
async function run(action){if(busy)return;busy=true;updateButtons();try{await action();}catch(error){failure(error);}finally{busy=false;updateButtons();}}
async function importAudio(kind,blob,name,rights=false){
  status('working');const audio=await decode(blob);invalidate();project={...project,tracks:{...project.tracks,[kind]:{name:String(name).replace(/[\u0000-\u001f]/g,'').slice(0,120)||kind,blob}}};decoded={...decoded,[kind]:audio};
  if(kind==='beat')project.meta={...project.meta,beatRights:rights};else project.meta={...project.meta,voiceOffset:0};revision++;fillFields();const saved=await persist();status('loaded');if(!saved)status(saveKey,{},true);
}
function mayPlay(){if(!decoded.beat&&!decoded.voice)throw problem('needAudio');if(decoded.beat&&!project.meta.beatRights)throw problem('rightsRequired');}
async function currentMix(){mayPlay();if(mix&&mixedKey===mixKey)return mix;status('working');await new Promise(resolve=>requestAnimationFrame(resolve));mix=mixAudio(decoded,project.meta);mixedKey=mixKey;return mix;}
function stopPlayback(){if(source){const old=source;source=null;old.onended=null;try{old.stop();}catch{}old.disconnect();}playback='stopped';position=0;renderClock();updateButtons();}
function duration(){return mix?.duration??Math.max(decoded.beat?decoded.beat.channels[0].length/decoded.beat.sampleRate:0,decoded.voice?decoded.voice.channels[0].length/decoded.voice.sampleRate+project.meta.voiceOffset:0,0);}
function renderClock(){const now=playback==='playing'&&context?position+context.currentTime-startedAt:position;$('clock').textContent=`${clock(now)} / ${clock(duration())}`;}
function animate(){if(playback!=='playing')return;renderClock();requestAnimationFrame(animate);}
async function play(){const audio=await currentMix(),ctx=await audioContext();await ctx.resume();if(position>=audio.duration)position=0;const buffer=ctx.createBuffer(audio.channels.length,audio.channels[0].length,audio.sampleRate);audio.channels.forEach((c,i)=>buffer.copyToChannel(c,i));const node=ctx.createBufferSource();node.buffer=buffer;node.connect(ctx.destination);source=node;startedAt=ctx.currentTime;playback='playing';node.onended=()=>{if(source===node){source=null;playback='stopped';position=0;node.disconnect();renderClock();updateButtons();}};node.start(0,position);status('playing');updateButtons();animate();}
function pause(){if(playback!=='playing'||!source)return;position+=context.currentTime-startedAt;const old=source;source=null;old.onended=null;old.stop();old.disconnect();playback='paused';status('paused');renderClock();updateButtons();}
function download(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function filename(extension){const name=project.meta.title.trim().replace(/[^\p{L}\p{N} ._-]/gu,'').slice(0,60)||t('downloadName');return `${name}.${extension}`;}
function micError(error){return problem(error?.name==='NotAllowedError'||error?.name==='SecurityError'?'micDenied':error?.name==='NotFoundError'?'micMissing':'recordFailed');}
async function startRecording(){
  if(!decoded.beat)throw problem('needBeat');if(!project.meta.beatRights)throw problem('rightsRequired');if(!window.isSecureContext)throw problem('secureContext');if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw problem('unsupportedMic');
  stopPlayback();const ctx=await audioContext();await ctx.resume();let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});}catch(error){throw micError(error);}
  try{
    const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(type=>MediaRecorder.isTypeSupported(type)),recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined),monitor=ctx.createBufferSource(),gain=ctx.createGain();monitor.buffer=decoded.beat.buffer;gain.gain.value=project.meta.beatGain;monitor.connect(gain).connect(ctx.destination);
    let resolveDone,rejectDone;const done=new Promise((resolve,reject)=>{resolveDone=resolve;rejectDone=reject;});
    // A rejection is also observed if an automatic stop occurs without a button await.
    done.catch(()=>{});const take={recorder,stream,monitor,gain,chunks:[],bytes:0,start:performance.now(),done,reason:'recorded',finishing:false};session=take;
    recorder.ondataavailable=event=>{if(event.data?.size){take.chunks.push(event.data);take.bytes+=event.data.size;if(take.bytes>LIMITS.trackBytes)void stopRecording('recordLimit').catch(failure);}};
    recorder.onerror=()=>{take.reason='recordFailed';if(recorder.state!=='inactive')recorder.stop();};
    recorder.onstop=async()=>{
      clearInterval(take.timer);for(const track of stream.getTracks())track.stop();try{monitor.stop();}catch{}monitor.disconnect();gain.disconnect();
      try{if(take.reason==='recordFailed'||!take.bytes||take.bytes>LIMITS.trackBytes)throw problem('recordFailed');status('working');const blob=new Blob(take.chunks,{type:recorder.mimeType||mime||'audio/webm'});await importAudio('voice',blob,'voice-take');status(take.reason);resolveDone();}catch(error){failure(error);rejectDone(error);}finally{if(session===take)session=null;updateButtons();}
    };
    for(const track of stream.getAudioTracks())track.addEventListener('ended',()=>void stopRecording('interrupted').catch(failure),{once:true});
    recorder.start(500);monitor.start();status('recording',{time:'0:00'});take.timer=setInterval(()=>{const seconds=(performance.now()-take.start)/1000;status('recording',{time:clock(seconds)});if(seconds>=LIMITS.seconds-1)void stopRecording('recordLimit').catch(failure);},200);updateButtons();
  }catch(error){for(const track of stream.getTracks())track.stop();session=null;throw micError(error);}
}
function stopRecording(reason='recorded'){
  if(!session)return Promise.resolve();const take=session;if(!take.finishing){take.finishing=true;take.reason=reason;clearInterval(take.timer);if(take.recorder.state!=='inactive')take.recorder.stop();updateButtons();}return take.done;
}
for(const id of ['project-title','notes','beat-rights','beat-gain','voice-gain','voice-offset'])$(id).addEventListener('input',fieldsChanged);
$('language').addEventListener('change',()=>{const language=$('language').value;if(!dictionaries[language])return;project.meta={...project.meta,language};renderLanguage();changed();});
for(const kind of ['beat','voice'])$(kind+'-file').addEventListener('change',()=>{const input=$(kind+'-file'),file=input.files[0];if(file)void run(async()=>{try{await importAudio(kind,file,file.name);}finally{input.value='';}});});
$('demo').addEventListener('click',()=>void run(async()=>{const wav=encodeWav(demoBeat());await importAudio('beat',new Blob([wav],{type:'audio/wav'}),'demo-90bpm.wav',true);}));
$('record').addEventListener('click',()=>void run(startRecording));$('finish-record').addEventListener('click',()=>void run(()=>stopRecording()));
$('play').addEventListener('click',()=>void run(play));$('pause').addEventListener('click',pause);$('stop').addEventListener('click',()=>{stopPlayback();status('stopped');});
$('export').addEventListener('click',()=>void run(async()=>{stopPlayback();const audio=await currentMix();download(new Blob([encodeWav(audio)],{type:'audio/wav'}),filename('wav'));status('wavReady');if(audio.normalized)status('normalized');}));
$('save').addEventListener('click',()=>void run(async()=>{await persist();}));
$('backup').addEventListener('click',()=>void run(async()=>{status('working');const blob=await makeBackup(snapshot());download(blob,filename('rapstudio'));status('backupReady');}));
$('restore-file').addEventListener('change',()=>{const input=$('restore-file'),file=input.files[0];if(!file)return;void run(async()=>{try{if((project.tracks.beat||project.tracks.voice||project.meta.title||project.meta.notes||loadBlocked)&&!window.confirm(t('restoreConfirm')))return;status('working');const next=await readBackup(file),audio=await decodeProject(next);clearTimeout(saveTimer);await saveTail;await saveProject(next);invalidate();project=next;decoded=audio;loadBlocked=false;revision++;storageStatus('saved');fillFields();status('restored');}finally{input.value='';}});});
$('reset').addEventListener('click',()=>{if(!window.confirm(t('resetConfirm')))return;void run(async()=>{clearTimeout(saveTimer);await saveTail;await deleteProject();invalidate();const language=project.meta.language;project=emptyProject();project.meta.language=language;decoded={beat:null,voice:null};loadBlocked=false;revision++;storageStatus('ready');fillFields();status('resetDone');});});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&session)void stopRecording('interrupted').catch(failure);});
window.addEventListener('pagehide',()=>{if(session)void stopRecording('interrupted').catch(()=>{});stopPlayback();});
window.addEventListener('beforeunload',event=>{if(session||saveKey==='unsaved'||saveKey==='saving'||['storageFull','saveFailed','storageUnavailable'].includes(saveKey)){event.preventDefault();event.returnValue='';}});
window.addEventListener('online',()=>status('online'));window.addEventListener('offline',()=>status('offline'));
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;$('install').hidden=false;});
$('install').addEventListener('click',async()=>{if(!installEvent)return;await installEvent.prompt();await installEvent.userChoice;installEvent=null;$('install').hidden=true;});
async function offlineSetup(){try{if(!('serviceWorker'in navigator)||!window.isSecureContext)throw Error();const registration=await navigator.serviceWorker.register(new URL('./sw.js',import.meta.url),{scope:new URL('./',import.meta.url).pathname});await navigator.serviceWorker.ready;if(!registration.active)throw Error();offlineKey='offlineReady';}catch{offlineKey='offlineFailed';}$('offline-status').textContent=t(offlineKey);$('offline-status').dataset.code=offlineKey;}
async function init(){
  try{const stored=await loadProject();status('ready');if(stored){project=stored;storageStatus('saved');for(const kind of ['beat','voice'])if(stored.tracks[kind]){try{decoded[kind]=await decode(stored.tracks[kind].blob);}catch(error){failure(error);}}}else storageStatus('ready');}catch(error){loadBlocked=true;const key=errorKey(error,'storageUnavailable');storageStatus(key);status(key,{},true);}
  const language=new URL(location.href).searchParams.get('lang');if(dictionaries[language])project.meta.language=language;fillFields();busy=false;updateButtons();$('app').dataset.ready='true';void offlineSetup();
}
updateButtons();
void init();
