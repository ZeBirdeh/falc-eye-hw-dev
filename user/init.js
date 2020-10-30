const passport = require('passport');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const LocalStrategy = require('passport-local').Strategy;
const authUserDB = require('./auth-user-db.js');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const request = require('request');
const fs = require('fs');
const path = require('path');
//const memoryStore = require('./memory-store-db.js');
//const redisStore = require('./redis-db.js');
const passportStore = require('./store-db.js');
const {logger} = require('./user-logger.js');

const apiAccount = require('../../falc-eye-hw-google-api-u5kt7grp.json');
const grecaptchaAccount = require('../../falc-eye-hw-grecaptcha-rg2qm9fd0.json');
const SECRET_KEY = require('../../falc-eye-hw-invite-key-ou6pw5e5.json').secret;

let HOST = 'https://falkai.xyz';
if (process.env.NODE_ENV !== 'production') {
  HOST = 'localhost:5005';
}
const LOGIN_REDIRECT = '/profile';

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  apiAccount.client_id,
  apiAccount.client_secret,
  apiAccount.redirect_url
);
oauth2Client.setCredentials({ refresh_token: apiAccount.refresh_token })
// The code to authenticate a user by comparing a given username-password combination
function initPassport() {
  //console.log("Passport initialized");
  logger.info("Passport initialized", {src: "user/init.js"});
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
        if (!docData.verified) {
          return done(null, false);
        }
        if (docData.ban_until > Math.floor(Date.now() / 1000)) {
          return done(null, false);
        }

        bcrypt.compare(password, docData.password, (err, isSame) => {
          if (err) {
            console.log(`Error in comparing passwords. ${err}`);
            return done(err, false);
          }
          if (!isSame) {
            //console.log(`Passwords do not match. User: ${docData.password} ${password}`);
            return done(null, false);
          }
          console.log(`Succesfully logged in ${username}`);
          passportStore.set(doc.id, {id: doc.id, data: docData}, err => {if(err){console.log(err)}})
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
  app.post('/login', (req, res, next) => {
    // Check info first to return custom error message
    let username = req.body.username;
    if (!username) { 
      res.redirect('/login?e=1');
      return;
    }
    authUserDB.getUsers(username).then(doc => {
      var docData = doc.data();
      if (!docData) {
        res.redirect('/login?e=1');
        return;
      }
      if (!docData.verified) {
        res.redirect('/login?e=2');
        return;
      }
      if (docData.ban_until > Math.floor(Date.now() / 1000)) {
        res.redirect('/login?e=3');
        return;
      }
      // Pass the request to the passport authenticator
      passport.authenticate('local', { failureRedirect: '/login?e=1' })(req, res, next);
    })
  }, (req, res) => {
    req.session.user = req.session.passport.user;
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

  app.post('/register', (req, res) => {
    let username = req.body.username;
    let pass = req.body.password;
    let email = req.body.email;
    let currentTime = Math.floor(Date.now() / 1000);
    let ipaddr = req.ip;
    let grecaptchaToken = req.body['g-recaptcha-response'];
    new Promise((resolve, reject) => {
      request.post(
        'https://www.google.com/recaptcha/api/siteverify',
        { form: {
          secret: grecaptchaAccount.secret,
          response: grecaptchaToken,
          remoteip: ipaddr 
        } },
        function(err, response, captchaResponse) {
          if (!err && response.statusCode == 200) {
            resolve(JSON.parse(captchaResponse));
          } else {
            reject(err);
          }
        }
      );
    }).then(body => {
      if (!body.success) {
        res.redirect('/register?e=4');
        return;
      }
      if (!username || !pass || !isEmailFormat(email)) {
        res.redirect('/register?e=1');
        return;
      }
      authUserDB.getUsers(username).then(userDoc => {
        if (userDoc) {
          if (!userDoc.get('verified') && (email == userDoc.get('email'))) {
            sendVerificationEmail(email, username, app);
            res.redirect('/register?e=5'); // Resent verification email
            return;
          }
          res.redirect('/register?e=3'); // Username taken
          return;
        }
        authUserDB.createUser(username, pass, email, ipaddr, currentTime).then(result => {
          if (!result) {
            res.redirect('/register?e=2');
            return;
          }
          sendVerificationEmail(email, username, app);
          res.redirect('/new-user');
        })
      })
    }).catch(err => {
      console.log(err);
      res.redirect('/register?e=2');
    })
  });

  app.get('/register', (req, res) => {
    res.render('register', {captchaKey: grecaptchaAccount.site});
  })
  
  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

  app.get('/verify', (req, res) => {
    let token = req.query.token;
    if (!token) {
      // Bad verification
      res.redirect('/');
      return;
    }
    let userOpt = verifyEmailToken(token);
    if (userOpt) {
      authUserDB.verifyUser(userOpt).then(updates => {
        res.redirect('/login?v=1');
      })
    } else {
      // Bad verification
      res.redirect('/');
    }
  });
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

function isEmailFormat(email) {
  var matchesEmail = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~\.-]+@[a-zA-Z0-9\.-]+/.test(email);
  return matchesEmail;
}

// Takes in app as parameter to use the handlebars render function
function sendVerificationEmail(email, username, app) {
  const accessToken = oauth2Client.getAccessToken();
  var transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: 'falkai.app@gmail.com',
      clientId: apiAccount.client_id,
      clientSecret: apiAccount.client_secret,
      refreshToken: apiAccount.refresh_token,
      accessToken: accessToken
    }
  });
  const verifyURL = HOST + '/verify?token=' + createEmailVerificationToken(username);
  return new Promise((resolve, reject) => {
    app.render('email-template', {
      layout: 'empty',
      username: username,
      verifyURL: verifyURL
    }, (err, emailContent) => {
      var mailOptions = {
        from: 'falkai.app@gmail.com',
        to: email,
        subject: 'Finish your Falkai registration',
        html: emailContent
      };
      transport.sendMail(mailOptions, function(err, info) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          console.log('Email sent: ' + info.response);
          resolve(info.response);
        }
      })
    });
  });
}

function createEmailVerificationToken(username) {
  let expires = Math.floor(Date.now() / 1000) + 3600;
  let combined_string = username + '.' + expires;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(combined_string);
  let hash = hmac.digest('hex');
  let linkToken = Buffer.from(combined_string).toString('hex') + '-' + hash;
  return linkToken;
}

function verifyEmailToken(token) {
  let tokenData = Buffer.from(token.split('-')[0], 'hex').toString('utf8');
  let tokenHash = token.split('-')[1]
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(tokenData);
  let hash = hmac.digest('hex');
  if (!(tokenHash === hash)) {
    console.log(`[LOG] user/init.js: Email verification failed ${tokenData}`)
    return false;
  }
  let username = tokenData.split('.')[0];
  let expires = tokenData.split('.')[1];
  if (Date.now() / 1000 > expires) {
    console.log(`[LOG] user/init.js: Expired email verification ${tokenData}`);
    return false;
  }
  return username;
}

module.exports = {
    initPassport: initPassport,
    initUser: initUser,
    init: init
}
