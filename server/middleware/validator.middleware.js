const mongoose = require('mongoose');
const { error } = require('../utils/apiResponse');

/**
 * Validates that the provided ID is a valid MongoDB ObjectId.
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, `Invalid ID format: ${id}`, 400);
    }
    next();
  };
};

module.exports = { validateObjectId };
