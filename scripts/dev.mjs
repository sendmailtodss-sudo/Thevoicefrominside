import http from 'node:http';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.vtt': 'text/vtt; charset=utf-8',
};
const headers = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self' blob:; connect-src 'self'; worker-src 'self' blob:; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
};
const unavailable = JSON.stringify({
  ok: false, error: 'development-disabled',
  message: 'This is a local developer preview. Live APIs, submissions and payments are disabled.',
});

/** Serve the source preview without invoking or proxying any production service. */
export function createDevServer({ publicDir = path.join(projectRoot, 'public'), privateVideo = null, privateMediaDir = null } = {}) {
  return http.createServer(async (request, response) => {
    function send(status, body = '', contentType = 'text/plain; charset=utf-8', extra = {}) {
      const content = Buffer.isBuffer(body) ? body : Buffer.from(body);
      response.writeHead(status, { ...headers, 'Content-Type': contentType, 'Content-Length': content.length, ...extra });
      response.end(request.method === 'HEAD' ? undefined : content);
    }
    try {
      // Inspect the original request target before URL parsing can normalize traversal.
      const raw = (request.url || '/').split('?')[0];
      let pathname;
      try { pathname = decodeURIComponent(raw); } catch { return send(400, 'Invalid URL encoding.'); }
      if (!pathname.startsWith('/') || pathname.includes('\0')) return send(400, 'Invalid request path.');
      if (pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.'))) {
        return send(403, 'This path is not available.');
      }
      if (pathname === '/api' || pathname.startsWith('/api/')) {
        return send(503, unavailable, 'application/json; charset=utf-8');
      }
      if (!['GET', 'HEAD'].includes(request.method)) {
        return send(405, 'The developer preview is read-only.', undefined, { Allow: 'GET, HEAD' });
      }
      // Explicitly configured, loopback-only preview: never copy private media into public/.
      const scene = /^\/__private-preview\/scenes\/([a-z0-9-]+)\.mp4$/.exec(pathname);
      let selectedVideo = pathname === '/__private-preview/opening.mp4' ? privateVideo : null;
      if (scene && privateMediaDir) {
        const root = await fs.realpath(privateMediaDir);
        try {
          const candidate = await fs.realpath(path.join(root, `${scene[1]}.mp4`));
          if (!candidate.startsWith(root + path.sep)) return send(403, 'This path is not available.');
          selectedVideo = candidate;
        } catch (error) {
          if (error.code === 'ENOENT') return send(404, 'Scene not available.');
          throw error;
        }
      }
      if (selectedVideo) {
        const stat = await fs.stat(selectedVideo);
        const match = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range || '');
        let start = 0, end = stat.size - 1;
        if (request.headers.range && !match) return send(416, 'Invalid range.', undefined, { 'Content-Range': `bytes */${stat.size}` });
        if (match) { start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end; }
        if (start > end || start >= stat.size) return send(416, 'Invalid range.', undefined, { 'Content-Range': `bytes */${stat.size}` });
        const extra = { 'Content-Type': 'video/mp4', 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes' };
        if (match) extra['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
        response.writeHead(match ? 206 : 200, { ...headers, ...extra });
        if (request.method === 'HEAD') return response.end();
        return createReadStream(selectedVideo, { start, end }).on('error', () => response.destroy()).pipe(response);
      }
      const root = await fs.realpath(publicDir);
      const inside = candidate => candidate === root || candidate.startsWith(root + path.sep);
      const safeResolved = candidate => inside(candidate) && !path.relative(root, candidate).split(path.sep).some(part => part.startsWith('.'));
      let filename = path.resolve(root, '.' + pathname);
      if (!inside(filename)) return send(403, 'This path is not available.');
      try {
        const resolved = await fs.realpath(filename);
        if (!safeResolved(resolved)) return send(403, 'This path is not available.');
        filename = resolved;
        if ((await fs.stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
        filename = await fs.realpath(filename);
        if (!safeResolved(filename)) return send(403, 'This path is not available.');
        if (!(await fs.stat(filename)).isFile()) return send(404, 'Not found.');
        return send(200, await fs.readFile(filename), types[path.extname(filename).toLowerCase()] || 'application/octet-stream');
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
        // Original artwork is deliberately absent from the developer distribution.
        // Preserve layout dimensions with an explicit SVG example, never a fake PDF.
        if (/\.(?:png|jpe?g|webp|gif)$/i.test(pathname)) {
          const placeholder = await fs.realpath(path.join(root, 'dev-assets', 'example-art.svg'));
          if (!safeResolved(placeholder)) return send(403, 'This path is not available.');
          return send(200, await fs.readFile(placeholder), 'image/svg+xml', { 'X-Preview-Asset': 'example-art' });
        }
        return send(404, 'Not included in the developer preview.');
      }
    } catch (error) {
      if (!response.headersSent) send(500, 'The local preview could not read this file.');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer between 0 and 65535.');
  const privateVideo = process.env.DREAMINA_PREVIEW_VIDEO || null;
  const privateMediaDir = process.env.DREAMINA_PREVIEW_DIR || null;
  const server = createDevServer({ privateVideo, privateMediaDir });
  server.on('error', error => { console.error(`Preview could not start: ${error.message}`); process.exitCode = 1; });
  server.listen(port, privateVideo || privateMediaDir ? '127.0.0.1' : '0.0.0.0', () => {
    console.log(`Developer preview ready: http://localhost:${server.address().port}`);
    console.log('Example content; live APIs, submissions and payments disabled.');
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
}
