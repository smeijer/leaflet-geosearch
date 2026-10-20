// @vitest-environment node

// what a server (Next.js, Nuxt, ...) sees: no window, no document. Leaflet
// can't load there, so leaflet-geosearch/providers must not import it (#365)
vi.mock('leaflet', () => {
  throw new Error('leaflet-geosearch/providers must not import leaflet');
});

test('the providers entry works without a browser', async () => {
  expect(typeof window).toBe('undefined');

  const providers = await import('../providers');
  const osm = new providers.OpenStreetMapProvider();
  const google = new providers.GoogleProvider({ apiKey: 'key' });

  expect(osm.endpoint({ query: 'Den Haag' })).toEqual(
    'https://nominatim.openstreetmap.org/search?q=Den%20Haag&format=json',
  );
  // the Google Maps script is only loaded in a browser
  expect(google.loader).toBeNull();
});
