const path = require('path');
const app = require(path.join(__dirname, '..', 'server'));

// Vercel handles Express natively — just export the app
module.exports = app;
