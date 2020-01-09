const path = require('path');
const authMiddleware = require('./authentication-middleware.js');
const classDB = require('./class-db.js');
const assignDB = require('./assignment-db.js'); 

function init(app) {
  app.get('/:classid/item/new', authMiddleware(), (req, res) => {
    let classID = req.params.classid;
    let classObj = res.locals.classObj;
    classDB.enrollStatus(req.user.data.username, classID).then(userStatus => {
      if ((userStatus.admin) || (userStatus.enrolled && classObj.post_perm)) {
        res.render('create-assignment', classObj);
      } else {
        res.render('no-auth');
      }
    });
  });

  app.post('/:classid/item/new', authMiddleware(), (req, res) => {
    let classID = req.params.classid;
    let classObj = res.locals.classObj;
    classDB.enrollStatus(req.user.data.username, classID).then(userStats => {
      if (!(userStats.admin) && !(userStatus.enrolled && classObj.post_perm)) {
        console.log('[LOG] create-assignment: No permissions');
        // No permissions
        res.redirect('/classes/' + classID + '/item/new?e=2');
        return;
      }
      if (!(req.body.title) || !(req.body.description) || !(req.body.duedate) || !(req.body.workload)) {
        // Empty input
        console.log('[LOG] create-assignment: Invalid input given');
        res.redirect('/classes/' + classID + '/item/new?e=1');
        return;
      }
      let assignObj = {
        title: req.body.title,
        description: req.body.description,
        expires: req.body.duedate,
        workload: req.body.workload
      }
      let assignRef = assignDB.createAssignment(classID, assignObj);
      assignRef.then(ref => {
        if (ref === null) {
          console.log('[LOG] create-assignment: Invalid input given');
          res.redirect('/classes/' + classID + '/item/new?e=1');
        } else {
          console.log(`[LOG] create-assignment: Created new item ${ref.id} in class ${classID}`);
          res.redirect('/classes/' + classID + '/feed');
        }
      });
    });
  });
}

module.exports = { init: init }