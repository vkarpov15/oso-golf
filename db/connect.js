'use strict';

const mongoose = require('mongoose');

let conn = null;

module.exports = async function connect() {
  if (conn != null) {
    return conn;
  }

  conn = mongoose.connection;
  await mongoose.connect(process.env.MONGODB_CONNECTION_STRING, {
    serverSelectionTimeoutMS: 4000
  });

  return conn;
};