const logger = require('../server/utils/logger');
require('dotenv').config();

/**
 * FIX 10: PLATFORM INTEGRITY AUDIT
 * Validates critical environment variables and security secrets before allowing node startup.
 */
const runSecurityCheck = () => {
    const results = [];
    let failure = false;

    const check = (name, value, minLen = 32) => {
        if (!value) {
            results.push({ var: name, status: 'FAIL', reason: 'Missing value' });
            failure = true;
        } else if (value.length < minLen) {
            results.push({ var: name, status: 'WARN', reason: `Too short (<${minLen})` });
        } else {
            results.push({ var: name, status: 'PASS', reason: 'Valid' });
        }
    };

    logger.info('--- IDEA XCHANGE SECURITY INTEGRITY AUDIT ---');

    check('PLATFORM_SIGNING_KEY', process.env.PLATFORM_SIGNING_KEY);
    check('RAFT_INTERNAL_SECRET', process.env.RAFT_INTERNAL_SECRET);
    check('JWT_SECRET', process.env.JWT_SECRET);
    
    // Check Environment
    if (!['production', 'development', 'test'].includes(process.env.NODE_ENV)) {
        results.push({ var: 'NODE_ENV', status: 'FAIL', reason: 'Invalid or missing' });
        failure = true;
    } else {
        results.push({ var: 'NODE_ENV', status: 'PASS', reason: process.env.NODE_ENV });
    }

    // Check CORS
    if (process.env.CORS_ORIGIN === '*') {
        results.push({ var: 'CORS_ORIGIN', status: 'WARN', reason: 'Wilcard origin detected' });
    }

    console.table(results);

    if (failure) {
        logger.error('CRITICAL: SECURE BOOT FAILED. System exiting to prevent compromise.');
        process.exit(1);
    } else {
        logger.info('SECURE BOOT PASS: IdeaXchange node initialized with hardened parameters.');
    }
};

runSecurityCheck();
