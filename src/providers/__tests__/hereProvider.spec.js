import Provider from '../hereProvider';
import fixtures from './hereResponse.json';

describe('HereProvider', () => {
  beforeAll(() => {
    fetch.mockResponse(async () => ({ body: JSON.stringify(fixtures) }));
  });

  test('Can fetch results', async () => {
    const provider = new Provider({
      params: {
        apiKey: process.env.HERE_API_KEY,
      },
    });

    const results = await provider.search({ query: 'Madurodam' });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(+fixtures.items[0].position.lng);
    expect(result.y).toEqual(+fixtures.items[0].position.lat);
    // here provider doesn't return bounds :(
    expect(result.bounds).toBeValidBounds();
  });
});
