export type PointTuple = [number, number];
export type BoundsTuple = [PointTuple, PointTuple];

export interface LatLng {
  lat: number;
  lng: number;
}

export interface SearchResult<TRawResult = any> {
  x: number;
  y: number;
  label: string;
  bounds: BoundsTuple | null;
  raw: TRawResult;
}

export interface ProviderParams {
  [key: string]: string | number | boolean;
}

export interface ProviderOptions {
  params?: ProviderParams;
}

export enum RequestType {
  SEARCH,
  REVERSE,
}

export interface EndpointArgument {
  query: string | { [key: string]: string | number | boolean };
  type?: RequestType;
}

export interface SearchArgument {
  query: string;
}

export interface ParseArgument<TData> {
  data: TData;
}

export interface Provider<TRequestResult, TRawResult> {
  options: ProviderOptions;

  endpoint(options: EndpointArgument): string;
  getParamString(params: ProviderParams): string;
  parse(response: ParseArgument<TRequestResult>): SearchResult<TRawResult>[];
  search(options: SearchArgument): Promise<SearchResult<TRawResult>[]>;
}

export default abstract class AbstractProvider<
  TRequestResult = any,
  TRawResult = any,
> implements Provider<TRequestResult, TRawResult>
{
  options: ProviderOptions;

  constructor(options: ProviderOptions = {}) {
    this.options = options;
  }

  abstract endpoint(options: EndpointArgument): string;
  abstract parse(
    response: ParseArgument<TRequestResult>,
  ): SearchResult<TRawResult>[];

  getParamString(params: ProviderParams = {}): string {
    const set = { ...this.options.params, ...params };
    return Object.keys(set)
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(set[key])}`,
      )
      .join('&');
  }

  getUrl(url: string, params?: ProviderParams): string {
    return `${url}?${this.getParamString(params)}`;
  }

  async search(options: SearchArgument): Promise<SearchResult<TRawResult>[]> {
    const url = this.endpoint({
      query: options.query,
      type: RequestType.SEARCH,
    });

    const request = await fetch(url);
    const json: TRequestResult = await request.json();
    return this.parse({ data: json });
  }
}
