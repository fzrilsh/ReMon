const env = require('../config/env');
const { logError } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logError('HTTP_ERROR', err, req);

  const statusCode = err.statusCode || 500;
  const message = env.isProduction ? 'Terjadi kesalahan internal' : err.message;

  if (req.path.startsWith('/api/') || req.xhr) {
    return res.status(statusCode).json({ error: message });
  }

  res.status(statusCode).render('error', {
    title: statusCode === 404 ? 'Not Found' : 'Error',
    message,
    error: env.isDevelopment ? err : {},
  });
}

module.exports = errorHandler;
