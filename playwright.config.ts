// a typed object, not defineConfig: CI also runs Playwright versions before
// defineConfig existed
import type { PlaywrightTestConfig } from '@playwright/test';

const port = 4325;

const config: PlaywrightTestConfig = {
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
  },
  // CI runs all three, also with the browsers of older Playwright versions.
  // Pick one with --project, e.g. `npm run test:e2e -- --project=chromium`
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        // locally an installed browser works too, e.g.
        // PLAYWRIGHT_CHANNEL=msedge or chrome
        channel: process.env.PLAYWRIGHT_CHANNEL,
      },
    },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'node e2e/server.mjs',
    port,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
};

export default config;
