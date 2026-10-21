import AbstractProvider, {
  BoundsTuple,
  EndpointArgument,
  ParseArgument,
  ProviderOptions,
  ProviderParams,
  RequestType,
  SearchResult,
} from './provider';

export interface RequestResult {
  type: 'FeatureCollection';
  features: RawResult[];
}

export interface RawResult {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    osm_type: string;
    osm_id: number;
    osm_key: string;
    osm_value: string;
    type: string;
    name?: string;
    housenumber?: string;
    street?: string;
    locality?: string;
    district?: string;
    postcode?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    // [west, north, east, south]
    extent?: [number, number, number, number];
  };
}

export type PhotonProviderOptions = {
  // a self-hosted Photon server
  host?: string;
} & ProviderOptions;

export default class PhotonProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl: string;
  reverseUrl: string;

  constructor(options: PhotonProviderOptions = {}) {
    super(options);

    const host = options.host || 'https://photon.komoot.io';
    this.searchUrl = `${host}/api`;
    this.reverseUrl = `${host}/reverse`;
  }

  endpoint({ query, type }: EndpointArgument): string {
    const params: ProviderParams =
      typeof query === 'string' ? { q: query } : { ...query };

    switch (type) {
      case RequestType.REVERSE:
        return this.getUrl(this.reverseUrl, params);

      default:
        return this.getUrl(this.searchUrl, params);
    }
  }

  parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    return response.data.features.map((r) => {
      const [x, y] = r.geometry.coordinates;
      const extent = r.properties.extent;
      const bounds: BoundsTuple | null = extent
        ? [
            [extent[3], extent[0]], // s, w
            [extent[1], extent[2]], // n, e
          ]
        : null;

      return { x, y, label: label(r.properties), bounds, raw: r };
    });
  }
}

// Photon has no display name, so it's put together from the address parts
function label(p: RawResult['properties']): string {
  const street = [p.street, p.housenumber].filter(Boolean).join(' ');
  const city = [p.postcode, p.city].filter(Boolean).join(' ');
  const parts = [p.name, street, city, p.state, p.country].filter(
    (part): part is string => !!part,
  );

  // a city's name is also its city, a street's name is its street
  return parts.filter((part, i) => parts.indexOf(part) === i).join(', ');
}
