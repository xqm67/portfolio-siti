'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT deve essere un numero da 1 a 65535.');
  process.exit(1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((request, response) => {
  const reply = (code, message, headers = {}) => {
    response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
    response.end(request.method === 'HEAD' ? undefined : message);
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    reply(405, 'Metodo non consentito.', { Allow: 'GET, HEAD' });
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    reply(400, 'URL non valido.');
    return;
  }
  if (pathname.includes('\0')) {
    reply(400, 'URL non valido.');
    return;
  }
  const parts = pathname.replaceAll('\\', '/').split('/');
  if (parts.some((part) => part.startsWith('.') || part === 'node_modules')) {
    reply(404, 'File non trovato.');
    return;
  }

  const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(root + path.sep)) {
    reply(403, 'Percorso non consentito.');
    return;
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      reply(404, 'File non trovato.');
      return;
    }
    const headers = {
      'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'bytes',
    };
    let start = 0;
    let end = stat.size - 1;
    let status = 200;
    if (request.headers.range) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (!range || (!range[1] && !range[2])) {
        reply(416, 'Intervallo non valido.', { 'Content-Range': `bytes */${stat.size}` });
        return;
      }
      if (!range[1]) {
        start = Math.max(0, stat.size - Number(range[2]));
      } else {
        start = Number(range[1]);
        if (range[2]) end = Math.min(end, Number(range[2]));
      }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
        reply(416, 'Intervallo non valido.', { 'Content-Range': `bytes */${stat.size}` });
        return;
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length'] = Math.max(0, end - start + 1);
    response.writeHead(status, headers);
    if (request.method === 'HEAD' || stat.size === 0) {
      response.end();
      return;
    }
    const stream = fs.createReadStream(file, { start, end });
    stream.on('error', () => response.destroy());
    response.on('close', () => stream.destroy());
    stream.pipe(response);
  });
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `La porta ${port} è già occupata. Imposta PORT su un'altra porta.`
    : error.message);
  process.exitCode = 1;
});
server.listen(port, host, () => console.log(`Preview: http://${host}:${port}/`));
