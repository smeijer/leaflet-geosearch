import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { createProvider, ProviderName } from './providers';
import styles from './Map.module.css';

export interface MapProps {
  provider?: ProviderName;
  controlOptions?: Record<string, unknown>;
}

// a plain Leaflet map with the search control. Leaflet needs a browser, so
// it is only loaded once the component is mounted
export default function Map({
  provider = 'OpenStreetMap',
  controlOptions = {},
}: MapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const options = JSON.stringify(controlOptions);

  useEffect(() => {
    let map: { remove(): void } | undefined;
    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      const { GeoSearchControl } = await import('leaflet-geosearch');
      if (cancelled || !ref.current) {
        return;
      }

      // use the marker images from the bundle instead of guessing their path
      L.Icon.Default.imagePath = '';
      L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

      const leafletMap = new L.Map(ref.current, {
        center: [53.2, 5.8],
        zoom: 12,
      });
      map = leafletMap;

      new L.TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(leafletMap);

      leafletMap.addControl(
        new GeoSearchControl({
          style: 'bar',
          provider: createProvider(provider),
          ...JSON.parse(options),
        }),
      );
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [provider, options]);

  return <div ref={ref} className={styles.map} />;
}
