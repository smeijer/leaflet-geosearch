import preact from 'preact';

import { Search, Map } from './components';
import {
  OpenStreetMapProvider,
  GoogleProvider,
  BingProvider,
  EsriProvider,
} from '../src/providers';

const BING_KEY = 'AtUDjSVEBxo8BwgYUPdfnzHpznaYwDdjjS27jyFDj18nhTUDUjrhc0NwMndZvrXs';
const GOOGLE_KEY = 'AIzaSyDigZ5WMPoTj_gnkUn3p1waYPDa5oE8WOw';

/* eslint-disable import/no-webpack-loader-syntax, global-require, import/no-unresolved */
export default [
  {
    slug: 'search',
    title: 'Search',
    view: () => (<Search />),
    code: require('!!raw!./snippets/search'),
  },
  {
    slug: 'openstreetmap',
    title: 'OpenStreetMap',
    view: () => (<Map Provider={OpenStreetMapProvider} options={{ style: 'bar' }} />),
    code: require('!!raw!./snippets/openstreetmap'),
  },
  {
    slug: 'google',
    title: 'Google',
    view: () => {
      const Provider = new GoogleProvider({ params: {
        key: GOOGLE_KEY,
      } });

      return <Map Provider={Provider} />;
    },
    code: require('!!raw!./snippets/google'),
  },
  {
    slug: 'bing',
    title: 'Bing',
    view: () => {
      const Provider = new BingProvider({ params: {
        key: BING_KEY,
      } });

      return <Map Provider={Provider} />;
    },
    code: require('!!raw!./snippets/bing'),
  },
  {
    slug: 'esri',
    title: 'Esri',
    view: () => (<Map Provider={EsriProvider} />),
    code: require('!!raw!./snippets/esri'),
  },
];
