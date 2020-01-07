profile = require('./profile.js');

function init(app) {
    profile.init(app)
}

module.exports = {
    init: init
}