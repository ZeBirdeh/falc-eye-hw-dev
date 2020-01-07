const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const authUserDB = require('./authUserDB.js');

// Serialize and deserialize user to store information for sessions
passport.serializeUser(function(userdoc, done) {
    console.log(`Serialized user with id ${userdoc.id}`);
    done(null, userdoc.id);
});

passport.deserializeUser(function(userid, done) {
    console.log(`Deserialized user with id ${userid}`);
    authUserDB.getUserById(userid).then(doc => {
        done(null, doc);
      });
});

// The code to authenticate a user by comparing a given username-password combination
function initPassport() {
  console.log("Passport initialized");
  passport.use(new LocalStrategy(
    (username, password, done) => {
      authUserDB.getUsers(username).then(doc => {
        var docData = doc.data();
        if (docData.password == undefined) {
          return done(null, false);
        }

        bcrypt.compare(password, docData.password, (err, isSame) => {
          if (err) {
            console.log(`Error in comparing passwords. ${err}`);
            return done(err, false);
          }
          if (!isSame) {
            console.log(`Passwords do not match. User: ${docData.password} ${password}`);
            return done(null, false);
          }
          console.log(`Succesfully logged in ${username}`);
          return done(null, doc);
        });
      }).catch((err) => {
        console.log(err);
        return done(null, false);
      });
    }
  ));
}

function initUser(app) {
  app.post('/login', passport.authenticate('local', { failureRedirect: '/loginform' }),
  function(req, res) {
    req.session.user = req.session.passport.user;
    req.session.save(function(err) {
      // session saved
      res.redirect('/profile')
    });
  });

  app.get('/loginform', renderLoginForm);

  app.get('/secure', (req, res) => {
    res.send(req.session);
  });
}

function renderLoginForm(req, res) {
  console.log("Login form");
  res.render('user/loginform');
}

module.exports = {
    initPassport: initPassport,
    initUser: initUser
}
