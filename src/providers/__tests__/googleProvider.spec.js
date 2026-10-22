import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import geocoderGeocoderResponse from './googleGeocoderResponse';
import Provider from '../googleProvider';

const fixtures = [geocoderGeocoderResponse];

function Geocoder() {
  this.geocode = async (_, callback) => {
    return callback(fixtures, 'OK');
  };
}

vi.mock('@googlemaps/js-api-loader', () => ({
  setOptions: vi.fn(),
  importLibrary: vi.fn(async () => ({ Geocoder })),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  delete globalThis.google;
});

describe('GoogleProvider', () => {
  test('Can fetch results', async () => {
    const provider = new Provider({ apiKey: process.env.GOOGLE_API_KEY });
    const results = await provider.search({ query: 'Madurodam' });
    const result = results[0];

    const { lng, lat } = fixtures[0].geometry.location.toJSON();

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(lng);
    expect(result.y).toEqual(lat);
    expect(result.bounds).toBeValidBounds();
  });

  test('loads the geocoding library with the 1.x option names', async () => {
    const provider = new Provider({
      apiKey: 'key',
      version: 'weekly',
      language: 'nl',
      region: 'nl',
      libraries: ['places'],
      params: { ignored: true },
    });
    await provider.loader;

    expect(setOptions).toHaveBeenCalledWith({
      key: 'key',
      v: 'weekly',
      language: 'nl',
      region: 'nl',
      libraries: ['places'],
    });
    expect(importLibrary).toHaveBeenCalledWith('geocoding');
    expect(provider.geocoder).toBeInstanceOf(Geocoder);
  });

  test('options the 2.x loader has no use for are ignored with a warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockReturnValue(undefined);
    const provider = new Provider({
      apiKey: 'key',
      url: 'https://example.com/maps/api/js',
      retries: 3,
    });
    await provider.loader;

    expect(setOptions).toHaveBeenCalledWith({ key: 'key' });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('retries, url'));
  });

  test('uses the Maps API when the page already loaded it', async () => {
    const PageGeocoder = vi.fn();
    globalThis.google = { maps: { Geocoder: PageGeocoder } };

    const provider = new Provider({ apiKey: 'key' });
    await provider.loader;

    expect(provider.geocoder).toBeInstanceOf(PageGeocoder);
    expect(setOptions).not.toHaveBeenCalled();
    expect(importLibrary).not.toHaveBeenCalled();
  });

  describe('answers of the geocoder (#399)', () => {
    // a geocoder that answers through the callback only, like versions of the
    // Maps API that return nothing when a callback is given
    function useGeocoder(answer) {
      const geocode = vi.fn((_, callback) => {
        answer(callback);
      });
      globalThis.google = {
        maps: {
          Geocoder: function () {
            this.geocode = geocode;
          },
        },
      };
      return geocode;
    }

    test('works when geocode returns nothing and only calls back', async () => {
      useGeocoder((callback) => callback(fixtures, 'OK'));

      const results = await new Provider({ apiKey: 'key' }).search({
        query: 'Madurodam',
      });

      expect(results).toHaveLength(1);
    });

    test('no results is an empty list', async () => {
      useGeocoder((callback) => callback(null, 'ZERO_RESULTS'));

      const results = await new Provider({ apiKey: 'key' }).search({
        query: 'nothing',
      });

      expect(results).toEqual([]);
    });

    test('other statuses reject, so the control can report them', async () => {
      useGeocoder((callback) => callback(null, 'REQUEST_DENIED'));

      await expect(
        new Provider({ apiKey: 'key' }).search({ query: 'Madurodam' }),
      ).rejects.toThrow('REQUEST_DENIED');
    });

    test('a key that Google rejects fails the search instead of hanging', async () => {
      // Google calls gm_authFailure and never answers the geocoder
      useGeocoder(() => {});
      const provider = new Provider({ apiKey: 'wrong' });
      await provider.loader;

      const pending = provider.search({ query: 'Madurodam' });
      window.gm_authFailure();

      await expect(pending).rejects.toThrow('rejected the API key');
      // later searches fail right away
      await expect(provider.search({ query: 'again' })).rejects.toThrow(
        'rejected the API key',
      );
    });

    test('an aborted search rejects', async () => {
      useGeocoder(() => {});
      const controller = new AbortController();
      const provider = new Provider({ apiKey: 'key' });

      const pending = provider.search({
        query: 'Madurodam',
        signal: controller.signal,
      });
      controller.abort();

      await expect(pending).rejects.toThrow();
    });
  });

  test('uses importLibrary of a Maps API the page loaded with loading=async', async () => {
    const PageGeocoder = vi.fn();
    const pageImportLibrary = vi.fn(async () => ({ Geocoder: PageGeocoder }));
    globalThis.google = { maps: { importLibrary: pageImportLibrary } };

    const provider = new Provider({ apiKey: 'key' });
    await provider.loader;

    expect(pageImportLibrary).toHaveBeenCalledWith('geocoding');
    expect(provider.geocoder).toBeInstanceOf(PageGeocoder);
    expect(importLibrary).not.toHaveBeenCalled();
  });

  test.skip('Can get localized results', async () => {
    const provider = new Provider({ apiKey: process.env.GOOGLE_API_KEY });
    const results = await provider.search({ query: 'Madurodam' });
    expect(results[0].label).toEqual(
      'George Maduroplein 1, 2584 RZ Den Haag, Netherlands',
    );
  });
});
