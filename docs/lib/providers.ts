import {
  AlgoliaProvider,
  BingProvider,
  EsriProvider,
  GeocodeEarthProvider,
  GoogleProvider,
  HereProvider,
  LocationIQProvider,
  OpenCageProvider,
  OpenStreetMapProvider,
  PeliasProvider,
  GeoApiFrProvider,
} from 'leaflet-geosearch';

export default {
  Algolia: new AlgoliaProvider(),

  Bing: new BingProvider({
    params: { key: process.env.GATSBY_BING_API_KEY },
  }),

  Esri: new EsriProvider(),

  GeocodeEarth: new GeocodeEarthProvider({
    // eslint-disable-next-line @typescript-eslint/camelcase
    params: { api_key: process.env.GATSBY_GEOCODEEARTH_API_KEY },
  }),

  Google: new GoogleProvider({
    params: { key: process.env.GATSBY_GOOGLE_API_KEY },
  }),

  Here: new HereProvider({
    params: { apiKey: process.env.GATSBY_HERE_API_KEY },
  }),

  LocationIQ: new LocationIQProvider({
    params: { key: process.env.GATSBY_LOCATIONIQ_API_KEY },
  }),

  OpenCage: new OpenCageProvider({
    params: { key: process.env.GATSBY_OPENCAGE_API_KEY },
  }),

  OpenStreetMap: new OpenStreetMapProvider(),

  Pelias: new PeliasProvider(),

  GeoApiFr: new GeoApiFrProvider(),
};
