// Packs the package, installs it into an empty TypeScript project and type
// checks an import of both entries with node10, bundler and node16 module
// resolution. attw only checks that the entries resolve, this also catches
// errors inside the published .d.ts files. Run `npm run build` first.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'geosearch-types-'));
const run = (command, cwd = dir) =>
  execSync(command, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString();

const tarball = run(`npm pack --pack-destination "${dir}" --silent`, root)
  .trim()
  .split('\n')
  .pop();
const typescript = JSON.parse(
  fs.readFileSync(path.join(root, 'node_modules/typescript/package.json')),
).version;

fs.writeFileSync(
  path.join(dir, 'package.json'),
  JSON.stringify({ name: 'consumer', private: true }),
);
run(
  `npm install --ignore-scripts --no-audit --no-fund "${path.join(dir, tarball)}" typescript@${typescript} @types/leaflet@1`,
);

fs.writeFileSync(
  path.join(dir, 'index.ts'),
  `import { GeoSearchControl, GoogleProvider, OpenStreetMapProvider } from 'leaflet-geosearch';
import { JsonProvider, PeliasProvider } from 'leaflet-geosearch/providers';

new GeoSearchControl({ provider: new OpenStreetMapProvider(), style: 'bar' });
new GoogleProvider({ apiKey: 'key' });

const provider: JsonProvider = new PeliasProvider();
provider.search({ query: 'Den Haag' }).then((results) => results[0]?.label);
`,
);

const setups = [
  { moduleResolution: 'node10', module: 'esnext' },
  { moduleResolution: 'bundler', module: 'esnext' },
  { moduleResolution: 'node16', module: 'node16' },
];

let failed = false;
for (const { moduleResolution, module } of setups) {
  fs.writeFileSync(
    path.join(dir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        target: 'es2020',
        lib: ['es2020', 'dom'],
        module,
        moduleResolution,
        // projects that list their types must still get google.maps
        types: [],
        // node10 is deprecated in TypeScript 6
        ...(Number(typescript.split('.')[0]) >= 6 && {
          ignoreDeprecations: '6.0',
        }),
      },
      files: ['index.ts'],
    }),
  );

  try {
    run('npx tsc -p tsconfig.json');
    console.log(`ok    ${moduleResolution}`);
  } catch (error) {
    failed = true;
    console.log(`error ${moduleResolution}`);
    console.log(error.stdout.toString() || error.stderr.toString());
  }
}

fs.rmSync(dir, { recursive: true, force: true });
process.exit(failed ? 1 : 0);
