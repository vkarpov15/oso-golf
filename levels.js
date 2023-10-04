'use strict';

const level1 = {
  constraints: [
    { userId: 'John', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'John', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client', shouldFail: true },
    { userId: 'John', action: 'write', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
    { userId: 'Jane', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Jane', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
    { userId: 'Jane', action: 'delete', resourceType: 'Repository', resourceId: 'osohq/configs' }
  ],
  par: 2
};

const level2 = {
  constraints: [
    { userId: 'Bill', action: 'read', resourceType: 'Repository', resourceId: 'osohq/configs' },
    { userId: 'Bill', action: 'read', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Bill', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
    { userId: 'Bill', action: 'delete', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
    { userId: 'Larry', action: 'read', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Larry', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
    { userId: 'Larry', action: 'read', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
    { userId: 'Steve', action: 'read', resourceType: 'Repository', resourceId: 'osohq/sample-apps' }
  ],
  par: 4
};

module.exports = [level1, level2];