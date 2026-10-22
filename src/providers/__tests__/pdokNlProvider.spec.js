import Provider from '../pdokNlProvider';
import fixtures from './pdokNlResponse.json';
import reverseFixture from './pdokNlReverseResponse.json';
import { answerRequests, mockResponse } from '../../../test';

describe('PdokNlProvider', () => {
  beforeAll(() => {
    mockResponse(JSON.stringify(fixtures));
  });

  test('Can fetch results', async () => {
    const provider = new Provider();

    const results = await provider.search({ query: '3e Binnenvestgracht' });
    const result = results[0];

    const position = fixtures.response.docs[0].centroide_ll
      .replace(/POINT\(|\)/g, '')
      .trim()
      .split(' ')
      .map(Number);

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(position[0]);
    expect(result.y).toEqual(position[1]);
  });
});

describe('PdokNlProvider reverse', () => {
  test('asks /reverse with lat and lon', async () => {
    const urls = answerRequests(reverseFixture);

    await new Provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(`${urls[0].host}${urls[0].pathname}`).toEqual(
      'api.pdok.nl/bzk/locatieserver/search/v3_1/reverse',
    );
    expect(Object.fromEntries(urls[0].searchParams)).toMatchObject({
      lat: '52.3731',
      lon: '4.8926',
    });
  });

  test('reads a reverse answer, which has no highlighting', async () => {
    answerRequests(reverseFixture);

    const places = await new Provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(places.map((p) => p.label)).toEqual([
      'Dam 2, 1012NP Amsterdam',
      'Dam 4, 1012NP Amsterdam',
    ]);
    expect(places[0].x).toBeCloseTo(4.893, 3);
    expect(places[0].y).toBeCloseTo(52.373, 3);
  });
});
