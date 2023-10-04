'use strict';

const axios = require('axios');
const levels = require('../../levels');
const template = require('./app-component.html')
const vanillatoasts = require('vanillatoasts');

const polarCode = `
actor User { }

resource Organization { 
    roles = ["admin", "member"];

    "member" if "admin";
}

resource Repository { 
    permissions = ["read", "write", "delete"];
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
    is_not_protected(repo, true);
`.trim();

module.exports = app => app.component('app-component', {
  inject: ['state'],
  data: () => ({
    userId: null,
    role: null,
    resourceType: null,
    resourceId: null,
    attribute: null,
    attributeValue: null,
    currentTime: new Date(),
    factType: 'role'
  }),
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
    allAttributes() {
      return ['is_public', 'is_not_protected'];
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
    },
    elapsedTime() {
      if (!this.state.startTime) {
        return `0:00`;
      }
      const ms = this.currentTime.valueOf() - this.state.startTime.valueOf();
      const seconds = Math.floor((ms / 1000) % 60);
      const minutes = Math.floor((ms / 1000 / 60) % 60);
      const hours = Math.floor(ms / 1000 / 60 / 60);

      if (hours) {
        return `${hours}:${(minutes + '').padStart(2, '0')}:${(seconds + '').padStart(2, '0')}`;
      }

      return `${minutes}:${(seconds + '').padStart(2, '0')}`;
    },
    par() {
      if (this.state.par < 0) {
        return this.state.par;
      }
      return `+${this.state.par || 0}`;
    }
  },
  methods: {
    async startGame() {
      if (this.state.level !== 0) {
        return;
      }
      this.state.errors = {};
      if (!this.state.email) {
        this.state.errors.email = 'Email is required';
      }
      if (!this.state.name) {
        this.state.errors.name = 'Name is required';
      }
      if (Object.keys(this.state.errors).length > 0) {
        return;
      }

      const { player } = await axios.post('/.netlify/functions/startGame', {
        sessionId: this.state.sessionId,
        name: this.state.name,
        email: this.state.email
      }).then(res => res.data);

      this.state.level = 1;
      this.state.currentTime = new Date();
      this.state.startTime = new Date(player.startTime);
    },
    async tell() {
      if (this.factType === 'role') {
        if (!this.userId || !this.role || !this.resourceType || !this.resourceId) {
          return;
        }
      } else if (this.factType === 'attribute') {
        if (!this.resourceType || !this.resourceId || !this.attribute || this.attributeValue == null) {
          return;
        }
      }
      await axios.put('/.netlify/functions/tell', {
        sessionId: this.state.sessionId,
        factType: this.factType,
        userId: this.userId,
        role: this.role,
        resourceType: this.resourceType,
        resourceId: this.resourceId,
        attribute: this.attribute,
        attributeValue: this.attributeValue
      }).then(res => res.data);
      this.state.facts.push({
        factType: this.factType,
        userId: this.userId,
        role: this.role,
        resourceType: this.resourceType,
        resourceId: this.resourceId,
        attribute: this.attribute,
        attributeValue: this.attributeValue
      });
      this.userId = null;
      this.role = null;
      if (this.factType !== 'attribute') {
        this.resourceType = null;
      }
      this.resourceId = null;
      this.attribute = null;
      this.attributeValue = null;
    },
    async deleteFact(fact) {
      await axios.put('/.netlify/functions/deleteFact', {
        sessionId: this.state.sessionId,
        ...fact
      }).then(res => res.data);
      this.state.facts = this.state.facts.filter(f => fact !== f);
    },
    async test() {
      this.state.results = [];
      let passed = true;
      for (const constraint of this.state.constraints) {
        const resourceId = constraint.resourceType === 'Repository' ?
          `${this.state.sessionId}_${constraint.resourceId}` :
          constraint.resourceId;
        const authorized = await axios.get('/.netlify/functions/authorize', {
          params: {
            sessionId: this.state.sessionId,
            userId: constraint.userId,
            action: constraint.action,
            resourceType: constraint.resourceType,
            resourceId
          }
        }).then(res => res.data.authorized);
        const pass = authorized === !constraint.shouldFail;
        this.state.results.push({ ...constraint, pass });
        if (!pass) {
          passed = false;
        }
      }
      if (passed) {
        this.state.showNextLevelButton = true;
      }
    },
    async verifySolutionForLevel() {
      const { player } = await axios.post('/.netlify/functions/verifySolutionForLevel', {
        sessionId: this.state.sessionId,
        level: this.state.level
      }).then(res => res.data);
      this.state.level = player.levelsCompleted + 1;
      await Promise.all(this.state.facts.map(fact => this.deleteFact(fact)));
      if (this.state.level < 3) {
        this.state.constraints = levels[this.state.level - 1].constraints;
        await this.loadFacts();
      }
      this.state.par = player.par;
      this.state.results = [];
      this.state.showNextLevelButton = false;
    },
    restart() {
      window.localStorage.setItem('_gitclubGameSession', '');
      window.location.reload();
    },
    async loadFacts() {
      const facts = await axios.put('/.netlify/functions/facts', {
        sessionId: this.state.sessionId,
        userId: [...new Set(this.state.constraints.map(c => c.userId))]
      }).then(res => res.data.facts);
      
      this.state.facts = facts.map(fact => {
        return fact[0] === 'has_role' ? {
          factType: 'role',
          userId: fact[1].id.replace(this.state.sessionId, '').replace(/^_/, ''),
          role: fact[2],
          resourceType: fact[3].type,
          resourceId: fact[3].id.replace(this.state.sessionId, '').replace(/^_/, '')
        } : {
          factType: 'attribute',
          attribute: fact[0],
          resourceType: fact[1].type,
          resourceId: fact[1].id.replace(this.state.sessionId, '').replace(/^_/, ''),
          attributeValue: fact[2].id === 'true'
        };
      });
    }
  },
  async mounted() {
    setInterval(() => {
      this.currentTime = new Date();
    }, 500);

    Prism.highlightElement(this.$refs.codeSnippet);

    const { player } = await axios.get('/.netlify/functions/resumeGame', {
      params: {
        sessionId: this.state.sessionId
      }
    }).then(res => res.data);
    if (player == null) {
      return;
    }
    this.state.level = player.levelsCompleted + 1;
    if (this.state.level < 3) {
      this.state.constraints = levels[this.state.level - 1].constraints;
      await this.loadFacts();
    }
    this.state.par = player.par;
    this.state.startTime = new Date(player.startTime);
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