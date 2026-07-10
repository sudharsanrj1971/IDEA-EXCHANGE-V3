const winston = require('winston');
const path = require('path');

const transports = [];

// Add file transports in development, ensuring the directory exists
if (process.env.NODE_ENV !== 'production') {
  const fs = require('fs');
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    try { fs.mkdirSync(logDir, { recursive: true }); } catch (e) {}
  }
  
  transports.push(
    new winston.transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logDir, 'app.log') })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.json()
  ),
  transports
});

// Always log to console so Render/cloud platforms capture logs via stdout/stderr
logger.add(new winston.transports.Console({
  format: process.env.NODE_ENV !== 'production'
    ? winston.format.combine(winston.format.colorize(), winston.format.simple())
    : winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.simple())
}));

module.exports = logger;
