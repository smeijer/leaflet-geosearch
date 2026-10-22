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

http
  .createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(root, url);

    if (
      allowed.some((dir) => file.startsWith(dir)) &&
      fs.existsSync(file) &&
      fs.statSync(file).isFile()
    ) {
      res.writeHead(200, {
        'content-type': types[path.extname(file)] || 'application/octet-stream',
      });
      fs.createReadStream(file).pipe(res);
      return;
    }

    res.writeHead(404, { 'content-type': 'text/html' });
    res.end('<!doctype html><title>Not found</title><h1>Not found</h1>');
  })
  .listen(port, 'localhost', () =>
    console.log(`e2e server on http://localhost:${port}`),
  );
