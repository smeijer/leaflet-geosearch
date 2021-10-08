import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  ProviderOptions,
  RequestType,
  SearchResult,
} from './provider';

export interface RequestResult {
  geocoding: object;
  features: RawResult[];
}

export type PeliasProviderOptions = {
  host?: string;
} & ProviderOptions;

export interface RawResult {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  bbox?: [number, number, number, number];
  properties: {
    id: string;
    source_id: string;
    gid: string;

    layer: string;
    source: string;

    label: string;
    name: string;

    accuracy: 'centroid' | 'point';
    confidence?: number;
    match_type?: 'exact' | 'interpolated' | 'fallback';

    borough?: string;
    borough_a?: string;
    borough_gid?: string;
    continent?: string;
    continent_a?: string;
    continent_gid?: string;
    country?: string;
    country_a?: string;
    country_gid?: string;
    county?: string;
    county_a?: string;
    county_gid?: string;
    dependency?: string;
    dependency_a?: string;
    dependency_gid?: string;
    empire?: string;
    empire_a?: string;
    empire_gid?: string;
    localadmin?: string;
    localadmin_a?: string;
    localadmin_gid?: string;
    locality?: string;
    locality_a?: string;
    locality_gid?: string;
    macrocounty?: string;
    macrocounty_a?: string;
    macrocounty_gid?: string;
    macroregion?: string;
    macroregion_a?: string;
    macroregion_gid?: string;
    marinearea?: string;
    marinearea_a?: string;
    marinearea_gid?: string;
    neighbourhood?: string;
    neighbourhood_a?: string;
    neighbourhood_gid?: string;
    ocean?: string;
    ocean_a?: string;
    ocean_gid?: string;
    postalcode?: string;
    postalcode_a?: string;
    postalcode_gid?: string;
    region?: string;
    region_a?: string;
    region_gid?: string;

    street?: string;
    housenumber?: string;

    addendum?: any;
  };
}

export default class PeliasProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  // Pelias servers are self-hosted so you'll need to configure the 'options.host' string
  // to identify where requests to your running pelias/api server instance should be sent.
  // note: you SHOULD include the scheme, domain and port but NOT any path or parameters.
  // If you're using the Docker setup (https://github.com/pelias/docker)
  // then the default host of 'http://localhost:4000' will work out of the box.
  host: string;

  constructor(options: PeliasProviderOptions = {}) {
    super(options);
    this.host = options.host || 'http://localhost:4000';
  }

  /**
   * note: Pelias has four different query modes:
   * /v1/autocomplete: for partially completed inputs (such as when a user types)
   * /v1/search: for completed inputs (such as when geocoding a CSV file)
   * /v1/search/structured: for completed inputs with fields already separated
   * /v1/reverse: for finding places nearby/enveloping a point
   */
  endpoint({ query, type }: EndpointArgument) {
    switch (type) {
      // case RequestType.AUTOCOMPLETE:
      //   const autocompleteParams = (typeof query === 'string') ? { text: query } : query;
      //   return this.getUrl(`${this.host}/v1/autocomplete`, autocompleteParams);

      // case RequestType.FULLTEXT:
      //   const searchParams = (typeof query === 'string') ? { text: query } : query;
      //   return this.getUrl(`${this.host}/v1/search`, searchParams);

      // case RequestType.STRUCTURED:
      //   const structuredParams = (typeof query === 'string') ? { address: query } : query;
      //   return this.getUrl(`${this.host}/v1/search/structured`, structuredParams);

      case RequestType.REVERSE:
        const reverseParams = typeof query === 'string' ? {} : query;
        return this.getUrl(`${this.host}/v1/reverse`, reverseParams);

      // note: the default query mode is set to 'autocomplete'
      default:
        const autocompleteParams =
          typeof query === 'string' ? { text: query } : query;
        return this.getUrl(`${this.host}/v1/autocomplete`, autocompleteParams);
    }
  }

  parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    return response.data.features.map((feature) => {
      const res: SearchResult<RawResult> = {
        x: feature.geometry.coordinates[0],
        y: feature.geometry.coordinates[1],
        label: feature.properties.label,
        bounds: null,
        raw: feature,
      };

      // bbox values are only available for features derived from non-point geometries
      // geojson bbox format: [minX, minY, maxX, maxY]
      if (Array.isArray(feature.bbox) && feature.bbox.length === 4) {
        res.bounds = [
          [feature.bbox[1], feature.bbox[0]], // s, w
          [feature.bbox[3], feature.bbox[2]], // n, e
        ];
      }

      return res;
    });
  }
}
