const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const RedisStore = require('rate-limit-redis').default;
const { createClient } = require('redis');
const { logSecurityEvent } = require('../utils/securityLogger');

let redisClient;
let createStore;

if (process.env.REDIS_URL) {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    
    redisClient.on('error', (err) => {
      console.warn(`[Redis] Rate Limiter error: ${err.message}`);
    });

    redisClient.connect().catch((err) => {
      console.warn(`[Redis] Rate Limiter connection failed: ${err.message}. Rate limiting may be degraded.`);
    });

    createStore = (prefix) => new RedisStore({
      prefix,
      sendCommand: (...args) => {
        if (!redisClient.isReady) {
          return Promise.resolve();
        }
        return redisClient.sendCommand(args);
      },
    });
  } catch (err) {
    console.warn(`[Redis] Setup failed: ${err.message}. Using memory store.`);
  }
}

const onLimitReached = (req, res, options) => {
  logSecurityEvent('RATE_LIMIT_HIT', 'warn', req.user?._id, req, { 
    path: req.path,
    limit: options.max 
  });
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later.'
  });
};

/**
 * Protects authentication endpoints (Login/Register).
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: createStore ? createStore('rl:auth:') : undefined,
  handler: onLimitReached
});

/**
 * Standard API limiter to prevent service exhaustion.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  store: createStore ? createStore('rl:api:') : undefined,
  handler: onLimitReached
});

/**
 * Protects expensive file export operations.
 */
const exportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: createStore ? createStore('rl:export:') : undefined,
  handler: onLimitReached
});

/**
 * Gradually slows down repeated login attempts to fight brute-force.
 */
const loginSlowDown = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 3,
  delayMs: (hits) => hits * 500, // 500ms, 1000ms, 1500ms...
});

module.exports = { authLimiter, apiLimiter, exportLimiter, loginSlowDown };
