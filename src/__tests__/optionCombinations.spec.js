import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';
import pairwise from '../../test/pairwise';

// Options together: every value of every option below meets every value of
// the others at least once. Each case types, picks the first suggestion and
// checks the outcome against what the options ask for, so an option that
// changes or breaks another one shows up here.

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
const MOVES = ['setView', 'fitBounds', 'flyTo', 'flyToBounds'];

const cases = pairwise({
  style: ['button', 'bar'],
  position: ['topleft', 'bottomright'],
  resultListPosition: ['below', 'above', 'auto'],
  theme: ['light', 'dark', 'auto'],
  showMarker: [true, false],
  markerPopup: [true, false],
  showPopup: [true, false],
  updateMap: [true, false],
  flyTo: [false, true],
  zoomToBounds: [true, false],
  retainZoomLevel: [false, true],
  keepResult: [false, true],
  autoClose: [false, true],
  requeryOnSelect: [false, true],
  maxSuggestions: [5, 1],
  draggable: [false, true],
  searchIcon: ['', '<svg viewBox="0 0 1 1"></svg>'],
  providers: ['one', 'two'],
  result: ['withBounds', 'withoutBounds'],
});

function setup(c) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = new L.Map(div, { center: [0, 0], zoom: 2 });
  MOVES.forEach((method) => vi.spyOn(map, method).mockReturnThis());

  const found = c.result === 'withBounds' ? withBounds : withoutBounds;
  const first = { search: vi.fn(async () => [found, withoutBounds]) };
  const second = { search: vi.fn(async () => [withoutBounds]) };
  // draggable goes into marker, providers and result are not options
  const { draggable, providers, ...options } = c;
  delete options.result;
  const control = new SearchControl({
    ...options,
    ...(providers === 'one'
      ? { provider: first }
      : {
          providers: [
            { label: 'First', provider: first },
            { label: 'Second', provider: second },
          ],
        }),
    marker: { draggable },
  }).addTo(map);

  const shown = [];
  map.on('geosearch/showlocation', (e) => shown.push(e));

  return { map, control, found, shown, input: control.searchElement.input };
}

const key = (input, keyCode) =>
  input.dispatchEvent(new KeyboardEvent('keydown', { keyCode }));

// what the options ask for after picking the first suggestion
function expected(c, found) {
  const fits = c.zoomToBounds && !c.retainZoomLevel && !!found.bounds;
  // autoClose clears the input and the markers, unless keepResult is on.
  // the README says so: keepResult "prevents markers to disappear while
  // using the autoClose feature"
  const marker = c.showMarker && !(c.autoClose && !c.keepResult);
  return {
    marker,
    popupBound: marker && c.markerPopup,
    popupOpen: marker && c.markerPopup && c.showPopup,
    move: !c.updateMap
      ? []
      : [
          c.flyTo
            ? fits
              ? 'flyToBounds'
              : 'flyTo'
            : fits
              ? 'fitBounds'
              : 'setView',
        ],
    input: c.keepResult || !c.autoClose ? found.label : '',
    open: c.style === 'button' && !c.autoClose,
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

test('every pair of option values is covered', () => {
  expect(cases.length).toBeGreaterThan(10);
  expect(cases.length).toBeLessThan(60);
});

describe.each(cases.map((c, index) => [index, c]))('option case %i', (_, c) => {
  test(`${JSON.stringify(c)}`, async () => {
    const { map, control, found, shown, input } = setup(c);
    const want = expected(c, found);

    // the bar has its own container, it gets the same classes
    const holder =
      c.style === 'bar' ? control.container : control.searchElement.container;
    const above =
      c.resultListPosition === 'above' ||
      (c.resultListPosition === 'auto' &&
        c.style === 'button' &&
        c.position.startsWith('bottom'));
    expect(holder.contains(control.resultList.container)).toBe(true);
    expect(holder.classList.contains('leaflet-geosearch-results-above')).toBe(
      above,
    );
    expect(
      holder.classList.contains(`leaflet-geosearch-theme-${c.theme}`),
    ).toBe(c.theme !== 'light');
    expect(!!control.button.querySelector('.leaflet-geosearch-icon')).toBe(
      !!c.searchIcon,
    );
    expect(!!holder.querySelector('select')).toBe(c.providers === 'two');

    if (c.style === 'button') {
      control.open();
    }
    input.value = 'den';
    input.dispatchEvent(new Event('input'));
    await vi.advanceTimersByTimeAsync(250);

    const items = control.resultList.container.children;
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(c.maxSuggestions);

    key(input, 40);
    key(input, 13);
    await vi.advanceTimersByTimeAsync(0);

    expect(shown).toHaveLength(1);
    expect(shown[0].location).toEqual(found);

    const markers = control.markers.getLayers();
    const visible = markers.filter((m) => map.hasLayer(m));
    expect(visible.length > 0).toBe(want.marker);

    const [marker] = visible;
    expect(!!marker?.getPopup()).toBe(want.popupBound);
    expect(!!marker?.isPopupOpen()).toBe(want.popupOpen);
    if (marker) {
      expect(marker.options.draggable).toBe(c.draggable);
      const dragged = vi.fn();
      map.on('geosearch/marker/dragend', dragged);
      marker.fire('dragend');
      expect(dragged).toHaveBeenCalledTimes(c.draggable ? 1 : 0);
    }

    expect(MOVES.filter((m) => map[m].mock.calls.length)).toEqual(want.move);

    expect(input.value).toEqual(want.input);
    expect(control.resultList.container.children).toHaveLength(0);
    expect(control.searchElement.container.classList.contains('active')).toBe(
      want.open,
    );
  });
});

// where the control and its list go needs three options at once (style,
// position and resultListPosition, #218), more than pairs cover. There are
// few of them, so all combinations
const layouts = [];
['button', 'bar'].forEach((style) =>
  ['topleft', 'topright', 'bottomleft', 'bottomright'].forEach((position) =>
    ['below', 'above', 'auto'].forEach((resultListPosition) =>
      ['light', 'dark', 'auto'].forEach((theme) =>
        layouts.push({ style, position, resultListPosition, theme }),
      ),
    ),
  ),
);

test.each(layouts)('layout %o', (layout) => {
  const { map, control } = setup({
    ...layout,
    providers: 'one',
    result: 'withBounds',
  });
  const holder =
    layout.style === 'bar'
      ? control.container
      : control.searchElement.container;
  const above =
    layout.resultListPosition === 'above' ||
    (layout.resultListPosition === 'auto' &&
      layout.style === 'button' &&
      layout.position.startsWith('bottom'));

  // the bar sits at the top of the map, the button in its corner
  const corner = map
    .getContainer()
    .querySelector(
      `.leaflet-${layout.position.replace(/(top|bottom)/, '$1.leaflet-')}`,
    );
  expect(corner.contains(control.searchElement.container)).toBe(true);
  expect(holder.parentElement).toBe(
    layout.style === 'bar'
      ? map.getContainer().querySelector('.leaflet-control-container')
      : corner,
  );

  expect(holder.contains(control.resultList.container)).toBe(true);
  expect(holder.classList.contains('leaflet-geosearch-results-above')).toBe(
    above,
  );
  expect(
    holder.classList.contains(`leaflet-geosearch-theme-${layout.theme}`),
  ).toBe(layout.theme !== 'light');
});
