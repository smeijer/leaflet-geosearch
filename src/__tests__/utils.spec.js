import debounce from '../lib/debounce';
import hasShape from '../lib/hasShape';
import {
  addClassName,
  createElement,
  createScriptElement,
  cx,
  removeClassName,
  replaceClassName,
  stopPropagation,
} from '../domUtils';

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('calls the callback once with the last arguments after the wait', () => {
    const cb = vi.fn();
    const fn = debounce(cb, 100);

    fn('a');
    fn('b');
    vi.advanceTimersByTime(99);
    expect(cb).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cb).toHaveBeenCalledWith('b');
  });

  test('defaults to a 250ms wait', () => {
    const cb = vi.fn();
    debounce(cb)();

    vi.advanceTimersByTime(249);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(cb).toHaveBeenCalledTimes(1);
  });

  test('immediate mode never calls the callback (current behaviour)', () => {
    const cb = vi.fn();
    const fn = debounce(cb, 100, true);

    fn();
    vi.advanceTimersByTime(200);

    expect(cb).not.toHaveBeenCalled();
  });
});

describe('hasShape', () => {
  test('matches when any of the keys exist', () => {
    expect(hasShape(['a', 'b'], false, { a: 1 })).toBe(true);
    expect(hasShape(['a'], false, { b: 1 })).toBe(false);
  });

  test('exact requires exactly the given keys', () => {
    expect(hasShape(['a', 'b'], true, { a: 1, b: 2 })).toBe(true);
    expect(hasShape(['a', 'b'], true, { a: 1 })).toBe(false);
    expect(hasShape(['a'], true, { a: 1, b: 2 })).toBe(false);
  });
});

describe('domUtils', () => {
  test('createElement sets class, attributes, html, text and listeners', () => {
    const parent = document.createElement('div');
    const onClick = vi.fn();

    const el = createElement('a', 'btn primary', parent, {
      href: '#',
      'aria-label': 'Search',
      onClick,
    });

    expect(el.tagName).toEqual('A');
    expect(el.className).toEqual('btn primary');
    expect(el.getAttribute('href')).toEqual('#');
    expect(el.getAttribute('aria-label')).toEqual('Search');
    expect(parent.firstChild).toBe(el);

    el.click();
    expect(onClick).toHaveBeenCalledTimes(1);

    expect(
      createElement('div', '', null, { html: '<i>x</i>' }).innerHTML,
    ).toEqual('<i>x</i>');
  });

  test('createElement lowercases event names after the "on" prefix', () => {
    const onKeyUp = vi.fn();
    const el = createElement('input', '', null, { onKeyUp });

    el.dispatchEvent(new KeyboardEvent('keyup'));
    expect(onKeyUp).toHaveBeenCalledTimes(1);
  });

  test('cx joins truthy class names', () => {
    expect(cx('a', undefined, 'b', '')).toEqual('a b');
    expect(cx()).toEqual('');
  });

  test('add, remove and replace class names', () => {
    const el = document.createElement('div');

    addClassName(el, ['a', 'b']);
    addClassName(el, 'a');
    expect(el.className).toEqual('a b');

    removeClassName(el, 'a');
    expect(el.className).toEqual('b');

    replaceClassName(el, 'b', 'c');
    expect(el.className).toEqual('c');

    expect(() => addClassName(null, 'a')).not.toThrow();
    expect(() => removeClassName(null, 'a')).not.toThrow();
  });

  test('stopPropagation prevents default and stops propagation', () => {
    const event = new Event('click', { cancelable: true });
    const spy = vi.spyOn(event, 'stopPropagation');

    stopPropagation(event);

    expect(event.defaultPrevented).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  test('createScriptElement resolves with the JSONP payload and cleans up', async () => {
    const promise = createScriptElement('https://example.com/x', 'TEST_CB');
    const script = document.body.querySelector(
      'script[src="https://example.com/x"]',
    );
    expect(script).not.toBeNull();

    window.TEST_CB({ ok: true });

    await expect(promise).resolves.toEqual({ ok: true });
    expect(window.TEST_CB).toBeUndefined();
    expect(document.body.contains(script)).toBe(false);
  });
});
