> For AI agents: the complete documentation index is available at /llms.txt, the full documentation bundle is available at /llms-full.txt.

# Here Provider

**note**: Here services require an API key. [Obtain here][1].
For more options and configurations, see the [Here developer docs][2].


```js
import { HereProvider } from 'leaflet-geosearch';

const provider = new HereProvider({
  params: {
    apiKey: '__YOUR_HERE_KEY__',
  },
});

// add to leaflet
import { GeoSearchControl } from 'leaflet-geosearch';

map.addControl(
  new GeoSearchControl({
    provider,
    style: 'bar',
  }),
);
```

[1]: https://developer.here.com

[2]: https://developer.here.com/documentation/geocoding-search-api
