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

  test.skip('Can get localized results', async () => {
    const provider = new Provider({ apiKey: process.env.GOOGLE_API_KEY });
    const results = await provider.search({ query: 'Madurodam' });
    expect(results[0].label).toEqual(
      'George Maduroplein 1, 2584 RZ Den Haag, Netherlands',
    );
  });
});
