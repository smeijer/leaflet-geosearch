import { http, HttpResponse } from 'msw';
import Provider from '../openGeocodingProvider';
import autocomplete from './openGeocodingAutocompleteResponse.json';
import retrieve from './openGeocodingRetrieveResponse.json';
import reverse from './openGeocodingReverseResponse.json';

// answers with the body and keeps the requests, headers included
function answer(body, status = 200) {
  const requests = [];
  globalThis.server.use(
    http.all('*', ({ request }) => {
      requests.push(request);
      return HttpResponse.json(body, { status });
    }),
  );
  return requests;
}

const provider = () =>
  new Provider({ apiKey: 'og_key', params: { countryCode: 'nl' } });

describe('OpenGeocodingProvider', () => {
  test('suggests from /v1/autocomplete with the key in a header', async () => {
    const requests = answer(autocomplete);

    const results = await provider().search({ query: 'Amsterd' });

    const url = new URL(requests[0].url);
    expect(`${url.origin}${url.pathname}`).toEqual(
      'https://api.opengeocoding.com/v1/autocomplete',
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      countryCode: 'nl',
      text: 'Amsterd',
    });
    expect(requests[0].headers.get('x-api-key')).toEqual('og_key');

    expect(results.map((r) => r.label)).toEqual(
      autocomplete.suggestions.map((s) => s.displayName),
    );
    // suggestions have no coordinates, so a picked one is searched again
    expect(Number.isFinite(results[0].x)).toBe(false);
    expect(results[0].raw).toEqual(autocomplete.suggestions[0]);
  });

  test('looks a picked suggestion up by its id', async () => {
    answer(autocomplete);
    const [picked] = await provider().search({ query: 'Amsterd' });
    const requests = answer(retrieve);

    const [place] = await provider().search({
      query: picked.label,
      data: picked,
    });

    const url = new URL(requests[0].url);
    expect(url.pathname).toEqual('/v1/retrieve');
    // the params are for autocomplete only, retrieve rejects them
    expect(Object.fromEntries(url.searchParams)).toEqual({ id: picked.raw.id });
    expect(requests[0].headers.get('x-api-key')).toEqual('og_key');
    expect([place.x, place.y]).toEqual([
      retrieve.geoCoordinates.lon,
      retrieve.geoCoordinates.lat,
    ]);
    expect(place.label).toEqual(retrieve.displayName);
    expect(place.bounds).toBeNull();
  });

  test('reverse geocodes with /v1/reverse', async () => {
    const requests = answer(reverse);

    const [place] = await provider().reverse({ lat: 52.3731, lng: 4.8926 });

    const url = new URL(requests[0].url);
    expect(url.pathname).toEqual('/v1/reverse');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      lat: '52.3731',
      lon: '4.8926',
    });
    const { address } = reverse.results[0];
    expect(place.label).toEqual(address.displayName);
    expect([place.x, place.y]).toEqual([
      address.geoCoordinates.lon,
      address.geoCoordinates.lat,
    ]);
    expect(place.bounds).toBeValidBounds();
    expect(place.bounds).toEqual([
      [
        address.geoCoordinates.boundingBox.minLat,
        address.geoCoordinates.boundingBox.minLon,
      ],
      [
        address.geoCoordinates.boundingBox.maxLat,
        address.geoCoordinates.boundingBox.maxLon,
      ],
    ]);
  });

  test('reads coordinates the api omits as 0', () => {
    const [place] = provider().parse({
      data: { id: 'x', displayName: 'Null Island', geoCoordinates: {} },
    });

    expect([place.x, place.y]).toEqual([0, 0]);
  });

  test('throws the message of an error answer', async () => {
    answer(
      {
        code: 'unauthenticated',
        message: 'The API key is missing, invalid, expired or revoked.',
      },
      401,
    );

    await expect(provider().search({ query: 'Amsterd' })).rejects.toThrow(
      'The API key is missing, invalid, expired or revoked.',
    );
  });
});
