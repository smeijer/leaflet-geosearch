const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: [
    'babel-polyfill',
    path.resolve(__dirname, 'example/main.js'),
    path.resolve(__dirname, 'src/index.js'),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    library: 'GeoSearch',
    libraryTarget: 'umd',
    publicPath: 'dist',
  },
  devServer: {
    // contentBase: './example',
    inline: true,
  },
  module: {
    loaders: [
      {
        test: /\.html|\.css$/,
        loader: 'raw-loader',
      },
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/,
      },
    ],
  },
};
