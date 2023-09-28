'use strict';

const axios = require('axios');
const vanillatoasts = require('vanillatoasts');

const sessionId = window.localStorage.getItem('_gitclubGameSession') || [...Array(30)].map(() => Math.random().toString(36)[2]).join('');
console.log(sessionId);
window.localStorage.setItem('_gitclubGameSession', sessionId);

const app = Vue.createApp({
  template: '<app-component />',
  setup() {
    const state = Vue.reactive({
      organizations: ['osohq'],
      repositories: ['osohq/sample-apps', 'osohq/configs'],
      constraints: [
        { userId: 'John', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
        { userId: 'John', action: 'write', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
        { userId: 'Jane', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
        { userId: 'Jane', action: 'write', resourceType: 'Repository', resourceId: 'osohq/configs' },
      ],
      results: [],
      facts: []
    });

    Vue.provide('state', state);

    window.state = state;

    return state;
  }
});

app.component('app-component', {
  inject: ['state'],
  data: () => ({ userId: null, role: null, resourceType: null, resourceId: null }),
  template: `
  <div>
    <h1>GitClub Golf</h1>
    <div>
      Find the minimum number of Oso facts to satisfy the following constraints as fast as you can!
    </div>
    <div>
      <h2>Constraints</h2>
      <div v-for="constraint in state.constraints">
        {{constraint.userId}} {{constraint.shouldFail ? 'cannot' : 'can'}} {{constraint.action}} {{constraint.resourceType}} {{constraint.resourceId}}
      </div>
    </div>
    <div>
      <h2>Add Fact</h2>
      User <select v-model="userId"><option v-for="user in allUsers" :value="user" v-text="user" /></select>
      has role <select v-model="role"><option v-for="role in allRoles" :value="role" v-text="role" /></select>
      on resource <select v-model="resourceType"><option v-for="resource in allResources" :value="resource" v-text="resource" /></select>
      <select v-model="resourceId"><option v-for="resource in resourceIds" :value="resource" v-text="resource" /></select>
      <div>
        <button @click="tell">Add Fact</button>
      </div>
    </div>
    <div>
      <h2>Existing Facts</h2>
      <div v-for="fact in state.facts">
        User {{fact.userId}} has role {{fact.role}} on {{fact.resourceType}} {{fact.resourceId}}
        &nbsp;&nbsp;<button @click="deleteFact(fact)">Delete Fact</button>
      </div>
    </div>
    <div>
      <h2>Test</h2>
      <div>
        <button @click="test">Run Tests</button>
      </div>
      <div v-for="result in state.results">
        [{{result.pass ? 'PASS' : 'FAIL'}}] {{result.userId}} {{result.shouldFail ? 'cannot' : 'can'}} {{result.action}} {{result.resourceType}} {{result.resourceId}}
      </div>
    </div>
  </div>
  `,
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
    }
  },
  methods: {
    async tell() {
      if (!this.userId || !this.role || !this.resourceType || !this.resourceId) {
        return;
      }
      await axios.put('/.netlify/functions/tell', {
        sessionId,
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
        sessionId,
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
            sessionId,
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
    this.state.facts = await axios.get('/.netlify/functions/facts', {
      params: {
        sessionId,
        userId: ['John', 'Jane']
      }
    }).then(res => res.data.facts).then(facts => facts.map(fact => ({
      userId: fact[1].id.replace(sessionId, '').replace(/^_/, ''),
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

app.mount('#content');
