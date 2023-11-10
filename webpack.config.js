'use strict';

const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    app: `${__dirname}/src/index.js`
  },
  target: 'web',
  optimization: {
    minimize: false
  },
  output: {
    path: `${__dirname}/public`,
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        type: 'asset/source'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      HAS_PASSWORD: `${!!process.env.OSO_GOLF_PASSWORD}` // Note that the raw string is wrapped in quotes
    })
  ]
};