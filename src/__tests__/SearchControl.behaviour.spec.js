import SearchControl from '../SearchControl';
import randomId from '../../test/randomId';

// Characterization tests: they describe how the control behaves today, so
// that later fixes only change behaviour on purpose.

const results = [
  {
    x: 4.3,
    y: 52.08,
    label: 'Den Haag',
    bounds: [
      [52.0, 4.2],
      [52.1, 4.4],
    ],
    raw: {},
  },
  { x: 4.9, y: 52.37, label: 'Amsterdam', bounds: null, raw: {} },
  { x: 4.48, y: 51.92, label: 'Rotterdam', bounds: null, raw: {} },
];

const KEY = { enter: 13, escape: 27, up: 38, down: 40, a: 65 };

function setup(options = {}, providerResults = results) {
  const div = document.createElement('div');
  div.id = randomId();
  document.body.appendChild(div);

  const map = new L.Map(div, { center: [0, 0], zoom: 2 });
  vi.spyOn(map, 'setView').mockReturnThis();
  vi.spyOn(map, 'fitBounds').mockReturnThis();

  const provider = { search: vi.fn(async () => providerResults) };
  const control = new SearchControl({ provider, ...options }).addTo(map);
  const { input } = control.searchElement;

  return { map, div, provider, control, input };
}

function key(target, type, keyCode) {
  target.dispatchEvent(new KeyboardEvent(type, { keyCode, bubbles: true }));
}

async function type(input, value) {
  input.value = value;
  key(input, 'keyup', KEY.a);
  await vi.advanceTimersByTimeAsync(250);
}

describe('SearchControl', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('construction', () => {
    test('throws without a provider', () => {
      expect(() => new SearchControl({})).toThrow(
        'Provider is missing from options',
      );
    });

    test('can be called without new', () => {
      const control = SearchControl({ provider: { search: vi.fn() } });
      expect(control.options.style).toEqual('button');
    });

    test('button style renders inside the leaflet control corner', () => {
      const { control, div } = setup();
      const { container } = control.searchElement;

      expect(container.className).toEqual(
        'geosearch leaflet-bar leaflet-control leaflet-control-geosearch leaflet-geosearch-button',
      );
      expect(
        div.querySelector('.leaflet-top.leaflet-left').contains(container),
      ).toBe(true);
    });

    test('bar style moves the form into its own container', () => {
      const { control, div } = setup({ style: 'bar' });
      const bar = div.querySelector(
        '.leaflet-control-container > .leaflet-geosearch-bar',
      );

      expect(bar).not.toBeNull();
      expect(bar.contains(control.searchElement.form)).toBe(true);
      expect(control.searchElement.container.className).toContain(
        'leaflet-geosearch-bar',
      );
    });

    test('onRemove removes the bar container', () => {
      const { control, map, div } = setup({ style: 'bar' });
      map.removeControl(control);

      expect(
        div.querySelector('.leaflet-geosearch-bar.leaflet-control-geosearch'),
      ).toBeNull();
    });

    test('custom classNames replace the defaults per key', () => {
      const { control } = setup({
        classNames: { container: 'mine', input: 'my-input' },
      });

      // leaflet adds leaflet-control itself when the control is added to the map
      expect(control.searchElement.container.className).toEqual(
        'geosearch mine leaflet-geosearch-button leaflet-control',
      );
      expect(control.searchElement.input.className).toEqual('glass my-input');
      expect(control.button.className).toEqual(
        'leaflet-bar-part leaflet-bar-part-single',
      );
    });

    test('labels and reset button text come from the options', () => {
      const { control } = setup({
        searchLabel: 'Zoek adres',
        clearSearchLabel: 'Wissen',
        resetButton: 'x',
      });

      expect(control.searchElement.input.placeholder).toEqual('Zoek adres');
      expect(control.button.getAttribute('aria-label')).toEqual('Zoek adres');
      expect(control.button.getAttribute('title')).toEqual('Zoek adres');
      expect(control.resetButton.getAttribute('aria-label')).toEqual('Wissen');
      expect(control.resetButton.innerText).toEqual('x');
    });
  });

  describe('autocomplete', () => {
    test('searches after the debounce delay and renders the results', async () => {
      const { control, provider, input } = setup();

      input.value = 'den';
      key(input, 'keyup', KEY.a);
      await vi.advanceTimersByTimeAsync(249);
      expect(provider.search).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      expect(provider.search).toHaveBeenCalledTimes(1);
      expect(provider.search).toHaveBeenCalledWith({
        query: 'den',
        signal: expect.any(AbortSignal),
      });

      const items = Array.from(control.resultList.container.children);
      expect(items.map((i) => i.textContent)).toEqual([
        'Den Haag',
        'Amsterdam',
        'Rotterdam',
      ]);
    });

    test('only the last keystroke within the delay triggers a search', async () => {
      const { provider, input } = setup();

      input.value = 'd';
      key(input, 'keyup', KEY.a);
      await vi.advanceTimersByTimeAsync(100);
      input.value = 'de';
      key(input, 'keyup', KEY.a);
      await vi.advanceTimersByTimeAsync(250);

      expect(provider.search).toHaveBeenCalledTimes(1);
      expect(provider.search).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'de' }),
      );
    });

    test('uses autoCompleteDelay', async () => {
      const { provider, input } = setup({ autoCompleteDelay: 500 });

      input.value = 'den';
      key(input, 'keyup', KEY.a);
      await vi.advanceTimersByTimeAsync(499);
      expect(provider.search).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(provider.search).toHaveBeenCalledTimes(1);
    });

    test.each([
      ['enter', KEY.enter],
      ['escape', KEY.escape],
      ['arrow up', KEY.up],
      ['arrow down', KEY.down],
    ])('%s does not trigger a search', async (_, keyCode) => {
      const { provider, input } = setup();

      input.value = 'den';
      key(input, 'keyup', keyCode);
      await vi.advanceTimersByTimeAsync(250);

      expect(provider.search).not.toHaveBeenCalled();
    });

    test("keys that don't change the text don't search again", async () => {
      const { provider, input } = setup();

      await type(input, 'den');
      key(input, 'keyup', 16); // shift
      key(input, 'keyup', 9); // tab
      await vi.advanceTimersByTimeAsync(250);

      expect(provider.search).toHaveBeenCalledTimes(1);
    });

    test('an empty input clears the list without searching', async () => {
      const { control, provider, input } = setup();

      await type(input, 'den');
      await type(input, '');

      expect(provider.search).toHaveBeenCalledTimes(1);
      expect(control.resultList.container.children.length).toEqual(0);
    });

    test('limits the suggestions to maxSuggestions', async () => {
      const many = Array.from({ length: 8 }, (_, i) => ({
        ...results[1],
        label: `r${i}`,
      }));

      const a = setup({}, many);
      await type(a.input, 'r');
      expect(a.control.resultList.container.children.length).toEqual(5);

      const b = setup({ maxSuggestions: 2 }, many);
      await type(b.input, 'r');
      expect(b.control.resultList.container.children.length).toEqual(2);
    });

    test('uses resultFormat for the suggestions', async () => {
      const { control, input } = setup({
        resultFormat: ({ result }) => `<em>${result.label}</em>`,
      });

      await type(input, 'den');

      expect(control.resultList.container.children[0].innerHTML).toEqual(
        '<em>Den Haag</em>',
      );
    });

    test('shows notFoundMessage when there are no results', async () => {
      const { control, input } = setup(
        { notFoundMessage: 'Niets gevonden' },
        [],
      );

      await type(input, 'xyz');

      expect(control.resultList.container.textContent).toEqual(
        'Niets gevonden',
      );
    });

    test('keepResult does not keep old suggestions visible on a new search', async () => {
      const { control, input } = setup({ keepResult: true });

      await type(input, 'den');
      await type(input, 'ams');

      expect(control.resultList.container.children.length).toEqual(3);
    });
  });

  describe('keyboard navigation', () => {
    test('arrow down/up select results and copy the label into the input', async () => {
      const { control, input } = setup();
      await type(input, 'den');

      key(input, 'keydown', KEY.down);
      expect(control.resultList.selected).toEqual(0);
      expect(input.value).toEqual('Den Haag');

      key(input, 'keydown', KEY.down);
      expect(input.value).toEqual('Amsterdam');

      key(input, 'keydown', KEY.up);
      expect(input.value).toEqual('Den Haag');
    });

    test('selection wraps around at both ends', async () => {
      const { control, input } = setup();
      await type(input, 'den');

      key(input, 'keydown', KEY.up);
      expect(control.resultList.selected).toEqual(2);

      key(input, 'keydown', KEY.down);
      expect(control.resultList.selected).toEqual(0);
    });

    test('arrows do nothing without results', () => {
      const { control, input } = setup();
      input.value = 'den';

      key(input, 'keydown', KEY.down);

      expect(control.resultList.selected).toEqual(-1);
      expect(input.value).toEqual('den');
    });

    test('enter shows the selected result without searching again (#288)', async () => {
      const { control, provider, input, map } = setup();
      const listener = vi.fn();
      map.on('geosearch/showlocation', listener);
      await type(input, 'den');
      key(input, 'keydown', KEY.down);
      key(input, 'keydown', KEY.down);

      key(input, 'keydown', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.search).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].location).toBe(results[1]);
      expect(control.markers.getLayers()[0].getLatLng()).toEqual(
        new L.LatLng(52.37, 4.9),
      );
    });

    test('enter without a selection searches for the typed text', async () => {
      const { provider, input } = setup();
      await type(input, 'den');

      key(input, 'keydown', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.search).toHaveBeenCalledTimes(2);
      expect(provider.search).toHaveBeenLastCalledWith({
        query: 'den',
        data: undefined,
      });
    });

    test('editing the text drops the selected suggestion', async () => {
      const { provider, input } = setup();
      await type(input, 'den');
      key(input, 'keydown', KEY.down);

      // enter comes before the next autocomplete search
      input.value = 'rotterdam';
      input.dispatchEvent(new Event('input'));
      key(input, 'keydown', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.search).toHaveBeenCalledTimes(2);
      expect(provider.search).toHaveBeenLastCalledWith({
        query: 'rotterdam',
        data: undefined,
      });
    });

    test('requeryOnSelect searches again with the selected suggestion', async () => {
      const { control, provider, input } = setup({ requeryOnSelect: true });
      await type(input, 'den');
      key(input, 'keydown', KEY.down);
      key(input, 'keydown', KEY.down);

      key(input, 'keydown', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.search).toHaveBeenCalledTimes(2);
      expect(provider.search).toHaveBeenLastCalledWith({
        query: 'Amsterdam',
        data: results[1],
      });
      // the first result of the new search is shown
      expect(control.markers.getLayers()[0].getLatLng()).toEqual(
        new L.LatLng(52.08, 4.3),
      );
    });

    test('escape clears the input, the suggestions and the markers', async () => {
      const { control, input } = setup({ keepResult: true });
      await type(input, 'den');
      await control.onSubmit({ query: 'den' });

      key(input, 'keydown', KEY.escape);

      expect(input.value).toEqual('');
      expect(control.resultList.container.children.length).toEqual(0);
      expect(control.markers.getLayers()).toHaveLength(0);
    });
  });

  describe('selecting a suggestion with the mouse', () => {
    test('a click on html from resultFormat picks the suggestion', async () => {
      const { control, input } = setup({
        resultFormat: ({ result }) => `<b>${result.label}</b>`,
      });
      await type(input, 'den');

      control.resultList.container.children[1].querySelector('b').click();
      await vi.advanceTimersByTimeAsync(0);

      expect(input.value).toEqual(results[1].label);
      expect(control.markers.getLayers()).toHaveLength(1);
    });

    test('copies the label and shows the result without searching again (#288)', async () => {
      const { control, provider, input } = setup();
      await type(input, 'ams');

      control.resultList.container.children[1].click();
      await vi.advanceTimersByTimeAsync(0);

      expect(input.value).toEqual('Amsterdam');
      expect(provider.search).toHaveBeenCalledTimes(1);
      expect(control.markers.getLayers()[0].getLatLng()).toEqual(
        new L.LatLng(52.37, 4.9),
      );
      expect(control.resultList.container.children.length).toEqual(0);
    });

    test('suggestions without coordinates are still searched again', async () => {
      const partial = [{ label: 'Amsterdam', bounds: null, raw: {} }];
      const { control, provider, input } = setup({}, partial);
      await type(input, 'ams');
      provider.search.mockResolvedValueOnce([results[1]]);

      control.resultList.container.children[0].click();
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.search).toHaveBeenCalledTimes(2);
      expect(provider.search).toHaveBeenLastCalledWith({
        query: 'Amsterdam',
        data: partial[0],
      });
    });

    test('enter on typed text searches a first result without coordinates again', async () => {
      const partial = [{ label: 'Amsterdam', bounds: null, raw: {} }];
      const { control, provider } = setup({}, partial);
      provider.search.mockResolvedValueOnce(partial);
      provider.search.mockResolvedValueOnce([results[1]]);

      await control.onSubmit({ query: 'ams' });

      expect(provider.search).toHaveBeenLastCalledWith({
        query: 'Amsterdam',
        data: partial[0],
      });
      expect(control.markers.getLayers()[0].getLatLng()).toEqual(
        new L.LatLng(52.37, 4.9),
      );
    });

    test('enter in showResultListOnSubmit searches a single result without coordinates again', async () => {
      const partial = [{ label: 'Amsterdam', bounds: null, raw: {} }];
      const { control, provider } = setup(
        { autoComplete: false, showResultListOnSubmit: true },
        partial,
      );
      provider.search.mockResolvedValueOnce(partial);
      provider.search.mockResolvedValueOnce([results[1]]);

      await control.onSubmit({ query: 'ams' });

      expect(provider.search).toHaveBeenCalledTimes(2);
      expect(control.resultList.container.children.length).toEqual(0);
      expect(control.markers.getLayers()[0].getLatLng()).toEqual(
        new L.LatLng(52.37, 4.9),
      );
    });

    test('a newer search drops the second search of a first result', async () => {
      const partial = [{ label: 'Amsterdam', bounds: null, raw: {} }];
      const { control, provider } = setup({}, partial);
      let finish;
      provider.search.mockResolvedValueOnce(partial);
      provider.search.mockImplementationOnce(
        () => new Promise((resolve) => (finish = resolve)),
      );
      provider.search.mockResolvedValueOnce([results[2]]);

      const first = control.onSubmit({ query: 'ams' });
      await vi.advanceTimersByTimeAsync(0);
      await control.onSubmit({ query: 'rot' });
      finish([results[1]]);
      await first;

      expect(control.markers.getLayers()).toHaveLength(1);
      expect(control.markers.getLayers()[0].getLatLng()).toEqual(
        new L.LatLng(51.92, 4.48),
      );
    });

    test('a picked suggestion that still has no coordinates shows nothing', async () => {
      const partial = [{ label: 'Amsterdam', bounds: null, raw: {} }];
      const { control, provider } = setup({}, partial);

      await control.onSubmit({ query: 'Amsterdam', data: partial[0] });

      expect(provider.search).toHaveBeenCalledTimes(1);
      expect(control.markers.getLayers()).toHaveLength(0);
    });
  });

  describe('showing a result', () => {
    test('adds a marker at the result position with a popup', async () => {
      const { control } = setup();

      await control.onSubmit({ query: 'den' });

      const [marker] = control.markers.getLayers();
      expect(marker.getLatLng()).toEqual(new L.LatLng(52.08, 4.3));
      expect(marker.getPopup().getContent()).toEqual('Den Haag');
      expect(marker.isPopupOpen()).toBe(false);
    });

    test('uses popupFormat with query and result', async () => {
      const popupFormat = vi.fn(
        ({ query, result }) => `${query.query}: ${result.label}`,
      );
      const { control, provider } = setup({ popupFormat });

      await control.onSubmit({ query: 'den' });

      expect(popupFormat).toHaveBeenCalledWith({
        query: { query: 'den' },
        result: results[0],
        provider: { index: 0, label: '', provider },
      });
      expect(control.markers.getLayers()[0].getPopup().getContent()).toEqual(
        'den: Den Haag',
      );
    });

    test('showPopup opens the popup', async () => {
      const { control } = setup({ showPopup: true });
      vi.spyOn(L.Marker.prototype, 'openPopup');

      await control.onSubmit({ query: 'den' });

      expect(L.Marker.prototype.openPopup).toHaveBeenCalled();
      L.Marker.prototype.openPopup.mockRestore();
    });

    test('fires geosearch/showlocation with the result and the marker', async () => {
      const { control, map } = setup();
      const listener = vi.fn();
      map.on('geosearch/showlocation', listener);

      await control.onSubmit({ query: 'den' });

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0];
      expect(event.location).toBe(results[0]);
      expect(event.marker).toBe(control.markers.getLayers()[0]);
    });

    test('does nothing when there are no results', async () => {
      const { control, map } = setup({}, []);
      const listener = vi.fn();
      map.on('geosearch/showlocation', listener);

      await control.onSubmit({ query: 'nothing' });

      expect(control.markers.getLayers()).toHaveLength(0);
      expect(listener).not.toHaveBeenCalled();
      expect(map.setView).not.toHaveBeenCalled();
    });

    test('maxMarkers removes the oldest marker', async () => {
      const { control } = setup({ maxMarkers: 2 });

      control.showResult(results[0], { query: 'a' });
      control.showResult(results[1], { query: 'b' });
      control.showResult(results[2], { query: 'c' });

      const labels = control.markers
        .getLayers()
        .map((m) => m.getPopup().getContent());
      expect(labels).toEqual(['Amsterdam', 'Rotterdam']);
    });

    test('showMarker false keeps the markers off the map', async () => {
      const { control, map } = setup({ showMarker: false });

      await control.onSubmit({ query: 'den' });

      expect(map.hasLayer(control.markers)).toBe(false);
    });

    test('a custom marker icon is used', async () => {
      const icon = new L.DivIcon({ className: 'my-icon' });
      const { control } = setup({ marker: { icon } });

      await control.onSubmit({ query: 'den' });

      expect(control.markers.getLayers()[0].options.icon).toBe(icon);
    });

    test('draggable markers fire geosearch/marker/dragend', async () => {
      const { control, map } = setup({ marker: { draggable: true } });
      const listener = vi.fn();
      map.on('geosearch/marker/dragend', listener);

      await control.onSubmit({ query: 'den' });
      const marker = control.markers.getLayers()[0];
      marker.setLatLng([1, 2]);
      marker.fire('dragend');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].location).toEqual(new L.LatLng(1, 2));
    });

    test('events work without the fireEvent alias (removed in Leaflet 2)', async () => {
      const { control, map } = setup({ marker: { draggable: true } });
      map.fireEvent = undefined;
      const listener = vi.fn();
      map.on('geosearch/showlocation', listener);
      map.on('geosearch/marker/dragend', listener);

      await control.onSubmit({ query: 'den' });
      control.markers.getLayers()[0].fire('dragend');

      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('updating the map', () => {
    test('fits the bounds of a result that has bounds', () => {
      const { control, map } = setup();

      control.showResult(results[0], { query: 'den' });

      // plain arrays, so maps of another Leaflet copy accept them too
      expect(map.fitBounds).toHaveBeenCalledWith(results[0].bounds, {
        animate: true,
      });
      expect(map.setView).not.toHaveBeenCalled();
    });

    test('zooms to zoomLevel around a result without bounds', () => {
      const { control, map } = setup({ zoomLevel: 15, animateZoom: false });

      control.showResult(results[1], { query: 'ams' });

      expect(map.setView).toHaveBeenCalledTimes(1);
      expect(map.setView).toHaveBeenCalledWith([52.37, 4.9], 15, {
        animate: false,
      });
    });

    test('zoomToBounds false zooms to zoomLevel at the result, even with bounds (#304)', () => {
      const { control, map } = setup({ zoomToBounds: false, zoomLevel: 20 });

      control.showResult(results[0], { query: 'den' });

      expect(map.fitBounds).not.toHaveBeenCalled();
      expect(map.setView).toHaveBeenCalledWith([52.08, 4.3], 20, {
        animate: true,
      });
    });

    test('zoomToBounds false uses the center of the bounds without a position', () => {
      const { control, map } = setup({ zoomToBounds: false, zoomLevel: 20 });

      control.centerMap({ ...results[0], x: undefined, y: undefined });

      const [center, zoom] = map.setView.mock.calls[0];
      expect(center[0]).toBeCloseTo(52.05, 5);
      expect(center[1]).toBeCloseTo(4.3, 5);
      expect(zoom).toEqual(20);
    });

    test('fitBoundsOptions are passed to fitBounds', () => {
      const { control, map } = setup({
        fitBoundsOptions: { maxZoom: 16, padding: [50, 50] },
      });

      control.showResult(results[0], { query: 'den' });

      expect(map.fitBounds).toHaveBeenCalledWith(results[0].bounds, {
        maxZoom: 16,
        padding: [50, 50],
        animate: true,
      });
    });

    test('retainZoomLevel centers on the bounds of a result', () => {
      const { control, map } = setup({ retainZoomLevel: true });
      vi.spyOn(map, 'getZoom').mockReturnValue(7);

      control.showResult(results[0], { query: 'den' });

      const [center] = map.setView.mock.calls[0];
      expect(center[0]).toBeCloseTo(52.05, 5);
      expect(center[1]).toBeCloseTo(4.3, 5);
    });

    test('bounds given as numeric strings are converted', () => {
      const { control, map } = setup();

      control.showResult(
        {
          ...results[0],
          bounds: [
            ['52.0', '4.2'],
            ['52.1', '4.4'],
          ],
        },
        { query: 'den' },
      );

      expect(map.fitBounds).toHaveBeenCalledWith(results[0].bounds, {
        animate: true,
      });
    });

    test.each([
      [
        'NaN values',
        [
          [NaN, 4.2],
          [52.1, 4.4],
        ],
      ],
      ['missing corner', [[52.0, 4.2]]],
      ['wrong shape', [[52.0], [52.1, 4.4]]],
      ['not an array', { south: 52 }],
    ])(
      'invalid bounds (%s) fall back to the result position (#253)',
      (_, bounds) => {
        const { control, map } = setup();

        expect(() =>
          control.showResult({ ...results[0], bounds }, { query: 'den' }),
        ).not.toThrow();

        expect(map.fitBounds).not.toHaveBeenCalled();
        expect(map.setView).toHaveBeenCalledWith([52.08, 4.3], 18, {
          animate: true,
        });
      },
    );

    test('retainZoomLevel keeps the current zoom, even for results with bounds', () => {
      const { control, map } = setup({ retainZoomLevel: true });
      vi.spyOn(map, 'getZoom').mockReturnValue(7);

      control.showResult(results[0], { query: 'den' });

      expect(map.fitBounds).not.toHaveBeenCalled();
      expect(map.setView).toHaveBeenCalledWith(expect.anything(), 7, {
        animate: true,
      });
    });

    test('updateMap false leaves the map alone', () => {
      const { control, map } = setup({ updateMap: false });

      control.showResult(results[0], { query: 'den' });

      expect(map.setView).not.toHaveBeenCalled();
      expect(map.fitBounds).not.toHaveBeenCalled();
    });
  });

  describe('closing and clearing', () => {
    test('the search button toggles the active class', () => {
      const { control } = setup();
      const { container } = control.searchElement;

      control.button.click();
      expect(container.classList.contains('active')).toBe(true);

      control.button.click();
      expect(container.classList.contains('active')).toBe(false);
    });

    test('autoClose closes the control and clears the input after a result', async () => {
      const { control, input, map } = setup({ autoClose: true });
      control.open();
      input.value = 'den';

      await control.onSubmit({ query: 'den' });

      expect(control.searchElement.container.classList.contains('active')).toBe(
        false,
      );
      expect(input.value).toEqual('');
      // the result it just showed stays on the map (#127)
      const markers = control.markers.getLayers();
      expect(markers).toHaveLength(1);
      expect(map.hasLayer(markers[0])).toBe(true);
    });

    test('autoClose keeps the popup of the result open', async () => {
      const { control } = setup({ autoClose: true, showPopup: true });
      control.open();

      await control.onSubmit({ query: 'den' });

      expect(control.markers.getLayers()[0].isPopupOpen()).toBe(true);
    });

    test('closing by hand still clears the marker without keepResult', async () => {
      const { control } = setup({ autoClose: true });
      control.open();
      await control.onSubmit({ query: 'den' });

      control.open();
      control.close();

      expect(control.markers.getLayers()).toHaveLength(0);
    });

    test('autoClose with keepResult keeps the input and the marker', async () => {
      const { control, input } = setup({ autoClose: true, keepResult: true });
      control.open();
      input.value = 'den';

      await control.onSubmit({ query: 'den' });

      expect(control.searchElement.container.classList.contains('active')).toBe(
        false,
      );
      expect(input.value).toEqual('den');
      expect(control.markers.getLayers()).toHaveLength(1);
    });

    test('the reset button clears a non-empty input and the markers', async () => {
      const { control, input } = setup({ keepResult: true });
      control.open();
      await control.onSubmit({ query: 'den' });
      input.value = 'den';

      control.resetButton.click();

      expect(input.value).toEqual('');
      expect(control.markers.getLayers()).toHaveLength(0);
      expect(control.searchElement.container.classList.contains('active')).toBe(
        true,
      );
    });

    test('the reset button closes the control when the input is empty', () => {
      const { control } = setup();
      control.open();

      control.resetButton.click();

      expect(control.searchElement.container.classList.contains('active')).toBe(
        false,
      );
    });
  });

  describe('autoComplete: false', () => {
    test('typing does not search and there is no result list', async () => {
      const { control, provider, input } = setup({ autoComplete: false });

      await type(input, 'den');

      expect(provider.search).not.toHaveBeenCalled();
      expect(control.resultList).toBeUndefined();
    });

    test('submitting shows the first result (#347)', async () => {
      const { control, provider } = setup({ autoComplete: false });

      await control.onSubmit({ query: 'den' });

      expect(provider.search).toHaveBeenCalledWith({ query: 'den' });
      expect(control.markers.getLayers()).toHaveLength(1);
    });

    test('enter in the input submits (#347)', async () => {
      const { control, provider, input } = setup({ autoComplete: false });
      input.value = 'den';

      key(input, 'keypress', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.search).toHaveBeenCalledWith({ query: 'den' });
      expect(control.markers.getLayers()).toHaveLength(1);
    });
  });

  describe('showResultListOnSubmit (#347)', () => {
    const options = { autoComplete: false, showResultListOnSubmit: true };

    test('enter shows the results to pick from, typing searches nothing', async () => {
      const { control, provider, input } = setup(options);

      await type(input, 'den');
      expect(provider.search).not.toHaveBeenCalled();

      input.value = 'den';
      key(input, 'keydown', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.search).toHaveBeenCalledTimes(1);
      expect(control.resultList.count()).toEqual(results.length);
      expect(control.markers.getLayers()).toHaveLength(0);
    });

    test('arrows and enter pick a result without searching again', async () => {
      const { control, provider, input } = setup(options);
      input.value = 'den';
      key(input, 'keydown', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);

      key(input, 'keydown', KEY.down);
      key(input, 'keydown', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.search).toHaveBeenCalledTimes(1);
      expect(control.markers.getLayers()).toHaveLength(1);
      expect(control.resultList.container.children).toHaveLength(0);
    });

    test('editing the text drops the selected result', async () => {
      const { provider, input } = setup(options);
      input.value = 'den';
      key(input, 'keydown', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);
      key(input, 'keydown', KEY.down);

      input.value = 'rotterdam';
      input.dispatchEvent(new Event('input'));
      key(input, 'keydown', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.search).toHaveBeenCalledTimes(2);
      expect(provider.search).toHaveBeenLastCalledWith({
        query: 'rotterdam',
        data: undefined,
      });
    });

    test('clicking a result shows it', async () => {
      const { control, provider, input } = setup(options);
      input.value = 'den';
      key(input, 'keydown', KEY.enter);
      await vi.advanceTimersByTimeAsync(0);

      control.resultList.container.children[1].click();
      await vi.advanceTimersByTimeAsync(0);

      expect(provider.search).toHaveBeenCalledTimes(1);
      expect(input.value).toEqual(results[1].label);
      expect(control.markers.getLayers()).toHaveLength(1);
    });

    test('a single result is shown right away', async () => {
      const { control } = setup(options, [results[0]]);

      await control.onSubmit({ query: 'den' });

      expect(control.markers.getLayers()).toHaveLength(1);
      expect(control.resultList.container.children).toHaveLength(0);
    });

    test('no results show notFoundMessage', async () => {
      const { control } = setup({ ...options, notFoundMessage: 'nothing' }, []);

      await control.onSubmit({ query: 'den' });

      expect(control.resultList.container.textContent).toContain('nothing');
    });

    test('works together with autoComplete', async () => {
      const { control, input } = setup({ showResultListOnSubmit: true });

      await control.onSubmit({ query: 'den' });

      expect(control.resultList.count()).toEqual(results.length);
      expect(control.markers.getLayers()).toHaveLength(0);
      expect(input).toBeDefined();
    });
  });
});
