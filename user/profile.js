path = require('path');
authMiddleware = require('./authentication-middleware.js');
userDB = require('./auth-user-db.js');

// Set up app pages
function init(app) {
  app.get('/profile', authMiddleware(), (req, res) => {
    userDB.getClasses(req.user.data.username).then(profileData => {
      console.log("[LOG] profile: Rendering profile page with data");
      profileData.hasClasses = (profileData.classes.length > 0)
      profileData.layout = 'main-user-header';
      profileData.userData = {
        username: req.user.data.username,
        created: req.user.data.created
      }
      res.render('profile', profileData);
    });
  });
}

module.exports = {
  init: init
}