// End-to-end tests of the built bundles in a real browser. Run `npm run
// build` first. Provider requests are answered with fixtures, nothing goes
// to the network.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, Page, test } from '@playwright/test';

const nominatim = readFileSync(
  path.join(__dirname, '../src/providers/__tests__/openstreetmapResponse.json'),
  'utf8',
);

test.beforeEach(async ({ page }) => {
  // only the local server; anything else fails loudly instead of going out
  await page.route(/^https?:\/\/(?!localhost)/, (route) => route.abort());
});

async function answerNominatim(page: Page, body = nominatim, status = 200) {
  await page.route('https://nominatim.openstreetmap.org/**', (route) =>
    route.fulfill({
      status,
      contentType: status === 200 ? 'application/json' : 'text/html',
      body,
    }),
  );
}

async function addControl(page: Page, options = '{}') {
  await page.evaluate((extra) => {
    const control = new window.GeoSearch.GeoSearchControl({
      provider: new window.GeoSearch.OpenStreetMapProvider(),
      style: 'bar',
      ...JSON.parse(extra),
    });
    window.map.addControl(control);
  }, options);
  return page.locator('.leaflet-geosearch-bar input');
}

test('suggestions show up and the picked one is put on the map', async ({
  page,
}) => {
  await answerNominatim(page);
  await page.goto('/e2e/fixtures/umd.html');
  const input = await addControl(page);

  await input.fill('Den Haag');
  await expect(page.locator('.leaflet-geosearch-bar .results > *')).toHaveCount(
    3,
  );

  await input.press('ArrowDown');
  await input.press('Enter');

  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  const events = await page.evaluate(() => window.events);
  expect(events).toEqual([
    expect.objectContaining({ type: 'geosearch/showlocation' }),
  ]);
});

test('a failed search fires geosearch/error and shows the error style', async ({
  page,
}) => {
  await answerNominatim(page, '<html><body>Access denied</body></html>', 418);
  await page.goto('/e2e/fixtures/umd.html');
  const input = await addControl(page);

  await input.fill('Den Haag');

  await expect(page.locator('.leaflet-control-geosearch.error')).toHaveCount(1);
  const events = await page.evaluate(() => window.events);
  expect(events).toEqual([
    { type: 'geosearch/error', label: undefined, source: 'autocomplete' },
  ]);
});

test('labels with html are shown as text', async ({ page }) => {
  await page.goto('/e2e/fixtures/umd.html');
  await page.evaluate(() => {
    const label = '<img src="x" onerror="window.xss = true">Den Haag';
    const provider = {
      search: async () => [{ x: 4.3, y: 52.08, label, bounds: null, raw: {} }],
    };
    window.map.addControl(
      new window.GeoSearch.GeoSearchControl({
        provider,
        style: 'bar',
        showPopup: true,
      }),
    );
  });
  const input = page.locator('.leaflet-geosearch-bar input');

  await input.fill('den');
  const item = page.locator('.leaflet-geosearch-bar .results > *').first();
  await expect(item).toHaveText(
    '<img src="x" onerror="window.xss = true">Den Haag',
  );
  await item.click();

  await expect(page.locator('.leaflet-popup-content')).toContainText('<img');
  expect(await page.evaluate(() => window.xss)).toBeUndefined();
});

test('a map from a second copy of Leaflet can show results (#253)', async ({
  page,
}) => {
  await page.goto('/e2e/fixtures/umd.html');

  const center = await page.evaluate(async () => {
    const source = await (
      await fetch('/node_modules/leaflet/dist/leaflet.js')
    ).text();
    const module = { exports: {} as Record<string, any> };
    const pageL = window.L;
    new Function('exports', 'module', 'define', source)(
      module.exports,
      module,
      undefined,
    );
    window.L = pageL;
    const OtherL = module.exports;

    const map = new OtherL.Map('map2').setView([0, 0], 2);
    const provider = {
      search: async () => [
        {
          x: 4.3,
          y: 52.08,
          label: 'Den Haag',
          bounds: [
            [52, 4.2],
            [52.1, 4.4],
          ],
          raw: {},
        },
      ],
    };
    const control = new window.GeoSearch.GeoSearchControl({
      provider,
      animateZoom: false,
    });
    map.addControl(control);
    await control.onSubmit({ query: 'Den Haag' });
    return map.getCenter();
  });

  expect(center.lat).toBeCloseTo(52.05, 1);
  expect(center.lng).toBeCloseTo(4.3, 1);
});

test('the ESM bundle works with the ESM build of Leaflet', async ({ page }) => {
  await answerNominatim(page);
  await page.goto('/e2e/fixtures/esm.html');
  await page.waitForFunction(() => window.ready);

  const input = await addControl(page);
  await input.fill('Den Haag');
  await input.press('ArrowDown');
  await input.press('Enter');

  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  expect(await page.evaluate(() => window.events.length)).toBe(1);
});

test('the providers entry loads without Leaflet', async ({ page }) => {
  await page.goto('/e2e/fixtures/umd.html');

  const result = await page.evaluate(async () => {
    const providers = await import('/dist/providers.module.js');
    return {
      names: Object.keys(providers).length,
      url: new providers.OpenStreetMapProvider().endpoint({
        query: 'Den Haag',
      }),
    };
  });

  expect(result.names).toBeGreaterThan(15);
  expect(result.url).toEqual(
    'https://nominatim.openstreetmap.org/search?q=Den%20Haag&format=json',
  );
});

declare global {
  interface Window {
    GeoSearch: any;
    L: any;
    map: any;
    events: { type: string; label?: string; source?: string }[];
    ready?: boolean;
    xss?: boolean;
  }
}

test('several providers: the select picks which one is searched', async ({
  page,
}) => {
  await answerNominatim(page);
  await page.goto('/e2e/fixtures/umd.html');
  await page.evaluate(() => {
    const { GeoSearchControl, OpenStreetMapProvider } = window.GeoSearch;
    window.map.addControl(
      new GeoSearchControl({
        style: 'bar',
        providers: [
          { label: 'Nominatim', provider: new OpenStreetMapProvider() },
          { label: 'Backup', provider: new OpenStreetMapProvider() },
        ],
      }),
    );
  });
  const select = page.locator('.leaflet-geosearch-bar select');
  const input = page.locator('.leaflet-geosearch-bar input');
  const results = page.locator('.leaflet-geosearch-bar .results > *');

  await expect(select).toBeVisible();
  await expect(select).toHaveValue('all');

  // all providers: each result names its provider
  await input.fill('Den Haag');
  await expect(results).toHaveCount(5);
  await expect(results.first().locator('.provider')).toHaveText('Nominatim');

  // one provider: its results only, without names
  await select.selectOption({ label: 'Backup' });
  await expect(results).toHaveCount(3);
  await expect(results.locator('.provider')).toHaveCount(0);

  await results.nth(1).click();
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
});
