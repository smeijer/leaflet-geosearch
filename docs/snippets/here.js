import L from 'leaflet';
import {
  GeoSearchControl,
  HereMapProvider,
} from 'leaflet-geosearch';

const provider = new HereMapProvider({
  params: {
    app_id: '___YOUR_APP_ID___',
    app_code: '___YOUR_APP_CODE___'
  }
});

const searchControl = new GeoSearchControl({
  provider: provider,
});

const map = new L.Map('map');
map.addControl(searchControl);
