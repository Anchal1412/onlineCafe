const passport = require('passport');

const authMiddleware = passport.authenticate('user-jwt', { session: false });

module.exports = authMiddleware;