'use strict';

const Archetype = require('archetype');
const extrovert = require('extrovert');
const oso = require('../../oso');

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
  
  return { facts };
}, null, 'facts');