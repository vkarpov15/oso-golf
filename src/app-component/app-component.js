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
    is_protected(repo, false);
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
    currentTime: new Date()
  }),
  template,
  computed: {
    allUsers() {
      return [...new Set(this.state.constraints.map(c => c.userId))];
    },
    allRoles() {
      if (this.resourceType === 'Organization') {
        return ['admin', 'member'];
      }
      if (this.resourceType === 'Repository') {
        return ["reader", "admin", "maintainer", "editor"];
      }
      return [
        "reader", "admin", "maintainer", "editor", "member"
      ];
    },
    allResources() {
      return ['Organization', 'Repository'];
    },
    allAttributes() {
      return ['is_public', 'is_protected'];
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
    },
    parForLevel() {
      const parForLevel = levels[this.state.level - 1].par;
      const par = this.state.facts.length - parForLevel;

      return par < 0 ? par : `+${par}`;
    },
    level() {
      return levels[this.state.level - 1];
    }
  },
  watch: {
    resourceType() {
      if (!this.allRoles.includes(this.role)) {
        this.role = null;
      }
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
      await this.test();
    },
    async tell(factType) {
      if (factType === 'role') {
        if (!this.userId || !this.role || !this.resourceType || !this.resourceId) {
          vanillatoasts.create({
            title: 'Missing a required field',
            icon: '/images/failure.jpg',
            timeout: 5000,
            positionClass: 'bottomRight'
          });
          return;
        }
      } else if (factType === 'attribute') {
        if (!this.resourceType || !this.resourceId || !this.attribute || this.attributeValue == null) {
          vanillatoasts.create({
            title: 'Missing a required field',
            icon: '/images/failure.jpg',
            timeout: 5000,
            positionClass: 'bottomRight'
          });
          return;
        }
      }
      await axios.put('/.netlify/functions/tell', {
        sessionId: this.state.sessionId,
        factType,
        userId: this.userId,
        role: this.role,
        resourceType: this.resourceType,
        resourceId: this.resourceId,
        attribute: this.attribute,
        attributeValue: this.attributeValue
      }).then(res => res.data);
      this.state.facts.push({
        factType,
        userId: this.userId,
        role: this.role,
        resourceType: this.resourceType,
        resourceId: this.resourceId,
        attribute: this.attribute,
        attributeValue: this.attributeValue
      });
      this.userId = null;
      this.role = null;
      if (factType !== 'attribute') {
        this.resourceType = null;
      }
      this.resourceId = null;
      this.attribute = null;
      this.attributeValue = null;

      await this.test();
    },
    async deleteFact(fact) {
      await axios.put('/.netlify/functions/deleteFact', {
        sessionId: this.state.sessionId,
        ...fact
      }).then(res => res.data);
      this.state.facts = this.state.facts.filter(f => fact !== f);
      await this.test();
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
      await Promise.all(this.state.facts.map(fact => this.deleteFact(fact)));
      if (this.state.level < 3) {
        this.state.constraints = levels[this.state.level - 1].constraints;
        await this.loadFacts();
        await this.test();
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
      await this.test();
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