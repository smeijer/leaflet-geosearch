import L from 'leaflet';

import isDomAvailable from '../lib/isDomAvailable';
import { Viewport } from 'react-leaflet';

const viewport: Viewport = {
  center: [53.2, 5.8],
  zoom: 12,
};

export interface LeafletConfig {
  viewport: Viewport;
}

const useConfigureLeaflet = (): LeafletConfig => {
  if (!isDomAvailable()) return;

  // To get around an issue with the default icon not being set up right between using React
  // and importing the leaflet library, we need to reset the image imports
  // See https://github.com/PaulLeCam/react-leaflet/issues/453#issuecomment-410450387

  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
  });

  return { viewport };
};

export default useConfigureLeaflet;
