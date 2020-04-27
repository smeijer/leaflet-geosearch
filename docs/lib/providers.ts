import {
  BingProvider,
  EsriProvider,
  GoogleProvider,
  HereProvider,
  LocationIQProvider,
  OpenCageProvider,
  OpenStreetMapProvider,
} from 'leaflet-geosearch';

export default {
  Bing: new BingProvider({
    params: { key: process.env.GATSBY_BING_API_KEY },
  }),

  Esri: new EsriProvider(),

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
};
