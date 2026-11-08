import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTask, arkRequest, MODEL} from '../scripts/seedance.mjs';

test('prepare payload without credentials', () => {
 const req = buildTask('A person walks into a corridor');
 assert.equal(req.model, MODEL);
 assert.equal(req.content[0].text, 'A person walks into a corridor');
 assert.equal(req.duration,5);
});
test('rejects empty prompts and invalid duration', () => {
 assert.throws(() => buildTask(' '));
 assert.throws(() => buildTask('hello',{duration:90}));
});
test('draft needs 480p', () => {
 assert.throws(() => buildTask('hello',{draft:true}));
 assert.equal(buildTask('hello',{draft:true,resolution:'480p'}).draft,true);
});
test('API authentication uses bearer token and correct origin', async () => {
 const result = await arkRequest('/api/v3/contents/generations/tasks/mock123',{key:'test-token',fetchFn:async (url,options)=>{
  assert.match(url,/^https:\/\/ark\.ap-southeast\.bytepluses\.com/);
  assert.equal(options.headers.Authorization,'Bearer test-token');
  return {ok:true,status:200,text:async()=>JSON.stringify({status:'succeeded'})};
 }});
 assert.equal(result.status,'succeeded');
});
