const NS='http://www.w3.org/2000/svg';
export const PRINT_DOMAIN='THEVOICEFROMINSIDE.DEV';
// Flat construction study: dropped shoulders, wide body and a long, straight hem.
const SHIRT='M170 63 L250 82 Q300 99 350 82 L430 63 L570 151 L520 282 L472 250 L472 708 Q300 721 128 708 L128 250 L80 282 L30 151 Z';
const PALETTE={white:['#fffef7','#e0dfd8'],black:['#32363b','#11151a'],navy:['#30425e','#142237']};
let sequence=0;
const svg=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));return el;};
export const printArtist=a=>typeof (a?.artistName||a?.artist)==='string'?(a.artistName||a.artist):'';
export const printTitle=(a,language)=>typeof a?.name?.[language]==='string'?a.name[language]:typeof a?.name?.no==='string'?a.name.no:a?.id||'';
const approvedEditorialImages=new Set(['/design-assets/approved-illustrations/skoleplassen-diary-a261e5ecdf855f130d37df7c6c5d07e478f18fdd640d6e728c86bd9ce7b35d25.webp','/design-assets/approved-illustrations/kampsport-diary-b04bb7dfcc2cf6443c038428c70202c351e125bcc695d8f2636f5014157adce4.webp']);
export const safePrintImage=v=>approvedEditorialImages.has(v)||(typeof v==='string'&&/^\/(?:design-assets|api\/workshop\/creative\/media)\/[a-zA-Z0-9_./-]+(?:\.(?:webp|png|jpeg|jpg))?$/.test(v)&&!v.includes('..'))?v:null;

// Every display and export uses the same artwork, identity and placement renderer.
export function createShirtSvg({design,artworks,side='back',language='no',guides=false,selected=0,className='print-shirt-shape'}){
 const t=(no,en)=>language==='en'?en:no,front=side==='front',id='shirt-fabric-'+(++sequence),colors=PALETTE[design.color]||PALETTE.white;
 const s=svg('svg',{viewBox:'0 0 600 760',width:600,height:760,class:className,role:'img','aria-label':t('Lang oversized T-skjorte, ','Long oversized T-shirt, ')+(front?t('forside','front'):t('bakside','back'))});
 s.dataset.garment='oversized-long-tshirt';s.dataset.rendering='flat-placement-study';s.dataset.side=side;s.dataset.artworkId=design.prints[0]?.artworkId||'';
 const defs=svg('defs'),gradient=svg('linearGradient',{id,x1:'0%',x2:'100%'});
 for(const [offset,color]of [['0%',colors[1]],['32%',colors[0]],['65%',colors[0]],['100%',colors[1]]])gradient.append(svg('stop',{offset,'stop-color':color}));
 defs.append(gradient);s.append(defs,svg('path',{d:SHIRT,fill:`url(#${id})`,stroke:'#777','stroke-width':1.2}));
 s.append(svg('path',{d:front?'M250 83 Q300 147 350 83':'M250 83 Q300 107 350 83',fill:'none',stroke:'#b7b7b0','stroke-width':4}),svg('path',{d:'M133 252 L133 695 M467 252 L467 695 M133 696 Q300 709 467 696 M39 151 L86 271 M561 151 L514 271',fill:'none',stroke:'#cecec5','stroke-width':1.2}));
 if(guides)s.append(svg('rect',{x:130,y:179,width:340,height:453.33,fill:'none',stroke:'#a9aea8','stroke-dasharray':'5 5','stroke-width':1}));
 design.prints.forEach((p,i)=>{
  if(p.side!==side)return;
  const a=artworks.find(a=>a.id===p.artworkId),source=safePrintImage(a?.image),x=130+p.xCm*(34/3),y=179+p.yCm*(34/3),width=p.widthCm*(34/3),height=p.heightCm*(34/3);
  const missing=()=>{const message=svg('text',{x:x+width/2,y:y+height/2,'text-anchor':'middle','font-size':13,fill:'#34464b'});message.dataset.role='image-unavailable';message.textContent=t('Motivbilde utilgjengelig','Artwork image unavailable');return message;};
  if(source){const image=svg('image',{href:source,x,y,width,height,preserveAspectRatio:'xMidYMid meet','data-role':'artwork-original'});image.dataset.source=source;image.addEventListener('error',()=>image.replaceWith(missing()),{once:true});s.append(image);}else s.append(missing());
  if(guides&&i===selected)s.append(svg('rect',{x,y,width,height,fill:'none',stroke:'#e85c4b','stroke-width':2}));
 });
 if(front){
  const fist=svg('path',{d:'M264 310 L249 293 L257 280 L270 288 L270 267 L282 262 L291 266 L303 263 L315 273 L325 273 L339 285 L336 320 L321 340 L321 365 L279 365 L279 340 Z',fill:'#111',transform:'translate(225 -50) scale(0.65)'});fist.dataset.role='heart-fist';s.append(fist);
  const url=svg('text',{x:300,y:654,'text-anchor':'middle','font-size':12,'font-family':'Arial',fill:'#111'});url.dataset.role='site-address';url.textContent=PRINT_DOMAIN;s.append(url);
  if(design.branding.placement==='front_hem'){
   s.append(svg('rect',{x:234,y:672,width:132,height:18,rx:3,fill:'#243a45'}));
   const mark=svg('text',{x:300,y:685,'text-anchor':'middle','font-size':9,'font-family':'sans-serif','font-weight':700,fill:'#fff'});mark.dataset.role='community-mark';mark.textContent='Stemmen fra innsiden';s.append(mark);
  }
 }else{
  const address=svg('text',{x:300,y:151,'text-anchor':'middle','font-size':15,'font-family':'Arial','font-weight':700,'letter-spacing':1,fill:'#111'});address.dataset.role='back-site-address';address.textContent=PRINT_DOMAIN;s.append(address);
  const artist=printArtist(artworks.find(a=>a.id===design.prints[0]?.artworkId));
  const signature=svg('text',{x:300,y:691,'text-anchor':'middle','font-size':Math.min(19,400/Math.max(1,artist.length)),'font-family':'Arial','font-weight':700,fill:'#111'});signature.dataset.role='artist-signature';signature.dataset.placement='back-bottom-hem';signature.textContent=artist==='Innsatt 2601-46'?'Innsatt 260146':artist;s.append(signature);
 }
 return s;
}

export async function shirtPreviewPng({design,artworks,language='no'}){
 const t=(no,en)=>language==='en'?en:no,canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas');ctx.fillStyle='#f0eee5';ctx.fillRect(0,0,1200,900);
 for(const [index,side]of ['front','back'].entries()){
  const el=createShirtSvg({design,artworks,side,language});
  if(el.querySelector('[data-role=image-unavailable]'))throw Error('image_unavailable');
  for(const image of el.querySelectorAll('image')){
   const response=await fetch(image.dataset.source,{credentials:'same-origin',signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('image_unavailable');const blob=await response.blob();if(!blob.type.startsWith('image/'))throw Error('image_unavailable');
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});image.setAttribute('href',data);
  }
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(el)],{type:'image/svg+xml'}));
  try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});ctx.drawImage(image,index*600,30,600,760);}finally{URL.revokeObjectURL(url);}
  ctx.fillStyle='#193d45';ctx.font='bold 24px system-ui';ctx.fillText(side==='front'?t('FORSIDE','FRONT'):t('RYGG','BACK'),index*600+245,35);
 }
 if(design.branding.placement==='inside_label'){
  ctx.fillStyle='#fffdf8';ctx.fillRect(470,760,260,91);ctx.strokeStyle='#b9b1a2';ctx.strokeRect(470,760,260,91);ctx.textAlign='center';ctx.fillStyle='#193d45';ctx.font='bold 14px system-ui';ctx.fillText(t('INNVENDIG MERKELAPP','INSIDE LABEL'),600,782);ctx.fillRect(493,791,214,28);ctx.fillStyle='#fffdf8';ctx.font='bold 15px system-ui';ctx.fillText('Stemmen fra innsiden',600,810);ctx.fillStyle='#52656a';ctx.font='12px system-ui';ctx.fillText(t('Kun på innsiden · ingen utvendig merking','Inside only · no exterior branding'),600,838);ctx.textAlign='start';
 }
 ctx.fillStyle='#193d45';ctx.font='17px system-ui';ctx.fillText(t('Plasseringsforslag · ikke en produksjonskorrektur eller bestilling','Placement proposal · not a production proof or order'),70,878);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('canvas');return blob;
}
