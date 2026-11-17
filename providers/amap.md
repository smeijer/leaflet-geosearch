> For AI agents: the complete documentation index is available at /llms.txt, the full documentation bundle is available at /llms-full.txt.

# AMap Provider

**note**: AMap services require an API key. [Obtain here][1].
For more options and configurations, see the [AMap developer docs][2].


```js
import { AMapProvider } from 'leaflet-geosearch';

const provider = new AMapProvider({
  params: {
    key: '__YOUR_AMAP_KEY__',
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

[1]: https://console.amap.com/dev/key/app

[2]: https://lbs.amap.com/api/webservice/guide/api/georegeo
