'use strict';

const Player = require('../../db/player');
const connect = require('../../db/connect');
const extrovert = require('extrovert');

module.exports = extrovert.toNetlifyFunction(async() => {
  await connect();
  
  const players = await Player
    .find({ levelsCompleted: { $gt: 0 } })
    .select({ email: 0 })
    .sort({
      levelsCompleted: -1,
      par: 1,
      gameplayTimeMS: 1
    });
  
  return { players };
}, null, 'leaderboard');