/** Anonymous first-party event counters. No IP address, user agent or visitor identifier is persisted. */
export const CHANNELS = Object.freeze(['native','copy','facebook','linkedin','bluesky','threads','x','whatsapp','telegram','email','other']);
export const SOURCES = Object.freeze(['direct','native','copy','facebook','linkedin','bluesky','threads','x','whatsapp','telegram','email','other']);
// Exact public content routes only. Do not replace this with a prefix match:
// private workshop/case pages and withdrawn articles must never be recorded.
const SAME_PATH_PUBLIC_PAGES = [
  '/', '/kapitler/', '/kapittel-9/', '/kapittel-10/', '/innsyn/',
  '/klagehjelp/', '/bidrag/', '/nytt/',
  '/boken/', '/boken/normalitetsprinsippet/',
  '/dagbok/', '/dagbok/trening/', '/dagbok/treningsbeltet/',
  '/dagbok/skoleplassen/', '/dagbok/lar-bak-murene/',
  '/presse/', '/den-trojanske-hesten/', '/galleri-3d/',
];
export const PUBLIC_ANALYTICS_PATHS = Object.freeze([
  ...SAME_PATH_PUBLIC_PAGES.flatMap(path => [path, '/en' + path]),
  '/kunstfellesskap/', '/en/creative-community/',
  '/musikk/', '/en/music/',
]);
const PAGES = new Set(PUBLIC_ANALYTICS_PATHS);
const KINDS = new Set(['pageview','visit','share']);
const MAX_BODY_BYTES = 2048;
const recent = new Map();
const MAX_TRACKED_CLIENTS = 4096;
const encoder = new TextEncoder();

export function validPath(value, kind='pageview') {
  if (typeof value !== 'string') return false;
  // Paths carrying query strings, fragments, text or private document IDs do
  // not match. Keep the established public contribution route unchanged.
  const contributionPath = value.startsWith('/en/') ? value.slice(3) : value;
  return PAGES.has(value) || /^\/bidrag\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\/$/i.test(contributionPath) || (kind === 'share' && (value === '/statistikk/' || value === '/en/statistikk/'));
}

function json(value,status=200,extra={}) {
  return new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra}});
}

function configuredOrigin(request) {
  return new URL(request.url).origin;
}

function sameOrigin(request) {
  const origin = request.headers.get('Origin');
  return origin === configuredOrigin(request) && request.headers.get('Sec-Fetch-Site') !== 'cross-site';
}

async function consumeRateLimit(request, now) {
  // Short-lived in-memory pseudonym only. No raw IP or UA is stored or returned.
  // This is best effort within each Worker isolate, not a global abuse guarantee.
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return true;
  const minute = Math.floor(now / 60_000);
  const digest = await crypto.subtle.digest('SHA-256',encoder.encode(`${minute}:${ip}`));
  const key = Array.from(new Uint8Array(digest).slice(0,12),x=>x.toString(16).padStart(2,'0')).join('');
  const existing = recent.get(key);
  if (existing?.minute === minute) {
    if (existing.count >= 100) return false;
    existing.count++;
  } else {
    if (recent.size >= MAX_TRACKED_CLIENTS) {
      for (const [k,v] of recent) if (v.minute < minute) recent.delete(k);
      if (recent.size >= MAX_TRACKED_CLIENTS) return false;
    }
    recent.set(key,{minute,count:1});
  }
  return true;
}

async function readLimitedJson(request) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > MAX_BODY_BYTES) return {error:'Request is too large.',status:413};
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return {error:'JSON required.',status:415};
  const reader = request.body?.getReader();
  if (!reader) return {error:'JSON body required.',status:400};
  let size=0; const chunks=[];
  while (true) {
    const {value,done}=await reader.read();
    if(done) break;
    size += value.byteLength;
    if(size > MAX_BODY_BYTES) { await reader.cancel(); return {error:'Request is too large.',status:413}; }
    chunks.push(value);
  }
  const bytes=new Uint8Array(size); let offset=0;
  for(const c of chunks) { bytes.set(c,offset); offset+=c.byteLength; }
  try { return {value:JSON.parse(new TextDecoder().decode(bytes))}; }
  catch { return {error:'Invalid JSON.',status:400}; }
}

export async function handleAnalytics(request, env, options={}) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/events' && url.pathname !== '/api/stats') return null;
  const now = options.now ?? Date.now();
  if (!env.DB) return json({error:'Statistics are temporarily unavailable.'},503);
  if (url.pathname === '/api/events') {
    if(request.method !== 'POST') return json({error:'Method not allowed.'},405,{'Allow':'POST'});
    if (!sameOrigin(request)) return json({error:'Same-origin request required.'},403);
    if (!await consumeRateLimit(request,now)) return json({error:'Too many events.'},429,{'Retry-After':'60'});
    const parsed=await readLimitedJson(request);
    if(parsed.error) return json({error:parsed.error},parsed.status);
    const e=parsed.value;
    if(!e || typeof e !== 'object' || Array.isArray(e) || typeof e.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e.id) || !KINDS.has(e.type) || !validPath(e.path,e.type)) return json({error:'Invalid event.'},400);
    if (e.type === 'share' && !CHANNELS.includes(e.channel)) return json({error:'Unknown share channel.'},400);
    const channel = e.type === 'share' ? e.channel : '';
    const source = SOURCES.includes(e.source) ? e.source : 'other';
    const received = new Date(now).toISOString();
    const day = received.slice(0,10);
    try {
      const result = await env.DB.prepare('INSERT OR IGNORE INTO analytics_events (event_id, day, kind, path, channel, source, received_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(e.id,day,e.type,e.path,channel,source,received).run();
      return json({ok:true,duplicate:(result.meta?.changes ?? 1) === 0},202);
    } catch {
      return json({error:'Statistics are temporarily unavailable.'},503);
    }
  }
  if(request.method !== 'GET') return json({error:'Method not allowed.'},405,{'Allow':'GET'});
  // Public aggregate data only. No events or identifiers are exposed.
  const days = url.searchParams.get('days');
  if (days !== null && !['7','30','90','all'].includes(days)) return json({error:'Choose 7, 30, 90 or all days.'},400);
  const cutoff = days && days !== 'all' ? new Date(now - (Number(days)-1)*86_400_000).toISOString().slice(0,10) : '0000-00-00';
  try {
    const [groups,first] = await env.DB.batch([
      env.DB.prepare('SELECT day, kind, channel, source, SUM(count) AS count FROM analytics_daily WHERE day >= ? GROUP BY day, kind, channel, source ORDER BY day DESC').bind(cutoff),
      env.DB.prepare('SELECT MIN(day) AS since FROM analytics_daily')
    ]);
    const totals={pageviews:0,visits:0,shares:0};
    const channels=Object.fromEntries(CHANNELS.map(c=>[c,0]));
    const sources=Object.fromEntries(SOURCES.map(c=>[c,0]));
    const daily={};
    for(const row of groups.results ?? []) {
      const n=Number(row.count)||0;
      daily[row.day] ??= {day:row.day,pageviews:0,visits:0,shares:0};
      const key={pageview:'pageviews',visit:'visits',share:'shares'}[row.kind];
      if(!key) continue;
      totals[key]+=n; daily[row.day][key]+=n;
      if(row.kind==='share' && Object.hasOwn(channels,row.channel)) channels[row.channel]+=n;
      if(row.kind==='visit' && Object.hasOwn(sources,row.source)) sources[row.source]+=n;
    }
    return json({totals,channels,sources,daily:Object.values(daily),since:first.results?.[0]?.since ?? null,period:days ?? 'all',updatedAt:new Date(now).toISOString(),definitions:{visits:'Browser tab sessions; not unique people.',pageviews:'Recorded page openings.',shares:'Share button clicks, copied links and completed native-share actions; publication on a social network is not verified.',sources:'Declared share-link source or referring domain; direct and unrecognised visits may lack attribution.'}});
  } catch {
    return json({error:'Statistics are temporarily unavailable.'},503);
  }
}
