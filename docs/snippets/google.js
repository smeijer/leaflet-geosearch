import L from 'leaflet';
import {
  GeoSearchControl,
  GoogleProvider,
} from 'leaflet-geosearch';

const provider = new GoogleProvider({ params: {
  key: '__YOUR_GOOGLE_KEY__',
} });

const searchControl = new GeoSearchControl({
  provider: provider,
});

const map = new L.Map('map');
map.addControl(searchControl);
