import {createShirtSvg,shirtPreviewPng,printArtist,printTitle,safePrintImage,PRINT_DOMAIN} from './merch-shirt-preview.mjs';
import {designExport} from './merch-designer-core.mjs';
const NS='http://www.w3.org/2000/svg';
const node=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const svg=(tag,attrs={})=>{const el=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,String(value));return el;};
let serial=0;
const CAMP='M170 88 L252 61 L300 108 L348 61 L430 88 L565 160 L515 287 L480 256 L480 590 L120 590 L120 256 L85 287 L35 160 Z';
export function createCampShirtSvg({design,artworks,language='no'}){
 const t=(no,en)=>language==='en'?en:no,a=artworks.find(a=>a.id===design.prints[0]?.artworkId),source=safePrintImage(a?.image),id='camp-pattern-'+(++serial);
 const s=svg('svg',{viewBox:'0 0 600 650',width:600,height:650,role:'img','aria-label':t('Studie: kortermet camp-skjorte med gjentatt originalmotiv','Study: short-sleeve camp shirt with repeated original artwork'),class:'print-shirt-shape camp-shirt-study'});
 Object.assign(s.dataset,{userContent:'print-preview',garment:'all-over-camp-shirt',rendering:'flat-pattern-study',artworkId:a?.id||''});
 const defs=svg('defs'),pattern=svg('pattern',{id,width:150,height:200,patternUnits:'userSpaceOnUse'});pattern.append(svg('rect',{width:150,height:200,fill:'#e8dfca'}));
 if(source){const image=svg('image',{href:source,width:150,height:200,preserveAspectRatio:'xMidYMid meet'});image.dataset.role='artwork-original';image.dataset.source=source;pattern.append(image);}defs.append(pattern);s.append(defs,svg('path',{d:CAMP,fill:`url(#${id})`,stroke:'#5a544a','stroke-width':2}));
 s.append(svg('path',{d:'M252 61 L300 108 L267 167 L228 111 Z M348 61 L300 108 L333 167 L372 111 Z',fill:'#f2e8d7',stroke:'#5a544a','stroke-width':1.5}),svg('path',{d:'M300 108 L300 590 M124 579 L476 579',fill:'none',stroke:'#f6eddc','stroke-width':8}),svg('path',{d:'M300 108 L300 590',fill:'none',stroke:'#5a544a','stroke-width':1}));
 for(const y of [207,285,363,441,519])s.append(svg('circle',{cx:300,cy:y,r:3.5,fill:'#403c36'}));
 const domain=svg('text',{x:300,y:197,'text-anchor':'middle','font-family':'Arial','font-size':13,'font-weight':700,fill:'#fff',stroke:'#1a1a1a','stroke-width':3,'paint-order':'stroke'});domain.dataset.role='back-site-address';domain.textContent=PRINT_DOMAIN;s.append(domain);
 const signature=svg('text',{x:300,y:569,'text-anchor':'middle','font-family':'Arial','font-size':16,'font-weight':700,fill:'#fff',stroke:'#1a1a1a','stroke-width':3,'paint-order':'stroke'});signature.dataset.role='artist-signature';signature.textContent=printArtist(a)==='Innsatt 2601-46'?'Innsatt 260146':printArtist(a);s.append(signature);return s;
}
export function campShirtInquiry(design,artworks=[]){
 const proposal=designExport(design,artworks);
 return {...proposal,format:'sfi-camp-shirt-inquiry',productType:'all_over_short_sleeve_camp_button_up',website:'https://thevoicefrominside.dev',proposedSize:design.size,units:null,artworkTreatment:'repeat_original_file_without_stretching_or_redrawing',printArea:null,design:{...proposal.design,layout:'all-over-repeat',prints:proposal.design.prints.map(p=>({artworkId:p.artworkId,side:'all_over'}))},identity:{domain:PRINT_DOMAIN,domainPlacement:'upper_front_above_main_artwork',signature:proposal.identity?.backSignature||'licensed_artist_alias',signaturePlacement:'front_bottom_hem',branding:design.branding},notes:'Separate camp/cuban collar shirt proposal. Original motif repeats across cut-and-sew panels; edge and seam cropping must be checked in the supplier template. Proposed size is not a verified vendor size. No supplier, production dimensions, price, licence, order or payment is confirmed.'};
}
export function mountGarmentLookbook({mount,getArtworks,getDesign,language='no',onSelect}){
 const t=(no,en)=>language==='en'?en:no;
 const wrap=node('section','garment-lookbook'),heading=node('h2','',t('Lang oversized. Hele uttrykket.','Long oversized. The whole expression.'));
 const intro=node('p','',t('Bredt, langt snitt. Stort originalmotiv på ryggen, originalsymbol ved nakken over, originalsignatur under og nettadresse langs nedre kant. Identitetsfiler og produsentmal avklares. Se originalfilen ved siden av den flate plasseringsskissen.','A wide, long cut. Large original back artwork, the original symbol at the nape above it, original signature below and website along the lower edge. Identity files and supplier template are pending. Compare the original file with the flat placement sketch.'));
 const referenceLocale=new URL(location.href).searchParams.get('lang')==='zh-Hans'?'zh':language;
 const referenceText=(no,en,zh)=>referenceLocale==='zh'?zh:referenceLocale==='en'?en:no;
 const filmReferences=node('section','garment-film-references');
 const referenceHeading=node('h3','',referenceText('Modellene fra filmreisen','Models from the film journey','电影旅程中的模特'));
 const referenceNote=node('p','small-note',referenceText('Bevart filmreferanse fra tidligere plaggutkast. Motivplasseringen er ikke oppdatert til siste produktkrav. Filmene endres ikke med motivvalget og er ikke produktgodkjenning eller produsentens korrektur.','Preserved film reference from an earlier garment draft. Placement has not been updated to the latest product requirements. The films do not change with your selection and are not product approval or a manufacturer’s proof.','保留的旧版服装影片参考。图案位置尚未更新到最新产品要求。影片不会随选择变化，不代表产品批准或制造商打样。'));
 const filmGrid=node('div','garment-film-grid'),referencePlayers=[],referenceLife=new AbortController();let referenceDisposed=false,referenceObserver=null;filmReferences.append(referenceHeading,referenceNote,filmGrid);
 const pauseReferences=()=>referencePlayers.forEach(player=>player.pause());
 const destroyReferences=()=>{if(referenceDisposed)return;referenceDisposed=true;referenceObserver?.disconnect();referenceLife.abort();pauseReferences();for(const player of referencePlayers){player.removeAttribute('src');player.load();}};
 for(const [scene,video,poster,no,en,zh] of [
  ['paris','/assets/journey/finished/paris-los-angeles-07776c4d6bcc4ea3.mp4','/assets/journey/ui-20261112/paris-one-man-v2-1280-g12.webp','Paris-mannen','The Paris man','巴黎男模特'],
  ['bergen','/assets/journey/finished/bergen-runway-3d886faf51376fb0.mp4','/assets/journey/ui-20261112/bergen-woman-v2-1280-g12.webp','Bergen-kvinnen','The Bergen woman','卑尔根女模特']]){
  const figure=node('figure'),player=node('video'),caption=node('figcaption','',referenceText(no,en,zh));player.controls=true;player.preload='none';player.playsInline=true;player.poster=poster;player.width=1280;player.height=720;player.src=video;player.dataset.filmModel=scene;referencePlayers.push(player);player.addEventListener('play',()=>{for(const peer of referencePlayers)if(peer!==player)peer.pause();},{signal:referenceLife.signal});player.setAttribute('aria-label',referenceText(no+' · filmreferanse',en+' · film reference',zh+' · 影片参考'));
  const fallback=node('a','',referenceText('Åpne filmen','Open the film','打开影片'));fallback.href=video;player.append(fallback);figure.append(player,caption);filmGrid.append(figure);
 }
 const stillGallery=node('section','garment-film-references');
 stillGallery.append(node('h3','',referenceText('To byer, to ryggtrykk','Two cities, two back prints','两座城市，两款背面印花')));
 const stillGrid=node('div','garment-film-grid');
 for(const [file,title] of [
  ['paris-pappa',referenceText('Paris · Pappa … pappa','Paris · Dad … dad','巴黎 · 爸爸……爸爸')],
  ['bergen-lar',referenceText('Bergen · LAR bak murene','Bergen · LAR behind the walls','卑尔根 · 高墙内的 LAR')]
 ]){
  const figure=node('figure'),link=node('a'),img=node('img');
  link.href='/assets/garments/'+file+'.webp';link.target='_blank';link.rel='noopener';
  img.src=link.href;img.width=1280;img.height=720;img.style.cssText='display:block;width:100%;height:auto';
  img.loading='lazy';img.alt=title+' · Innsatt 260146';
  link.append(img);figure.append(link,node('figcaption','',title));stillGrid.append(figure);
 }
 stillGallery.append(stillGrid,node('p','small-note',referenceText('Digital plaggstudie · originalmotivet lagt på en filmrute. Trykk og passform må prøves på stoff.','Digital garment study · original artwork composited onto a film still. Print and fit require a fabric sample.','数字服装研究 · 原作合成于影片画面。印花与版型仍需实物打样。')));
 const select=node('select');select.setAttribute('aria-label',t('Velg kunstverk til plagget','Choose artwork for the garment'));const field=node('label','field',t('Kunstverk og kunstner','Artwork and artist'));field.append(select);
 const board=node('div','garment-board'),byline=node('p','garment-byline'),status=node('p','message');status.setAttribute('role','status');
 const download=node('button','secondary',t('Last ned T-skjorte · begge sider','Download T-shirt · both sides'));download.type='button';
 const study=node('details','camp-study'),summary=node('summary','',t('Alternativ: all-over camp-skjorte','Alternative: all-over camp shirt')),studyContent=node('div','camp-study-content'),studyImage=node('div'),studyText=node('div');
 studyText.append(node('h3','',t('Kortermet skjorte med åpen krage','Short-sleeve shirt with an open collar')),node('p','',t('Et eget plaggforslag med originalmotivet gjentatt over bol og ermer. Flat mønsterstudie; stoff, sømmer, krage og trykk må tilpasses leverandørens skjæremal.','A separate garment proposal with the original artwork repeated across body and sleeves. Flat pattern study; fabric, seams, collar and printing require the supplier’s cutting template.')));
 const campDownload=node('button','secondary',t('Last ned camp-skjorteforespørsel · JSON','Download camp shirt inquiry · JSON'));campDownload.type='button';studyText.append(campDownload,node('p','small-note',t('Camp-skjorten legges i en egen forespørselsfil. Produktlisten nedenfor gjelder T-skjorte, tapet og sjablong.','The camp shirt uses its own inquiry file. The product list below covers T-shirts, wallpaper and stencils.')));studyContent.append(studyImage,studyText);study.append(summary,studyContent);
 wrap.append(heading,intro,stillGallery,filmReferences,field,byline,board,node('p','small-note',t('Flat plasseringsskisse · foreslått ryggflate 30 × 40 cm. Passform, største trykkflate, farger og materiale krever produsentens korrektur og fysisk prøve.','Flat placement sketch · proposed back area 30 × 40 cm. Fit, maximum printing area, colours and material require the supplier’s proof and a physical sample.')),download,study,status);mount.replaceChildren(wrap);
 referenceObserver=new MutationObserver(()=>{if(!wrap.isConnected)destroyReferences();else if(wrap.hidden)pauseReferences();});referenceObserver.observe(document.body,{childList:true,subtree:true});referenceObserver.observe(wrap,{attributes:true,attributeFilter:['hidden']});document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseReferences();},{signal:referenceLife.signal});window.addEventListener('pagehide',pauseReferences,{signal:referenceLife.signal});
 const save=(content,type,name)=>{const url=URL.createObjectURL(new Blob([content],{type})),a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);};
 function refresh(){
  const artworks=getArtworks(),design=getDesign(),a=artworks.find(a=>a.id===design.prints[0]?.artworkId);select.replaceChildren();
  for(const artwork of artworks){const option=node('option','',printTitle(artwork,language)+' · '+printArtist(artwork));option.value=artwork.id;select.append(option);}select.value=a?.id||'';byline.textContent=printTitle(a,language)+' · '+printArtist(a);board.replaceChildren();
  for(const side of ['back','front']){const figure=node('figure');figure.append(createShirtSvg({design,artworks,side,language}),node('figcaption','',side==='back'?t('RYGG · symbol / kunst / signatur / nettadresse','BACK · symbol / artwork / signature / website'):t('FORSIDE · uten knyttneve','FRONT · no fist')));board.append(figure);}
  const original=node('figure','garment-original'),source=safePrintImage(a?.image);if(source){const link=node('a'),image=node('img');link.href=source;link.target='_blank';link.rel='noopener';image.src=source;image.alt=printTitle(a,language);image.loading='lazy';link.append(image);original.append(link);}original.append(node('figcaption','',t('ORIGINALFIL · hele motivet','ORIGINAL FILE · complete artwork')));board.append(original);studyImage.replaceChildren(createCampShirtSvg({design,artworks,language}));
 }
 select.addEventListener('change',()=>{onSelect(select.value);refresh();});download.addEventListener('click',async()=>{if(download.disabled)return;download.disabled=true;try{const blob=await shirtPreviewPng({design:getDesign(),artworks:getArtworks(),language});save(blob,'image/png','thevoice-oversized-tshirt.png');status.textContent=t('T-skjortevisningen er lastet ned.','T-shirt preview downloaded.');}catch{status.textContent=t('Kunne ikke hente originalbildet. Prøv igjen.','Could not load the original image. Try again.');}finally{download.disabled=false;}});
 campDownload.addEventListener('click',()=>{save(JSON.stringify(campShirtInquiry(getDesign(),getArtworks()),null,2),'application/json','thevoice-camp-shirt-inquiry.json');status.textContent=t('Egen camp-skjorteforespørsel lastet ned.','Separate camp shirt inquiry downloaded.');});refresh();return {element:wrap,refresh,destroy:destroyReferences};
}
