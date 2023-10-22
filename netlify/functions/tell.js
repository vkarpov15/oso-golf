'use strict';

const Archetype = require('archetype');
const Player = require('../../db/player');
const assert = require('assert');
const connect = require('../../db/connect');
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
    $type: 'string',
    $validate: (v, type, doc) => assert.ok(v != null || doc.factType !== 'attribute')
  }
}).compile('TellParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  params = new TellParams(params);
  assert.ok(
    params.attribute == null || ['is_public', 'is_protected', 'has_default_role'].includes(params.attribute),
    'Invalid attribute'
  );
  await connect();

  const { sessionId } = params;

  const player = await Player.findOne({ sessionId }).orFail();

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
  } else if (params.attribute === 'has_default_role') {
    player.contextFacts.push([
      'has_default_role',
      { type: params.resourceType, id: params.resourceId },
      params.attributeValue
    ]);
    await player.save();
  } else {
    const attributeType = params.attributeValue === 'true' || params.attributeValue === 'false' ? 'Boolean' : 'String';
    await oso.tell(
      params.attribute,
      { type: params.resourceType, id: `${params.sessionId}_${params.resourceId}` },
      { type: attributeType, id: params.attributeValue }
    );
  }

  return { ok: true };
}, null, 'tell');