const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const logger = require('./logger');

let db;

/**
 * Initializes Firebase Admin SDK using service account credentials from env vars.
 * Uses the modern firebase-admin/app modular API (firebase-admin v12+).
 * Fails loudly (process.exit) if Firebase config is missing or malformed,
 * since Firestore is core to the app.
 */
const initFirebase = () => {
  const { FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT_KEY, FIREBASE_DATABASE_ID } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_SERVICE_ACCOUNT_KEY || !FIREBASE_DATABASE_ID) {
    const missing = [];
    if (!FIREBASE_PROJECT_ID) missing.push('FIREBASE_PROJECT_ID');
    if (!FIREBASE_SERVICE_ACCOUNT_KEY) missing.push('FIREBASE_SERVICE_ACCOUNT_KEY');
    if (!FIREBASE_DATABASE_ID) missing.push('FIREBASE_DATABASE_ID');
    
    if (process.env.NODE_ENV === 'production' && process.env.LOCAL_DEMO !== 'true') {
      logger.error(`[FATAL] Missing critical Firebase env vars: ${missing.join(', ')}`);
      process.exit(1);
    } else {
      logger.warn(`[WARNING] Missing critical Firebase env vars: ${missing.join(', ')} — skipping initialization.`);
      return;
    }
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT_KEY);
  } catch (err) {
    if (process.env.NODE_ENV === 'production' && process.env.LOCAL_DEMO !== 'true') {
      logger.error(`[FATAL] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON: ${err.message}`);
      process.exit(1);
    } else {
      logger.warn(`[WARNING] FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON: ${err.message} — skipping initialization.`);
      return;
    }
  }

  try {
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: FIREBASE_PROJECT_ID,
    });

    const dbId = FIREBASE_DATABASE_ID && FIREBASE_DATABASE_ID !== '(default)'
      ? FIREBASE_DATABASE_ID
      : undefined;

    db = dbId ? getFirestore(app, dbId) : getFirestore(app);

    logger.info(
      `[CORE] Firebase Admin SDK initialized. Project: ${FIREBASE_PROJECT_ID}, DB: ${FIREBASE_DATABASE_ID}`
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'production' && process.env.LOCAL_DEMO !== 'true') {
      logger.error(`[FATAL] Firebase Admin initialization failed: ${error.message}`);
      process.exit(1);
    } else {
      logger.warn(`[WARNING] Firebase Admin initialization failed: ${error.message} — running in degraded mode.`);
    }
  }
};

/**
 * Returns the initialized Firestore instance.
 * Must call initFirebase() before using this.
 */
const getDb = () => {
  if (!db) throw new Error('Firebase not initialized. Call initFirebase() first.');
  return db;
};

module.exports = { initFirebase, getDb };
