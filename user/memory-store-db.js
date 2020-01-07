const session = require('express-session');
const memoryStore = new session.MemoryStore();

module.exports = memoryStore;