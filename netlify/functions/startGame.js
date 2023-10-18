'use strict';

const Archetype = require('archetype');
const Player = require('../../db/player');
const connect = require('../../db/connect');
const extrovert = require('extrovert');
const oso = require('../../oso');

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

  await oso.tell(
    'has_relation',
    { type: 'Repository', id: `${params.sessionId}_osohq/configs` },
    'organization',
    { type: 'Organization', id: 'osohq' }
  );

  await oso.tell(
    'has_relation',
    { type: 'Repository', id: `${params.sessionId}_osohq/sample-apps` },
    'organization',
    { type: 'Organization', id: 'osohq' }
  );

  await oso.tell(
    'has_relation',
    { type: 'Repository', id: `${params.sessionId}_osohq/nodejs-client` },
    'organization',
    { type: 'Organization', id: 'osohq' }
  );
  
  return { player };
}, null, 'startGame');