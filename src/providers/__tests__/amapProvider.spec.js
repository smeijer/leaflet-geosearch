import Provider from '../amapProvider';
import fixtures from './amapResponse.json';

describe('AMapProvider', () => {
  beforeAll(() => {
    fetch.mockResponse(async () => ({ body: JSON.stringify(fixtures) }));
  });

  test('Can fetch results', async () => {
    const provider = new Provider({
      params: {
        key: process.env.AMAP_API_KEY,
      },
    });

    const results = await provider.search({ query: '上海市浦东新区外滩' });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(`${result.x},${result.y}`).toEqual(fixtures.geocodes[0].location);
    // amap provider doesn't return bounds :(
    expect(result.bounds).toBeNull();
  });
});
