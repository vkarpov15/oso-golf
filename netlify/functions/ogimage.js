'use strict';

const fs = require('fs');

require.extensions['.html'] = function(module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8');
};

const Player = require('../../db/player');
const Scorecard = require('../../src/scorecard/scorecard');
const { createSSRApp, provide, reactive } = require('vue');
const connect = require('../../db/connect');
const puppeteer = require('puppeteer');
const { renderToString } = require('vue/server-renderer');

// Source: https://michaelheap.com/netlify-function-lambda-return-image/
exports.handler = async function ogimage(event) {
  const sessionId = event.queryStringParameters.sessionId;
  if (!sessionId) {
    return {
      statusCode: 404,
      body: '<html><h1>Not Found</h1></html>'
    };
  }

  await connect();
  const player = await Player.findOne({ sessionId }).orFail();

  const app = createSSRApp({
    template: '<scorecard />',
    setup() {
      const state = reactive({
        name: player.name,
        player: player.toObject()
      });
  
      provide('state', state);
    }
  });
  Scorecard(app);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: {
      width: 1200,
      height: 630
    }
  });
  const page = await browser.newPage();

  const compiledHTML = `<html>
  <head>
    <link rel="stylesheet" type="text/css" href="https://oso-golf.netlify.app/style.css"/>
    <link rel="icon" type="image/png" href="https://oso-golf.netlify.app/images/oso-golf-bear-no-bg.png">

    <title>${player.name}'s Oso Golf Scorecard</title>
    <style>
      .scorecard {
        font-size: 32px !important;
      }
    </style>
  </head>
  <body style="border: 16px solid #6366f2; display: flex; flex-direction: row; height: 630px">
    <div class="m-auto w-full; height: 630px;" style="padding-left: 18px; padding-right: 18px">
      <div style="align-items: center; line-height: 1.25em; justify-items: center; font-size: 96px" class="font-bold tracking-tight sm:text-6xl flex gap-2">
        <div>
          <img style="height: 6em" src="https://oso-golf.netlify.app/images/oso-golf-bear-no-bg.png">
        </div>
        <div>
          <div>
            My Oso Golf Scorecard
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>`;

  await page.setContent(compiledHTML, { waitUntil: 'networkidle0' });

  const image = await page.screenshot();  
  await browser.close();

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'image/png'
    },
    body: image.toString('base64'),
    isBase64Encoded: true 
  };
};