const path = require('path');
const classDB = require('./class-db.js');
const authMiddleware = require('./authentication-middleware.js');


function init(app) {
  app.get('/form/new', authMiddleware(), (req, res) =>{
    res.render(path.join(__dirname, 'views', 'create-class'));
  });

  app.post('/form/create', authMiddleware(), (req, res) => {
    let className = req.body.name;
    let classDesc = req.body.description;
    let classSchool = req.body.school;
    let classPerms = (req.body.postperm == '1');
    if (!className || !classDesc || !classSchool) {
      console.log('[LOG] create-class: Invalid input given');
      res.redirect('/classes/form/new?e=1')
    }
    if ((classDesc.length > 2050) || (className.length > 200)) {
      console.log('[LOG] create-class: Invalid input given');
      res.redirect('/classes/form/new?e=1');
      return;
    }
    let classObj = {name: className, description: classDesc, school: classSchool, post_perm: classPerms};
    //console.log(JSON.stringify(classObj))
    classDB.createClass(classObj).then(ref => {
      if (!ref) {
        console.log('[LOG] create-class: Invalid input given');
        res.redirect('/classes/form/new?e=1');
      } else {
        console.log('[LOG] create-class: Added document with ID ', ref.id);
        classDB.enrollStudent(req.user.data.username, ref.id, true).then(enrollRef => {
          res.redirect('/classes/' + ref.id + '/home');
        });
      }
    }).catch(err => {
      console.error(err);
      res.redirect('/classes/form/new?e=1');
    });
  });
}

module.exports = {
  init: init
}