import './creator-print-placement.js';
import {printArtist,printTitle,safePrintImage} from './merch-shirt-preview.mjs';

const NS='http://www.w3.org/2000/svg';
const svg=(tag,attrs={})=>{const node=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));return node;};

/** Atlas cells are 222 × 444. Back print coordinates are relative to each cell. */
export function createCreatorAtlasSvg({identity,design,artworks,view='both',language='no'}){
 const artwork=artworks.find(a=>a.id===design.prints[0]?.artworkId),source=safePrintImage(artwork?.image),artist=printArtist(artwork),title=printTitle(artwork,language);
 const both=view==='both',back=view!=='front',width=both?444:222;
 const root=svg('svg',{viewBox:`0 0 ${width} 444`,width,height:444,role:'img',class:'hiphop-model-image','aria-label':`${identity.label[language]||identity.label.no} · ${view==='front'?(language==='en'?'side':'side'):(language==='en'?'back':'rygg')} · ${title} · ${artist}`});
 Object.assign(root.dataset,{artworkId:artwork?.id||'',model:identity.template,modelId:identity.id,modelStyle:identity.style,view});
 function cell(row,x){
  const crop=svg('svg',{x,y:0,width:222,height:444,viewBox:`${identity.atlasIndex*222} ${row*444} 222 444`,overflow:'hidden'});
  const image=svg('image',{href:identity.image,x:0,y:0,width:1776,height:888});image.dataset.role='model-template';crop.append(image);root.append(crop);
 }
 if(both||!back)cell(0,0);
 if(back){
  const x=both?222:0;cell(1,x);
  // Every print stays within the torso; leave space below for the signature.
  const placement=globalThis.SFICreatorPrintPlacement(identity.atlasIndex),center=x+placement.center;
  const {top,height}=placement;
  if(source){const image=svg('image',{href:source,x:center-27,y:top,width:54,height,preserveAspectRatio:'xMidYMid meet',class:'hiphop-fabric-print'});image.dataset.role='model-artwork';image.dataset.source=source;root.append(image);}
  else{const text=svg('text',{x:center,y:130,'text-anchor':'middle','font-size':6});text.textContent=language==='en'?'Artwork unavailable':'Motiv utilgjengelig';text.dataset.role='model-artwork-unavailable';root.append(text);}
  const signature=svg('text',{x:center,y:top+height+10,'text-anchor':'middle','font-size':Math.min(7,100/Math.max(1,artist.length)),'font-family':'Arial','font-weight':'700',fill:'#111',class:'hiphop-fabric-print'});signature.dataset.role='model-artist-signature';signature.textContent=artist==='Innsatt 2601-46'?'Innsatt 260146':artist;root.append(signature);
 }
 return root;
}
