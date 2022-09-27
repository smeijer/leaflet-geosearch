import AbstractProvider, {
  EndpointArgument,
  LatLng,
  ParseArgument,
  SearchResult,
} from './provider';

export interface RequestResult {
  results: RawResult[];
  status: string;
}

export interface RawResult {
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  formatted_address: string;
  geometry: {
    location: LatLng;
    location_type: string;
    viewport: {
      northeast: LatLng;
      southwest: LatLng;
    };
  };
  place_id: string;
  plus_code: {
    compound_code: string;
    global_code: string;
  };
  types: string[];
}

export default class LegacyGoogleProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl = 'https://maps.googleapis.com/maps/api/geocode/json';

  endpoint({ query }: EndpointArgument) {
    const params = typeof query === 'string' ? { address: query } : query;
    return this.getUrl(this.searchUrl, params);
  }

  parse(result: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    return result.data.results.map((r) => ({
      x: r.geometry.location.lng,
      y: r.geometry.location.lat,
      label: r.formatted_address,
      bounds: [
        [r.geometry.viewport.southwest.lat, r.geometry.viewport.southwest.lng], // s, w
        [r.geometry.viewport.northeast.lat, r.geometry.viewport.northeast.lng], // n, e
      ],
      raw: r,
    }));
  }
}
