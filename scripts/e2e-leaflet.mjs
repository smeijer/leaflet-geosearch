// Puts the Leaflet versions the e2e tests run with into e2e/vendor/leaflet,
// one folder per version. Released versions come from npm, `main` is Leaflet's
// main branch from GitHub (its source, without a build). `leaflet` and
// `leaflet-2` are the dev dependencies, the tests load them from node_modules,
// so they are skipped here.
//
//   node scripts/e2e-leaflet.mjs 1.6.0 main
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const vendor = path.join(root, 'e2e/vendor/leaflet');
const versions = process.argv
  .slice(2)
  .filter((version) => version !== 'leaflet' && version !== 'leaflet-2');

if (process.argv.length < 3) {
  console.error('Usage: node scripts/e2e-leaflet.mjs <version> [version ...]');
  process.exit(1);
}

for (const version of versions) {
  const dir = path.join(vendor, version);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });

  // the archive goes into the folder itself, so tar only sees a file name:
  // the tar of Git for Windows reads C: in a path as a remote host
  let archive;
  if (version === 'main') {
    const response = await fetch(
      'https://codeload.github.com/Leaflet/Leaflet/tar.gz/main',
    );
    if (!response.ok) {
      throw new Error(`Leaflet main: ${response.status}`);
    }
    archive = 'leaflet-main.tgz';
    fs.writeFileSync(
      path.join(dir, archive),
      Buffer.from(await response.arrayBuffer()),
    );
  } else {
    archive = execFileSync('npm', ['pack', `leaflet@${version}`, '--silent'], {
      cwd: dir,
      encoding: 'utf8',
      // npm.cmd on Windows needs a shell
      shell: process.platform === 'win32',
    })
      .trim()
      .split('\n')
      .pop();
  }

  execFileSync('tar', ['-xzf', archive, '--strip-components=1'], { cwd: dir });
  fs.rmSync(path.join(dir, archive));

  // only what the pages load: dist, or the source of the main branch. Its
  // tests and configs would end up in our lint and test runs otherwise
  const keep = version === 'main' ? 'src' : 'dist';
  for (const entry of fs.readdirSync(dir)) {
    if (entry !== keep) {
      fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
    }
  }
  console.log(`Leaflet ${version} -> ${path.relative(root, dir)}`);
}
