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
  /** several providers, shown in the provider select */
  providers?: ProviderName[];
  controlOptions?: Record<string, unknown>;
  /** extra params for the provider, e.g. { countrycodes: 'us,ca' } */
  providerParams?: Record<string, string | number | boolean>;
}

// a plain Leaflet map with the search control. Leaflet needs a browser, so
// it is only loaded once the component is mounted
export default function Map({
  provider = 'OpenStreetMap',
  providers,
  controlOptions = {},
  providerParams,
}: MapProps) {
  const ref = useRef<HTMLDivElement>(null);
  const options = JSON.stringify(controlOptions);
  const params = JSON.stringify(providerParams || {});
  const names = providers?.join(',');

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

      const choice = names
        ? {
            providers: (names.split(',') as ProviderName[]).map((name) => ({
              label: name,
              provider: createProvider(name),
            })),
          }
        : { provider: createProvider(provider) };

      // added to the params the provider already has, like its key
      const extra = JSON.parse(params);
      [...(choice.providers || []).map((c) => c.provider), choice.provider]
        .filter(Boolean)
        .forEach((p) => {
          p!.options.params = { ...p!.options.params, ...extra };
        });

      leafletMap.addControl(
        new GeoSearchControl({
          style: 'bar',
          ...choice,
          ...JSON.parse(options),
        }),
      );
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [provider, names, options, params]);

  return <div ref={ref} className={styles.map} />;
}
