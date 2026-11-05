export const DESIGN_VERSION=1;
export const COLORS=Object.freeze(['white','black','navy']);
export const LAYOUTS=Object.freeze(['back-chest','front-back','duo','trio','custom']);
export const PRINT_AREA=Object.freeze({widthCm:30,heightCm:40,maxPrints:4});
export const COMMUNITY_MARK=Object.freeze({required:true,text:'Stemmen fra innsiden',placement:'front_hem'});
export const BRANDING_PLACEMENTS=Object.freeze(['front_hem','inside_label']);
const ID=/^[a-z0-9][a-z0-9_-]{0,79}$/;
const allowed=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&Object.keys(obj).every(k=>keys.includes(k));
const exact=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n*100-Math.round(n*100))<1e-7;
const integer=n=>Number.isSafeInteger(n)&&n>=0;
export function normalizeDesign(input){
 if(!allowed(input,['version','color','size','layout','prints','branding'])||![1,2].includes(input.version)||!COLORS.includes(input.color)||!['S','M','L','XL','XXL','XXXL'].includes(input.size)||!LAYOUTS.includes(input.layout)||!Array.isArray(input.prints)||input.prints.length<1||input.prints.length>4)throw Error('design');
 if(input.branding!==undefined&&(!allowed(input.branding,['required','text','placement'])||input.branding.required!==true||input.branding.text!==COMMUNITY_MARK.text||!BRANDING_PLACEMENTS.includes(input.branding.placement)))throw Error('branding');
 if(input.version===2&&(input.color!=='white'||input.layout!=='custom'||input.prints.length!==1||input.prints[0].side!=='back'))throw Error('single_artwork_required');
 const prints=input.prints.map(p=>{
  if(!allowed(p,['artworkId','side','xCm','yCm','widthCm','heightCm'])||typeof p.artworkId!=='string'||!ID.test(p.artworkId)||!['front','back'].includes(p.side)||!['xCm','yCm','widthCm','heightCm'].every(k=>exact(p[k])))throw Error('print');
  if(p.xCm<0||p.yCm<0||p.widthCm<4||p.heightCm<4||p.widthCm>30||p.heightCm>40||p.xCm+p.widthCm>30.000001||p.yCm+p.heightCm>40.000001)throw Error('print_bounds');
  return {artworkId:p.artworkId,side:p.side,xCm:p.xCm,yCm:p.yCm,widthCm:p.widthCm,heightCm:p.heightCm};
 });
 for(let i=0;i<prints.length;i++)for(let j=i+1;j<prints.length;j++){const a=prints[i],b=prints[j];if(a.side===b.side&&a.xCm<b.xCm+b.widthCm&&b.xCm<a.xCm+a.widthCm&&a.yCm<b.yCm+b.heightCm&&b.yCm<a.yCm+a.heightCm)throw Error('print_overlap');}
 return {version:input.version,color:input.color,size:input.size,layout:input.layout,prints,branding:{...COMMUNITY_MARK,placement:input.branding?.placement||COMMUNITY_MARK.placement}};
}
export function presetDesign(layout,artworkId,options={}){
 const p=(side,xCm,yCm,widthCm,heightCm)=>({artworkId,side,xCm,yCm,widthCm,heightCm});
 const presets={
  'back-chest':[p('back',3,4,24,32),p('front',18,3,8,10)],
  'front-back':[p('front',5,5,20,28),p('back',3,4,24,32)],
  duo:[p('back',2,8,12,18),p('back',16,8,12,18)],
  trio:[p('front',18,3,8,10),p('back',2,8,12,18),p('back',16,8,12,18)],
  custom:[p(options.side==='front'?'front':'back',3,4,24,32)]
 };
 return normalizeDesign({version:1,color:options.color||'white',size:options.size||'XXL',layout,prints:presets[layout],branding:{...COMMUNITY_MARK,placement:options.brandingPlacement||COMMUNITY_MARK.placement}});
}
export function replacePrint(design,index,changes){const d=normalizeDesign(design);if(!Number.isInteger(index)||!d.prints[index])throw Error('print');d.layout='custom';d.prints[index]={...d.prints[index],...changes};return normalizeDesign(d);}
export function designSku(design){const d=normalizeDesign(design);return `shirt-${d.color}-${d.size}`;}
export function productionPriceForBranding(design,pricing={}){
 const d=normalizeDesign(design),sku=designSku(d),prices=d.branding.placement==='front_hem'?pricing.productionMinorBySku:pricing.productionMinorByBrandingPlacement?.inside_label;
 return prices&&Object.hasOwn(prices,sku)&&integer(prices[sku])?prices[sku]:null;
}
export function designerPrice(design,pricing={},quantity=1){
 const d=normalizeDesign(design);if(!Number.isInteger(quantity)||quantity<1||quantity>10)throw Error('quantity');
 const price=productionPriceForBranding(d,pricing),print=pricing.printMinorPerPlacement,fee=pricing.feeMinorPerUnit,shipping=pricing.shippingMinor;
 const lines=[{kind:'production',quantity,amountMinor:integer(price)?price*quantity:null},{kind:'printing',quantity:d.prints.length*quantity,amountMinor:integer(print)?print*d.prints.length*quantity:null},{kind:'fees',quantity,amountMinor:integer(fee)?fee*quantity:null}];
 if(d.version===2)lines.push({kind:'statement_front',quantity,amountMinor:integer(pricing.statementFrontMinor)?pricing.statementFrontMinor*quantity:null});
 const counts=new Map();for(const p of d.prints)counts.set(p.artworkId,(counts.get(p.artworkId)||0)+1);
 for(const [id]of counts){const art=pricing.artworks?.[id],basis=art?.feeBasis;lines.push({kind:'artwork',artworkId:id,artistId:art?.artistId||null,artistName:art?.artistName||null,basis:basis||null,quantity,amountMinor:integer(art?.feeMinor)&&basis==='per_motif_per_garment'?art.feeMinor*quantity:null,licensed:art?.licenseActive===true});}
 lines.push({kind:'shipping',quantity:1,amountMinor:integer(shipping)?shipping:null});
 const known=lines.every(x=>integer(x.amountMinor)),total=known?lines.reduce((s,x)=>s+x.amountMinor,0):null;
 return {currency:'NOK',quantity,lines,totalMinor:Number.isSafeInteger(total)?total:null,complete:known&&Number.isSafeInteger(total),licensed:lines.filter(x=>x.kind==='artwork').every(x=>x.licensed),paymentEnabled:pricing.enabled===true};
}
export function designExport(design,artworks=[]){const d=normalizeDesign(design);return {format:'sfi-shirt-design',version:1,status:'DESIGN_PROPOSAL_NOT_ORDER',units:'cm',printArea:{...PRINT_AREA},design:d,artworks:[...new Set(d.prints.map(p=>p.artworkId))].map(id=>{const a=artworks.find(x=>x.id===id);return {id,name:a?.name||null,artistId:a?.artistId||null,artistName:a?.artistName||a?.artist||null,image:a?.image||null};}),identity:d.version===2?{frontText:null,frontSymbol:'black_raised_fist',frontSymbolPlacement:'wearer_left_chest',frontUrlPlacement:'5cm_above_bottom_hem',frontUrl:'stemmen-fra-innsiden.sendmailtodss.chatgpt.site',backSignature:'licensed_artist_alias',artworkPrintCount:1,physicalPrintAreas:3}:null,notes:'Coordinates locate the artwork bounding box within the 30 × 40 cm printable area on each side. Artwork is fitted inside each box without cropping or stretching. Size, files, colours, placement and rights require production proof. Original artwork ownership does not grant reproduction rights.'};}

export function singleArtworkDesign(artworkId,{size='XXL',brandingPlacement='inside_label'}={}){return normalizeDesign({version:2,color:'white',size,layout:'custom',prints:[{artworkId,side:'back',xCm:0,yCm:0,widthCm:30,heightCm:40}],branding:{...COMMUNITY_MARK,placement:brandingPlacement}});}
