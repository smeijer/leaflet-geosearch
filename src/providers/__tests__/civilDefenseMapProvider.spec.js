import Provider from '../civilDefenseMapProvider';
import reverseFixture from './openstreetmapReverseResponse.json';
import { answerRequests } from '../../../test';

// CivilDefenseMap runs Nominatim, so it answers in the same format
describe('CivilDefenseMapProvider reverse', () => {
  test('asks /reverse with lat and lon', async () => {
    const urls = answerRequests(reverseFixture);

    await new Provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(`${urls[0].host}${urls[0].pathname}`).toEqual(
      'civildefense.fit.vutbr.cz/reverse',
    );
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({
      lat: '52.3731',
      lon: '4.8926',
      format: 'json',
    });
  });

  test('reads a reverse answer', async () => {
    answerRequests(reverseFixture);

    const [place] = await new Provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(place.label).toEqual(reverseFixture.display_name);
  });
});
