import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  SearchArgument,
  SearchResult,
} from './provider';
import { Loader, LoaderOptions } from '@googlemaps/js-api-loader';

interface RequestResult {
  results: google.maps.GeocoderResult[];
  status?: google.maps.GeocoderStatus;
}

interface GeocodeError {
  code: Exclude<google.maps.GeocoderStatus, google.maps.GeocoderStatus.OK>;
  endpoint: 'GEOCODER_GEOCODE';
  message: string;
  name: 'MapsRequestError';
  stack: string;
}

export default class GoogleProvider extends AbstractProvider<
  RequestResult,
  google.maps.GeocoderResult
> {
  geocoder: () => Promise<google.maps.Geocoder>;
  googleApiOptions: LoaderOptions;

  constructor(googleApiOptions: LoaderOptions) {
    super();
    this.googleApiOptions = googleApiOptions;
    this.geocoder = this.memoizeGeocoder(this.fetchGeocoder);
  }

  endpoint({ query }: EndpointArgument): never {
    throw new Error('Method not implemented.');
  }

  parse(
    response: ParseArgument<RequestResult>,
  ): SearchResult<google.maps.GeocoderResult>[] {
    return response.data.results.map((r) => {
      const { lat, lng } = r.geometry.location.toJSON();
      const { east, north, south, west } = r.geometry.viewport.toJSON();

      return {
        x: lng,
        y: lat,
        label: r.formatted_address,
        bounds: [
          [south, west],
          [north, east],
        ],
        raw: r,
      };
    });
  }

  memoizeGeocoder(method: () => Promise<google.maps.Geocoder>) {
    let geocoder: Promise<google.maps.Geocoder>;

    return async function (this: GoogleProvider) {
      geocoder = geocoder || method.apply(this);
      return geocoder;
    };
  }

  async fetchGeocoder() {
    return await new Loader(this.googleApiOptions).load().then((google) => {
      return new google.maps.Geocoder();
    });
  }

  async search(
    options: SearchArgument,
  ): Promise<SearchResult<google.maps.GeocoderResult>[]> {
    const geoCoder = await this.geocoder();
    const response = await geoCoder
      .geocode(
        {
          address: options.query,
        },
        (
          response: google.maps.GeocoderResult[] | null,
          _: google.maps.GeocoderStatus,
        ) => {
          return { results: response };
        },
      )
      .catch((e: GeocodeError) => {
        if (e.code !== 'ZERO_RESULTS') {
          console.error(`${e.code}: ${e.message}`);
        }
        return { results: [] };
      });

    return this.parse({ data: response });
  }
}
