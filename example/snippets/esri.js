import L from 'leaflet';
import {
  GeoSearchControl,
  EsriProvider,
} from 'leaflet-geosearch';

const provider = new EsriProvider();

const searchControl = new GeoSearchControl({
  provider: provider,
});

const map = new L.Map('map');
map.addControl(searchControl);
