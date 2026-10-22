import Provider from '../photonProvider';
import fixtures from './photonResponse.json';
import reverseFixture from './photonReverseResponse.json';
import { answerRequests, mockResponse } from '../../../test';

describe('PhotonProvider', () => {
  beforeAll(() => {
    mockResponse(JSON.stringify(fixtures));
  });

  test('Can fetch results', async () => {
    const provider = new Provider();

    const results = await provider.search({ query: 'Leeuwarden' });
    const [city, shop] = results;

    expect(city.x).toEqual(fixtures.features[0].geometry.coordinates[0]);
    expect(city.y).toEqual(fixtures.features[0].geometry.coordinates[1]);
    expect(city.bounds).toBeValidBounds();
    expect(city.raw).toEqual(fixtures.features[0]);

    // results without an extent have no bounds
    expect(shop.bounds).toBeNull();
  });

  test('builds the label from the address parts', async () => {
    const provider = new Provider();
    const [city, shop] = await provider.search({ query: 'Leeuwarden' });
    const p = fixtures.features[1].properties;

    expect(city.label).toEqual('Leeuwarden, Fryslân, Nederland');
    expect(shop.label).toEqual(
      `${p.name}, ${p.street}, ${p.postcode} ${p.city}, ${p.state}, ${p.country}`,
    );
  });

  test('bounds are south-west, north-east', async () => {
    const provider = new Provider();
    const [city] = await provider.search({ query: 'Leeuwarden' });
    const [west, north, east, south] = fixtures.features[0].properties.extent;

    expect(city.bounds).toEqual([
      [south, west],
      [north, east],
    ]);
  });
});

describe('PhotonProvider reverse', () => {
  test('asks /reverse with lat and lon', async () => {
    const urls = answerRequests(reverseFixture);

    await new Provider({ host: 'https://photon.example.com' }).reverse({
      lat: 52.3731,
      lng: 4.8926,
    });

    expect(`${urls[0].origin}${urls[0].pathname}`).toEqual(
      'https://photon.example.com/reverse',
    );
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      lat: '52.3731',
      lon: '4.8926',
    });
  });

  test('reads a reverse answer like a search answer', async () => {
    answerRequests(reverseFixture);

    const [place] = await new Provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(place.label).toEqual('Amsterdam, Noord-Holland, Nederland');
    expect([place.x, place.y]).toEqual(
      reverseFixture.features[0].geometry.coordinates,
    );
    expect(place.bounds).toBeValidBounds();
  });
});
