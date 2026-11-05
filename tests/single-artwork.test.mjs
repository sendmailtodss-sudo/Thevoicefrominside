import test from 'node:test';import assert from 'node:assert/strict';
import {singleArtworkDesign,normalizeDesign,designerPrice,designExport} from '../public/merch-designer-core.mjs';
import {normalizeMerchDesign,priceMerchDesign} from '../worker/merch-design.js';
test('new edition is one large back artwork and fixed identity front',()=>{
 const c={enabled:true,productionMinorBySku:{'shirt-white-XXL':20000},productionMinorByBrandingPlacement:{inside_label:{'shirt-white-XXL':21000}},printMinorPerPlacement:5000,statementFrontMinor:2000,feeMinorPerUnit:100,allowedColors:['white'],allowedLayouts:['custom'],artworks:{redhood:{artistName:'Innsatt 2601-46',feeMinor:10000,feeBasis:'per_motif_per_garment',licenseActive:true}}};
 for(const brandingPlacement of ['front_hem','inside_label']){
  const d=singleArtworkDesign('redhood',{brandingPlacement});
  assert.equal(d.version,2);assert.equal(d.prints.length,1);assert.equal(d.prints[0].side,'back');assert.equal(d.prints[0].widthCm,30);assert.deepEqual(normalizeMerchDesign(d),d);
  const exported=designExport(d),quoted=priceMerchDesign(d,'shirt-white-XXL',c);
  assert.equal(exported.identity.frontText,null);assert.equal(exported.identity.physicalPrintAreas,3);
  assert.deepEqual(quoted.priceBreakdown.identity,{...exported.identity,backSignature:'Innsatt 260146'});
  assert.deepEqual(quoted.design.branding,exported.design.branding);assert.deepEqual(quoted.priceBreakdown.branding,d.branding);
  assert.equal(quoted.priceBreakdown.productionMinor,brandingPlacement==='inside_label'?21000:20000);
 }
 c.artworks.redhood.artistName='Synthetic Artist 2601';
 assert.equal(priceMerchDesign(singleArtworkDesign('redhood',{brandingPlacement:'front_hem'}),'shirt-white-XXL',c).priceBreakdown.identity.backSignature,'Synthetic Artist 2601');
});
test('new edition cannot contain several artworks or an artwork on front',()=>{const d=singleArtworkDesign('redhood');for(const bad of [{...d,prints:[...d.prints,{...d.prints[0],side:'front'}]},{...d,prints:[{...d.prints[0],side:'front'}]}]){assert.throws(()=>normalizeDesign(bad));assert.throws(()=>normalizeMerchDesign(bad));}});
test('front production cost cannot be silently omitted',()=>{const d=singleArtworkDesign('redhood',{brandingPlacement:'front_hem'});const c={enabled:true,productionMinorBySku:{'shirt-white-XXL':20000},printMinorPerPlacement:5000,feeMinorPerUnit:100,shippingMinor:0,allowedColors:['white'],allowedLayouts:['custom'],artworks:{redhood:{feeMinor:10000,feeBasis:'per_motif_per_garment',licenseActive:true}}};assert.equal(designerPrice(d,c).complete,false);assert.throws(()=>priceMerchDesign(d,'shirt-white-XXL',c),/front_price/);c.statementFrontMinor=2000;assert.equal(designerPrice(d,c).totalMinor,37100);assert.equal(priceMerchDesign(d,'shirt-white-XXL',c).unitPriceMinor,37100);});
