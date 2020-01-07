const admin = require('firebase-admin');
var db = admin.firestore();

function getUsers(username) {
  var userRef = db.collection('users');
    var getDoc = userRef.where('username', '==', username).get().then(snapshot => {
      if (snapshot.empty) {
        console.log('No matching users.');
        return {};
      }

      var users = [];
      snapshot.forEach(doc => {
        users.push(doc);
      });
      console.log(`User found with username ${users[0].data().username}`);
      // Returns the document object, so will have to call doc.data() on it
      return users[0];
    }).catch(err => {
      console.log('Error getting documents', err);
      return {};
  });
  return getDoc;
}

// Returns user doc
function getUserById(id) {
  var userRef = db.collection('users').doc(id);
  var getDoc = userRef.get().then(doc => {
      if (!doc.exists) {
          return {};
      } else {
          return {id: doc.id, data: doc.data()};
      }
  }).catch((err) => {
    return {};
  });
  return getDoc;
}

// Take in a user and return all the classes they belong to
// The output is an object whose value for "class" is the array of classes
// { classes: [ {id: string, data: Object} ] }
function getClasses(username) {
  var userRef = db.collection('class-enrollment');
  var getDoc = userRef.where('username', '==', username).get().then(snapshot => {
    if (snapshot.empty) {
      console.log('[LOG] user-db: No enrolled classes');
      return null;
    }

    // Produce an array of promises to chain together in order to return only
    // after all data from each document in the snapshot is pushed to an array
    var dataGetPromises = []
    snapshot.forEach(doc => {
      var docData = doc.data();
      if (docData.class) {
        dataGetPromises.push(docData.class.get());
      }
    });
    // Resolve all the promises, then take the querysnapshots and add all of the data
    // to the list, then finally return the data list
    var userClasses = [];
    var resultsPromise = Promise.all(dataGetPromises).then(promiseResults => {
      promiseResults.forEach(classesDoc => {
        // classesDoc is a class document, return object with id and its data
        console.log(`[LOG] user-db: Found class ${classesDoc.data().name}`);
        userClasses.push({id: classesDoc.id, data: classesDoc.data()});
      });
    }).then(() => {
      console.log(`[LOG] user-db: Found collection of classes for ${username}`);
      // Returns the document object, so will have to call doc.data() on it
      return new Promise((res, rej) => {res({classes: userClasses})});
    });
    return resultsPromise;
  }).catch(err => {
    console.log('[WARN] user-db: Error getting documents', err);
    return null;
  });
  return getDoc;
}

module.exports = {
  getUsers: getUsers,
  getUserById: getUserById,
  getClasses: getClasses
}