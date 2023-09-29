'use strict';

const axios = require('axios');
const template = require('./app-component.html')
const vanillatoasts = require('vanillatoasts');

const polarCode = `
actor User { }

resource Organization { 
    permissions = [
        "read",
        "read_details",
        "view_members",
        "manage_members",
        "set_default_role",
        "create_repositories",
        "delete"
    ];
    roles = ["admin", "member"];

    "read_details" if "member";
    "view_members" if "member";
    "create_repositories" if "member";

    "member" if "admin";
    "manage_members" if "admin";
    "set_default_role" if "admin";
    "delete" if "admin";
}

resource Repository { 
    permissions = [
        "read", "create", "update", "delete",
        "invite", "write",
        "manage_jobs", "manage_issues", "create_issues",
        "view_members", "manage_members"
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
    "create_issues" if "reader";

    # editor permissions
    "write" if "editor";
    "manage_jobs" if "editor";
    "manage_issues" if "editor";
    "view_members" if "maintainer";

    # admin permissions
    "manage_members" if "admin";
    "update" if "admin";
    "delete" if "admin";
    "invite" if "admin" ;
}

resource Issue { 
    permissions = ["read", "comment", "close"];
    roles = ["reader", "admin", "creator"];
    relations = { repository: Repository };

    "reader" if "reader" on "repository";
    "admin" if "admin" on "repository";

    "read" if "reader";
    "comment" if "admin";
    "close" if "creator";
    "close" if "admin";
    
}

has_permission(_: Actor, "read", repo: Repository) if
    is_public(repo);


has_permission(actor: Actor, "delete", repo: Repository) if
    has_role(actor, "member", repo) and
    is_protected(repo, false);


# readers can only comment on open issues
has_permission(actor: Actor, "comment", issue: Issue) if
    has_permission(actor, "read", issue) and
    is_closed(issue, false);


# Misc rules:
## All organizations are public
has_permission(_: User, "read", _: Organization);
has_permission(_: User, "create", "Organization");
## Users can read all users
has_permission(_: User, "read", _: User);
## Users can only read their own profiles
has_permission(user: User, "read_profile", user: User);


# Complex rules

has_role(actor: Actor, role: String, repo: Repository) if
    org matches Organization and
    has_relation(repo, "organization", org) and
    has_default_role(org, role) and
    has_role(actor, "member", org);
`.trim();

module.exports = app => app.component('app-component', {
  inject: ['state'],
  data: () => ({ userId: null, role: null, resourceType: null, resourceId: null }),
  template,
  computed: {
    allUsers() {
      return [...new Set(this.state.constraints.map(c => c.userId))];
    },
    allRoles() {
      return [
        "reader", "admin", "maintainer", "editor", "member"
      ];
    },
    allResources() {
      return ['Organization', 'Repository'];
    },
    resourceIds() {
      if (this.resourceType === 'Organization') {
        return this.state.organizations;
      }
      if (this.resourceType === 'Repository') {
        return this.state.repositories;
      }

      return [];
    },
    polarCode() {
      return polarCode;
    }
  },
  methods: {
    async tell() {
      if (!this.userId || !this.role || !this.resourceType || !this.resourceId) {
        return;
      }
      await axios.put('/.netlify/functions/tell', {
        sessionId: this.state.sessionId,
        userId: this.userId,
        role: this.role,
        resourceType: this.resourceType,
        resourceId: this.resourceId
      }).then(res => res.data);
      this.state.facts.push({
        userId: this.userId,
        role: this.role,
        resourceType: this.resourceType,
        resourceId: this.resourceId
      });
      this.userId = null;
      this.role = null;
      this.resourceType = null;
      this.resourceId = null;
    },
    async deleteFact(fact) {
      await axios.put('/.netlify/functions/deleteFact', {
        sessionId: this.state.sessionId,
        userId: fact.userId,
        role: fact.role,
        resourceType: fact.resourceType,
        resourceId: fact.resourceId
      }).then(res => res.data);
      this.state.facts = this.state.facts.filter(f => fact !== f);
    },
    async test() {
      this.state.results = [];
      for (const constraint of this.state.constraints) {
        const authorized = await axios.get('/.netlify/functions/authorize', {
          params: {
            sessionId: this.state.sessionId,
            userId: constraint.userId,
            action: constraint.action,
            resourceType: constraint.resourceType,
            resourceId: constraint.resourceId
          }
        }).then(res => res.data.authorized);
        this.state.results.push({ ...constraint, pass: authorized === !constraint.shouldFail });
      }
    }
  },
  async mounted() {
    Prism.highlightElement(this.$refs.codeSnippet);

    this.state.facts = await axios.get('/.netlify/functions/facts', {
      params: {
        sessionId: this.state.sessionId,
        userId: ['John', 'Jane']
      }
    }).then(res => res.data.facts).then(facts => facts.map(fact => ({
      userId: fact[1].id.replace(this.state.sessionId, '').replace(/^_/, ''),
      role: fact[2],
      resourceType: fact[3].type,
      resourceId: fact[3].id
    })));
  },
  async errorCaptured(err) {
    vanillatoasts.create({
      title: err.message,
      icon: '/images/failure.jpg',
      timeout: 5000,
      positionClass: 'bottomRight'
    });
  }
});