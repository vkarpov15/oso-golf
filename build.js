'use strict';

const fs = require('fs');
const { copySync } = require('fs-extra');
const path = require('path');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');

try {
  fs.mkdirSync(path.join(__dirname, 'public', 'vendor'));
} catch (err) {}
try {
  fs.mkdirSync(path.join(__dirname, 'public', 'vendor', 'vanillatoasts'));
} catch (err) {}

fs.copyFileSync(
  path.join(__dirname, 'node_modules', 'vanillatoasts', 'vanillatoasts.css'),
  path.join(__dirname, 'public', 'vendor', 'vanillatoasts', 'vanillatoasts.css')
);

copySync(
  path.join(__dirname, 'node_modules', 'vue', 'dist'),
  path.join(__dirname, 'public', 'vendor', 'vue')
);

copySync(
  path.join(__dirname, 'node_modules', 'vue-router', 'dist'),
  path.join(__dirname, 'public', 'vendor', 'vue-router')
);

module.exports = async function build(watch) {
  const compiler = webpack(webpackConfig);
  if (watch) {
    compiler.watch({}, (err, res) => {
      if (err) {
        process.nextTick(() => { throw new Error('Error compiling bundle: ' + err.stack); });
      }
      console.log('Webpack compiled successfully');
    });
  } else {
    await new Promise((resolve, reject) => {
      compiler.run((err) => {
        if (err) {
          return reject(err);
        }
        console.log('Webpack compiled successfully');
        resolve();
      });
    });
  }
};