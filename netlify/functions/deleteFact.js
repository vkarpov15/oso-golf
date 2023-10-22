'use strict';

const Archetype = require('archetype');
const Player = require('../../db/player');
const assert = require('assert');
const connect = require('../../db/connect');
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
    $required: (v, type, doc) => assert.ok(v != null || doc.role !== 'superadmin')
  },
  resourceId: {
    $type: 'string',
    $required: (v, type, doc) => assert.ok(v != null || doc.role !== 'superadmin')
  },
  attribute: {
    $type: 'string',
    $validate: (v, type, doc) => assert.ok(v != null || doc.factType !== 'attribute')
  },
  attributeValue: {
    $type: 'string',
    $validate: (v, type, doc) => assert.ok(v != null || doc.factType !== 'attribute')
  }
}).compile('DeleteFactParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  params = new DeleteFactParams(params);

  await connect();

  if (params.factType === 'role') {
    const resourceId = params.resourceType === 'Repository' ? `${params.sessionId}_${params.resourceId}` : params.resourceId;
    if (params.role === 'superadmin') {
      await oso.delete(
        'has_role',
        { type: 'User', id: `${params.sessionId}_${params.userId}` },
        params.role
      );
    } else {
      await oso.delete(
        'has_role',
        { type: 'User', id: `${params.sessionId}_${params.userId}` },
        params.role,
        { type: params.resourceType, id: resourceId }
      );
    }
    
  } else if (params.attribute === 'has_default_role') {
    const { sessionId } = params;
    const player = await Player.findOne({ sessionId }).orFail();

    player.contextFacts = player.contextFacts.filter(fact => {
      return fact[0] !== 'has_default_role' ||
        fact[1].type !== params.resourceType ||
        fact[1].id !== params.resourceId ||
        fact[2] !== params.attributeValue;
    });
    await player.save();
  } else {
    await oso.delete(
      params.attribute,
      { type: 'Repository', id: `${params.sessionId}_${params.resourceId}` },
      { type: 'Boolean', id: params.attributeValue }
    );
  }
  return { ok: true };
}, null, 'deleteFact');