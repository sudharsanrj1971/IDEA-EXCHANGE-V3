const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { success, error } = require('../utils/apiResponse');
const { logSecurityEvent } = require('../utils/securityLogger');
const { setCsrfCookie } = require('../middleware/csrf.middleware');
const logger = require('../utils/logger');

/**
 * Signs JWT Tokens.
 */
const signTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

/**
 * Sets secure httpOnly cookies.
 */
const setAuthCookies = (res, tokens) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict'
  };

  res.cookie('accessToken', tokens.accessToken, { 
    ...cookieOptions, 
    maxAge: 15 * 60 * 1000 // 15 min 
  });
  
  res.cookie('refreshToken', tokens.refreshToken, { 
    ...cookieOptions, 
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh' // Restrict path for token rotation
  });
};

exports.register = async (req, res) => {
  try {
    const { email, name, studentId, department, batchYear, role, password } = req.body;

    const existingUser = await User.findOne({ institutionalEmail: email });
    if (existingUser) return error(res, 'Institutional identity already exists', 409);

    const user = await User.create({
      name,
      institutionalEmail: email,
      studentId,
      department,
      batchYear,
      role: role || 'student',
      password
    });

    user.password = undefined;
    success(res, { user }, 201);
  } catch (err) {
    error(res, 'Registration failed', 500);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ institutionalEmail: email }).select('+password');
    if (!user || !(await user.comparePassword(password, user.password))) {
      await logSecurityEvent('LOGIN_FAIL', 'warn', null, req, { email });
      return error(res, 'Invalid credentials', 401);
    }

    if (user.isBanned) {
      await logSecurityEvent('SYBIL_ATTEMPT', 'critical', user._id, req, { reason: 'Banned user login' });
      return error(res, 'Account suspended for platform integrity violations', 403);
    }

    const tokens = signTokens(user._id);
    setAuthCookies(res, tokens);
    setCsrfCookie(res); // Regenerate CSRF on login

    user.password = undefined;
    await logSecurityEvent('LOGIN_SUCCESS', 'info', user._id, req);
    
    success(res, { user });
  } catch (err) {
    error(res, 'Authentication engine failure', 500);
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return error(res, 'Refresh session expired', 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.isBanned) return error(res, 'Session invalid', 401);

    const tokens = signTokens(user._id);
    setAuthCookies(res, tokens);
    
    success(res, { message: 'Session extended' });
  } catch (err) {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    error(res, 'Invalid session', 401);
  }
};

exports.logout = (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('csrf-token');
  success(res, { message: 'Secure logout completed' });
};

exports.getCsrfToken = (req, res) => {
  const token = setCsrfCookie(res);
  success(res, { csrfToken: token });
};

exports.getConfig = (req, res) => {
  success(res, { googleClientId: process.env.OAUTH_GOOGLE_CLIENT_ID || '' });
};

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) return error(res, 'Google credential token is required', 400);

    const response = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    const { email, name, picture } = response.data;

    if (!email) return error(res, 'Invalid Google token', 400);

    let user = await User.findOne({ institutionalEmail: email });
    if (!user) {
      // Create user if not exists
      // Google sign-in doesn't have a password, so we generate a random one to satisfy model validation
      const crypto = require('crypto');
      const tempPassword = crypto.randomBytes(16).toString('hex');
      user = await User.create({
        name,
        institutionalEmail: email,
        password: tempPassword,
        role: 'student', // Default role
        isActive: true
      });
    }

    if (user.isBanned) {
      await logSecurityEvent('SYBIL_ATTEMPT', 'critical', user._id, req, { reason: 'Banned user Google login' });
      return error(res, 'Account suspended for platform integrity violations', 403);
    }

    const tokens = signTokens(user._id);
    setAuthCookies(res, tokens);
    setCsrfCookie(res); // Regenerate CSRF on login

    user.password = undefined;
    await logSecurityEvent('LOGIN_SUCCESS', 'info', user._id, req, { method: 'google' });
    
    success(res, { user });
  } catch (err) {
    logger.error('Google login error:', err);
    error(res, 'Google authentication failed', 500);
  }
};
