'use strict';

const Archetype = require('archetype');
const assert = require('assert');
const extrovert = require('extrovert');
const oso = require('../../oso');

const TellParams = new Archetype({
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
    $required: (doc) => doc.role !== 'superadmin'
  },
  resourceId: {
    $type: 'string',
    $required: (doc) => doc.role !== 'superadmin'
  },
  attribute: {
    $type: 'string',
    $validate: (v, type, doc) => assert.ok(v != null || doc.factType !== 'attribute')
  },
  attributeValue: {
    $type: 'boolean',
    $validate: (v, type, doc) => assert.ok(v != null || doc.factType !== 'attribute')
  }
}).compile('TellParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  params = new TellParams(params);
  assert.ok(
    params.attribute == null || ['is_public', 'is_protected'].includes(params.attribute),
    'Invalid attribute'
  );

  if (params.factType === 'role') {
    const resourceId = params.resourceType === 'Repository' ? `${params.sessionId}_${params.resourceId}` : params.resourceId;
    
    if (params.role === 'superadmin') {
      await oso.tell(
        'has_role',
        { type: 'User', id: `${params.sessionId}_${params.userId}` },
        params.role
      );
    } else {
      await oso.tell(
        'has_role',
        { type: 'User', id: `${params.sessionId}_${params.userId}` },
        params.role,
        { type: params.resourceType, id: resourceId }
      );
    }
  } else {
    await oso.tell(
      params.attribute,
      { type: 'Repository', id: `${params.sessionId}_${params.resourceId}` },
      { type: 'Boolean', id: !!params.attributeValue + '' }
    );
  }

  return { ok: true };
}, null, 'tell');