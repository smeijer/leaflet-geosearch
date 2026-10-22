import { http, HttpResponse } from 'msw';
import {
  CivilDefenseMapProvider,
  EsriProvider,
  GeoApiFrProvider,
  GeoapifyProvider,
  GeocodeEarthProvider,
  LocationIQProvider,
  OpenStreetMapProvider,
  PdokNlProvider,
  PeliasProvider,
  PhotonProvider,
} from '../index';
import osmReverse from './openstreetmapReverseResponse.json';
import photonReverse from './photonReverseResponse.json';
import pdokReverse from './pdokNlReverseResponse.json';
import geoApiFrReverse from './geoApiFrReverseResponse.json';
import peliasSearch from './peliasResponse.json';

// answers every request with body and keeps the requested urls
function answer(body) {
  const urls = [];
  globalThis.server.use(
    http.all('*', ({ request }) => {
      urls.push(new URL(request.url));
      return HttpResponse.json(body);
    }),
  );
  return urls;
}

const position = { lat: 52.3731, lng: 4.8926 };

describe('reverse geocoding', () => {
  test.each([
    [
      'OpenStreetMap',
      new OpenStreetMapProvider(),
      'nominatim.openstreetmap.org/reverse',
      { lat: '52.3731', lon: '4.8926', format: 'json' },
    ],
    [
      'CivilDefenseMap',
      new CivilDefenseMapProvider(),
      'civildefense.fit.vutbr.cz/reverse',
      { lat: '52.3731', lon: '4.8926', format: 'json' },
    ],
    [
      'LocationIQ',
      new LocationIQProvider({ params: { key: 'k' } }),
      'locationiq.org/v1/reverse.php',
      { lat: '52.3731', lon: '4.8926', key: 'k' },
    ],
    [
      'Photon',
      new PhotonProvider(),
      'photon.komoot.io/reverse',
      { lat: '52.3731', lon: '4.8926' },
    ],
    [
      'Geoapify',
      new GeoapifyProvider({ params: { apiKey: 'k' } }),
      'api.geoapify.com/v1/geocode/reverse',
      { lat: '52.3731', lon: '4.8926', apiKey: 'k' },
    ],
    [
      'GeoApiFr',
      new GeoApiFrProvider(),
      'data.geopf.fr/geocodage/reverse',
      { lat: '52.3731', lon: '4.8926' },
    ],
    [
      'PdokNl',
      new PdokNlProvider(),
      'api.pdok.nl/bzk/locatieserver/search/v3_1/reverse',
      { lat: '52.3731', lon: '4.8926' },
    ],
    [
      'Pelias',
      new PeliasProvider(),
      'localhost:4000/v1/reverse',
      { 'point.lat': '52.3731', 'point.lon': '4.8926' },
    ],
    [
      'GeocodeEarth',
      new GeocodeEarthProvider({ params: { api_key: 'k' } }),
      'api.geocode.earth/v1/reverse',
      { 'point.lat': '52.3731', 'point.lon': '4.8926', api_key: 'k' },
    ],
  ])(
    '%s asks the reverse endpoint with the position',
    async (_name, provider, path, expected) => {
      const urls = answer({
        features: [],
        results: [],
        response: { docs: [] },
      });

      await provider.reverse(position).catch(() => {});

      expect(`${urls[0].host}${urls[0].pathname}`).toEqual(path);
      expect(Object.fromEntries(urls[0].searchParams)).toMatchObject(expected);
    },
  );

  test('OpenStreetMap reads the single place of a reverse answer', async () => {
    answer(osmReverse);

    const [place] = await new OpenStreetMapProvider().reverse(position);

    expect(place.label).toEqual(osmReverse.display_name);
    expect(place.x).toEqual(Number(osmReverse.lon));
    expect(place.y).toEqual(Number(osmReverse.lat));
    expect(place.bounds).toBeValidBounds();
  });

  test('Photon reads a reverse answer like a search answer', async () => {
    answer(photonReverse);

    const [place] = await new PhotonProvider().reverse(position);

    expect(place.label).toEqual('Amsterdam, Noord-Holland, Nederland');
    expect(place.x).toEqual(photonReverse.features[0].geometry.coordinates[0]);
    expect(place.y).toEqual(photonReverse.features[0].geometry.coordinates[1]);
  });

  test('PdokNl reads a reverse answer, which has no highlighting', async () => {
    answer(pdokReverse);

    const places = await new PdokNlProvider().reverse(position);

    expect(places.map((p) => p.label)).toEqual([
      'Dam 2, 1012NP Amsterdam',
      'Dam 4, 1012NP Amsterdam',
    ]);
    expect(places[0].x).toBeCloseTo(4.893, 3);
    expect(places[0].y).toBeCloseTo(52.373, 3);
  });

  test('GeoApiFr reads a reverse answer', async () => {
    answer(geoApiFrReverse);

    const [place] = await new GeoApiFrProvider().reverse({
      lat: 48.8584,
      lng: 2.2945,
    });

    expect(place.label).toEqual(geoApiFrReverse.features[0].properties.label);
    expect(place.x).toEqual(2.294809);
  });

  test('Pelias reads a reverse answer, which has the format of a search', async () => {
    answer(peliasSearch);

    const places = await new PeliasProvider().reverse(position);

    expect(places[0].label).toEqual(peliasSearch.features[0].properties.label);
  });

  test('providers without reverse geocoding say so', async () => {
    await expect(new EsriProvider().reverse(position)).rejects.toThrow(
      'does not support reverse geocoding',
    );
  });

  test('the signal is passed to fetch', async () => {
    answer(osmReverse);
    const controller = new AbortController();
    controller.abort();

    await expect(
      new OpenStreetMapProvider().reverse({
        ...position,
        signal: controller.signal,
      }),
    ).rejects.toThrow();
  });
});
