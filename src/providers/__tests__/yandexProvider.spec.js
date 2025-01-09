import Provider from '../yandexProvider';
import fixtures from './yandexResponse.json';

describe('YandexProvider', () => {
  beforeAll(() => {
    fetch.mockResponse(async () => ({ body: JSON.stringify(fixtures) }));
  });

  afterAll(() => {
    fetch.mockReset();
  });

  test('Can fetch results', async () => {
    const provider = new Provider({
      params: {
        key: process.env.YANDEX_API_KEY,
      },
    });

    const results = await provider.search({
      query: 'UAE, Dubai, Mohammed Bin Rashid Boulevard, 1',
    });
    const result = results[0];

    expect(result.label).toBeTruthy();
    expect(`${result.x} ${result.y}`).toEqual(
      fixtures.response.GeoObjectCollection.featureMember[0].GeoObject.Point
        .pos,
    );
    expect(result.bounds).toEqual([
      [
        parseFloat(
          fixtures.response.GeoObjectCollection.featureMember[0].GeoObject.boundedBy.Envelope.lowerCorner.split(
            ' ',
          )[0],
        ),
        parseFloat(
          fixtures.response.GeoObjectCollection.featureMember[0].GeoObject.boundedBy.Envelope.lowerCorner.split(
            ' ',
          )[1],
        ),
      ],
      [
        parseFloat(
          fixtures.response.GeoObjectCollection.featureMember[0].GeoObject.boundedBy.Envelope.upperCorner.split(
            ' ',
          )[0],
        ),
        parseFloat(
          fixtures.response.GeoObjectCollection.featureMember[0].GeoObject.boundedBy.Envelope.upperCorner.split(
            ' ',
          )[1],
        ),
      ],
    ]);
  });
});
