'use strict';

const dedent = require('dedent');

const level1 = {
  constraints: [
    { userId: 'Alice', action: 'read', resourceType: 'Organization', resourceId: 'osohq' },
    { userId: 'Anthony', action: 'add_member', resourceType: 'Organization', resourceId: 'osohq' }
  ],
  par: 2,
  polarCode: dedent(`
  actor User { }

  resource Organization { 
      roles = ["admin", "member"];
      permissions = ["read", "add_member"];

      # role hierarchy:
      # admins inherit all member permissions
      "member" if "admin";

      # org-level permissions
      "read" if "member";
      "add_member" if "admin";
  }
  `),
  showAddRoleFact: true,
  showAddAttributeFact: false,
  description: dedent(`
  The basic logic of RBAC is: "a user has a permission if they are granted a role and the role grants that permission".
  Add roles to users to satisfy the below constraints.
  `)
};

const level2 = {
  constraints: [
    { userId: 'Bob', action: 'read', resourceType: 'Organization', resourceId: 'osohq' },
    { userId: 'Bob', action: 'add_member', resourceType: 'Organization', resourceId: 'osohq' },
    { userId: 'Bill', action: 'read', resourceType: 'Organization', resourceId: 'osohq' }
  ],
  par: 2,
  polarCode: dedent(`
  actor User { }

  resource Organization { 
      roles = ["admin", "member"];
      permissions = ["read", "add_member"];

      # role hierarchy:
      # admins inherit all member permissions
      "member" if "admin";

      # org-level permissions
      "read" if "member";
      "add_member" if "admin";
  }
  `),
  showAddRoleFact: true,
  showAddAttributeFact: false,
  description: dedent(`
  For this hole, remember that admins inherit all member permissions!
  `)
};

const level3 = {
  constraints: [
    { userId: 'Charlie', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Charlie', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client', shouldFail: true },
    { userId: 'Cameron', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Cameron', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' }
  ],
  par: 3,
  polarCode: dedent(`
  actor User { }

  resource Organization { 
      roles = ["admin", "member"];
  }

  resource Repository { 
    permissions = [
        "read", "write", "delete"
    ];
    roles = ["reader", "admin", "maintainer", "editor"];
    relations = { organization: Organization };

    "reader" if "member" on "organization";
    "admin" if "admin" on "organization";
    "reader" if "editor";
    "editor" if "maintainer";
    "maintainer" if "admin";

    # reader permissions
    "read" if "reader";

    # editor permissions
    "write" if "editor";
  }
  `),
  showAddRoleFact: true,
  showAddAttributeFact: false,
  description: dedent(`
  Now let's add in a new resource type: repositories.
  Every repository belongs to an organization, and users can derive permissions from roles on a Repository or an Organization.
  `)
};

module.exports = [level1, level2, level3];