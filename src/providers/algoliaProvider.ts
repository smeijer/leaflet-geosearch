import AbstractProvider, {
  LatLng,
  ParseArgument,
  SearchArgument,
  SearchResult,
} from './provider';

interface RequestResult {
  hits: RawResult[];
}

interface ValueMatch {
  value: string;
  matchLevel: string;
  matchedWords: string[];
  fullyHighlighted?: boolean;
}

interface RawResult {
  country: { [key: string]: string };
  country_code: string;
  city: { [key: string]: string[] };
  importance: number;
  _tags: string[];
  postcode: string[];
  population: number;
  is_country: boolean;
  is_highway: boolean;
  is_city: boolean;
  is_popular: boolean;
  administrative: string[];
  admin_level: number;
  is_suburb: boolean;
  locale_names: {
    default: string[];
  };
  _geoloc: LatLng;
  objectID: string;
  _highlightResult: {
    country: {
      default: ValueMatch;
      [key: string]: ValueMatch;
    };
    city: {
      default: ValueMatch[];
      [key: string]: ValueMatch[];
    };
    postcode: ValueMatch[];
    administrative: ValueMatch[];
    locale_names: {
      default: ValueMatch[];
    };
  };
}

interface ProviderOptions {
  key?: string;
  [key: string]: string | boolean | number | undefined;
}

export default class Provider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  endpoint(): string {
    // No query, Algolia requires POST request
    return 'https://places-dsn.algolia.net/1/places/query';
  }

  /**
   * Find index of value with best match
   * (full, fallback to partial, and then to 0)
   */
  findBestMatchLevelIndex(vms: ValueMatch[]): number {
    const match =
      vms.find((vm) => vm.matchLevel === 'full') ||
      vms.find((vm) => vm.matchLevel === 'partial');
    return match ? vms.indexOf(match) : 0;
  }

  /**
   * Algolia not provides labels for hits, so
   * we will implement that builder ourselves
   */
  getLabel(result: RawResult): string {
    return [
      // Building + Street
      result.locale_names?.default[
        this.findBestMatchLevelIndex(
          result._highlightResult.locale_names.default,
        )
      ],
      // City
      result.city?.default[
        this.findBestMatchLevelIndex(result._highlightResult.city.default)
      ],
      // Administrative (State / Province)
      result.administrative[
        this.findBestMatchLevelIndex(result._highlightResult.administrative)
      ],
      // Zip code / Postal code
      result.postcode?.[
        this.findBestMatchLevelIndex(result._highlightResult.postcode)
      ],
      // Country
      result.country?.default,
    ]
      .filter(Boolean)
      .join(', ');
  }

  parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    return response.data.hits.map((r) => ({
      x: r._geoloc.lng,
      y: r._geoloc.lat,
      label: this.getLabel(r),
      bounds: null, // Algolia API does not provide bounds
      raw: r,
    }));
  }

  async search({ query }: SearchArgument): Promise<SearchResult<RawResult>[]> {
    const params = typeof query === 'string' ? { query } : query;

    const request = await fetch(this.endpoint(), {
      method: 'POST',
      body: JSON.stringify({
        ...this.options.params,
        ...params,
      }),
    });

    const json = await request.json();
    return this.parse({ data: json });
  }
}
