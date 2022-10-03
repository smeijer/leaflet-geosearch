import Provider from '../legacyGoogleProvider';
import fixtures from './googleResponse.json';

describe('LegacyGoogleProvider', () => {
  beforeAll(() => {
    fetch.mockResponse(async () => ({ body: JSON.stringify(fixtures) }));
  });

  test('Can fetch results', async () => {
    const provider = new Provider({
      params: {
        key: process.env.GOOGLE_API_KEY,
      },
    });

    const results = await provider.search({ query: 'Madurodam' });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(fixtures.results[0].geometry.location.lng);
    expect(result.y).toEqual(fixtures.results[0].geometry.location.lat);
    expect(result.bounds).toBeValidBounds();
  });

  test.skip('Can get localized results', async () => {
    const provider = new Provider({
      params: {
        key: process.env.GOOGLE_API_KEY,
        language: 'nl',
      },
    });

    const results = await provider.search({ query: 'Madurodam' });
    t.is(results[0].label, 'Madurodam');
  });
});
