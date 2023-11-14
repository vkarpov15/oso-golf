'use strict';

const mongoose = require('mongoose');
const { inspect } = require('util');

const isTest = process.env.NODE_ENV === 'test';

const options = { timestamps: true };
options.capped = 256e7; /* 256 MB */

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    default: 'info',
    required: true,
    enum: ['debug', 'info', 'warning', 'error']
  },
  appName: {
    type: String,
    required: true,
    enum: ['core-api', 'ios', 'web', 'host-dashboard'],
    default: 'core-api'
  },
  appVersion: {
    type: String
  },
  message: {
    type: String,
    required: true
  },
  data: 'Mixed'
}, options);

logSchema.statics.debug = function debug(message, data) {
  if (!isTest) {
    console.log(new Date(), '[DEBUG]', message, data);
  }
  return this.create({ level: 'debug', message, data });
};

logSchema.statics.info = function info(message, data) {
  if (!isTest) {
    console.log(new Date(), '[INFO]', message, data);
  }
  return this.create({ level: 'info', message, data });
};

logSchema.statics.warning = function warning(message, data) {
  if (!isTest) {
    console.log(new Date(), '[WARNING]', message, data);
  }
  return this.create({ level: 'warning', message, data });
};

logSchema.statics.error = function error(message, data) {
  if (!isTest) {
    console.log(new Date(), '[ERROR]', message, data);
  }
  return this.create({ level: 'error', message, data });
};

module.exports = mongoose.model('Log', logSchema);