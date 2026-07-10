/**
 * Standard success response helper.
 */
const success = (res, data, code = 200) => {
  return res.status(code).json({
    success: true,
    data
  });
};

/**
 * Standard error response helper.
 */
const error = (res, message, code = 500) => {
  return res.status(code).json({
    success: false,
    message
  });
};

module.exports = {
  success,
  error
};
