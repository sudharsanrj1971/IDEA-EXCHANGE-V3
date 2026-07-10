const logger = require('../utils/logger');

/**
 * Global Error Handler middleware.
 */
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for internal tracking
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });

  // Handle Specific Errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map(el => el.message).join('. ')
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate field value: ${value}. Please use another value!`
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your token has expired. Please log in again.'
    });
  }

  // Default Generic Error
  res.status(err.statusCode).json({
    success: false,
    message: err.isOperational ? err.message : 'Internal Server Error'
  });
};

module.exports = globalErrorHandler;
