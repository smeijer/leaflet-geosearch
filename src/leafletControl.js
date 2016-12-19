import debounce from 'lodash.debounce';
import GeoSearchElement from './searchElement';
import ResultList from './resultList';

import { createElement, addClassName, removeClassName } from './domUtils';
import { SPECIAL_KEYS, ARROW_UP_KEY, ARROW_DOWN_KEY, ESCAPE_KEY } from './constants';

const defaultOptions = {
  position: 'topleft',
  showMarker: true,
  showPopup: false,
  marker: {
    icon: new L.Icon.Default(),
    draggable: false,
  },
  maxMarkers: 1,
  retainZoomLevel: false,
  animateZoom: true,
  country: '',
  searchLabel: 'Enter address',
  notFoundMessage: 'Sorry, that address could not be found.',
  messageHideDelay: 3000,
  zoomLevel: 18,
  classNames: {
    container: 'leaflet-bar leaflet-control leaflet-control-geosearch',
    button: 'leaflet-bar-part leaflet-bar-part-single',
    msgbox: 'leaflet-bar message',
    form: '',
    input: '',
  },
  autoComplete: true,
  autoCompleteDelay: 250,
};

export default L.Control.extend({
  initialize(options) {
    this.markers = new L.FeatureGroup();

    this.options = {
      ...defaultOptions,
      ...options,
    };

    const { classNames, searchLabel, autoComplete, autoCompleteDelay } = this.options;

    this.searchElement = new GeoSearchElement({
      ...this.options,
      handleSubmit: query => this.onSubmit(query),
    });


    const { container, form, input } = this.searchElement.elements;
    container.addEventListener('dblclick', (e) => { e.stopPropagation(); });

    const button = createElement('a', classNames.button, container);
    button.title = searchLabel;
    button.href = '#';

    button.addEventListener('click', (e) => { this.onClick(e); }, false);

    if (autoComplete) {
      this.resultList = new ResultList({
        handleClick: ({ result }) => {
          input.value = result.label;
          this.onSubmit({ query: result.label });
        },
      });

      form.appendChild(this.resultList.elements.container);

      input.addEventListener('keyup',
        debounce(e => this.autoSearch(e), autoCompleteDelay), true);
      input.addEventListener('keydown', e => this.selectResult(e), true);
      input.addEventListener('keydown', e => this.clearResults(e), true);
    }

    this.elements = { button };
  },

  onAdd(map) {
    const { showMarker } = this.options;

    this.map = map;
    if (showMarker) {
      this.markers.addTo(map);
    }

    return this.searchElement.elements.container;
  },

  onClick(event) {
    event.preventDefault();

    const { container, input } = this.searchElement.elements;

    if (container.classList.contains('active')) {
      removeClassName(container, 'active');
    }
    else {
      addClassName(container, 'active');
      input.focus();
    }
  },

  selectResult(event) {
    if (![ARROW_DOWN_KEY, ARROW_UP_KEY].includes(event.keyCode)) {
      return;
    }

    event.preventDefault();
    const { input } = this.searchElement.elements;

    const list = this.resultList;
    const max = this.resultList.count() - 1;

    // eslint-disable-next-line no-bitwise
    const next = (event.code === 'ArrowDown') ? ~~list.selected + 1 : ~~list.selected - 1;
    // eslint-disable-next-line no-nested-ternary
    const idx = (next < 0) ? max : (next > max) ? 0 : next;

    const item = list.select(idx);
    input.value = item.label;
  },

  clearResults(event) {
    if (event.keyCode !== ESCAPE_KEY) {
      return;
    }

    this.resultList.clear();
  },

  async autoSearch(event) {
    if (SPECIAL_KEYS.includes(event.keyCode)) {
      return;
    }

    const query = event.target.value;
    const { provider } = this.options;

    const results = await provider.search({ query });
    this.resultList.render(results);
  },

  async onSubmit(query) {
    const { provider } = this.options;

    const results = await provider.search(query);

    if (results && results.length > 0) {
      this.showResult(results[0]);
    }
  },

  showResult(result) {
    const markers = Object.keys(this.markers._layers);
    if (markers.length >= this.options.maxMarkers) {
      this.markers.removeLayer(markers[0]);
    }

    const marker = this.addMarker(result);
    this.centerMap(result);

    this.map.fireEvent('geosearch/showlocation', {
      location: result,
      marker,
    });
  },

  addMarker(result) {
    const { marker: options, showPopup } = this.options;
    const marker = new L.Marker([result.y, result.x], options);
    marker.bindPopup(result.label);

    this.markers.addLayer(marker);

    if (showPopup) {
      marker.openPopup();
    }

    return marker;
  },

  centerMap(result) {
    const { retainZoomLevel, animateZoom } = this.options;

    const resultBounds = new L.LatLngBounds(result.bounds);
    const bounds = resultBounds.isValid() ? resultBounds : this.markers.getBounds();

    if (!retainZoomLevel && resultBounds.isValid()) {
      this.map.fitBounds(bounds, { animate: animateZoom });
    }
    else {
      this.map.setView(bounds.getCenter(), this.getZoom(), { animate: animateZoom });
    }
  },

  getZoom() {
    const { retainZoomLevel, zoomLevel } = this.options;
    return retainZoomLevel ? this.map.getZoom() : zoomLevel;
  },
});
