> For AI agents: the complete documentation index is available at /llms.txt, the full documentation bundle is available at /llms-full.txt.

# MapBox Provider

**note**: MapBox services require an API key. [Obtain here][1].
For more options and configurations, see the [MapBox developer docs on the Search API][2].


```js
import { MapBoxProvider } from 'leaflet-geosearch';

const provider = new MapBoxProvider({
  params: {
    access_token: '__YOUR_MAPBOX_KEY__',
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

[1]: https://docs.mapbox.com/help/dive-deeper/access-tokens/

[2]: https://docs.mapbox.com/api/search/search-box/
