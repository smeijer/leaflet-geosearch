import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

const result = { x: 4.3, y: 52.08, label: 'Den Haag', bounds: null, raw: {} };

function setup(options = {}) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = L.map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();
  const provider = { search: vi.fn(async () => [result]) };
  const control = new SearchControl({ provider, ...options }).addTo(map);

  return { control, map };
}

describe('option merging', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('undefined options keep their default (#325)', async () => {
    const { control } = setup({
      marker: undefined,
      position: undefined,
      style: undefined,
      maxMarkers: undefined,
      searchLabel: undefined,
    });

    expect(control.options.position).toEqual('topleft');
    expect(control.options.style).toEqual('button');
    expect(control.options.maxMarkers).toEqual(1);
    expect(control.searchElement.input.placeholder).toEqual('Enter address');

    await control.onSubmit({ query: 'den' });
    expect(control.markers.getLayers()).toHaveLength(1);
  });

  test('marker options are merged with the defaults', () => {
    const { control } = setup({ marker: { draggable: true } });

    expect(control.options.marker.draggable).toBe(true);
    expect(control.options.marker.icon).toBeInstanceOf(L.Icon.Default);
  });

  test('a custom marker icon replaces the default one', () => {
    const icon = L.divIcon();
    const { control } = setup({ marker: { icon } });

    expect(control.options.marker.icon).toBe(icon);
    expect(control.options.marker.draggable).toBe(false);
  });

  test('undefined class names keep their default', () => {
    const { control } = setup({
      classNames: { container: undefined, input: 'my-input' },
    });

    expect(control.searchElement.container.className).toContain(
      'leaflet-control-geosearch leaflet-geosearch-button',
    );
    expect(control.searchElement.container.className).not.toContain(
      'undefined',
    );
    expect(control.searchElement.input.className).toEqual('glass my-input');
  });

  test('null is a value, not a missing option', () => {
    const { control } = setup({ notFoundMessage: null });

    expect(control.options.notFoundMessage).toBeNull();
  });

  test('the defaults of other controls are not changed', () => {
    setup({ marker: { draggable: true }, classNames: { input: 'x' } });
    const { control } = setup();

    expect(control.options.marker.draggable).toBe(false);
    expect(control.searchElement.input.className).toEqual('glass');
  });
});
