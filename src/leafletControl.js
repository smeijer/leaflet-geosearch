import GeoSearchElement from './searchElement';
import { createElement, addClassName, removeClassName } from './domUtils';

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
};

export default L.Control.extend({
  initialize(options) {
    this.markers = new L.FeatureGroup();

    this.options = {
      ...defaultOptions,
      ...options,
    };

    const { classNames, searchLabel } = this.options;

    this.searchElement = new GeoSearchElement({
      ...this.options,
      handleSubmit: query => this.onSubmit(query),
    });

    const { container } = this.searchElement.elements;
    container.addEventListener('dblclick', (e) => { e.stopPropagation(); });

    const button = createElement('a', classNames.button, container);
    button.title = searchLabel;
    button.href = '#';

    button.addEventListener('click', (e) => { this.onClick(e); }, false);

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
