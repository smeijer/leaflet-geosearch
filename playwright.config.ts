import { defineConfig } from '@playwright/test';

const port = 4325;

export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    // CI uses Playwright's Chromium. Locally an installed browser works too,
    // e.g. PLAYWRIGHT_CHANNEL=msedge or chrome
    channel: process.env.PLAYWRIGHT_CHANNEL,
  },
  webServer: {
    command: 'node e2e/server.mjs',
    port,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
  },
});
