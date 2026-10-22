import { http, HttpResponse } from 'msw';
import SearchControl from '../SearchControl';
import SearchElement from '../SearchElement';
import { LocationIQProvider, OpenStreetMapProvider } from '../providers/index';
import randomId from '../../test/randomId';

function setup(provider, options = {}) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = L.map(div, { center: [0, 0], zoom: 2 });
  const control = new SearchControl({ provider, ...options }).addTo(map);
  const errors = [];
  map.on('geosearch/error', (e) => errors.push(e));

  return { map, control, errors, input: control.searchElement.input };
}

const failing = (error = new Error('offline')) => ({
  search: vi.fn(async () => {
    throw error;
  }),
});

describe('failed searches', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('a failed submit fires geosearch/error and shows the error state', async () => {
    const error = new Error('offline');
    const { control, errors } = setup(failing(error));

    await expect(control.onSubmit({ query: 'den' })).resolves.toBeUndefined();

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({ error, query: 'den', source: 'submit' });
    expect(control.searchElement.container.classList.contains('error')).toBe(
      true,
    );
    expect(control.markers.getLayers()).toHaveLength(0);
  });

  test('a failed autocomplete fires geosearch/error and keeps the old list', async () => {
    vi.useFakeTimers();
    const error = new Error('offline');
    const { control, errors, input } = setup(failing(error));

    input.value = 'den';
    input.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 65 }));
    await vi.advanceTimersByTimeAsync(250);
    vi.useRealTimers();

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      error,
      query: 'den',
      source: 'autocomplete',
    });
    expect(control.resultList.container.children.length).toEqual(0);
  });

  test('typing again clears the error state', async () => {
    const { control, input } = setup(failing());
    await control.onSubmit({ query: 'den' });

    input.dispatchEvent(new Event('input'));

    expect(control.searchElement.container.classList.contains('error')).toBe(
      false,
    );
    expect(control.searchElement.hasError).toBe(false);
  });

  test('enter in the input clears the pending state after a failure', async () => {
    const { control, input } = setup(failing());
    input.value = 'den';

    input.dispatchEvent(new KeyboardEvent('keypress', { keyCode: 13 }));
    await new Promise((r) => setTimeout(r, 0));

    const { classList } = control.searchElement.container;
    expect(classList.contains('pending')).toBe(false);
    expect(classList.contains('error')).toBe(true);
  });

  test('a successful search after a failure works as before', async () => {
    const provider = failing();
    const { control } = setup(provider);
    await control.onSubmit({ query: 'den' });

    provider.search.mockResolvedValueOnce([
      { x: 1, y: 2, label: 'ok', bounds: null, raw: {} },
    ]);
    await control.onSubmit({ query: 'den' });

    expect(control.markers.getLayers()).toHaveLength(1);
  });
});

describe('SearchElement used on its own', () => {
  test('a throwing handleSubmit still clears pending and is rethrown', async () => {
    const error = new Error('boom');
    const element = new SearchElement({
      handleSubmit: async () => {
        throw error;
      },
    });

    await expect(element.onSubmit(new Event('submit'))).rejects.toBe(error);

    expect(element.container.classList.contains('pending')).toBe(false);
    expect(element.container.classList.contains('error')).toBe(true);
  });
});

describe('provider http errors', () => {
  test('a non json error response rejects with the status', async () => {
    globalThis.server.use(
      http.get(
        'https://nominatim.openstreetmap.org/search',
        () =>
          new HttpResponse('<html>blocked</html>', {
            status: 418,
            statusText: "I'm a Teapot",
            headers: { 'Content-Type': 'text/html' },
          }),
      ),
    );

    await expect(
      new OpenStreetMapProvider().search({ query: 'paris' }),
    ).rejects.toThrow("Request failed with status 418 I'm a Teapot");
  });

  test('a json error response is still parsed (LocationIQ "no results")', async () => {
    globalThis.server.use(
      http.get('https://locationiq.org/v1/search.php', () =>
        HttpResponse.json({ error: 'Unable to geocode' }, { status: 404 }),
      ),
    );

    await expect(
      new LocationIQProvider({ params: { key: 'x' } }).search({
        query: 'nowhere',
      }),
    ).resolves.toEqual([]);
  });

  test('network errors are passed on', async () => {
    globalThis.server.use(
      http.get('https://nominatim.openstreetmap.org/search', () =>
        HttpResponse.error(),
      ),
    );

    await expect(
      new OpenStreetMapProvider().search({ query: 'paris' }),
    ).rejects.toThrow();
  });
});
