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

  app.get('/user-feed/incomplete', authMiddleware(), (req, res) => {
    userDB.getAssignmentsByUser(req.user.data.username, req.user.id, 'incomplete').then(result => {
      let classData = result[0];
      let assignData = result[1];
      res.render('user-feed', {classes: classData, assignments: assignData, 
        feedincomplete: true, layout: 'main-user-header'});
    })
  })

  app.get('/user-feed/current', authMiddleware(), (req, res) => {
    userDB.getAssignmentsByUser(req.user.data.username, req.user.id, 'nonexpired').then(result => {
      let classData = result[0];
      let assignData = result[1];
      res.render('user-feed', {classes: classData, assignments: assignData, 
        feedcurrent: true, layout: 'main-user-header'});
    })
  })
}

module.exports = {
  init: init
}