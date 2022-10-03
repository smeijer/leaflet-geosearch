import AbstractProvider, {
  EndpointArgument,
  LatLng,
  ParseArgument,
  SearchResult,
} from './provider';

export interface RequestResult {
  items: RawResult[];
}

export interface RawResult {
  title: string;
  id: string;
  resultType: string;
  address: {
    label: string;
    countryCode: string;
    countryName: string;
    state: string;
    county: string;
    city: string;
    district: string;
    street: string;
    postalCode: string;
    houseNumber: string;
  };
  position: LatLng;
  access: LatLng[];
  categories: { id: string }[];
  contacts: { [key: string]: { value: string }[] }[];
  scoring: {
    queryScore: number;
    fieldScore: {
      placeName: number;
    };
  };
}

export default class HereProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl = 'https://geocode.search.hereapi.com/v1/autosuggest';

  endpoint({ query }: EndpointArgument): string {
    const params = typeof query === 'string' ? { q: query } : query;
    return this.getUrl(this.searchUrl, params);
  }

  parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    return response.data.items
      .filter((r) => r.position !== undefined)
      .map((r) => ({
        x: r.position.lng,
        y: r.position.lat,
        label: r.address.label,
        bounds: null,
        raw: r,
      }));
  }
}
