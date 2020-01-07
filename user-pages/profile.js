path = require('path');
authMiddleware = require('./authentication-middleware.js');
userDB = require('./user-db.js');

// Set up app pages
function init(app) {
  app.get('/profile', authMiddleware(), (req, res) => {
    userDB.getClasses(req.user.data.username).then(profileData => {
      console.log("[LOG] profile: Rendering profile page with data")
      res.render(path.join(__dirname, '/profile'), profileData);
    });
  });
}

module.exports = {
  init: init
}