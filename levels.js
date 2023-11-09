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
  allowedRoles: ['admin', 'member'],
  organizations: ['osohq'],
  repositories: [],
  description: dedent(`
  The basic logic of RBAC is: "a user has a permission if they are granted a role and the role grants that permission".
  Add roles to users to satisfy the below constraints.
  `)
};

const level2 = {
  constraints: [
    { userId: 'Bob', action: 'read', resourceType: 'Organization', resourceId: 'osohq' },
    { userId: 'Bob', action: 'add_member', resourceType: 'Organization', resourceId: 'osohq' },
    { userId: 'Bill', action: 'read', resourceType: 'Organization', resourceId: 'osohq' },
    { userId: 'Bill', action: 'add_member', resourceType: 'Organization', resourceId: 'osohq', shouldFail: true }
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
  allowedRoles: ['admin', 'member'],
  organizations: ['osohq'],
  repositories: [],
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
    roles = ["reader", "admin", "editor"];
    relations = { organization: Organization };

    "reader" if "member" on "organization";
    "admin" if "admin" on "organization";
    "editor" if "admin";
    "reader" if "editor";

    # reader permissions
    "read" if "reader";

    # editor permissions
    "write" if "editor";
  }
  `),
  showAddRoleFact: true,
  showAddAttributeFact: false,
  allowedRoles: ['admin', 'member', 'reader', 'editor'],
  organizations: ['osohq'],
  repositories: ['osohq/sample-apps', 'osohq/nodejs-client'],
  description: dedent(`
  Now let's add in a new resource type: repositories.
  Every repository belongs to an organization, and users can derive permissions from roles on a Repository or an Organization.
  `)
};

const level4 = {
  constraints: [
    { userId: 'Desmond', action: 'add_member', resourceType: 'Organization', resourceId: 'osohq' },
    { userId: 'Desmond', action: 'add_member', resourceType: 'Organization', resourceId: 'acme' },
    { userId: 'Daisy', action: 'add_member', resourceType: 'Organization', resourceId: 'osohq' },
    { userId: 'Daisy', action: 'add_member', resourceType: 'Organization', resourceId: 'acme', shouldFail: true },
    { userId: 'Dean', action: 'add_member', resourceType: 'Organization', resourceId: 'osohq', shouldFail: true },
    { userId: 'Dean', action: 'add_member', resourceType: 'Organization', resourceId: 'acme' }
  ],
  par: 4,
  polarCode: dedent(`
  actor User { }

  global {
    roles = ["superadmin"];
  }

  resource Organization { 
      roles = ["admin", "member"];
      permissions = ["read", "add_member"];

      # role hierarchy:
      # admins inherit all member permissions
      "member" if "admin";

      "admin" if global "superadmin";

      # org-level permissions
      "read" if "member";
      "add_member" if "admin";
  }
  `),
  showAddRoleFact: true,
  showAddAttributeFact: false,
  organizations: ['osohq', 'acme'],
  repositories: [],
  description: dedent(`
  You can also have global roles that can apply to all resources.
  In this hole, take advantage of the superadmin role
  `)
};

const level5 = {
  constraints: [
    { userId: 'Elaine', action: 'read', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Elaine', action: 'read', resourceType: 'Repository', resourceId: 'osohq/configs' },
    { userId: 'Emma', action: 'read', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Emma', action: 'read', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
    { userId: 'Ellis', action: 'read', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Ellis', action: 'read', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true }
  ],
  par: 4,
  polarCode: dedent(`
  actor User { }

  resource Organization { 
      roles = ["admin", "member"];
  }

  resource Repository { 
    permissions = [
        "read", "write", "delete"
    ];
    roles = ["reader", "admin", "editor"];
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

  has_permission(_: Actor, "read", repo: Repository) if
    is_public(repo, true);
  `),
  showAddRoleFact: true,
  showAddAttributeFact: true,
  allowedRoles: ['admin', 'member', 'reader', 'editor'],
  organizations: ['osohq'],
  repositories: ['osohq/sample-apps', 'osohq/nodejs-client', 'osohq/configs'],
  description: dedent(`
  Roles aren't the only type of fact you can add in Oso Cloud.
  You can also add attributes to resources.
  For this hole, use the is_public fact.
  `)
};

const level6 = {
  constraints: [
    { userId: 'Francesca', action: 'delete', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Francesca', action: 'delete', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
    { userId: 'Francesca', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
    { userId: 'Finn', action: 'read', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
    { userId: 'Felix', action: 'delete', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Felix', action: 'delete', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true }
  ],
  par: 5,
  polarCode: dedent(`
  actor User { }

  resource Organization { 
      roles = ["admin", "member"];
  }

  resource Repository { 
    permissions = [
        "read", "write", "delete"
    ];
    roles = ["reader", "admin", "editor"];
    relations = { organization: Organization };

    "reader" if "member" on "organization";
    "admin" if "admin" on "organization";
    "reader" if "editor";
    "editor" if "admin";

    # reader permissions
    "read" if "reader";

    # editor permissions
    "write" if "editor";
  }

  has_permission(_: Actor, "read", repo: Repository) if
    is_public(repo, true);

  has_permission(actor: Actor, "delete", repo: Repository) if
    has_role(actor, "admin", repo) and
    is_protected(repo, false);
  `),
  showAddRoleFact: true,
  showAddAttributeFact: true,
  allowedRoles: ['admin', 'member', 'reader', 'editor'],
  organizations: ['osohq'],
  repositories: ['osohq/sample-apps', 'osohq/nodejs-client', 'osohq/configs'],
  description: dedent(`
  A repo can only be deleted if it is not "protected"
  `)
};

const level7 = {
  constraints: [
    { userId: 'Gary', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Gary', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
    { userId: 'Gary', action: 'delete', resourceType: 'Repository', resourceId: 'osohq/nodejs-client', shouldFail: true },
    { userId: 'Gabriella', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Gabriella', action: 'add_member', resourceType: 'Organization', resourceId: 'osohq', shouldFail: true },
    { userId: 'George', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
    { userId: 'George', action: 'add_member', resourceType: 'Organization', resourceId: 'osohq', shouldFail: true }
  ],
  par: 5,
  polarCode: dedent(`
  actor User { }

  resource Organization { 
      roles = ["admin", "member"];
  }

  resource Repository { 
    permissions = [
        "read", "write", "delete"
    ];
    roles = ["reader", "admin", "editor"];
    relations = { organization: Organization };

    "reader" if "member" on "organization";
    "admin" if "admin" on "organization";
    "reader" if "editor";
    "editor" if "admin";

    # reader permissions
    "read" if "reader";

    # editor permissions
    "write" if "editor";
  }

  has_permission(_: Actor, "read", repo: Repository) if
    is_public(repo, true);

  has_permission(actor: Actor, "delete", repo: Repository) if
    has_role(actor, "admin", repo) and
    is_protected(repo, false);

  has_role(actor: Actor, role: String, repo: Repository) if
    org matches Organization and
    has_relation(repo, "organization", org) and
    has_default_role(org, role) and
    has_role(actor, "member", org);
  `),
  showAddRoleFact: true,
  showAddAttributeFact: true,
  allowedRoles: ['admin', 'member', 'reader', 'editor'],
  organizations: ['osohq'],
  repositories: ['osohq/sample-apps', 'osohq/nodejs-client', 'osohq/configs'],
  description: dedent(`
  Make use of has_default_role to add a default role to all members of an Organization.
  `)
};

const level8 = {
  constraints: [
    { userId: 'Henry', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Henry', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
    { userId: 'Henry', action: 'write', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
    { userId: 'Heather', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Heather', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
    { userId: 'Heather', action: 'write', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
    { userId: 'Holly', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Holly', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
    { userId: 'Holly', action: 'write', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true }
  ],
  par: 6,
  polarCode: dedent(`
  actor User { }

  # A group is a kind of actor
  actor Group { }

  resource Organization { 
      roles = ["admin", "member"];
  }

  resource Repository { 
    permissions = [
        "read", "write", "delete"
    ];
    roles = ["reader", "admin", "editor"];
    relations = { organization: Organization };

    "reader" if "member" on "organization";
    "admin" if "admin" on "organization";
    "reader" if "editor";
    "editor" if "admin";

    # reader permissions
    "read" if "reader";

    # editor permissions
    "write" if "editor";
  }

  has_permission(_: Actor, "read", repo: Repository) if
    is_public(repo, true);

  has_role(user: User, role: String, resource: Resource) if
    group matches Group and
    has_group(user, group) and
    has_role(group, role, resource);
  `),
  showAddRoleFact: true,
  showAddAttributeFact: true,
  allowedRoles: ['admin', 'member', 'reader', 'editor'],
  organizations: ['osohq'],
  groups: ['superstars'],
  repositories: ['osohq/sample-apps', 'osohq/nodejs-client', 'osohq/configs'],
  description: dedent(`
  Users can also belong to groups, which can have multiple roles. Group membership is just an attribute. Add some users and roles to the "superstars" group to complete this hole. "has_group" is just an attribute on users.
  `)
};

const level9 = {
  constraints: [
    { userId: 'Isabel', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Isabel', action: 'read', resourceType: 'Repository', resourceId: 'acme/website' },
    { userId: 'Isabel', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client', shouldFail: true },
    { userId: 'Ian', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Ian', action: 'read', resourceType: 'Repository', resourceId: 'acme/website' },
    { userId: 'Ian', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client', shouldFail: true },
    { userId: 'Ingrid', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
    { userId: 'Ingrid', action: 'read', resourceType: 'Repository', resourceId: 'acme/website' },
    { userId: 'Ingrid', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client', shouldFail: true },
    { userId: 'Idris', action: 'read', resourceType: 'Repository', resourceId: 'acme/website', shouldFail: true },
    { userId: 'Idris', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' }
  ],
  par: 8,
  polarCode: dedent(`
  actor User { }

  # A group is a kind of actor
  actor Group { }

  global {
    roles = ["superadmin"];
  }

  resource Organization { 
      roles = ["admin", "member"];
      permissions = ["read", "add_member"];

      # role hierarchy:
      # admins inherit all member permissions
      "member" if "admin";

      "admin" if global "superadmin";

      # org-level permissions
      "read" if "member";
      "add_member" if "admin";
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

  has_permission(_: Actor, "read", repo: Repository) if
      is_public(repo, true);


  has_permission(actor: Actor, "delete", repo: Repository) if
      has_role(actor, "admin", repo) and
      is_protected(repo, false);

  has_role(actor: Actor, role: String, repo: Repository) if
    org matches Organization and
    has_relation(repo, "organization", org) and
    has_default_role(org, role) and
    has_role(actor, "member", org);

  has_role(user: User, role: String, resource: Resource) if
    group matches Group and
    has_group(user, group) and
    has_role(group, role, resource);
  `),
  showAddRoleFact: true,
  showAddAttributeFact: true,
  allowedRoles: ['admin', 'member', 'reader', 'editor'],
  organizations: ['osohq', 'acme'],
  groups: ['superstars'],
  repositories: ['osohq/sample-apps', 'osohq/nodejs-client', 'osohq/configs', 'acme/website'],
  description: dedent(`
  Tie it all together to solve this tricky one :)
  `)
};

module.exports = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
  level9
];