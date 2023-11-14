'use strict';

const Archetype = require('archetype');
const Log = require('../../db/log'); 
const Player = require('../../db/player');
const connect = require('../../db/connect');
const extrovert = require('extrovert');
const { inspect } = require('util');
const oso = require('../../oso');

const AuthorizeParams = new Archetype({
  sessionId: {
    $type: 'string',
    $required: true
  },
  userId: {
    $type: 'string',
    $required: true
  },
  action: {
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
}).compile('AuthorizeParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  params = new AuthorizeParams(params);
  const { sessionId } = params;

  await connect();

  await Log.info(`authorize ${inspect(params)}`, {
    ...params,
    function: 'authorize'
  });

  try {
    const player = await Player.findOne({ sessionId }).orFail();

    console.log('Authorize', params, player.contextFacts);

    const authorized = await oso.authorize(
      { type: 'User', id: params.userId },
      params.action,
      { type: params.resourceType, id: params.resourceId },
      player.contextFacts
    );
    return { authorized };
  } catch (err) {
    await Log.error(`authorize: ${err.message}`, {
      ...params,
      function: 'authorize',
      message: err.message,
      stack: err.stack,
      err: inspect(err)
    });

    throw err;
  }
}, null, 'authorize');