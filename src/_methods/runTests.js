'use strict';

const axios = require('axios');

module.exports = asyncQueue(runTests);

window.runTests = runTests;

async function runTests(state = window.state) {
  state.results = [];
  state.showNextLevelButton = null;
  let passed = true;
  const results = [];
  await Promise.all(state.constraints.map(async (constraint, index) => {
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
    results[index] = { ...constraint, pass };
    if (!pass) {
      passed = false;
    }
  }));
  state.results = results;
  state.showNextLevelButton = passed;
};

function asyncQueue(fn) {
  let promise = Promise.resolve();

  return async function wrappedInQueue() {
    promise = promise.then(() => fn.apply(this, arguments));
    return await promise;
  };
}