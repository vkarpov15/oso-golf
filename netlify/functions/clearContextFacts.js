'use strict';

const Archetype = require('archetype');
const Log = require('../../db/log'); 
const Player = require('../../db/player');
const connect = require('../../db/connect');
const extrovert = require('extrovert');
const { inspect } = require('util');

const ClearContextFactsParams = new Archetype({
  sessionId: {
    $type: 'string',
    $required: true
  }
}).compile('ClearContextFactsParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  params = new ClearContextFactsParams(params);

  await connect();

  await Log.info(`clearContextFacts ${inspect(params)}`, {
    ...params,
    function: 'clearContextFacts'
  });

  try {
    const { sessionId } = params;
    const player = await Player.findOne({ sessionId }).orFail();

    player.contextFacts = [];

    await player.save();
    return { ok: true };
  } catch (err) {
    await Log.error(`clearContextFacts: ${err.message}`, {
      ...params,
      function: 'clearContextFacts',
      message: err.message,
      stack: err.stack,
      err: inspect(err)
    });

    throw err;
  }
}, null, 'clearContextFacts');