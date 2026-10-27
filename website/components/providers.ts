// leaflet-geosearch/providers doesn't import Leaflet, so this also works
// while the pages are rendered at build time
import {
  AMapProvider,
  BingProvider,
  EsriProvider,
  GeoApiFrProvider,
  GeoapifyProvider,
  GeocodeEarthProvider,
  GoogleProvider,
  HereProvider,
  JsonProvider,
  LegacyGoogleProvider,
  LocationIQProvider,
  MapBoxProvider,
  OpenCageProvider,
  OpenGeocodingProvider,
  OpenStreetMapProvider,
  PdokNlProvider,
  PeliasProvider,
  PhotonProvider,
} from 'leaflet-geosearch/providers';

// the keys are set at build time (see rspress.config.ts) and end up in the
// page, so they must be restricted to the docs domain
const providers = {
  AMap: () => new AMapProvider({ params: { key: process.env.AMAP_API_KEY } }),
  Bing: () => new BingProvider({ params: { key: process.env.BING_API_KEY } }),
  Esri: () => new EsriProvider(),
  GeoApiFr: () => new GeoApiFrProvider(),
  Geoapify: () =>
    new GeoapifyProvider({ params: { apiKey: process.env.GEOAPIFY_API_KEY } }),
  GeocodeEarth: () =>
    new GeocodeEarthProvider({
      params: { api_key: process.env.GEOCODEEARTH_API_KEY },
    }),
  Google: () => new GoogleProvider({ apiKey: process.env.GOOGLE_API_KEY }),
  LegacyGoogle: () =>
    new LegacyGoogleProvider({ params: { key: process.env.GOOGLE_API_KEY } }),
  Here: () =>
    new HereProvider({ params: { apiKey: process.env.HERE_API_KEY } }),
  LocationIQ: () =>
    new LocationIQProvider({ params: { key: process.env.LOCATIONIQ_API_KEY } }),
  MapBox: () =>
    new MapBoxProvider({
      params: { access_token: process.env.MAPBOX_API_KEY },
    }),
  OpenCage: () =>
    new OpenCageProvider({ params: { key: process.env.OPENCAGE_API_KEY } }),
  OpenGeocoding: () =>
    new OpenGeocodingProvider({ apiKey: process.env.OPENGEOCODING_API_KEY }),
  OpenStreetMap: () => new OpenStreetMapProvider(),
  PdokNl: () => new PdokNlProvider(),
  Pelias: () => new PeliasProvider(),
  Photon: () => new PhotonProvider(),
};

export type ProviderName = keyof typeof providers;

export function createProvider(name: ProviderName): JsonProvider {
  const create = providers[name];
  if (!create) {
    throw new Error(`unknown provider ${name}`);
  }
  return create();
}
