import { Loader } from '@googlemaps/js-api-loader';
import geocoderGeocoderResponse from './googleGeocoderResponse';
import Provider from '../googleProvider';

const fixtures = [geocoderGeocoderResponse];

jest.mock('@googlemaps/js-api-loader');

jest.spyOn(Loader.prototype, 'load').mockImplementation(async () => {
  return {
    maps: {
      Geocoder: function () {
        this.geocode = async (_, callback) => {
          return callback(fixtures, 'OK');
        };
      },
    },
  };
});

let provider = {};

beforeEach(async () => {
  provider = new Provider({ apiKey: process.env.GOOGLE_API_KEY });
});

describe('GoogleProvider', () => {
  test('Can fetch results', async () => {
    const results = await provider.search({ query: 'Madurodam' });
    const result = results[0];

    const { lng, lat } = fixtures[0].geometry.location.toJSON();

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(lng);
    expect(result.y).toEqual(lat);
    expect(result.bounds).toBeValidBounds();
  });

  test.skip('Can get localized results', async () => {
    const results = await provider.search({ query: 'Madurodam' });
    expect(results[0].label).toEqual(
      'George Maduroplein 1, 2584 RZ Den Haag, Netherlands',
    );
  });
});
