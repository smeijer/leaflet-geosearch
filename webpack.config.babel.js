import webpack from 'webpack';
import path from 'path';

const { NODE_ENV } = process.env;
const production = NODE_ENV === 'production';

const plugins = [
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
  }),
];

if (production) {
  plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        screw_ie8: true,
        warnings: false,
      },
    }),
  );
}

const entryFiles = [
  'babel-polyfill',
  path.join(__dirname, 'src/index.js'),
];

if (!production) {
  entryFiles.push(path.join(__dirname, 'docs/main.js'));
}

export default {
  entry: entryFiles,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: `bundle${production ? '.min' : ''}.js`,
    library: 'GeoSearch',
    libraryTarget: 'umd',
  },
  devTool: 'inline-source-map',
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
  plugins,
};
