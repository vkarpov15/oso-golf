'use strict';

const Archetype = require('archetype');
const Log = require('../../db/log'); 
const Player = require('../../db/player');
const connect = require('../../db/connect');
const extrovert = require('extrovert');
const { inspect } = require('util');

const ResumeGameParams = new Archetype({
  sessionId: {
    $type: 'string',
    $required: true
  }
}).compile('ResumeGameParams');

module.exports = extrovert.toNetlifyFunction(async params => {
  const { sessionId } = new ResumeGameParams(params);

  await connect();

  await Log.info(`resumeGame ${inspect(params)}`, {
    ...params,
    function: 'resumeGame'
  });
  
  try {
    const player = await Player.findOne({
      sessionId
    });

    return { player };
  } catch (err) {
    await Log.error(`resumeGame: ${err.message}`, {
      ...params,
      function: 'resumeGame',
      message: err.message,
      stack: err.stack,
      err: inspect(err)
    });

    throw err;
  }
}, null, 'resumeGame');