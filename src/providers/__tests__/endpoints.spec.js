import {
  AMapProvider,
  BingProvider,
  CivilDefenseMapProvider,
  EsriProvider,
  GeoApiFrProvider,
  GeoapifyProvider,
  GeocodeEarthProvider,
  HereProvider,
  LegacyGoogleProvider,
  LocationIQProvider,
  MapBoxProvider,
  OpenCageProvider,
  OpenStreetMapProvider,
  PdokNlProvider,
  PeliasProvider,
} from '../index';
import { RequestType } from '../provider';

// Locks the request urls each provider builds today, so later changes to
// parameter handling are deliberate.
const search = (provider, query = 'Den Haag') =>
  provider.endpoint({ query, type: RequestType.SEARCH });

const params = (url) => Object.fromEntries(new URL(url).searchParams);

describe('provider endpoints', () => {
  test.each([
    [
      'AMap',
      new AMapProvider(),
      'https://restapi.amap.com/v3/geocode/geo?address=Den%20Haag&output=JSON',
    ],
    [
      'Bing',
      new BingProvider(),
      'https://dev.virtualearth.net/REST/v1/Locations?q=Den%20Haag&jsonp=cb',
    ],
    [
      'CivilDefenseMap',
      new CivilDefenseMapProvider(),
      'https://civildefense.fit.vutbr.cz/search?q=Den%20Haag&format=json',
    ],
    [
      'Esri',
      new EsriProvider(),
      'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?text=Den%20Haag&f=json&maxLocations=5',
    ],
    [
      'GeoApiFr',
      new GeoApiFrProvider(),
      'https://data.geopf.fr/geocodage/search?q=Den%20Haag',
    ],
    [
      'Geoapify',
      new GeoapifyProvider(),
      'https://api.geoapify.com/v1/geocode/search?text=Den%20Haag&format=json',
    ],
    [
      'GeocodeEarth',
      new GeocodeEarthProvider(),
      'https://api.geocode.earth/v1/autocomplete?text=Den%20Haag',
    ],
    [
      'Here',
      new HereProvider(),
      'https://geocode.search.hereapi.com/v1/geocode?q=Den%20Haag',
    ],
    [
      'LegacyGoogle',
      new LegacyGoogleProvider(),
      'https://maps.googleapis.com/maps/api/geocode/json?address=Den%20Haag',
    ],
    [
      'LocationIQ',
      new LocationIQProvider(),
      'https://locationiq.org/v1/search.php?q=Den%20Haag&format=json',
    ],
    [
      'MapBox',
      new MapBoxProvider(),
      'https://a.tiles.mapbox.com/v4/geocode/mapbox.places/Den Haag.json?',
    ],
    [
      'OpenCage',
      new OpenCageProvider(),
      'https://api.opencagedata.com/geocode/v1/json?q=Den%20Haag&format=json',
    ],
    [
      'OpenStreetMap',
      new OpenStreetMapProvider(),
      'https://nominatim.openstreetmap.org/search?q=Den%20Haag&format=json',
    ],
    [
      'Pelias',
      new PeliasProvider(),
      'http://localhost:4000/v1/autocomplete?text=Den%20Haag',
    ],
  ])('%s builds the search url', (name, provider, expected) => {
    const url =
      name === 'Bing'
        ? provider.endpoint({ query: 'Den Haag', jsonp: 'cb' })
        : search(provider);

    expect(url).toEqual(expected);
  });

  test('PdokNl adds its default params', () => {
    const url = search(new PdokNlProvider());

    expect(
      url.startsWith(
        'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest?',
      ),
    ).toBe(true);
    expect(params(url)).toEqual({
      bq: 'type:gemeente^0.5 type:woonplaats^0.5 type:weg^1.0 type:postcode^1.5 type:adres^2.0',
      fl: 'id,weergavenaam,centroide_ll',
      rows: '5',
      q: 'Den Haag',
    });
  });

  test('PdokNl lets user params override its defaults', () => {
    const url = search(new PdokNlProvider({ params: { rows: 10 } }));

    expect(params(url).rows).toEqual('10');
  });

  test('constructor params are merged into every request', () => {
    const provider = new OpenStreetMapProvider({
      params: { 'accept-language': 'nl', countrycodes: 'nl' },
    });

    expect(params(search(provider))).toEqual({
      'accept-language': 'nl',
      countrycodes: 'nl',
      q: 'Den Haag',
      format: 'json',
    });
  });

  test.each([
    ['OpenStreetMap', OpenStreetMapProvider],
    ['LocationIQ', LocationIQProvider],
    ['CivilDefenseMap', CivilDefenseMapProvider],
  ])('%s uses the format from the params (#430)', (_, Provider) => {
    const provider = new Provider({ params: { format: 'jsonv2' } });

    expect(params(search(provider)).format).toEqual('jsonv2');
  });

  test('OpenStreetMap uses the format of an object query', () => {
    const url = new OpenStreetMapProvider().endpoint({
      query: { q: 'Den Haag', format: 'jsonv2' },
      type: RequestType.SEARCH,
    });

    expect(params(url).format).toEqual('jsonv2');
  });

  test.each([
    ['AMap', new AMapProvider()],
    ['Bing', new BingProvider()],
    ['CivilDefenseMap', new CivilDefenseMapProvider()],
    ['Esri', new EsriProvider()],
    ['Geoapify', new GeoapifyProvider()],
    ['OpenCage', new OpenCageProvider()],
  ])('%s does not modify an object query', (_, provider) => {
    const query = { city: 'Den Haag' };
    provider.endpoint({ query, type: RequestType.SEARCH, jsonp: 'cb' });

    expect(query).toEqual({ city: 'Den Haag' });
  });

  test('OpenStreetMap does not modify an object query', () => {
    const query = { street: 'Binnenhof 1', city: 'Den Haag' };
    new OpenStreetMapProvider().endpoint({ query, type: RequestType.SEARCH });

    expect(query).toEqual({ street: 'Binnenhof 1', city: 'Den Haag' });
  });

  test('query values are url encoded', () => {
    const url = search(new OpenStreetMapProvider(), 'a&b=c ü/?#');

    expect(url).toContain('q=a%26b%3Dc%20%C3%BC%2F%3F%23');
    expect(params(url).q).toEqual('a&b=c ü/?#');
  });

  test('object queries are sent as is', () => {
    const url = new OpenStreetMapProvider().endpoint({
      query: { street: 'Binnenhof 1', city: 'Den Haag' },
      type: RequestType.SEARCH,
    });

    expect(params(url)).toEqual({
      street: 'Binnenhof 1',
      city: 'Den Haag',
      format: 'json',
    });
  });

  test.each([
    [
      'OpenStreetMap',
      new OpenStreetMapProvider(),
      'https://nominatim.openstreetmap.org/reverse',
    ],
    [
      'Geoapify',
      new GeoapifyProvider(),
      'https://api.geoapify.com/v1/geocode/reverse',
    ],
    [
      'GeoApiFr',
      new GeoApiFrProvider(),
      'https://data.geopf.fr/geocodage/reverse',
    ],
    [
      'CivilDefenseMap',
      new CivilDefenseMapProvider(),
      'https://civildefense.fit.vutbr.cz/reverse',
    ],
    ['Pelias', new PeliasProvider(), 'http://localhost:4000/v1/reverse'],
  ])('%s builds the reverse url', (_, provider, expected) => {
    const url = provider.endpoint({
      query: { lat: 52.08, lon: 4.31 },
      type: RequestType.REVERSE,
    });

    expect(url.split('?')[0]).toEqual(expected);
  });

  test('custom search and reverse urls are used', () => {
    const provider = new OpenStreetMapProvider({
      searchUrl: 'https://example.com/s',
      reverseUrl: 'https://example.com/r',
    });

    expect(search(provider).split('?')[0]).toEqual('https://example.com/s');
    expect(
      provider
        .endpoint({ query: { lat: 1, lon: 2 }, type: RequestType.REVERSE })
        .split('?')[0],
    ).toEqual('https://example.com/r');
  });

  test('Esri asks for five locations unless maxLocations is given (#196)', () => {
    const fromParams = new EsriProvider({ params: { maxLocations: 2 } });
    expect(search(fromParams)).toEqual(
      'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/find?maxLocations=2&text=Den%20Haag&f=json',
    );

    const fromQuery = new EsriProvider().endpoint({
      query: { text: 'Den Haag', maxLocations: 1 },
      type: RequestType.SEARCH,
    });
    expect(fromQuery).toContain('maxLocations=1');
    expect(fromQuery).not.toContain('maxLocations=5');
  });

  test('Pelias uses a custom host', () => {
    const provider = new PeliasProvider({ host: 'https://pelias.example.com' });

    expect(search(provider)).toEqual(
      'https://pelias.example.com/v1/autocomplete?text=Den%20Haag',
    );
  });
});
