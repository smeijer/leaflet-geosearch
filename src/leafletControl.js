import debounce from 'lodash.debounce';
import GeoSearchElement from './searchElement';
import ResultList from './resultList';

import { createElement, addClassName, removeClassName } from './domUtils';
import { ENTER_KEY, SPECIAL_KEYS, ARROW_UP_KEY, ARROW_DOWN_KEY, ESCAPE_KEY } from './constants';

const defaultOptions = () => ({
  position: 'topleft',
  style: 'button',
  showMarker: true,
  showPopup: false,
  popupFormat: ({ result }) => `${result.label}`,
  marker: {
    icon: new L.Icon.Default(),
    draggable: false,
  },
  maxMarkers: 1,
  retainZoomLevel: false,
  animateZoom: true,
  searchLabel: 'Enter address',
  notFoundMessage: 'Sorry, that address could not be found.',
  messageHideDelay: 3000,
  zoomLevel: 18,
  classNames: {
    container: 'leaflet-bar leaflet-control leaflet-control-geosearch',
    button: 'leaflet-bar-part leaflet-bar-part-single',
    resetButton: 'reset',
    msgbox: 'leaflet-bar message',
    form: '',
    input: '',
  },
  autoComplete: true,
  autoCompleteDelay: 250,
  autoClose: false,
  keepResult: false,
});

const wasHandlerEnabled = {};
const mapHandlers = [
  'dragging',
  'touchZoom',
  'doubleClickZoom',
  'scrollWheelZoom',
  'boxZoom',
  'keyboard',
];

const Control = {
  initialize(options) {
    this.markers = new L.FeatureGroup();
    this.handlersDisabled = false;

    this.options = {
      ...defaultOptions(),
      ...options,
    };

    const { style, classNames, searchLabel, autoComplete, autoCompleteDelay } = this.options;
    if (style !== 'button') {
      this.options.classNames.container += ` ${options.style}`;
    }

    this.searchElement = new GeoSearchElement({
      ...this.options,
      handleSubmit: query => this.onSubmit(query),
    });

    const { container, form, input } = this.searchElement.elements;

    const button = createElement('a', classNames.button, container);
    button.title = searchLabel;
    button.href = '#';

    button.addEventListener('click', (e) => { this.onClick(e); }, false);

    const resetButton = createElement('a', classNames.resetButton, form);
    resetButton.innerHTML = 'X';
    button.href = '#';
    resetButton.addEventListener('click', () => { this.clearResults(null, true); }, false);

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
      input.addEventListener('keydown', e => this.clearResults(e, true), true);
    }

    form.addEventListener('mouseenter', e => this.disableHandlers(e), true);
    form.addEventListener('mouseleave', e => this.restoreHandlers(e), true);

    this.elements = { button, resetButton };
  },

  onAdd(map) {
    const { showMarker, style } = this.options;

    this.map = map;
    if (showMarker) {
      this.markers.addTo(map);
    }

    if (style === 'bar') {
      const { form } = this.searchElement.elements;
      const root = map.getContainer().querySelector('.leaflet-control-container');

      const container = createElement('div', 'leaflet-control-geosearch bar');
      container.appendChild(form);
      root.appendChild(container);
      this.elements.container = container;
    }

    return this.searchElement.elements.container;
  },

  onRemove() {
    const { container } = this.elements;
    if (container) {
      container.remove();
    }

    return this;
  },

  onClick(event) {
    event.preventDefault();

    const { container, input } = this.searchElement.elements;

    if (container.classList.contains('active')) {
      removeClassName(container, 'active');
      this.clearResults();
    }
    else {
      addClassName(container, 'active');
      input.focus();
    }
  },

  disableHandlers(e) {
    const { form } = this.searchElement.elements;

    if (this.handlersDisabled || (e && e.target !== form)) {
      return;
    }

    this.handlersDisabled = true;
    mapHandlers.forEach((handler) => {
      if (this.map[handler]) {
        wasHandlerEnabled[handler] = this.map[handler].enabled();
        this.map[handler].disable();
      }
    });
  },

  restoreHandlers(e) {
    const { form } = this.searchElement.elements;

    if (!this.handlersDisabled || (e && e.target !== form)) {
      return;
    }

    this.handlersDisabled = false;
    mapHandlers.forEach((handler) => {
      if (wasHandlerEnabled[handler]) {
        this.map[handler].enable();
      }
    });
  },

  selectResult(event) {
    if (![ENTER_KEY, ARROW_DOWN_KEY, ARROW_UP_KEY].includes(event.keyCode)) {
      return;
    }

    event.preventDefault();

    const { input } = this.searchElement.elements;

    if (event.keyCode === ENTER_KEY) {
      this.onSubmit({ query: input.value });
      return;
    }

    const list = this.resultList;
    const max = list.count() - 1;
    if (max < 0) {
      return;
    }

    // eslint-disable-next-line no-bitwise
    const next = (event.code === 'ArrowDown') ? ~~list.selected + 1 : ~~list.selected - 1;
    // eslint-disable-next-line no-nested-ternary
    const idx = (next < 0) ? max : (next > max) ? 0 : next;

    const item = list.select(idx);
    input.value = item.label;
  },

  clearResults(event, force = false) {
    if (event && event.keyCode !== ESCAPE_KEY) {
      return;
    }

    const { input } = this.searchElement.elements;
    const { keepResult, autoComplete } = this.options;

    if (force || !keepResult) {
      input.value = '';
      this.markers.clearLayers();
    }

    if (autoComplete) {
      this.resultList.clear();
    }
  },

  async autoSearch(event) {
    if (SPECIAL_KEYS.includes(event.keyCode)) {
      return;
    }

    const query = event.target.value;
    const { provider } = this.options;

    if (query.length) {
      const results = await provider.search({ query });
      this.resultList.render(results);
    }
    else {
      this.resultList.clear();
    }
  },

  async onSubmit(query) {
    const { provider } = this.options;

    const results = await provider.search(query);

    if (results && results.length > 0) {
      this.showResult(results[0], query);
    }
  },

  showResult(result, { query }) {
    const { autoClose } = this.options;

    const markers = Object.keys(this.markers._layers);
    if (markers.length >= this.options.maxMarkers) {
      this.markers.removeLayer(markers[0]);
    }

    const marker = this.addMarker(result, query);
    this.centerMap(result);

    this.map.fireEvent('geosearch/showlocation', {
      location: result,
      marker,
    });

    if (autoClose) {
      this.closeResults();
    }
  },

  closeResults() {
    const { container } = this.searchElement.elements;

    if (container.classList.contains('active')) {
      removeClassName(container, 'active');
    }

    this.restoreHandlers();
    this.clearResults();
  },

  addMarker(result, query) {
    const { marker: options, showPopup, popupFormat } = this.options;
    const marker = new L.Marker([result.y, result.x], options);
    let popupLabel = result.label;

    if (typeof popupFormat === 'function') {
      popupLabel = popupFormat({ query, result });
    }

    marker.bindPopup(popupLabel);

    this.markers.addLayer(marker);

    if (showPopup) {
      marker.openPopup();
    }

    if (options.draggable) {
      marker.on('dragend', (args) => {
        this.map.fireEvent('geosearch/marker/dragend', {
          location: marker.getLatLng(),
          event: args,
        });
      });
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
};

export default function LeafletControl(...options) {
  if (!L || !L.Control || !L.Control.extend) {
    throw new Error('Leaflet must be loaded before instantiating the GeoSearch control');
  }

  const LControl = L.Control.extend(Control);
  return new LControl(...options);
}
