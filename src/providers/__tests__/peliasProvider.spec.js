import Provider from '../peliasProvider';
import fixture from './peliasResponse.json';
import { answerRequests, mockResponse } from '../../../test';

describe('PeliasProvider', function () {
  beforeAll(() => {
    mockResponse(JSON.stringify(fixture));
  });

  test('Can fetch results', async () => {
    const provider = new Provider();
    const results = await provider.search({ query: 'pelias' });
    expect(results.length).toEqual(9);

    // feature mapping
    results.forEach((result, i) => {
      const feat = fixture.features[i];
      expect(result.label).toBeTruthy();
      expect(result.x).toEqual(+feat.geometry.coordinates[0]);
      expect(result.y).toEqual(+feat.geometry.coordinates[1]);
      expect(result.bounds).toBeValidBounds();
    });
  });
});

describe('PeliasProvider reverse', () => {
  test('asks /v1/reverse with point.lat and point.lon', async () => {
    const urls = answerRequests(fixture);

    await new Provider({ host: 'https://pelias.example.com' }).reverse({
      lat: 52.3731,
      lng: 4.8926,
    });

    expect(`${urls[0].origin}${urls[0].pathname}`).toEqual(
      'https://pelias.example.com/v1/reverse',
    );
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      'point.lat': '52.3731',
      'point.lon': '4.8926',
    });
  });

  // a reverse answer has the same format as a search answer
  test('reads a reverse answer', async () => {
    answerRequests(fixture);

    const places = await new Provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(places[0].label).toEqual(fixture.features[0].properties.label);
  });
});
