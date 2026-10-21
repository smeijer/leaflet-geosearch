import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rspress/core';

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

export default defineConfig({
  root: path.join(here, 'docs'),
  title: 'Leaflet GeoSearch',
  description:
    'Address lookup (geocoding) for Leaflet and for apps without a map.',
  route: {
    cleanUrls: true,
  },
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
