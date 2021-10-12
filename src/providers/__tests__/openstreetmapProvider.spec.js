import Provider from '../openStreetMapProvider';
import fixtures from './openstreetmapResponse.json';

describe('OpenStreetMapProvider', function () {
  beforeAll(() => {
    fetch.mockResponse(async () => ({ body: JSON.stringify(fixtures) }));
  });

  test('Can fetch results', async () => {
    const provider = new Provider();

    const results = await provider.search({ query: 'Madurodam' });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(+fixtures[0].lon);
    expect(result.y).toEqual(+fixtures[0].lat);
    expect(result.bounds).toBeValidBounds();
  });

  test.skip('Can get localized results', async () => {
    const provider = new Provider({
      params: {
        'accept-language': 'nl',
      },
    });

    const results = await provider.search({ query: 'Madurodam' });
    expect(results[0].label, 'Madurodam');
  });
});
