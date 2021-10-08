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

      // bounding box range checks
      if (feat.bbox) {
        expect(result.bounds[0][0]).toBeLessThan(result.bounds[1][0]); // south less than north
        expect(result.bounds[0][1]).toBeLessThan(result.bounds[1][1]); // west less than east
      } else {
        expect(result.bounds).toBeFalsy();
      }
    });
  });
});
