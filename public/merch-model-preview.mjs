import {createCreatorAtlasSvg} from './creator-atlas-preview.mjs';
import {printArtist,printTitle,safePrintImage} from './merch-shirt-preview.mjs';
import {availableModels,resolveModel} from './model-cohort.mjs';

const NS='http://www.w3.org/2000/svg';
const FIST='M264 310 L249 293 L257 280 L270 288 L270 267 L282 262 L291 266 L303 263 L315 273 L325 273 L339 285 L336 320 L321 340 L321 365 L279 365 L279 340 Z';
const URL_TEXT='stemmen-fra-innsiden.sendmailtodss.chatgpt.site';
const FRAMES={both:[290,0,950,1000],front:[325,125,380,425],back:[825,125,400,435]};
const PLACEMENT={
 male:{art:[930,165,200,306],signature:[1030,492],fist:[557,209,.29],url:[514,475,176],mark:[448,481,132]},
 female:{art:[931,180,187,282],signature:[1025,484],fist:[538,217,.28],url:[495,454,169],mark:[434,461,123]},
};
let serial=0;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
const svg=(tag,attrs={})=>{const n=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))n.setAttribute(key,String(value));return n;};

export function createModelSvg({design,artworks,model='male',view='both',language='no'}){
 const t=(no,en)=>language==='en'?en:no,identity=resolveModel(model),kind=identity.template,p=PLACEMENT[kind],frame=FRAMES[view]||FRAMES.both;
 if(identity.atlasIndex !== undefined)return createCreatorAtlasSvg({identity,design,artworks,view,language});
 const artwork=artworks.find(a=>a.id===design.prints[0]?.artworkId),source=safePrintImage(artwork?.image),name=printTitle(artwork,language),artist=printArtist(artwork);
 const s=svg('svg',{viewBox:frame.join(' '),width:frame[2],height:frame[3],role:'img','aria-label':t('Kunsttrykket på hiphopmodellen: ','Artwork on the hip-hop model: ')+name+' · '+artist,class:'hiphop-model-image'});
 s.dataset.artworkId=artwork?.id||'';s.dataset.model=kind;s.dataset.modelId=identity.id;s.dataset.modelStyle=identity.style;s.dataset.view=view;
 const id='model-fabric-'+(++serial),defs=svg('defs'),filter=svg('filter',{id,x:'-2%',y:'-2%',width:'104%',height:'104%'});
 filter.append(svg('feTurbulence',{type:'fractalNoise',baseFrequency:'.025 .012',numOctaves:1,seed:4,result:'folds'}),svg('feDisplacementMap',{in:'SourceGraphic',in2:'folds',scale:1.5,xChannelSelector:'R',yChannelSelector:'G'}));defs.append(filter);s.append(defs);
 const base=svg('image',{href:identity.image,x:0,y:0,width:1536,height:1024});base.dataset.role='model-template';s.append(base);
 if(source){const [x,y,width,height]=p.art,image=svg('image',{href:source,x,y,width,height,preserveAspectRatio:'xMidYMid meet',class:'hiphop-fabric-print',filter:`url(#${id})`});image.dataset.role='model-artwork';image.dataset.source=source;s.append(image);}
 else{const text=svg('text',{x:p.signature[0],y:300,'text-anchor':'middle','font-size':15});text.textContent=t('Motivbilde utilgjengelig','Artwork image unavailable');text.dataset.role='model-artwork-unavailable';s.append(text);}
 const signature=svg('text',{x:p.signature[0],y:p.signature[1],'text-anchor':'middle','font-size':Math.min(17,300/Math.max(1,artist.length)),'font-family':'Arial','font-weight':700,fill:'#111',class:'hiphop-fabric-print'});signature.dataset.role='model-artist-signature';signature.textContent=artist==='Innsatt 2601-46'?'Innsatt 260146':artist;s.append(signature);
 const [fx,fy,scale]=p.fist,fist=svg('path',{d:FIST,fill:'#111',transform:`translate(${fx} ${fy}) scale(${scale}) translate(-249 -262)`,class:'hiphop-fabric-print'});fist.dataset.role='model-heart-fist';s.append(fist);
 const address=svg('text',{x:p.url[0],y:p.url[1],'text-anchor':'middle','font-size':8.5,'font-family':'Arial',fill:'#111',textLength:p.url[2],lengthAdjust:'spacingAndGlyphs',class:'hiphop-fabric-print'});address.dataset.role='model-site-address';address.dataset.hemOffsetCm='5';address.textContent=URL_TEXT;s.append(address);
 if(design.branding.placement==='front_hem'){
  const [x,y,width]=p.mark;s.append(svg('rect',{x,y,width,height:13,rx:2,fill:'#263a42'}));const label=svg('text',{x:x+width/2,y:y+9.5,'text-anchor':'middle','font-size':7.7,'font-family':'Arial',fill:'#fff'});label.dataset.role='model-community-mark';label.textContent='Stemmen fra innsiden';s.append(label);
 }
 return s;
}

export async function modelPreviewPng(options){
 const s=createModelSvg({...options,view:'both'});
 if(s.querySelector('[data-role=model-artwork-unavailable]'))throw Error('image_unavailable');
 for(const image of s.querySelectorAll('image')){
  const r=await fetch(image.getAttribute('href'),{credentials:'same-origin',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('image_unavailable');
  const blob=await r.blob();if(!blob.type.startsWith('image/'))throw Error('image_unavailable');
  image.setAttribute('href',await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);}));
 }
 const style=svg('style');style.textContent='.hiphop-fabric-print{mix-blend-mode:multiply;opacity:.97}';s.prepend(style);
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=1130;const c=canvas.getContext('2d');if(!c)throw Error('canvas');
 c.fillStyle='#f1eee8';c.fillRect(0,0,canvas.width,canvas.height);
 const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(s)],{type:'image/svg+xml'}));
 try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});c.drawImage(image,280,20,950,1000);}finally{URL.revokeObjectURL(url);}
 c.textAlign='center';c.fillStyle='#20333b';c.font='bold 25px Arial';const a=options.artworks.find(a=>a.id===options.design.prints[0]?.artworkId);c.fillText(printTitle(a,options.language)+' · '+printArtist(a),768,1055,1420);c.font='20px Arial';c.fillText(options.language==='en'?'Virtual placement preview · not a manufactured sample':'Virtuell plasseringsvisning · ikke en produsert prøve',768,1095);
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('canvas');return blob;
}

export function mountModelLookbook({mount,getArtworks,getDesign,language='no',onSelect,compact=false,initialModel='all'}){
 const t=(no,en)=>language==='en'?en:no;let view=compact?'back':'both',displayModel=availableModels().some(identity=>identity.id===initialModel)?initialModel:'all',model=displayModel==='all'?'male':(resolveModel(displayModel).atlasIndex===undefined?resolveModel(displayModel).template:displayModel);
 const wrap=el('section','hiphop-lookbook'),title=el('h2','',t('Se trykket på modellene','See the print on the models'));
 const intro=el('p','',t('Velg et kunstverk og se det på T-skjorten, med kunstnerens signatur. Se begge sider eller gå nærmere inn på trykket.','Choose an artwork and see it on the T-shirt with the artist’s signature. View both sides or look closer at the print.'));
 const label=el('label','field',t('Kunstverk og kunstner','Artwork and artist')),select=el('select');select.setAttribute('aria-label',t('Velg trykk på modellene','Choose the print on the models'));label.append(select);
 const views=el('div','model-view-options');views.setAttribute('role','group');views.setAttribute('aria-label',t('Visning','View'));
 for(const [value,no,en]of [['both','Begge sider','Both sides'],['front','Forside / side','Front / side'],['back','Rygg · se trykket stort','Back · closer view']]){const b=el('button','secondary',t(no,en));b.type='button';b.dataset.modelView=value;b.addEventListener('click',()=>{view=value;refreshImages();});views.append(b);}
 const images=el('div','hiphop-model-grid'),credits=el('p','hiphop-model-credits'),download=el('button','secondary',t('Last ned modellvisning · PNG','Download model preview · PNG')),status=el('p','message');download.type='button';status.setAttribute('role','status');
 const models=el('select');models.setAttribute('aria-label',t('Modell for nedlasting','Model for download'));for(const identity of availableModels()){const o=el('option','',identity.label[language]||identity.label.no);o.value=identity.atlasIndex===undefined?identity.template:identity.id;models.append(o);}models.addEventListener('change',()=>{model=models.value;});
 const modelLabel=el('label','field',t('Velg modell','Choose a model')),modelFilter=el('select');modelFilter.dataset.role='model-selector';modelFilter.setAttribute('aria-label',t('Modeller i forhåndsvisningen','Models in the preview'));
 const allModels=el('option','',t('Begge modellene','Both models'));allModels.value='all';modelFilter.append(allModels);
 for(const identity of availableModels()){const option=el('option','',identity.label[language]||identity.label.no);option.value=identity.id;modelFilter.append(option);}
 modelFilter.value=displayModel;models.value=model;
 modelFilter.addEventListener('change',()=>{displayModel=modelFilter.value;if(displayModel!=='all'){model=resolveModel(displayModel).atlasIndex===undefined?resolveModel(displayModel).template:displayModel;models.value=model;}refreshImages();});modelLabel.append(modelFilter);
 const exports=el('div','designer-actions');exports.append(models,download);
 wrap.append(title,intro,label,modelLabel,views,credits,images,el('p','small-note',t('Virtuell plasseringsvisning. Endelig trykk og størrelse avklares med produsenten.','Virtual placement preview. Final print and dimensions are confirmed with the maker.')),exports,status);mount.replaceChildren(wrap);
 function refreshImages(){
  images.replaceChildren();const shown=availableModels().filter(identity=>displayModel==='all'?identity.atlasIndex===undefined:identity.id===displayModel);images.dataset.modelCount=String(shown.length);for(const identity of shown){const f=el('figure');f.dataset.modelId=identity.id;f.append(createModelSvg({design:getDesign(),artworks:getArtworks(),model:identity.id,view,language}),el('figcaption','',identity.label[language]||identity.label.no));images.append(f);}
  for(const b of views.children)b.setAttribute('aria-pressed',String(b.dataset.modelView===view));
  const a=getArtworks().find(a=>a.id===getDesign().prints[0]?.artworkId);credits.textContent=printTitle(a,language)+' · '+printArtist(a);
 }
 function refresh(){
  const previous=select.value;select.replaceChildren();const groups=new Map();for(const a of getArtworks()){const artist=printArtist(a)||t('Kunstner ikke oppgitt','Artist not listed');if(!groups.has(artist)){const g=el('optgroup');g.label=artist;groups.set(artist,g);select.append(g);}const o=el('option','',printTitle(a,language));o.value=a.id;groups.get(artist).append(o);}
  select.value=getDesign().prints[0]?.artworkId||previous;refreshImages();
 }
 select.addEventListener('change',()=>{onSelect(select.value);refresh();});
 download.addEventListener('click',async()=>{if(download.disabled)return;download.disabled=true;status.textContent=t('Lager modellvisning …','Preparing model preview …');try{const blob=await modelPreviewPng({design:structuredClone(getDesign()),artworks:getArtworks(),model,language});const url=URL.createObjectURL(blob),a=el('a');a.href=url;a.download='stemmen-'+model+'-'+getDesign().prints[0].artworkId+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);status.textContent=t('Modellvisningen er lastet ned.','Model preview downloaded.');}catch{status.textContent=t('Bildet kunne ikke lastes ned. Prøv igjen.','The preview could not be downloaded. Try again.');}finally{download.disabled=false;}});
 refresh();return {element:wrap,refresh};
}
