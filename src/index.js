'use strict';

const sessionId = window.localStorage.getItem('_gitclubGameSession') || [...Array(30)].map(() => Math.random().toString(36)[2]).join('');
console.log(sessionId);
window.localStorage.setItem('_gitclubGameSession', sessionId);

const level1 = [
  { userId: 'John', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
  { userId: 'John', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client', shouldFail: true },
  { userId: 'John', action: 'write', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
  { userId: 'Jane', action: 'write', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
  { userId: 'Jane', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
  { userId: 'Jane', action: 'delete', resourceType: 'Repository', resourceId: 'osohq/configs' }
];

const level2 = [
  { userId: 'Bill', action: 'manage_members', resourceType: 'Organization', resourceId: 'osohq' },
  { userId: 'Bill', action: 'delete', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true },
  { userId: 'Larry', action: 'read', resourceType: 'Repository', resourceId: 'osohq/sample-apps' },
  { userId: 'Larry', action: 'write', resourceType: 'Repository', resourceId: 'osohq/nodejs-client' },
  { userId: 'Larry', action: 'read', resourceType: 'Repository', resourceId: 'osohq/configs', shouldFail: true }
];

const app = Vue.createApp({
  template: `
  <div>
    <div class="view">
      <router-view :key="$route.fullPath" />
    </div>
  </div>
  `,
  setup() {
    const state = Vue.reactive({
      organizations: ['osohq'],
      repositories: ['osohq/sample-apps', 'osohq/configs'],
      constraints: level1,
      results: [],
      facts: [],
      sessionId,
      level: 0,
      par: 0,
      startTime: null,
      errors: {},
      showNextLevelButton: false,
      name: '',
      email: ''
    });

    Vue.provide('state', state);

    window.state = state;

    return state;
  }
});

require('./app-component/app-component')(app);
require('./async-button/async-button')(app);
require('./leaderboard/leaderboard')(app);

const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: app.component('app-component')
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: app.component('leaderboard')
    }
  ]
});

// Set the correct initial route: https://github.com/vuejs/vue-router/issues/866
router.replace(window.location.pathname);
app.use(router);

app.mount('#content');
