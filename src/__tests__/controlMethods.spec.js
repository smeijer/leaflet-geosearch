import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

const results = [
  { x: 4.3, y: 52.08, label: 'Den Haag', bounds: null, raw: {} },
  { x: 4.9, y: 52.37, label: 'Amsterdam', bounds: null, raw: {} },
];

function setup(options = {}, found = results) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = L.map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();

  const provider = { search: vi.fn(async () => found) };
  const control = new SearchControl({ provider, ...options }).addTo(map);
  const { input } = control.searchElement;

  return { map, control, provider, input };
}

async function type(input, value) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await vi.advanceTimersByTimeAsync(250);
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('reset (#203, #330)', () => {
  test('clears the input, the suggestions and the markers', async () => {
    const { control, input } = setup({ keepResult: true });
    await type(input, 'den');
    await control.onSubmit({ query: 'den' });

    control.reset();

    expect(input.value).toEqual('');
    expect(control.markers.getLayers()).toHaveLength(0);
    expect(control.resultList.container.children).toHaveLength(0);
  });

  test('drops a search that is still running', async () => {
    let answer;
    const provider = {
      search: vi.fn(() => new Promise((resolve) => (answer = resolve))),
    };
    const { control, input } = setup({ provider });
    await type(input, 'den');

    control.reset();
    answer(results);
    await vi.advanceTimersByTimeAsync(0);

    expect(control.resultList.container.children).toHaveLength(0);
  });

  test('removes the error style', async () => {
    const provider = {
      search: vi.fn(async () => Promise.reject(new Error('down'))),
    };
    const { control } = setup({ provider });
    await control.onSubmit({ query: 'den' });
    expect(control.searchElement.container.classList).toContain('error');

    control.reset();

    expect(control.searchElement.container.classList).not.toContain('error');
  });

  test('works without a result list', () => {
    const { control, input } = setup({ autoComplete: false });
    input.value = 'den';

    control.reset();

    expect(input.value).toEqual('');
  });
});

describe('setQuery (#360)', () => {
  test('puts text into the input without searching', async () => {
    const { control, provider, input } = setup();

    control.setQuery('Amsterdam');
    await vi.advanceTimersByTimeAsync(500);

    expect(input.value).toEqual('Amsterdam');
    expect(provider.search).not.toHaveBeenCalled();
  });

  test('forgets the selected suggestion, so enter searches the new text', async () => {
    const { control, provider, input } = setup();
    await type(input, 'den');
    input.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 40 }));

    control.setQuery('Rotterdam');
    input.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }));
    await vi.advanceTimersByTimeAsync(0);

    expect(provider.search).toHaveBeenLastCalledWith({
      query: 'Rotterdam',
      data: undefined,
    });
  });
});

describe('setLabels (#314)', () => {
  test('changes the placeholder and the names of the buttons', () => {
    const { control, input } = setup();

    control.setLabels({
      searchLabel: 'Adres girin',
      clearSearchLabel: 'Temizle',
    });

    expect(input.placeholder).toEqual('Adres girin');
    expect(control.button.title).toEqual('Adres girin');
    expect(control.button.getAttribute('aria-label')).toEqual('Adres girin');
    expect(control.resetButton.getAttribute('aria-label')).toEqual('Temizle');
    expect(control.options.searchLabel).toEqual('Adres girin');
  });

  test('changes the not found message, also when there was none', async () => {
    const { control, input } = setup({}, []);

    control.setLabels({ notFoundMessage: 'Bulunamadı' });
    await type(input, 'xyz');

    expect(control.resultList.container.textContent).toContain('Bulunamadı');
  });

  test('an empty not found message shows nothing', async () => {
    const { control } = setup(
      { notFoundMessage: 'nothing', showResultListOnSubmit: true },
      [],
    );

    control.setLabels({ notFoundMessage: '' });
    await control.onSubmit({ query: 'xyz' });

    expect(control.resultList.container.textContent).toEqual('');
  });

  test('changes the name of the provider select', () => {
    const provider = { search: vi.fn(async () => []) };
    const { control } = setup({
      provider: undefined,
      providers: [
        { label: 'A', provider },
        { label: 'B', provider },
      ],
    });

    control.setLabels({ providerSelectLabel: 'Arama servisi' });

    expect(control.providerSelect.getAttribute('aria-label')).toEqual(
      'Arama servisi',
    );
  });

  test('labels left out or undefined stay as they are', () => {
    const { control, input } = setup({ searchLabel: 'Search' });

    control.setLabels({ searchLabel: undefined, clearSearchLabel: 'Clear' });

    expect(input.placeholder).toEqual('Search');
  });
});
