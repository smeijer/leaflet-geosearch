import {
  BingProvider,
  EsriProvider,
  GeoApiFrProvider,
  GeoapifyProvider,
  GeocodeEarthProvider,
  GoogleProvider,
  LegacyGoogleProvider,
  HereProvider,
  LocationIQProvider,
  OpenCageProvider,
  OpenStreetMapProvider,
  PeliasProvider,
} from 'leaflet-geosearch';

export default {
  Bing: new BingProvider({
    params: { key: process.env.GATSBY_BING_API_KEY },
  }),

  Esri: new EsriProvider(),

  GeoApiFr: new GeoApiFrProvider(),

  Geoapify: new GeoapifyProvider({
    params: { apiKey: process.env.GATSBY_GEOAPIFY_API_KEY },
  }),

  GeocodeEarth: new GeocodeEarthProvider({
    params: { api_key: process.env.GATSBY_GEOCODEEARTH_API_KEY },
  }),

  Google: new GoogleProvider({ apiKey: process.env.GATSBY_GOOGLE_API_KEY }),

  LegacyGoogle: new LegacyGoogleProvider({
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
};
