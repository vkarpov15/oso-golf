'use strict';

const Archetype = require('archetype');
const Player = require('../../db/player');
const assert = require('assert');
const connect = require('../../db/connect');
const extrovert = require('extrovert');
const oso = require('../../oso');

const VerifySolutionForLevelParams = new Archetype({
  sessionId: {
    $type: 'string',
    $required: true
  },
  level: {
    $type: 'number',
    $required: true,
    $validate: v => assert.ok(v > 0 && v < 2)
  }
}).compile('VerifySolutionForLevelParams');

const constraintsByLevel = require('../../levels').map(level => level.constraints);

const parByLevel = require('../../levels').map(level => level.par);

module.exports = extrovert.toNetlifyFunction(async params => {
  const { sessionId, level } = new VerifySolutionForLevelParams(params);

  await connect();
  
  const player = await Player.findOne({ sessionId }).orFail();

  const constraints = constraintsByLevel[level - 1];
  let pass = true;
  for (const constraint of constraints) {
    const authorized = await oso.authorize(
      { type: 'User', id: `${sessionId}_${constraint.userId}` },
      constraint.action,
      { type: constraint.resourceType, id: constraint.resourceId }
    );
    if (authorized !== !constraint.shouldFail) {
      pass = false;
    }
  }
  if (!pass) {
    throw new Error('Did not pass');
  }

  const userIds = new Set(constraints.map(constraint => constraint.userId));
  const facts = [];
  for (const userId of userIds) {
    const factsForUser = await oso.get(
      'has_role',
      { type: 'User', id: `${sessionId}_${userId}` },
      null,
      null
    );
    facts.push(...factsForUser);
  }

  player.levelsCompleted = player.levelsCompleted + 1;
  player.parPerLevel[level - 1] = facts.length - parByLevel[level - 1];
  player.par = player.parPerLevel.reduce((sum, v) => sum + v);
  player.gameplayTimeMS = Date.now() - player.startTime.valueOf();
  await player.save();
  
  return { player };
}, null, 'verifySolutionForLevel');