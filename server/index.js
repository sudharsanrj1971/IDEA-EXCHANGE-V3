const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const http = require('http');
const logger = require('./utils/logger');
const cron = require('./services/cron.service');
const globalErrorHandler = require('./middleware/error.middleware');
const { verifyCsrf } = require('./middleware/csrf.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { initFirebase } = require('./utils/firebase');

// ── Environment Variable Validation ──────────────────────────────────────────
// Firebase vars are FATAL — Firestore is core. All others log warnings.
const FIREBASE_REQUIRED = ['FIREBASE_PROJECT_ID', 'FIREBASE_SERVICE_ACCOUNT_KEY', 'FIREBASE_DATABASE_ID'];
const SOFT_REQUIRED = ['JWT_SECRET', 'REDIS_URL', 'GEMINI_API_KEY', 'OAUTH_GOOGLE_CLIENT_ID', 'OAUTH_GOOGLE_CLIENT_SECRET', 'MONGO_URI', 'PLATFORM_SIGNING_KEY'];

FIREBASE_REQUIRED.forEach(envVar => {
  if (!process.env[envVar]) {
    logger.error(`[FATAL] Missing required Firebase env var: ${envVar}. Cannot start without Firestore.`);
    process.exit(1);
  }
});

SOFT_REQUIRED.forEach(envVar => {
  if (!process.env[envVar]) {
    logger.warn(`[WARNING] Missing env var: ${envVar} — related features will be degraded or disabled.`);
  }
});

// Initialize Firebase Admin SDK (fails loudly if credentials are invalid)
initFirebase();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

/**
 * FIX 09: HELMET HARDENING
 * Implements strict CSP, HSTS, and referrer policies to block common web attacks.
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline allowed for UI libraries like Recharts
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://picsum.photos"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Trust Proxy for Cloud Run/Nginx IP attribution
app.set('trust proxy', 1);

// CORS configuration (Refuse wildcard in production)
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body Parsers (FIX 04: NoSQL Injection Prevention)
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize({ replaceWith: '_' })); // Strip $ and . keys
app.use(xss()); // Sanitize HTML in input strings
app.use(hpp()); // Prevent HTTP Parameter Pollution

// FIX 03: CSRF Double-Submit Verification (Mount BEFORE routes, AFTER cookieParser)
app.use(verifyCsrf);

// Global Rate Limiting
app.use('/api/', apiLimiter);

/**
 * API v1 Route Mounting
 */
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/projects', require('./routes/project.routes'));
app.use('/api/v1/contributions', require('./routes/contribution.routes'));
// Scoring, Governance, Ledger, etc.
app.use('/api/v1/scoring', require('./routes/scoring.routes'));
app.use('/api/v1/governance', require('./routes/governance.routes'));
app.use('/api/v1/ledger', require('./routes/ledger.routes'));
app.use('/api/v1/funding', require('./routes/funding.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));

/**
 * FIX 06: Internal RAFT Routes
 * Protected via RaftAuth middleware within the router file.
 */
app.use('/raft', require('./routes/raft.routes'));

// Global Error Handler
app.use(globalErrorHandler);

// ── Static Frontend Serving (Production) ─────────────────────────────────────
// `vite build` outputs to <project-root>/dist/
// The server bundle lives at <project-root>/dist/server.cjs
// So __dirname at runtime == <project-root>/dist/ — serve assets from there.
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname)));
  // Catch-all: return index.html for any non-API route (React Router SPA)
  app.get('*', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        logger.warn(`[STATIC] Could not send index.html: ${err.message}`);
        res.status(404).json({ error: 'Frontend not found. Did you run npm run build?' });
      }
    });
  });
}

// Socket.io Initialization (FIX 07: Secured)
const { initSocket } = require('./socket/index');
initSocket(server);

// Database & Server Start
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ideaxchange';
    await mongoose.connect(mongoUri);
    logger.info('[CORE] Database connection secured (Enterprise Edition).');
    
    // Initialize scheduled tasks (Ledger integrity sweeps)
    // Wrapped in try/catch — cron failures are non-fatal for demo deployments
    try {
      cron.init();
    } catch (cronErr) {
      logger.warn(`[CRON] Failed to initialize scheduled tasks: ${cronErr.message}. Continuing without cron.`);
    }
    
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`[CORE] IdeaXchange Node (${process.env.NODE_ID || 'leader'}) live on port ${PORT}`);
    });
  } catch (err) {
    logger.error('[CORE] Critical startup failure:', err);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown Protocol
const shutdown = () => {
  logger.info('[SHUTDOWN] Terminating node services...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      logger.info('[SHUTDOWN] Connections drained. Exit status 0.');
      process.exit(0);
    });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
