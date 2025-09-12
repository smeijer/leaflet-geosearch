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

  test('Can handle results without bbox', () => {
    const provider = new Provider();
    // Mock response with results that don't have bbox
    const mockResponse = {
      results: [
        {
          country: 'United States',
          country_code: 'us',
          state: 'Illinois',
          lon: '-87.625848',
          lat: '41.706446',
          formatted:
            '60 West 103rd Place, Chicago, IL 60628, United States of America',
        },
      ],
    };

    const results = provider.parse({ data: mockResponse });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(-87.625848);
    expect(result.y).toEqual(41.706446);
    expect(result.bounds).toBeNull(); // Should be null when no bbox
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
