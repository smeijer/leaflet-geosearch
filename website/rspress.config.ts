import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type RspressPlugin } from '@rspress/core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');

// API keys for the provider demos come from the environment (CI secrets) or
// the .env file of the repo, the same names the tests use. They end up in
// the pages, so they must be restricted to the docs domain
const envFile = path.join(repo, '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const keyNames = [
  'AMAP',
  'BING',
  'GEOAPIFY',
  'GEOCODEEARTH',
  'GOOGLE',
  'HERE',
  'LOCATIONIQ',
  'MAPBOX',
  'OPENCAGE',
];

const define = Object.fromEntries(
  keyNames.map((name) => {
    const value =
      process.env[`${name}_API_KEY`] ??
      process.env[`GATSBY_${name}_API_KEY`] ??
      '';
    return [`process.env.${name}_API_KEY`, JSON.stringify(value)];
  }),
);

// the old docs served every page at /page/ (and redirected /page there), so
// that's what search engines and other sites link to. a copy of each page at
// page/index.html keeps those links working
function oldUrls(): RspressPlugin {
  return {
    name: 'old-docs-urls',
    afterBuild(config) {
      const outDir = path.resolve(here, config.outDir ?? 'doc_build');
      const pages = fs
        .readdirSync(outDir, { recursive: true, encoding: 'utf8' })
        .filter((file) => file.endsWith('.html'))
        .filter(
          (file) => !['index.html', '404.html'].includes(path.basename(file)),
        );

      for (const page of pages) {
        const target = path.join(
          outDir,
          page.replace(/.html$/, ''),
          'index.html',
        );
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(path.join(outDir, page), target);
      }
    },
  };
}

export default defineConfig({
  root: path.join(here, 'docs'),
  title: 'Leaflet GeoSearch',
  icon: '/logo.svg',
  logo: '/logo.svg',
  logoText: 'Leaflet GeoSearch',
  description:
    'Address lookup (geocoding) for Leaflet and for apps without a map.',
  route: {
    cleanUrls: true,
  },
  plugins: [oldUrls()],
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/smeijer/leaflet-geosearch',
      },
    ],
    editLink: {
      docRepoBaseUrl:
        'https://github.com/smeijer/leaflet-geosearch/tree/main/website/docs',
    },
  },
  builderConfig: {
    source: {
      define,
    },
    resolve: {
      // the tsconfig paths only point the editor to the type declarations
      aliasStrategy: 'prefer-alias',
      alias: {
        // the docs show the package built from this repo (npm run build).
        // the more specific paths come first
        'leaflet-geosearch/providers': path.join(
          repo,
          'dist/providers.module.js',
        ),
        'leaflet-geosearch/dist': path.join(repo, 'dist'),
        'leaflet-geosearch$': path.join(repo, 'dist/geosearch.module.js'),
        // one copy of Leaflet for the map and the control
        leaflet: path.join(here, 'node_modules/leaflet'),
      },
    },
  },
});
