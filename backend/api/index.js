require('dotenv').config();
const serverless = require('serverless-http');

// Import the express app (without the app.listen)
const app = require('./server');

module.exports = serverless(app);
