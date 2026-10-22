/// <reference types="google.maps" preserve="true" />
import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  ProviderOptions,
  SearchArgument,
  SearchResult,
} from './provider';
import {
  APIOptions,
  importLibrary,
  setOptions,
} from '@googlemaps/js-api-loader';

export interface RequestResult {
  results: google.maps.GeocoderResult[];
  status?: google.maps.GeocoderStatus;
}

export interface GeocodeError {
  code: Exclude<google.maps.GeocoderStatus, google.maps.GeocoderStatus.OK>;
  endpoint: 'GEOCODER_GEOCODE';
  message: string;
  name: 'MapsRequestError';
  stack: string;
}

// the options of @googlemaps/js-api-loader 1.x, which this provider used to
// pass on as they were. they keep working with the 2.x loader
export interface GoogleProviderOptions extends ProviderOptions {
  apiKey: string;
  /** Maps JavaScript API version, sent as `v` */
  version?: string;
  language?: string;
  region?: string;
  libraries?: string[];
  mapIds?: string[];
  authReferrerPolicy?: string;
  channel?: string;
  client?: string;
  solutionChannel?: string;
  /** @deprecated not supported by the 2.x loader, ignored */
  id?: string;
  /** @deprecated ignored, the loader uses the nonce of a script on the page */
  nonce?: string;
  /** @deprecated not supported by the 2.x loader, ignored */
  retries?: number;
  /** @deprecated ignored, the API always loads from maps.googleapis.com */
  url?: string;
}

const IGNORED_OPTIONS = ['id', 'nonce', 'retries', 'url'] as const;

function apiOptions(options: GoogleProviderOptions): APIOptions {
  const ignored = IGNORED_OPTIONS.filter((key) => options[key] !== undefined);
  if (ignored.length > 0) {
    console.warn(
      `GoogleProvider: the ${ignored.join(', ')} option(s) are not ` +
        'supported anymore and are ignored',
    );
  }

  const given: Record<string, unknown> = {
    key: options.apiKey,
    v: options.version,
    language: options.language,
    region: options.region,
    libraries: options.libraries,
    mapIds: options.mapIds,
    authReferrerPolicy: options.authReferrerPolicy,
    channel: options.channel,
    client: options.client,
    solutionChannel: options.solutionChannel,
  };

  // every key ends up in the script url, so leave out the unset ones
  const result: Record<string, unknown> = {};
  Object.keys(given).forEach((key) => {
    if (given[key] !== undefined) {
      result[key] = given[key];
    }
  });

  return result as APIOptions;
}

// Google calls window.gm_authFailure when it rejects the key, and then never
// answers the geocoder. Searches wait for this too, so they fail instead of
// hanging. Created once, other handlers on the page keep being called
let authFailure: Promise<never> | undefined;

function whenAuthFails(): Promise<never> {
  if (!authFailure) {
    authFailure = new Promise<never>((_, reject) => {
      const page = window as unknown as { gm_authFailure?: () => void };
      const previous = page.gm_authFailure;
      page.gm_authFailure = () => {
        previous?.();
        reject(
          new Error(
            'Google Maps rejected the API key, see the browser console for the reason',
          ),
        );
      };
    });
    // only searches report it
    authFailure.catch(() => {});
  }
  return authFailure;
}

function whenAborted(signal?: AbortSignal): Promise<never> {
  return new Promise<never>((_, reject) => {
    const abort = () =>
      reject(new DOMException('The search was aborted', 'AbortError'));
    if (signal?.aborted) {
      abort();
    }
    signal?.addEventListener('abort', abort);
  });
}

async function loadGeocoder(
  options: GoogleProviderOptions,
): Promise<google.maps.Geocoder> {
  // the Maps API is already on the page (a script tag, or a library like
  // GoogleMutant). loading it a second time breaks it
  const maps = typeof google !== 'undefined' ? google.maps : undefined;
  if (maps?.Geocoder) {
    return new maps.Geocoder();
  }

  // loaded with loading=async, the classes come from importLibrary
  if (maps?.importLibrary) {
    const { Geocoder } = (await maps.importLibrary(
      'geocoding',
    )) as google.maps.GeocodingLibrary;
    return new Geocoder();
  }

  setOptions(apiOptions(options));
  const { Geocoder } = await importLibrary('geocoding');
  return new Geocoder();
}

export default class GoogleProvider extends AbstractProvider<
  RequestResult,
  google.maps.GeocoderResult
> {
  loader: Promise<google.maps.Geocoder> | null = null;
  geocoder: google.maps.Geocoder | null = null;

  constructor(options: GoogleProviderOptions) {
    super(options);

    if (typeof window !== 'undefined') {
      whenAuthFails();
      this.loader = loadGeocoder(options).then((geocoder) => {
        this.geocoder = geocoder;
        return geocoder;
      });
    }
  }

  endpoint(_args: EndpointArgument): never {
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

    // the callback works with every version of the Maps API. some return
    // nothing from geocode when a callback is given
    const answer = new Promise<RequestResult>((resolve, reject) => {
      geocoder.geocode({ address: options.query }, (results, status) => {
        if (status === 'OK' || status === 'ZERO_RESULTS') {
          resolve({ results: results || [] });
        } else {
          reject(new Error(`Google geocoder answered ${status}`));
        }
      });
    });

    const response = await Promise.race([
      answer,
      whenAuthFails(),
      whenAborted(options.signal),
    ]);

    return this.parse({ data: response });
  }
}
