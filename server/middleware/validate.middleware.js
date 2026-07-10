const mongoose = require('mongoose');
const validator = require('validator');
const { error } = require('../utils/apiResponse');

/**
 * Sanitizes request body by trimming and escaping strings to prevent XSS.
 */
const sanitizeBody = (fields = []) => {
  return (req, res, next) => {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (fields.length === 0 || fields.includes(key)) {
          if (typeof req.body[key] === 'string') {
            req.body[key] = validator.trim(validator.escape(req.body[key]));
          }
        }
      });
    }
    next();
  };
};

/**
 * Strict MongoDB ObjectId validation.
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return error(res, `Invalid resource identifier: ${id}`, 400);
    }
    next();
  };
};

module.exports = { sanitizeBody, validateObjectId };
