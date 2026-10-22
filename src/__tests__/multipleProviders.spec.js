import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

const place = (label, x = 4, y = 52) => ({
  x,
  y,
  label,
  bounds: null,
  raw: {},
});

const fakeProvider = (results) => ({ search: vi.fn(async () => results) });

const failingProvider = (error = new Error('down')) => ({
  search: vi.fn(async () => {
    throw error;
  }),
});

function setup(options) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = L.map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();
  vi.spyOn(map, 'fitBounds').mockReturnThis();

  const control = new SearchControl(options).addTo(map);
  const events = { error: [], providerchange: [], showlocation: [] };
  Object.keys(events).forEach((name) =>
    map.on(`geosearch/${name}`, (e) => events[name].push(e)),
  );

  return { map, control, events, input: control.searchElement.input };
}

async function type(input, value) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await vi.advanceTimersByTimeAsync(250);
}

const items = (control) => Array.from(control.resultList.container.children);
const labels = (control) => items(control).map((item) => item.textContent);

function twoProviders(options = {}) {
  const osm = fakeProvider([place('Amsterdam'), place('Amstelveen')]);
  const esri = fakeProvider([place('Amsterdam, NLD'), place('Amstel, NLD')]);
  const setupResult = setup({
    providers: [
      { label: 'OpenStreetMap', provider: osm },
      { label: 'Esri', provider: esri },
    ],
    ...options,
  });

  return { osm, esri, ...setupResult };
}

describe('several providers', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('a single provider has no select and the same markup as before', () => {
    const { control, input } = setup({ provider: fakeProvider([]) });

    expect(control.providerSelect).toBeUndefined();
    expect(input.parentElement).toBe(control.searchElement.form);
  });

  test('the select lists all providers after the all option', () => {
    const { control } = twoProviders();
    const select = control.providerSelect;

    expect(select.getAttribute('aria-label')).toEqual('Search with');
    expect(Array.from(select.options).map((o) => [o.value, o.text])).toEqual([
      ['all', 'All'],
      ['0', 'OpenStreetMap'],
      ['1', 'Esri'],
    ]);
    expect(select.value).toEqual('all');
    expect(control.getSelectedProvider()).toEqual({
      index: 'all',
      label: 'All',
    });
  });

  test('options.provider is the first provider', () => {
    const { control, osm } = twoProviders();

    expect(control.options.provider).toBe(osm);
  });

  test('all searches every provider and mixes their results', async () => {
    const { control, input, osm, esri } = twoProviders({ maxSuggestions: 3 });

    await type(input, 'ams');

    expect(osm.search).toHaveBeenCalledTimes(1);
    expect(esri.search).toHaveBeenCalledTimes(1);
    expect(labels(control)).toEqual([
      'OpenStreetMapAmsterdam',
      'EsriAmsterdam, NLD',
      'OpenStreetMapAmstelveen',
    ]);
    expect(items(control)[1].querySelector('.provider').textContent).toEqual(
      'Esri',
    );
  });

  test('provider names in the list are escaped', async () => {
    const { control, input } = setup({
      providers: [
        { label: '<b>A</b>', provider: fakeProvider([place('x')]) },
        { label: 'B', provider: fakeProvider([]) },
      ],
    });

    await type(input, 'x');

    expect(items(control)[0].querySelector('b')).toBeNull();
    expect(labels(control)).toEqual(['<b>A</b>x']);
  });

  test('a failing provider leaves the others, without the error style', async () => {
    const error = new Error('down');
    const ok = fakeProvider([place('Amsterdam')]);
    const { control, input, events } = setup({
      providers: [
        { label: 'Broken', provider: failingProvider(error) },
        { label: 'Works', provider: ok },
      ],
    });

    await type(input, 'ams');

    expect(labels(control)).toEqual(['WorksAmsterdam']);
    expect(events.error).toHaveLength(1);
    expect(events.error[0]).toMatchObject({
      error,
      query: 'ams',
      source: 'autocomplete',
      provider: { index: 0, label: 'Broken' },
    });
    expect(control.searchElement.container.classList).not.toContain('error');
  });

  test('when every provider fails, the error style shows', async () => {
    const { control, input, events } = setup({
      providers: [
        { label: 'A', provider: failingProvider() },
        { label: 'B', provider: failingProvider() },
      ],
    });

    await type(input, 'ams');

    expect(events.error).toHaveLength(2);
    expect(control.searchElement.container.classList).toContain('error');
  });

  test('picking a provider searches the typed text with it', async () => {
    const { control, input, osm, esri, events } = twoProviders();
    await type(input, 'ams');

    control.providerSelect.value = '1';
    control.providerSelect.dispatchEvent(new Event('change'));
    await vi.advanceTimersByTimeAsync(0);

    expect(esri.search).toHaveBeenCalledTimes(2);
    expect(osm.search).toHaveBeenCalledTimes(1);
    // one provider, so no provider names in the list
    expect(labels(control)).toEqual(['Amsterdam, NLD', 'Amstel, NLD']);
    expect(events.providerchange).toHaveLength(1);
    expect(events.providerchange[0].provider).toEqual({
      index: 1,
      label: 'Esri',
      provider: esri,
    });
  });

  test('selectProvider updates the select', () => {
    const { control, events } = twoProviders();

    control.selectProvider(0);
    control.selectProvider(0);

    expect(control.providerSelect.value).toEqual('0');
    expect(control.getSelectedProvider().label).toEqual('OpenStreetMap');
    // selecting the same provider again changes nothing
    expect(events.providerchange).toHaveLength(1);
  });

  test('selectProvider throws for a provider that does not exist', () => {
    const { control } = twoProviders({ allProvidersLabel: false });

    expect(() => control.selectProvider(5)).toThrow();
    expect(() => control.selectProvider('all')).toThrow();
  });

  test('allProvidersLabel false leaves out the all option', async () => {
    const { control, input, osm, esri } = twoProviders({
      allProvidersLabel: false,
    });

    await type(input, 'ams');

    expect(
      Array.from(control.providerSelect.options).map((o) => o.value),
    ).toEqual(['0', '1']);
    expect(osm.search).toHaveBeenCalledTimes(1);
    expect(esri.search).not.toHaveBeenCalled();
  });

  test('the select can be hidden and shown again', () => {
    const { control } = twoProviders({ showProviderSelect: false });

    expect(control.providerSelect.hidden).toBe(true);

    control.setProviderSelectVisible(true);

    expect(control.providerSelect.hidden).toBe(false);
    expect(control.options.showProviderSelect).toBe(true);
  });

  test('formatters and the showlocation event get the provider', async () => {
    const resultFormat = vi.fn(({ result }) => result.label);
    const popupFormat = vi.fn(({ result }) => result.label);
    const { control, input, events, esri } = twoProviders({
      resultFormat,
      popupFormat,
    });
    await type(input, 'ams');

    // the click lands on the provider name inside the item
    items(control)[1].querySelector('.provider').click();
    await vi.advanceTimersByTimeAsync(0);

    const provider = { index: 1, label: 'Esri', provider: esri };
    expect(resultFormat).toHaveBeenCalledWith({
      result: expect.objectContaining({ label: 'Amsterdam, NLD' }),
      provider,
    });
    expect(popupFormat).toHaveBeenCalledWith(
      expect.objectContaining({ provider }),
    );
    expect(events.showlocation[0].location.label).toEqual('Amsterdam, NLD');
    expect(events.showlocation[0].provider).toEqual(provider);
  });

  test('requeryOnSelect searches with the provider that found the result', async () => {
    const { control, input, osm, esri } = twoProviders({
      requeryOnSelect: true,
    });
    await type(input, 'ams');

    items(control)[1].click();
    await vi.advanceTimersByTimeAsync(0);

    expect(esri.search).toHaveBeenCalledTimes(2);
    expect(osm.search).toHaveBeenCalledTimes(1);
  });

  test('the cache keeps the results of each provider apart', async () => {
    const { control, input, osm, esri } = twoProviders({
      allProvidersLabel: false,
      cacheSize: 10,
    });
    await type(input, 'ams');

    control.selectProvider(1);
    await vi.advanceTimersByTimeAsync(0);
    control.selectProvider(0);
    await vi.advanceTimersByTimeAsync(0);

    expect(osm.search).toHaveBeenCalledTimes(1);
    expect(esri.search).toHaveBeenCalledTimes(1);
    expect(labels(control)).toEqual(['Amsterdam', 'Amstelveen']);
  });
});

describe('fallback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  function fallbackSetup(first, fallback) {
    const second = fakeProvider([place('Amsterdam')]);
    const result = setup({
      providers: [
        { label: 'First', provider: first },
        { label: 'Second', provider: second },
      ],
      showProviderSelect: false,
      allProvidersLabel: false,
      fallback,
    });

    return { second, ...result };
  }

  test('off by default: a failing provider is not replaced', async () => {
    const { control, input, second, events } = fallbackSetup(
      failingProvider(),
      false,
    );

    await type(input, 'ams');

    expect(second.search).not.toHaveBeenCalled();
    expect(events.error).toHaveLength(1);
    expect(control.searchElement.container.classList).toContain('error');
  });

  test("'error' searches the next provider when one fails", async () => {
    const { control, input, second, events } = fallbackSetup(
      failingProvider(),
      'error',
    );

    await type(input, 'ams');

    expect(second.search).toHaveBeenCalledTimes(1);
    expect(labels(control)).toEqual(['Amsterdam']);
    // the failure is still reported, but without the error style
    expect(events.error[0].provider.label).toEqual('First');
    expect(control.searchElement.container.classList).not.toContain('error');
  });

  test("'error' keeps an empty answer", async () => {
    const { input, second } = fallbackSetup(fakeProvider([]), 'error');

    await type(input, 'ams');

    expect(second.search).not.toHaveBeenCalled();
  });

  test("'empty' also searches the next provider when one finds nothing", async () => {
    const { control, input, second } = fallbackSetup(fakeProvider([]), 'empty');

    await type(input, 'ams');

    expect(second.search).toHaveBeenCalledTimes(1);
    expect(labels(control)).toEqual(['Amsterdam']);
  });

  test('works for submits too', async () => {
    const { control, events, second } = fallbackSetup(
      failingProvider(),
      'error',
    );

    await control.onSubmit({ query: 'ams' });

    expect(second.search).toHaveBeenCalledTimes(1);
    expect(events.showlocation[0].provider.label).toEqual('Second');
  });

  test('an aborted search does not fall back', async () => {
    let rejectFirst;
    const first = {
      search: vi.fn(
        () =>
          new Promise((resolve, reject) => {
            rejectFirst = reject;
          }),
      ),
    };
    const { input, second } = fallbackSetup(first, 'error');
    await type(input, 'ams');

    // a newer search aborts the first one
    first.search.mockResolvedValueOnce([]);
    await type(input, 'amst');
    rejectFirst(new DOMException('aborted', 'AbortError'));
    await vi.advanceTimersByTimeAsync(0);

    expect(second.search).not.toHaveBeenCalledWith(
      expect.objectContaining({ query: 'ams' }),
    );
  });
});
