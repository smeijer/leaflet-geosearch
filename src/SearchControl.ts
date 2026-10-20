import * as L from 'leaflet';
import {
  ControlPosition,
  FeatureGroup,
  MarkerOptions,
  Map as LeafletMap,
} from 'leaflet';
import SearchElement from './SearchElement';
import ResultList from './resultList';
import debounce from './lib/debounce';

import {
  createElement,
  addClassName,
  removeClassName,
  stopPropagation,
  escapeHtml,
} from './domUtils';
import {
  ENTER_KEY,
  SPECIAL_KEYS,
  ARROW_UP_KEY,
  ARROW_DOWN_KEY,
  ESCAPE_KEY,
} from './constants';
import AbstractProvider, {
  BoundsTuple,
  PointTuple,
  SearchArgument,
  SearchResult,
} from './providers/provider';
import { Provider } from './providers';

const defaultClassNames: SearchControlProps['classNames'] = {
  container: 'leaflet-bar leaflet-control leaflet-control-geosearch',
  button: 'leaflet-bar-part leaflet-bar-part-single',
  resetButton: 'reset',
  msgbox: 'leaflet-bar message',
  form: '',
  input: '',
  resultlist: '',
  item: '',
  notfound: 'leaflet-bar-notfound',
};

const defaultOptions: Omit<SearchControlProps, 'provider'> = {
  position: 'topleft',
  style: 'button',
  showMarker: true,
  showPopup: false,
  // labels come from the provider (e.g. user edited OpenStreetMap data), so
  // they are escaped before being used as html
  popupFormat: ({ result }) => escapeHtml(result.label),
  resultFormat: ({ result }) => escapeHtml(result.label),
  // the default icon is added by initialize (see defaultIcon)
  marker: {
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
  classNames: defaultClassNames,
  autoComplete: true,
  autoCompleteDelay: 250,
  autoClose: false,
  keepResult: false,
  updateMap: true,
  resetButton: '×',
  requeryOnSelect: false,
  minQueryLength: 1,
  cacheSize: 0,
};

function withoutUndefined<T extends object>(value?: T): Partial<T> {
  const result: Partial<T> = {};
  if (!value) {
    return result;
  }

  (Object.keys(value) as (keyof T)[]).forEach((key) => {
    if (value[key] !== undefined) {
      result[key] = value[key];
    }
  });

  return result;
}

function toBoundsTuple(bounds?: BoundsTuple | null): BoundsTuple | null {
  if (!Array.isArray(bounds) || bounds.length !== 2) {
    return null;
  }

  const points = bounds.map((point) =>
    Array.isArray(point) ? point.map(Number) : [],
  );
  const valid = points.every(
    (point) => point.length === 2 && point.every(Number.isFinite),
  );

  return valid ? (points as BoundsTuple) : null;
}

function centerOf([[south, west], [north, east]]: BoundsTuple): PointTuple {
  return [(south + north) / 2, (west + east) / 2];
}

function hasPosition(result?: SearchResult): result is SearchResult {
  return !!result && Number.isFinite(result.x) && Number.isFinite(result.y);
}

let sharedIcon: L.Icon.Default | undefined;

// created on first use instead of when the module loads, so importing the
// package has no side effects and bundlers can drop what isn't used
function defaultIcon(): L.Icon.Default {
  if (!sharedIcon) {
    sharedIcon = new L.Icon.Default();
  }

  return sharedIcon;
}

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
  resetButton: string;
  /**
   * search the provider again when a suggestion is picked, even if the
   * suggestion already has coordinates (the previous behaviour)
   * @default false
   */
  requeryOnSelect: boolean;
  /**
   * the number of characters to type before autocomplete searches
   * @default 1
   */
  minQueryLength: number;
  /**
   * how many search results to keep in memory, so the same text isn't
   * requested twice. 0 disables the cache
   * @default 0
   */
  cacheSize: number;
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
  map: LeafletMap;
  /** text of the last autocomplete search, to skip repeats */
  lastQuery: string;
  /** increments whenever pending autocomplete results become stale */
  searchId: number;
  abortController?: AbortController;
  /** recent results by query text, oldest first (see cacheSize) */
  cache?: Map<string, SearchResult[]>;

  // [key: string]: any;
  initialize(options: SearchControlProps): void;
  onSubmit(result: Selection): void;
  open(): void;
  close(): void;
  onClick(event: Event): void;
  clearResults(event?: KeyboardEvent | null, force?: boolean): void;
  autoSearch(event: KeyboardEvent): void;
  cancelSearch(): void;
  searchProvider(
    args: SearchArgument & { data?: SearchResult },
  ): Promise<SearchResult[]>;
  handleError(
    error: unknown,
    query: string,
    source: 'autocomplete' | 'submit',
  ): void;
  selectResult(event: KeyboardEvent): void;
  showResult(result: SearchResult, query: Selection): void;
  addMarker(result: SearchResult, selection: Selection): void;
  centerMap(result: SearchResult): void;
  closeResults(): void;
  getZoom(): number;
  onAdd(map: LeafletMap): HTMLDivElement;
  onRemove(): SearchControl;
}

// @ts-ignore
const Control: SearchControl = {
  // no copies needed: Control.extend copies the options and initialize
  // replaces both objects. spreads or property reads here would keep
  // bundlers from dropping an unused control
  options: defaultOptions,
  classNames: defaultClassNames,

  initialize(options: SearchControlOptions) {
    if (!L) {
      throw new Error(UNINITIALIZED_ERR);
    }

    if (!options.provider) {
      throw new Error('Provider is missing from options');
    }

    // merge given options with control defaults. undefined values, like unset
    // props of a wrapper component, keep the default
    const given = withoutUndefined(options);
    this.options = {
      ...defaultOptions,
      ...given,
      marker: {
        ...defaultOptions.marker,
        icon: defaultIcon(),
        ...withoutUndefined(given.marker),
      },
    };
    this.classNames = {
      ...this.classNames,
      ...withoutUndefined(given.classNames),
    };

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
        'aria-label': this.options.searchLabel,
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
        text: this.options.resetButton,
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

      const autoSearch = debounce(
        (e: KeyboardEvent) => this.autoSearch(e),
        this.options.autoCompleteDelay,
      );

      this.searchElement.input.addEventListener('keyup', autoSearch, true);
      // also covers paste, drag and drop, and mobile keyboards that don't
      // send key codes
      this.searchElement.input.addEventListener('input', autoSearch, true);

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

  onAdd(map: LeafletMap) {
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
      this.cancelSearch();
      this.lastQuery = '';
      this.resultList.clear();
    }
  },

  async autoSearch(event) {
    if (SPECIAL_KEYS.indexOf(event.keyCode) > -1) {
      return;
    }

    const query = (event.target as HTMLInputElement).value;
    if (!query.length || query.length < this.options.minQueryLength) {
      this.cancelSearch();
      this.lastQuery = '';
      this.resultList.clear();
      return;
    }

    // keys like shift or tab don't change the text, no need to search again
    if (query === this.lastQuery) {
      return;
    }

    this.cancelSearch();
    this.lastQuery = query;
    const id = this.searchId;
    const controller =
      typeof AbortController === 'undefined'
        ? undefined
        : new AbortController();
    this.abortController = controller;

    let results;
    try {
      results = await this.searchProvider({
        query,
        signal: controller?.signal,
      });
    } catch (error) {
      // errors of cancelled searches (including the abort itself) don't matter
      if (id === this.searchId) {
        this.lastQuery = '';
        this.handleError(error, query, 'autocomplete');
      }
      return;
    }

    // a newer search, a submit or a clear happened while this one was running
    if (id !== this.searchId) {
      return;
    }

    this.abortController = undefined;
    results = results.slice(0, this.options.maxSuggestions);
    this.resultList.render(results, this.options.resultFormat);
  },

  async searchProvider(args) {
    const { provider, cacheSize } = this.options;
    const cache = cacheSize > 0 ? (this.cache = this.cache || new Map()) : null;
    const cached = cache?.get(args.query);

    if (cache && cached) {
      // move to the end, it is the most recently used now
      cache.delete(args.query);
      cache.set(args.query, cached);
      return cached;
    }

    const results = await provider!.search(args);

    if (cache) {
      cache.set(args.query, results);
      while (cache.size > cacheSize) {
        cache.delete(cache.keys().next().value as string);
      }
    }

    return results;
  },

  cancelSearch() {
    this.abortController?.abort();
    this.abortController = undefined;
    this.searchId = (this.searchId || 0) + 1;
  },

  async onSubmit(query) {
    this.cancelSearch();
    // there is no result list when autoComplete is disabled
    this.resultList?.clear();
    const { provider, requeryOnSelect } = this.options;

    // a picked suggestion with coordinates has all we need to show it
    if (!requeryOnSelect && hasPosition(query.data)) {
      this.showResult(query.data, query);
      return;
    }

    let results;
    try {
      results = query.data
        ? await provider!.search(query)
        : await this.searchProvider(query);
    } catch (error) {
      this.handleError(error, query.query, 'submit');
      return;
    }

    if (results && results.length > 0) {
      this.showResult(results[0], query);
    }
  },

  handleError(error, query, source) {
    const { searchElement } = this;
    addClassName(searchElement.container, 'error');
    searchElement.hasError = true;

    this.map?.fire('geosearch/error', { error, query, source });
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
      marker.on('dragend', (args: L.DragEndEvent) => {
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
    const options = { animate: animateZoom };

    // plain arrays instead of Leaflet objects: a map created with another copy
    // of Leaflet doesn't recognize our instances ("Bounds are not valid")
    const bounds = toBoundsTuple(result.bounds);

    if (!retainZoomLevel && bounds) {
      this.map.fitBounds(bounds, options);
      return;
    }

    const center = bounds
      ? centerOf(bounds)
      : hasPosition(result)
      ? ([result.y, result.x] as PointTuple)
      : null;

    // nothing usable to move the map to
    if (!center) {
      return;
    }

    this.map.setView(center, this.getZoom(), options);
  },

  getZoom(): number {
    const { retainZoomLevel, zoomLevel } = this.options;
    return retainZoomLevel ? this.map.getZoom() : zoomLevel;
  },
};

// extend creates a new class on every call, so it's only done once
let LControl:
  | (new (...options: any[]) => SearchControl & L.Control)
  | undefined;

export default function SearchControl(...options: any[]) {
  if (!L) {
    throw new Error(UNINITIALIZED_ERR);
  }

  if (!LControl) {
    LControl = L.Control.extend(Control);
  }

  return new LControl(...options);
}
