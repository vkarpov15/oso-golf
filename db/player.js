'use strict';

const mongoose = require('mongoose');

module.exports = mongoose.model('Player', mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    requrired: true
  },
  email: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: () => new Date()
  },
  parPerLevel: {
    type: [Number]
  },
  par: {
    type: Number
  },
  gameplayTimeMS: {
    type: Number
  },
  levelsCompleted: {
    type: Number,
    default: 0
  }
}));