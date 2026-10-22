import Provider from '../locationIQProvider';
import fixtures from './locationiqResponse.json';
import reverseFixture from './openstreetmapReverseResponse.json';
import { answerRequests, mockResponse } from '../../../test';

describe('LocationIQProvider', () => {
  beforeAll(() => {
    mockResponse(JSON.stringify(fixtures));
  });

  test('Can fetch results', async () => {
    const provider = new Provider({
      params: {
        key: process.env.LOCATIONIQ_API_KEY,
      },
    });

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
        key: process.env.LOCATIONIQ_API_KEY,
        'accept-language': 'nl',
      },
    });

    const results = await provider.search({ query: 'Madurodam' });
    t.is(results[0].label, 'Madurodam');
  });
});

describe('LocationIQProvider reverse', () => {
  test('asks /v1/reverse.php with lat, lon and the key', async () => {
    const urls = answerRequests(reverseFixture);

    await new Provider({ params: { key: 'key' } }).reverse({
      lat: 52.3731,
      lng: 4.8926,
    });

    expect(`${urls[0].host}${urls[0].pathname}`).toEqual(
      'locationiq.org/v1/reverse.php',
    );
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      lat: '52.3731',
      lon: '4.8926',
      format: 'json',
      key: 'key',
    });
  });

  // LocationIQ answers in the format of Nominatim
  test('reads a reverse answer', async () => {
    answerRequests(reverseFixture);

    const [place] = await new Provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(place.label).toEqual(reverseFixture.display_name);
  });
});
