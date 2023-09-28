'use strict';

const axios = require('axios');
const vanillatoasts = require('vanillatoasts');

const app = Vue.createApp({
  template: '<app-component />',
  setup() {
    const state = Vue.reactive({
    });

    Vue.provide('state', state);

    window.state = state;

    return state;
  }
});

app.component('app-component', {
  inject: ['state'],
  data: () => ({ authorized: null }),
  template: `
  <div>
    <h1>Hello, World: {{authorized}}</h1>
  </div>
  `,
  async mounted() {
    this.authorized = await axios.get('/authorize', {
      params: {
        userId: 'test',
        action: 'read',
        resourceType: 'Organization',
        resourceId: 'testorg'
      }
    }).then(res => res.data.authorized);
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
