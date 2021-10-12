import Provider from '../geocodeEarthProvider';
import fixture from './peliasResponse.json';

describe('GeocodeEarthProvider', function () {
  beforeAll(() => {
    fetch.mockResponse(async () => ({ body: JSON.stringify(fixture) }));
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
