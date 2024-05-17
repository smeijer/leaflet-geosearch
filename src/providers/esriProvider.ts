import AbstractProvider, {
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

export default class EsriProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl =
    'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find';

  endpoint({ query }: EndpointArgument): string {
    const params = typeof query === 'string' ? { text: query } : query;
    params.f = 'json';

    return this.getUrl(this.searchUrl, params);
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
