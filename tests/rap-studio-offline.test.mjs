import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const code=await fs.readFile(new URL('../public/verksted/rapstudio/sw.js',import.meta.url),'utf8');
function worker(){const handlers={},handled=[],cached=new Map(),removed=[],current=/const CACHE='([^']+)'/.exec(code)[1];const context={URL,Request,Response,Set,Error,self:{location:{href:'https://example.invalid/verksted/rapstudio/sw.js'},addEventListener:(type,fn)=>handlers[type]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>({put:async(url,response)=>cached.set(url,response),match:async url=>cached.get(url)}),keys:async()=>['rapstudio-shell-old','private-portal-v1',current],delete:async name=>removed.push(name)},fetch:async request=>{const url=typeof request==='string'?request:request.url;handled.push(url);const html=url.endsWith('/')||url.endsWith('.html');const response=new Response(html?'<main id="app"></main>':'test',{headers:{'content-type':html?'text/html':url.endsWith('.mjs')?'text/javascript':'application/octet-stream'}});Object.defineProperty(response,'url',{value:url});return response;}};vm.runInNewContext(code,context);return {handlers,handled,cached,removed};}
test('A shell content change requires a new cache version, keeping old active releases separate',async()=>{
 const hash=createHash('sha256');for(const name of ['index.html','style.css','app.mjs','core.mjs','storage.mjs','i18n.mjs','manifest.json','icon.svg']){hash.update(name+'\0');hash.update(await fs.readFile(new URL('../public/verksted/rapstudio/'+name,import.meta.url)));hash.update('\0');}
 assert.ok(code.includes(`const CACHE='rapstudio-shell-v1-${hash.digest('hex').slice(0,12)}'`),'Update the explicit shell content hash after an app edit; do not reuse a live cache version.');
});
test('The service worker installs only nine explicit app files and leaves other caches intact',async()=>{
 const w=worker();let ready;w.handlers.install({waitUntil:p=>ready=p});await ready;assert.equal(w.cached.size,9);assert.ok(w.handled.every(u=>u.startsWith('https://example.invalid/verksted/rapstudio/')));
 w.handlers.activate({waitUntil:p=>ready=p});await ready;assert.deepEqual(w.removed,['rapstudio-shell-old']);
});
test('Auth/API/private pages, cross-origin URLs, non-GET and arbitrary query parameters are never intercepted',()=>{
 const w=worker();for(const [url,method] of [['/api/forum/me','GET'],['/signin-with-chatgpt','GET'],['/portal/','GET'],['https://other.invalid/verksted/rapstudio/','GET'],['/verksted/rapstudio/','POST'],['/verksted/rapstudio/?next=/portal','GET'],['/verksted/rapstudio/core.mjs?token=test','GET']]){let intercepted=false;w.handlers.fetch({request:new Request(new URL(url,'https://example.invalid'),{method}),respondWith:()=>intercepted=true});assert.equal(intercepted,false,`${method} ${url}`);}
});
test('A language-specific app launch uses the same explicit cached document offline',async()=>{
 const w=worker();let ready;w.handlers.install({waitUntil:p=>ready=p});await ready;let response;w.handlers.fetch({request:new Request('https://example.invalid/verksted/rapstudio/?lang=zh-Hans'),respondWith:p=>response=p});assert.equal((await response).status,200);assert.equal(w.handled.length,9);
});
