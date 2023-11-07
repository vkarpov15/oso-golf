'use strict';

const Archetype = require('archetype');
const Player = require('../../db/player');
const assert = require('assert');
const connect = require('../../db/connect');
const extrovert = require('extrovert');

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
  },
  actorType: {
    $type: 'string'
  }
}).compile('DeleteFactParams');

module.exports = extrovert.toNetlifyFunction(deleteFact, null, 'deleteFact');
module.exports.deleteFact = deleteFact;

async function deleteFact(params) {
  params = new DeleteFactParams(params);

  await connect();

  const { sessionId } = params;
  const player = await Player.findOne({ sessionId }).orFail();

  if (params.factType === 'role') {
    if (params.role === 'superadmin') {
      player.contextFacts = player.contextFacts.filter(fact => {
        return fact[0] !== 'has_role' ||
          fact[1].type !== 'User' ||
          fact[1].id !== params.userId ||
          fact[2] !== params.role;
      });
    } else {
      player.contextFacts = player.contextFacts.filter(fact => {
        return fact[0] !== 'has_role' ||
          fact[1].type !== (params.actorType ?? 'User') ||
          fact[1].id !== params.userId ||
          fact[2] !== params.role ||
          fact[3]?.type !== params.resourceType ||
          fact[3]?.id !== params.resourceId;
      });
    }
    
  } else if (params.attribute === 'has_default_role') {
    player.contextFacts = player.contextFacts.filter(fact => {
      return fact[0] !== 'has_default_role' ||
        fact[1].type !== params.resourceType ||
        fact[1].id !== params.resourceId ||
        fact[2] !== params.attributeValue;
    });
  } else {
    player.contextFacts = player.contextFacts.filter(fact => {
      return fact[0] !== params.attribute ||
        fact[1].type !== params.resourceType ||
        fact[1].id !== params.resourceId ||
        fact[2].id !== params.attributeValue;
    });
  }
  await player.save();
  return { ok: true, player };
}