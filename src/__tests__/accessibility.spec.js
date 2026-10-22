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

  const map = new L.Map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();
  const provider = { search: vi.fn(async () => found) };
  const control = new SearchControl({ provider, ...options }).addTo(map);
  const { input } = control.searchElement;
  const list = control.resultList.container;

  return { control, input, list };
}

async function type(input, value) {
  input.value = value;
  input.dispatchEvent(new Event('input'));
  await vi.advanceTimersByTimeAsync(250);
}

const key = (input, keyCode) =>
  input.dispatchEvent(new KeyboardEvent('keydown', { keyCode }));

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

describe('result list for screen readers (#320)', () => {
  test('the input is a combobox that controls the listbox', () => {
    const { input, list } = setup();

    expect(input.getAttribute('role')).toEqual('combobox');
    expect(input.getAttribute('aria-autocomplete')).toEqual('list');
    expect(input.getAttribute('aria-expanded')).toEqual('false');
    expect(list.getAttribute('role')).toEqual('listbox');
    expect(input.getAttribute('aria-controls')).toEqual(list.id);
    expect(list.getAttribute('aria-label')).toEqual('Enter address');
  });

  test('each control gets its own list id', () => {
    const first = setup();
    const second = setup();

    expect(first.list.id).not.toEqual(second.list.id);
  });

  test('suggestions are options, and the list is expanded while they show', async () => {
    const { input, list } = setup();

    await type(input, 'den');

    const options = Array.from(list.children);
    expect(options.map((o) => o.getAttribute('role'))).toEqual([
      'option',
      'option',
    ]);
    expect(options.map((o) => o.getAttribute('aria-selected'))).toEqual([
      'false',
      'false',
    ]);
    expect(input.getAttribute('aria-expanded')).toEqual('true');
  });

  test('arrow keys move aria-activedescendant and aria-selected', async () => {
    const { input, list } = setup();
    await type(input, 'den');

    key(input, 40);
    key(input, 40);

    const second = list.children[1];
    expect(input.getAttribute('aria-activedescendant')).toEqual(second.id);
    expect(second.getAttribute('aria-selected')).toEqual('true');
    expect(list.children[0].getAttribute('aria-selected')).toEqual('false');
  });

  test('closing the list collapses the combobox', async () => {
    const { input } = setup();
    await type(input, 'den');
    key(input, 40);

    key(input, 27);

    expect(input.getAttribute('aria-expanded')).toEqual('false');
    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
  });

  test('editing the text clears aria-activedescendant', async () => {
    const { input } = setup();
    await type(input, 'den');
    key(input, 40);

    input.dispatchEvent(new Event('input'));

    expect(input.hasAttribute('aria-activedescendant')).toBe(false);
  });

  test('the not found message is a disabled option', async () => {
    const { input, list } = setup({ notFoundMessage: 'Nothing found' }, []);

    await type(input, 'xyz');

    const message = list.children[0];
    expect(message.textContent).toEqual('Nothing found');
    expect(message.getAttribute('role')).toEqual('option');
    expect(message.getAttribute('aria-disabled')).toEqual('true');
    expect(input.getAttribute('aria-expanded')).toEqual('true');
  });

  test('setLabels renames the list too', () => {
    const { control, list } = setup();

    control.setLabels({ searchLabel: 'Adres' });

    expect(list.getAttribute('aria-label')).toEqual('Adres');
  });
});
