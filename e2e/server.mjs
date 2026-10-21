// Serves the repository for the e2e tests: the fixture pages, dist and
// node_modules/leaflet. Unknown paths get an html 404, like most servers.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 4325);
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
      file.startsWith(root) &&
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
  .listen(port, () => console.log(`e2e server on http://localhost:${port}`));
