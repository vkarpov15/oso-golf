'use strict';

const fs = require('fs');
const { copySync } = require('fs-extra');
const { execSync, exec } = require('child_process');
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

copySync(
  path.join(__dirname, 'node_modules', 'prismjs'),
  path.join(__dirname, 'public', 'vendor', 'prismjs')
);

module.exports = async function build(watch) {
  if (watch) {
    const childProcess = exec('npm run tailwind:watch');
    childProcess.stdout.on('data', data => console.log('[TAILWIND]', data));
    childProcess.stderr.on('data', data => console.log('[TAILWIND]', data));
  } else {
    execSync('npm run tailwind');
  }

  generateComponentsDirectory();

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

function generateComponentsDirectory() {
  // Generate list of components
  let components = `
  'use strict';

  // This file is auto-generated. Do not modify this file directly.
  `.trim();
  fs.readdirSync(path.join(__dirname, 'src')).forEach(folder => {
    if (folder.startsWith('_')) {
      return;
    }
    const stat = fs.statSync(path.join(__dirname, 'src', folder));
    if (!stat.isDirectory()) {
      return;
    }
    components += `\nexports['${folder}'] = require('./${folder}/${folder}.js');`;
    const folderPath = path.join(__dirname, 'src', folder);
    for (const subdir of fs.readdirSync(folderPath)) {
      const stat = fs.statSync(path.join(folderPath, subdir));
      if (!stat.isDirectory()) {
        continue;
      }
      components += `\nexports['${subdir}'] = require('./${folder}/${subdir}/${subdir}.js');`;
    }
  });
  fs.writeFileSync(path.join(__dirname, 'src', 'components.js'), components);
}

if (require.main === module) {
  module.exports();
}