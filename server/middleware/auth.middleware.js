const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { error } = require('../utils/apiResponse');

/**
 * Authenticates users via httpOnly Cookies.
 * Environment-specific fallback to Bearer header for dev/testing.
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = req.cookies.accessToken;

    // Fallback for development/Postman if cookies are not practical
    if (!token && process.env.NODE_ENV === 'development') {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return error(res, 'Access denied: Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return error(res, 'Identity verification failed', 401);
    }

    if (user.isBanned) {
      return error(res, 'Access suspended for policy violations', 403);
    }

    // Attach user to req
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Session expired. Please refresh.', 401);
    }
    return error(res, 'Invalid authentication payload', 401);
  }
};

module.exports = { verifyToken };
