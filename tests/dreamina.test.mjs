import test from 'node:test';
import assert from 'node:assert/strict';
import {command} from '../scripts/dreamina.mjs';
import {mediaType,limit} from '../public/verksted/dreamina/media.mjs';
test('one prompt argument and read-only status query',()=>{
  const id = '00000000-0000-4000-8000-000000000001';
  const config = {DREAMINA_PROJECT_ID:id,DREAMINA_IMAGE_MODEL:'synthetic'};
  assert.ok(command('image','a; $HOME',id,config).includes('--prompt=a; $HOME'));
  assert.deepEqual(command('status',id,null,config),['operation','status',id,'--project-id='+id]);
  assert.throws(()=>command('download','../private',null,config));
  assert.throws(()=>command('image','missing submission id',null,config));
  assert.throws(()=>command('status',id,null,{}));
});
test('reject disguised and oversized media before import',async()=>{
  await assert.rejects(mediaType(new Blob(['<svg/>'],{type:'image/png'})));
  await assert.rejects(mediaType({size:limit+1}));
  assert.equal(await mediaType(new Blob([Uint8Array.from([137,80,78,71,13,10,26,10])])), 'image/png');
});
