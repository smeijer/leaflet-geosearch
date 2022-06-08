/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

exports.onCreateWebpackConfig = ({ actions, stage, loaders }) => {
  if (stage === 'build-html' || stage === 'develop-html') {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: [/node_modules\/leaflet/, /node_modules\\leaflet/],
            use: loaders.null(),
          },
        ],
      },
    });
  }

  actions.setWebpackConfig({
    resolve: {
      modules: [path.resolve(__dirname, '../docs'), 'node_modules'],
      alias: {
        'leaflet-geosearch': path.resolve(__dirname, '../dist/geosearch.js'),
      },
    },
  });
};
