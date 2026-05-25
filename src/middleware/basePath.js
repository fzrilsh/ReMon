const env = require('../config/env');

function basePathMiddleware(req, res, next) {
  res.locals.basePath = env.appBasePath;
  req.basePath = env.appBasePath;
  next();
}

module.exports = basePathMiddleware;
