'use strict';

const Archetype = require('archetype');
const assert = require('assert');
const extrovert = require('extrovert');
const oso = require('../../oso');

const DeleteFactParams = new Archetype({
  sessionId: {
    $type: 'string',
    $required: true
  },
  factType: {
    $type: 'string',
    $required: true,
    $enum: ['role', 'attribute']
  },
  userId: {
    $type: 'string',
    $validate: (v, type, doc) => assert.ok(v != null || doc.factType !== 'role')
  },
  role: {
    $type: 'string',
    $validate: (v, type, doc) => assert.ok(v != null || doc.factType !== 'role')
  },
  resourceType: {
    $type: 'string',
    $required: true
  },
  resourceId: {
    $type: 'string',
    $required: true
  },
  attribute: {
    $type: 'string',
    $validate: (v, type, doc) => assert.ok(v != null || doc.factType !== 'attribute')
  },
  attributeValue: {
    $type: 'boolean',
    $validate: (v, type, doc) => assert.ok(v != null || doc.factType !== 'attribute')
  }
}).compile('DeleteFactParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  params = new DeleteFactParams(params);
  if (params.factType === 'role') {
    const resourceId = params.resourceType === 'Repository' ? `${params.sessionId}_${params.resourceId}` : params.resourceId;
    await oso.delete(
      'has_role',
      { type: 'User', id: `${params.sessionId}_${params.userId}` },
      params.role,
      { type: params.resourceType, id: resourceId }
    );
  } else {
    await oso.delete(
      params.attribute,
      { type: 'Repository', id: `${params.sessionId}_${params.resourceId}` },
      { type: 'Boolean', id: !!params.attributeValue + '' }
    );
  }
  return { ok: true };
}, null, 'deleteFact');