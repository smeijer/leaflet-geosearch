import ResultList from '../resultList';

const results = [
  { x: 1, y: 2, label: 'Amsterdam', bounds: null, raw: {} },
  { x: 3, y: 4, label: 'Rotterdam', bounds: null, raw: {} },
  { x: 5, y: 6, label: 'Utrecht', bounds: null, raw: {} },
];

const format = ({ result }) => result.label;

function setup(props = {}) {
  const parent = document.createElement('form');
  const list = new ResultList({ handleClick: vi.fn(), ...props });
  parent.appendChild(list.container);
  return { list, parent };
}

describe('ResultList', () => {
  test('renders one item per result with its index as data-key', () => {
    const { list } = setup();
    list.render(results, format);

    const items = Array.from(list.container.children);
    expect(items.map((i) => i.textContent)).toEqual([
      'Amsterdam',
      'Rotterdam',
      'Utrecht',
    ]);
    expect(items.map((i) => i.getAttribute('data-key'))).toEqual([
      '0',
      '1',
      '2',
    ]);
    expect(list.count()).toEqual(3);
  });

  test('marks the list active and its parent open when there are results', () => {
    const { list, parent } = setup();
    list.render(results, format);

    expect(list.container.classList.contains('active')).toBe(true);
    expect(parent.classList.contains('open')).toBe(true);
  });

  test('inserts the formatted result as html', () => {
    const { list } = setup();
    list.render(results.slice(0, 1), ({ result }) => `<b>${result.label}</b>`);

    expect(list.container.children[0].innerHTML).toEqual('<b>Amsterdam</b>');
  });

  test('applies the item and resultlist class names', () => {
    const { list } = setup({
      classNames: { resultlist: 'my-list', item: 'my-item' },
    });
    list.render(results, format);

    expect(list.container.className).toEqual('results my-list active');
    expect(list.container.children[0].className).toEqual('my-item');
  });

  test('shows the not found message when there are no results', () => {
    const { list, parent } = setup({
      notFoundMessage: 'Nothing found',
      classNames: { notfound: 'nf' },
    });
    list.render([], format);

    expect(list.container.children.length).toEqual(1);
    expect(list.container.children[0].className).toEqual('nf');
    expect(list.container.children[0].innerHTML).toEqual('Nothing found');
    expect(parent.classList.contains('open')).toBe(true);
    expect(list.container.classList.contains('active')).toBe(false);
  });

  test('renders nothing when there are no results and no message', () => {
    const { list, parent } = setup();
    list.render([], format);

    expect(list.container.children.length).toEqual(0);
    expect(parent.classList.contains('open')).toBe(false);
  });

  test('render replaces the previous results', () => {
    const { list } = setup();
    list.render(results, format);
    list.render(results.slice(0, 1), format);

    expect(list.container.children.length).toEqual(1);
    expect(list.count()).toEqual(1);
  });

  test('select marks only the chosen item active and returns its result', () => {
    const { list } = setup();
    list.render(results, format);

    expect(list.select(1)).toBe(results[1]);
    expect(list.selected).toEqual(1);

    const active = Array.from(list.container.children).map((c) =>
      c.classList.contains('active'),
    );
    expect(active).toEqual([false, true, false]);
  });

  test('clear removes items, resets the selection and closes the list', () => {
    const { list, parent } = setup();
    list.render(results, format);
    list.select(2);
    list.clear();

    expect(list.container.children.length).toEqual(0);
    expect(list.selected).toEqual(-1);
    expect(parent.classList.contains('open')).toBe(false);
    expect(list.container.classList.contains('active')).toBe(false);
  });

  test('clear keeps the last results for count()', () => {
    const { list } = setup();
    list.render(results, format);
    list.clear();

    // current behaviour: results are only replaced on the next render
    expect(list.count()).toEqual(3);
  });

  test('clicking an item calls handleClick with its result', () => {
    const handleClick = vi.fn();
    const { list } = setup({ handleClick });
    list.render(results, format);

    list.container.children[2].click();

    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith({ result: results[2] });
  });

  test('clicks outside of an item are ignored', () => {
    const handleClick = vi.fn();
    const { list } = setup({ handleClick });
    list.render(results, format);

    list.container.click();

    expect(handleClick).not.toHaveBeenCalled();
  });
});
