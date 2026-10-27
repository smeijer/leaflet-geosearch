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

  test('sends every request to a custom host', async () => {
    const requests = answer(autocomplete);
    const proxy = new Provider({
      apiKey: '',
      host: 'https://example.com/geocode',
    });

    const [picked] = await proxy.search({ query: 'Amsterd' });
    await proxy.search({ query: picked.label, data: picked });
    await proxy.reverse({ lat: 52.3731, lng: 4.8926 });

    expect(
      requests.map(({ url }) => new URL(url).origin + new URL(url).pathname),
    ).toEqual([
      'https://example.com/geocode/v1/autocomplete',
      'https://example.com/geocode/v1/retrieve',
      'https://example.com/geocode/v1/reverse',
    ]);
  });

  test('a result without coordinates has no position', async () => {
    answer({ results: [{ address: { displayName: 'Somewhere' } }] });

    const [place] = await provider().reverse({ lat: 52.3731, lng: 4.8926 });

    expect(place.label).toEqual('Somewhere');
    expect(Number.isFinite(place.x)).toBe(false);
    expect(Number.isFinite(place.y)).toBe(false);
    expect(place.bounds).toBeNull();
  });

  // the api leaves out empty lists
  test.each([
    ['empty suggestions', 'search', { suggestions: [] }],
    ['no suggestions', 'search', {}],
    ['empty results', 'reverse', { results: [] }],
    ['no results', 'reverse', {}],
  ])('%s give no results', async (_, method, body) => {
    answer(body);

    const results = await provider()[method]({
      query: 'nowhere',
      lat: 0,
      lng: 0,
    });

    expect(results).toEqual([]);
  });

  test('picked data without an id is searched by its text', async () => {
    const requests = answer(autocomplete);

    await provider().search({
      query: 'Amsterdam',
      data: { x: NaN, y: NaN, label: 'Amsterdam', bounds: null, raw: {} },
    });

    const url = new URL(requests[0].url);
    expect(url.pathname).toEqual('/v1/autocomplete');
    expect(url.searchParams.get('text')).toEqual('Amsterdam');
  });

  test('the id of a picked suggestion is sent as one parameter', async () => {
    const tricky = 'a&lang=xx#x/../../v1/admin?id=other';
    const requests = answer(retrieve);

    await provider().search({
      query: 'x',
      data: { x: NaN, y: NaN, label: 'x', bounds: null, raw: { id: tricky } },
    });

    const url = new URL(requests[0].url);
    expect(url.pathname).toEqual('/v1/retrieve');
    expect(url.hash).toEqual('');
    expect(url.searchParams.getAll('id')).toEqual([tricky]);
    expect([...url.searchParams.keys()]).toEqual(['id']);
  });

  test('passes the abort signal on', async () => {
    answer(autocomplete);
    const controller = new AbortController();
    controller.abort();

    await expect(
      provider().search({ query: 'Amsterd', signal: controller.signal }),
    ).rejects.toThrow(/abort/i);
  });

  test('without an api key the header is empty', async () => {
    const requests = answer(autocomplete);

    await new Provider().search({ query: 'Amsterd' });

    expect(requests[0].headers.get('x-api-key')).toEqual('');
  });

  test('an error answer without a message throws the status', async () => {
    answer({ code: 'internal' }, 500);

    await expect(provider().search({ query: 'Amsterd' })).rejects.toThrow(
      'Request failed with status 500',
    );
  });

  test('an error answer that is not json throws the status', async () => {
    globalThis.server.use(
      http.all('*', () => new HttpResponse('Bad Gateway', { status: 502 })),
    );

    await expect(provider().search({ query: 'Amsterd' })).rejects.toThrow(
      'Request failed with status 502',
    );
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
