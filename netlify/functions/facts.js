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
  for (const userId of params.userId) {
    const factsForUser = await oso.get(
      'has_role',
      { type: 'User', id: `${params.sessionId}_${userId}` },
      null,
      null
    );
    facts.push(...factsForUser);
  }
  for (const repo of ['osohq/sample-apps', 'osohq/nodejs-client', 'osohq/configs']) {
    let factsForRepo = await oso.get(
      'is_protected',
      { type: 'Repository', id: `${params.sessionId}_${repo}` },
      null,
      null
    );
    facts.push(...factsForRepo);

    factsForRepo = await oso.get(
      'is_public',
      { type: 'Repository', id: `${params.sessionId}_${repo}` },
      null,
      null
    );
    facts.push(...factsForRepo);
  }

  facts.push(...player.contextFacts);
  
  return { facts };
}, null, 'facts');