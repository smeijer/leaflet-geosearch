/* eslint-disable no-undef, @typescript-eslint/no-var-requires */
const browserEnv = require('browser-env');
browserEnv();

const fetch = require('node-fetch');
window.fetch = global.fetch = fetch;

const leaflet = require('leaflet');
window.L = global.L = leaflet;
