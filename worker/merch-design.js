/* Server-owned merchandise licensing and prices. Original-art sales are separate. */
const SIZES=['S','M','L','XL','XXL','XXXL'];
const COLORS=['white','black','navy'];
const LAYOUTS=['back-chest','front-back','duo','trio','custom'];
const ID=/^[a-z0-9][a-z0-9_-]{0,79}$/;
const SKU=/^shirt-(white|black|navy)-(S|M|L|XL|XXL|XXXL)$/;
export const COMMUNITY_MARK=Object.freeze({required:true,text:'Stemmen fra innsiden',placement:'front_hem'});
export const BRANDING_PLACEMENTS=Object.freeze(['front_hem','inside_label']);
const ASSET_IMAGE=/^\/design-assets\/[a-zA-Z0-9_./-]+\.(?:webp|png|jpeg|jpg)$/;
const CREATIVE_IMAGE=/^\/api\/workshop\/creative\/media\/work_[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const safeText=(x,min=1,max=160)=>typeof x==='string'&&x.trim()===x&&x.length>=min&&x.length<=max&&!/[\u0000-\u001f\u007f]/.test(x);
const amount=x=>Number.isSafeInteger(x)&&x>=0&&x<=10000000;
export class MerchDesignError extends Error {constructor(code){super(code);this.code=code;}}
const reject=code=>{throw new MerchDesignError(code);};
function exact(value,keys){if(!isObject(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))reject('invalid_design');}
const cm=x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x*100-Math.round(x*100))<1e-7;

export function normalizeMerchDesign(value){
 exact(value,isObject(value)&&Object.hasOwn(value,'branding')?['version','color','size','layout','prints','branding']:['version','color','size','layout','prints']);
 if(Object.hasOwn(value,'branding')){
  exact(value.branding,['required','text','placement']);
  if(value.branding.required!==COMMUNITY_MARK.required||value.branding.text!==COMMUNITY_MARK.text||!BRANDING_PLACEMENTS.includes(value.branding.placement))reject('invalid_branding');
 }
 if(![1,2].includes(value.version)||!COLORS.includes(value.color)||!SIZES.includes(value.size)||!LAYOUTS.includes(value.layout)||!Array.isArray(value.prints)||value.prints.length<1||value.prints.length>4)reject('invalid_design');
 if(value.version===2&&(value.color!=='white'||value.layout!=='custom'||value.prints.length!==1||value.prints[0].side!=='back'))reject('single_artwork_required');
 const prints=value.prints.map(p=>{
  exact(p,['artworkId','side','xCm','yCm','widthCm','heightCm']);
  if(typeof p.artworkId!=='string'||!ID.test(p.artworkId)||!['front','back'].includes(p.side)||![p.xCm,p.yCm,p.widthCm,p.heightCm].every(cm)||p.xCm<0||p.yCm<0||p.widthCm<4||p.heightCm<4||p.widthCm>30||p.heightCm>40||p.xCm+p.widthCm>30+1e-7||p.yCm+p.heightCm>40+1e-7)reject('invalid_design');
  return {artworkId:p.artworkId,side:p.side,xCm:p.xCm,yCm:p.yCm,widthCm:p.widthCm,heightCm:p.heightCm};
 });
 for(let i=0;i<prints.length;i++)for(let j=i+1;j<prints.length;j++){
  const a=prints[i],b=prints[j];
  if(a.side===b.side&&a.xCm<b.xCm+b.widthCm&&b.xCm<a.xCm+a.widthCm&&a.yCm<b.yCm+b.heightCm&&b.yCm<a.yCm+a.heightCm)reject('overlapping_prints');
 }
 return {version:value.version,color:value.color,size:value.size,layout:value.layout,prints,branding:{...COMMUNITY_MARK,placement:value.branding?.placement||COMMUNITY_MARK.placement}};
}

export function configuredDesigner(raw){
 if(raw===undefined||raw===null)return null;
 if(!isObject(raw)||raw.enabled!==true||!isObject(raw.productionMinorBySku)||!Object.keys(raw.productionMinorBySku).length||!amount(raw.printMinorPerPlacement)||!amount(raw.feeMinorPerUnit)||!Array.isArray(raw.allowedColors)||!raw.allowedColors.length||!Array.isArray(raw.allowedLayouts)||!raw.allowedLayouts.length||!isObject(raw.artworks)||!Object.keys(raw.artworks).length||Object.keys(raw.artworks).length>200)reject('invalid_designer_config');
 const colors=[...new Set(raw.allowedColors)].sort(),layouts=[...new Set(raw.allowedLayouts)].sort();
 if(colors.some(x=>!COLORS.includes(x))||layouts.some(x=>!LAYOUTS.includes(x)))reject('invalid_designer_config');
 const production=Object.fromEntries(Object.entries(raw.productionMinorBySku).sort());
 for(const [sku,price]of Object.entries(production)){const m=SKU.exec(sku);if(!m||!colors.includes(m[1])||!amount(price)||price<100)reject('invalid_designer_config');}
 const placementProduction={};
 if(raw.productionMinorByBrandingPlacement!==undefined){
  const byPlacement=raw.productionMinorByBrandingPlacement;
  if(!isObject(byPlacement)||Object.keys(byPlacement).length!==1||!Object.hasOwn(byPlacement,'inside_label')||!isObject(byPlacement.inside_label)||!Object.keys(byPlacement.inside_label).length)reject('invalid_designer_config');
  const prices=Object.fromEntries(Object.entries(byPlacement.inside_label).sort());
  for(const [sku,price]of Object.entries(prices))if(!Object.hasOwn(production,sku)||!amount(price))reject('invalid_designer_config');
  placementProduction.inside_label=prices;
 }
 if(raw.statementFrontMinor!==undefined&&!amount(raw.statementFrontMinor))reject('invalid_designer_config');
 const works={};
 for(const [id,a]of Object.entries(raw.artworks).sort()){
  if(!ID.test(id)||!isObject(a)||typeof a.artistId!=='string'||!ID.test(a.artistId)||!safeText(a.artistName)||!amount(a.feeMinor)||a.feeBasis!=='per_motif_per_garment'||!safeText(a.licenseId,1,100)||!safeText(a.licenseVersion,1,64)||typeof a.licenseActive!=='boolean')reject('invalid_designer_config');
  if(a.image!==undefined&&(typeof a.image!=='string'||(!ASSET_IMAGE.test(a.image)&&!CREATIVE_IMAGE.test(a.image))||a.image.includes('..')))reject('invalid_designer_config');
  if(a.nameNo!==undefined&&!safeText(a.nameNo,1,200)||a.nameEn!==undefined&&!safeText(a.nameEn,1,200))reject('invalid_designer_config');
  works[id]={artistId:a.artistId,artistName:a.artistName,feeMinor:a.feeMinor,feeBasis:a.feeBasis,licenseId:a.licenseId,licenseVersion:a.licenseVersion,licenseActive:a.licenseActive,...(a.nameNo?{nameNo:a.nameNo}:{}),...(a.nameEn?{nameEn:a.nameEn}:{}),...(a.image?{image:a.image}:{})};
 }
 return {enabled:true,...(raw.statementFrontMinor!==undefined?{statementFrontMinor:raw.statementFrontMinor}:{}),productionMinorBySku:production,...(Object.keys(placementProduction).length?{productionMinorByBrandingPlacement:placementProduction}:{}),printMinorPerPlacement:raw.printMinorPerPlacement,feeMinorPerUnit:raw.feeMinorPerUnit,allowedColors:colors,allowedLayouts:layouts,artworks:works};
}

export function priceMerchDesign(input,sku,configuration){
 const design=normalizeMerchDesign(input),c=configuration;
 const productionPrices=design.branding.placement==='front_hem'?c?.productionMinorBySku:c?.productionMinorByBrandingPlacement?.inside_label;
 if(!c?.enabled||sku!==`shirt-${design.color}-${design.size}`||!productionPrices||!Object.hasOwn(productionPrices,sku)||!c.allowedColors.includes(design.color)||!c.allowedLayouts.includes(design.layout))reject('unavailable_design');
 if(design.version===2&&!amount(c.statementFrontMinor))reject('statement_front_price_unconfirmed');
 const counts=new Map();for(const p of design.prints)counts.set(p.artworkId,(counts.get(p.artworkId)||0)+1);
 const artworkFees=[];
 for(const [artworkId,printCount]of counts){
  const a=c.artworks[artworkId];if(!a||a.licenseActive!==true)reject('unavailable_artwork_license');
  // User policy: charge an artist's selected motif once per garment, even when
  // repeated on both sides. Physical extra prints remain production costs.
  const chargeCount=1;
  artworkFees.push({artworkId,artistId:a.artistId,artistName:a.artistName,artworkName:{no:a.nameNo||artworkId,en:a.nameEn||a.nameNo||artworkId},feeBasis:a.feeBasis,unitRateMinor:a.feeMinor,chargeCount,printCount,amountMinor:a.feeMinor,licenseId:a.licenseId,licenseVersion:a.licenseVersion});
 }
 const productionMinor=productionPrices[sku],printingMinor=c.printMinorPerPlacement*design.prints.length+(design.version===2?c.statementFrontMinor:0),feeMinor=c.feeMinorPerUnit,costMinor=productionMinor+printingMinor+feeMinor,artworkMinor=artworkFees.reduce((n,a)=>n+a.amountMinor,0),totalMinor=costMinor+artworkMinor;
 if(!amount(totalMinor)||totalMinor<100)reject('invalid_design_total');
 // The selected production cost includes either the exterior front-hem mark
 // or the inside-only label. The latter never falls back to an exterior price.
 // Branding is not an artist motif or an extra paid artwork print.
 return {design,unitPriceMinor:totalMinor,priceBreakdown:{...(design.version===2?{statementFrontMinor:c.statementFrontMinor,identity:{frontText:null,frontSymbol:'black_raised_fist',frontSymbolPlacement:'wearer_left_chest',frontUrlPlacement:'5cm_above_bottom_hem',frontUrl:'stemmen-fra-innsiden.sendmailtodss.chatgpt.site',backSignature:artworkFees[0].artistName==='Innsatt 2601-46'?'Innsatt 260146':artworkFees[0].artistName,artworkPrintCount:1,physicalPrintAreas:3}}:{}),productionMinor,printingMinor,feeMinor,costMinor,artworkFees,artworkMinor,totalMinor,currency:'NOK',basis:'per_garment',branding:{...design.branding},brandingCostIncludedInProduction:true,paymentOrder:['production','printing','fees','artists'],artistPayoutAutomatic:false,originalArtworkOwnershipIncluded:false}};
}
