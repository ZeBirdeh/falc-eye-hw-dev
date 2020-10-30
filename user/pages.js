const path = require('path');
const changelogFile = fs.readFileSync(path.join(__dirname, '..', '..', 'CHANGELOG.txt'));

// Set up app pages
function init(app) {
  app.get('/guide', (req, res) => {
    res.render('guide');
  })

  app.get('/about', (req, res) => {
    res.render('about');
  })

  app.get('/new-user', (req, res) => {
    res.render('new-user');
  })

  app.get('/updates', (req, res) => {
    res.render('updates', {changelog: changelogFile});
  })
}

module.exports = {
  init: init
}