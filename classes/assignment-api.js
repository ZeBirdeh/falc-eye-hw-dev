const assignDB = require('./assignment-db.js'); 

function init(app) {
  // Middleware for the feed api
  function feedMiddleware(req, res, next) {
    if (!req.isAuthenticated()) {
      res.json({status: "unauthenticated"})
      return
    }
    let userID = "default";
    if (req.user) {
      userID = req.user.id;
    }
    let isPOST = !req.query.class;
    let classID = isPOST ? req.body.class : req.query.class;
    let assignID = isPOST ? req.body.assign : req.query.assign;
    if (!userID || !classID || !assignID) {
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
      res.json(status);
    })
  })

  app.post('/api/feed/view-assignment', feedMiddleware, (req, res) => {
    userID = req.user.id;
    classID = req.body.class;
    assignID = req.body.assign;
    assignDB.addAssignmentView(userID, classID, assignID).then(ref => {
      if (!ref) {
        res.json({status: 'failure'})
        return
      }
      res.json({status: 'success'})
    })
  })

  app.post('/api/feed/update-assignment', feedMiddleware, (req, res) => {
    userID = req.user.id;
    classID = req.body.class;
    assignID = req.body.assign;
    completion = req.body.completion;
    assignDB.setAssignmentCompletion(userID, classID, assignID, completion).then(ref => {
      if (!ref) {
        res.json({status: 'failure'})
        return
      }
      // ref is a write result
      res.json({status: 'success'})
    }).catch(err => { console.error(err); })
  })
}

// Removes all non-alphanumeric characters from a string
function cleanAlpha(inputStr) {
  return inputStr.replace(/[^0-9a-zA-Z]/g, '')
}

module.exports = {
  init: init
}