// HTML from a provider must never run as code. The control can't know what a
// provider sends, a new or self-hosted one can answer with anything, and a
// provider url can come from an option. These tests feed the control and the
// providers html in many forms and check that it only ever shows as text.
import fc from 'fast-check';
import SearchControl from '../SearchControl';
import * as providers from '../providers/index';
import { RequestType } from '../providers/provider';
import randomId from '../../test/randomId';
import { answerRequests } from '../../test';

import amap from '../providers/__tests__/amapResponse.json';
import esri from '../providers/__tests__/esriResponse.json';
import geoapify from '../providers/__tests__/geoapifyResponse.json';
import google from '../providers/__tests__/googleResponse.json';
import here from '../providers/__tests__/hereResponse.json';
import locationiq from '../providers/__tests__/locationiqResponse.json';
import openGeocoding from '../providers/__tests__/openGeocodingAutocompleteResponse.json';
import opencage from '../providers/__tests__/opencageResponse.json';
import openstreetmap from '../providers/__tests__/openstreetmapResponse.json';
import pdok from '../providers/__tests__/pdokNlResponse.json';
import pelias from '../providers/__tests__/peliasResponse.json';
import photon from '../providers/__tests__/photonResponse.json';

// every payload sets window.__xss when it runs
const payloads = [
  '<img src=x onerror="window.__xss=1">',
  '<svg onload="window.__xss=1"></svg>',
  '<script>window.__xss=1</script>',
  '<iframe srcdoc="<script>parent.__xss=1</script>"></iframe>',
  '<a href="javascript:window.__xss=1">Den Haag</a>',
  '"><img src=x onerror="window.__xss=1">',
  "'><img src=x onerror='window.__xss=1'>",
  '<ScRiPt>window.__xss=1</sCrIpT>',
  '<<img src=x onerror="window.__xss=1">',
  '<img src=x onerror=window.__xss=1//',
  '<details open ontoggle="window.__xss=1">',
  '<body onload="window.__xss=1">',
  '<style>@import "javascript:window.__xss=1"</style>',
  '&lt;img src=x onerror="window.__xss=1"&gt;',
  'Den\u0000Haag <img src=x onerror="window.__xss=1">',
  // right-to-left override, written as an escape so the file shows it
  '\u202e<img src=x onerror="window.__xss=1">',
];

const place = (label) => ({ x: 4.3, y: 52.08, label, bounds: null, raw: {} });

function setup(options = {}) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = new L.Map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();
  const control = new SearchControl(options).addTo(map);

  return { map, control, input: control.searchElement.input };
}

async function type(input, value) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await vi.advanceTimersByTimeAsync(250);
}

// nothing from the label became an element, and nothing ran
function expectText(root) {
  expect(
    root.querySelector('img, svg, script, iframe, a, details, style'),
  ).toBeNull();
  expect(window.__xss).toBeUndefined();
}

// a popup's content goes into the page as html, so check it the same way
function popupAsHtml(marker) {
  const div = document.createElement('div');
  div.innerHTML = marker.getPopup().getContent();
  return div;
}

beforeEach(() => {
  vi.useFakeTimers();
  delete window.__xss;
});
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
  delete window.__xss;
});

describe('html payloads in labels', () => {
  test.each(payloads)('suggestions show %s as text', async (label) => {
    const provider = { search: vi.fn(async () => [place(label)]) };
    const { control, input } = setup({ provider });

    await type(input, 'den');

    const [item] = control.resultList.container.children;
    expectText(item);
    expect(item.textContent).toEqual(label);
  });

  test.each(payloads)('the popup shows %s as text', async (label) => {
    const provider = { search: vi.fn(async () => [place(label)]) };
    const { control } = setup({ provider, showPopup: true });

    await control.onSubmit({ query: 'den' });

    const popup = popupAsHtml(control.markers.getLayers()[0]);
    expectText(popup);
    expect(popup.textContent).toEqual(label);
  });

  test.each(payloads)(
    'the popup after a reverse lookup shows %s as text',
    async (label) => {
      const provider = {
        search: vi.fn(async () => [place('Den Haag')]),
        reverse: vi.fn(async () => [place(label)]),
      };
      const { control, map } = setup({
        provider,
        marker: { draggable: true },
        reverseOnDragEnd: true,
      });
      const found = [];
      map.on('geosearch/marker/reverse', (e) => found.push(e));
      await control.onSubmit({ query: 'den' });

      const [marker] = control.markers.getLayers();
      marker.fire('dragend');
      await vi.waitFor(() => expect(found).toHaveLength(1));

      const popup = popupAsHtml(marker);
      expectText(popup);
      expect(popup.textContent).toEqual(label);
    },
  );

  test.each(payloads)(
    'a picked suggestion puts %s into the input as text',
    async (label) => {
      const provider = { search: vi.fn(async () => [place(label)]) };
      const { control, input } = setup({ provider, keepResult: true });

      await type(input, 'den');
      control.resultList.handleClick({ result: place(label) });
      await vi.advanceTimersByTimeAsync(0);

      expect(input.value).toEqual(label);
      // the form only has its own elements: the input and its buttons
      const form = control.searchElement.form;
      expect(form.querySelector('img, svg, script, iframe, style')).toBeNull();
      expect(window.__xss).toBeUndefined();
    },
  );

  test('a popupFormat that is not a function still escapes the label', async () => {
    const label = payloads[0];
    const provider = { search: vi.fn(async () => [place(label)]) };
    const { control } = setup({ provider, popupFormat: null });

    await control.onSubmit({ query: 'den' });

    const popup = popupAsHtml(control.markers.getLayers()[0]);
    expectText(popup);
    expect(popup.textContent).toEqual(label);
  });

  test('any label shows as text, in the list and in the popup', async () => {
    const pieces = fc.constantFrom(
      ...payloads,
      '<',
      '>',
      '"',
      "'",
      '&',
      '&amp;',
      ' ',
      'Den Haag',
    );
    const label = fc.oneof(
      fc.string({ unit: 'grapheme' }),
      fc.array(pieces, { maxLength: 6 }).map((p) => p.join('')),
    );

    await fc.assert(
      fc.asyncProperty(label, async (value) => {
        const provider = { search: vi.fn(async () => [place(value)]) };
        const { control, input } = setup({ provider, showPopup: true });

        await type(input, 'den');
        const [item] = control.resultList.container.children;
        expectText(item);
        expect(item.textContent).toEqual(value);

        await control.onSubmit({ query: 'den' });
        const popup = popupAsHtml(control.markers.getLayers()[0]);
        expectText(popup);
        expect(popup.textContent).toEqual(value);

        document.body.innerHTML = '';
      }),
      { numRuns: 60 },
    );
  });
});

// replaces every text in a provider answer with the payload, except numbers
// (coordinates are strings in some answers)
function poison(value, payload) {
  if (typeof value === 'string') {
    return /^-?\d+(\.\d+)?$/.test(value) ? value : `${value} ${payload}`;
  }
  if (Array.isArray(value)) {
    return value.map((item) => poison(item, payload));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, poison(item, payload)]),
    );
  }
  return value;
}

describe('every provider, with html in its answer', () => {
  const payload = '<img src=x onerror="window.__xss=1">';
  const cases = [
    ['AMapProvider', amap, { params: { key: 'k' } }],
    ['EsriProvider', esri],
    ['GeoapifyProvider', geoapify, { params: { apiKey: 'k' } }],
    ['GeocodeEarthProvider', pelias, { params: { api_key: 'k' } }],
    ['HereProvider', here, { params: { apiKey: 'k' } }],
    ['LegacyGoogleProvider', google, { params: { key: 'k' } }],
    ['LocationIQProvider', locationiq, { params: { key: 'k' } }],
    ['OpenCageProvider', opencage, { params: { key: 'k' } }],
    ['OpenGeocodingProvider', openGeocoding, { apiKey: 'k' }],
    ['OpenStreetMapProvider', openstreetmap],
    ['PdokNlProvider', pdok],
    ['PeliasProvider', pelias],
    ['PhotonProvider', photon],
  ];

  test.each(cases)('%s', async (name, fixture, options = {}) => {
    answerRequests(poison(fixture, payload));
    const provider = new providers[name](options);
    const { control, input } = setup({ provider, showPopup: true });

    await type(input, 'den');

    const list = control.resultList.container;
    expect(list.children.length).toBeGreaterThan(0);
    expectText(list);
    expect(list.textContent).toContain(payload);

    await control.onSubmit({ query: 'den' });
    const markers = control.markers.getLayers();
    markers.forEach((marker) => expectText(popupAsHtml(marker)));
  });

  test('Bing, which answers with a script (JSONP)', async () => {
    const provider = new providers.BingProvider({ params: { key: 'k' } });
    const pending = provider.search({ query: 'den' });
    const script = document.querySelector('script');
    const callback = new URL(script.src).searchParams.get('jsonp');

    window[callback]({
      resourceSets: [
        {
          resources: [
            {
              name: `Den Haag ${payload}`,
              address: { formattedAddress: `Den Haag ${payload}` },
              point: { coordinates: [52.08, 4.3] },
              bbox: [52, 4.2, 52.1, 4.4],
            },
          ],
        },
      ],
    });
    const results = await pending;

    const { control, input } = setup({
      provider: { search: async () => results },
      showPopup: true,
    });
    await type(input, 'den');
    expectText(control.resultList.container);
    expect(control.resultList.container.textContent).toContain(payload);
  });
});

describe('provider urls from options', () => {
  // urls that could run code or answer with made up results
  const rejected = [
    'javascript:window.__xss=1',
    'JAVASCRIPT:window.__xss=1',
    ' javascript:window.__xss=1',
    'java\tscript:window.__xss=1',
    'java\nscript:window.__xss=1',
    'data:application/json,[]',
    'data:text/javascript,window.__xss=1',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'blob:http://localhost/x',
  ];
  const allowed = [
    'https://geocoder.example.com/search',
    'http://geocoder.example.com/search',
    '//geocoder.example.com/search',
    '/geocoder/search',
    'geocoder/search',
  ];

  const withUrl = {
    OpenStreetMapProvider: (url) =>
      new providers.OpenStreetMapProvider({ searchUrl: url }),
    PeliasProvider: (url) => new providers.PeliasProvider({ host: url }),
    OpenGeocodingProvider: (url) =>
      new providers.OpenGeocodingProvider({ apiKey: 'k', host: url }),
    PdokNlProvider: (url) =>
      Object.assign(new providers.PdokNlProvider(), { searchUrl: url }),
  };

  describe.each(Object.keys(withUrl))('%s', (name) => {
    test.each(rejected)('rejects %j and sends nothing', async (url) => {
      const urls = answerRequests([]);

      await expect(withUrl[name](url).search({ query: 'den' })).rejects.toThrow(
        /http or https/,
      );
      expect(urls).toHaveLength(0);
      expect(window.__xss).toBeUndefined();
    });

    test.each(allowed)('sends the request to %j', async (url) => {
      const urls = answerRequests(name === 'PdokNlProvider' ? pdok : []);

      await withUrl[name](url)
        .search({ query: 'den' })
        .catch(() => {});

      expect(urls).toHaveLength(1);
    });
  });

  test('reverse requests are checked too', async () => {
    const urls = answerRequests([]);
    const provider = new providers.OpenStreetMapProvider({
      reverseUrl: 'data:application/json,[]',
    });

    await expect(provider.reverse({ lat: 52, lng: 4 })).rejects.toThrow(
      /http or https/,
    );
    expect(urls).toHaveLength(0);
  });

  test.each(rejected)('Bing adds no script for %j', async (url) => {
    const provider = new providers.BingProvider({ params: { key: 'k' } });
    provider.searchUrl = url;

    await expect(provider.search({ query: 'den' })).rejects.toThrow(
      /http or https/,
    );
    expect(document.querySelector('script')).toBeNull();
    expect(
      Object.keys(window).filter((key) => key.startsWith('BING_JSONP')),
    ).toEqual([]);
  });

  test('the control reports a bad provider url as an error', async () => {
    const provider = new providers.OpenStreetMapProvider({
      searchUrl: 'javascript:window.__xss=1',
    });
    const { control, map } = setup({ provider });
    const errors = [];
    map.on('geosearch/error', (e) => errors.push(e));

    await control.onSubmit({ query: 'den' });

    expect(errors).toHaveLength(1);
    expect(errors[0].error.message).toMatch(/http or https/);
    expect(window.__xss).toBeUndefined();
  });

  test('the endpoint itself is not changed by the check', () => {
    const provider = new providers.OpenStreetMapProvider();
    expect(
      provider.endpoint({ query: 'den', type: RequestType.SEARCH }),
    ).toEqual('https://nominatim.openstreetmap.org/search?q=den&format=json');
  });
});
