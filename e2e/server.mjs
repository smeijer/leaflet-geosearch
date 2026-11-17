// Serves the files the e2e tests need: the fixture pages, dist, the Leaflet
// dev dependencies (leaflet and leaflet-2) and the Leaflet versions in
// e2e/vendor (see scripts/e2e-leaflet.mjs). Nothing else in the checkout
// (like .env) is served, and only this machine can connect. Unknown paths get
// an html 404, like most servers.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 4325);
const allowed = [
  'e2e/fixtures',
  'e2e/vendor',
  'dist',
  'node_modules/leaflet/dist',
  'node_modules/leaflet-2/dist',
].map((dir) => path.join(root, dir) + path.sep);
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

// Browsers without import maps (Firefox before 108, Safari before 16.4) can't
// resolve the bare "leaflet" import of the ESM bundle. With ?leaflet=<version>
// the server points it at the ESM build of that version, like a CDN or a
// bundler would. The same paths as in e2e/fixtures/leaflet.js
function leafletEsm(version) {
  const installed = version === 'leaflet' || version === 'leaflet-2';
  const base = installed
    ? `/node_modules/${version}/`
    : `/e2e/vendor/leaflet/${version}/`;
  if (version === 'main') {
    return base + 'src/Leaflet.js';
  }
  return (
    base +
    (version === 'leaflet' || version.startsWith('1.')
      ? 'dist/leaflet-src.esm.js'
      : 'dist/leaflet.js')
  );
}

http
  .createServer((req, res) => {
    const file = resolveFile(req.url);

    if (file && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.writeHead(200, {
        'content-type': types[path.extname(file)] || 'application/octet-stream',
      });
      const version = /[?&]leaflet=([\w.-]+)/.exec(req.url)?.[1];
      if (file.endsWith('.js') && version) {
        const code = fs.readFileSync(file, 'utf8');
        res.end(
          code.replace(
            /from\s*(["'])leaflet\1/g,
            `from "${leafletEsm(version)}"`,
          ),
        );
        return;
      }
      fs.createReadStream(file).pipe(res);
      return;
    }

    res.writeHead(404, { 'content-type': 'text/html' });
    res.end('<!doctype html><title>Not found</title><h1>Not found</h1>');
  })
  // 127.0.0.1, not localhost: that can resolve to ::1 for the server and to
  // 127.0.0.1 for the browser, and Firefox then can't connect now and then
  .listen(port, '127.0.0.1', () =>
    console.log(`e2e server on http://127.0.0.1:${port}`),
  );
