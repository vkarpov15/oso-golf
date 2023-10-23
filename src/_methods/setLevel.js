'use strict';

const axios = require('axios');
const levels = require('../../levels');

module.exports = async function setLevel(level, retainContextFacts, state = window.state) {
  if (level < 1) {
    throw new Error(`Invalid level ${level}`);
  }
  if (level === state.level) {
    return;
  }

  state.level = level;
  if (level < levels.length + 1) {
    state.currentLevel = levels[level - 1];
    state.constraints = state.currentLevel.constraints;
  } else {
    state.currentLevel = null;
    state.constraints = [];
  }
  state.results = [];
  state.showNextLevelButton = false;
  state.facts = [];

  if (!retainContextFacts) {
    await axios.post('/.netlify/functions/clearContextFacts', {
      sessionId: state.sessionId
    });
  }
};