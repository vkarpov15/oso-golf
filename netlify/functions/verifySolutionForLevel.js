'use strict';

const Archetype = require('archetype');
const Log = require('../../db/log'); 
const Player = require('../../db/player');
const assert = require('assert');
const connect = require('../../db/connect');
const extrovert = require('extrovert');
const { inspect } = require('util');
const levels = require('../../levels');
const oso = require('../../oso');

const VerifySolutionForLevelParams = new Archetype({
  sessionId: {
    $type: 'string',
    $required: true
  },
  level: {
    $type: 'number',
    $required: true,
    $validate: v => assert.ok(v > 0 && v <= levels.length)
  }
}).compile('VerifySolutionForLevelParams');

const constraintsByLevel = require('../../levels').map(level => level.constraints);

const parByLevel = require('../../levels').map(level => level.par);

module.exports = extrovert.toNetlifyFunction(async params => {
  const { sessionId, level } = new VerifySolutionForLevelParams(params);

  await connect();
  
  await Log.info(`Verify solution ${level} ${inspect(params)}`, { ...params, function: 'verifySolutionForLevel' });

  try {
    const player = await Player.findOne({ sessionId }).orFail();

    const constraints = constraintsByLevel[level - 1];
    let pass = true;
    for (const constraint of constraints) {
      const authorized = await oso.authorize(
        { type: 'User', id: constraint.userId },
        constraint.action,
        { type: constraint.resourceType, id: constraint.resourceId },
        player.contextFacts
      );
      if (authorized !== !constraint.shouldFail) {
        pass = false;
      }
    }
    if (!pass) {
      throw new Error('Did not pass');
    }

    player.levelsCompleted = player.levelsCompleted + 1;
    player.parPerLevel[level - 1] = player.contextFacts.length - parByLevel[level - 1];
    player.par = player.parPerLevel.reduce((sum, v) => sum + v);
    player.gameplayTimeMS = Date.now() - player.startTime.valueOf();
    await player.save();
    
    return { player };
  } catch (err) {
    await Log.error(`verifySolutionForLevel: ${err.message}`, {
      ...params,
      function: 'verifySolutionForLevel',
      message: err.message,
      stack: err.stack,
      err: inspect(err)
    });

    throw err;
  }
}, null, 'verifySolutionForLevel');