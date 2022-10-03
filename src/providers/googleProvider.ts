import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  ProviderOptions,
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

export type GoogleProviderOptions = LoaderOptions & ProviderOptions;

export default class GoogleProvider extends AbstractProvider<
  RequestResult,
  google.maps.GeocoderResult
> {
  loader: Promise<google.maps.Geocoder> | null = null;
  geocoder: google.maps.Geocoder | null = null;

  constructor(options: GoogleProviderOptions) {
    super(options);

    if (typeof window !== 'undefined') {
      this.loader = new Loader(options).load().then((google) => {
        const geocoder = new google.maps.Geocoder();
        this.geocoder = geocoder;
        return geocoder;
      });
    }
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

  async search(
    options: SearchArgument,
  ): Promise<SearchResult<google.maps.GeocoderResult>[]> {
    const geocoder = this.geocoder || (await this.loader);

    if (!geocoder) {
      throw new Error(
        'GoogleMaps GeoCoder is not loaded. Are you trying to run this server side?',
      );
    }

    const response = await geocoder
      .geocode({ address: options.query }, (response) => ({
        results: response,
      }))
      .catch((e: GeocodeError) => {
        if (e.code !== 'ZERO_RESULTS') {
          console.error(`${e.code}: ${e.message}`);
        }
        return { results: [] };
      });

    return this.parse({ data: response });
  }
}
