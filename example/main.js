import preact, { render } from 'preact';
import Layout from './Layout';
import Search from './Search';
import Map from './Map';
import * as providers from '../src/providers';

// import css to enable hot reloading
if (process.env.NODE_ENV !== 'production') {
  /* eslint-disable global-require */
  require('./index.html');
  require('./style.css');
  require('../assets/css/leaflet.css');
}

const pages = [
  {
    slug: 'search',
    title: 'Search',
    view: () => (<Search />),
  },
  {
    slug: 'openstreetmap',
    title: 'OpenStreetMap',
    view: () => (<Map Provider={providers.OpenStreetMapProvider} />),
  },
  {
    slug: 'google',
    title: 'Google',
    view: () => {
      const Provider = new providers.GoogleProvider({ params: {
        key: 'AIzaSyDigZ5WMPoTj_gnkUn3p1waYPDa5oE8WOw',
      } });

      return <Map Provider={Provider} />;
    },
  },
  {
    slug: 'bing',
    title: 'Bing',
    view: () => {
      const Provider = new providers.BingProvider({ params: {
        key: 'AtUDjSVEBxo8BwgYUPdfnzHpznaYwDdjjS27jyFDj18nhTUDUjrhc0NwMndZvrXs',
      } });

      return <Map Provider={Provider} />;
    },
  },
  {
    slug: 'esri',
    title: 'Esri',
    view: () => (<Map Provider={providers.EsriProvider} />),
  },
];

if (location.hash === '') {
  location.hash = 'search';
}

render((
  <Layout pages={pages} />
), document.getElementById('app'));
