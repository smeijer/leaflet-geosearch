import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  SearchResult,
} from './provider';

export interface RequestResult {
  statusCode?: number;
  error?: string;
  message?: string;
  response: {
    GeoObjectCollection: {
      metaDataProperty: {
        GeocoderResponseMetaData: {
          request: string;
          found: string;
          results: string;
        };
      };
      featureMember: RawResult[];
    };
  };
}

export interface RawResult {
  GeoObject: {
    metaDataProperty: {
      GeocoderMetaData: {
        kind: string;
        text: string;
        precision: string;
        Address: {
          country_code: string;
          formatted: string;
          Components: {
            kind: string;
            name: string;
          }[];
        };
      };
    };
    Point: {
      pos: string;
    };
    boundedBy: {
      Envelope: {
        lowerCorner: string;
        upperCorner: string;
      };
    };
  };
}

export default class YandexProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl = 'https://geocode-maps.yandex.ru/1.x/';

  endpoint({ query }: EndpointArgument): string {
    const params = typeof query === 'string' ? { geocode: query } : query;
    params.format = 'json';
    params.lang = 'en_US';

    return this.getUrl(this.searchUrl, params);
  }

  parse(result: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    if (result.data.error) {
      return [];
    }

    return result.data.response.GeoObjectCollection.featureMember.map((r) => ({
      x: parseFloat(r.GeoObject.Point.pos.split(' ')[0]),
      y: parseFloat(r.GeoObject.Point.pos.split(' ')[1]),
      label: r.GeoObject.metaDataProperty.GeocoderMetaData.text,
      bounds: [
        [
          parseFloat(r.GeoObject.boundedBy.Envelope.lowerCorner.split(' ')[0]),
          parseFloat(r.GeoObject.boundedBy.Envelope.lowerCorner.split(' ')[1]),
        ], // s, w
        [
          parseFloat(r.GeoObject.boundedBy.Envelope.upperCorner.split(' ')[0]),
          parseFloat(r.GeoObject.boundedBy.Envelope.upperCorner.split(' ')[1]),
        ], // n, e
      ],
      raw: r,
    }));
  }
}
