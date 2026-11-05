/* Publication copies only: strip metadata; never store an unreviewed raw photo. */
const error=()=>{throw new Error('invalid_publication_image');};
const concat=parts=>{const out=new Uint8Array(parts.reduce((n,b)=>n+b.length,0));let p=0;for(const b of parts){out.set(b,p);p+=b.length;}return out;};
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function jpeg(b){
 if(b.length<30||b[0]!==255||b[1]!==216)error();const v=new DataView(b.buffer,b.byteOffset,b.byteLength),out=[b.slice(0,2)],components=new Set();let p=2,frame=false,scan=false,quant=false,huffman=false;
 while(p<b.length){const start=p;if(b[p++]!==255)error();while(b[p]===255)p++;const marker=b[p++];
  if(marker===217){if(!frame||!scan||!quant||!huffman)error();out.push(Uint8Array.of(255,217));return concat(out);}
  if(marker===0||marker===216||marker===undefined||p+2>b.length)error();const n=v.getUint16(p),end=p+n;if(n<2||end>b.length)error();
  if([192,193,194].includes(marker)){if(frame||n<11||b[p+2]!==8||![1,3,4].includes(b[p+7])||n!==8+3*b[p+7]||!v.getUint16(p+3)||!v.getUint16(p+5))error();for(let q=p+8;q<end;q+=3){if(components.has(b[q])||!(b[q+1]>>4)||!(b[q+1]&15)||(b[q+1]>>4)>4||(b[q+1]&15)>4||b[q+2]>3)error();components.add(b[q]);}frame=true;}
  else if(marker===219){let q=p+2;if(q===end)error();while(q<end){const spec=b[q++];if((spec>>4)>1||(spec&15)>3)error();q+=64*((spec>>4)+1);if(q>end)error();}quant=true;}
  else if(marker===196){let q=p+2;if(q===end)error();while(q<end){const spec=b[q++];if((spec>>4)>1||(spec&15)>3||q+16>end)error();let symbols=0,slots=1;for(let i=0;i<16;i++){const count=b[q++];symbols+=count;slots=slots*2-count;if(slots<0)error();}if(!symbols||symbols>256||q+symbols>end)error();q+=symbols;}huffman=true;}
  else if(marker===221){if(n!==4)error();}
  else if(marker===218){if(!frame||n<8||!b[p+2]||b[p+2]>components.size||n!==6+2*b[p+2])error();const selected=new Set();for(let q=p+3;q<end-3;q+=2){if(!components.has(b[q])||selected.has(b[q])||(b[q+1]>>4)>3||(b[q+1]&15)>3)error();selected.add(b[q]);}if(b[end-3]>63||b[end-2]>63||b[end-3]>b[end-2]||(b[end-1]>>4)>13||(b[end-1]&15)>13)error();let q=end;while(q+1<b.length){if(b[q]!==255){q++;continue;}const next=b[q+1];if(next===0||(next>=208&&next<=215)){q+=2;continue;}if(next===255){q++;continue;}break;}if(q===end||q+1>=b.length)error();out.push(b.slice(start,q));scan=true;p=q;continue;}
  else if(marker!==221&&marker!==254&&!(marker>=224&&marker<=239))error();
  // All APPn (including EXIF, GPS, ICC/XMP and Photoshop) and COM are removed.
  if(marker!==254&&!(marker>=224&&marker<=239))out.push(b.slice(start,end));p=end;
 }
 error();
}
async function png(b){
 if(b.length<45||![137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n))error();const v=new DataView(b.buffer,b.byteOffset,b.byteLength),out=[b.slice(0,8)],pixels=[];let p=8,header=false,ended=false,width,height,bits,channels;
 const keep=new Set(['IHDR','PLTE','tRNS','gAMA','cHRM','sRGB','IDAT','IEND']);
 while(p+12<=b.length){const length=v.getUint32(p),end=p+12+length;if(end>b.length||length>26*1024*1024)error();const type=String.fromCharCode(...b.slice(p+4,p+8));if(!/^[A-Za-z]{4}$/.test(type)||crc32(b.slice(p+4,end-4))!==v.getUint32(end-4))error();if(!header&&type!=='IHDR')error();
  if(type==='IHDR'){if(header||length!==13)error();header=true;width=v.getUint32(p+8);height=v.getUint32(p+12);bits=b[p+16];const color=b[p+17];channels=({0:1,2:3,3:1,4:2,6:4})[color];if(!width||!height||width*height>100000000||!channels||!([0,3].includes(color)?[1,2,4,8,16]:[8,16]).includes(bits)||color===3&&bits===16||b[p+18]!==0||b[p+19]!==0||b[p+20]!==0)error();}
  if(type==='acTL'||type==='fcTL'||type==='fdAT')error();
  if(type==='IDAT'){if(!length)error();pixels.push(b.slice(p+8,end-4));}
  if(type==='IEND'){if(length||!pixels.length)error();ended=true;out.push(b.slice(p,end));break;}
  if(!keep.has(type)&&type[0]===type[0].toUpperCase())error();
  if(keep.has(type))out.push(b.slice(p,end));p=end;
 }
 if(!ended)error();
 // Validate decompressed scanline length and PNG filter bytes without retaining pixels.
 const stride=1+Math.ceil(width*channels*bits/8),expected=stride*height,compressed=concat(pixels);
 const reader=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate')).getReader();let count=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;for(let i=(stride-count%stride)%stride;i<value.length;i+=stride)if(value[i]>4)error();count+=value.length;if(count>expected){await reader.cancel();error();}}}finally{reader.releaseLock();}
 if(count!==expected)error();return concat(out);
}
export async function sanitizePublicationPhoto(bytes,mime){if(mime==='image/jpeg')return jpeg(bytes);if(mime==='image/png')return await png(bytes);/* Browser converts WebP to JPEG first. Raw WebP is not accepted here. */error();}

/* Keep audio frames/samples only. Tags, comments, filenames and account metadata are not public. */
function wav(b){
 const v=new DataView(b.buffer,b.byteOffset,b.byteLength),tag=(p,n=4)=>String.fromCharCode(...b.slice(p,p+n));
 if(b.length<44||tag(0)!=='RIFF'||tag(8)!=='WAVE'||v.getUint32(4,true)+8!==b.length)error();
 let p=12,format=null,data=null;
 while(p+8<=b.length){const type=tag(p),n=v.getUint32(p+4,true),end=p+8+n;if(end>b.length)error();
  if(type==='fmt '){if(format||n!==16)error();const kind=v.getUint16(p+8,true),channels=v.getUint16(p+10,true),rate=v.getUint32(p+12,true),byteRate=v.getUint32(p+16,true),align=v.getUint16(p+20,true),bits=v.getUint16(p+22,true);if(kind!==1||![1,2].includes(channels)||rate<8000||rate>192000||![8,16,24,32].includes(bits)||align!==channels*bits/8||byteRate!==rate*align)error();format=b.slice(p,end);}
  if(type==='data'){if(data||!format||!n)error();const align=new DataView(format.buffer,format.byteOffset).getUint16(20,true);if(n%align)error();data=b.slice(p,end+(n%2));}
  p=end+(n%2);
 }
 if(p!==b.length||!format||!data)error();const header=b.slice(0,12);new DataView(header.buffer).setUint32(4,4+format.length+data.length,true);return concat([header,format,data]);
}
function mp3(b){
 const tag=(p,n)=>String.fromCharCode(...b.slice(p,p+n));let p=0;const frames=[];
 // ID3v2 is an optional leading tag; malformed size/version fields fail closed.
 if(tag(0,3)==='ID3'){if(b.length<10||![2,3,4].includes(b[3])||b[4]===255||b.slice(6,10).some(x=>x&128))error();const n=(b[6]<<21)|(b[7]<<14)|(b[8]<<7)|b[9];p=10+n+(b[3]===4&&(b[5]&16)?10:0);if(p>b.length)error();}
 let lastVersion=null,lastRate=null;
 while(p<b.length){
  // Known trailing metadata is discarded only after complete audio frames.
  if(frames.length&&((b.length-p===128&&tag(p,3)==='TAG')||tag(p,8)==='APETAGEX'))break;
  if(p+4>b.length||b[p]!==255||(b[p+1]&224)!==224)error();
  const version=(b[p+1]>>3)&3,layer=(b[p+1]>>1)&3,bitrateIndex=b[p+2]>>4,rateIndex=(b[p+2]>>2)&3,padding=(b[p+2]>>1)&1;
  if(version===1||layer!==1||bitrateIndex===0||bitrateIndex===15||rateIndex===3)error();
  const rates=[44100,48000,32000],rate=rates[rateIndex]/(version===3?1:version===2?2:4),bitrates=version===3?[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]:[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];
  const n=Math.floor((version===3?144:72)*bitrates[bitrateIndex]*1000/rate)+padding;if(p+n>b.length||n<24||lastVersion!==null&&(version!==lastVersion||rate!==lastRate))error();
  frames.push(b.slice(p,p+n));lastVersion=version;lastRate=rate;p+=n;
 }
 if(frames.length<2)error();return concat(frames);
}
export function sanitizePublicationAudio(bytes,mime){if(mime==='audio/mpeg')return mp3(bytes);if(['audio/wav','audio/x-wav'].includes(mime))return wav(bytes);throw new Error('unsupported_publication_audio');}
