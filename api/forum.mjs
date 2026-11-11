import {handleForumRequest} from '../server/forum-api.mjs';
export default async function handler(req,res) {
  const headers=new Headers();
  for(const [key,value] of Object.entries(req.headers||{})) if(value!==undefined)headers.set(key,Array.isArray(value)?value.join(','):String(value));
  const init={method:req.method,headers};
  if(!['GET','HEAD'].includes(req.method)){init.body=req;init.duplex='half';}
  const response=await handleForumRequest(new Request(new URL(req.url,'https://private-forum.invalid'),init));
  res.statusCode=response.status;
  for(const [key,value] of response.headers)res.setHeader(key,value);
  res.end(Buffer.from(await response.arrayBuffer()));
}
