'use strict';

const { Oso } = require('oso-cloud');
const express = require('express');
const path = require('path');

require('./build')(true);

const app = express();

const OSO_PUBLIC_KEY = 'e_2X2Aptq4zNfOco0slBO7HC_4od7oIniClb_6EkXjfzcTT5zwV28wvoiJm3Hq77V'; //'e_2X2Aptq4zNfOco0slBO7HC_4mdE17nqCF4_4BGsd0rNVYUSHKBF9woyEI1rP1uC';
const oso = new Oso('https://cloud.osohq.com', OSO_PUBLIC_KEY);

app.get('/authorize', async (req, res) => {
  const authorized = await oso.authorize(
    { type: 'User', id: req.query.userId },
    req.query.action,
    { type: req.query.resourceType, id: req.query.resourceId }
  );
  res.json({ authorized });
});

app.use(express.static('./public'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

const port = process.env.PORT || 4488;

app.listen(port);
console.log('Listening on port', port);