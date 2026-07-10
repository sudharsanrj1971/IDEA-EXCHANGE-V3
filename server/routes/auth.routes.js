const express = require('express');
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authLimiter, loginSlowDown } = require('../middleware/rateLimit.middleware');
const { error } = require('../utils/apiResponse');

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return error(res, errors.array()[0].msg, 400);
  next();
};

/**
 * FIX 03: CSRF Double-Submit Protection.
 * Public endpoint to fetch initial session-bound CSRF token.
 */
router.get('/csrf-token', authController.getCsrfToken);
router.get('/config', authController.getConfig);
router.post('/google', authLimiter, authController.googleLogin);

router.post('/register', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Institutional email required'),
    body('name').trim().escape().notEmpty(),
    body('password').isLength({ min: 8 }).withMessage('Minimum 8 characters required'),
    body('role').isIn(['student', 'faculty', 'expert', 'stakeholder']).optional()
  ],
  validate,
  authController.register
);

router.post('/login',
  authLimiter,
  loginSlowDown,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  validate,
  authController.login
);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
