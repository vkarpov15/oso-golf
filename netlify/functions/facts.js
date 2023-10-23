'use strict';

const Archetype = require('archetype');
const connect = require('../../db/connect');
const extrovert = require('extrovert');
const oso = require('../../oso');
const Player = require('../../db/player');

const FactsParams = new Archetype({
  sessionId: {
    $type: 'string',
    $required: true
  },
  userId: {
    $type: ['string'],
    $required: true
  }
}).compile('FactsParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  params = new FactsParams(params);

  await connect();
  const { sessionId } = params;
  const player = await Player.findOne({ sessionId }).orFail();

  const facts = [];
  facts.push(...player.contextFacts);
  
  return { facts };
}, null, 'facts');