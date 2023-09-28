'use strict';

const extrovert = require('extrovert');
const oso = require('../../oso');

module.exports = extrovert.toNetlifyFunction(async params => {
  const authorized = await oso.authorize(
    { type: 'User', id: `${params.sessionId}_${params.userId}` },
    params.action,
    { type: params.resourceType, id: params.resourceId }
  );
  return { authorized };
}, null, 'authorize');