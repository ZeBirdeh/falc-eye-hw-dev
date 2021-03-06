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
      let docData = doc.data();
      docData.id = doc.id;
      docData.classID = classID;
      assignments.push(docData);
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

// Delete an assignment
function deleteAssignment(classID, assignID) {
  let assignDoc = db.collection('classes').doc(classID).collection('assignments').doc(assignID);
  let docDeletes = deleteInteractions(assignDoc);
  let deleteDoc = assignDoc.delete();
  return deleteDoc;
}

// Delete all interactions for a specific deleted assignment
function deleteInteractions(assignDoc) {
  let interRef = db.collection('interactions');
  return interRef.where('assignment', '==', assignDoc).get().then(snapshot => {
    let docDeletes = [];
    snapshot.forEach(interDoc => {
      docDeletes.push(interRef.doc(interDoc.id).delete());
    })
    return docDeletes;
  })
}

// Delete class, including all assignments, interactions, and enrollments of class
function deleteClassAssignments(classID) {
  let classDoc = db.collection('classes').doc(classID);
  let assignRef = classDoc.collection('assignments');
  let enrollRef = db.collection('class-enrollment');
  return assignRef.get().then(snapshot => {
    snapshot.forEach(assignSnap => {
      let assignDoc = assignRef.doc(assignSnap.id);
      deleteInteractions(assignDoc);
      assignDoc.delete();
    })
    enrollRef.where('class', '==', classDoc).get().then(snapshot2 => {
      snapshot2.forEach(enrollSnap => {
        enrollRef.doc(enrollSnap.id).delete();
      })
      classDoc.delete();
    })
  })
}

// Update completion if done
function getAssignmentStatus(userID, classID, assignID) {
  let assignDoc = db.collection('classes').doc(classID).collection('assignments').doc(assignID);
  let userDoc = db.collection('users').doc(userID);
  let interRef = db.collection('interactions')
  let aDoc = interRef.where('assignment', '==', assignDoc).where('user', '==', userDoc).get().then(snapshot => {
    if (snapshot.empty) {
      return {status: 'new', completion: 0};
    }
    var results = [];
    snapshot.forEach(doc => {
      results.push(doc.data().completion);
    });
    if (results[0] >= 100) {
      return {status: 'completed', completion: results[0]};
    } else {
      return {status: 'viewed', completion: results[0]};
    }
  })
  return aDoc;
}

function addAssignmentView(userID, classID, assignID) {
  let assignDoc = db.collection('classes').doc(classID).collection('assignments').doc(assignID);
  let userDoc = db.collection('users').doc(userID);
  let interRef = db.collection('interactions');
  let aDoc = interRef.where('assignment', '==', assignDoc).where('user', '==', userDoc).get().then(snapshot => {
    if (snapshot.empty) {
      let newDoc = interRef.add({
        assignment: assignDoc,
        user: userDoc,
        completion: 0
      });
      return newDoc;
    }
  });
  return aDoc;
}

// Returns promise with list of docs
function setAssignmentCompletion(userID, classID, assignID, completion) {
  if (!(parseInt(completion) == completion) || (completion < 0) || (completion > 100)) {
    return new Promise((res, rej) => {res(null)});
  }
  let assignDoc = db.collection('classes').doc(classID).collection('assignments').doc(assignID);
  let userDoc = db.collection('users').doc(userID);
  let interRef = db.collection('interactions')
  let aDoc = interRef.where('assignment', '==', assignDoc).where('user', '==', userDoc).get().then(snapshot => {
    if (snapshot.empty) {
      return;
    }
    var results = [];
    snapshot.forEach(doc => {
      results.push(interRef.doc(doc.id).update({ completion: parseInt(completion) }));
    });
    return Promise.all(results);
  });
  return aDoc;
}

module.exports = {
  getAllAssignments: getAllAssignments,
  createAssignment: createAssignment,
  deleteAssignment: deleteAssignment,
  deleteClassAssignments: deleteClassAssignments,
  getAssignmentStatus: getAssignmentStatus,
  addAssignmentView: addAssignmentView,
  setAssignmentCompletion: setAssignmentCompletion
}