/**
 * Verify control of a public social profile, not a person's legal identity.
 * The caller owns challenge generation, expiry, user binding and one-time use.
 * Requests go only to fixed, official, public APIs; no provider token is needed.
 */
const MAX_RESPONSE_BYTES = 128 * 1024;
const TIMEOUT_MS = 8000;
const X_HOSTS = new Set(['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com']);
const TIKTOK_HOSTS = new Set(['tiktok.com', 'www.tiktok.com']);
const BSKY_HOSTS = new Set(['bsky.app', 'www.bsky.app']);

export class SocialVerificationError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'SocialVerificationError';
    this.code = code;
    this.status = status;
  }
}

function invalid(message = 'Use a full HTTPS profile or post URL from X, TikTok or Bluesky.') {
  return new SocialVerificationError('invalid_social_url', message);
}

function parseURL(value) {
  if (typeof value !== 'string' || value.length > 512) throw invalid();
  const input = value.trim();
  if (!input || /[\u0000-\u0020\u007f\\]/.test(input)) throw invalid();
  let url;
  try { url = new URL(input); } catch { throw invalid(); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw invalid();
  return url;
}

function blueskyActor(value) {
  if (/^did:plc:[a-z2-7]{24}$/.test(value)) return value;
  // Handles are DNS names. Do not accept URLs, paths, percent escapes or DID URLs.
  const handle = value.toLowerCase();
  const labels = handle.split('.');
  if (handle.length > 253 || labels.length < 2 || !/^[a-z][a-z0-9-]*$/.test(labels.at(-1))) return null;
  return labels.every(label => label.length <= 63 && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label)) ? handle : null;
}

export function normalizeSocialProfile(value) {
  const url = parseURL(value);
  let match;
  if (X_HOSTS.has(url.hostname) && (match = /^\/([A-Za-z0-9_]{1,15})\/?$/.exec(url.pathname))) {
    const handle = match[1].toLowerCase();
    if (new Set(['home', 'explore', 'notifications', 'messages', 'settings', 'search', 'i', 'intent', 'share']).has(handle)) throw invalid();
    return {provider: 'x', profileUrl: `https://x.com/${handle}`, handle};
  }
  if (TIKTOK_HOSTS.has(url.hostname) && (match = /^\/@([A-Za-z0-9_][A-Za-z0-9_.]{0,23})\/?$/.exec(url.pathname))) {
    const handle = match[1].toLowerCase();
    if (handle.endsWith('.')) throw invalid();
    return {provider: 'tiktok', profileUrl: `https://www.tiktok.com/@${handle}`, handle};
  }
  if (BSKY_HOSTS.has(url.hostname) && (match = /^\/profile\/([^/]+)\/?$/.exec(url.pathname))) {
    const handle = blueskyActor(match[1]);
    if (handle) return {provider: 'bluesky', profileUrl: `https://bsky.app/profile/${handle}`, handle};
  }
  throw invalid();
}

function normalizeProof(value, profile) {
  const url = parseURL(value);
  let match;
  if (profile.provider === 'x' && X_HOSTS.has(url.hostname) && (match = /^\/([A-Za-z0-9_]{1,15})\/status\/([0-9]{5,24})\/?$/.exec(url.pathname))) {
    if (match[1].toLowerCase() !== profile.handle) throw invalid('The post URL must belong to the profile you are verifying.');
    return {url: `https://x.com/${profile.handle}/status/${match[2]}`, id: match[2]};
  }
  if (profile.provider === 'tiktok' && TIKTOK_HOSTS.has(url.hostname) && (match = /^\/@([A-Za-z0-9_][A-Za-z0-9_.]{0,23})\/video\/([0-9]{5,24})\/?$/.exec(url.pathname))) {
    if (match[1].toLowerCase() !== profile.handle) throw invalid('The video URL must belong to the profile you are verifying.');
    return {url: `https://www.tiktok.com/@${profile.handle}/video/${match[2]}`, id: match[2]};
  }
  if (profile.provider === 'bluesky' && BSKY_HOSTS.has(url.hostname) && (match = /^\/profile\/([^/]+)\/post\/([a-zA-Z0-9._~:-]{1,64})\/?$/.exec(url.pathname))) {
    const actor = blueskyActor(match[1]);
    if (!actor || actor !== profile.handle || ['.', '..'].includes(match[2])) throw invalid('The post URL must belong to the profile you are verifying.');
    return {url: `https://bsky.app/profile/${actor}/post/${match[2]}`, id: match[2]};
  }
  throw invalid('Use the direct public post URL from the same account. TikTok verification requires a video caption.');
}

function providerError(message = 'The social service could not confirm this public post. Check that it is public and try again later.') {
  return new SocialVerificationError('provider_unavailable', message, 503);
}

async function fetchJSON(url, fetchImpl) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetchImpl(url, {
      method: 'GET', redirect: 'error', signal: controller.signal,
      headers: {Accept: 'application/json'},
    });
    if (!response?.ok || response.redirected) throw providerError();
    if (Number(response.headers.get('content-length') || 0) > MAX_RESPONSE_BYTES) throw providerError();
    if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) throw providerError();
    const reader = response.body?.getReader();
    if (!reader) throw providerError();
    let size = 0;
    const chunks = [];
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); throw providerError(); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw providerError();
    return data;
  } catch (error) {
    if (error instanceof SocialVerificationError) throw error;
    throw providerError();
  } finally { clearTimeout(timer); }
}

function decodeEntities(text) {
  const named = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' '};
  return text.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos|nbsp);/gi, (whole, entity) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()];
    const value = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
    return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff) ? String.fromCodePoint(value) : '\ufffd';
  });
}

function tweetText(html) {
  if (typeof html !== 'string') return '';
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  // Only the actual tweet paragraph; author names, link attributes and scripts cannot prove ownership.
  const paragraph = /<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(cleaned)?.[1] || '';
  return decodeEntities(paragraph.replace(/<[^>]*>/g, ' '));
}

function hasCode(text, code) {
  if (typeof text !== 'string') return false;
  const safe = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}_-])${safe}(?=$|[^\\p{L}\\p{N}_-])`, 'u').test(text);
}

function checkCode(text, code) {
  if (!hasCode(text, code)) throw new SocialVerificationError('proof_code_missing', 'The complete verification code was not found in the post text or caption.', 422);
}

function checkAuthor(authorURL, profile) {
  let author;
  try { author = normalizeSocialProfile(authorURL); } catch { throw providerError('The provider did not return a usable post author.'); }
  if (author.provider !== profile.provider || author.handle !== profile.handle) {
    throw new SocialVerificationError('proof_author_mismatch', 'The provider reports that a different account published this post.', 422);
  }
}

export async function verifySocialProof({profileUrl, proofUrl, code} = {}, fetchImpl = fetch) {
  if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(code)) {
    throw new SocialVerificationError('invalid_verification_code', 'A valid server-issued verification code is required.');
  }
  const profile = normalizeSocialProfile(profileUrl);
  const proof = normalizeProof(proofUrl, profile);
  if (profile.provider === 'x') {
    const endpoint = new URL('https://publish.twitter.com/oembed');
    // Twitter's documented oEmbed endpoint accepts twitter.com status URLs.
    endpoint.searchParams.set('url', proof.url.replace('https://x.com/', 'https://twitter.com/'));
    endpoint.searchParams.set('omit_script', 'true');
    endpoint.searchParams.set('hide_thread', 'true');
    endpoint.searchParams.set('dnt', 'true');
    const data = await fetchJSON(endpoint.href, fetchImpl);
    checkAuthor(data.author_url, profile);
    checkCode(tweetText(data.html), code);
  } else if (profile.provider === 'tiktok') {
    const endpoint = new URL('https://www.tiktok.com/oembed');
    endpoint.searchParams.set('url', proof.url);
    const data = await fetchJSON(endpoint.href, fetchImpl);
    checkAuthor(data.author_url, profile);
    checkCode(data.title, code);
  } else {
    let did = profile.handle;
    if (!did.startsWith('did:')) {
      const resolve = new URL('https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle');
      resolve.searchParams.set('handle', profile.handle);
      const data = await fetchJSON(resolve.href, fetchImpl);
      did = data.did;
      if (typeof did !== 'string' || !/^did:(?:plc:[a-z2-7]{24}|web:[a-zA-Z0-9._:%-]{1,253})$/.test(did)) throw providerError();
    }
    const uri = `at://${did}/app.bsky.feed.post/${proof.id}`;
    const endpoint = new URL('https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread');
    endpoint.searchParams.set('uri', uri);
    endpoint.searchParams.set('depth', '0');
    endpoint.searchParams.set('parentHeight', '0');
    const data = await fetchJSON(endpoint.href, fetchImpl);
    const post = data.thread?.post;
    if (!post || post.uri !== uri || typeof post.record?.text !== 'string') throw providerError();
    if (post.author?.did !== did || (!profile.handle.startsWith('did:') && post.author?.handle?.toLowerCase() !== profile.handle)) {
      throw new SocialVerificationError('proof_author_mismatch', 'The provider reports that a different account published this post.', 422);
    }
    checkCode(post.record.text, code);
  }
  return {...profile, proofUrl: proof.url};
}
