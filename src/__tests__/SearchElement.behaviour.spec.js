import SearchElement from '../SearchElement';

function setup(props = {}) {
  const handleSubmit = vi.fn(async () => undefined);
  const element = new SearchElement({ handleSubmit, ...props });
  document.body.appendChild(element.container);
  return { element, handleSubmit };
}

function key(target, type, keyCode) {
  target.dispatchEvent(new KeyboardEvent(type, { keyCode, bubbles: true }));
}

describe('SearchElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders a form with a text input', () => {
    const { element } = setup({
      classNames: { container: 'c', form: 'f', input: 'i' },
    });

    expect(element.container.className).toEqual('geosearch c');
    expect(element.form.className).toEqual('f');
    expect(element.form.getAttribute('autocomplete')).toEqual('none');
    expect(element.input.className).toEqual('glass i');
    expect(element.input.type).toEqual('text');
    expect(element.input.name).toEqual('geosearch');
  });

  test('uses "search" as the default placeholder', () => {
    const { element } = setup();
    expect(element.input.placeholder).toEqual('search');
  });

  test('enter submits the input value and toggles the pending class', async () => {
    let resolve;
    const handleSubmit = vi.fn(() => new Promise((r) => (resolve = r)));
    const { element } = setup({ handleSubmit });
    element.container.classList.add('error');
    element.input.value = 'Den Haag';

    key(element.input, 'keypress', 13);

    expect(handleSubmit).toHaveBeenCalledWith({ query: 'Den Haag' });
    expect(element.container.classList.contains('pending')).toBe(true);
    expect(element.container.classList.contains('error')).toBe(false);

    resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(element.container.classList.contains('pending')).toBe(false);
  });

  test('other keys do not submit', () => {
    const { element, handleSubmit } = setup();

    key(element.input, 'keypress', 65);

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  test('escape clears the input and removes pending and active', () => {
    const { element } = setup();
    element.container.classList.add('pending', 'active');
    element.input.value = 'Den Haag';

    key(element.input, 'keyup', 27);

    expect(element.input.value).toEqual('');
    expect(element.container.classList.contains('pending')).toBe(false);
    expect(element.container.classList.contains('active')).toBe(false);
  });

  test('focus and blur toggle the active class on the form', () => {
    const { element } = setup();

    element.input.dispatchEvent(new Event('focus'));
    expect(element.form.classList.contains('active')).toBe(true);

    element.input.dispatchEvent(new Event('blur'));
    expect(element.form.classList.contains('active')).toBe(false);
  });

  test('setQuery sets the input value', () => {
    const { element } = setup();

    element.setQuery('Utrecht');

    expect(element.input.value).toEqual('Utrecht');
  });
});
