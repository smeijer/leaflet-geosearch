exports.onCreateWebpackConfig = ({ stage, rules, loaders, actions }) => {
  switch (stage) {
    case 'build-html':
      actions.setWebpackConfig({
        module: {
          rules: [
            {
              test: /react-leaflet|leaflet/,
              use: [loaders.null()],
            },
          ],
        },
      });
      break;
  }
};
