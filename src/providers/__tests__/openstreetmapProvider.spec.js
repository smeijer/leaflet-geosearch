import Provider from '../openStreetMapProvider';
import fixtures from './openstreetmapResponse.json';
import reverseFixture from './openstreetmapReverseResponse.json';
import { answerRequests, mockResponse } from '../../../test';

describe('OpenStreetMapProvider', function () {
  beforeAll(() => {
    mockResponse(JSON.stringify(fixtures));
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

describe('OpenStreetMapProvider reverse', () => {
  test('asks /reverse with lat and lon', async () => {
    const urls = answerRequests(reverseFixture);

    await new Provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(`${urls[0].host}${urls[0].pathname}`).toEqual(
      'nominatim.openstreetmap.org/reverse',
    );
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      lat: '52.3731',
      lon: '4.8926',
      format: 'json',
    });
  });

  test('reads the single place of a reverse answer', async () => {
    answerRequests(reverseFixture);

    const [place] = await new Provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(place.label).toEqual(reverseFixture.display_name);
    expect(place.x).toEqual(Number(reverseFixture.lon));
    expect(place.y).toEqual(Number(reverseFixture.lat));
    expect(place.bounds).toBeValidBounds();
  });

  test('passes the signal to fetch', async () => {
    answerRequests(reverseFixture);
    const controller = new AbortController();
    controller.abort();

    await expect(
      new Provider().reverse({
        ...{ lat: 52.3731, lng: 4.8926 },
        signal: controller.signal,
      }),
    ).rejects.toThrow();
  });
});
