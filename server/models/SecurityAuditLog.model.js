const mongoose = require('mongoose');

const securityAuditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  event: {
    type: String,
    enum: [
      'LOGIN_SUCCESS',
      'LOGIN_FAIL',
      'CSRF_VIOLATION',
      'RAFT_AUTH_FAIL',
      'SOCKET_UNAUTHORIZED',
      'TAMPER_DETECTED',
      'RATE_LIMIT_HIT',
      'PDF_EXPORT',
      'SYBIL_ATTEMPT'
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['info', 'warn', 'critical'],
    required: true,
    index: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

const SecurityAuditLog = mongoose.model('SecurityAuditLog', securityAuditLogSchema);

module.exports = SecurityAuditLog;
