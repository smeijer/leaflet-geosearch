import AbstractProvider, {
  ProviderParams,
  EndpointArgument,
  ParseArgument,
  SearchResult,
} from './provider';

export interface RequestResult {
  spatialReference: { wkid: number; latestWkid: number };
  locations: RawResult[];
}

export interface RawResult {
  name: string;
  extent: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  feature: {
    geometry: { x: number; y: number };
    attributes: { Score: number; Addr_Type: string };
  };
}

const anonymousUrl =
  'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find';
// ArcGIS wants requests with a token (an API key) on this host
const authenticatedUrl =
  'https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/find';

export default class EsriProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl = anonymousUrl;

  endpoint({ query }: EndpointArgument): string {
    const params: ProviderParams =
      typeof query === 'string' ? { text: query } : { ...query };
    params.f = 'json';

    // find returns a single location unless it is asked for more
    if (
      params.maxLocations === undefined &&
      this.options.params?.maxLocations === undefined
    ) {
      params.maxLocations = 5;
    }

    const token = params.token ?? this.options.params?.token;
    const url =
      token && this.searchUrl === anonymousUrl
        ? authenticatedUrl
        : this.searchUrl;

    return this.getUrl(url, params);
  }

  parse(result: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    return result.data.locations.map((r) => ({
      x: r.feature.geometry.x,
      y: r.feature.geometry.y,
      label: r.name,
      bounds: [
        [r.extent.ymin, r.extent.xmin], // s, w
        [r.extent.ymax, r.extent.xmax], // n, e
      ],
      raw: r,
    }));
  }
}
