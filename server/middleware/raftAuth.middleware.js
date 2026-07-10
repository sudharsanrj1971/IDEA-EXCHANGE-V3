const crypto = require('crypto');
const { logSecurityEvent } = require('../utils/securityLogger');

/**
 * Ensures Raft inter-node RPCs are authenticated via a pre-shared internal secret.
 */
const raftAuth = (req, res, next) => {
  const incomingSecret = req.headers['x-raft-secret'];
  const internalSecret = process.env.RAFT_INTERNAL_SECRET;

  if (!internalSecret) {
    return res.status(500).json({ success: false, message: 'Raft configuration error' });
  }

  if (!incomingSecret) {
    logSecurityEvent('RAFT_AUTH_FAIL', 'warn', null, req, { reason: 'Missing secret' });
    return res.status(401).json({ success: false, message: 'Unauthorized Raft peer' });
  }

  try {
    const isMatched = crypto.timingSafeEqual(
      Buffer.from(incomingSecret),
      Buffer.from(internalSecret)
    );

    if (!isMatched) {
      logSecurityEvent('RAFT_AUTH_FAIL', 'critical', null, req, { reason: 'Secret mismatch' });
      return res.status(401).json({ success: false, message: 'Forbidden Raft peer' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false });
  }
};

module.exports = raftAuth;
