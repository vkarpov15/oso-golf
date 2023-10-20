'use strict';

const template = require('./constraints.html');

module.exports = app => app.component('constraints', {
  inject: ['state'],
  template: template,
  methods: {
    displayImageForTestResult(index) {
      if (!this.state.results[index]) {
        return '/images/loader.gif';
      }
      return this.state.results[index].pass ? '/images/check-green.svg' : '/images/error-red.svg';
    }
  },
  computed: {
    testsInProgress() {
      return this.state.constraints.length > 0 && this.state.constraints.length !== this.state.results.length;
    }
  }
});