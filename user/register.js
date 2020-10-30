const crypto = require('crypto');
const authUserDB = require('./auth-user-db.js');
const nodemailer = require('nodemailer');
const {google} = require('googleapis');
const request = require('request');
const {logger} = require('./user-logger.js');

const apiAccount = require('../../falc-eye-hw-google-api-u5kt7grp.json');
const grecaptchaAccount = require('../../falc-eye-hw-grecaptcha-rg2qm9fd0.json');
const SECRET_KEY = require('../../falc-eye-hw-invite-key-ou6pw5e5.json').secret;

let HOST = 'https://falkai.xyz';
if (process.env.NODE_ENV !== 'production') {
  HOST = 'localhost:5005';
}
const logMeta = {
  src: 'user/register.js'
}

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  apiAccount.client_id,
  apiAccount.client_secret,
  apiAccount.redirect_url
);
oauth2Client.setCredentials({ refresh_token: apiAccount.refresh_token })

function init(app) {
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
      logger.debug(`Creating new user ${username}`, logMeta);
      authUserDB.getUsers(username).then(userDoc => {
        if (userDoc) {
          logger.debug(`User ${username} exists, aborting`, logMeta);
          if (!userDoc.get('verified') && (email == userDoc.get('email'))) {
            logger.debug(`Sending verification email to ${email}`, logMeta);
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
    init: init
}
