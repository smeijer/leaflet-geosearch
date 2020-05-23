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
   * Algolia not provides labels for hits, so
   * we will implement that builder ourselves
   */
  getLabel(result: RawResult): string {
    return [
      result.locale_names?.default, // Building + Street
      result.city?.default,
      result.administrative?.[0], // State / Province
      result.postcode?.[0], // Zip code / Postal code
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
