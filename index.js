'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');

require('./build')(process.env.WATCH);

const app = express();
app.use(express.json());

const netlifyFunctions = fs.readdirSync('./netlify/functions').reduce((obj, path) => {
  obj[path.replace(/\.js$/, '')] = require(`./netlify/functions/${path}`);
  return obj;
}, {});

app.use('/.netlify/functions', express.json(), function netlifyFunctionsMiddleware(req, res) {
  const actionName = req.path.replace(/^\//, '');
  if (!netlifyFunctions.hasOwnProperty(actionName)) {
    throw new Error(`Action ${actionName} not found`);
  }
  const action = netlifyFunctions[actionName];

  const params = {
    headers: req.headers,
    body: JSON.stringify(req.body),
    queryStringParameters: req.query
  };
  action.handler(params).
    then(result => {
      if (result.statusCode >= 400) {
        return res.status(400).json({ message: result.body });
      }
      res.json(JSON.parse(result.body))
    }).
    catch(err => res.status(500).json({ message: err.message, stack: err.stack }));
});

app.use(express.static('./public'));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

const port = process.env.PORT || 4488;

app.listen(port);
console.log('Listening on port', port);