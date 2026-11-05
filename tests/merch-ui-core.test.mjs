import {test} from 'node:test';
import assert from 'node:assert/strict';
import {money,specification,addItem,validateCart,inquiry,inquiryText,safeHostedCheckout,presetDesign} from '../public/merch-shop-core.mjs';
const shirt={product:'shirt',artworkId:'redhood',size:'XXL',quantity:1};
test('Product inquiry records front/back and artist while not placing an order',()=>{const output=inquiry([shirt]);assert.match(output.status,/IKKE EN BESTILLING/);assert.match(output.items[0].specification,/Innsatt 260146 bare på forfatterens eget verk/);assert.match(output.conditions,/Ingen produksjon eller betaling/);assert.equal(output.items[0].size,'XXL');assert.ok(!('price' in output.items[0]));});
test('Stencil retains width and height in that order and requires manufacturing adaptation',()=>{const data=inquiry([{product:'stencil',artworkId:'redhood',widthCm:150,heightCm:200,quantity:2}]);assert.match(inquiryText(data),/150 × 200 cm/);assert.match(inquiryText(data),/ikke veggklistremerke/);assert.match(inquiryText(data),/broer/);});
test('Invalid quantity, product, dimensions, name and size rejected',()=>{for(const qty of [0,21,1.2,NaN,Infinity])assert.throws(()=>specification({...shirt,quantity:qty}));for(const extra of [{product:'unknown'},{artworkId:'<script>'},{size:'9999'}])assert.throws(()=>specification({...shirt,...extra}));assert.throws(()=>specification({product:'wallpaper',artworkId:'redhood',quantity:1,widthCm:0,heightCm:200}));});
test('Cart merges exact same variants but keeps sizes and dimensions distinct',()=>{let c=addItem([],shirt);c=addItem(c,shirt);assert.equal(c[0].quantity,2);c=addItem(c,{...shirt,size:'L'});assert.equal(c.length,2);assert.throws(()=>addItem(c,{...shirt,quantity:20}));assert.equal(c[0].quantity,2);});
test('Bad restored cart cannot smuggle fields or duplicate rows',()=>{const clean=validateCart([{...shirt,unitPriceMinor:1,seller:'fake'}]);assert.ok(!('unitPriceMinor' in clean[0]));assert.throws(()=>validateCart([shirt,shirt]));assert.throws(()=>validateCart({}));});
test('English inquiry is translated and monetary totals use exact integers',()=>{const text=inquiryText(inquiry([shirt],'en'));assert.match(text,/NOT AN ORDER/);assert.match(text,/White quality fabric/);assert.ok(money(12345,'en').includes('123.45'));for(const n of [-1,0.1,Infinity])assert.throws(()=>money(n));});
test('Payment redirect strictly accepts Stripe hosted HTTPS',()=>{assert.equal(safeHostedCheckout('https://checkout.stripe.com/c/pay/cs_test_abc'),'https://checkout.stripe.com/c/pay/cs_test_abc');for(const url of ['javascript:alert(1)','https://checkout.stripe.com.evil.test','https://checkout.stripe.com@evil.test','https://user:pass@checkout.stripe.com/c/pay/a','http://checkout.stripe.com','https://checkout.stripe.com:8443'])assert.equal(safeHostedCheckout(url),null);});


test('Inside-label-only designs retain their production instruction and do not merge with visible-brand variants',()=>{
 const visible=presetDesign('custom','redhood',{size:'XXL'});
 const inside={...visible,branding:{...visible.branding,placement:'inside_label'}};
 const item={...shirt,design:inside};
 let cart=addItem([],item);cart=addItem(cart,{...shirt,design:visible});cart=addItem(cart,item);
 assert.equal(cart.length,2);assert.equal(cart[0].quantity,2);
 assert.equal(validateCart(cart)[0].design.branding.placement,'inside_label');
 for(const language of ['no','en']){
  const output=inquiry(cart,language),spec=output.items[0].specification;
  assert.equal(output.items[0].designSpecification.design.branding.placement,'inside_label');
  assert.match(spec,language==='en'?/inside label/i:/innvendig merkelapp/i);
  assert.match(spec,language==='en'?/(?:no|without) (?:external|exterior|outside)/i:/(?:ingen|uten) (?:utvendig|synlig)/i);
  assert.equal(output.items[1].designSpecification.design.branding.placement,'front_hem');
 }
});
