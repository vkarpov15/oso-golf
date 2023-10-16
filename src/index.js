'use strict';

const sessionId = window.localStorage.getItem('_gitclubGameSession') || [...Array(30)].map(() => Math.random().toString(36)[2]).join('');
console.log(sessionId);
window.localStorage.setItem('_gitclubGameSession', sessionId);

const levels = require('../levels');
const vanillatoasts = require('vanillatoasts');

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
      repositories: ['osohq/sample-apps', 'osohq/configs', 'osohq/nodejs-client'],
      constraints: levels[0].constraints,
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
