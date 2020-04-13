import React, { ReactElement } from 'react';
import Leaflet from './Leaflet';

export interface MapProps {
  provider?: 'OpenStreetMap' | 'Google' | 'Bing';
  providerOptions: any;
}

function Map(props: MapProps): ReactElement {
  if (typeof window === 'undefined') {
    return <div>loading...</div>;
  }

  return <Leaflet provider={props.provider} />;
}

export default Map;
