import AbstractProvider, {
  BoundsTuple,
  EndpointArgument,
  LatLng,
  ParseArgument,
  ProviderOptions,
  ProviderParams,
  RequestType,
  ReverseArgument,
  SearchArgument,
  SearchResult,
  readJson,
} from './provider';

interface GeoCoordinates {
  // omitted when 0
  lat?: number;
  lon?: number;
  boundingBox?: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

/** an autocomplete suggestion, or a retrieved one with geoCoordinates */
export interface Suggestion {
  id: string;
  displayName: string;
  type?: string;
  countryCode?: string;
  category?: string;
  geoCoordinates?: GeoCoordinates;
}

export interface ReverseResult {
  address: {
    displayName: string;
    geoCoordinates?: GeoCoordinates;
    addressDetails?: { [key: string]: unknown };
    goodMatch?: boolean;
  };
  distanceM?: number;
  layer?: string;
}

export type RawResult = Suggestion | ReverseResult;

export type RequestResult =
  { suggestions?: Suggestion[] } | { results?: ReverseResult[] } | Suggestion;

export type OpenGeocodingProviderOptions = {
  apiKey: string;
  // a proxy with the routes of the hosted api, e.g. one that adds the key
  host?: string;
} & ProviderOptions;

export default class OpenGeocodingProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  apiKey: string;
  host: string;

  constructor(options: OpenGeocodingProviderOptions = { apiKey: '' }) {
    super(options);
    this.apiKey = options.apiKey;
    this.host = options.host || 'https://api.opengeocoding.com';
  }

  // params only go to autocomplete: the other endpoints reject unknown ones
  endpoint({ query, type }: EndpointArgument): string {
    if (type === RequestType.REVERSE) {
      return `${this.host}/v1/reverse?${encode(query as ProviderParams)}`;
    }

    return this.getUrl(`${this.host}/v1/autocomplete`, {
      text: query as string,
    });
  }

  reverseParams({ lat, lng }: LatLng): ProviderParams {
    return { lat, lon: lng };
  }

  /**
   * suggestions are free but have no coordinates. A picked one comes back
   * as data and is looked up by its id, which costs a request
   */
  async search({
    query,
    data,
    signal,
  }: SearchArgument & { data?: SearchResult<RawResult> }): Promise<
    SearchResult<RawResult>[]
  > {
    const id = data && !Number.isFinite(data.x) && (data.raw as Suggestion).id;
    const url = id
      ? `${this.host}/v1/retrieve?${encode({ id })}`
      : this.endpoint({ query, type: RequestType.SEARCH });

    return this.parse({ data: await this.request(url, signal) });
  }

  async reverse({
    lat,
    lng,
    signal,
  }: ReverseArgument): Promise<SearchResult<RawResult>[]> {
    const query = this.reverseParams({ lat, lng });
    const url = this.endpoint({ query, type: RequestType.REVERSE });
    return this.parse({ data: await this.request(url, signal) });
  }

  // the key is only accepted in a header, never in the url
  async request(url: string, signal?: AbortSignal): Promise<RequestResult> {
    const response = await fetch(url, {
      headers: { 'x-api-key': this.apiKey },
      signal,
    });
    const json = await readJson<RequestResult & { message?: string }>(response);

    if (!response.ok) {
      throw new Error(
        json.message || `Request failed with status ${response.status}`,
      );
    }

    return json;
  }

  parse({ data }: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    if ('suggestions' in data) {
      return (data.suggestions || []).map((s) =>
        toResult(s.displayName, s.geoCoordinates, s),
      );
    }

    if ('results' in data) {
      return (data.results || []).map((r) =>
        toResult(r.address.displayName, r.address.geoCoordinates, r),
      );
    }

    return 'id' in data
      ? [toResult(data.displayName, data.geoCoordinates, data)]
      : [];
  }
}

function encode(params: ProviderParams): string {
  return Object.keys(params)
    .map(
      (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`,
    )
    .join('&');
}

function toResult(
  label: string,
  point: GeoCoordinates | undefined,
  raw: RawResult,
): SearchResult<RawResult> {
  const box = point && point.boundingBox;
  const bounds: BoundsTuple | null = box
    ? [
        [box.minLat, box.minLon],
        [box.maxLat, box.maxLon],
      ]
    : null;

  return {
    x: point ? point.lon || 0 : NaN,
    y: point ? point.lat || 0 : NaN,
    label,
    bounds,
    raw,
  };
}
