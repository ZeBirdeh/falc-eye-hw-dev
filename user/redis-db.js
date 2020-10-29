const session = require('express-session');
const redis = require('redis');
const RedisConnect = require('connect-redis')(session);

// Redis server on port 6379
let redisClient = redis.createClient();
let redisStore = new RedisConnect({host: 'localhost', port: 6379, client: redisClient})

module.exports = redisStore;