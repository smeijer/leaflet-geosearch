import React, { ReactElement, useRef, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { Map as BaseMap, TileLayer } from 'react-leaflet';
import { GeoSearchControl } from 'leaflet-geosearch';

import '../../assets/css/leaflet.css';

import useConfigureLeaflet from '../hooks/useConfigureLeaflet';
import providers from '../lib/providers';
import styles from './Map.module.css';

export interface MapProps {
  provider?: 'OpenStreetMap' | 'Google' | 'Bing';
  providerOptions: any;
}

function Map(props: MapProps): ReactElement {
  const { provider = 'OpenStreetMap' } = props;

  const ref = useRef(null);
  const control = useRef(null);

  const { viewport } = useConfigureLeaflet();

  useEffect(() => {
    if (ref.current) {
      if (!providers[provider]) {
        throw new Error('unknown provider');
      }

      control.current = GeoSearchControl({
        style: 'bar',
        provider: providers[provider],
      });

      ref.current.leafletElement.addControl(control.current);
    }

    return () => {
      if (control.current) {
        ref.current.leafletElement.removeControl(control.current);
      }
    };
  }, [ref.current, control.current, provider]);

  if (typeof window === 'undefined') {
    return <div>loading...</div>;
  }

  // I'm not sure what's causing it, but the className from the outer
  // div is being removed. Hence the useless wrapper
  return (
    <div>
      <BaseMap ref={ref} viewport={viewport} id="map" className={styles.map}>
        <TileLayer url="//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </BaseMap>
    </div>
  );
}

export default Map;
