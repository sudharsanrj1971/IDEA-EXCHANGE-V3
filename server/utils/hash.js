const crypto = require('crypto');

/**
 * Computes a deterministic HMAC-SHA256 hash for a contribution block.
 * Uses PLATFORM_SIGNING_KEY for integrity verification against external tampering.
 */
const hashBlock = (previousHash, userId, deltaData, timestamp) => {
  if (!process.env.PLATFORM_SIGNING_KEY) {
    throw new Error('CRITICAL: PLATFORM_SIGNING_KEY is missing from environment');
  }

  const hmac = crypto.createHmac('sha256', process.env.PLATFORM_SIGNING_KEY);
  // Order: userId -> deltaData -> timestamp -> previousHash
  const payload = userId + JSON.stringify(deltaData) + timestamp + previousHash;
  
  return hmac.update(payload).digest('hex');
};

/**
 * Verifies a block hash using constant-time comparison to prevent timing attacks.
 */
const verifyBlockHmac = (storedHash, previousHash, userId, deltaData, timestamp) => {
  const recomputed = hashBlock(previousHash, userId, deltaData, timestamp);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(storedHash),
      Buffer.from(recomputed)
    );
  } catch (err) {
    return false;
  }
};

module.exports = { hashBlock, verifyBlockHmac };
