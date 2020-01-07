const getClasses = require('./get-classes.js');
const createClass = require('./create-class.js');
const createAssignment = require('./create-assignment.js')

function init(app) {
    getClasses.init(app);
    createClass.init(app);
    createAssignment.init(app);
}

// Import required modules
const express = require('express');
const hbs = require('express-handlebars');
const path = require('path');
const render = require('./render');

const app = express();

// Set the engine for viewing
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'main',
    helpers: render,
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials')
 }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

init(app);

module.exports = app;