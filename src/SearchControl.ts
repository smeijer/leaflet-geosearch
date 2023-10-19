import * as L from 'leaflet';
import { ControlPosition, FeatureGroup, MarkerOptions, Map } from 'leaflet';
import SearchElement from './SearchElement';
import ResultList from './resultList';
import debounce from './lib/debounce';

import {
  createElement,
  addClassName,
  removeClassName,
  stopPropagation,
} from './domUtils';
import {
  ENTER_KEY,
  SPECIAL_KEYS,
  ARROW_UP_KEY,
  ARROW_DOWN_KEY,
  ESCAPE_KEY,
} from './constants';
import AbstractProvider, { SearchResult } from './providers/provider';
import { Provider } from './providers';

const defaultOptions: Omit<SearchControlProps, 'provider'> = {
  position: 'topleft',
  style: 'button',
  showMarker: true,
  showPopup: false,
  popupFormat: ({ result }) => `${result.label}`,
  resultFormat: ({ result }) => `${result.label}`,
  marker: {
    icon: L && L.Icon ? new L.Icon.Default() : undefined,
    draggable: false,
  },
  maxMarkers: 1,
  maxSuggestions: 5,
  retainZoomLevel: false,
  animateZoom: true,
  searchLabel: 'Enter address',
  clearSearchLabel: 'Clear search',
  notFoundMessage: '',
  messageHideDelay: 3000,
  zoomLevel: 18,
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
  },
  autoComplete: true,
  autoCompleteDelay: 250,
  autoClose: false,
  keepResult: false,
  updateMap: true,
};

const UNINITIALIZED_ERR =
  'Leaflet must be loaded before instantiating the GeoSearch control';

interface SearchControlProps {
  /** the provider to use for searching */
  provider: Provider;
  /** the leaflet position to render the element in */
  position: ControlPosition;
  /**
   * the stye of the search element
   * @default bar
   **/
  style: 'button' | 'bar';

  marker: MarkerOptions;
  maxMarkers: number;
  showMarker: boolean;
  showPopup: boolean;
  popupFormat<T = any>(args: {
    query: Selection;
    result: SearchResult<T>;
  }): string;

  resultFormat<T = any>(args: { result: SearchResult<T> }): string;

  searchLabel: string;
  clearSearchLabel: string;
  notFoundMessage: string;
  messageHideDelay: number;

  animateZoom: boolean;
  zoomLevel: number;
  retainZoomLevel: boolean;

  classNames: {
    container: string;
    button: string;
    resetButton: string;
    msgbox: string;
    form: string;
    input: string;
    resultlist: string;
    item: string;
    notfound: string;
  };

  autoComplete: boolean;
  autoCompleteDelay: number;
  maxSuggestions: number;
  autoClose: boolean;
  keepResult: boolean;
  updateMap: boolean;
}

export type SearchControlOptions = Partial<SearchControlProps> & {
  provider: Provider;
};

interface Selection {
  query: string;
  data?: SearchResult;
}

interface SearchControl {
  options: Omit<SearchControlProps, 'provider'> & {
    provider?: SearchControlProps['provider'];
  };
  markers: FeatureGroup;
  searchElement: SearchElement;
  resultList: ResultList;
  classNames: SearchControlProps['classNames'];
  container: HTMLDivElement;
  input: HTMLInputElement;
  button: HTMLAnchorElement;
  resetButton: HTMLAnchorElement;
  map: Map;

  // [key: string]: any;
  initialize(options: SearchControlProps): void;
  onSubmit(result: Selection): void;
  open(): void;
  close(): void;
  onClick(event: Event): void;
  clearResults(event?: KeyboardEvent | null, force?: boolean): void;
  autoSearch(event: KeyboardEvent): void;
  selectResult(event: KeyboardEvent): void;
  showResult(result: SearchResult, query: Selection): void;
  addMarker(result: SearchResult, selection: Selection): void;
  centerMap(result: SearchResult): void;
  closeResults(): void;
  getZoom(): number;
  onAdd(map: Map): HTMLDivElement;
  onRemove(): SearchControl;
}

// @ts-ignore
const Control: SearchControl = {
  options: { ...defaultOptions },
  classNames: { ...defaultOptions.classNames },

  initialize(options: SearchControlOptions) {
    if (!L) {
      throw new Error(UNINITIALIZED_ERR);
    }

    if (!options.provider) {
      throw new Error('Provider is missing from options');
    }

    // merge given options with control defaults
    this.options = { ...defaultOptions, ...options };
    this.classNames = { ...this.classNames, ...options.classNames };

    this.markers = new L.FeatureGroup();
    this.classNames.container += ` leaflet-geosearch-${this.options.style}`;

    this.searchElement = new SearchElement({
      searchLabel: this.options.searchLabel,
      classNames: {
        container: this.classNames.container,
        form: this.classNames.form,
        input: this.classNames.input,
      },
      handleSubmit: (result) => this.onSubmit(result),
    });

    this.button = createElement<HTMLAnchorElement>(
      'a',
      this.classNames.button,
      this.searchElement.container,
      {
        title: this.options.searchLabel,
        href: '#',
        onClick: (e) => this.onClick(e),
      },
    );

    L.DomEvent.disableClickPropagation(this.button);

    this.resetButton = createElement<HTMLAnchorElement>(
      'button',
      this.classNames.resetButton,
      this.searchElement.form,
      {
        text: '×',
        'aria-label': this.options.clearSearchLabel,
        onClick: () => {
          if (this.searchElement.input.value === '') {
            this.close();
          } else {
            this.clearResults(null, true);
          }
        },
      },
    );

    L.DomEvent.disableClickPropagation(this.resetButton);

    if (this.options.autoComplete) {
      this.resultList = new ResultList({
        handleClick: ({ result }): void => {
          this.searchElement.input.value = result.label;
          this.onSubmit({ query: result.label, data: result });
        },
        classNames: {
          resultlist: this.classNames.resultlist,
          item: this.classNames.item,
          notfound: this.classNames.notfound,
        },
        notFoundMessage: this.options.notFoundMessage,
      });

      this.searchElement.form.appendChild(this.resultList.container);

      this.searchElement.input.addEventListener(
        'keyup',
        debounce(
          (e: KeyboardEvent) => this.autoSearch(e),
          this.options.autoCompleteDelay,
        ),
        true,
      );

      this.searchElement.input.addEventListener(
        'keydown',
        (e: KeyboardEvent) => this.selectResult(e),
        true,
      );

      this.searchElement.input.addEventListener(
        'keydown',
        (e: KeyboardEvent) => this.clearResults(e, true),
        true,
      );
    }

    this.searchElement.form.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
      },
      false,
    );
  },

  onAdd(map: Map) {
    const { showMarker, style } = this.options;

    this.map = map;
    if (showMarker) {
      this.markers.addTo(map);
    }

    if (style === 'bar') {
      const root = map
        .getContainer()
        .querySelector('.leaflet-control-container');

      this.container = createElement<HTMLDivElement>(
        'div',
        'leaflet-control-geosearch leaflet-geosearch-bar',
      );

      this.container.appendChild(this.searchElement.form);
      root!.appendChild(this.container);
    }

    L.DomEvent.disableClickPropagation(this.searchElement.form);
    return this.searchElement.container;
  },

  onRemove() {
    this.container?.remove();
    return this;
  },

  open() {
    const { container, input } = this.searchElement;
    addClassName(container, 'active');
    input.focus();
  },

  close() {
    const { container } = this.searchElement;
    removeClassName(container, 'active');
    this.clearResults();
  },

  onClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    const { container } = this.searchElement;

    if (container.classList.contains('active')) {
      this.close();
    } else {
      this.open();
    }
  },

  selectResult(event) {
    if (
      [ENTER_KEY, ARROW_DOWN_KEY, ARROW_UP_KEY].indexOf(event.keyCode) === -1
    ) {
      return;
    }

    event.preventDefault();

    if (event.keyCode === ENTER_KEY) {
      const item = this.resultList.select(this.resultList.selected);
      this.onSubmit({ query: this.searchElement.input.value, data: item });
      return;
    }

    const max = this.resultList.count() - 1;
    if (max < 0) {
      return;
    }

    const { selected } = this.resultList;
    const next = event.keyCode === ARROW_DOWN_KEY ? selected + 1 : selected - 1;
    const idx = next < 0 ? max : next > max ? 0 : next;

    const item = this.resultList.select(idx);
    this.searchElement.input.value = item.label;
  },

  clearResults(event: KeyboardEvent | null, force = false) {
    if (event && event.keyCode !== ESCAPE_KEY) {
      return;
    }

    const { keepResult, autoComplete } = this.options;

    if (force || !keepResult) {
      this.searchElement.input.value = '';
      this.markers.clearLayers();
    }

    if (autoComplete) {
      this.resultList.clear();
    }
  },

  async autoSearch(event) {
    if (SPECIAL_KEYS.indexOf(event.keyCode) > -1) {
      return;
    }

    const query = (event.target as HTMLInputElement).value;
    const { provider } = this.options;

    if (query.length) {
      let results = await provider!.search({ query });
      results = results.slice(0, this.options.maxSuggestions);
      this.resultList.render(results, this.options.resultFormat);
    } else {
      this.resultList.clear();
    }
  },

  async onSubmit(query) {
    this.resultList.clear();
    const { provider } = this.options;

    const results = await provider!.search(query);

    if (results && results.length > 0) {
      this.showResult(results[0], query);
    }
  },

  showResult(result, query) {
    const { autoClose, updateMap } = this.options;

    const markers = this.markers.getLayers();
    if (markers.length >= this.options.maxMarkers) {
      this.markers.removeLayer(markers[0]);
    }

    const marker = this.addMarker(result, query);

    if (updateMap) {
      this.centerMap(result);
    }

    this.map.fireEvent('geosearch/showlocation', {
      location: result,
      marker,
    });

    if (autoClose) {
      this.closeResults();
    }
  },

  closeResults() {
    const { container } = this.searchElement;

    if (container.classList.contains('active')) {
      removeClassName(container, 'active');
    }

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

    const resultBounds = result.bounds
      ? new L.LatLngBounds(result.bounds)
      : new L.LatLng(result.y, result.x).toBounds(10);

    const bounds = resultBounds.isValid()
      ? resultBounds
      : this.markers.getBounds();

    if (!retainZoomLevel && resultBounds.isValid() && !result.bounds) {
      this.map.setView(bounds.getCenter(), this.getZoom(), {
        animate: animateZoom,
      });
    } else if (!retainZoomLevel && resultBounds.isValid()) {
      this.map.fitBounds(bounds, { animate: animateZoom });
    } else {
      this.map.setView(bounds.getCenter(), this.getZoom(), {
        animate: animateZoom,
      });
    }
  },

  getZoom(): number {
    const { retainZoomLevel, zoomLevel } = this.options;
    return retainZoomLevel ? this.map.getZoom() : zoomLevel;
  },
};

export default function SearchControl(...options: any[]) {
  if (!L) {
    throw new Error(UNINITIALIZED_ERR);
  }

  const LControl = L.Control.extend(Control);
  return new LControl(...options);
}
