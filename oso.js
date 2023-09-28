'use strict';

const { Oso } = require('oso-cloud');
const assert = require('assert');

const apiKey = process.env.OSO_CLOUD_API_KEY;
assert.ok(apiKey, 'Must set OSO_CLOUD_API_KEY environment variable');
const oso = new Oso('https://cloud.osohq.com', apiKey, { debug: { print: true } });

module.exports = oso;