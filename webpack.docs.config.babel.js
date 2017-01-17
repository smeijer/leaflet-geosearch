import webpack from 'webpack';
import path from 'path';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

const { NODE_ENV } = process.env;
const production = NODE_ENV === 'production';

const plugins = [
  new webpack.optimize.OccurenceOrderPlugin(),
  new webpack.DefinePlugin({
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
  }),
  new ExtractTextPlugin('style.css', { allChunks: true }),
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
  'nodent-runtime',
  path.join(__dirname, 'docs/main.js'),
];

export default {
  entry: entryFiles,
  output: {
    path: path.join(__dirname, 'docs/dist'),
    filename: `bundle${production ? '.min' : ''}.js`,
  },
  devTool: 'inline-source-map',
  devServer: {
    // contentBase: './example',
    inline: true,
  },
  module: {
    loaders: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract(
          'style-loader',
          'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]',
        ),
      },
      {
        test: /\.html$/,
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
