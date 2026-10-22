import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

// flyTo on its own and together with the other options that move the map,
// so turning one on doesn't quietly change or break another

const withBounds = {
  x: 4.3,
  y: 52.08,
  label: 'Den Haag',
  bounds: [
    [52.0, 4.2],
    [52.1, 4.4],
  ],
  raw: {},
};
const withoutBounds = {
  x: 4.9,
  y: 52.37,
  label: 'Amsterdam',
  bounds: null,
  raw: {},
};

function setup(options = {}, { mock = true } = {}) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = new L.Map(div, { center: [0, 0], zoom: 2 });
  if (mock) {
    ['setView', 'fitBounds', 'flyTo', 'flyToBounds'].forEach((method) =>
      vi.spyOn(map, method).mockReturnThis(),
    );
  }

  const provider = { search: vi.fn(async () => [withBounds]) };
  const control = new SearchControl({ provider, ...options }).addTo(map);

  return { map, control };
}

const moves = (map) =>
  ['setView', 'fitBounds', 'flyTo', 'flyToBounds'].filter(
    (method) => map[method].mock.calls.length,
  );

afterEach(() => {
  document.body.innerHTML = '';
});

describe('flyTo (#308)', () => {
  test('is off by default', () => {
    const { control, map } = setup();

    control.showResult(withBounds, { query: 'den' });

    expect(control.options.flyTo).toBe(false);
    expect(moves(map)).toEqual(['fitBounds']);
  });

  test('flies to the bounds of a result', () => {
    const { control, map } = setup({ flyTo: true });

    control.showResult(withBounds, { query: 'den' });

    expect(moves(map)).toEqual(['flyToBounds']);
    expect(map.flyToBounds).toHaveBeenCalledWith(withBounds.bounds, {
      animate: true,
    });
  });

  test('flies to a result without bounds at zoomLevel', () => {
    const { control, map } = setup({ flyTo: true, zoomLevel: 15 });

    control.showResult(withoutBounds, { query: 'ams' });

    expect(moves(map)).toEqual(['flyTo']);
    expect(map.flyTo).toHaveBeenCalledWith([52.37, 4.9], 15, {
      animate: true,
    });
  });

  test('takes the pan options of Leaflet, like the duration', () => {
    const { control, map } = setup({ flyTo: { duration: 1.5 } });

    control.showResult(withBounds, { query: 'den' });
    control.showResult(withoutBounds, { query: 'ams' });

    expect(map.flyToBounds).toHaveBeenCalledWith(withBounds.bounds, {
      duration: 1.5,
      animate: true,
    });
    expect(map.flyTo).toHaveBeenCalledWith([52.37, 4.9], 18, {
      duration: 1.5,
      animate: true,
    });
  });

  // without the animation, so the map is there right away. Leaflet 1 skips it
  // in happy-dom on its own, Leaflet 2 animates unless told not to
  test('ends at the result on a real map', () => {
    const { control, map } = setup(
      { flyTo: true, zoomLevel: 12, animateZoom: false },
      {
        mock: false,
      },
    );

    control.showResult(withoutBounds, { query: 'ams' });

    expect(map.getCenter().lat).toBeCloseTo(52.37, 2);
    expect(map.getCenter().lng).toBeCloseTo(4.9, 2);
    expect(map.getZoom()).toEqual(12);
  });
});

describe('flyTo with the other zoom options', () => {
  test('fitBoundsOptions are passed to flyToBounds', () => {
    const { control, map } = setup({
      flyTo: { duration: 2 },
      fitBoundsOptions: { maxZoom: 16, padding: [50, 50] },
    });

    control.showResult(withBounds, { query: 'den' });

    expect(map.flyToBounds).toHaveBeenCalledWith(withBounds.bounds, {
      maxZoom: 16,
      padding: [50, 50],
      duration: 2,
      animate: true,
    });
  });

  test('zoomToBounds false flies to the result at zoomLevel', () => {
    const { control, map } = setup({
      flyTo: true,
      zoomToBounds: false,
      zoomLevel: 20,
    });

    control.showResult(withBounds, { query: 'den' });

    expect(moves(map)).toEqual(['flyTo']);
    expect(map.flyTo).toHaveBeenCalledWith([52.08, 4.3], 20, {
      animate: true,
    });
  });

  test('retainZoomLevel flies at the current zoom', () => {
    const { control, map } = setup({ flyTo: true, retainZoomLevel: true });
    vi.spyOn(map, 'getZoom').mockReturnValue(7);

    control.showResult(withBounds, { query: 'den' });

    expect(moves(map)).toEqual(['flyTo']);
    expect(map.flyTo).toHaveBeenCalledWith(expect.anything(), 7, {
      animate: true,
    });
  });

  test('animateZoom false wins over the options of flyTo', () => {
    const { control, map } = setup({
      flyTo: { animate: true, duration: 2 },
      animateZoom: false,
    });

    control.showResult(withoutBounds, { query: 'ams' });

    // Leaflet's flyTo jumps without animation then, like setView
    expect(map.flyTo).toHaveBeenCalledWith([52.37, 4.9], 18, {
      duration: 2,
      animate: false,
    });
  });

  test('invalid bounds fall back to flying to the result', () => {
    const { control, map } = setup({ flyTo: true });

    control.showResult(
      {
        ...withBounds,
        bounds: [
          [NaN, 4.2],
          [52.1, 4.4],
        ],
      },
      { query: 'den' },
    );

    expect(moves(map)).toEqual(['flyTo']);
  });

  test('updateMap false leaves the map alone', () => {
    const { control, map } = setup({ flyTo: true, updateMap: false });

    control.showResult(withBounds, { query: 'den' });

    expect(moves(map)).toEqual([]);
  });

  test('preventDefault in geosearch/beforeshowlocation skips the flight', () => {
    const { control, map } = setup({ flyTo: true });
    map.on('geosearch/beforeshowlocation', (e) => e.preventDefault());

    control.showResult(withBounds, { query: 'den' });

    expect(moves(map)).toEqual([]);
  });

  test('the marker and the popup are still added', () => {
    const { control } = setup({ flyTo: true, showPopup: true });

    control.showResult(withBounds, { query: 'den' });

    const [marker] = control.markers.getLayers();
    expect(marker.getLatLng()).toEqual(new L.LatLng(52.08, 4.3));
    expect(marker.isPopupOpen()).toBe(true);
  });
});
