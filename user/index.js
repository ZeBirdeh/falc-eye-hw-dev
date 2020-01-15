const appInit = require('./init.js');
const profile = require('./profile.js');

function init(app) {
    appInit.initUser(app);
    profile.init(app);
}

module.exports = {
    init: init,
    initPassport: appInit.initPassport,
    initSession: appInit.init,
    authentication: require('./authentication-middleware.js')
}