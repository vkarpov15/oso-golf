'use strict';

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({
  path: path.resolve(path.join(__dirname, '..'), '.env.test')
});