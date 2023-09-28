'use strict';

const extrovert = require('extrovert');
const oso = require('../../oso');

module.exports = extrovert.toNetlifyFunction(async params => {
  await oso.delete(
    'has_role',
    { type: 'User', id: `${params.sessionId}_${params.userId}` },
    params.role,
    { type: params.resourceType, id: params.resourceId }
  );
  return { ok: true };
}, null, 'deleteFact');