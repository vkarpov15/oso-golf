'use strict';

const fs = require('fs');

require.extensions['.html'] = function(module, filename) {
  module.exports = fs.readFileSync(filename, 'utf8');
};

const Player = require('../../db/player');
const Scorecard = require('../../src/scorecard/scorecard');
const { createSSRApp, provide, reactive } = require('vue');
const connect = require('../../db/connect');
const { renderToString } = require('vue/server-renderer');

exports.handler = async function share(event) {
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

  return {
    statusCode: 200,
    body: `<html>
    <head>
      <link rel="stylesheet" type="text/css" href="/style.css"/>
      <link rel="icon" type="image/png" href="/images/oso-golf-bear-no-bg.png">
      <meta property="og:image" content="https://oso-golf.netlify.app/.netlify/functions/ogimage?sessionId=${sessionId}"/>
      <meta property="og:title" content="Oso Golf Scorecard"/>
      <meta property="og:type" content="website"/>
      <meta property="og:url" content="https://oso-golf.netlify.app"/>
      <meta property="og:description" content="Oso Golf is a logic game, similar to “Regex Golf”, that is designed to teach you authorization principles by completing permissions with as few objects as possible."/>

      <title>${player.name}'s Oso Golf Scorecard</title>
    </head>
    <body>
      <div class="m-auto max-w-5xl px-2">
        <div style="align-items: center" class="text-4xl font-bold tracking-tight sm:text-6xl mt-3 mb-3 flex gap-2">
          <div>
            <img style="height: 4em" src="/images/oso-golf-bear-no-bg.png">
          </div>
          <div>
            Oso Golf Scorecard
          </div>
        </div>
        ${await renderToString(app)}
        <div class="mt-6">
          <p>
            Want to play?
          </p>
          <div>
            <a href="https://oso-golf.netlify.app">
              <button
                class="rounded-md bg-green-600 px-3.5 py-2.5 mt-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600">
                Play Oso Golf
              </button>
            </a>
          </div>
        </div>
      </div>
    </body>
    </html>`
  };
};