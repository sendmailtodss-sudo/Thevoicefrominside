import test from 'node:test';
import assert from 'node:assert/strict';
import {singleArtworkDesign,designExport} from '../public/merch-designer-core.mjs';
import {campShirtInquiry} from '../public/merch-garment-lookbook.mjs';
import {specification,inquiry} from '../public/merch-shop-core.mjs';
const artwork={id:'test-artist',artistName:'Synthetic Artist',image:'/design-assets/example.png'};
test('garment inquiry carries the current domain, hem placement and actual artist alias without a prisoner number',()=>{
 const design=singleArtworkDesign(artwork.id,{size:'XXXL',brandingPlacement:'inside_label'}),exported=designExport(design,[artwork]);
 assert.equal(exported.identity.frontUrl,'THEVOICEFROMINSIDE.DEV');assert.equal(exported.identity.backUrl,'THEVOICEFROMINSIDE.DEV');assert.equal(exported.identity.backUrlPlacement,'above_artwork');assert.equal(exported.identity.backSignaturePlacement,'bottom_hem');assert.equal(exported.identity.backSignature,'Synthetic Artist');
 const request=inquiry([{product:'shirt',artworkId:artwork.id,size:'XXXL',quantity:1,design}],'en',[artwork]);assert.equal(request.website,'https://thevoicefrominside.dev');assert.equal(request.items[0].designSpecification.identity.backSignature,'Synthetic Artist');assert.match(request.items[0].specification,/THEVOICEFROMINSIDE.DEV/);assert.equal(request.items[0].design.branding.placement,'inside_label');
});
test('camp shirt has a separate inquiry format and no fabricated production dimensions or T-shirt cart product',()=>{
 const design=singleArtworkDesign(artwork.id,{size:'XXXL',brandingPlacement:'front_hem'}),request=campShirtInquiry(design,[artwork]);
 assert.equal(request.status,'DESIGN_PROPOSAL_NOT_ORDER');assert.equal(request.productType,'all_over_short_sleeve_camp_button_up');assert.equal(request.artworks[0].image,artwork.image);assert.equal(request.identity.signature,'Synthetic Artist');assert.equal(request.proposedSize,'XXXL');assert.equal(request.identity.branding.placement,'front_hem');assert.equal(request.printArea,null);assert.equal(request.units,null);assert.equal(request.design.prints[0].side,'all_over');assert.equal(request.design.prints[0].widthCm,undefined);assert.throws(()=>specification({product:request.productType,artworkId:artwork.id,size:'XXXL',quantity:1}));
});
