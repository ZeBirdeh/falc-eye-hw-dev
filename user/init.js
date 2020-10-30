const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const authUserDB = require('./auth-user-db.js');
const {google} = require('googleapis');
const session = require('express-session');
const cookieParser = require('cookie-parser');
//const memoryStore = require('./memory-store-db.js');
//const redisStore = require('./redis-db.js');
const passportStore = require('./store-db.js');
const {logger} = require('./user-logger.js');

let HOST = 'https://falkai.xyz';
if (process.env.NODE_ENV !== 'production') {
  HOST = 'localhost:5005';
}
const logMeta = {
  src: 'user/init.js'
}

// The code to authenticate a user by comparing a given username-password combination
function initPassport() {
  //console.log("Passport initialized");
  logger.info("Passport initialized", logMeta);
  // Serialize and deserialize user to store information for sessions
  passport.serializeUser(function(userdoc, done) {
    //console.log(`Serialized user with id ${userdoc.id}`);
    done(null, userdoc.id);
  });

  passport.deserializeUser(function(userid, done) {
    //console.log(`Deserialized user with id ${userid}`);
    //authUserDB.getUserById(userid).then(doc => {
    //    done(null, doc);
    //  });
    passportStore.get(userid, (err, session) => {done(null, session)});
  });

  passport.use(new LocalStrategy(
    (username, password, done) => {
      authUserDB.getUsers(username).then(doc => {
        var docData = doc.data();
        if (!docData) {
          return done(null, false);
        }

        bcrypt.compare(password, docData.password, (err, isSame) => {
          if (err) {
            //console.log(`Error in comparing passwords. ${err}`);
            logger.warn(`Error in comparing passwords: ${err}`, logMeta);
            return done(err, false);
          }
          if (!isSame) {
            //console.log(`Passwords do not match. User: ${docData.password} ${password}`);
            logger.debug("Passwords do not match.", logMeta);
            return done(null, false);
          }
          //console.log(`Succesfully logged in ${username}`);
          logger.info(`Successfully logged in user ${username}`, logMeta);
          passportStore.set(doc.id, {id: doc.id, data: docData}, err => {if(err){console.log(err)}})
          return done(null, {id: doc.id, data: docData});
        });
      }).catch((err) => {
        console.log(err);
        return done(null, false);
      });
    }
  ));
}

function init(app) {
  app.use(cookieParser());
  app.use(session({
    store: passportStore,
//    store: redisStore,
    secret: "secret",
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  // Put auth status in locals object
  app.use((req, res, next) => {
    if (req.isAuthenticated()) {
      res.locals.userData = { isAuthenticated: true, username: req.user.data.username };  
    }
    next();
  })
}

module.exports = {
    initPassport: initPassport,
    init: init
}
