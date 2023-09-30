'use strict';

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
      facts: [],
      sessionId,
      level: 0,
      startTime: null,
      errors: {},
      name: '',
      email: ''
    });

    Vue.provide('state', state);

    window.state = state;

    return state;
  }
});

require('./app-component/app-component')(app);

app.mount('#content');
