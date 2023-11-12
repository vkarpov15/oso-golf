'use strict';

const levels = require('../../levels');
const template = require('./scorecard.html');

module.exports = app => app.component('scorecard', {
  template,
  inject: ['state'],
  computed: {
    holes() {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    },
    levels() {
      return levels;
    },
    parTotal() {
      return levels.reduce((sum, level) => sum + level.par, 0);
    }
  },
  methods: {
    displayPar(score, par) {
      if (score == null) {
        return '';
      }
      return score + par;
    }
  }
});