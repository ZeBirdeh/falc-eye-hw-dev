const path = require('path');
const classDB = require('./class-db.js');
const assignDB = require('./assignment-db.js'); 
const authMiddleware = require('./authentication-middleware.js');

// Get the classes that correspond to a certain school
function init(app) {
  // The number after /classes/school/# will be the school param
  app.get('/school/:school', (req, res) => {
    // Caches response for 60 seconds on user's browser
    res.set('Cache-Control', 'public, max-age=60, s-maxage=600');
    // Params for the school # in request.params
    var schoolNum = req.params.school;
    // School number must be a number and non-empty
    if (isNaN(schoolNum) || schoolNum === "") {
      // Only query for school #
      console.log("Error in getting school number. Request parameters: " + req.params);
      res.status(404).sendFile(path.join(__dirname, '404.html'));
      return;
    }
    console.log("[LOG] get-classes: Request made with school number " + schoolNum)
    classDB.getClasses(schoolNum).then(classesObj => {
      // Check to see how many classes there are.
      if (classesObj["classes"].length > 0) {
        res.render('class-list', classesObj);
      } else {
        // If there are none, direct to page that says no classes.
        res.sendFile(path.join(__dirname, 'no-classes.html'));
      }
    }).catch(err => {
      // Catches any exception and sends 404 page
      console.log('Failed to get schools.', err);
      res.status(404).sendFile(path.join(__dirname, '404.html'));
    });
  });

  // Middleware for each use of class id param, checks the validity of the id
  app.param('classid', (req, res, next, id) => {
    if (!isAlphaNumeric(id) || id === "") {
      res.sendFile(path.join(__dirname, '404.html'));
      return;
    }
    classDB.getClassSchoolDataFromID(id).then(classObj => {
      if (classObj) {
        // Sets the locals variable classObj
        res.locals.classObj = classObj
        next();
      } else {
        res.status(404).sendFile(path.join(__dirname, '404.html'));
      }
    }).catch(err => {
      // Catches any exception and sends 404 page
      console.log('[WARN] get-classes: Failed to get schools.', err);
      res.status(404).sendFile(path.join(__dirname, '404.html'));
    });
  });
  
  // Get class with given id
  app.get('/:classid/home', (req, res) => {
    let classID = req.params.classid;
    let classObj = res.locals.classObj;
    if (req.isAuthenticated()) {
      console.log(`[LOG] get-classes: Checking enroll status of ${req.user.data.username}`)
      // Show additional menus if authorized
      classDB.enrollStatus(req.user.data.username, classID).then(userStatus => {
        classObj.userStatus = userStatus;
        classObj.classID = classID;
        res.render('class-homepage-auth', classObj);
      });
    } else {
      res.render('class-homepage', classObj);
    }
  });
  
  // List all assignments for a specific class
  app.get('/:classid/feed', authMiddleware(), (req, res) => {
    let classID = req.params.classid;
    // Class ID must be non-empty and alphanumeric
    let classObj = res.locals.classObj;
    classDB.enrollStatus(req.user.data.username, classID).then(userStatus => {
      classObj.userStatus = userStatus;
      if (userStatus.enrolled) {
        assignDB.getAllAssignments(classID).then(assignObj => {
          assignObj.classObj = classObj;
          assignObj.classID = req.params.classid;
          assignObj.assignments.forEach(tempAssign => {
            tempAssign.isAuthor = (tempAssign.author == req.user.id);
          })
          res.render('class-feed', assignObj);
        })
      } else {
        res.render('no-auth', classObj);
      }
    });
  });

  // Settings for admins
  app.get('/:classid/settings', authMiddleware(), (req, res) => {
    let classID = req.params.classid;
    let classObj = res.locals.classObj;
    classDB.enrollStatus(req.user.data.username, classID).then(userStatus => {
      classObj.userStatus = userStatus;
      if (userStatus.admin) {
        assignDB.getAllAssignments(classID).then(assignObj => {
          assignObj.classObj = classObj;
          assignObj.classID = classID;
          res.render('class-dashboard-admin', assignObj);
        })
      } else {
        res.render('no-auth');
      }
    });
  })

  // Following invite link to enroll in class
  app.get('/invite/:inviteToken', (req, res) => {
    let inviteToken = req.params.inviteToken;
    if (req.isAuthenticated()) {
      if (!inviteToken || !isAlphaNumeric(inviteToken)) { 
        res.render('invalid-invite');
        return;
      }
      classDB.getInvite(inviteToken).then(inviteData => {
        if (!inviteData) {
          res.render('invalid-invite');
          return;
        }
        if (inviteData.expires < (Date.now() / 1000)) {
          res.render('invalid-invite');
          return;
        }
        classDB.enrollStudent(req.user.data.username, inviteData.class, false).then(enrollDoc => {
          // Render invite page that redirects after a second
          res.render('valid-invite', {class: inviteData.class});
        })
      }).catch(err => {
        console.error(err);
        res.render('invalid-invite');
      })
    } else {
      // Prompt user to log in
      let redirectStr = Buffer.from(req.url).toString('hex');
      res.redirect('/login?redirect='+redirectStr);
    }
  });

  // Using GET query on /classes instead of /classes/#
  // Same code as above except params switched for query, and does not cache
  app.get('/', (req, res) => {
    // Params for the school # in request.params
    let schoolNum = req.query.school;
    // School number must be a number and non-empty
    if (isNaN(schoolNum) || schoolNum === "") {
      console.log("Error in getting school number. Request query: " + req.query);
      res.status(404).sendFile(path.join(__dirname, '404.html'));
      return;
    }
    console.log("Request made to /classes with school number " + schoolNum)
    classDB.getClasses(schoolNum).then(classesObj => {
      // Check to see how many classes there are.
      if (classesObj.classes.length > 0) {
        res.render('class-list', classesObj);
      } else {
        // If there are none, direct to page that says no classes.
        res.sendFile(path.join(__dirname, 'no-classes.html'));
      }
    }).catch(err => {
      // Catches any exception and sends 404 page
      console.log('Failed to get schools.', err);
      res.status(404).sendFile(path.join(__dirname, '404.html'));
    });
  });
}

// Returns whether a string is comprised of only number and letter characters
function isAlphaNumeric(str) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  }
  return true;
};

module.exports = {
  init: init
}