const admin = require('firebase-admin');
const path = require('path');
var db = admin.firestore();

// Get an assignment from the database matching a class
function getAllAssignments(classID) {
  let assignRef = db.collection('classes').doc(classID).collection('assignments');
  let aDoc = assignRef.get().then(snapshot => {
    if (snapshot.empty) {
      return { "assignments": [] };
    }

    var assignments = [];
    snapshot.forEach(doc => {
      assignments.push(doc.data());
    });

    return { "assignments": assignments };
  }).catch(err => {
    console.log('[ERR] assignment-db.js: Error getting documents', err);
  });
  return aDoc;
}

// Create an assignment given class id and info (assuming class exists)
function createAssignment(classID, assignObj) {
  // Clean and verify input
  // console.log(`[LOG] assignment-db: ${JSON.stringify(assignObj, null, 2)}`)
  if (isNaN(assignObj.expires) || assignObj.expires < 0){
    return new Promise((res, rej) => {res(null)});
  }
  if (isNaN(assignObj.workload) || assignObj.workload < 0) {
    return new Promise((res, rej) => {res(null)});
  }
  assignObj.expires = parseInt(assignObj.expires);
  assignObj.workload = parseInt(assignObj.workload);
  assignObj.created = Math.floor(Date.now()/1000);
  // Valid input, create doc
  let assignRef = db.collection('classes').doc(classID).collection('assignments');
  let addDoc = assignRef.add(assignObj);
  return addDoc;
}

module.exports = {
  getAllAssignments: getAllAssignments,
  createAssignment: createAssignment
}