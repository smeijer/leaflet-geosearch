import Provider from '../geoApiFrProvider';
import reverseFixture from './geoApiFrReverseResponse.json';
import { answerRequests } from '../../../test';

describe('GeoApiFrProvider reverse', () => {
  test('asks /reverse with lat and lon', async () => {
    const urls = answerRequests(reverseFixture);

    await new Provider().reverse({ lat: 48.8584, lng: 2.2945 });

    expect(`${urls[0].host}${urls[0].pathname}`).toEqual(
      'data.geopf.fr/geocodage/reverse',
    );
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      lat: '48.8584',
      lon: '2.2945',
    });
  });

  test('reads a reverse answer', async () => {
    answerRequests(reverseFixture);

    const [place] = await new Provider().reverse({ lat: 48.8584, lng: 2.2945 });

    expect(place.label).toEqual(reverseFixture.features[0].properties.label);
    expect([place.x, place.y]).toEqual(
      reverseFixture.features[0].geometry.coordinates,
    );
  });
});
