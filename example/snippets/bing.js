import L from 'leaflet';
import {
  GeoSearchControl,
  BingProvider,
} from 'leaflet-geosearch';

const provider = new BingProvider({ params: {
  key: '__YOUR_BING_KEY__'
} });

const searchControl = new GeoSearchControl({
  provider: provider,
});

const map = new L.Map('map');
map.addControl(searchControl);
