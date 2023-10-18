'use strict';

const axios = require('axios');
const levels = require('../../levels');
const template = require('./level.html');
const vanillatoasts = require('vanillatoasts');

const defaultPolarCode = `
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
`.trim();

module.exports = app => app.component('level', {
  inject: ['state'],
  props: ['onTest', 'onLoadFacts'],
  data: () => ({
    userId: null,
    attributeFact: {
      resourceId: null,
      attribute: null,
      attributeValue: null
    },
    roleFact: {
      resourceType: null,
      resourceId: null,
      role: null
    }
  }),
  template,
  computed: {
    polarCode() {
      return levels[this.state.level - 1]?.polarCode
        ? levels[this.state.level - 1].polarCode
        : defaultPolarCode;
    },
    allUsers() {
      return [...new Set(this.state.constraints.map(c => c.userId))];
    },
    allRoles() {
      if (this.roleFact.resourceType === 'Organization') {
        return ['admin', 'member'];
      }
      if (this.roleFact.resourceType === 'Repository') {
        return ['reader', 'admin', 'maintainer', 'editor'];
      }
      return [
        'reader', 'admin', 'maintainer', 'editor', 'member', 'superadmin'
      ];
    },
    allResources() {
      return ['Organization', 'Repository'];
    },
    allAttributes() {
      return ['is_public', 'is_protected'];
    },
    resourceIds() {
      if (this.roleFact.resourceType === 'Organization') {
        return this.state.organizations;
      }
      if (this.roleFact.resourceType === 'Repository') {
        return this.state.repositories;
      }

      return [];
    },
    level() {
      return levels[this.state.level - 1];
    },
    testsInProgress() {
      return this.state.constraints.length > 0 && this.state.constraints.length !== this.state.results.length;
    },
    parForLevel() {
      const parForLevel = levels[this.state.level - 1].par;
      const par = this.state.facts.length - parForLevel;

      return par < 0 ? par : `+${par}`;
    },
    isGlobalRole() {
      return this.roleFact.role === 'superadmin';
    }
  },
  watch: {
    'roleFact.resourceType'() {
      if (!this.allRoles.includes(this.roleFact.role)) {
        this.roleFact.role = null;
      }
    }
  },
  methods: {
    async addRoleFact() {
      const { roleFact } = this;
      if (!this.userId || !roleFact.role || ((!roleFact.resourceType || !roleFact.resourceId) && !this.isGlobalRole)) {
        vanillatoasts.create({
          title: 'Missing a required field',
          icon: '/images/failure.jpg',
          timeout: 5000,
          positionClass: 'bottomRight'
        });
        return;
      }

      const factType = 'role';
      await axios.put('/.netlify/functions/tell', {
        sessionId: this.state.sessionId,
        factType,
        userId: this.userId,
        role: this.roleFact.role,
        resourceType: this.roleFact.resourceType,
        resourceId: this.roleFact.resourceId
      }).then(res => res.data);
      this.state.facts.push({
        factType,
        userId: this.userId,
        ...this.roleFact
      });
      this.roleFact = {
        resourceType: null,
        resourceId: null,
        role: null
      };
      this.userId = null;

      await this.onTest();
    },
    async addAttributeFact() {
      const { attributeFact } = this;
      if (!attributeFact.resourceId || !attributeFact.attribute || attributeFact.attributeValue == null) {
        vanillatoasts.create({
          title: 'Missing a required field',
          icon: '/images/failure.jpg',
          timeout: 5000,
          positionClass: 'bottomRight'
        });
        return;
      }

      const resourceType = 'Repository';
      const factType = 'attribute';
      await axios.put('/.netlify/functions/tell', {
        sessionId: this.state.sessionId,
        factType,
        userId: this.userId,
        resourceType,
        ...this.attributeFact
      }).then(res => res.data);
      this.state.facts.push({
        factType,
        userId: this.userId,
        resourceType,
        ...this.attributeFact
      });
      this.attributeFact = {
        resourceId: null,
        attribute: null,
        attributeValue: null
      };
      
      this.userId = null;

      await this.onTest();
    },
    displayRoleFact(fact) {
      if (fact.role === 'superadmin') {
        return `User ${fact.userId} has role ${fact.role}`;
      }
      return `User ${fact.userId} has role ${fact.role} on ${fact.resourceType} ${fact.resourceId}`;
    },
    async deleteFact(fact) {
      await axios.put('/.netlify/functions/deleteFact', {
        sessionId: this.state.sessionId,
        ...fact
      }).then(res => res.data);
      this.state.facts = this.state.facts.filter(f => fact !== f);
      await this.onTest();
    },
    displayImageForTestResult(index) {
      if (!this.state.results[index]) {
        return '/images/loader.gif';
      }
      return this.state.results[index].pass ? '/images/check-green.svg' : '/images/error-red.svg';
    },
    async verifySolutionForLevel() {
      const { player } = await axios.post('/.netlify/functions/verifySolutionForLevel', {
        sessionId: this.state.sessionId,
        level: this.state.level
      }).then(res => res.data);
      this.state.level = player.levelsCompleted + 1;
      this.state.par = player.par;
      this.state.results = [];
      this.state.showNextLevelButton = false;
      const facts = [...this.state.facts];
      this.state.facts = [];

      await Promise.all(facts.map(fact => this.deleteFact(fact)));
      
      if (this.state.level < levels.length + 1) {
        this.state.constraints = levels[this.state.level - 1].constraints;
        await this.onLoadFacts();
        await this.onTest();
      }
    }
  },
  mounted() {
    Prism.highlightElement(this.$refs.codeSnippet);
  }
});