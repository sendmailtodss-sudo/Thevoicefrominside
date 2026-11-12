/** Local-only audio/project primitives. No network, provider or account integration. */
export const LIMITS = Object.freeze({seconds:180, trackBytes:32*1024*1024, headerBytes:128*1024, title:120, notes:12000, sampleRate:44100});
const MAGIC = new TextEncoder().encode('SFI-RAP-1\n');
export const BACKUP_MAX_BYTES = LIMITS.trackBytes*2 + LIMITS.headerBytes + MAGIC.length + 4;
export function problem(code) { return Object.assign(new Error(code), {code}); }
function object(value, keys) {
  if (!value || typeof value!=='object' || Array.isArray(value) || Object.keys(value).some(k=>!keys.includes(k))) throw problem('invalidBackup');
}
function text(value,max) { if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value))throw problem('invalidBackup');return value; }
function number(value,min,max) { if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw problem('invalidSettings');return value; }
export function defaultMeta() { return {title:'',notes:'',language:'no',beatGain:.7,voiceGain:1,voiceOffset:0,beatRights:false}; }
export function normalizeMeta(value) {
  object(value,['title','notes','language','beatGain','voiceGain','voiceOffset','beatRights']);
  if(!['no','en','zh-Hans'].includes(value.language)||typeof value.beatRights!=='boolean')throw problem('invalidBackup');
  return {title:text(value.title,LIMITS.title),notes:text(value.notes,LIMITS.notes),language:value.language,beatGain:number(value.beatGain,0,1.5),voiceGain:number(value.voiceGain,0,1.5),voiceOffset:number(value.voiceOffset,-30,180),beatRights:value.beatRights};
}
export function emptyProject() { return {version:1,meta:defaultMeta(),tracks:{beat:null,voice:null}}; }
export function validateProject(value) {
  object(value,['version','meta','tracks']);if(value.version!==1)throw problem('invalidBackup');
  const meta=normalizeMeta(value.meta);object(value.tracks,['beat','voice']);const tracks={};
  for(const kind of ['beat','voice']) {
    const track=value.tracks[kind];if(track===null){tracks[kind]=null;continue;}
    object(track,['name','blob']);text(track.name,120);
    if(!(track.blob instanceof Blob)||track.blob.size===0||track.blob.size>LIMITS.trackBytes)throw problem('fileSize');
    tracks[kind]={name:track.name,blob:track.blob};
  }
  return {version:1,meta,tracks};
}
function checkedTrack(track) {
  if(!track)return null;
  const {sampleRate,channels}=track;
  if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000||!Array.isArray(channels)||channels.length<1||channels.length>2||!(channels[0] instanceof Float32Array)||channels[0].length===0||channels.some(c=>!(c instanceof Float32Array)||c.length!==channels[0].length))throw problem('decodeFailed');
  if(channels[0].length/sampleRate>LIMITS.seconds)throw problem('tooLong');
  return track;
}
/** Linear resampling, signed voice placement, shared peak protection for playback/export. */
export function mixAudio({beat,voice},meta,outputRate=LIMITS.sampleRate) {
  beat=checkedTrack(beat);voice=checkedTrack(voice);meta=normalizeMeta(meta);
  if(!beat&&!voice)throw problem('needAudio');
  if(!Number.isInteger(outputRate)||outputRate<8000||outputRate>96000)throw problem('invalidSettings');
  const duration=Math.max(beat?beat.channels[0].length/beat.sampleRate:0,voice?voice.channels[0].length/voice.sampleRate+meta.voiceOffset:0);
  if(duration<=0)throw problem('needAudio');if(duration>LIMITS.seconds)throw problem('mixTooLong');
  const frames=Math.ceil(duration*outputRate),count=Math.max(beat?.channels.length??1,voice?.channels.length??1),channels=Array.from({length:count},()=>new Float32Array(frames));let peakBefore=0;
  for(const [track,gain,offset] of [[beat,meta.beatGain,0],[voice,meta.voiceGain,meta.voiceOffset]]) {
    if(!track||gain===0)continue;
    const start=Math.max(0,Math.ceil(offset*outputRate)),end=Math.min(frames,Math.ceil((offset+track.channels[0].length/track.sampleRate)*outputRate));
    for(let ch=0;ch<count;ch++) {
      const source=track.channels[Math.min(ch,track.channels.length-1)],target=channels[ch];
      for(let i=start;i<end;i++) {
        const position=(i/outputRate-offset)*track.sampleRate,index=Math.floor(position),fraction=position-index;
        if(index<0||index>=source.length)continue;
        const a=source[index],b=source[Math.min(index+1,source.length-1)];
        if(!Number.isFinite(a)||!Number.isFinite(b))throw problem('decodeFailed');
        target[i]+=(a+(b-a)*fraction)*gain;
        if(!Number.isFinite(target[i]))throw problem('decodeFailed');
      }
    }
  }
  for(const channel of channels)for(const sample of channel)peakBefore=Math.max(peakBefore,Math.abs(sample));
  const scale=peakBefore>.98?.98/peakBefore:1;
  if(scale!==1)for(const channel of channels)for(let i=0;i<channel.length;i++)channel[i]*=scale;
  return {channels,sampleRate:outputRate,duration:frames/outputRate,peakBefore,normalized:scale!==1};
}
/** Interleaved 16-bit little-endian PCM WAV. */
export function encodeWav({channels,sampleRate}) {
  if(!Number.isInteger(sampleRate)||sampleRate<8000||sampleRate>192000||!Array.isArray(channels)||channels.length<1||channels.length>2||!(channels[0] instanceof Float32Array)||channels[0].length===0||channels.some(c=>!(c instanceof Float32Array)||c.length!==channels[0].length)||channels[0].length/sampleRate>LIMITS.seconds)throw problem('decodeFailed');
  const frames=channels[0].length,count=channels.length,bytes=new Uint8Array(44+frames*count*2),view=new DataView(bytes.buffer);
  const ascii=(at,s)=>{for(let i=0;i<s.length;i++)bytes[at+i]=s.charCodeAt(i);};
  ascii(0,'RIFF');view.setUint32(4,bytes.length-8,true);ascii(8,'WAVE');ascii(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,count,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*count*2,true);view.setUint16(32,count*2,true);view.setUint16(34,16,true);ascii(36,'data');view.setUint32(40,frames*count*2,true);
  let at=44;for(let i=0;i<frames;i++)for(const channel of channels){if(!Number.isFinite(channel[i]))throw problem('decodeFailed');const n=Math.max(-1,Math.min(1,channel[i]));view.setInt16(at,Math.round(n*(n<0?32768:32767)),true);at+=2;}
  return bytes;
}
/** Original deterministic synthesized demo; no recordings, samples or AI service. */
export function demoBeat() {
  const sampleRate=22050,bpm=90,beat=60/bpm,duration=16*beat,channel=new Float32Array(Math.ceil(duration*sampleRate));let seed=1234567;
  const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};
  for(let step=0;step<32;step++) {
    const start=Math.round(step*beat*.5*sampleRate),kick=step%8===0||step%8===5,snare=step%8===2||step%8===6;
    for(let n=0;n<Math.min(sampleRate*.24,channel.length-start);n++) {const t=n/sampleRate;let sample=noise()*.09*Math.exp(-t*95);if(kick)sample+=Math.sin(2*Math.PI*(46*t+5*(1-Math.exp(-t*30))))*.65*Math.exp(-t*17);if(snare)sample+=noise()*.32*Math.exp(-t*24);channel[start+n]+=sample;}
    if(step%4===0)for(let n=0;n<Math.min(sampleRate*beat*.8,channel.length-start);n++){const t=n/sampleRate;channel[start+n]+=Math.sin(2*Math.PI*[65.406,65.406,77.782,58.27][Math.floor(step/8)]*t)*.18*Math.exp(-t*5);}
  }
  return {channels:[channel],sampleRate};
}
async function digest(blob) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join(''); }
export async function makeBackup(value) {
  const project=validateProject(value),tracks={},parts=[];
  for(const kind of ['beat','voice']) {const track=project.tracks[kind];tracks[kind]=track?{name:track.name,type:track.blob.type.slice(0,100),bytes:track.blob.size,sha256:await digest(track.blob)}:null;if(track)parts.push(track.blob);}
  const header=new TextEncoder().encode(JSON.stringify({format:'sfi-rapstudio',version:1,meta:project.meta,tracks}));if(header.length>LIMITS.headerBytes)throw problem('invalidBackup');
  const size=new Uint8Array(4);new DataView(size.buffer).setUint32(0,header.length,true);
  return new Blob([MAGIC,size,header,...parts],{type:'application/octet-stream'});
}
/** Reject the whole backup on any bad length, digest or field; do not mutate storage. */
export async function readBackup(file) {
  if(!(file instanceof Blob)||file.size<MAGIC.length+6||file.size>BACKUP_MAX_BYTES)throw problem('invalidBackup');
  const prefix=new Uint8Array(await file.slice(0,MAGIC.length+4).arrayBuffer());if(!MAGIC.every((b,i)=>prefix[i]===b))throw problem('invalidBackup');
  const length=new DataView(prefix.buffer).getUint32(MAGIC.length,true);if(!length||length>LIMITS.headerBytes||MAGIC.length+4+length>file.size)throw problem('invalidBackup');
  let header;try{header=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(await file.slice(MAGIC.length+4,MAGIC.length+4+length).arrayBuffer()));}catch{throw problem('invalidBackup');}
  object(header,['format','version','meta','tracks']);if(header.format!=='sfi-rapstudio'||header.version!==1)throw problem('invalidBackup');const meta=normalizeMeta(header.meta);object(header.tracks,['beat','voice']);const tracks={};let cursor=MAGIC.length+4+length;
  for(const kind of ['beat','voice']) {
    const track=header.tracks[kind];if(track===null){tracks[kind]=null;continue;}object(track,['name','type','bytes','sha256']);text(track.name,120);
    if(typeof track.type!=='string'||track.type.length>100||/[\r\n]/.test(track.type)||!Number.isSafeInteger(track.bytes)||track.bytes<1||track.bytes>LIMITS.trackBytes||typeof track.sha256!=='string'||!/^[a-f0-9]{64}$/.test(track.sha256)||cursor+track.bytes>file.size)throw problem('invalidBackup');
    const blob=file.slice(cursor,cursor+track.bytes,track.type);cursor+=track.bytes;if(await digest(blob)!==track.sha256)throw problem('invalidBackup');tracks[kind]={name:track.name,blob};
  }
  if(cursor!==file.size)throw problem('invalidBackup');return validateProject({version:1,meta,tracks});
}
