import Provider from '../geocodeEarthProvider';
import fixture from './peliasResponse.json';
import { answerRequests, mockResponse } from '../../../test';

describe('GeocodeEarthProvider', function () {
  beforeAll(() => {
    mockResponse(JSON.stringify(fixture));
  });

  test('Can fetch results', async () => {
    const provider = new Provider();
    const results = await provider.search({ query: 'pelias' });
    expect(results.length).toEqual(9);

    // feature mapping
    results.forEach((result, i) => {
      const feat = fixture.features[i];
      expect(result.label).toBeTruthy();
      expect(result.x).toEqual(+feat.geometry.coordinates[0]);
      expect(result.y).toEqual(+feat.geometry.coordinates[1]);
      expect(result.bounds).toBeValidBounds();
    });
  });
});

describe('GeocodeEarthProvider reverse', () => {
  test('asks /v1/reverse of geocode.earth with the api key', async () => {
    const urls = answerRequests(fixture);

    await new Provider({ params: { api_key: 'key' } }).reverse({
      lat: 52.3731,
      lng: 4.8926,
    });

    expect(`${urls[0].host}${urls[0].pathname}`).toEqual(
      'api.geocode.earth/v1/reverse',
    );
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      'point.lat': '52.3731',
      'point.lon': '4.8926',
      api_key: 'key',
    });
  });
});
