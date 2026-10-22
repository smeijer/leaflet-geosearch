import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

const place = (label) => ({ x: 4, y: 52, label, bounds: null, raw: {} });

function setup(options = {}) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = L.map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();
  const provider = {
    search: vi.fn(async ({ query }) => [place(`${query} result`)]),
  };
  const control = new SearchControl({ provider, ...options }).addTo(map);

  return { control, provider, input: control.searchElement.input };
}

async function type(input, value) {
  input.value = value;
  input.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 65 }));
  await vi.advanceTimersByTimeAsync(250);
}

const labels = (control) =>
  Array.from(control.resultList.container.children).map((c) => c.textContent);

describe('minQueryLength', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('autocomplete waits until enough characters are typed', async () => {
    const { control, provider, input } = setup({ minQueryLength: 3 });

    await type(input, 'de');
    expect(provider.search).not.toHaveBeenCalled();

    await type(input, 'den');
    expect(provider.search).toHaveBeenCalledTimes(1);
    expect(labels(control)).toEqual(['den result']);
  });

  test('going below the minimum clears the suggestions', async () => {
    const { control, input } = setup({ minQueryLength: 3 });

    await type(input, 'den');
    await type(input, 'de');

    expect(labels(control)).toEqual([]);
  });

  test('enter still searches short text', async () => {
    const { control, provider } = setup({ minQueryLength: 3 });

    await control.onSubmit({ query: 'nl' });

    expect(provider.search).toHaveBeenCalledWith({ query: 'nl' });
    expect(control.markers.getLayers()).toHaveLength(1);
  });

  test('the default searches from the first character', async () => {
    const { provider, input } = setup();

    await type(input, 'd');

    expect(provider.search).toHaveBeenCalledTimes(1);
  });
});

describe('cacheSize', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  test('the same text is not requested twice', async () => {
    const { control, provider, input } = setup({ cacheSize: 10 });

    await type(input, 'den');
    await type(input, 'de');
    await type(input, 'den');

    expect(provider.search.mock.calls.map(([a]) => a.query)).toEqual([
      'den',
      'de',
    ]);
    expect(labels(control)).toEqual(['den result']);
  });

  test('enter after autocomplete uses the cached results', async () => {
    const { control, provider, input } = setup({ cacheSize: 10 });

    await type(input, 'den');
    await control.onSubmit({ query: 'den' });

    expect(provider.search).toHaveBeenCalledTimes(1);
    expect(control.markers.getLayers()).toHaveLength(1);
  });

  test('the least recently used text is dropped first', async () => {
    const { provider, input } = setup({ cacheSize: 2 });

    await type(input, 'a');
    await type(input, 'b');
    await type(input, 'a'); // a is now the most recent one
    await type(input, 'c'); // drops b
    await type(input, 'a');
    await type(input, 'b');

    expect(provider.search.mock.calls.map(([a]) => a.query)).toEqual([
      'a',
      'b',
      'c',
      'b',
    ]);
  });

  test('failed searches are not cached', async () => {
    const { provider, input } = setup({ cacheSize: 10 });
    provider.search.mockRejectedValueOnce(new Error('offline'));

    await type(input, 'den');
    await type(input, '');
    await type(input, 'den');

    expect(provider.search).toHaveBeenCalledTimes(2);
  });

  test('without cacheSize every search goes to the provider', async () => {
    const { provider, input } = setup();

    await type(input, 'den');
    await type(input, 'de');
    await type(input, 'den');

    expect(provider.search).toHaveBeenCalledTimes(3);
  });
});
