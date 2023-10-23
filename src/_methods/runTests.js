'use strict';

const axios = require('axios');

module.exports = async function runTests(state = window.state) {
  state.results = [];
  state.showNextLevelButton = null;
  let passed = true;
  for (const constraint of state.constraints) {
    const authorized = await axios.get('/.netlify/functions/authorize', {
      params: {
        sessionId: state.sessionId,
        userId: constraint.userId,
        action: constraint.action,
        resourceType: constraint.resourceType,
        resourceId: constraint.resourceId
      }
    }).then(res => res.data.authorized);
    const pass = authorized === !constraint.shouldFail;
    state.results.push({ ...constraint, pass });
    if (!pass) {
      passed = false;
    }
  }
  state.showNextLevelButton = passed;
};