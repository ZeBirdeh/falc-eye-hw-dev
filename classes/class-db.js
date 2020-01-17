const admin = require('firebase-admin');
const path = require('path');
var db = admin.firestore();

// Takes in classObj where the 'school' field should be the name of the school document
function createClass(classObj) {
  let result = getSchool(classObj.school).then(schoolDoc => {
    if (!schoolDoc) {
      // School does not exist
      return;
    }
    let addDoc = db.collection('classes').add({
      name: classObj.name,
      description: classObj.description,
      school: db.doc('schools/'+schoolDoc.id),
      post_perm: classObj.post_perm
    });
    return addDoc;
  })
  return result
}

function updateClass(classID, name, desc) {
  let classDoc = db.collection('classes').doc(classID);
  let update = classDoc.update({name: name, description: desc});
  return update;
}

function getClassFromID(classID) {
  var classRef = db.collection('classes').doc(classID);
  var getDoc = classRef.get().then(doc => {
    if (!doc.exists) {
      console.log(`[WARN] classes/init.js: No class found with ID ${classID}`);
      return null;
    } else {
      let docData = doc.data();
      return docData;
    }
  })
  return getDoc;
}

function getClassSchoolDataFromID(classID) {
  var classRef = db.collection('classes').doc(classID);
  var getDoc = classRef.get().then(doc => {
    if (!doc.exists) {
      console.log(`[WARN] classes/init.js: No class found with ID ${classID}`);
      return null;
    } else {
      let docData = doc.data();
      return docData.school.get().then(schoolDoc => {
        let schoolData = schoolDoc.data();
        docData.schoolData = schoolData;
        docData.id = classID;
        return docData;
      });
    }
  })
  return getDoc;
}
  
// "school" is an integer string, for the doc-id
function getClasses(school) {
  var classRef = db.collection('classes');
  var schoolRef = db.collection('schools').doc(school);
  var getDoc = classRef.where('school', '==', schoolRef).get().then(snapshot => {
    if (snapshot.empty) {
      console.log('No matching documents.');
      return { "classes": [] };
    }
  
    var classes = [];
    snapshot.forEach(doc => {
      classes.push(doc.data());
    });
    // Return a JSON object with the list of classes under "classes" 
    return { "classes": classes };
  }).catch(err => {
    console.log('Error getting documents', err);
  })
  return getDoc;
}

// Get school doc by school name, names should be unique
function getSchool(schoolName) {
  let schoolRef = db.collection('schools');
  let schoolDoc = schoolRef.where('name', '==', schoolName).get().then(snapshot => {
    if (snapshot.empty) {
      return;
    }
    var schools = [];
    snapshot.forEach(doc => {
      schools.push({id: doc.id, data: doc.data()});
    });
    if (schools.length > 0) {
      return schools[0];
    } else {
      return;
    }
  })
  return schoolDoc;
}

// Returns an array of schools starting with schoolName
function getSchoolStartingWith(schoolName) {
  let schoolRef = db.collection('schools');
  let slen = schoolName.length;
  let ubound = schoolName.substring(0, slen-1) +
    String.fromCharCode(schoolName.charCodeAt(slen-1) + 1);
  let schoolDoc = schoolRef.where('name', '>=', schoolName).where('name', '<', ubound)
    .get().then(snapshot => {
      if (snapshot.empty) {
        return [];
      }
      var schools = [];
      snapshot.forEach(doc => {
        schools.push(doc.data());
      });
      return schools;
    })
  return schoolDoc;
}

// Enroll a student in a class, and supply whether they are an administrator
// Returns the status
function enrollStudent(username, classID, isAdmin) {
  let classDoc = db.collection('classes').doc(classID);
  let enrollmentRef = db.collection('class-enrollment');
  let aDoc = enrollStatus(username, classID).then(status => {
    if (status.enrolled) {
      return;
    }
    console.log(`[LOG] create-class: Set ${username} as ${isAdmin ? 'admin' : 'member'} of ${classID}`);
    let addDoc = enrollmentRef.add({
      admin: isAdmin,
      banned: false,
      class: classDoc,
      hidden: false,
      username: username
    });
    return addDoc;
  })
  return aDoc;
}

// Checks whether given user is enrolled and returns their role
function enrollStatus(username, classID) {
  let classDoc = db.collection('classes').doc(classID);
  let enrollmentRef = db.collection('class-enrollment');
  let getRef = enrollmentRef.where('username', '==', username).where('class', '==', classDoc);
  let getDoc = getRef.get().then(snapshot => {
    if (snapshot.empty) {
      console.log('No matching documents.');
      // Not enrolled in the class
      return { enrolled: false, admin: false, banned: false };
    }
    
    let isAdmin = false;
    let isBanned = false;
    snapshot.forEach(doc => {
      if (doc.get('admin')) { isAdmin = true; }
      if (doc.get('banned')) { isBanned = true; }
    })
    // Return admin status
    return { enrolled: !isBanned, admin: (!isBanned && isAdmin), banned: isBanned };
  })
  return getDoc;
}

// Get all enroll docs for a specific class sorted by name
function getEnrolledSortByName(classID, startAt, limit=20) {
  let classDoc = db.collection('classes').doc(classID);
  let enrollmentRef = db.collection('class-enrollment');
  let aDoc = enrollmentRef.where('class', '==', classDoc).where('username', '>', startAt)
    .orderBy('username').limit(limit).get().then(snapshot => {
    let enrolledUsers = [];
    snapshot.forEach(doc => {
      enrolledUsers.push({
        username: doc.get('username'),
        isAdmin: doc.get('admin'),
        isBanned: doc.get('banned')
      });
    })
    return enrolledUsers;
  })
  return aDoc;
}


function banUser(username, classID) {
  let classDoc = db.collection('classes').doc(classID);
  let enrollmentRef = db.collection('class-enrollment');
  let aDoc = enrollmentRef.where('username', '==', username).where('class', '==', classDoc)
    .get().then(snapshot => {
    if (snapshot.empty) {
      return;
    }
    let enrollDocs = [];
    snapshot.forEach(doc => {
      enrollDocs.push(doc.id);
    })
    return enrollmentRef.doc(enrollDocs[0]).update( { banned: true } );
  })
  return aDoc;
}

function removeUser(username, classID) {
  let classDoc = db.collection('classes').doc(classID);
  let enrollmentRef = db.collection('class-enrollment');
  let aDoc = enrollmentRef.where('username', '==', username).where('class', '==', classDoc)
    .get().then(snapshot => {
    if (snapshot.empty) {
      return;
    }
    let enrollDocs = [];
    snapshot.forEach(doc => {
      enrollDocs.push(doc.id);
    })
    return enrollmentRef.doc(enrollDocs[0]).delete();
  })
  return aDoc;
}

// Gets all invite links corresponding to a class
function getNumClassInvites(classID) {
  let inviteRef = db.collection('invites');
  let sizeProm = inviteRef.where('class', '==', classID).get().then(snapshot => {
    return snapshot.size;
  })
  return sizeProm;
}
function getClassInvites(classID) {
  let inviteRef = db.collection('invites');
  let sizeProm = inviteRef.where('class', '==', classID).get().then(snapshot => {
    if (snapshot.empty) {
      return [];
    }
    let invites = [];
    snapshot.forEach(doc => {
      let docData = doc.data();
      docData.id = doc.id;
      invites.push(docData);
    });
    return invites;
  }).catch(err => {
    console.error(err);
  })
  return sizeProm;
}

// Gets non-expired invites with specific
function checkInviteUsed(token) {
  let inviteDoc = db.collection('invites').doc(token);
  let aDoc = inviteDoc.get().then(doc => {
    if (!doc.exists) {
      return false;
    }
    let expireTime = doc.get('expires');
    if ((Date.now() / 1000) > parseInt(expireTime) + 3 * 24 * 3600) {
      return false;
    } else {
      return true;
    }
  });
  return aDoc;
}

function getInvite(token) {
  let inviteDoc = db.collection('invites').doc(token);
  let aDoc = inviteDoc.get().then(doc => {
    if (!doc.exists) {
      return;
    }
    return doc.data();
  });
  return aDoc;
}

// Adds a new invite link to the database
function addInviteLink(classID, expires, token) {
  let inviteRef = db.collection('invites').doc(token);
  let inviteDoc = null;
  if (expires === false) {
    inviteDoc = inviteRef.set({
      class: classID,
      expires: 0,
      permanent: true
    })
  } else {
    inviteDoc = inviteRef.set({
      class: classID,
      expires: expires,
      permanent: false
    });
  }
  return inviteDoc;
}

// Removes all non-alphanumeric/space/apostrophe/paren characters from a string
function cleanAlpha(inputStr) {
  return inputStr.replace(/[^0-9a-zA-Z \'()]/g, '')
}

module.exports = {
  createClass: createClass,
  updateClass: updateClass,
  getClassFromID: getClassFromID,
  getClassSchoolDataFromID: getClassSchoolDataFromID,
  getClasses: getClasses,
  enrollStudent: enrollStudent,
  enrollStatus: enrollStatus,
  banUser: banUser,
  removeUser: removeUser,
  checkInviteUsed: checkInviteUsed,
  getEnrolledSortByName: getEnrolledSortByName,
  getNumClassInvites: getNumClassInvites,
  getClassInvites: getClassInvites,
  getInvite: getInvite,
  addInviteLink: addInviteLink
}