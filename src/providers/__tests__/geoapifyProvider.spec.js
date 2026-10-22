import Provider from '../geoapifyProvider';
import fixtures from './geoapifyResponse.json';
import { answerRequests, mockResponse } from '../../../test';

describe('Geoapify', () => {
  beforeAll(() => {
    mockResponse(JSON.stringify(fixtures));
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

describe('Geoapify reverse', () => {
  test('asks /reverse with lat and lon', async () => {
    const urls = answerRequests(fixtures);

    await new Provider({ params: { apiKey: 'key' } }).reverse({
      lat: 52.3731,
      lng: 4.8926,
    });

    expect(`${urls[0].host}${urls[0].pathname}`).toEqual(
      'api.geoapify.com/v1/geocode/reverse',
    );
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      lat: '52.3731',
      lon: '4.8926',
      format: 'json',
      apiKey: 'key',
    });
  });

  // with format=json a reverse answer has the same format as a search answer
  test('reads a reverse answer', async () => {
    answerRequests(fixtures);

    const [place] = await new Provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(place.label).toEqual(fixtures.results[0].formatted);
  });
});
