// Initialize Firebase
const admin = require('firebase-admin');
// const functions = require('firebase-functions');
// Initialize admin on Firebase functions
var serviceAccount = require("../falc-eye-hw-firebase-adminsdk-yk7ia-bff85ceeee.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://falc-eye-hw.firebaseio.com"
});

// Import required modules
const express = require('express');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const authentication = require('./user');
authentication.initPassport();

const app = express();

// Set the engine for viewing
app.engine('hbs', hbs({
   extname: 'hbs',
   helpers: {
      section: function(name, options){
          if(!this._sections) this._sections = {};
          this._sections[name] = options.fn(this);
          return null;
      }
   },
   defaultLayout: 'main'
}));
app.set('views', path.join(__dirname, 'views') );
app.set('view engine', 'hbs');

// Middleware
app.use(bodyParser.urlencoded({
   extended: false
}));

// Static app for files in /classes
app.use('/static', express.static(path.join(__dirname, 'public')))

// Initialize cookies and session
authentication.initSession(app);

// Initializing different parts of the app
// Classes section is now its own app
const classesApp = require('./classes')
app.use('/classes', classesApp);
authentication.init(app);

app.get('/', (req, res) => {
   res.render('home');
})

app.use((req, res) => {
   res.status(404);
   res.render('404');
})

app.listen(5005, function(){
  console.log('Express server listening on port 5005');
});