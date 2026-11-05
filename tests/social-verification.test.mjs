import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSocialProfile, verifySocialProof, SocialVerificationError} from '../worker/social-verification.js';

const code = 'STEMMEN-f47ac10b-58cc-4372-a567-0e02b2c3d479';
const x = {profileUrl: 'https://x.com/artist', proofUrl: 'https://x.com/artist/status/1234567890123456789', code};
const tt = {profileUrl: 'https://www.tiktok.com/@artist', proofUrl: 'https://www.tiktok.com/@artist/video/1234567890123456789', code};
const bsky = {profileUrl: 'https://bsky.app/profile/artist.bsky.social', proofUrl: 'https://bsky.app/profile/artist.bsky.social/post/3lxyz12345678', code};
const did = 'did:plc:abcdefghijklmnopqrstuvwxyz'.slice(0,32);
const response = data => Response.json(data);
const errorIs = code => error => error instanceof SocialVerificationError && error.code === code;
const tweet = text => ({author_url: 'https://twitter.com/artist', html: `<blockquote class="twitter-tweet"><p lang="en">${text}</p>&mdash; artist (<a href="https://twitter.com/artist">@artist</a>)</blockquote>`});

test('normalizes supported profile URLs and removes tracking parameters', () => {
  assert.deepEqual(normalizeSocialProfile('https://www.twitter.com/Artist/?s=20'), {provider:'x', profileUrl:'https://x.com/artist', handle:'artist'});
  assert.equal(normalizeSocialProfile('https://www.tiktok.com/@Artist.Name/').profileUrl, 'https://www.tiktok.com/@artist.name');
  assert.equal(normalizeSocialProfile('https://bsky.app/profile/Artist.Bsky.Social').handle, 'artist.bsky.social');
});

test('rejects SSRF URLs, credentials, extra paths and unsupported services before fetching', async () => {
  for (const url of ['http://x.com/artist', 'https://x.com.evil.example/artist', 'https://x.com@127.0.0.1/artist', 'https://x.com:8443/artist', 'https://127.0.0.1/artist', 'https://x.com/artist/status/12345', 'https://facebook.com/artist', 'https://x.com/artist%2f..', 'https://x.com/arti\nst', 'https://x.com\\evil.example/artist']) {
    assert.throws(() => normalizeSocialProfile(url), SocialVerificationError, url);
  }
  let calls = 0;
  for (const proofUrl of ['https://evil.example/proof', 'http://x.com/artist/status/12345', 'https://x.com/other/status/12345', 'https://x.com/artist/status/12345/extra']) {
    await assert.rejects(verifySocialProof({...x, proofUrl}, async () => {calls++; return response(tweet(code));}), SocialVerificationError);
  }
  assert.equal(calls, 0);
});

test('X verifies a visible exact code and official provider author', async () => {
  const result = await verifySocialProof({...x, proofUrl:x.proofUrl+'?s=46'}, async (url, options) => {
    const u = new URL(url);
    assert.equal(u.origin, 'https://publish.twitter.com');
    assert.equal(u.pathname, '/oembed');
    assert.equal(u.searchParams.get('url'), x.proofUrl.replace('x.com','twitter.com'));
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal);
    return response(tweet('My verification: '+code+'.'));
  });
  assert.deepEqual(result, {provider:'x', profileUrl:x.profileUrl, handle:'artist', proofUrl:x.proofUrl});
});

test('X rejects forged author, code prefixes, code hidden in attributes, scripts or author name', async () => {
  await assert.rejects(verifySocialProof(x, async () => response({...tweet(code), author_url:'https://twitter.com/someoneelse'})), errorIs('proof_author_mismatch'));
  for (const html of [tweet('x'+code).html, tweet('å'+code).html, tweet(code+'字').html, tweet(code+'-extra').html, tweet(`<a href="https://example.com/${code}">Read more</a>`).html, `<script>${code}</script><p>Nothing here</p>`, '<p>No code</p>'+code]) {
    await assert.rejects(verifySocialProof(x, async () => response({author_url:x.profileUrl, html})), errorIs('proof_code_missing'));
  }
});

test('TikTok verifies caption and author without trusting embed HTML', async () => {
  const result = await verifySocialProof(tt, async (url, options) => {
    assert.equal(new URL(url).origin, 'https://www.tiktok.com');
    assert.equal(options.redirect, 'error');
    return response({author_url:tt.profileUrl,title:'My artist account: '+code});
  });
  assert.equal(result.provider, 'tiktok');
  await assert.rejects(verifySocialProof(tt, async () => response({author_url:'https://www.tiktok.com/@forged',title:code})), errorIs('proof_author_mismatch'));
  await assert.rejects(verifySocialProof(tt, async () => response({author_url:tt.profileUrl,title:'Caption without proof',html:code})), errorIs('proof_code_missing'));
});

test('Bluesky resolves handle and verifies exact post URI, DID, handle and record text', async () => {
  let calls = 0;
  const result = await verifySocialProof(bsky, async (url, options) => {
    const u = new URL(url);
    assert.equal(u.origin, 'https://public.api.bsky.app');
    assert.equal(options.redirect, 'error');
    calls++;
    if (u.pathname.endsWith('resolveHandle')) return response({did});
    const uri = `at://${did}/app.bsky.feed.post/3lxyz12345678`;
    assert.equal(u.searchParams.get('uri'), uri);
    return response({thread:{post:{uri,author:{did,handle:'artist.bsky.social'},record:{text:code}}}});
  });
  assert.equal(calls, 2);
  assert.equal(result.provider, 'bluesky');
  for (const author of [{did:'did:plc:wrong',handle:'artist.bsky.social'}, {did,handle:'forged.bsky.social'}]) {
    await assert.rejects(verifySocialProof(bsky, async url => new URL(url).pathname.endsWith('resolveHandle') ? response({did}) : response({thread:{post:{uri:`at://${did}/app.bsky.feed.post/3lxyz12345678`,author,record:{text:code}}}})), errorIs('proof_author_mismatch'));
  }
});

test('provider errors, redirects, HTML errors and oversized bodies fail closed', async () => {
  const responses = [() => new Response('Unavailable',{status:503}), () => new Response(null,{status:302,headers:{Location:'http://127.0.0.1/'}}), () => new Response('<html>Login</html>',{headers:{'Content-Type':'text/html'}}), () => response({padding:'x'.repeat(128*1024)}), () => new Response('{bad',{headers:{'Content-Type':'application/json'}}), () => {throw new Error('Network failed');}];
  for (const make of responses) await assert.rejects(verifySocialProof(x, async () => make()), errorIs('provider_unavailable'));
  await assert.rejects(verifySocialProof(x, async () => ({...response(tweet(code)),ok:true,redirected:true})), errorIs('provider_unavailable'));
});

test('invalid server challenge never reaches a provider', async () => {
  for (const bad of ['', 'short', 'space is not a code', 'a'.repeat(129), undefined]) {
    await assert.rejects(verifySocialProof({...x,code:bad}, async () => {throw new Error('must not fetch');}), errorIs('invalid_verification_code'));
  }
});
