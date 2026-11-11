/* Explicit local opt-in runner. The ordinary developer server remains read-only/closed. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {handleForumRequest} from '../server/forum-api.mjs';

const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
if(!args.includes('--run-private-synthetic')||!args.includes('--credentials')||!args.includes('--project-ref')){
 console.error('Usage: node --use-env-proxy scripts/serve-private-forum.mjs --run-private-synthetic --credentials /private/provider.env --project-ref EXPECTED_REF [--public /checkout/public] [--port 8321]');process.exit(2);
}
const projectRef=arg('--project-ref');if(!/^[a-z0-9]{20}$/.test(projectRef||''))throw Error('invalid_expected_project');
const credentials=path.resolve(arg('--credentials'));
if(fs.statSync(credentials).mode&0o077)throw Error('credentials_file_must_be_private');
const values={};for(const line of fs.readFileSync(credentials,'utf8').split('\n')){if(line&&!line.startsWith('#')&&line.includes('=')){const i=line.indexOf('=');values[line.slice(0,i)]=JSON.parse(line.slice(i+1));}}
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const publicRoot=fs.realpathSync(args.includes('--public')?path.resolve(arg('--public')):path.join(root,'public'));
const port=args.includes('--port')?Number(arg('--port')):8321;
if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error('invalid_local_port');
const origin=`http://127.0.0.1:${port}`;
const env={FORUM_PRIVATE_MODE:'synthetic',VERCEL_ENV:'development',FORUM_ALLOW_INSECURE_LOCAL:'1',FORUM_ALLOWED_ORIGINS:origin,FORUM_EXPECTED_PROJECT_REF:projectRef,FORUM_SUPABASE_URL:values.SFI_EU_SUPABASE_URL,FORUM_SUPABASE_ANON_KEY:values.SFI_EU_SUPABASE_ANON_KEY,FORUM_SUPABASE_SERVICE_ROLE_KEY:values.SFI_EU_SUPABASE_SERVICE_ROLE_KEY};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.mp4':'video/mp4'};
const deny=(res,status,code)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:false,error:{code,message:code}}));};
const server=http.createServer(async(req,res)=>{
 try{
  const u=new URL(req.url,origin);
  if(u.pathname.startsWith('/api/forum/')){
   const init={method:req.method,headers:req.headers};if(!['GET','HEAD'].includes(req.method)){init.body=req;init.duplex='half';}
   const response=await handleForumRequest(new Request(u,init),{env});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(u.pathname.startsWith('/api/'))return deny(res,503,'development-disabled');
  if(!['GET','HEAD'].includes(req.method))return deny(res,405,'method_not_allowed');
  let name;try{name=decodeURIComponent(u.pathname);}catch{return deny(res,400,'invalid_path');}
  if(name.includes('\0')||name.split('/').some(s=>s.startsWith('.')))return deny(res,404,'not_found');
  let target=path.resolve(publicRoot,'.'+name);if(target!==publicRoot&&!target.startsWith(publicRoot+path.sep))return deny(res,404,'not_found');
  try{if(fs.statSync(target).isDirectory())target=path.join(target,'index.html');target=fs.realpathSync(target);}catch{return deny(res,404,'not_found');}
  if(!target.startsWith(publicRoot+path.sep)||!fs.statSync(target).isFile())return deny(res,404,'not_found');
  res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; connect-src 'self'; frame-ancestors 'none'"});
  if(req.method==='HEAD')res.end();else fs.createReadStream(target).on('error',()=>res.destroy()).pipe(res);
 }catch{return deny(res,503,'private_pilot_unavailable');}
});
server.listen(port,'127.0.0.1',()=>console.log(JSON.stringify({privateSyntheticServer:origin,publicRegistration:false,production:false})));
