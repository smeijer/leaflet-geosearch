import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  ProviderOptions,
  SearchResult,
  BoundsTuple,
} from './provider';

export type RequestResult = {
  features: RawResult[];
};
export interface RawResult {
  center: [string, string];
  text: string;
  place_name: string;
  bbox: [string, string, string, string];
}

export type MapBoxProviderOptions = {
  searchUrl?: string;
  reverseUrl?: string;
} & ProviderOptions;

export default class MapBoxProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl: string;

  constructor(options: MapBoxProviderOptions = {}) {
    super(options);

    const host = 'https://a.tiles.mapbox.com';
    this.searchUrl = options.searchUrl || `${host}/v4/geocode/mapbox.places/`;
  }

  endpoint({ query }: EndpointArgument): string {
    return this.getUrl(`${this.searchUrl}${query}.json`);
  }

  parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    const records = Array.isArray(response.data.features)
      ? response.data.features
      : [];

    return records.map((r) => {
      let bounds = null;
      if (r.bbox) {
        bounds = [
          [parseFloat(r.bbox[1]), parseFloat(r.bbox[0])], // s, w
          [parseFloat(r.bbox[3]), parseFloat(r.bbox[2])], // n, e
        ] as BoundsTuple;
      }

      return {
        x: Number(r.center[0]),
        y: Number(r.center[1]),
        label: r.place_name ? r.place_name : r.text,
        bounds,
        raw: r,
      };
    });
  }
}
