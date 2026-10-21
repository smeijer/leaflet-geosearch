import Provider from '../photonProvider';
import fixtures from './photonResponse.json';
import { mockResponse } from '../../../test';

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
