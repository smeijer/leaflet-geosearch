import SearchControl from '../SearchControl';
import { escapeHtml } from '../domUtils';
import randomId from '../../test/randomId';

const evil = '<img src=x onerror="window.__xss = true">Den Haag & co';

function setup(options = {}) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = L.map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();
  const result = { x: 4.3, y: 52.08, label: evil, bounds: null, raw: {} };
  const provider = { search: vi.fn(async () => [result]) };
  const control = new SearchControl({ provider, ...options }).addTo(map);

  return { control, input: control.searchElement.input };
}

describe('escaping provider labels', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    delete window.__xss;
  });

  test('suggestions show the label as text', async () => {
    const { control, input } = setup();

    input.value = 'den';
    input.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 65 }));
    await vi.advanceTimersByTimeAsync(250);

    const item = control.resultList.container.children[0];
    expect(item.querySelector('img')).toBeNull();
    expect(item.textContent).toEqual(evil);
    expect(window.__xss).toBeUndefined();
  });

  test('the popup shows the label as text', async () => {
    const { control } = setup();

    await control.onSubmit({ query: 'den' });

    const content = control.markers.getLayers()[0].getPopup().getContent();
    expect(content).toEqual(
      '&lt;img src=x onerror=&quot;window.__xss = true&quot;&gt;Den Haag &amp; co',
    );
  });

  test('custom formatters can still return html', async () => {
    const { control, input } = setup({
      resultFormat: ({ result }) => `<b>${escapeHtml(result.label)}</b>`,
      popupFormat: () => '<b>picked</b>',
    });

    input.value = 'den';
    input.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 65 }));
    await vi.advanceTimersByTimeAsync(250);
    expect(control.resultList.container.querySelector('b')).not.toBeNull();

    await control.onSubmit({ query: 'den' });
    expect(control.markers.getLayers()[0].getPopup().getContent()).toEqual(
      '<b>picked</b>',
    );
  });
});

test('escapeHtml', () => {
  expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toEqual(
    '&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;',
  );
  expect(escapeHtml('Den Haag')).toEqual('Den Haag');
  expect(escapeHtml(42)).toEqual('42');
});
