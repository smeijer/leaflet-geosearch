import { http, passthrough } from 'msw';
import SearchControl from '../../SearchControl';
import Provider from '../openGeocodingProvider';
import randomId from '../../../test/randomId';

// Runs against the real api, only with OPENGEOCODING_API_KEY in .env. A
// browser key only answers requests from its allowed origins, so the page
// pretends to be the local docs site (add http://localhost:3000 to the key).
// Retrieve and reverse count as requests, autocomplete is free.

const apiKey = process.env.OPENGEOCODING_API_KEY;
const AMSTERDAM = { lat: 52.3731, lng: 4.8926 };

// the free plan allows 2 requests per second
const pause = () => new Promise((resolve) => setTimeout(resolve, 600));

describe.skipIf(!apiKey)('OpenGeocoding live', () => {
  beforeAll(() => {
    window.happyDOM.setURL('http://localhost:3000/');
  });

  beforeEach(() => {
    globalThis.server.use(
      http.all('https://api.opengeocoding.com/*', () => passthrough()),
    );
  });

  afterEach(async () => {
    document.body.innerHTML = '';
    await pause();
  });

  const provider = (params) => new Provider({ apiKey, params });

  test('suggests places without coordinates', async () => {
    const results = await provider({ countryCode: 'nl' }).search({
      query: 'Amsterd',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toMatch(/Amsterdam/);
    expect(typeof results[0].raw.id).toEqual('string');
    expect(Number.isFinite(results[0].x)).toBe(false);
  });

  test('limit and countryCode reach autocomplete', async () => {
    const results = await provider({ countryCode: 'nl', limit: 2 }).search({
      query: 'Amster',
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(2);
    results.forEach((result) => expect(result.raw.countryCode).toEqual('nl'));
  });

  test('looks a picked suggestion up by its id', async () => {
    const og = provider({ countryCode: 'nl' });
    const [picked] = await og.search({ query: 'Amsterd' });
    await pause();

    const [place] = await og.search({ query: picked.label, data: picked });

    expect(place.raw.id).toEqual(picked.raw.id);
    expect(place.y).toBeCloseTo(AMSTERDAM.lat, 0);
    expect(place.x).toBeCloseTo(AMSTERDAM.lng, 0);
  });

  test('reverse geocodes a position', async () => {
    const results = await provider().reverse(AMSTERDAM);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].label).toMatch(/Amsterdam/);
    expect(results[0].y).toBeCloseTo(AMSTERDAM.lat, 1);
    expect(results[0].x).toBeCloseTo(AMSTERDAM.lng, 1);
    if (results[0].bounds) {
      expect(results[0].bounds).toBeValidBounds();
    }
  });

  test('a wrong key throws the message of the api', async () => {
    const wrong = new Provider({ apiKey: 'og_wrong' });

    await expect(wrong.search({ query: 'Amsterd' })).rejects.toThrow(/API key/);
  });

  test('enter on typed text shows the looked up place on the map', async () => {
    const div = document.createElement('div');
    div.id = randomId();
    document.body.appendChild(div);
    const map = new L.Map(div, { center: [0, 0], zoom: 2 });
    const control = new SearchControl({
      provider: provider({ countryCode: 'nl' }),
    }).addTo(map);

    await control.onSubmit({ query: 'Amsterdam' });

    const [marker] = control.markers.getLayers();
    expect(marker.getLatLng().lat).toBeCloseTo(AMSTERDAM.lat, 0);
    expect(marker.getLatLng().lng).toBeCloseTo(AMSTERDAM.lng, 0);
  });
});
