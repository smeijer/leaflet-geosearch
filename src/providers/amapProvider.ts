import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  SearchResult,
} from './provider';

export type RequestResult = {
  status: number;
  count: number;
  info: string;
  geocodes: RawResult[];
};

export interface RawResult {
  formatted_address: string;
  country: string;
  province: string;
  city: string;
  citycode: string;
  district: string;
  number: string;
  adcode: string;
  location: string;
  level: string;
}

export default class AMapProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl = 'https://restapi.amap.com/v3/geocode/geo';

  endpoint({ query }: EndpointArgument): string {
    const params = typeof query === 'string' ? { address: query } : query;
    params.output = 'JSON';

    return this.getUrl(this.searchUrl, params);
  }

  parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    const records = response.data.geocodes ?? [];

    return records.map((r) => ({
      x: Number(r.location.substring(0, r.location.indexOf(','))),
      y: Number(r.location.substring(r.location.indexOf(',') + 1)),
      label: r.formatted_address,
      bounds: null,
      raw: r,
    }));
  }
}
