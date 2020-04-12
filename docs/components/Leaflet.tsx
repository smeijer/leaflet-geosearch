import React, { ReactElement, useRef, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import { Map, TileLayer } from 'react-leaflet';
import styles from './Leaflet.module.css';
import '../../assets/css/leaflet.css';
import useConfigureLeaflet from '../hooks/useConfigureLeaflet';
import * as providers from '../../src/providers';
import GeoSearchControl from '../../src/leafletControl';

import { MapProps } from './Map';

const providerMap = {
  Bing: new providers.BingProvider({
    params: { key: process.env.GATSBY_BING_API_KEY },
  }),
  Esri: new providers.EsriProvider(),
  Google: new providers.GoogleProvider({
    params: { key: process.env.GATSBY_GOOGLE_API_KEY },
  }),
  LocationIQ: new providers.LocationIQProvider({
    params: { key: process.env.GATSBY_LOCATIONIQ_API_KEY },
  }),
  OpenCage: new providers.OpenCageProvider({
    params: { key: process.env.GATSBY_OPENCAGE_API_KEY },
  }),
  OpenStreetMap: new providers.OpenStreetMapProvider(),
};

function Leaflet(props: MapProps): ReactElement {
  const { provider = 'OpenStreetMap' } = props;

  const ref = useRef(null);
  const control = useRef(null);

  const { viewport } = useConfigureLeaflet();

  useEffect(() => {
    if (ref.current) {
      if (!providerMap[provider]) {
        throw new Error('unknown provider');
      }

      control.current = GeoSearchControl({
        style: 'bar',
        provider: providerMap[provider],
      });

      ref.current.leafletElement.addControl(control.current);
    }

    return () => {
      if (control.current) {
        ref.current.leafletElement.removeControl(control.current);
      }
    };
  }, [ref.current, control.current, provider]);

  return (
    <div className={styles.root}>
      <Map ref={ref} viewport={viewport} className={styles.map}>
        <TileLayer url="//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </Map>
    </div>
  );
}

export default Leaflet;
