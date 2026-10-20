import {
  AMapProvider,
  GeoapifyProvider,
  HereProvider,
  LocationIQProvider,
  MapBoxProvider,
  OpenCageProvider,
  OpenStreetMapProvider,
  PdokNlProvider,
  PeliasProvider,
} from '../index';
import { http, HttpResponse } from 'msw';

// Edge cases of the response parsers that the fixture based tests don't cover.
describe('provider parse edge cases', () => {
  test('AMap returns no results when geocodes is missing', () => {
    expect(new AMapProvider().parse({ data: {} })).toEqual([]);
  });

  test('AMap splits "lng,lat" locations and has no bounds', () => {
    const [r] = new AMapProvider().parse({
      data: {
        geocodes: [{ location: '116.48,39.99', formatted_address: 'A' }],
      },
    });

    expect(r).toMatchObject({ x: 116.48, y: 39.99, label: 'A', bounds: null });
  });

  test('Geoapify returns null bounds when bbox is missing', () => {
    const [r] = new GeoapifyProvider().parse({
      data: { results: [{ lat: '52.1', lon: '4.3', formatted: 'X' }] },
    });

    expect(r).toMatchObject({ x: 4.3, y: 52.1, label: 'X', bounds: null });
  });

  test('Geoapify accepts a single result object', () => {
    const results = new GeoapifyProvider().parse({
      data: { results: { lat: '1', lon: '2', formatted: 'Y' } },
    });

    expect(results).toHaveLength(1);
  });

  test('Here skips items without a position', () => {
    const results = new HereProvider().parse({
      data: {
        items: [
          { address: { label: 'no position' } },
          { position: { lat: 1, lng: 2 }, address: { label: 'ok' } },
        ],
      },
    });

    expect(results.map((r) => r.label)).toEqual(['ok']);
  });

  test('LocationIQ returns no results on an error response', () => {
    const results = new LocationIQProvider().parse({
      data: { error: 'Unable to geocode' },
    });

    expect(results).toEqual([]);
  });

  test('MapBox returns no results when features is missing', () => {
    expect(new MapBoxProvider().parse({ data: {} })).toEqual([]);
  });

  test('MapBox falls back to text when place_name is missing', () => {
    const [r] = new MapBoxProvider().parse({
      data: { features: [{ center: [4.3, 52.1], text: 'Den Haag' }] },
    });

    expect(r).toMatchObject({
      x: 4.3,
      y: 52.1,
      label: 'Den Haag',
      bounds: null,
    });
  });

  test('MapBox converts bbox to [[s, w], [n, e]]', () => {
    const [r] = new MapBoxProvider().parse({
      data: {
        features: [{ center: [0, 0], text: 'x', bbox: [1, 2, 3, 4] }],
      },
    });

    expect(r.bounds).toEqual([
      [2, 1],
      [4, 3],
    ]);
  });

  test('OpenCage returns null bounds when bounds is missing', () => {
    const [r] = new OpenCageProvider().parse({
      data: { results: [{ geometry: { lat: 1, lng: 2 }, formatted: 'Z' }] },
    });

    expect(r).toMatchObject({ x: 2, y: 1, label: 'Z', bounds: null });
  });

  test('OpenCage does not send queries shorter than 2 characters', async () => {
    const results = await new OpenCageProvider().search({ query: 'a' });

    // no request is made; an unhandled MSW request would fail the test
    expect(results).toEqual([]);
  });

  test('OpenStreetMap accepts a single record (reverse response)', () => {
    const results = new OpenStreetMapProvider().parse({
      data: {
        lat: '52.1',
        lon: '4.3',
        display_name: 'Den Haag',
        boundingbox: ['52', '53', '4', '5'],
      },
    });

    expect(results).toHaveLength(1);
    expect(results[0].bounds).toEqual([
      [52, 4],
      [53, 5],
    ]);
  });

  test('Pelias only sets bounds for features with a bbox', () => {
    const results = new PeliasProvider().parse({
      data: {
        features: [
          {
            geometry: { coordinates: [4, 52] },
            properties: { label: 'point' },
          },
          {
            geometry: { coordinates: [4, 52] },
            properties: { label: 'area' },
            bbox: [4, 52, 5, 53],
          },
        ],
      },
    });

    expect(results[0].bounds).toBeNull();
    expect(results[1].bounds).toEqual([
      [52, 4],
      [53, 5],
    ]);
  });

  test('PdokNl parses POINT(lng lat) and keeps the highlight in raw', () => {
    const [r] = new PdokNlProvider().parse({
      data: {
        response: {
          docs: [
            {
              id: 'a',
              weergavenaam: 'Den Haag',
              centroide_ll: 'POINT(4.3 52.1)',
            },
          ],
        },
        highlighting: { a: { suggest: ['<b>Den</b> Haag'] } },
      },
    });

    expect(r).toMatchObject({
      x: 4.3,
      y: 52.1,
      label: 'Den Haag',
      bounds: null,
    });
    expect(r.raw.highlight).toEqual('<b>Den</b> Haag');
  });

  test('PdokNl retries with the spellcheck suggestion when nothing is found', async () => {
    const empty = {
      response: { numFound: 0, docs: [] },
      highlighting: {},
      spellcheck: {
        collations: ['collation', { collationQuery: 'den haag' }],
      },
    };
    const found = {
      response: {
        numFound: 1,
        docs: [
          { id: 'a', weergavenaam: 'Den Haag', centroide_ll: 'POINT(4 52)' },
        ],
      },
      highlighting: { a: {} },
    };

    const queries = [];
    globalThis.server.use(
      http.get('https://api.pdok.nl/*', ({ request }) => {
        const q = new URL(request.url).searchParams.get('q');
        queries.push(q);
        return HttpResponse.json(q === 'den haag' ? found : empty);
      }),
    );

    const results = await new PdokNlProvider().search({ query: 'dne haag' });

    expect(queries).toEqual(['dne haag', 'den haag']);
    expect(results.map((r) => r.label)).toEqual(['Den Haag']);
  });
});
