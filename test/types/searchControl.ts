// compiled by `npm run ci:tsc`, never run. a type error here fails CI
import { Map } from 'leaflet';
import {
  GeoSearchControl,
  SearchControl,
  OpenStreetMapProvider,
} from '../../src';

declare const map: Map;
const provider = new OpenStreetMapProvider();

// both forms are documented and work at runtime (#334)
const constructed = new GeoSearchControl({ provider, style: 'bar' });
const called = SearchControl({ provider });

map.addControl(constructed);
map.addControl(called);
constructed.getContainer();
called.options.provider;
