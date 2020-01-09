const path = require('path');
const classDB = require('./class-db.js');
const assignDB = require('./assignment-db.js'); 

function init(app) {
  // Middleware for the feed api
  function feedMiddleware(req, res, next) {
    if (!req.isAuthenticated()) {
      res.json({status: "unauthenticated"})
      return
    }
    userID = "default";
    if (req.user) {
      userID = req.user.id;
    }
    classID = req.query.class;
    assignID = req.query.assign;
    if ((!userID) || (!classID) || (!assignID)) {
      console.log(`${classID} / ${!classID}`);
      res.json({status: "error"})
      return
    }
    [userID, classID, assignID].forEach(str => { // Check if alphanumeric
      if (!(str == cleanAlpha(str))) {
        res.json({status: "invalid"})
        return
      }
    })
    return next();
  }
  // API to get assignment status. needs classID, assignID
  app.get('/api/feed/assignment-status', feedMiddleware, (req, res) => {
    userID = req.user.id;
    classID = req.query.class;
    assignID = req.query.assign;
    assignDB.getAssignmentStatus(userID, classID, assignID).then(status => {
      res.json({status: status});
    })
  })

  app.post('/api/feed/complete-assignment', feedMiddleware, (req, res) => {
    userID = req.user.id;
    classID = req.query.class;
    assignID = req.query.assign;
    assignDB.setAssignmentCompleted(userID, classID, assignID).then(ref => {
      if (!ref) {
        res.json({status: 'failure'})
        return
      }
      ref.then(docs => {
        docs.forEach(doc => {
          let docData = doc.data();
          console.log(`[LOG] assignment-api: Set ${docData.assignment.id} completed for ${docData.user.id}`)
        })
      })
      res.json({status: 'success'})
    })
  })
}

// Removes all non-alphanumeric characters from a string
function cleanAlpha(inputStr) {
  return inputStr.replace(/[^0-9a-zA-Z]/g, '')
}

module.exports = {
  init: init
}