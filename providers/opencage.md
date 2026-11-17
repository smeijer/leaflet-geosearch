> For AI agents: the complete documentation index is available at /llms.txt, the full documentation bundle is available at /llms-full.txt.

# OpenCage Provider

**note**: OpenCage services require an API key. [Obtain here][1].
For more options and configurations, see the [OpenCage developer docs][2].


```js
import { OpenCageProvider } from 'leaflet-geosearch';

const provider = new OpenCageProvider({
  params: {
    key: '__YOUR_OPENCAGE_KEY__',
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

[1]: https://geocoder.opencagedata.com

[2]: https://geocoder.opencagedata.com/api
