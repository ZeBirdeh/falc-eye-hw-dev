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

module.exports = {
    getUsers: getUsers,
    getUserById: getUserById
}