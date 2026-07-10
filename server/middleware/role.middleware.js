const { error } = require('../utils/apiResponse');

/**
 * Middleware factory to restrict access based on user roles.
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, `Access denied. Requires one of roles: [${roles.join(', ')}]`, 403);
    }
    next();
  };
};

module.exports = { requireRole };
