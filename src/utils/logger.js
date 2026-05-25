const fs = require('fs');
const path = require('path');
const env = require('../config/env');

const logDir = path.join(__dirname, '..', '..', 'logs');
if (env.isDevelopment) {
  try {
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  } catch (e) { /* ignore */ }
}

const logFile = path.join(logDir, 'error.log');

function logError(type, error, req) {
  const timestamp = new Date().toISOString();
  const method = req ? `${req.method} ${req.originalUrl || req.url}` : '';
  const stack = error && error.stack ? error.stack : (error ? String(error) : 'Unknown error');
  const msg = `[${timestamp}] [${type}] ${method}\n${stack}\n`;

  // Always write to stderr
  process.stderr.write(msg);

  // Also write to log file in development
  if (env.isDevelopment) {
    try {
      fs.appendFileSync(logFile, msg);
    } catch (e) { /* ignore */ }
  }
}

module.exports = { logError };
