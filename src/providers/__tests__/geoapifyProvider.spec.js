import Provider from '../geoapifyProvider';
import fixtures from './geoapifyResponse.json';

describe('Geoapify', () => {
  beforeAll(() => {
    fetch.mockResponse(async () => ({ body: JSON.stringify(fixtures) }));
  });

  test('Can fetch results', async () => {
    const provider = new Provider({
      params: {
        apiKey: process.env.GEOAPIFY_API_KEY,
      },
    });

    const results = await provider.search({ query: 'Chicago' });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(+fixtures.results[0].lon);
    expect(result.y).toEqual(+fixtures.results[0].lat);
    expect(result.bounds).toBeValidBounds();
  });

  test.skip('Can get localized results', async () => {
    const provider = new Provider({
      params: {
        apiKey: process.env.GEOAPIFY_API_KEY,
        'accept-language': 'nl',
      },
    });

    const results = await provider.search({ query: 'Chicago' });
    t.is(
      results[0].label,
      '1214-1224 West Van Buren Street, Chicago, IL 60607, United States of America',
    );
  });
});
