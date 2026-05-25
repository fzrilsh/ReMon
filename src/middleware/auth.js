function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect(`${req.basePath}/auth/login`);
  }
  next();
}

function redirectIfAuthenticated(req, res, next) {
  if (req.session.user) {
    return res.redirect(`${req.basePath}/dashboard`);
  }
  next();
}

module.exports = { requireAuth, redirectIfAuthenticated };
