const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const authUserDB = require('./authUserDB.js');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const memoryStore = require('./memory-store-db.js');

const LOGIN_REDIRECT = '/profile';

// The code to authenticate a user by comparing a given username-password combination
function initPassport() {
  console.log("Passport initialized");
  // Serialize and deserialize user to store information for sessions
  passport.serializeUser(function(userdoc, done) {
    console.log(`Serialized user with id ${userdoc.id}`);
    done(null, userdoc.id);
  });

  passport.deserializeUser(function(userid, done) {
  console.log(`Deserialized user with id ${userid}`);
  //authUserDB.getUserById(userid).then(doc => {
  //    done(null, doc);
  //  });
  memoryStore.get(userid, (err, session) => {done(null, session)});
  });
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
          memoryStore.set(doc.id, {id: doc.id, data: docData}, err => {console.log(err)})
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
  app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    req.session.user = req.session.passport.user;
    req.session.save(function(err) {
      // session saved
      res.redirect(LOGIN_REDIRECT);
    });
  });

  app.get('/login', renderLoginForm);

  app.get('/secure', (req, res) => {
    res.send(req.session);
  });
}

function init(app) {
  app.use(cookieParser());
  app.use(session({
    store: memoryStore,
    secret: "secret",
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());
}

function renderLoginForm(req, res) {
  console.log("Login form");
  res.render('user/login');
}

module.exports = {
    initPassport: initPassport,
    initUser: initUser,
    init: init
}
