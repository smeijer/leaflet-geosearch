// Security checks: html from providers and users must not run as code,
// search text must not change the request urls, and options must not
// pollute prototypes.
import SearchControl from '../SearchControl';
import * as providers from '../providers/index';
import { RequestType } from '../providers/provider';
import randomId from '../../test/randomId';
import { answerRequests } from '../../test';

const XSS = '<img src=x onerror="window.__xss=true">';
const XSS_LABEL = `Den Haag ${XSS}`;

const place = (label = XSS_LABEL) => ({
  x: 4.3,
  y: 52.08,
  label,
  bounds: null,
  raw: {},
});

function setup(options = {}) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = new L.Map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();
  const provider = options.provider || {
    search: vi.fn(async () => [place()]),
    reverse: vi.fn(async () => [place()]),
  };
  const control = new SearchControl({ provider, ...options }).addTo(map);

  return { map, control, input: control.searchElement.input, div };
}

async function type(input, value) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await vi.advanceTimersByTimeAsync(250);
}

// no element made from the label, and the label shows as text
function expectNoHtml(root) {
  expect(root.querySelector('img')).toBeNull();
  expect(window.__xss).toBeUndefined();
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

describe('html in labels (XSS)', () => {
  test('suggestions show the label as text', async () => {
    const { control, input } = setup();

    await type(input, 'den');

    const list = control.resultList.container;
    expectNoHtml(list);
    expect(list.textContent).toContain(XSS);
  });

  test('the popup shows the label as text', async () => {
    const { control } = setup({ showPopup: true });

    await control.onSubmit({ query: 'den' });

    const content = control.markers.getLayers()[0].getPopup().getContent();
    expect(content).not.toContain('<img');
    expect(content).toContain('&lt;img');
  });

  test('the popup after a reverse lookup shows the label as text', async () => {
    const { control, map } = setup({
      marker: { draggable: true },
      reverseOnDragEnd: true,
    });
    const found = [];
    map.on('geosearch/marker/reverse', (e) => found.push(e));
    await control.onSubmit({ query: 'den' });

    const [marker] = control.markers.getLayers();
    marker.fire('dragend');
    await vi.waitFor(() => expect(found).toHaveLength(1));

    expect(marker.getPopup().getContent()).not.toContain('<img');
  });

  test('provider names in the select and in the list are text', async () => {
    const provider = { search: vi.fn(async () => [place('Amsterdam')]) };
    const { control, input } = setup({
      provider: undefined,
      providers: [
        { label: XSS, provider },
        { label: 'B', provider },
      ],
    });

    await type(input, 'ams');

    expectNoHtml(control.providerSelect);
    expectNoHtml(control.resultList.container);
    expect(control.providerSelect.options[1].text).toEqual(XSS);
  });

  test('labels set from code are text', () => {
    const { control, input } = setup();

    control.setLabels({ searchLabel: XSS, clearSearchLabel: XSS });

    expect(input.placeholder).toEqual(XSS);
    expect(control.button.getAttribute('aria-label')).toEqual(XSS);
    expectNoHtml(control.searchElement.container);
  });

  test('setQuery puts text, not html, into the input', () => {
    const { control, input } = setup();

    control.setQuery(XSS);

    expect(input.value).toEqual(XSS);
    expectNoHtml(control.searchElement.container);
  });

  test('the search label of the options is text', () => {
    const { control, input } = setup({ searchLabel: XSS });

    expect(input.placeholder).toEqual(XSS);
    expectNoHtml(control.searchElement.container);
  });
});

describe('search text in request urls (injection)', () => {
  const tricky = 'a&format=xml#x/../../admin?key=stolen';

  // every provider that builds its own url
  const built = [
    ['AMapProvider', 'address'],
    ['BingProvider', 'q'],
    ['CivilDefenseMapProvider', 'q'],
    ['EsriProvider', 'text'],
    ['GeoApiFrProvider', 'q'],
    ['GeoapifyProvider', 'text'],
    ['GeocodeEarthProvider', 'text'],
    ['HereProvider', 'q'],
    ['LegacyGoogleProvider', 'address'],
    ['LocationIQProvider', 'q'],
    ['OpenCageProvider', 'q'],
    ['OpenGeocodingProvider', 'text'],
    ['OpenStreetMapProvider', 'q'],
    ['PdokNlProvider', 'q'],
    ['PeliasProvider', 'text'],
    ['PhotonProvider', 'q'],
  ];

  test.each(built)('%s sends the text as one parameter', (name, param) => {
    const provider = new providers[name]();
    const url = new URL(
      provider.endpoint({
        query: tricky,
        type: RequestType.SEARCH,
        jsonp: 'cb',
      }),
    );
    const plain = new URL(
      provider.endpoint({
        query: 'plain',
        type: RequestType.SEARCH,
        jsonp: 'cb',
      }),
    );

    expect(url.searchParams.get(param)).toEqual(tricky);
    // the text changes no other part of the url
    expect(url.origin + url.pathname).toEqual(plain.origin + plain.pathname);
    expect(url.hash).toEqual('');
    expect([...url.searchParams.keys()].sort()).toEqual(
      [...plain.searchParams.keys()].sort(),
    );
  });

  test('MapBox puts the text into the path, encoded', () => {
    const provider = new providers.MapBoxProvider({
      params: { access_token: 'token' },
    });
    const url = new URL(
      provider.endpoint({ query: tricky, type: RequestType.SEARCH }),
    );

    expect(url.pathname).toEqual(
      `/v4/geocode/mapbox.places/${encodeURIComponent(tricky)}.json`,
    );
    expect(url.hash).toEqual('');
    expect([...url.searchParams.keys()]).toEqual(['access_token']);
  });

  test('reverse positions are encoded too', async () => {
    const urls = answerRequests([]);

    await new providers.OpenStreetMapProvider()
      .reverse({ lat: '1&lon=2', lng: 3 })
      .catch(() => {});

    expect(urls[0].searchParams.get('lat')).toEqual('1&lon=2');
    expect(urls[0].searchParams.getAll('lon')).toEqual(['3']);
  });
});

describe('options and prototypes', () => {
  test('a __proto__ key in the options pollutes nothing', () => {
    const options = JSON.parse(
      '{"__proto__": {"polluted": "yes"}, "classNames": {"__proto__": {"polluted": "yes"}}, "marker": {"__proto__": {"polluted": "yes"}}}',
    );

    const { control } = setup(options);

    expect({}.polluted).toBeUndefined();
    expect(control.options.polluted).toBeUndefined();
    expect(control.classNames.polluted).toBeUndefined();
    expect(control.options.marker.polluted).toBeUndefined();
  });

  test('a __proto__ key in setLabels pollutes nothing', () => {
    const { control } = setup();

    control.setLabels(JSON.parse('{"__proto__": {"polluted": "yes"}}'));

    expect({}.polluted).toBeUndefined();
    expect(control.options.polluted).toBeUndefined();
  });
});

describe('Bing JSONP callbacks', () => {
  function bing() {
    const provider = new providers.BingProvider({ params: { key: 'k' } });
    const scripts = () => Array.from(document.querySelectorAll('script'));
    return { provider, scripts };
  }

  test('two searches at the same moment get their own callback', async () => {
    vi.setSystemTime(new Date('2026-10-22T10:00:00Z'));
    const { provider, scripts } = bing();

    provider.search({ query: 'a' });
    provider.search({ query: 'b' });

    const callbacks = scripts().map((s) =>
      new URL(s.src).searchParams.get('jsonp'),
    );
    expect(callbacks).toHaveLength(2);
    expect(new Set(callbacks).size).toEqual(2);
  });

  test('a script that fails to load rejects instead of hanging', async () => {
    const { provider, scripts } = bing();

    const pending = provider.search({ query: 'a' });
    const [script] = scripts();
    const callback = new URL(script.src).searchParams.get('jsonp');
    script.dispatchEvent(new Event('error'));

    await expect(pending).rejects.toThrow();
    // nothing is left behind
    expect(window[callback]).toBeUndefined();
    expect(script.isConnected).toBe(false);
  });
});
