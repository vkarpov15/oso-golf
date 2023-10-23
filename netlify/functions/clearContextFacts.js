'use strict';

const Archetype = require('archetype');
const Player = require('../../db/player');
const connect = require('../../db/connect');
const extrovert = require('extrovert');

const ClearContextFactsParams = new Archetype({
  sessionId: {
    $type: 'string',
    $required: true
  }
}).compile('ClearContextFactsParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  params = new ClearContextFactsParams(params);

  await connect();

  const { sessionId } = params;
  const player = await Player.findOne({ sessionId }).orFail();

  player.contextFacts = [];

  await player.save();
  return { ok: true };
}, null, 'clearContextFacts');