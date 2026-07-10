const SecurityAuditLog = require('../models/SecurityAuditLog.model');
const logger = require('./logger');

/**
 * Unified Security Event Logger.
 * Persists to MongoDB for Admin UI and streams to Winston (stdout).
 *
 * @param {string} event       - Event type (e.g. 'LOGIN_FAIL', 'CSRF_VIOLATION')
 * @param {string} severity    - 'info' | 'warn' | 'critical'
 * @param {*}      userId      - Mongoose ObjectId or null for anonymous events
 * @param {Object} req         - Express request object OR a plain object with { ip, headers }
 * @param {Object} metadata    - Optional extra payload
 */
const logSecurityEvent = async (event, severity, userId, req, metadata = {}) => {
  // Safely extract IP — req may be a full Express req or a lightweight plain object
  // req.connection was removed in Node 18; use req.socket instead
  const ipAddress =
    (req && req.ip) ||
    (req && req.headers && req.headers['x-forwarded-for']) ||
    (req && req.socket && req.socket.remoteAddress) ||
    'unknown';

  const userAgent = (req && req.headers && req.headers['user-agent']) || 'unknown';

  try {
    // 1. Persist to DB
    await SecurityAuditLog.create({
      userId: userId || (req && req.user ? req.user._id : null),
      ipAddress,
      userAgent,
      event,
      severity,
      metadata
    });

    // 2. Stream to Winston (captured by Render log drain via stdout)
    const logMsg = `[SECURITY] [${severity.toUpperCase()}] ${event} | IP: ${ipAddress} | User: ${userId || 'anonymous'}`;
    if (severity === 'critical') {
      logger.error(logMsg, metadata);
    } else if (severity === 'warn') {
      logger.warn(logMsg, metadata);
    } else {
      logger.info(logMsg, metadata);
    }
  } catch (err) {
    // Never let audit log failures crash the request
    logger.error('[SECURITY] CRITICAL: Failed to write security audit log', { error: err.message });
  }
};

module.exports = { logSecurityEvent };
