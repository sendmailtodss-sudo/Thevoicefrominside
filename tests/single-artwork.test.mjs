import test from 'node:test';
import assert from 'node:assert/strict';
import {singleArtworkDesign,normalizeDesign,designerPrice,designExport,presetDesign} from '../public/merch-designer-core.mjs';
import {normalizeMerchDesign,priceMerchDesign,configuredDesigner,MerchDesignError} from '../worker/merch-design.js';

const configuration=()=>({enabled:true,productionMinorBySku:{'shirt-white-XXL':20000},productionMinorByBrandingPlacement:{inside_label:{'shirt-white-XXL':21000}},printMinorPerPlacement:5000,statementFrontMinor:2000,feeMinorPerUnit:100,shippingMinor:0,allowedColors:['white'],allowedLayouts:['custom'],artworks:{redhood:{artistId:'synthetic_artist',artistName:'Synthetic Artist',feeMinor:10000,feeBasis:'per_motif_per_garment',licenseId:'synthetic_license',licenseVersion:'1',licenseActive:true}}});
const identityUnverified=error=>error instanceof MerchDesignError&&error.code==='identity_production_unverified';

test('new edition exports a back identity proposal without invented originals or production approval',()=>{
 for(const brandingPlacement of ['front_hem','inside_label']){
  const d=singleArtworkDesign('redhood',{brandingPlacement});
  assert.equal(d.version,2);assert.equal(d.prints.length,1);assert.equal(d.prints[0].side,'back');assert.equal(d.prints[0].widthCm,30);assert.deepEqual(normalizeMerchDesign(d),d);
  const exported=designExport(d,[{id:'redhood',artistName:'Synthetic Artist'}]);
  assert.equal(exported.status,'DESIGN_PROPOSAL_NOT_ORDER');assert.equal(exported.productionReadiness.productionReady,false);assert.equal(exported.productionReadiness.supplierTemplate,null);
  assert.equal(exported.identity.frontText,null);assert.equal(exported.identity.frontSymbol,null);assert.equal(exported.identity.frontUrl,null);
  assert.equal(exported.identity.backSymbol,'original_diamond_medallion_with_gold_star');assert.equal(exported.identity.backSymbolPlacement,'nape_above_artwork');assert.equal(exported.identity.backSymbolSource,null);
  assert.equal(exported.identity.backSignaturePlacement,'below_artwork');assert.equal(exported.identity.backSignatureSource,null);assert.equal(Object.hasOwn(exported.identity,'backSignature'),false);
  assert.equal(exported.identity.backUrl,'THEVOICEFROMINSIDE.DEV');assert.equal(exported.identity.backUrlPlacement,'lower_edge_subject_to_supplier_template');
  assert.equal(exported.identity.originalIdentityAssetsVerified,false);assert.equal(exported.identity.physicalPrintAreas,null);assert.deepEqual(exported.design.branding,d.branding);
 }
});

test('new edition cannot contain several artworks, front artwork or client identity fields',()=>{
 const d=singleArtworkDesign('redhood');
 for(const bad of [{...d,prints:[...d.prints,{...d.prints[0],side:'front'}]},{...d,prints:[{...d.prints[0],side:'front'}]},{...d,identity:{originalIdentityAssetsVerified:true}}]){assert.throws(()=>normalizeDesign(bad));assert.throws(()=>normalizeMerchDesign(bad));}
});

test('unknown identity costs remain unknown and a legacy front price cannot fill them',()=>{
 for(const brandingPlacement of ['front_hem','inside_label']){
  const d=singleArtworkDesign('redhood',{brandingPlacement}),c=configuration();
  for(const statementFrontMinor of [undefined,0,2000]){
   const quote=designerPrice(d,{...c,statementFrontMinor});
   assert.equal(quote.complete,false);assert.equal(quote.totalMinor,null);assert.equal(quote.lines.find(line=>line.kind==='identity_prints').amountMinor,null);
   assert.throws(()=>priceMerchDesign(d,'shirt-white-XXL',{...c,statementFrontMinor}),identityUnverified);
  }
 }
});

test('v2 server production stays closed even with claimed verified files, template and zero or known identity cost',()=>{
 for(const brandingPlacement of ['front_hem','inside_label'])for(const identityPrintsMinor of [0,2000]){
  const d=singleArtworkDesign('redhood',{brandingPlacement}),c={...configuration(),identityPrintsMinor,originalIdentityAssetsVerified:true,productionReady:true,supplierTemplate:'unverified-client-claim'};
  assert.throws(()=>priceMerchDesign(d,'shirt-white-XXL',c),identityUnverified);
 }
});

test('legacy v1 keeps separate exterior and inside-label costs without adding the obsolete front price',()=>{
 const c=configuredDesigner(configuration());
 for(const [brandingPlacement,productionMinor,totalMinor] of [['front_hem',20000,35100],['inside_label',21000,36100]]){
  const d=presetDesign('custom','redhood',{size:'XXL',brandingPlacement}),quote=priceMerchDesign(d,'shirt-white-XXL',c);
  assert.equal(d.version,1);assert.equal(quote.priceBreakdown.productionMinor,productionMinor);assert.equal(quote.priceBreakdown.printingMinor,5000);assert.equal(quote.unitPriceMinor,totalMinor);
  assert.equal(Object.hasOwn(quote.priceBreakdown,'identity'),false);assert.equal(Object.hasOwn(quote.priceBreakdown,'statementFrontMinor'),false);
  assert.equal(quote.priceBreakdown.artworkFees[0].licenseId,'synthetic_license');assert.deepEqual(quote.design.branding,d.branding);
 }
 const inside=presetDesign('custom','redhood',{size:'XXL',brandingPlacement:'inside_label'});
 assert.throws(()=>priceMerchDesign(inside,'shirt-white-XXL',{...c,productionMinorByBrandingPlacement:undefined}),error=>error.code==='unavailable_design');
 const zero={...c,productionMinorByBrandingPlacement:{inside_label:{'shirt-white-XXL':0}}};assert.equal(priceMerchDesign(inside,'shirt-white-XXL',zero).unitPriceMinor,15100);
 assert.throws(()=>priceMerchDesign(inside,'shirt-white-XXL',{...c,artworks:{redhood:{...c.artworks.redhood,licenseActive:false}}}),error=>error.code==='unavailable_artwork_license');
});
