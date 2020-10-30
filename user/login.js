const passport = require('passport');
const {logger} = require('./user-logger.js');

let HOST = 'https://falkai.xyz';
if (process.env.NODE_ENV !== 'production') {
  HOST = 'localhost:5005';
}
const LOGIN_REDIRECT = '/profile';
const logMeta = {
  src: 'user/login.js'
}

function init(app) {
  app.post('/login', (req, res, next) => {
    // Check info first to return custom error message
    let username = req.body.username;
    if (!username) { 
      res.redirect('/login?e=1');
      return;
    }
    // Pass the request to the passport authenticator
    //passport.authenticate('local', { failureRedirect: '/login?e=1' })(req, res, next);

    // Passport authenticate using custom callback
    passport.authenticate('local', (err, user) => {
      // Gets the err and user from done in the passport strategy
      if (err) {
        logger.warn(`Error in authentication: ${err}`, logMeta);
        res.redirect('/login?e=1');
        return;
      }
      if (!user) {
        logger.warn('Empty user object authenticated', logMeta);
        res.redirect('/login?e=1');
        return;
      }
      // Check if the user is verified and not banned
      if (!user.data.verified) {
        logger.info(`Unverified user ${user.data.username} login`, logMeta);
        res.redirect('/login?e=2');
        return;
      }
      if (user.data.ban_until > Math.floor(Date.now() / 1000)) {
        logger.info(`Banned user ${user.data.username} login`, logMeta);
        res.redirect('/login?e=3');
        return;
      }

      // Set the user
      req.session.user = user;
      req.login(user, function(err) {
        if (err) { return next(err); }
        logger.debug(`Logged in user ${username}`, logMeta);
        return next();
      });
    })(req, res, next);
  }, (req, res) => {
    logger.debug(`Received authentication ${req.session.user.data.username}`, logMeta);
    req.session.save(function(err) {
      // session saved
      if (req.body.redirect) {
        let redirectURL = Buffer.from(req.body.redirect, 'hex').toString('utf8');
        if (/^(\/[a-zA-Z0-9-]*)+$/.test(redirectURL)) {
          res.redirect(redirectURL);
        } else {
          res.redirect(LOGIN_REDIRECT);
        }
      } else {
        res.redirect(LOGIN_REDIRECT);
      }
    });
  });

  app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
      res.redirect(LOGIN_REDIRECT);
    } else {
      res.render('login');
    }
  });
  
  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });
}

module.exports = {
  init: init
}
