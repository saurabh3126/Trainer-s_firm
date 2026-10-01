require('dotenv').config();
const serverless = require('serverless-http');

// Use path.join to correctly resolve server.js regardless of working directory
const path = require('path');
const app = require(path.join(__dirname, '..', 'server'));

module.exports = serverless(app);
