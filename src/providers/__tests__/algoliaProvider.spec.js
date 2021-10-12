import Provider from '../algoliaProvider';
import fixtures from './algoliaResponse.json';

describe('AlgoliaProvider', () => {
  beforeAll(() => {
    fetch.mockResponse(async () => ({ body: JSON.stringify(fixtures) }));
  });

  test('Can fetch results', async () => {
    const provider = new Provider();

    const results = await provider.search({ query: 'Madurodam' });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(fixtures.hits[0]._geoloc.lng);
    expect(result.y).toEqual(fixtures.hits[0]._geoloc.lat);
    expect(result.bounds).toBeValidBounds();
  });
});
