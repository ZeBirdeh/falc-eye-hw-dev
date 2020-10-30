const appInit = require('./init.js');
const profile = require('./profile.js');
const login = require('./login.js');
const register = require('./register.js');
const pages = require('./pages.js');

function init(app) {
    profile.init(app);
    login.init(app);
    register.init(app);
    pages.init(app);
}

module.exports = {
    init: init,
    initPassport: appInit.initPassport,
    initSession: appInit.init,
    authentication: require('./authentication-middleware.js')
}