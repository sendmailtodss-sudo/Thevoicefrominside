import {handleCommunity} from './community.js';

const escape = value => String(value).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ORIGIN='https://stemmen-fra-innsiden.sendmailtodss.chatgpt.site';

/** Social crawlers receive the contribution's actual title, credit and artwork. */
export async function communityPage(request,env) {
  const url=new URL(request.url);
  const match=/^\/(en\/)?bidrag\/([0-9a-f-]{36})\/?$/.exec(url.pathname);
  if(!match)return null;
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  const en=!!match[1],id=match[2],hub=en?'/en/bidrag/':'/bidrag/';
  const result=await handleCommunity(new Request(url.origin+'/api/community/contributions/'+id,{headers:request.headers}),env);
  const payload=await result.json();
  if(!result.ok)return new Response(request.method==='HEAD'?null:(en?'Contribution unavailable.':'Bidraget er ikke tilgjengelig.'),{status:result.status,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  const item=payload.item;
  const shell=await env.ASSETS.fetch(new Request(url.origin+hub,{method:'GET'}));
  if(!shell.ok)return shell;
  let body=await shell.text();
  body=body.replace(/<section class="share".*?<\/section>/s,'');
  const title=item.title+' · '+item.creator.displayName;
  const description=(item.description|| (en?'Inspired by Stemmen fra innsiden.':'Inspirert av Stemmen fra innsiden.')).slice(0,280);
  const canonical=ORIGIN+hub+id+'/';
  const artwork=item.kind==='art'?ORIGIN+item.mediaUrl:ORIGIN+'/og-cover.png';
  body=body.replace(/<title>.*?<\/title>/s,()=>'<title>'+escape(title)+' | Stemmen fra innsiden</title>');
  body=body.replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g,(_,p)=>p+escape(description));
  for(const [property,value] of [['og:title',title],['og:url',canonical],['og:image',artwork]])body=body.replace(new RegExp('(<meta property="'+property+'" content=")[^"]*','g'),(_,p)=>p+escape(value));
  body=body.replace(/(<link rel="canonical" href=")[^"]*/g,(_,p)=>p+escape(canonical));
  body=body.replace(/<link rel="alternate"[^>]*>/g,'');
  const alternate=`<link rel="alternate" hreflang="nb" href="${ORIGIN}/bidrag/${id}/"><link rel="alternate" hreflang="en" href="${ORIGIN}/en/bidrag/${id}/">`;
  body=body.replace('</head>',()=>alternate+`<meta property="og:image:alt" content="${escape(item.altText||title)}">`+(item.status!=='published'?'<meta name="robots" content="noindex,nofollow">':'')+'</head>');
  const preview=`<noscript><section class="community-detail"><h2>${escape(title)}</h2><p>${escape(description)}</p>${item.kind==='art'?`<img src="${escape(item.mediaUrl)}" alt="${escape(item.altText)}" style="max-width:100%">`:`<audio controls preload="none" src="${escape(item.mediaUrl)}"></audio>`}<p>${en?'Enable JavaScript to like, share and see the full contribution.':'Slå på JavaScript for å like, dele og se hele bidraget.'}</p></section></noscript>`;
  if(en)body=body.replace('href="/bidrag/">View in Norwegian',`href="/bidrag/${id}/">View in Norwegian`);
  body=body.replace('<div id="community-root"',()=>preview+'<div id="community-root"');
  return new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
}
