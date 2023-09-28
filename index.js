'use strict';

const { Oso } = require('oso-cloud');
const assert = require('assert');
const express = require('express');
const path = require('path');

require('./build')(true);

const app = express();
app.use(express.json());

const apiKey = process.env.OSO_CLOUD_API_KEY;
assert.ok(apiKey, 'Must set OSO_CLOUD_API_KEY environment variable');
const oso = new Oso('https://cloud.osohq.com', apiKey, { debug: { print: true } });

app.get('/authorize', async (req, res) => {
  const authorized = await oso.authorize(
    { type: 'User', id: `${req.query.sessionId}_${req.query.userId}` },
    req.query.action,
    { type: req.query.resourceType, id: req.query.resourceId }
  );
  res.json({ authorized });
});

app.get('/facts', async (req, res) => {
  const facts = [];
  for (const userId of req.query.userId) {
    const factsForUser = await oso.get(
      'has_role',
      { type: 'User', id: `${req.query.sessionId}_${userId}` },
      null,
      null
    );
    facts.push(...factsForUser);
  }
  
  res.json({ facts });
});

app.put('/tell', async (req, res) => {
  await oso.tell(
    'has_role',
    { type: 'User', id: `${req.body.sessionId}_${req.body.userId}` },
    req.body.role,
    { type: req.body.resourceType, id: req.body.resourceId }
  );
  res.json({ ok: true });
});

app.put('/delete', async (req, res) => {
  await oso.delete(
    'has_role',
    { type: 'User', id: `${req.body.sessionId}_${req.body.userId}` },
    req.body.role,
    { type: req.body.resourceType, id: req.body.resourceId }
  );
  res.json({ ok: true });
});

app.use(express.static('./public'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

const port = process.env.PORT || 4488;

app.listen(port);
console.log('Listening on port', port);