'use strict';

const Player = require('../../db/player');
const connect = require('../../db/connect');
const extrovert = require('extrovert');

module.exports = extrovert.toNetlifyFunction(async() => {
  await connect();
  
  const playersFromDb = await Player
    .find({ levelsCompleted: { $gt: 0 } })
    .select()
    .sort({
      levelsCompleted: -1,
      par: 1,
      gameplayTimeMS: 1
    });

  const playersByEmail = new Map();
  for (const player of playersFromDb) {
    if (playersByEmail.has(player.email)) {
      const existing = playersByEmail.get(player.email);
      if (existing.startTime.valueOf() > player.startTime.valueOf()) {
        playersByEmail.delete(player.email);
        playersByEmail.set(player.email, player);
      }
    } else {
      playersByEmail.set(player.email, player);
    }
  }
  
  const players = [...playersByEmail.values()].map(p => { delete p.email; return p; });
  return { players };
}, null, 'leaderboard');