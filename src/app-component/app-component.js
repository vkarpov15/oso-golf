'use strict';

const axios = require('axios');
const bson = require('bson');
const levels = require('../../levels');
const runTests = require('../_methods/runTests');
const setLevel = require('../_methods/setLevel');
const template = require('./app-component.html');

module.exports = app => app.component('app-component', {
  inject: ['state'],
  data: () => ({
    currentTime: new Date(),
    status: 'loading',
    showRestartConfirmModal: false
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
      await runTests(this.state);
    },
    restart() {
      window.localStorage.setItem('_gitclubGameSession', '');
      window.location.reload();
    },
    loadFacts(player) {      
      this.state.facts = player.contextFacts.map(fact => {
        if (fact[0] === 'has_role') {
          return {
            _id: new bson.ObjectId(),
            factType: 'role',
            actorType: fact[1].type,
            userId: fact[1].id,
            role: fact[2],
            resourceType: fact[3]?.type,
            resourceId: fact[3]?.id
          };
        } else if (fact[0] === 'has_group') {
          return {
            _id: new bson.ObjectId(),
            factType: 'attribute',
            attribute: fact[0],
            resourceType: fact[1].type,
            resourceId: fact[1].id,
            attributeValue: fact[2].id
          };
        }
        return {
          _id: new bson.ObjectId(),
          factType: 'attribute',
          attribute: fact[0],
          resourceType: fact[1].type,
          resourceId: fact[1].id,
          attributeValue: typeof fact[2] === 'string' ? fact[2] : fact[2].id === 'true'
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
    await setLevel(player.levelsCompleted + 1, true, this.state);
    this.state.par = player.par;
    this.state.startTime = new Date(player.startTime);
    this.loadFacts(player);
    this.status = 'loaded';
    await this.test();
  }
});