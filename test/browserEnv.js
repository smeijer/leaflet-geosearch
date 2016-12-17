/* eslint-disable import/newline-after-import, no-undef */
const browserEnv = require('browser-env');
browserEnv();

require('babel-polyfill');

const fetch = require('node-fetch');
window.fetch = global.fetch = fetch;

const leaflet = require('leaflet');
window.L = global.L = leaflet;
