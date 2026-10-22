import AbstractProvider, {
  ProviderParams,
  EndpointArgument,
  ParseArgument,
  SearchArgument,
  SearchResult,
} from './provider';
import { createScriptElement } from '../domUtils';

export interface RequestResult {
  authenticationResultCode: string;
  brandLogoUri: string;
  copyright: string;
  resourceSets: {
    estimatedTotal: number;
    resources: RawResult[];
  }[];
  statusCode: number;
  statusDescription: string;
  traceId: string;
}

export interface RawResult {
  __type: string;
  bbox: [number, number, number, number];
  name: string;
  point: { type: 'Point'; coordinates: [number, number] };
  address: {
    adminDistrict: string;
    adminDistrict2: string;
    countryRegion: string;
    formattedAddress: string;
    locality: string;
  };
  confidence: string;
  entityType: string;
  geocodePoints: [
    {
      type: 'Point';
      coordinates: [number, number];
      calculationMethod: string;
      usageTypes: string[];
    },
  ];
  matchCodes: string[];
}

let jsonpCalls = 0;

export default class BingProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl = 'https://dev.virtualearth.net/REST/v1/Locations';

  endpoint({ query, jsonp }: EndpointArgument & { jsonp: string }): string {
    const params: ProviderParams =
      typeof query === 'string' ? { q: query } : { ...query };
    params.jsonp = jsonp;

    return this.getUrl(this.searchUrl, params);
  }

  parse(response: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    if (response.data.resourceSets.length === 0) {
      return [];
    }

    return response.data.resourceSets[0].resources.map((r) => ({
      x: r.point.coordinates[1],
      y: r.point.coordinates[0],
      label: r.address.formattedAddress,
      bounds: [
        [r.bbox[0], r.bbox[1]], // s, w
        [r.bbox[2], r.bbox[3]], // n, e
      ],
      raw: r,
    }));
  }

  async search({ query }: SearchArgument): Promise<SearchResult<RawResult>[]> {
    // unique, so searches at the same moment don't share a callback
    jsonpCalls += 1;
    const jsonp = `BING_JSONP_CB_${Date.now()}_${jsonpCalls}`;
    const json = await createScriptElement<RequestResult>(
      this.endpoint({ query, jsonp }),
      jsonp,
    );

    return this.parse({ data: json });
  }
}
