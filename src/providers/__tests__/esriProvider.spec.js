import Provider from '../esriProvider';
import fixtures from './esriResponse.json';

describe('EsriProvider', () => {
  beforeAll(() => {
    fetch.mockResponse(async () => ({ body: JSON.stringify(fixtures) }));
  });

  test('Can fetch results', async () => {
    const provider = new Provider();

    const results = await provider.search({ query: 'Madurodam' });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(fixtures.locations[0].feature.geometry.x);
    expect(result.y).toEqual(fixtures.locations[0].feature.geometry.y);
    expect(result.bounds).toBeValidBounds();
  });
});
