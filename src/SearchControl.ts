import * as L from 'leaflet';
import {
  ControlPosition,
  FeatureGroup,
  FitBoundsOptions,
  MarkerOptions,
  PopupOptions,
  Map as LeafletMap,
} from 'leaflet';
import SearchElement from './SearchElement';
import ResultList from './resultList';
import debounce from './lib/debounce';

import {
  createElement,
  addClassName,
  removeClassName,
  escapeHtml,
  cx,
} from './domUtils';
import {
  ENTER_KEY,
  SPECIAL_KEYS,
  ARROW_UP_KEY,
  ARROW_DOWN_KEY,
  ESCAPE_KEY,
} from './constants';
import {
  BoundsTuple,
  PointTuple,
  SearchArgument,
  SearchResult,
} from './providers/provider';
import { Provider } from './providers/index';

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
  providerSelect: '',
};

const defaultOptions: Omit<SearchControlProps, 'provider' | 'providers'> = {
  position: 'topleft',
  style: 'button',
  showMarker: true,
  showPopup: false,
  markerPopup: true,
  resultListPosition: 'below',
  popupOptions: {},
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
  zoomToBounds: true,
  fitBoundsOptions: {},
  reverseOnDragEnd: false,
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
  showResultListOnSubmit: false,
  showProviderSelect: true,
  allProvidersLabel: 'All',
  providerSelectLabel: 'Search with',
  fallback: false,
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

/** a provider and the name the provider select shows for it */
export interface ProviderChoice {
  label: string;
  provider: Provider;
}

/** a provider of the control and its place in `providers` */
export interface ProviderInfo extends ProviderChoice {
  index: number;
}

/** what the provider select is set to, one provider or all of them */
export type SelectedProvider = ProviderInfo | { index: 'all'; label: string };

interface SearchControlProps {
  /** the provider to use for searching */
  provider: Provider;
  /**
   * several providers instead of one. With more than one, a select next to
   * the input lets the user pick one of them, or all of them
   */
  providers: ProviderChoice[];
  /**
   * show the provider select. Hidden, the control still uses the providers,
   * e.g. for `fallback`
   * @default true
   */
  showProviderSelect: boolean;
  /**
   * the name of the select option that searches all providers at once.
   * `false` leaves the option out, the first provider is selected then
   * @default 'All'
   */
  allProvidersLabel: string | false;
  /**
   * the accessible name of the provider select
   * @default 'Search with'
   */
  providerSelectLabel: string;
  /**
   * when the selected provider fails ('error'), or also when it finds
   * nothing ('empty'), search the next provider in `providers`
   * @default false
   */
  fallback: false | 'error' | 'empty';
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
  /**
   * give the marker a popup with the result. Off, the marker has no popup
   * and showPopup is ignored
   * @default true
   */
  markerPopup: boolean;
  /**
   * where the result list opens. 'auto' opens it above the input when the
   * control sits in a bottom corner of the map
   * @default 'below'
   */
  resultListPosition: 'below' | 'above' | 'auto';
  /**
   * passed to Leaflet's bindPopup, e.g. `{ maxWidth: 200, className: 'my-popup' }`
   * @default {}
   */
  popupOptions: PopupOptions;
  popupFormat<T = any>(args: {
    query: Selection;
    result: SearchResult<T>;
    /** the provider that found the result */
    provider?: ProviderInfo;
  }): string;

  resultFormat<T = any>(args: {
    result: SearchResult<T>;
    /** the provider that found the result */
    provider?: ProviderInfo;
  }): string;

  searchLabel: string;
  clearSearchLabel: string;
  notFoundMessage: string;
  messageHideDelay: number;

  animateZoom: boolean;
  zoomLevel: number;
  retainZoomLevel: boolean;
  /**
   * fit the map to the bounds of a result that has them. Off, every result
   * is shown at `zoomLevel`
   * @default true
   */
  zoomToBounds: boolean;
  /**
   * passed to Leaflet's fitBounds, e.g. `{ maxZoom: 16, padding: [50, 50] }`
   * @default {}
   */
  fitBoundsOptions: FitBoundsOptions;
  /**
   * when a draggable marker is dropped, look up the address at its new
   * position with the provider that found the result, and update the popup
   * (and the input with keepResult). Fires geosearch/marker/reverse
   * @default false
   */
  reverseOnDragEnd: boolean;

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
    providerSelect: string;
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
  /**
   * pressing enter shows the result list to pick from, instead of jumping
   * to the first result. Works with autoComplete off too, so the provider
   * is only searched on enter
   * @default false
   */
  showResultListOnSubmit: boolean;
}

/** the texts of the control that setLabels can change */
export interface SearchControlLabels {
  searchLabel: string;
  clearSearchLabel: string;
  notFoundMessage: string;
  providerSelectLabel: string;
}

export type SearchControlOptions = Partial<SearchControlProps> &
  ({ provider: Provider } | { providers: ProviderChoice[] });

interface Selection {
  query: string;
  data?: SearchResult;
}

interface SearchOutcome {
  results: SearchResult[];
  errors: { error: unknown; provider: ProviderInfo }[];
}

interface SearchControl {
  options: Omit<SearchControlProps, 'provider' | 'providers'> & {
    provider?: SearchControlProps['provider'];
    providers?: SearchControlProps['providers'];
  };
  /** the providers in the order of `providers`, or the single `provider` */
  choices: ProviderInfo[];
  /** index of the selected provider, or 'all' */
  selection: number | 'all';
  providerSelect?: HTMLSelectElement;
  /** which provider found a result, for the formatters and events */
  sources: WeakMap<SearchResult, ProviderInfo>;
  /** the latest reverse lookup of each marker, older answers are dropped */
  reverseIds?: WeakMap<L.Marker, number>;
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
  suggest(query: string): Promise<void>;
  cancelSearch(): void;
  searchProvider(
    choice: ProviderInfo,
    args: SearchArgument & { data?: SearchResult },
    useCache?: boolean,
  ): Promise<SearchResult[]>;
  runSearch(
    args: SearchArgument & { data?: SearchResult },
    only?: ProviderInfo,
  ): Promise<SearchOutcome>;
  reportErrors(
    outcome: SearchOutcome,
    query: string,
    source: 'autocomplete' | 'submit',
  ): void;
  handleError(
    error: unknown,
    query: string,
    source: 'autocomplete' | 'submit',
    provider?: ProviderInfo,
  ): void;
  /** select a provider by its index in `providers`, or 'all' */
  selectProvider(index: number | 'all'): void;
  getSelectedProvider(): SelectedProvider;
  /** the providers of the control, in the order of `providers` */
  getProviders(): ProviderInfo[];
  setProviderSelectVisible(visible: boolean): void;
  /** clears the input, the results and the markers, and drops running searches */
  reset(): void;
  /** puts text into the input without searching */
  setQuery(query: string): void;
  /** changes the texts of the control, e.g. when the language changes */
  setLabels(labels: Partial<SearchControlLabels>): void;
  formatResult(args: { result: SearchResult }): string;
  selectResult(event: KeyboardEvent): void;
  showResult(result: SearchResult, query: Selection): void;
  addMarker(result: SearchResult, selection: Selection): void;
  reverseMarker(marker: L.Marker, result: SearchResult): Promise<void>;
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

    // merge given options with control defaults. undefined values, like unset
    // props of a wrapper component, keep the default
    const given = withoutUndefined(options as Partial<SearchControlProps>);
    const choices: ProviderChoice[] =
      given.providers && given.providers.length
        ? given.providers
        : given.provider
          ? [{ label: '', provider: given.provider }]
          : [];

    if (!choices.length) {
      throw new Error('Provider is missing from options');
    }

    this.options = {
      ...defaultOptions,
      ...given,
      // code that reads options.provider keeps working with providers
      provider: choices[0].provider,
      marker: {
        ...defaultOptions.marker,
        icon: defaultIcon(),
        ...withoutUndefined(given.marker),
      },
    };
    this.choices = choices.map(({ label, provider }, index) => ({
      index,
      label,
      provider,
    }));
    this.sources = new WeakMap();
    this.selection =
      this.choices.length > 1 && this.options.allProvidersLabel !== false
        ? 'all'
        : 0;
    this.classNames = {
      ...this.classNames,
      ...withoutUndefined(given.classNames),
    };

    this.markers = new L.FeatureGroup();
    this.classNames.container += ` leaflet-geosearch-${this.options.style}`;

    const { resultListPosition, position } = this.options;
    if (
      resultListPosition === 'above' ||
      (resultListPosition === 'auto' &&
        String(position).indexOf('bottom') === 0)
    ) {
      this.classNames.container += ' leaflet-geosearch-results-above';
    }

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

    // the select and the input share a row, only when there is a choice, so
    // the markup of single provider controls stays as it was
    if (this.choices.length > 1) {
      const { form, input } = this.searchElement;
      const row = createElement<HTMLDivElement>('div', 'geosearch-input');
      form.insertBefore(row, input);

      this.providerSelect = createElement<HTMLSelectElement>(
        'select',
        cx('provider-select', this.classNames.providerSelect),
        row,
        {
          'aria-label': this.options.providerSelectLabel,
          onChange: () => {
            const { value } = this.providerSelect!;
            this.selectProvider(value === 'all' ? 'all' : Number(value));
          },
        },
      );

      const { allProvidersLabel } = this.options;
      const options =
        allProvidersLabel === false
          ? this.choices
          : [{ index: 'all', label: allProvidersLabel }, ...this.choices];
      options.forEach(({ index, label }) => {
        createElement<HTMLOptionElement>('option', null, this.providerSelect, {
          value: String(index),
          text: label,
        });
      });

      this.providerSelect.value = String(this.selection);
      this.providerSelect.hidden = !this.options.showProviderSelect;
      row.appendChild(input);
    }

    if (this.options.autoComplete || this.options.showResultListOnSubmit) {
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

      if (this.options.autoComplete) {
        // a pick, submit or clear during the delay makes the waiting search
        // outdated, like it does for running ones
        let queuedId: number | undefined;
        const debounced = debounce((e: KeyboardEvent) => {
          if (queuedId === this.searchId) {
            this.autoSearch(e);
          }
        }, this.options.autoCompleteDelay);
        const autoSearch = (e: Event) => {
          queuedId = this.searchId;
          debounced(e);
        };

        this.searchElement.input.addEventListener('keyup', autoSearch, true);
        // also covers paste, drag and drop, and mobile keyboards that don't
        // send key codes
        this.searchElement.input.addEventListener('input', autoSearch, true);
      }

      // a selected item no longer matches the text once it's edited, enter
      // has to search for the new text. arrows set the value without an
      // input event, so they keep their selection
      this.searchElement.input.addEventListener(
        'input',
        () => this.resultList.select(-1),
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
        cx(
          'leaflet-control-geosearch leaflet-geosearch-bar',
          // the form moves here, so the list position has to come along
          this.searchElement.container.classList.contains(
            'leaflet-geosearch-results-above',
          )
            ? 'leaflet-geosearch-results-above'
            : '',
        ),
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

    const { keepResult } = this.options;

    if (force || !keepResult) {
      this.searchElement.input.value = '';
      this.markers.clearLayers();
    }

    if (this.resultList) {
      this.cancelSearch();
      this.lastQuery = '';
      this.resultList.clear();
    }
  },

  async autoSearch(event) {
    if (SPECIAL_KEYS.indexOf(event.keyCode) > -1) {
      return;
    }

    await this.suggest((event.target as HTMLInputElement).value);
  },

  async suggest(query) {
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

    const outcome = await this.runSearch({
      query,
      signal: controller?.signal,
    });

    // a newer search, a submit or a clear happened while this one was running.
    // its errors (including the abort itself) don't matter
    if (id !== this.searchId) {
      return;
    }

    this.abortController = undefined;
    this.reportErrors(outcome, query, 'autocomplete');

    // nothing to show, and the same text can be tried again
    if (!outcome.results.length && outcome.errors.length) {
      this.lastQuery = '';
      return;
    }

    this.resultList.render(
      outcome.results.slice(0, this.options.maxSuggestions),
      (args) => this.formatResult(args),
    );
  },

  async searchProvider(choice, args, useCache = true) {
    const { cacheSize } = this.options;
    const cache =
      useCache && cacheSize > 0 ? (this.cache = this.cache || new Map()) : null;
    const key = `${choice.index}:${args.query}`;
    const cached = cache?.get(key);

    if (cache && cached) {
      // move to the end, it is the most recently used now
      cache.delete(key);
      cache.set(key, cached);
      return cached;
    }

    const results = await choice.provider.search(args);
    results.forEach((result) => this.sources.set(result, choice));

    if (cache) {
      cache.set(key, results);
      while (cache.size > cacheSize) {
        cache.delete(cache.keys().next().value as string);
      }
    }

    return results;
  },

  // searches the selected provider (or all of them) and never throws. the
  // caller decides what to do with the errors
  async runSearch(args, only) {
    const outcome: SearchOutcome = { results: [], errors: [] };

    if (!only && this.selection === 'all') {
      const answers = await Promise.all(
        this.choices.map((choice) =>
          this.searchProvider(choice, args).then(
            (results) => ({ choice, results, error: undefined as unknown }),
            (error: unknown) => ({
              choice,
              results: [] as SearchResult[],
              error,
            }),
          ),
        ),
      );

      answers.forEach(({ choice, error }) => {
        if (error !== undefined) {
          outcome.errors.push({ error, provider: choice });
        }
      });

      // take turns, so the first provider doesn't fill every suggestion
      const longest = Math.max(...answers.map((a) => a.results.length));
      for (let i = 0; i < longest; i += 1) {
        answers.forEach(({ results }) => {
          if (i < results.length) {
            outcome.results.push(results[i]);
          }
        });
      }

      return outcome;
    }

    const selected = only || this.choices[this.selection as number];
    const { fallback } = this.options;
    const order =
      !only && fallback
        ? [selected, ...this.choices.filter((choice) => choice !== selected)]
        : [selected];

    for (const choice of order) {
      try {
        // a picked suggestion is searched again without the cache
        outcome.results = await this.searchProvider(choice, args, !args.data);
      } catch (error) {
        outcome.errors.push({ error, provider: choice });
        // an aborted search has a newer one, don't try the next provider
        if (args.signal?.aborted) {
          return outcome;
        }
        continue;
      }

      if (outcome.results.length || fallback !== 'empty') {
        return outcome;
      }
    }

    return outcome;
  },

  reportErrors({ results, errors }, query, source) {
    errors.forEach(({ error, provider }, idx) => {
      // the error style only shows when no provider found anything
      if (idx === 0 && !results.length) {
        this.handleError(error, query, source, provider);
      } else {
        this.map?.fire('geosearch/error', { error, query, source, provider });
      }
    });
  },

  cancelSearch() {
    this.abortController?.abort();
    this.abortController = undefined;
    this.searchId = (this.searchId || 0) + 1;
  },

  async onSubmit(query) {
    this.cancelSearch();
    const id = this.searchId;
    // there is no result list when autoComplete and showResultListOnSubmit
    // are off
    this.resultList?.clear();
    const { requeryOnSelect } = this.options;

    // a picked suggestion with coordinates has all we need to show it
    if (!requeryOnSelect && hasPosition(query.data)) {
      this.showResult(query.data, query);
      return;
    }

    // a picked suggestion is searched again with the provider that found it
    const outcome = await this.runSearch(
      query,
      query.data && this.sources.get(query.data),
    );

    // a newer search or a clear happened while this one was running
    if (id !== this.searchId) {
      return;
    }

    this.reportErrors(outcome, query.query, 'submit');
    const { results } = outcome;
    if (!results.length && outcome.errors.length) {
      return;
    }

    // typed text shows its results to pick from (or the not found message),
    // a single result needs no picking
    const { showResultListOnSubmit, maxSuggestions } = this.options;
    if (showResultListOnSubmit && !query.data && results.length !== 1) {
      this.resultList.render(results.slice(0, maxSuggestions), (args) =>
        this.formatResult(args),
      );
      return;
    }

    if (results.length > 0) {
      this.showResult(results[0], query);
    }
  },

  // a result list item: resultFormat, plus the provider name when the
  // results come from all providers. the name comes first and floats right,
  // so a long label is cut off before it instead of hiding it
  formatResult({ result }) {
    const provider = this.sources.get(result);
    const html = this.options.resultFormat({ result, provider });

    return this.selection === 'all' && provider
      ? `<span class="provider">${escapeHtml(provider.label)}</span>${html}`
      : html;
  },

  handleError(error, query, source, provider) {
    const { searchElement } = this;
    addClassName(searchElement.container, 'error');
    searchElement.hasError = true;

    this.map?.fire('geosearch/error', { error, query, source, provider });
  },

  selectProvider(index) {
    const valid =
      index === 'all'
        ? this.choices.length > 1 && this.options.allProvidersLabel !== false
        : !!this.choices[index];

    if (!valid) {
      throw new Error(`There is no provider ${index} to select`);
    }

    if (index === this.selection) {
      return;
    }

    this.selection = index;
    if (this.providerSelect) {
      this.providerSelect.value = String(index);
    }

    this.map?.fire('geosearch/providerchange', {
      provider: this.getSelectedProvider(),
      providers: this.getProviders(),
    });

    // search the typed text again with the new provider
    if (!this.resultList) {
      return;
    }

    const query = this.searchElement.input.value;
    if (this.options.autoComplete) {
      this.lastQuery = '';
      this.suggest(query);
    } else if (query && this.resultList.count() > 0) {
      this.onSubmit({ query });
    }
  },

  getSelectedProvider() {
    return this.selection === 'all'
      ? { index: 'all', label: this.options.allProvidersLabel as string }
      : { ...this.choices[this.selection] };
  },

  getProviders() {
    return this.choices.map((choice) => ({ ...choice }));
  },

  reset() {
    this.clearResults(null, true);
    this.searchElement.input.value = '';
    removeClassName(this.searchElement.container, 'error');
    this.searchElement.hasError = false;
  },

  setQuery(query) {
    this.searchElement.input.value = query;
    // a selected suggestion no longer matches the text
    this.resultList?.select(-1);
  },

  setLabels(labels) {
    const given = withoutUndefined(labels);
    Object.assign(this.options, given);

    if (given.searchLabel !== undefined) {
      this.searchElement.input.placeholder = given.searchLabel;
      this.button.title = given.searchLabel;
      this.button.setAttribute('aria-label', given.searchLabel);
    }
    if (given.clearSearchLabel !== undefined) {
      this.resetButton.setAttribute('aria-label', given.clearSearchLabel);
    }
    if (given.notFoundMessage !== undefined) {
      this.resultList?.setNotFoundMessage(given.notFoundMessage);
    }
    if (given.providerSelectLabel !== undefined && this.providerSelect) {
      this.providerSelect.setAttribute('aria-label', given.providerSelectLabel);
    }
  },

  setProviderSelectVisible(visible) {
    this.options.showProviderSelect = visible;
    if (this.providerSelect) {
      this.providerSelect.hidden = !visible;
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
      provider: this.sources.get(result),
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
    const {
      marker: options,
      showPopup,
      popupFormat,
      markerPopup,
      popupOptions,
    } = this.options;
    const marker = new L.Marker([result.y, result.x], options);

    if (markerPopup) {
      let popupLabel = result.label;
      if (typeof popupFormat === 'function') {
        popupLabel = popupFormat({
          query,
          result,
          provider: this.sources.get(result),
        });
      }

      marker.bindPopup(popupLabel, popupOptions);
    }

    this.markers.addLayer(marker);

    if (markerPopup && showPopup) {
      marker.openPopup();
    }

    if (options.draggable) {
      marker.on('dragend', (args: L.DragEndEvent) => {
        this.map.fireEvent('geosearch/marker/dragend', {
          location: marker.getLatLng(),
          event: args,
        });

        if (this.options.reverseOnDragEnd) {
          this.reverseMarker(marker, result);
        }
      });
    }

    return marker;
  },

  async reverseMarker(marker, result) {
    const { lat, lng } = marker.getLatLng();
    const choice =
      this.sources.get(result) ||
      this.choices[this.selection === 'all' ? 0 : this.selection];

    // a newer drag of the same marker makes this lookup outdated
    const ids = (this.reverseIds = this.reverseIds || new WeakMap());
    const id = (ids.get(marker) || 0) + 1;
    ids.set(marker, id);

    let places: SearchResult[];
    try {
      if (typeof choice.provider.reverse !== 'function') {
        throw new Error('This provider does not support reverse geocoding');
      }
      places = await choice.provider.reverse({ lat, lng });
    } catch (error) {
      if (ids.get(marker) === id) {
        this.map?.fire('geosearch/error', {
          error,
          query: `${lat},${lng}`,
          source: 'reverse',
          provider: choice,
        });
      }
      return;
    }

    const [place] = places;
    if (ids.get(marker) !== id || !place) {
      return;
    }

    this.sources.set(place, choice);
    const { popupFormat, keepResult, markerPopup } = this.options;
    if (markerPopup) {
      marker.setPopupContent(
        popupFormat({
          query: { query: place.label },
          result: place,
          provider: choice,
        }),
      );
    }

    if (keepResult) {
      this.searchElement.input.value = place.label;
    }

    this.map?.fire('geosearch/marker/reverse', {
      location: place,
      marker,
      provider: choice,
    });
  },

  centerMap(result) {
    const { retainZoomLevel, animateZoom, zoomToBounds, fitBoundsOptions } =
      this.options;
    const options = { animate: animateZoom };

    // plain arrays instead of Leaflet objects: a map created with another copy
    // of Leaflet doesn't recognize our instances ("Bounds are not valid")
    const bounds = toBoundsTuple(result.bounds);

    if (!retainZoomLevel && zoomToBounds && bounds) {
      this.map.fitBounds(bounds, { ...fitBoundsOptions, ...options });
      return;
    }

    // without fitting the bounds, the result itself is the better center
    const center =
      bounds && (zoomToBounds || !hasPosition(result))
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

// SearchControl works with and without new, the type allows both (#334)
interface SearchControlConstructor {
  new (...options: any[]): SearchControl & L.Control;
  (...options: any[]): SearchControl & L.Control;
}

// extend creates a new class on every call, so it's only done once
let LControl:
  (new (...options: any[]) => SearchControl & L.Control) | undefined;

const SearchControl = function SearchControl(...options: any[]) {
  if (!L) {
    throw new Error(UNINITIALIZED_ERR);
  }

  if (!LControl) {
    LControl = L.Control.extend(Control);
  }

  return new LControl(...options);
} as SearchControlConstructor;

export default SearchControl;
