import Provider from '../esriProvider';
import fixtures from './esriResponse.json';
import { answerRequests, mockResponse } from '../../../test';

describe('EsriProvider', () => {
  beforeAll(() => {
    mockResponse(JSON.stringify(fixtures));
  });

  test('Can fetch results', async () => {
    const provider = new Provider();

    const results = await provider.search({ query: 'Madurodam' });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(result.x).toEqual(fixtures.locations[0].feature.geometry.x);
    expect(result.y).toEqual(fixtures.locations[0].feature.geometry.y);
    expect(result.bounds).toBeValidBounds();
  });
});

describe('EsriProvider reverse', () => {
  test('rejects, the Esri provider has no reverse geocoding', async () => {
    await expect(
      new Provider().reverse({ lat: 52.3731, lng: 4.8926 }),
    ).rejects.toThrow('This provider does not support reverse geocoding');
  });
});
