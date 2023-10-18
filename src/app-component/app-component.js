'use strict';

const axios = require('axios');
const levels = require('../../levels');
const template = require('./app-component.html');

module.exports = app => app.component('app-component', {
  inject: ['state'],
  data: () => ({
    currentTime: new Date(),
    status: 'loading'
  }),
  template,
  computed: {
    elapsedTime() {
      if (!this.state.startTime) {
        return '0:00';
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
    levels() {
      return levels;
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
    async test() {
      this.state.results = [];
      this.state.showNextLevelButton = null;
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
      this.state.showNextLevelButton = passed;
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
        await this.loadFacts();
        await this.test();
      }
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
          resourceType: fact[3]?.type,
          resourceId: fact[3]?.id?.replace(this.state.sessionId, '')?.replace(/^_/, '')
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

    const { player } = await axios.get('/.netlify/functions/resumeGame', {
      params: {
        sessionId: this.state.sessionId
      }
    }).then(res => res.data);
    if (player == null) {
      return;
    }
    this.state.level = player.levelsCompleted + 1;
    if (this.state.level < levels.length + 1) {
      this.state.constraints = levels[this.state.level - 1].constraints;
      await this.loadFacts();
      await this.test();
    }
    this.state.par = player.par;
    this.state.startTime = new Date(player.startTime);
    this.status = 'loaded';
  }
});