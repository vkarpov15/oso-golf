'use strict';

const extrovert = require('extrovert');
const oso = require('../../oso');

module.exports = extrovert.toNetlifyFunction(async params => {
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