/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

exports.onCreateWebpackConfig = (args) => {
  args.actions.setWebpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, '../docs'), 'node_modules'],
      alias: {
        'leaflet-geosearch': path.resolve(__dirname, '../dist/geosearch.js'),
      },
    },
  });
};
