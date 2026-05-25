const env = require('../config/env');

function errorHandler(err, req, res, next) {
  console.error('Unhandled error:', err);

  const statusCode = err.statusCode || 500;
  const message = env.isProduction ? 'Terjadi kesalahan internal' : err.message;

  if (req.path.startsWith('/api/')) {
    return res.status(statusCode).json({ error: message });
  }

  res.status(statusCode).render('error', {
    title: 'Error',
    message,
    error: env.isDevelopment ? err : {},
  });
}

module.exports = errorHandler;
