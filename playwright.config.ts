// a typed object, not defineConfig: CI also runs Playwright versions before
// defineConfig existed
import fs from 'node:fs';
import type { PlaywrightTestConfig } from '@playwright/test';
import type { E2EOptions } from './e2e/options';

const port = 4325;

// The Leaflet versions to test with, e.g. LEAFLET_VERSIONS="leaflet 1.6.0".
// `leaflet` and `leaflet-2` are the dev dependencies (Leaflet 1 and 2), other
// versions come from scripts/e2e-leaflet.mjs. Without it: the dev dependencies
// and every version in e2e/vendor/leaflet
const vendor = 'e2e/vendor/leaflet';
const leafletVersions = (
  process.env.LEAFLET_VERSIONS ||
  ['leaflet', 'leaflet-2']
    .concat(fs.existsSync(vendor) ? fs.readdirSync(vendor) : [])
    .join(' ')
)
  .split(/[\s,]+/)
  .filter(Boolean);

const browsers = ['chromium', 'firefox', 'webkit'] as const;

const config: PlaywrightTestConfig<E2EOptions> = {
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // every worker starts its own browsers, and with three browsers and several
  // Leaflet versions half the cores (the default) keeps a laptop at 100% CPU.
  // A quarter locally, more with --workers. CI keeps the default
  workers: process.env.CI ? undefined : '25%',
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
  },
  // every browser with every Leaflet version, e.g. `firefox-leaflet-2`. Pick
  // some with --project, e.g. `npm run test:e2e -- --project=chromium-leaflet`
  projects: browsers.flatMap((browserName) =>
    leafletVersions.map((leaflet) => ({
      name: `${browserName}-${leaflet}`,
      use: {
        browserName,
        leaflet,
        // locally an installed browser works too, e.g.
        // PLAYWRIGHT_CHANNEL=msedge or chrome
        channel:
          browserName === 'chromium'
            ? process.env.PLAYWRIGHT_CHANNEL
            : undefined,
      },
    })),
  ),
  webServer: {
    command: 'node e2e/server.mjs',
    port,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
};

export default config;
