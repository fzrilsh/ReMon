function basePathMiddleware(req, res, next) {
  res.locals.basePath = req.basePath;
  next();
}

module.exports = basePathMiddleware;
