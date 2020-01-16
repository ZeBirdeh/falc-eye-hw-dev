const assignDB = require('./assignment-db.js'); 
const classDB = require('./class-db.js')
const crypto = require('crypto');
const base58 = require('base-58');

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
  function adminMiddleware(req, res, next) {
    if (!req.isAuthenticated()) {
      res.json({status: 'unauthenticated'});
      return;
    }
    let username = req.user.data.username;
    let classID = req.params.classid;
    classDB.enrollStatus(username, classID).then(userStatus => {
      if (!userStatus.admin) {
        res.json({status: 'unauthorized'});
        return;
      }
      return next();
    }).catch(err => {
      console.error(err);
      res.json({status: 'error'});
    });
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

  app.post('/api/feed/delete-assignment', feedMiddleware, (req, res) => {
    let username = req.user.data.username;
    let classID = req.body.class;
    let assignID = req.body.assign;
    classDB.enrollStatus(username, classID).then(userStatus => {
      if (!userStatus.admin) {
        res.json({status: 'unauthorized'});
        return;
      }
      assignDB.deleteAssignment(classID, assignID).then(() => {
        console.log(`[LOG] assignment-api: Deleted assignment ${assignID}`)
        res.json({status: 'success'})
      }).catch(err => { console.error(err); })
    });
  })

  // API call, get invite links
  app.get('/api/:classid/get-invites', adminMiddleware, (req, res) => {
    let classID = req.params.classid;
    classDB.getClassInvites(classID).then(invites => {
      if (invites === null) {
        res.json({status: 'error'});
        return;
      }
      let validInvites = [];
      let timeNow = Date.now() / 1000;
      invites.forEach(invite => {
        if (invite.expires > timeNow) {
          validInvites.push(invite);
        }
      })
      res.json({status: 'success', invites: validInvites});
    });
  })
  // API call, post to get valid token and add to invites database
  app.post('/api/:classid/new-invite', adminMiddleware, (req, res) => {
    // Check that user is an admin of the class of classID
    let classID = req.params.classid;
    let expires = Math.floor(Date.now() / 1000) + parseInt(req.body.duration);
    if (isNaN(expires)) { 
      res.json({status: 'invalid'});
      return;
    }
    new Promise(genToken).then(validToken => {
      console.log('[LOG] assignment-api: Valid token generated')
      classDB.addInviteLink(classID, expires, validToken).then(inviteDoc => {
        console.log(`[LOG] get-classes: New invite link ${validToken} for ${classID}`);
        res.json({status: 'success', invite:{id: validToken, expires: expires}});
      })
    }).catch(err => {
      console.error(err);
      res.json({status: 'error'});
    })
  });

  app.get('/api/:classid/get-users', adminMiddleware, (req, res) => {
    let startName = req.user.data.startName;
    let classID = req.params.classid;
    if (!startName) { startName = '' }
    classDB.getEnrolledSortByName(classID, startName, 20).then(usersList => {
      res.json({status: 'success', users: usersList});
    }).catch(err => {
      console.error(err);
      res.json({status: 'error'});
    });
  });
}

// Creates a whole ton of nested promises
function genToken(resolve, reject, c = 0) {
  crypto.randomBytes(6, function(ex, buf) {
    let token = base58.encode(buf);
    classDB.checkInviteUsed(token).then(isUsed => {
      if (isUsed) {
        if (c < 10) {
          genToken(resolve, reject, c + 1);
        } else { // Stop once it makes 10 attemps
          reject('too many calls')
        }
      } else {
        resolve(token);
      }
    }).catch(err => {
      console.log('[WARN] get-classes: Failed to generate token')
      console.error(err);
      reject(err);
    })
  });
}

// Removes all non-alphanumeric characters from a string
function cleanAlpha(inputStr) {
  return inputStr.replace(/[^0-9a-zA-Z]/g, '')
}

module.exports = {
  init: init
}