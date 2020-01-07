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
    let classObj = {name: className, description: classDesc, school: classSchool};
    let classRef = classDB.createClass(classObj)
    classRef.then(ref => {
      if (ref === null) {
        console.log('[LOG] create-class: Invalid input given');
        res.redirect('/classes/form/new?e=1');
      } else {
        console.log('[LOG] create-class: Added document with ID ', ref.id);
        classDB.enrollStudent(req.user.data.username, ref.id, true).then(enrollRef => {
          console.log(`[LOG] create-class: Set ${req.user.data.username} as admin of ${ref.id}`);
          res.redirect('/classes/' + ref.id + '/home');
        });
      }
    });
  });
}

module.exports = {
  init: init
}