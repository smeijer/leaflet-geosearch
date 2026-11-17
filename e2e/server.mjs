// Serves the files the e2e tests need: the fixture pages, dist and
// node_modules/leaflet/dist. Nothing else in the checkout (like .env) is
// served, and only localhost can connect. Unknown paths get an html 404,
// like most servers.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 4325);
const allowed = ['e2e/fixtures', 'dist', 'node_modules/leaflet/dist'].map(
  (dir) => path.join(root, dir) + path.sep,
);
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

// The file for a request path, or null when it is outside the allowed
// directories. path.resolve removes any `..` before the check.
function resolveFile(requestUrl) {
  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(requestUrl, 'http://localhost').pathname,
    );
  } catch {
    return null;
  }

  const file = path.resolve(root, '.' + pathname);
  for (const dir of allowed) {
    if (file.startsWith(dir)) {
      return file;
    }
  }
  return null;
}

// Browsers without import maps (Firefox before 108) can't resolve the bare
// "leaflet" import of the ESM bundle. With ?leaflet=esm the server points it
// at Leaflet's ESM build, like a CDN or a bundler would
const leafletEsm = '/node_modules/leaflet/dist/leaflet-src.esm.js';

http
  .createServer((req, res) => {
    const file = resolveFile(req.url);

    if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, {
        'content-type': types[path.extname(file)] || 'application/octet-stream',
      });
      if (file.endsWith('.js') && req.url.includes('?leaflet=esm')) {
        const code = fs.readFileSync(file, 'utf8');
        res.end(
          code.replace(/from\s*(["'])leaflet\1/g, `from "${leafletEsm}"`),
        );
        return;
      }
      fs.createReadStream(file).pipe(res);
      return;
    }

    res.writeHead(404, { 'content-type': 'text/html' });
    res.end('<!doctype html><title>Not found</title><h1>Not found</h1>');
  })
  .listen(port, 'localhost', () =>
    console.log(`e2e server on http://localhost:${port}`),
  );
