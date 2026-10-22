import * as api from '../index';
import * as providersApi from '../providers';
import SearchControl from '../SearchControl';

// The public surface of the package. Removing an export or changing a
// default here is a breaking change and needs a major release.

test('exports', () => {
  expect(Object.keys(api).sort()).toEqual([
    'AMapProvider',
    'BingProvider',
    'CivilDefenseMapProvider',
    'EsriProvider',
    'GeoApiFrProvider',
    'GeoSearchControl',
    'GeoapifyProvider',
    'GeocodeEarthProvider',
    'GoogleProvider',
    'HereProvider',
    'JsonProvider',
    'LegacyGoogleProvider',
    'LocationIQProvider',
    'MapBoxProvider',
    'OpenCageProvider',
    'OpenStreetMapProvider',
    'PdokNlProvider',
    'PeliasProvider',
    'PhotonProvider',
    'SearchControl',
    'SearchElement',
  ]);

  expect(api.GeoSearchControl).toBe(api.SearchControl);
});

test('leaflet-geosearch/providers exports', () => {
  const control = ['GeoSearchControl', 'SearchControl', 'SearchElement'];
  const providers = Object.keys(api).filter((key) => !control.includes(key));

  expect(Object.keys(providersApi).sort()).toEqual(
    [...providers, 'Provider'].sort(),
  );
  providers.forEach((key) => expect(providersApi[key]).toBe(api[key]));
});

test('SearchControl default options', () => {
  const provider = { search: () => Promise.resolve([]) };
  const { options } = new SearchControl({ provider });

  const { marker, popupFormat, resultFormat, ...rest } = options;

  expect(rest).toEqual({
    provider,
    position: 'topleft',
    style: 'button',
    showMarker: true,
    showPopup: false,
    markerPopup: true,
    popupOptions: {},
    resultListPosition: 'below',
    theme: 'light',
    maxMarkers: 1,
    maxSuggestions: 5,
    retainZoomLevel: false,
    animateZoom: true,
    flyTo: false,
    searchLabel: 'Enter address',
    clearSearchLabel: 'Clear search',
    notFoundMessage: '',
    messageHideDelay: 3000,
    zoomLevel: 18,
    zoomToBounds: true,
    fitBoundsOptions: {},
    reverseOnDragEnd: false,
    classNames: {
      container: 'leaflet-bar leaflet-control leaflet-control-geosearch',
      button: 'leaflet-bar-part leaflet-bar-part-single',
      resetButton: 'reset',
      msgbox: 'leaflet-bar message',
      form: '',
      input: '',
      resultlist: '',
      item: '',
      notfound: 'leaflet-bar-notfound',
      providerSelect: '',
    },
    autoComplete: true,
    autoCompleteDelay: 250,
    autoClose: false,
    keepResult: false,
    updateMap: true,
    resetButton: '×',
    searchIcon: '',
    requeryOnSelect: false,
    minQueryLength: 1,
    cacheSize: 0,
    showResultListOnSubmit: false,
    showProviderSelect: true,
    allProvidersLabel: 'All',
    providerSelectLabel: 'Search with',
    fallback: false,
  });

  expect(marker.draggable).toBe(false);
  // Marker uses its own default icon
  expect(marker.icon).toBeUndefined();

  const result = { label: 'Den Haag' };
  expect(popupFormat({ result })).toEqual('Den Haag');
  expect(resultFormat({ result })).toEqual('Den Haag');
});

test('SearchControl works with and without new, and creates one class', () => {
  const provider = { search: () => Promise.resolve([]) };
  const called = SearchControl({ provider });
  const constructed = new SearchControl({ provider });

  expect(called).toBeInstanceOf(L.Control);
  expect(constructed).toBeInstanceOf(L.Control);
  expect(constructed.constructor).toBe(called.constructor);
});
