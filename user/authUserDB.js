const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
var db = admin.firestore();

function getUsers(username) {
    var userRef = db.collection('users');
    var getDoc = userRef.where('username', '==', username).get().then(snapshot => {
        if (snapshot.empty) {
            console.log('No matching users.');
            return;
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
        return;
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

function createUser(username, pass, email, ipaddr, createTime) {
    var userRef = db.collection('users');
    return new Promise((resolve, reject) => {
        bcrypt.hash(pass, 12, function(err, hash) {
            if (err) {
                resolve(null);
            }
            var aDoc = userRef.add({
                username: username,
                password: hash,
                email: email,
                ip_addr: ipaddr,
                created: createTime,
                ban_until: 0,
                reports: 0,
                verified: false
            })
            resolve(aDoc);
        });
    });
}

function verifyUser(username) {
    let userRef = db.collection('users');
    let updateDoc = userRef.where('username', '==', username).get().then(snapshot => {
        if (snapshot.empty) {
            console.log('No matching users.');
            return;
        }

        var users = [];
        snapshot.forEach(doc => {
            console.log(`[LOG] authUserDB: Verified user ${username}`);
            users.push(userRef.doc(doc.id).update({ verified: true }));
        });
        return users;
    })
    return updateDoc;
}

module.exports = {
    getUsers: getUsers,
    getUserById: getUserById,
    createUser: createUser,
    verifyUser: verifyUser
}