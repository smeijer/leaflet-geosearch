import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  ProviderOptions,
  RequestType,
  SearchResult,
} from './provider';

export type RequestResult = {
  results: RawResult[];
  query: RawQuery[];
};

export interface RawResult {
  country: string;
  country_code: string;
  state: string;
  county: string;
  city: string;
  postcode: number;
  suburb: string;
  street: string;
  lon: string;
  lat: string;
  state_code: string;
  formatted: string;
  bbox: BBox;
}

export interface RawQuery {
  text: string;
  parsed: RawQueryParsed;
}

export type RawQueryParsed = {
  city: string;
  expected_type: string;
};

export type BBox = {
  lon1: string;
  lat1: string;
  lon2: string;
  lat2: string;
};

export type GeoapifyProviderOptions = {
  searchUrl?: string;
  reverseUrl?: string;
} & ProviderOptions;

export default class GeoapifyProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl: string;
  reverseUrl: string;

  constructor(options: GeoapifyProviderOptions = {}) {
    super(options);

    const host = 'https://api.geoapify.com/v1/geocode';
    this.searchUrl = options.searchUrl || `${host}/search`;
    this.reverseUrl = options.reverseUrl || `${host}/reverse`;
  }

  endpoint({ query, type }: EndpointArgument): string {
    const params = typeof query === 'string' ? { text: query } : query;
    params.format = 'json';

    switch (type) {
      case RequestType.REVERSE:
        return this.getUrl(this.reverseUrl, params);

      default:
        return this.getUrl(this.searchUrl, params);
    }
  }

  parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    const records = Array.isArray(response.data.results)
      ? response.data.results
      : [response.data.results];
    return records.map((r) => ({
      x: Number(r.lon),
      y: Number(r.lat),
      label: r.formatted,
      bounds: [
        [parseFloat(r.bbox.lat1), parseFloat(r.bbox.lon1)], // s, w
        [parseFloat(r.bbox.lat2), parseFloat(r.bbox.lon2)], // n, e
      ],
      raw: r,
    }));
  }
}
