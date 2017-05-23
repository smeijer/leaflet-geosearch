// polyfills
import 'babel-polyfill';
import 'whatwg-fetch';

import preact, { render } from 'preact';
import { Layout } from './components';
import pages from './pages';

import './assets/css/style.css';

// import css to enable hot reloading
if (process.env.NODE_ENV !== 'production') {
  /* eslint-disable global-require */
  require('./index.html');
  require('../assets/css/leaflet.css');
}

if (location.hash === '') {
  location.hash = 'search';
}

render((
  <Layout pages={pages} />
), document.getElementById('app'));
