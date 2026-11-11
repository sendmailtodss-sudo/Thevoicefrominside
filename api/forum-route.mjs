import handler from './forum.mjs';

// Paired Vercel rewrite: /api/forum/:_sfi_forum_capture* ->
// /api/forum-route?_forum_route=:_sfi_forum_capture*
// Only these reserved routing keys are removed. User query keys (including
// "path") remain intact for the strict API validator.
export function forumLogicalUrl(req) {
  const incoming=new URL(req.url,'https://private-forum.invalid');
  const route=req.query?._forum_route ?? incoming.searchParams.get('_forum_route') ?? '';
  const capture=req.query?._sfi_forum_capture ?? incoming.searchParams.get('_sfi_forum_capture');
  if(typeof route!=='string'||!/^[-a-zA-Z0-9_/]*$/.test(route)||incoming.searchParams.getAll('_forum_route').length>1||incoming.searchParams.getAll('_sfi_forum_capture').length>1)throw Error('invalid_forum_rewrite');
  if(capture!==undefined&&capture!==null&&(typeof capture!=='string'||capture!==route))throw Error('invalid_forum_rewrite');
  incoming.searchParams.delete('_forum_route');
  incoming.searchParams.delete('_sfi_forum_capture');
  return '/api/forum/'+route.replace(/^\/+|\/+$/g,'')+(incoming.searchParams.size?'?'+incoming.searchParams.toString():'');
}
export default async function forumRoute(req,res){
  try{req.url=forumLogicalUrl(req);}catch{res.statusCode=404;res.setHeader('Cache-Control','private, no-store');res.end();return;}
  return handler(req,res);
}
