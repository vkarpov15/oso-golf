'use strict';

const Archetype = require('archetype');
const Log = require('../../db/log');
const Player = require('../../db/player');
const assert = require('assert');
const connect = require('../../db/connect');
const extrovert = require('extrovert');
const { inspect } = require('util');

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
  actorType: {
    $type: 'string',
    $required: true,
    $default: 'User'
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
  await connect();

  await Log.info(`Tell ${inspect(params)}`, { ...params, function: 'tell' });

  try {
    const { sessionId } = params;

    const player = await Player.findOne({ sessionId }).orFail();

    if (params.factType === 'role') {
      if (params.role === 'superadmin') {
        player.contextFacts.push([
          'has_role',
          { type: params.actorType, id: params.userId },
          params.role
        ]);
      } else {
        player.contextFacts.push([
          'has_role',
          { type: params.actorType, id: params.userId },
          params.role,
          { type: params.resourceType, id: params.resourceId }
        ]);
      }
    } else if (params.attribute === 'has_default_role') {
      player.contextFacts.push([
        params.attribute,
        { type: params.resourceType, id: params.resourceId },
        params.attributeValue
      ]);
    } else if (params.attribute === 'has_group') {
      player.contextFacts.push([
        params.attribute,
        { type: params.resourceType, id: params.resourceId },
        { type: 'Group', id: params.attributeValue }
      ]);
    } else {
      player.contextFacts.push([
        params.attribute,
        { type: params.resourceType, id: params.resourceId },
        { type: 'Boolean', id: params.attributeValue }
      ]);
    }

    await player.save();

    return { ok: true };
  } catch (err) {
    await Log.error(`tell: ${err.message}`, {
      ...params,
      function: 'tell',
      message: err.message,
      stack: err.stack,
      err: inspect(err)
    });

    throw err;
  }
}, null, 'tell');