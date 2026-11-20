// End-to-end tests of the built bundles in a real browser, with every Leaflet
// version of the project (see playwright.config.ts). Run `npm run build` and
// scripts/e2e-leaflet.mjs first. Provider requests are answered with fixtures,
// nothing goes to the network.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, Page } from '@playwright/test';
import { test } from './options';

const nominatim = readFileSync(
  path.join(__dirname, '../src/providers/__tests__/openstreetmapResponse.json'),
  'utf8',
);

test.beforeEach(async ({ page }) => {
  // only the local server; anything else fails loudly instead of going out
  await page.route(/^https?:\/\/(?!127\.0\.0\.1[:/])/, (route) =>
    route.abort(),
  );
});

async function skipWithoutImportMaps(page: Page) {
  const importMaps = await page.evaluate(
    () =>
      typeof HTMLScriptElement.supports === 'function' &&
      HTMLScriptElement.supports('importmap'),
  );
  test.skip(!importMaps, 'no import maps before Firefox 108 and Safari 16.4');
}

// A fixture page with the Leaflet version of the project: umd (Leaflet's
// global build and the UMD bundle), esm (import map and the ESM bundle) or
// esm-no-importmap
async function open(page: Page, leaflet: string, fixture = 'umd') {
  test.skip(
    fixture === 'umd' && leaflet === 'main',
    "Leaflet's main branch has no global build without building it",
  );
  if (fixture === 'esm') {
    await skipWithoutImportMaps(page);
  }
  if (leaflet === '2.0.0-alpha.1') {
    // the alpha uses class static blocks, which came in Safari 16.4. The 2.0
    // beta doesn't, it loads in all browsers in CI
    const staticBlocks = await page.evaluate(() => {
      try {
        new Function('class A { static {} }');
        return true;
      } catch {
        return false;
      }
    });
    test.skip(
      !staticBlocks,
      'Leaflet 2.0.0-alpha.1 needs Safari 16.4 or newer',
    );
  }
  await page.goto(`/e2e/fixtures/${fixture}.html?leaflet=${leaflet}`);
  await page.waitForFunction(() => window.ready);
}

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
  leaflet,
}) => {
  await answerNominatim(page);
  await open(page, leaflet);
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
  leaflet,
}) => {
  await answerNominatim(page, '<html><body>Access denied</body></html>', 418);
  await open(page, leaflet);
  const input = await addControl(page);

  await input.fill('Den Haag');

  await expect(page.locator('.leaflet-control-geosearch.error')).toHaveCount(1);
  const events = await page.evaluate(() => window.events);
  expect(events).toEqual([
    { type: 'geosearch/error', label: undefined, source: 'autocomplete' },
  ]);
});

test('the control works inside a shadow root (#214)', async ({
  page,
  leaflet,
}) => {
  await answerNominatim(page);
  await open(page, leaflet);
  await page.evaluate(() => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML =
      `<link rel="stylesheet" href="${window.e2eLeaflet.css}">` +
      '<link rel="stylesheet" href="/dist/geosearch.css">' +
      '<div style="width: 600px; height: 400px"></div>';
    const map = new window.L.Map(shadow.querySelector('div')!).setView(
      [52, 5],
      8,
    );
    map.on('geosearch/showlocation', () =>
      window.events.push({ type: 'shadow/showlocation' }),
    );
    map.addControl(
      new window.GeoSearch.GeoSearchControl({
        provider: new window.GeoSearch.OpenStreetMapProvider(),
        style: 'bar',
      }),
    );
  });
  // locators look into open shadow roots
  const input = page.locator('.leaflet-geosearch-bar input');

  // key by key, like a user. keyboard.type also works in the older
  // Playwright versions CI runs (pressSequentially came in 1.38). focus, not
  // click: the hit test of Playwright 1.29 sees the shadow host in WebKit
  await input.focus();
  await page.keyboard.type('Den Haag');
  await expect(page.locator('.leaflet-geosearch-bar .results > *')).toHaveCount(
    3,
  );
  await input.press('ArrowDown');
  await input.press('Enter');

  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  expect(await page.evaluate(() => window.events)).toEqual([
    { type: 'shadow/showlocation' },
  ]);
});

test('the bar stays at the top of the map, whatever the position is (#218)', async ({
  page,
  leaflet,
}) => {
  await answerNominatim(page);
  await open(page, leaflet);
  const map = (await page.locator('#map').boundingBox())!;

  for (const position of ['topleft', 'topright', 'bottomleft', 'bottomright']) {
    await page.evaluate((position) => {
      window.control?.remove();
      window.control = new window.GeoSearch.GeoSearchControl({
        provider: new window.GeoSearch.OpenStreetMapProvider(),
        style: 'bar',
        position,
        resultListPosition: 'auto',
      });
      window.map.addControl(window.control);
    }, position);
    const input = page.locator('.leaflet-geosearch-bar input');
    await input.fill('Den Haag');
    const list = page.locator('.leaflet-geosearch-bar .results');
    await expect(list.locator('> *')).toHaveCount(3);

    const form = (await page
      .locator('.leaflet-geosearch-bar form')
      .boundingBox())!;
    const items = (await list.boundingBox())!;
    // at the top, in the middle, with the results below it inside the map
    expect(form.y - map.y, position).toBeLessThan(20);
    expect(form.x + form.width / 2 - map.x, position).toBeCloseTo(
      map.width / 2,
      0,
    );
    expect(items.y, position).toBeGreaterThan(form.y);
    expect(items.y + items.height, position).toBeLessThan(map.y + map.height);
  }
});

test('labels with html are shown as text', async ({ page, leaflet }) => {
  await open(page, leaflet);
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

test('html in a real provider answer runs nowhere', async ({
  page,
  leaflet,
}) => {
  // a real browser runs what happy-dom doesn't, like an iframe's srcdoc
  const payloads = [
    '<img src=x onerror="window.xss=1">',
    '<svg onload="window.xss=1"></svg>',
    '<iframe srcdoc="<script>parent.xss=1</script>"></iframe>',
    '"><img src=x onerror="window.xss=1">',
    '<details open ontoggle="window.xss=1">',
  ];
  const label = `Den Haag ${payloads.join(' ')}`;
  await open(page, leaflet);
  await answerNominatim(
    page,
    JSON.stringify([
      {
        lat: '52.08',
        lon: '4.3',
        display_name: label,
        boundingbox: ['52.0', '52.1', '4.2', '4.4'],
      },
    ]),
  );
  await addControl(page, '{"showPopup": true}');
  const input = page.locator('.leaflet-geosearch-bar input');

  await input.fill('den');
  const item = page.locator('.leaflet-geosearch-bar .results > *').first();
  await expect(item).toHaveText(label);
  await item.click();

  const popup = page.locator('.leaflet-popup-content');
  await expect(popup).toHaveText(label);
  expect(await popup.locator('img, svg, iframe, details').count()).toEqual(0);
  // give an event handler time to run, if one was made
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.xss)).toBeUndefined();
});

test('a provider url that is not http or https is never requested', async ({
  page,
  leaflet,
}) => {
  await open(page, leaflet);
  const errors = await page.evaluate(async () => {
    const found: string[] = [];
    for (const searchUrl of [
      'javascript:window.xss=1',
      'data:application/json,[]',
    ]) {
      const provider = new window.GeoSearch.OpenStreetMapProvider({
        searchUrl,
      });
      await provider.search({ query: 'den' }).catch((error: Error) => {
        found.push(error.message);
      });
    }
    return found;
  });

  expect(errors).toHaveLength(2);
  errors.forEach((message) => expect(message).toMatch(/http or https/));
  expect(await page.evaluate(() => window.xss)).toBeUndefined();
});

test('a map from a second copy of Leaflet can show results (#253)', async ({
  page,
  leaflet,
}) => {
  await open(page, leaflet);

  const center = await page.evaluate(async () => {
    const source = await (await fetch(window.e2eLeaflet.global!)).text();
    // Leaflet 1 is a UMD build and fills module.exports, the global build of
    // Leaflet 2 declares a var L
    const module = { exports: {} as Record<string, any> };
    const pageL = window.L;
    const declared = new Function(
      'exports',
      'module',
      'define',
      `${source}\n;return typeof L === 'undefined' ? undefined : L;`,
    )(module.exports, module, undefined);
    window.L = pageL;
    const OtherL = Object.keys(module.exports).length
      ? module.exports
      : declared;
    if (OtherL === pageL) {
      throw new Error('not a second copy of Leaflet');
    }

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

async function searchOnPage(page: Page, leaflet: string, fixture: string) {
  await answerNominatim(page);
  await open(page, leaflet, fixture);

  const input = await addControl(page);
  await input.fill('Den Haag');
  await input.press('ArrowDown');
  await input.press('Enter');

  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(1);
  expect(await page.evaluate(() => window.events.length)).toBe(1);
}

test('the ESM bundle works with an import map', async ({ page, leaflet }) => {
  // the next test covers the browsers without import maps
  await searchOnPage(page, leaflet, 'esm');
});

test('the ESM bundle works without an import map', async ({
  page,
  leaflet,
}) => {
  await searchOnPage(page, leaflet, 'esm-no-importmap');
});

// The popup used to open before the map moved. Its autoPan jumped the map to
// a result off screen, so flyTo had nothing left to animate
for (const fixture of ['umd', 'esm']) {
  test(`with the popup, the map still flies to a result far away (${fixture})`, async ({
    page,
    leaflet,
  }) => {
    await open(page, leaflet, fixture);

    const flight = await page.evaluate(async () => {
      const map = window.map;
      let minZoom = map.getZoom();
      map.on('zoom', () => {
        minZoom = Math.min(minZoom, map.getZoom());
      });
      const control = new window.GeoSearch.GeoSearchControl({
        provider: { search: async () => [] },
        style: 'bar',
        flyTo: { duration: 1 },
        showPopup: true,
      });
      map.addControl(control);

      const arrived = new Promise((resolve) => map.once('moveend', resolve));
      control.showResult(
        { x: -74, y: 40.7, label: 'New York', bounds: null, raw: {} },
        { query: 'New York' },
      );
      await arrived;
      // the popup may still pan a little after the flight
      await new Promise((resolve) => setTimeout(resolve, 500));

      const box = map.getContainer().getBoundingClientRect();
      const popup = document
        .querySelector('.leaflet-popup')!
        .getBoundingClientRect();
      const { lat, lng } = map.getCenter();
      return {
        minZoom,
        lat,
        lng,
        popupInView:
          popup.top >= box.top &&
          popup.bottom <= box.bottom &&
          popup.left >= box.left &&
          popup.right <= box.right,
      };
    });

    // from zoom 8 on the Netherlands, a flight to New York zooms out to ~3
    expect(flight.minZoom).toBeLessThan(5);
    expect(flight.lat).toBeCloseTo(40.7, 1);
    expect(flight.lng).toBeCloseTo(-74, 1);
    expect(flight.popupInView).toBe(true);
  });
}

test('the providers entry loads without Leaflet', async ({ page, leaflet }) => {
  // any page, without waiting for a map: Leaflet main has none on it
  await page.goto(`/e2e/fixtures/umd.html?leaflet=${leaflet}`);

  // a module script, not import() in evaluate: older Playwright versions
  // compile import() in the test file to require()
  await page.addScriptTag({
    type: 'module',
    content:
      "import * as providers from '/dist/providers.module.js';" +
      'window.providers = providers;',
  });
  await page.waitForFunction(() => window.providers);

  const result = await page.evaluate(() => ({
    names: Object.keys(window.providers).length,
    url: new window.providers.OpenStreetMapProvider().endpoint({
      query: 'Den Haag',
    }),
  }));

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
    control?: any;
    providers?: any;
    // the Leaflet version of the page, see e2e/fixtures/leaflet.js. Not
    // window.leaflet: the UMD build of Leaflet 1.9 sets that one
    e2eLeaflet: {
      version: string;
      css: string;
      esm: string;
      global: string | null;
    };
    events: { type: string; label?: string; source?: string }[];
    ready?: boolean;
    xss?: boolean;
  }
}

test('several providers: the select picks which one is searched', async ({
  page,
  leaflet,
}) => {
  await answerNominatim(page);
  await open(page, leaflet);
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
