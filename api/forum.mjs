import {handleForumRequest} from '../server/forum-api.mjs';

export function forumWebRequest(req) {
  const headers=new Headers();
  for(const [key,value] of Object.entries(req.headers||{})) if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):String(value));
  const init={method:req.method,headers};
  if(!['GET','HEAD'].includes(req.method)){
    // Vercel may already have parsed and consumed the Node request stream.
    // Preserve strings/bytes; serialize parsed JSON exactly once. readBody still
    // checks both declared Content-Length and actual serialized byte length.
    if(req.body!==undefined)init.body=typeof req.body==='string'||req.body instanceof Uint8Array?req.body:JSON.stringify(req.body);
    else {init.body=req;init.duplex='half';}
  }
  return new Request(new URL(req.url,'https://private-forum.invalid'),init);
}
export default async function handler(req,res) {
  const response=await handleForumRequest(forumWebRequest(req));
  res.statusCode=response.status;
  for(const [key,value] of response.headers)res.setHeader(key,value);
  res.end(Buffer.from(await response.arrayBuffer()));
}
