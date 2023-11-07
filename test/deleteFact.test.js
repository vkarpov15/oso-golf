'use strict';

const Player = require('../db/player');
const assert = require('assert');
const mongoose = require('mongoose');
const connect = require('../db/connect');
const { deleteFact } = require('../netlify/functions/deleteFact');

describe('deleteFact', function() {
  before(async function() {
    await connect();
  });

  after(async function() {
    await mongoose.disconnect();
  });

  it('deletes group role facts', async function() {
    let player = await Player.create({
      sessionId: '111',
      email: 'test@osohq.com',
      contextFacts: [
        [
          'has_role',
          { type: 'Group', id: 'superstars' },
          'editor',
          { type: 'Repository', id: 'osohq/sample-apps' }
        ],
        [
          'has_role',
          { type: 'User', id: 'Idris' },
          'editor',
          { type: 'Repository', id: 'acme/website' }
        ]
      ]      
    });

    await deleteFact({
      sessionId: '111',
      factType: 'role',
      actorType: 'Group',
      userId: 'superstars',
      role: 'editor',
      resourceType: 'Repository',
      resourceId: 'osohq/sample-apps'
    });

    player = await Player.findById(player._id).orFail();
    assert.deepStrictEqual(player.toObject().contextFacts, [
      [
        'has_role',
        { type: 'User', id: 'Idris' },
        'editor',
        { type: 'Repository', id: 'acme/website' }
      ]
    ]);
  });
});