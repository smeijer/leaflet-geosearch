import L from 'leaflet';
import {
  GeoSearchControl,
  OpenStreetMapProvider,
} from 'leaflet-geosearch';

const provider = new OpenStreetMapProvider();

const searchControl = new GeoSearchControl({
  provider: provider,
});

const map = new L.Map('map');
map.addControl(searchControl);
