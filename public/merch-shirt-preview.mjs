const NS='http://www.w3.org/2000/svg';
const SHIRT='M183 60 Q210 70 250 79 Q300 110 350 79 Q390 70 417 60 L548 135 L500 245 L429 207 L429 650 Q300 669 171 650 L171 207 L100 245 L52 135 Z';
const PALETTE={white:['#fffef7','#e0dfd8'],black:['#32363b','#11151a'],navy:['#30425e','#142237']};
let sequence=0;
const svg=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));return el;};
export const printArtist=a=>typeof (a?.artistName||a?.artist)==='string'?(a.artistName||a.artist):'';
export const printTitle=(a,language)=>typeof a?.name?.[language]==='string'?a.name[language]:typeof a?.name?.no==='string'?a.name.no:a?.id||'';
export const safePrintImage=v=>typeof v==='string'&&/^\/(?:design-assets|api\/workshop\/creative\/media)\/[a-zA-Z0-9_./-]+(?:\.(?:webp|png|jpeg|jpg))?$/.test(v)&&!v.includes('..')?v:null;

// Every display and export uses the same artwork, identity and placement renderer.
export function createShirtSvg({design,artworks,side='back',language='no',guides=false,selected=0,className='print-shirt-shape'}){
 const t=(no,en)=>language==='en'?en:no,front=side==='front',id='shirt-fabric-'+(++sequence),colors=PALETTE[design.color]||PALETTE.white;
 const s=svg('svg',{viewBox:'0 0 600 720',width:600,height:720,class:className,role:'img','aria-label':t('T-skjorte, ','T-shirt, ')+(front?t('forside','front'):t('bakside','back'))});
 s.dataset.side=side;s.dataset.artworkId=design.prints[0]?.artworkId||'';
 const defs=svg('defs'),gradient=svg('linearGradient',{id,x1:'0%',x2:'100%'});
 for(const [offset,color]of [['0%',colors[1]],['32%',colors[0]],['65%',colors[0]],['100%',colors[1]]])gradient.append(svg('stop',{offset,'stop-color':color}));
 defs.append(gradient);s.append(defs,svg('path',{d:SHIRT,fill:`url(#${id})`,stroke:'#777','stroke-width':1.2}));
 s.append(svg('path',{d:front?'M250 80 Q300 143 350 80':'M250 80 Q300 100 350 80',fill:'none',stroke:'#b7b7b0','stroke-width':5}),svg('path',{d:'M174 205 L174 640 M426 205 L426 640 M180 635 Q300 650 420 635',fill:'none',stroke:'#cecec5','stroke-width':1}));
 if(guides)s.append(svg('rect',{x:180,y:170,width:240,height:320,fill:'none',stroke:'#a9aea8','stroke-dasharray':'5 5','stroke-width':1}));
 design.prints.forEach((p,i)=>{
  if(p.side!==side)return;
  const a=artworks.find(a=>a.id===p.artworkId),source=safePrintImage(a?.image),x=180+p.xCm*8,y=170+p.yCm*8,width=p.widthCm*8,height=p.heightCm*8;
  const missing=()=>{const message=svg('text',{x:x+width/2,y:y+height/2,'text-anchor':'middle','font-size':13,fill:'#34464b'});message.dataset.role='image-unavailable';message.textContent=t('Motivbilde utilgjengelig','Artwork image unavailable');return message;};
  if(source){const image=svg('image',{href:source,x,y,width,height,preserveAspectRatio:'xMidYMid meet'});image.dataset.source=source;image.addEventListener('error',()=>image.replaceWith(missing()),{once:true});s.append(image);}else s.append(missing());
  if(guides&&i===selected)s.append(svg('rect',{x,y,width,height,fill:'none',stroke:'#e85c4b','stroke-width':2}));
 });
 if(front){
  const fist=svg('path',{d:'M264 310 L249 293 L257 280 L270 288 L270 267 L282 262 L291 266 L303 263 L315 273 L325 273 L339 285 L336 320 L321 340 L321 365 L279 365 L279 340 Z',fill:'#111',transform:'translate(190 20) scale(0.65)'});fist.dataset.role='heart-fist';s.append(fist);
  const url=svg('text',{x:300,y:600,'text-anchor':'middle','font-size':9.5,'font-family':'Arial',fill:'#111'});url.dataset.role='site-address';url.textContent='stemmen-fra-innsiden.sendmailtodss.chatgpt.site';s.append(url);
  if(design.branding.placement==='front_hem'){
   s.append(svg('rect',{x:234,y:603,width:132,height:18,rx:3,fill:'#243a45'}));
   const mark=svg('text',{x:300,y:616,'text-anchor':'middle','font-size':9,'font-family':'sans-serif','font-weight':700,fill:'#fff'});mark.dataset.role='community-mark';mark.textContent='Stemmen fra innsiden';s.append(mark);
  }
 }else{
  const artist=printArtist(artworks.find(a=>a.id===design.prints[0]?.artworkId));
  const signature=svg('text',{x:300,y:520,'text-anchor':'middle','font-size':Math.min(19,400/Math.max(1,artist.length)),'font-family':'Arial','font-weight':700,fill:'#111'});signature.dataset.role='artist-signature';signature.textContent=artist==='Innsatt 2601-46'?'Innsatt 260146':artist;s.append(signature);
 }
 return s;
}

export async function shirtPreviewPng({design,artworks,language='no'}){
 const t=(no,en)=>language==='en'?en:no,canvas=document.createElement('canvas');canvas.width=1200;canvas.height=800;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas');ctx.fillStyle='#f0eee5';ctx.fillRect(0,0,1200,800);
 for(const [index,side]of ['front','back'].entries()){
  const el=createShirtSvg({design,artworks,side,language});
  if(el.querySelector('[data-role=image-unavailable]'))throw Error('image_unavailable');
  for(const image of el.querySelectorAll('image')){
   const response=await fetch(image.dataset.source,{credentials:'same-origin',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('image_unavailable');const blob=await response.blob();if(!blob.type.startsWith('image/'))throw Error('image_unavailable');
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});image.setAttribute('href',data);
  }
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(el)],{type:'image/svg+xml'}));
  try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});ctx.drawImage(image,index*600,30,600,720);}finally{URL.revokeObjectURL(url);}
  ctx.fillStyle='#193d45';ctx.font='bold 24px system-ui';ctx.fillText(side==='front'?t('FORSIDE','FRONT'):t('RYGG','BACK'),index*600+245,35);
 }
 if(design.branding.placement==='inside_label'){
  ctx.fillStyle='#fffdf8';ctx.fillRect(470,663,260,91);ctx.strokeStyle='#b9b1a2';ctx.strokeRect(470,663,260,91);ctx.textAlign='center';ctx.fillStyle='#193d45';ctx.font='bold 14px system-ui';ctx.fillText(t('INNVENDIG MERKELAPP','INSIDE LABEL'),600,685);ctx.fillRect(493,694,214,28);ctx.fillStyle='#fffdf8';ctx.font='bold 15px system-ui';ctx.fillText('Stemmen fra innsiden',600,713);ctx.fillStyle='#52656a';ctx.font='12px system-ui';ctx.fillText(t('Kun på innsiden · ingen utvendig merking','Inside only · no exterior branding'),600,741);ctx.textAlign='start';
 }
 ctx.fillStyle='#193d45';ctx.font='17px system-ui';ctx.fillText(t('Plasseringsforslag · ikke en produksjonskorrektur eller bestilling','Placement proposal · not a production proof or order'),70,775);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('canvas');return blob;
}
