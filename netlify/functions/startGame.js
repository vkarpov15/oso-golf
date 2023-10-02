'use strict';

const Archetype = require('archetype');
const Player = require('../../db/player');
const connect = require('../../db/connect');
const extrovert = require('extrovert');

const StartGameParams = new Archetype({
  sessionId: {
    $type: 'string',
    $required: true
  },
  name: {
    $type: 'string',
    $required: true
  },
  email: {
    $type: 'string',
    $required: true
  }
}).compile('StartGameParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  const { sessionId, name, email } = new StartGameParams(params);

  await connect();
  
  const player = await Player.create({
    sessionId,
    name,
    email
  });
  
  return { player };
}, null, 'startGame');