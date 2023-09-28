'use strict';

const Archetype = require('archetype');
const extrovert = require('extrovert');
const oso = require('../../oso');

const DeleteFactParams = new Archetype({
  sessionId: {
    $type: 'string',
    $required: true
  },
  userId: {
    $type: 'string',
    $required: true
  },
  role: {
    $type: 'string',
    $required: true
  },
  resourceType: {
    $type: 'string',
    $required: true
  },
  resourceId: {
    $type: 'string',
    $required: true
  }
}).compile('DeleteFactParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  params = new DeleteFactParams(params);
  await oso.delete(
    'has_role',
    { type: 'User', id: `${params.sessionId}_${params.userId}` },
    params.role,
    { type: params.resourceType, id: params.resourceId }
  );
  return { ok: true };
}, null, 'deleteFact');