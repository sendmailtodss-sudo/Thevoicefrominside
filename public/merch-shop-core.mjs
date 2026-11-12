import {normalizeDesign,designExport} from './merch-designer-core.mjs';
export {normalizeDesign,designExport,designerPrice,presetDesign,replacePrint,designSku,COLORS,LAYOUTS} from './merch-designer-core.mjs';
export const SIZES=Object.freeze(['S','M','L','XL','XXL','XXXL']);
export const DEFAULT_ART=Object.freeze([
 {id:'lar-bak-murene',nameNo:'LAR bak murene',nameEn:'LAR behind the walls',image:'/design-assets/approved-illustrations/lar-bak-murene-80643262351fb9d6e4de954d72707ed2fb72610c7d8a3e6296027439d3b07136.webp'},
 {id:'redhood',nameNo:'Rødhette i gangen',nameEn:'Little Red Riding Hood in the corridor',image:'/design-assets/merch/redhood.jpeg'},
 {id:'gjenbruk',nameNo:'Gjenbruk',nameEn:'Reuse',image:'/design-assets/approved-illustrations/gjenbruk-16872400f1db5e2c943824b4540506faf285e00bbc1e056b30cc09573a1b36e9.png'}
]);
export function money(minor,language='no') {
 if(!Number.isSafeInteger(minor)||minor<0)throw new Error('amount');
 return new Intl.NumberFormat(language==='en'?'en-GB':'nb-NO',{style:'currency',currency:'NOK'}).format(minor/100);
}
export function specification(input) {
 const {product,artworkId,size}=input;
 if(!['shirt','wallpaper','stencil'].includes(product))throw new Error('product');
 if(typeof artworkId!=='string'||!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(artworkId))throw new Error('art');
 const quantity=Number(input.quantity);
 if(!Number.isInteger(quantity)||quantity<1||quantity>10)throw new Error('quantity');
 if(product==='shirt'&&!SIZES.includes(size))throw new Error('size');
 let widthCm=null,heightCm=null;
 if(product!=='shirt'){
  widthCm=Number(input.widthCm);heightCm=Number(input.heightCm);
  if(!Number.isInteger(widthCm)||!Number.isInteger(heightCm)||widthCm<10||heightCm<10||widthCm>1000||heightCm>1000)throw new Error('dimensions');
 }
 const clean={product,artworkId,size:product==='shirt'?size:null,quantity,widthCm,heightCm};
 if(input.design!==undefined){if(product!=='shirt')throw Error('design_product');clean.design=normalizeDesign(input.design);if(clean.design.size!==size||clean.design.prints[0].artworkId!==artworkId)throw Error('design_mismatch');}
 return clean;
}
export function keyOf(item){return [item.product,item.artworkId,item.size||'',item.widthCm||'',item.heightCm||'',item.design?JSON.stringify(normalizeDesign(item.design)):''].join('|');}
export function addItem(cart,input){
 const next=specification(input),copy=cart.map(x=>({...x})),index=copy.findIndex(x=>keyOf(x)===keyOf(next));
 if(index>=0){if(copy[index].quantity+next.quantity>10)throw new Error('quantity');copy[index].quantity+=next.quantity;}
 else {if(copy.length>=10)throw new Error('cart');copy.push(next);}
 if(copy.reduce((n,x)=>n+x.quantity,0)>20)throw new Error('total_quantity');
 return copy;
}
export function validateCart(value){
 if(!Array.isArray(value)||value.length>10)throw new Error('cart');
 const seen=new Set();const items=value.map(raw=>{const item=specification(raw),key=keyOf(item);if(seen.has(key))throw new Error('duplicate');seen.add(key);return item;});if(items.reduce((n,x)=>n+x.quantity,0)>20)throw new Error('total_quantity');return items;
}
export function inquiry(cart,language='no',artworks=DEFAULT_ART){
 const en=language==='en',items=validateCart(cart);if(!items.length)throw new Error('empty');
 const names={shirt:en?'T-shirt':'T-skjorte',wallpaper:en?'Custom wallpaper':'Veggtapet etter mål',stencil:en?'Painting stencil':'Malingssjablong'};
 return {
  status:en?'PRODUCT INQUIRY — NOT AN ORDER':'PRODUKTFORESPØRSEL – IKKE EN BESTILLING',
  project:'Stemmen fra innsiden',website:'https://thevoicefrominside.dev',currency:'NOK',
  items:items.map(item=>({...item,...(item.design?{designSpecification:designExport(item.design,artworks)}:{}),productName:names[item.product],artworkName:artworks.find(x=>x.id===item.artworkId)?.[en?'nameEn':'nameNo']||item.artworkId,
   specification:item.design?(en?'Long oversized T-shirt. One intact full-size back artwork; THEVOICEFROMINSIDE.DEV above the artwork and the licensed artist’s signature at the back bottom hem. A black raised fist over the heart and the same domain near the front hem. Confirm every print location, including whether the hem signature is feasible, and quote all production costs. One artwork fee. '+(item.design.branding.placement==='inside_label'?'Stemmen fra innsiden appears on an inside label only, with no exterior community mark. Confirm the production price for the inside label separately. ':'The small required Stemmen fra innsiden community mark sits at the front hem, outside the artwork. Confirm production pricing for this visible mark. ')+'No prisoner number is added to other artists’ work. Placement is a proposal; confirm licensed motifs, artist-set prices, textile, printing, fees and final proof.':'Lang oversized T-skjorte. Ett helt, stort ryggmotiv; THEVOICEFROMINSIDE.DEV over motivet og den lisensierte kunstnerens signatur helt nede ved ryggsømmen. Svart knyttneve på hjertesiden og samme domene ved frontkanten. Bekreft alle trykkplasseringer, også om signaturen ved sømmen er mulig, og oppgi alle produksjonskostnader. Én motivpris. '+(item.design.branding.placement==='inside_label'?'Stemmen fra innsiden står kun på innvendig merkelapp, uten utvendig fellesskapsmerking. Bekreft produksjonsprisen for innvendig merkelapp separat. ':'Et lite obligatorisk Stemmen fra innsiden-merke står ved nederste frontkant utenfor kunstmotivet. Bekreft produksjonsprisen for dette synlige merket. ')+'Ingen innsattnummer legges på andres verk. Plassering er et forslag; avklar lisensierte motiv, kunstnernes motivpriser, tekstil, trykk, gebyrer og endelig korrektur.'):
    item.product==='shirt'?(en?'White quality fabric, long oversized cut. THEVOICEFROMINSIDE.DEV above the intact large back artwork; artist signature at the bottom hem (Innsatt 260146 only on the author’s own work). A black raised fist over the heart and the website five centimetres above the bottom hem. Request print proof, fabric weight, print method and wash test.':'Hvit kvalitetstekstil, langt oversized snitt. THEVOICEFROMINSIDE.DEV over det hele, store ryggmotivet; kunstnerens signatur helt nede ved sømmen (Innsatt 260146 bare på forfatterens eget verk). Svart knyttneve på hjertesiden og nettadressen fem centimeter over nederkanten. Be om korrektur, gramvekt, trykkmetode og vaskeprøve.'):
    item.product==='wallpaper'?(en?'Custom wallpaper. Confirm wall measurements, material, panel joints, colours, surface preparation and installation.':'Veggtapet etter mål. Bekreft veggmål, materiale, panelskjøter, farger, underlag og montering.'):
    (en?'Painting stencil, not a wall sticker. Confirm cuttable motif, bridges, layers, alignment marks, reusable material and panel format. Use only on authorised surfaces.':'Malingssjablong, ikke veggklistremerke. Bekreft malbart motiv, broer, lag, registreringsmerker, gjenbrukbart materiale og paneldeling. Bruk bare på flater du har tillatelse til å male.')
  })),
  conditions:en?'Please quote total price including applicable VAT, shipping, samples and preparation, plus delivery time. No production or payment is authorised. Artwork rights, print files and final proof must be confirmed.':'Oppgi totalpris med eventuell merverdiavgift, frakt, prøver og klargjøring, samt leveringstid. Ingen produksjon eller betaling er bestilt. Rettigheter, trykkfiler og endelig korrektur må bekreftes.'
 };
}
export function inquiryText(data){
 return [data.status,'',data.project,data.website,'',...data.items.flatMap((x,i)=>[`${i+1}. ${x.productName} · ${x.artworkName}`,`${x.quantity} × ${x.size||`${x.widthCm} × ${x.heightCm} cm`}`,x.specification,...(x.design?[`Design: ${x.design.color}, ${x.design.layout}`,...x.design.prints.map((p,j)=>`  ${j+1}. ${p.artworkId} · ${p.side} · x ${p.xCm}, y ${p.yCm}, ${p.widthCm} × ${p.heightCm} cm`)]:[]),'']),data.conditions].join('\n');
}
export function safeHostedCheckout(value){
 try {const u=new URL(value);return u.protocol==='https:'&&u.hostname==='checkout.stripe.com'&&!u.username&&!u.password&&!u.port?u.href:null;}catch{return null;}
}
