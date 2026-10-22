// compiled by `npm run ci:tsc`, never run. a type error here fails CI
import { Map } from 'leaflet';
import {
  GeoSearchControl,
  SearchControl,
  OpenStreetMapProvider,
  type ProviderChoice,
  type ProviderInfo,
  type SearchControlLabels,
  type SelectedProvider,
} from '../../src';

declare const map: Map;
const provider = new OpenStreetMapProvider();

// both forms are documented and work at runtime (#334)
const constructed = new GeoSearchControl({ provider, style: 'bar' });
const called = SearchControl({ provider });

map.addControl(constructed);
map.addControl(called);
constructed.getContainer();
called.setPosition(called.options.position);

// several providers instead of one
const several = new GeoSearchControl({
  providers: [
    { label: 'OpenStreetMap', provider },
    { label: 'Other', provider: new OpenStreetMapProvider() },
  ],
  allProvidersLabel: false,
  fallback: 'error',
});
several.selectProvider(1);
several.setProviderSelectVisible(false);
const listed: ProviderInfo[] = several.getProviders();
const selected: SelectedProvider = several.getSelectedProvider();
const choices: ProviderChoice[] = [{ label: 'x', provider }];

// methods for code outside the control
constructed.reset();
constructed.setQuery('Amsterdam');
const labels: Partial<SearchControlLabels> = { searchLabel: 'Adres' };
constructed.setLabels(labels);

// flyTo takes a boolean or Leaflet's pan options (#308)
new GeoSearchControl({ provider, flyTo: true });
new GeoSearchControl({ provider, flyTo: { duration: 1.5 } });
