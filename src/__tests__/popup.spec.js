import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

const result = { x: 4.3, y: 52.08, label: 'Den Haag', bounds: null, raw: {} };

function setup(options = {}) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = L.map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();

  const provider = {
    search: vi.fn(async () => [result]),
    reverse: vi.fn(async () => [{ ...result, label: 'Dam' }]),
  };
  const control = new SearchControl({ provider, ...options }).addTo(map);

  return { map, control };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('marker popup', () => {
  test('popupOptions are passed to the popup (#220)', async () => {
    const { control } = setup({
      popupOptions: { maxWidth: 120, className: 'my-popup' },
    });

    await control.onSubmit({ query: 'den' });
    const popup = control.markers.getLayers()[0].getPopup();

    expect(popup.options.maxWidth).toEqual(120);
    expect(popup.options.className).toEqual('my-popup');
  });

  test('markerPopup false leaves the popup out (#176)', async () => {
    const popupFormat = vi.fn(() => 'x');
    const { control } = setup({
      markerPopup: false,
      showPopup: true,
      popupFormat,
    });

    await control.onSubmit({ query: 'den' });
    const [marker] = control.markers.getLayers();

    expect(marker.getPopup()).toBeUndefined();
    expect(popupFormat).not.toHaveBeenCalled();
  });

  test('without a popup, the reverse lookup of a dragged marker still works', async () => {
    const { control, map } = setup({
      markerPopup: false,
      marker: { draggable: true },
      reverseOnDragEnd: true,
    });
    const found = [];
    map.on('geosearch/marker/reverse', (e) => found.push(e.location.label));

    await control.onSubmit({ query: 'den' });
    const [marker] = control.markers.getLayers();
    marker.fire('dragend');
    await vi.waitFor(() => expect(found).toEqual(['Dam']));

    expect(marker.getPopup()).toBeUndefined();
  });
});
