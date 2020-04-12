import React, { ReactElement, lazy, Suspense } from 'react';
import 'leaflet/dist/leaflet.css';

const Leaflet = lazy(() => import('./Leaflet'));
const Loader = () => <div>loading...</div>;

export interface MapProps {
  provider: 'OpenStreetMap' | 'Google' | 'Bing';
  providerOptions: any;
}

function Map(props: MapProps): ReactElement {
  return (
    <Suspense fallback={<Loader />}>
      <Leaflet provider={props.provider} />
    </Suspense>
  );
}

export default Map;
