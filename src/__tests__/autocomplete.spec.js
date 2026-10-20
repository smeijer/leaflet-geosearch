import { http, HttpResponse } from 'msw';
import SearchControl from '../SearchControl';
import { OpenStreetMapProvider } from '../providers/index';
import randomId from '../../test/randomId';

const place = (label) => ({ x: 4, y: 52, label, bounds: null, raw: {} });

function setup(provider, options = {}) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = L.map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();
  const control = new SearchControl({ provider, ...options }).addTo(map);
  const errors = [];
  map.on('geosearch/error', (e) => errors.push(e));

  return { map, control, errors, input: control.searchElement.input };
}

const labels = (control) =>
  Array.from(control.resultList.container.children).map((c) => c.textContent);

// a provider whose searches resolve when the test says so
function controlledProvider() {
  const pending = [];
  const provider = {
    search: vi.fn(
      ({ query, signal }) =>
        new Promise((resolve, reject) => {
          pending.push({ query, signal, resolve, reject });
          signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    ),
  };
  return { provider, pending };
}

async function type(input, value, event = 'keyup') {
  input.value = value;
  input.dispatchEvent(
    event === 'keyup'
      ? new KeyboardEvent('keyup', { keyCode: 65 })
      : new Event('input'),
  );
  await vi.advanceTimersByTimeAsync(250);
}

describe('autocomplete requests', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('a slow older response does not replace newer results', async () => {
    const { provider, pending } = controlledProvider();
    const { control, input } = setup(provider);

    await type(input, 'ams');
    await type(input, 'amst');

    // the newer search answers first
    pending[1].resolve([place('Amsterdam')]);
    await vi.advanceTimersByTimeAsync(0);
    // the older one is aborted and must not show up
    pending[0].resolve([place('Amstelveen')]);
    await vi.advanceTimersByTimeAsync(0);

    expect(labels(control)).toEqual(['Amsterdam']);
  });

  test('starting a new search aborts the previous request', async () => {
    const { provider, pending } = controlledProvider();
    const { input, errors } = setup(provider);

    await type(input, 'ams');
    await type(input, 'amst');

    expect(pending[0].signal.aborted).toBe(true);
    expect(pending[1].signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(0);
    // aborting is not an error worth reporting
    expect(errors).toHaveLength(0);
  });

  test('results that arrive after a suggestion was picked are dropped', async () => {
    const { provider, pending } = controlledProvider();
    const { control, input } = setup(provider);

    await type(input, 'ams');
    pending[0].resolve([place('Amsterdam')]);
    await vi.advanceTimersByTimeAsync(0);

    await type(input, 'amst');
    // pick the visible suggestion while the second search is still running
    control.resultList.container.children[0].click();
    await vi.advanceTimersByTimeAsync(0);

    pending[1].resolve([place('Amstelveen')]);
    await vi.advanceTimersByTimeAsync(0);

    expect(control.resultList.container.children).toHaveLength(0);
    expect(control.markers.getLayers()).toHaveLength(1);
  });

  test('escape drops a pending search', async () => {
    const { provider, pending } = controlledProvider();
    const { control, input } = setup(provider);

    await type(input, 'ams');
    input.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 27 }));
    pending[0].resolve([place('Amsterdam')]);
    await vi.advanceTimersByTimeAsync(0);

    expect(labels(control)).toEqual([]);
  });

  test('clearing the input drops a pending search', async () => {
    const { provider, pending } = controlledProvider();
    const { control, input } = setup(provider);

    await type(input, 'ams');
    await type(input, '');
    pending[0].resolve([place('Amsterdam')]);
    await vi.advanceTimersByTimeAsync(0);

    expect(labels(control)).toEqual([]);
  });

  test('a failed search can be retried with the same text', async () => {
    const provider = {
      search: vi
        .fn()
        .mockRejectedValueOnce(new Error('offline'))
        .mockResolvedValueOnce([place('Amsterdam')]),
    };
    const { control, input, errors } = setup(provider);

    await type(input, 'ams');
    expect(errors).toHaveLength(1);

    // e.g. pressing shift after the connection is back
    input.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 16 }));
    await vi.advanceTimersByTimeAsync(250);

    expect(provider.search).toHaveBeenCalledTimes(2);
    expect(labels(control)).toEqual(['Amsterdam']);
  });

  test('typing the same text again after clearing searches again', async () => {
    const provider = { search: vi.fn(async () => [place('Amsterdam')]) };
    const { input } = setup(provider);

    await type(input, 'ams');
    await type(input, '');
    await type(input, 'ams');

    expect(provider.search).toHaveBeenCalledTimes(2);
  });

  test('pasting text (input event) searches', async () => {
    const provider = { search: vi.fn(async () => [place('Amsterdam')]) };
    const { control, input } = setup(provider);

    await type(input, 'amsterdam', 'input');

    expect(provider.search).toHaveBeenCalledTimes(1);
    expect(labels(control)).toEqual(['Amsterdam']);
  });

  test('keyup and input for the same keystroke search once', async () => {
    const provider = { search: vi.fn(async () => [place('Amsterdam')]) };
    const { input } = setup(provider);

    input.value = 'ams';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 65 }));
    await vi.advanceTimersByTimeAsync(250);

    expect(provider.search).toHaveBeenCalledTimes(1);
  });
});

describe('providers and abort signals', () => {
  test('the default provider passes the signal to fetch', async () => {
    // happy-dom ignores aborts of intercepted requests, so check the hand-off
    globalThis.server.use(
      http.get('https://nominatim.openstreetmap.org/search', () =>
        HttpResponse.json([]),
      ),
    );
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { signal } = new AbortController();

    await new OpenStreetMapProvider().search({ query: 'paris', signal });

    expect(fetchSpy).toHaveBeenCalledWith(expect.any(String), { signal });
    fetchSpy.mockRestore();
  });

  test('providers still work without a signal', async () => {
    globalThis.server.use(
      http.get('https://nominatim.openstreetmap.org/search', () =>
        HttpResponse.json([]),
      ),
    );

    await expect(
      new OpenStreetMapProvider().search({ query: 'paris' }),
    ).resolves.toEqual([]);
  });
});
