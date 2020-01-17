// Middleware for the app to check if user is logged in
function authenticationMiddleware() {
    return function(req, res, next) {
        if (req.isAuthenticated()) {
            //console.log(`Authenticated ${req.user.data.username}`);
            return next(); // Return so the rest of the function isn't called
        }
        console.log(`Failed to authenticate`)
        res.redirect('/login');
    }
}

module.exports = authenticationMiddleware;